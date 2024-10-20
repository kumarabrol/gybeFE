import React, { useState, useEffect, useCallback } from 'react';
import { Text, StyleSheet, View, TouchableOpacity, ActivityIndicator, FlatList, ScrollView, Image } from 'react-native';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import { TbArrowBarDown } from "react-icons/tb";

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
      isSelected && styles.selectedAssignmentItem
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);
  
  const fetchAssignments = useCallback(async () => {
    try {
      const response = await axios.get('https://gbapidev.yellowmushroom-4d501d6c.westus.azurecontainerapps.io/api/Assignment/Assignments/1');
      console.log('Raw API response:', JSON.stringify(response.data, null, 2));
      
      const fetchedAssignments = response.data.map(assignment => ({
        id: assignment.assignmentId.toString(),
        instructions: assignment.assignmentInstructions,
        status: assignment.assignmentStatus,
        startDate: new Date(assignment.assignmentStartDate),
        endDate: new Date(assignment.assignmentEndDate),
        assignmentType: assignment.assignmentType,
        name: assignment.name,
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

  // const CheckDeviceHealth = async () => {
  //   const urlDeviceHealthCheck = 'https://gbapidev.yellowmushroom-4d501d6c.westus.azurecontainerapps.io/api/DeviceHealth';
  //   var token = 'eyJhbGciOiJSUzI1NiIsImtpZCI6Ilg1ZVhrNHh5b2pORnVtMWtsMll0djhkbE5QNC1jNTdkTzZRR1RWQndhTmsiLCJ0eXAiOiJKV1QifQ.eyJhdWQiOiI4OGJlZDI3ZC04NzAyLTQ5ZTAtODM2YS0xYjg2MDYwMzBkOWYiLCJpc3MiOiJodHRwczovL2d5YmViMmNkZXYuYjJjbG9naW4uY29tL2UwYzIxMDRjLTZlYmQtNDNjZi05MWRmLWY5NjBmMjcxYzljOC92Mi4wLyIsImV4cCI6MTcyOTEzODQ5OSwibmJmIjoxNzI5MTM0ODk5LCJvaWQiOiI2NTJkZDNiNi00M2VjLTQxZWItODhhMy04OWE3ZjE0ODVlODYiLCJzdWIiOiI2NTJkZDNiNi00M2VjLTQxZWItODhhMy04OWE3ZjE0ODVlODYiLCJnaXZlbl9uYW1lIjoiVXNlciIsImZhbWlseV9uYW1lIjoiVHdvIiwiZW1haWxzIjpbInVzZXIyQGd5YmUuY28iXSwidGZwIjoiQjJDXzFfc2lnbnVwc2lnbmluMSIsInNjcCI6InJlc291cmNlcyIsImF6cCI6ImVkYjYxN2ViLWRjZTgtNDU0YS1hMTIwLTM5MGI5ZGEwMDk2ZiIsInZlciI6IjEuMCIsImlhdCI6MTcyOTEzNDg5OX0.DbW9oAxYvpRX4VICbm_xAzraFrdhLYRM5LTdqRRM-nGT3f55W0EedcBNNMuUGqrtESbx9AQCrOAhdVe1P_X8B0M_uqpblQpAsCfV1EpkFJ67NhRiDt58HYw4VnosbgS8uLJWx068qDwzzN2w5N_qR-XhhgoS0wp8pjMk9bOnDC44cLehTo2rNJjFQ7b52Nmhe2zNwWf4kclbbN3XH0u1OOPmGuswQgvn-3p8iSq-voxf6f7F7BqFOEIFtg7x1IFL8cdPmn5Kj7gxdWDFAyXu7wS2WiHQeKnP-rLgvh0QFB0bH9OiyhSSNj9Rex4mhnGpTViz4VIwg5oHedAxiOihtw';
  //   var bearer = `Bearer ${token}`;
  //   axios.get(urlDeviceHealthCheck, { headers: {'Authorization': bearer }}).then((response) => {
  //     console.log('Device Health Check:', response.data);
  //   }).catch((error) => {
  //       console.error('Error checking device health:', error);
  //   });
  // };

  useEffect(() => {
    fetchAssignments();

    console.log('Checking device health now...');
    // CheckDeviceHealth();
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

  // const handleAssignmentPress = (assignmentId) => {
  //   if (assignments.find(assignment => assignment.id === assignmentId).status !== 3) {
  //     setSelectedAssignmentId(assignmentId);
  //   }
  // };

  const handleStartPress = (assignmentId) => {
    const selectedAssignment = assignments.find(assignment => assignment.id === assignmentId);

    if (selectedAssignment) {
      setSelectedAssignmentId(assignmentId);
      navigation.navigate('Task', {
        assignmentId: assignmentId,
        instructions: selectedAssignment.instructions,
      });
    }
  };

  /*const handleStartPress = (assignmentId) => {
    if (selectedAssignmentId) {
      const selectedAssignment = assignments.find(assignment => assignment.id === selectedAssignmentId);
      navigation.navigate('Task', {
        assignmentId: selectedAssignmentId,
        instructions: selectedAssignment.instructions,
      });

    }


    if (assignments.find(assignment => assignment.id === assignmentId).status !== 3) {
      setSelectedAssignmentId(assignmentId);
    }
  };*/

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
        <Text style={styles.queueText}>Pending Assignments are:</Text>
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
  selectedAssignmentItem: {
    backgroundColor: '#333',
    borderColor: '#ffcc00',
    borderWidth: 2,
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
});

export default TaskScreen;