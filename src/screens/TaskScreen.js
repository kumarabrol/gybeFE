import React, { useState, useEffect, useCallback } from 'react';
import { Text, StyleSheet, View, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';

const TaskScreen = ({ navigation, route }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const fetchTasks = useCallback(async () => {
    try {
      const response = await axios.get('http://gybeapis-v32.westus.azurecontainer.io/api/Assignment/Assignments/1');
      const fetchedTasks = response.data.map(task => ({
        id: task.assignmentId,
        title: task.assignmentInstructions,
        completed: task.assignmentStatus === 3, // Assuming 3 represents a completed task
      }));
      console.log('Fetched tasks:', fetchedTasks);
      setTasks(fetchedTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
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
              ? { ...task, completed: true } 
              : task
          )
        );
        setSelectedTaskId(null);
      }
    }, [route.params?.completedTaskId])
  );

  const handleTaskPress = (taskId) => {
    if (!tasks.find(task => task.id === taskId).completed) {
      setSelectedTaskId(taskId);
    }
  };

  const handleStartPress = () => {
    if (selectedTaskId) {
      navigation.navigate('TaskDetail', { taskId: selectedTaskId });
    }
  };

  const renderTask = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.taskItem, 
        item.completed && styles.completedTaskItem,
        item.id === selectedTaskId && styles.selectedTaskItem
      ]}
      onPress={() => handleTaskPress(item.id)}
      disabled={item.completed}
    >
      <Text style={[
        styles.taskTitle, 
        item.completed && styles.completedTaskTitle
      ]}>
        {item.title}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#ffcc00" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.greetingBox}>
        <Text style={styles.greeting}>Hi Terry!</Text>
        <Text style={styles.QueueTxt}>Today's job queue:</Text>
      </View>
      <FlatList
        style={styles.tasksWrapper}
        data={tasks}
        renderItem={renderTask}
        keyExtractor={item => item.id.toString()}
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
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#000"
  },
  greetingBox: {
    justifyContent: "center",
    alignItems: "center",
    width: '100%',
    height: 120,
    marginBottom: 20,
    backgroundColor: "#CAC3C3", 
  },
  greeting: {
    fontStyle: "normal",
    fontWeight: "bold",
    fontSize: 20,
    textAlign: "center",
  },
  QueueTxt: {
    marginTop: 10,
    fontFamily: 'Jomhuria-Regular', 
    fontStyle: "normal",
    fontWeight: "bold",
    fontSize: 25,
  },
  tasksWrapper:{
    flex: 1,
    width: "100%",
  },
  taskItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  completedTaskItem: {
    backgroundColor: '#222',
  },
  selectedTaskItem: {
    backgroundColor: '#333',
  },
  taskTitle: {
    fontSize: 18,
    color: "white",
  },
  completedTaskTitle: {
    color: "grey",
    textDecorationLine: 'line-through',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  backButton: {
    flex: 1,
    padding: 15,
    backgroundColor: "#ccc",
    alignItems: 'center',
    marginRight: 10,
  },
  startButton: {
    flex: 1,
    padding: 15,
    backgroundColor: "#ffcc00",
    alignItems: 'center',
    marginLeft: 10,
  },
  disabledButton: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: "#000",
    fontWeight: 'bold',
  },
});

export default TaskScreen;