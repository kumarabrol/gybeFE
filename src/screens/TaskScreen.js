import React, { useState, useEffect, useCallback } from 'react';
import { Text, StyleSheet, View, TouchableOpacity, ActivityIndicator, FlatList, ScrollView, Image } from 'react-native';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import { TbArrowBarDown } from "react-icons/tb";
import {AsyncStorage} from 'react-native';


const AssignmentTypeIcon = ({ type }) => {
  let iconSource;
  switch (type) {
    case 0: // Checklist
      iconSource = require('./assets/checklist.jpg');
      break;
    case 1: // Instructions
    iconSource = require('./assets/instructions.png');
    break;
  case 2: // Alert
    iconSource = require('./assets/alert.png');
    break;
  case 3: // Ticket
    iconSource = require('./assets/ticket.png');
    break;
  }
  return <Image source={iconSource} style={styles.assignmentIcon} />;
};

const AssignmentItem = ({ item, onPress, isSelected, isCompleted }) => (
  <TouchableOpacity
    style={[
      styles.assignmentItem, 
      isCompleted && styles.completedAssignmentItem,
      isSelected 
    ]}
    onPress={onPress}
    disabled={isCompleted}
  >
    <View style={styles.assignmentContent}>
      <AssignmentTypeIcon type={item.assignmentType} />
      <View style={styles.assignmentTextContainer}>
        <Text style={[
          styles.assignmentInstructions, 
          isCompleted && styles.completedAssignmentInstructions
        ]}>
          {item.instructions || 'No instructions available'}
        </Text>
        <Text style={styles.assignmentName}>{item.name}</Text>
      </View>
    </View>
  </TouchableOpacity>
);

const TaskScreen = ({ navigation, route }) => {
  const [assignments, setAssignments] = useState([]);
  const [detailedAssignments, setDetailedAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);
  const [isOnline, setIsOnline] = useState(true);

  const toggleConnection = () => setIsOnline(!isOnline);

  const saveDataToStorage = async (key, data) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving data to storage:', error);
    }
  };

  const getDataFromStorage = async (key) => {
    try {
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting data from storage:', error);
      return null;
    }
  };

  const fetchDetailedAssignment = useCallback(async (assignmentId) => {
    if (!isOnline) {
      const storedData = await getDataFromStorage(`detailedAssignment_${assignmentId}`);
      if (storedData) return storedData;
      throw new Error('No stored data available for this assignment');
    }

    try {
      const response = await axios.get(`https://gbapidev.yellowmushroom-4d501d6c.westus.azurecontainerapps.io/api/Assignment/AssignmentTasksNew/${assignmentId}`);
      // console.log(`Detailed assignment data for ID ${assignmentId}:`, JSON.stringify(response.data, null, 2));
      await saveDataToStorage(`detailedAssignment_${assignmentId}`, response.data);
      return response.data;
    } catch (error) {
      console.error(`Error fetching detailed assignment for ID ${assignmentId}:`, error.stack);
      throw error;
    }
  }, [isOnline]);

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    try {
      let fetchedAssignments;
      let fetchedDetailedAssignments;

      if (isOnline) {
        const response = await axios.get('https://gbapidev.yellowmushroom-4d501d6c.westus.azurecontainerapps.io/api/Assignment/Assignments/1');
        // console.log('Raw API response:', JSON.stringify(response.data, null, 2));
        
        fetchedAssignments = response.data.map(assignment => ({
          id: assignment.assignmentId.toString(),
          instructions: assignment.assignmentInstructions,
          status: assignment.assignmentStatus,
          startDate: new Date(assignment.assignmentStartDate),
          endDate: new Date(assignment.assignmentEndDate),
          assignmentType: assignment.assignmentType,
          name: assignment.name,
        }));
        
        await saveDataToStorage('assignments', fetchedAssignments);

        // Fetch detailed data for each assignment
        fetchedDetailedAssignments = await Promise.all(
          fetchedAssignments.map(assignment => fetchDetailedAssignment(assignment.id))
        );

        // Save all detailed assignments data
        await saveDataToStorage('detailedAssignments', fetchedDetailedAssignments);
      } else {
        fetchedAssignments = await getDataFromStorage('assignments');
        fetchedDetailedAssignments = await getDataFromStorage('detailedAssignments');
        if (!fetchedAssignments || !fetchedDetailedAssignments) {
          throw new Error('No stored assignments or detailed data available');
        }
      }
      
      // console.log('Processed assignments:', JSON.stringify(fetchedAssignments, null, 2));
      setAssignments(fetchedAssignments);
      
      // console.log('All detailed assignment data:', JSON.stringify(fetchedDetailedAssignments, null, 2));
      setDetailedAssignments(fetchedDetailedAssignments);
      
      setError(null);
    } catch (error) {
      console.error('Error fetching assignments:', error.stack);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [fetchDetailedAssignment, isOnline]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments, isOnline]);

  const handleStartPress = useCallback((assignmentId) => {
    const selectedAssignment = assignments.find(assignment => assignment.id === assignmentId);
    const detailedData = detailedAssignments.find(detail => detail.assignmentId.toString() === assignmentId);
    
    if (selectedAssignment && detailedData) {
      setSelectedAssignmentId(assignmentId);
      // console.log('Selected detailed assignment data:', JSON.stringify(detailedData, null, 2));
      
      navigation.navigate('Task', {
        assignmentId: assignmentId,
        instructions: selectedAssignment.instructions,
        type: selectedAssignment.assignmentType,
        detailedData: detailedData
      });
    }
  }, [assignments, detailedAssignments, navigation]);

  const renderAssignment = ({ item }) => (
    <AssignmentItem
      item={item}
      onPress={() => handleStartPress(item.id)}
      isSelected={item.id === selectedAssignmentId}
      isCompleted={item.status === 3}
    />
  );


  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#ffcc00" />
      </View>
    );
  }

  if (error) {
    console.error('Error rendering screen:', error);
    return (
      <ScrollView style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchAssignments}>
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.greetingBox}>
          <Text style={styles.greeting}>Hi Terry!</Text>
          <Text style={styles.queueText}>Pending Assignments are:</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            { backgroundColor: isOnline ? '#4CAF50' : '#F44336' }
          ]}
          onPress={toggleConnection}
        >
          <Text style={styles.toggleButtonText}>
            {isOnline ? 'Go Offline' : 'Go Online'}
          </Text>
        </TouchableOpacity>
      </View>
      <FlatList
        style={styles.assignmentsWrapper}
        data={assignments}
        renderItem={renderAssignment}
        keyExtractor={item => item.id}
      />
    </View>
  );
};




