import React, { useState, useEffect, useCallback } from 'react';
import { Text, StyleSheet, View, TouchableOpacity, ActivityIndicator, FlatList,ScrollView  } from 'react-native';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';

const TaskScreen = ({ navigation, route }) => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);
  
  const fetchAssignments = useCallback(async () => {
    try {
      const response = await axios.get('https://gbapiks.lemonriver-6b83669d.australiaeast.azurecontainerapps.io/api/Assignment/Assignments/1');
      console.log('Raw API response:', JSON.stringify(response.data, null, 2));
      
      const fetchedAssignments = response.data.map(assignment => ({
        id: assignment.assignmentId.toString(),
        instructions: assignment.assignmentInstructions,
        status: assignment.assignmentStatus,
        startDate: new Date(assignment.assignmentStartDate),
        endDate: new Date(assignment.assignmentEndDate),
      }));
      
      console.log('Processed assignments:', JSON.stringify(fetchedAssignments, null, 2));
      setAssignments(fetchedAssignments);
      setError(null);
    } catch (error) {
      console.error('Error fetching assignments:', error.stack);
      setError(error.stack);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  useFocusEffect(
    useCallback(() => {
      console.log('Screen focused. Route params:', route.params);
      if (route.params?.completedAssignmentId) {
        console.log('Completed assignment ID received:', route.params.completedAssignmentId);
        setAssignments(prevAssignments => 
          prevAssignments.map(assignment => 
            assignment.id === route.params.completedAssignmentId.toString() 
              ? { ...assignment, status: 3 } // Assuming 3 represents a completed assignment
              : assignment
          )
        );
        setSelectedAssignmentId(null);
      }
    }, [route.params?.completedAssignmentId])
  );

  const handleAssignmentPress = (assignmentId) => {
    if (assignments.find(assignment => assignment.id === assignmentId).status !== 3) {
      setSelectedAssignmentId(assignmentId);
    }
  };

  const handleStartPress = () => {
    if (selectedAssignmentId) {
      const selectedAssignment = assignments.find(assignment => assignment.id === selectedAssignmentId);
      navigation.navigate('Detail', { 
        assignmentId: selectedAssignmentId,
        instructions: selectedAssignment.instructions,
      });
    }
  };

  const renderAssignment = ({ item }) => {
    console.log('Rendering assignment:', JSON.stringify(item, null, 2));
    return (
      <TouchableOpacity
        style={[
          styles.assignmentItem, 
          item.status === 3 && styles.completedAssignmentItem,
          item.id === selectedAssignmentId && styles.selectedAssignmentItem
        ]}
        onPress={() => handleAssignmentPress(item.id)}
        disabled={item.status === 3}
      >
        <Text style={[
          styles.assignmentInstructions, 
          item.status === 3 && styles.completedAssignmentInstructions
        ]}>
          {item.instructions || 'No instructions available'}
        </Text>

      </TouchableOpacity>
    );
  };

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
        <Text style={styles.errorText}>{error.message}</Text>
        <View style={styles.errorDetailsContainer}>
          <Text style={styles.errorDetailsTitle}>Error Details:</Text>
          <Text style={styles.errorDetailsText}>{error}</Text>
        </View>
        {error.stack && (
          <View style={styles.errorStackContainer}>
            <Text style={styles.errorStackTitle}>Error Stack Trace:</Text>
            <Text style={styles.errorStackText}>{error.stack}</Text>
          </View>
        )}
        <TouchableOpacity style={styles.retryButton} onPress={fetchAssignments}>
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.greetingBox}>
        <Text style={styles.greeting}>Hi Terry!</Text>
        <Text style={styles.QueueTxt}>Today's job queue:</Text>
      </View>
      <FlatList
        style={styles.assignmentsWrapper}
        data={assignments}
        renderItem={renderAssignment}
        keyExtractor={item => item.id}
      />
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>BACK</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.startButton, !selectedAssignmentId && styles.disabledButton]} 
          onPress={handleStartPress}
          disabled={!selectedAssignmentId}
        >
          <Text style={styles.buttonText}>START</Text>
        </TouchableOpacity>
      </View>
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
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  completedAssignmentItem: {
    backgroundColor: '#2a2a2a',
    opacity: 0.7,
  },
  selectedAssignmentItem: {
    backgroundColor: '#333',
    borderColor: '#ffcc00',
    borderWidth: 2,
  },
  assignmentInstructions: {
    fontSize: 16,
    color: 'white',
    marginBottom: 5,
  },
  completedAssignmentInstructions: {
    color: '#888',
    textDecorationLine: 'line-through',
  },
  assignmentDates: {
    fontSize: 12,
    color: '#888',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
});

export default TaskScreen;