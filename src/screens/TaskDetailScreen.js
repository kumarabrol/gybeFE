import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import axios from 'axios';

const InputFormTaskInputType = {
  Label: 0,
  TextBox: 1,
  DropDown: 2,
  CheckBox: 3,
  RadioButton: 4,
  PF: 5,
};

const TaskDetailScreen = ({ navigation }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [isChecked, setIsChecked] = useState(true); // Set initial state to true

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await axios.get('http://gybeapis-v32.westus.azurecontainer.io/api/Assignment/AssignmentTasks/14');
        console.log('API response:', JSON.stringify(response.data, null, 2));
        
        const fetchedTasks = response.data.map(task => ({
          id: task.taskAssignmentId,
          title: task.inputFormTaskField.detail,
          inputType: task.inputFormTaskField.inputType,
        }));
        console.log('Processed tasks:', JSON.stringify(fetchedTasks, null, 2));
        setTasks(fetchedTasks);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const handleNextTask = () => {
    if (currentTaskIndex < tasks.length - 1) {
      setCurrentTaskIndex(prevIndex => prevIndex + 1);
      setIsChecked(true);  // Ensure checkbox is checked when changing tasks
    }
  };

  const handleTickPress = async () => {
    const currentTask = tasks[currentTaskIndex];
    if (!currentTask) return;
  
    try {
      const response = await axios.post(
        `http://gybeapis-v32.westus.azurecontainer.io/api/Assignment/UpdateAssignedTaskAfterCompletion?taskAssignmentId=${currentTask.id}&assignedTaskCompletionData=test`,
        {},
        {
          headers: {
            'accept': '/'
          }
        }
      );
  
      if (response.status === 200) {
        console.log('Task update response:', response.data);
        
        if (currentTaskIndex === tasks.length - 1) {
          // If it's the last task, navigate to Task screen with the completed task ID
          console.log('Navigating back to TaskScreen with completedTaskId:', currentTask.id);
          navigation.navigate('Task', { completedTaskId: 1 });
        } else {
          // If it's not the last task, move to the next task
          handleNextTask();
        }
      } else {
        console.error('Unexpected response status:', response.status);
        // Handle unexpected status codes here
      }
    } catch (error) {
      console.error('Error updating task:', error);
      // You might want to show an error message to the user here
    }
  };



  const handlePreviousTask = () => {
    if (currentTaskIndex > 0) {
      setCurrentTaskIndex(prevIndex => prevIndex - 1);
      setIsChecked(true);  // Ensure checkbox is checked when changing tasks
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#ffcc00" />
      </View>
    );
  }

  const currentTask = tasks[currentTaskIndex];
  console.log('Current task:', JSON.stringify(currentTask, null, 2));
  console.log('Current task index:', currentTaskIndex);
  console.log('Total tasks:', tasks.length);

  const isLastTask = currentTaskIndex === tasks.length - 1;

  return (
    <View style={styles.container}>
      <View style={styles.greetingBox}>
        <Text style={styles.greeting}>Assembly Steps</Text>
        <Text style={styles.QueueTxt}>Step 1</Text>
      </View>
      <View style={styles.tasksWrapper}>
        <View key={currentTask?.id} style={styles.taskContainer}>
          <Text style={styles.taskTitle}>{currentTask?.title}</Text>
        </View>
      </View>
      <View style={styles.navigationContainer}>
        <TouchableOpacity style={styles.navButton} onPress={handlePreviousTask}>
          <Text style={styles.navText}>{'<'}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.navButton, isLastTask && styles.disabledNavButton]} 
          onPress={handleNextTask}
          disabled={isLastTask}
        >
          <Text style={[styles.navText, isLastTask && styles.disabledNavText]}>{'>'}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.buttonContainer}>
        {currentTask?.inputType === InputFormTaskInputType.PF ? (
          <>
            <TouchableOpacity style={styles.passButton} onPress={() => console.log('Pass button pressed')}>
              <Text style={styles.passText}>Fail</Text>
            </TouchableOpacity>
            {/* <View style={styles.verticalSeparator} /> */}
            <TouchableOpacity style={styles.failButton} onPress={() => console.log('Fail button pressed')}>
              <Text style={styles.failText}>Pass</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Text style={styles.backText}>{'BACK'}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.tickButton} 
              onPress={handleTickPress}
            >
              {isChecked ? <Text style={styles.checkMark}>✓</Text> : null}
            </TouchableOpacity>
          </>
        )}
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
    top: 60,
    backgroundColor: "#CAC3C3", 
},
greeting: {
    textAlign: "center",
    width: 191,
    height: 27,
    fontStyle: "normal",
    fontWeight: "bold",
    fontSize: 25,
    lineHeight: 27, // Adjusted to match the height of the text
    marginTop: 10,
    marginBottom:60,
},
  QueueTxt: {
    position: "absolute",
    top: 70,
    fontFamily: 'Jomhuria-Regular', 
    fontStyle: "normal",
    fontWeight: "bold",
    fontSize: 40,
    marginTop: -10,
  },
  tasksWrapper: {
    marginTop: 0,
    width: "100%",
    alignItems: "center",
  },
  taskContainer: {
    flexDirection: "row",
    marginTop: 0,
    alignItems: "center", 
    justifyContent: "center",
    width: "100%",
  },
  taskTitle: {
    fontSize: 40,
    color: "white",
    textAlign: "center",
  },
  navigationContainer: {
    position: 'absolute',
    top: '50%',
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    transform: [{ translateY: -25 }],
  },
  navButton: {
    padding: 10,
  },
  navText: {
    color: "#fff",
    fontSize: 50,
  },
  disabledNavButton: {
    opacity: 0.5,
  },
  disabledNavText: {
    color: "#888",
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 100, // Move the buttons upwards
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 0, // Remove horizontal padding
    borderTopWidth: 2,
    borderColor: '#fff',
    paddingTop: 0, // Remove top padding

},
  backButton: {
    flex: 1,
    paddingVertical: 20, // Increase the vertical padding
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    borderRightWidth: 2,
    borderColor: '#fff',
  },
  backText: {
    color: "#fff",
    fontSize: 20,
    marginRight: 40,
    // textAlign: "center", // Center the text horizontally
  },
  tickButton: {
    flex: 2, // Give more space to the tick button
    paddingVertical: 20, // Increase the vertical padding
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  checkMark: {
    color: '#ffF', // Change the color of the check mark
    fontSize: 80, // Make the check mark bigger
    fontWeight: 'bold',
  },
  passButton: {
    flex: 1,
    backgroundColor: 'red',
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
    // marginRight: 10,
    marginLeft: -50,
    width: '100%',
    height: '100%',
  },
  passText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  failButton: {
    flex: 1,
    backgroundColor: 'green',
    paddingVertical: 20,
    justifyContent: 'center',
    alignItems: 'center',
    // marginLeft: 10,
    marginRight: -50,
  },
  failText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  verticalSeparator: {
    width: 2,
    backgroundColor: '#fff',
  },
  labelButton: {
    width: '100%',
    height: '100%',
    backgroundColor: '#ffcc00',
  },
  textBoxButton: {
    width: '80%',
    height: '60%',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#000',
  },
  dropDownButton: {
    width: '80%',
    height: '60%',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkBoxButton: {
    width: 30,
    height: 30,
    borderWidth: 2,
    borderColor: '#000',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonOutline: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#000',
  },
  defaultButton: {
    width: '100%',
    height: '100%',
    backgroundColor: '#ffcc00',
  },
});

export default TaskDetailScreen;