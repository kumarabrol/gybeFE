// src/screens/TaskScreen.js
import React, { useState } from 'react';
import { Text, StyleSheet, View, TouchableOpacity, Switch } from 'react-native';

const TaskScreen = ({ navigation }) => {
  const [tasks, setTasks] = useState([
    { id: 1, title: "Review Bill of Materials", completed: false },
    { id: 2, title: "Assemble electronics components", completed: false },
    { id: 3, title: "Run validation testing", completed: false },
    { id: 4, title: "Perform Final QA", completed: false },
  ]);

  const toggleTask = (taskId) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Hi Terry!</Text>
      <Text style={styles.queue}>Today's job queue:</Text>
      {tasks.map(task => (
        <View key={task.id} style={styles.taskContainer}>
          <Switch
            value={task.completed}
            onValueChange={() => toggleTask(task.id)}
            thumbColor={task.completed ? '#ffcc00' : '#ccc'}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
          />
          <Text style={styles.taskTitle}>{task.title}</Text>
        </View>
      ))}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>BACK</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.startButton}>
          <Text style={styles.startText}>START</Text>
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
    backgroundColor: "#000033",
  },
  greeting: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 10,
  },
  queue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    marginBottom: 20,
  },
  taskContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  taskTitle: {
    fontSize: 18,
    color: "white",
    marginLeft: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    marginTop: 20,
  },
  backButton: {
    flex: 1,
    padding: 15,
    backgroundColor: "#333",
    alignItems: "center",
    marginRight: 10,
    borderRadius: 5,
  },
  startButton: {
    flex: 1,
    padding: 15,
    backgroundColor: "#ffcc00",
    alignItems: "center",
    borderRadius: 5,
  },
  backText: {
    color: "white",
    fontSize: 18,
  },
  startText: {
    color: "#000033",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default TaskScreen;
