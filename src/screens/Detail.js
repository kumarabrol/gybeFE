import React, { useState, useEffect, useCallback } from 'react';
import { Text, StyleSheet, View, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';

const DetailScreen = ({ navigation, route }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  
  const fetchTasks = useCallback(async () => {
    try {
      const response = await axios.get('http://gybeapis-v36.westus.azurecontainer.io/api/Assignment/AssignmentTasksNew/16');
      console.log('Raw API response:', JSON.stringify(response.data, null, 2));
      
      const fetchedTasks = response.data.tasks.map(task => ({
        id: task.inputFormTaskID.toString(),
        name: task.name,
        status: 0, // Assuming 0 represents an uncompleted task
        fields: task.fields,
      }));
      
      console.log('Processed tasks:', JSON.stringify(fetchedTasks, null, 2));
      setTasks(fetchedTasks);
      setError(null);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError('Failed to fetch tasks. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useFocusEffect(
    useCallback(() => {
      console.log('Screen focused. Route params:', route.params);
      if (route.params?.completedTaskId) {
        console.log('Completed task ID received:', route.params.completedTaskId);
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === route.params.completedTaskId
              ? { ...task, status: 3 } // Assuming 3 represents a completed task
              : task
          )
        );
        setSelectedTaskId(null);
      }
    }, [route.params?.completedTaskId])
  );

  const handleTaskPress = (taskId) => {
    if (tasks.find(task => task.id === taskId).status !== 3) {
      setSelectedTaskId(taskId);
    }
  };

  const handleStartPress = () => {
    if (selectedTaskId) {
      const selectedTask = tasks.find(task => task.id === selectedTaskId);
      navigation.navigate('TaskDetail', { 
        taskId: selectedTaskId,
        fields: selectedTask.fields,
      });
    }
  };

  

  const renderTask = ({ item }) => {
    console.log('Rendering task:', JSON.stringify(item, null, 2));
    return (
      <TouchableOpacity
        style={[
          styles.taskItem, 
          item.status === 3 && styles.completedTaskItem,
          item.id === selectedTaskId && styles.selectedTaskItem
        ]}
        onPress={() => handleTaskPress(item.id)}
        disabled={item.status === 3}
      >
        <Text style={[
          styles.taskName, 
          item.status === 3 && styles.completedTaskName
        ]}>
          {item.name}
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
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.greetingBox}>
        <Text style={styles.greeting}>Hi Terry!</Text>
        <Text style={styles.queueText}>Today's task queue:</Text>
      </View>
      <FlatList
        style={styles.tasksWrapper}
        data={tasks}
        renderItem={renderTask}
        keyExtractor={item => item.id}
      />
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>BACK</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.startButton, !selectedTaskId && styles.disabledButton]} 
          onPress={handleStartPress}
          disabled={!selectedTaskId}
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
  tasksWrapper: {
    flex: 1,
  },
  taskItem: {
    backgroundColor: '#1c1c1c',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  completedTaskItem: {
    backgroundColor: '#2a2a2a',
    opacity: 0.7,
  },
  selectedTaskItem: {
    backgroundColor: '#333',
    borderColor: '#ffcc00',
    borderWidth: 2,
  },
  taskName: {
    fontSize: 16,
    color: 'white',
  },
  completedTaskName: {
    color: '#888',
    textDecorationLine: 'line-through',
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
});

export default DetailScreen;