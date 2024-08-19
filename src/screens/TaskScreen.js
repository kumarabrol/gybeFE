import React, { useState, useEffect } from 'react';
import { Text, StyleSheet, View, TouchableOpacity, Switch, ActivityIndicator } from 'react-native';
import { CheckBox } from 'react-native-elements';
import axios from 'axios';

const TaskScreen = ({ navigation }) => {
  const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const fetchTasks = async () => {
        try {
          const response = await axios.get('http://gybeapis-v31.westus.azurecontainer.io/api/assignment/assignments/1');
          const fetchedTasks = response.data.map(task => ({
            id: task.assignmentId,
            title: task.assignmentInstructions,
            completed: task.assignmentStatus === 3, // Assuming 3 represents a completed task
          }));
          setTasks(fetchedTasks);
        } catch (error) {
          console.error('Error fetching tasks:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchTasks();
    }, []);

  const toggleTask = (taskId) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

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
        <Text style={styles.QueueTxt}>Today’s job queue:</Text>
      </View>
      <View style={styles.tasksWrapper}>
      {tasks.map(task => (
        <View key={task.id} style={styles.taskContainer}>
          <CheckBox
            checked={task.completed}
            onPress={() => toggleTask(task.id)}
            checkedColor="#ffcc00"
            uncheckedColor="#ccc"
          />
          <Text style={styles.taskTitle}>{task.title}</Text>
        </View>
      ))}
      </View>
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
    backgroundColor: "#000"
  },
  greetingBox: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    width: 350,
    height: 120,
    top: 60, // Reduced from 20 to 10
    backgroundColor: "#CAC3C3", 

  },
  greeting: {
    position: "absolute",
    textAlign: "center",
    width: 191,
    height: 27,
    top: 31,
    fontStyle: "normal",
    fontWeight: "bold",
    fontSize: 20,
    lineHeight: 20,
    textAlign: "center",
  },
  QueueTxt: {
    position: "absolute",
    top: 70,
    fontFamily: 'Jomhuria-Regular', 
    fontStyle: "normal",
    fontWeight: "bold",
    fontSize: 25,
  },
  tasksWrapper:{
    marginTop: 0, // Adjusted to ensure it is right below the greetingBox
    width: "100%",
  },
  taskContainer: {
    flexDirection: "row",
    marginTop: 0, // Adjusted to ensure it is right below the greetingBox
    alignItems: "center", 
    justifyContent: "flex-start", 
    width: "100%",
  },
  taskTitle: {
    fontSize: 18,
    color: "white",
    marginLeft: 10,
  },

  line: {
    width: "100%",
    height: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    marginTop: 10,
    marginBottom: 10,
    alignSelf: "stretch",
  },

  buttonContainer: {
    flexDirection: "row",
    marginTop: 80,
  },
  backButton: {
    marginRight: 150, // Increased margin to add more space
    padding: 10,
    backgroundColor: "#ccc",
  },
  backText: {
    color: "#000",
  },
  startButton: {
    padding: 10,
    backgroundColor: "#ffcc00",
  },
  startText: {
    color: "#000",
  },
});

export default TaskScreen;