const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
  },
  greetingBox: {
    backgroundColor: '#CAC3C3',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  queueText: {
    fontSize: 18,
    fontWeight: '500',
  },
  assignmentsWrapper: {
    flex: 1,
  },
  assignmentItem: {
    backgroundColor: '#1c1c1c',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  completedAssignmentItem: {
    backgroundColor: '#2a2a2a',
    opacity: 0.7,
  },

  assignmentContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assignmentTextContainer: {
    flex: 1,
  },
  assignmentInstructions: {
    marginTop: 15,
    fontSize: 18,
    color: 'white',
    marginLeft: 10,
  },
  completedAssignmentInstructions: {
    color: '#888',
    textDecorationLine: 'line-through',
  },
  assignmentName: {
    fontSize: 14,
    color: '#888',

  },
  assignmentIcon: {
    width: 25,
    height: 22,
    marginRight: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  backButton: {
    flex: 1,
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 8,
    marginRight: 10,
    alignItems: 'center',
  },
  startButton: {
    flex: 1,
    backgroundColor: '#ffcc00',
    padding: 15,
    borderRadius: 8,
    marginLeft: 10,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#666',
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  errorDetailsContainer: {
    backgroundColor: '#1c1c1c',
    padding: 10,
    borderRadius: 8,
    marginTop: 20,
  },
  errorDetailsTitle: {
    color: '#ffcc00',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  errorDetailsText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  errorStackContainer: {
    backgroundColor: '#1c1c1c',
    padding: 10,
    borderRadius: 8,
    marginTop: 20,
  },
  errorStackTitle: {
    color: '#ffcc00',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  errorStackText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  retryButton: {
    backgroundColor: '#ffcc00',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  toggleButton: {
    padding: 10,
    borderRadius: 5,
    minWidth: 100,
    alignItems: 'center',
  },
  toggleButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default TaskScreen;