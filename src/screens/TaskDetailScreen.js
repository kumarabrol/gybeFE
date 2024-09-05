import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,TextInput } from 'react-native';
import axios from 'axios';
import {Picker} from '@react-native-picker/picker';
import { RadioButton } from 'react-native-paper';

const InputFormTaskInputType = {
  Label: 0,
  TextBox: 1,
  DropDown: 2,
  CheckBox: 3,
  RadioButton: 4,
  PF: 5,
};


const TaskDetailScreen = ({ navigation, route }) => {
  const [tasks, setTasks] = useState([]);
  const [taskStatuses, setTaskStatuses] = useState({});
  const [taskResponses, setTaskResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const { assignmentId } = route.params;
  const [Enable , setEnable]  = useState("courses");
  const [selectedValue, setSelectedValue] = useState('');
  const [pfValue, setPfValue] = useState(null);
  


  
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await axios.get(`http://gybeapis-v34.westus.azurecontainer.io/api/Assignment/AssignmentTasksNew/${assignmentId}`);
        
        const fetchedTasks = response.data.tasks.map(task => ({
          id: task.inputFormTaskID,
          title: task.name,
          detail: task.fields[0].detail,
          inputType: 3,
          sequence: task.taskSequence,
        }));

        setTasks(fetchedTasks);
        
        // Initialize all task statuses to false (uncompleted)
        const initialStatuses = fetchedTasks.reduce((acc, task) => {
          acc[task.id] = false;
          return acc;
        }, {});
        setTaskStatuses(initialStatuses);

        // Initialize task responses
        const initialResponses = fetchedTasks.reduce((acc, task)  => {
          switch (task.inputType) {
          
            case InputFormTaskInputType.CheckBox:
              acc[task.id] = { status: false}
              break;
            case InputFormTaskInputType.TextBox:
              acc[task.id] = { taskResponses: '' };
              break;
          
            case InputFormTaskInputType.DropDown:
              acc[task.id] = { taskResponses: '' };
              break;
            
            case InputFormTaskInputType.RadioButton:
              acc[task.id] = { taskResponses: '' };
              break;
            case InputFormTaskInputType.PF:
              acc[task.id] = { pfValue: "fail" };
              break;
          }
          
          return acc;
        
        },
         {});
        setTaskResponses(initialResponses);
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
    }
  };

  const handlePress = async () => { 
    const currentTask = tasks[currentTaskIndex];
    console.log('Current task:', currentTask.inputType);
    if (!currentTask) return;
      const newStatus = !taskStatuses[currentTask.id];
      console.log('New status:', newStatus);
    try {
      setTaskStatuses(prevStatuses => ({
        ...prevStatuses,
        [currentTask.id]: newStatus
      }));

      setTaskResponses(prevResponses => ({
        ...prevResponses,
        [currentTask.id]: { ...prevResponses[currentTask.id], status: newStatus }
      }));
      console.log(`Task ${currentTask.id} status updated to: ${newStatus}`);
      if (currentTaskIndex === tasks.length - 1) {
        // await submitFinalResponse();
        navigation.navigate('Task', { completedTaskId: assignmentId });
      }

      
    } catch (error) {
      console.error('Error updating task:', error);
    }}  

    // const handleInputChange = (value) => {
    //   const currentTask = tasks[currentTaskIndex];
    //   if (!currentTask) return;
  
    //   setTaskResponses(prevResponses => ({
    //     ...prevResponses,
    //     [currentTask.id]: { ...prevResponses[currentTask.id], value: value }
    //   }));
  
    //   console.log(`Task ${currentTask.id} status updated to: ${value}`);
  
    // };


  const submitFinalResponse = async () => {
    try {
      const response = await axios.post(
        `http://gybeapis-v33.westus.azurecontainer.io/api/Assignment/UpdateAssignedTaskAfterCompletion?taskAssignmentId=${assignmentId}`,
        {
          response: taskResponses
        },
        {
          headers: {
            'accept': '/',
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status === 200) {
        console.log('Final response submitted successfully');
        navigation.navigate('Task', { completedTaskId: assignmentId });
      } else {
        console.error('Unexpected response status:', response.status);
      }
    } catch (error) {
      console.error('Error submitting final response:', error);
    }
  };

  const handlePreviousTask = () => {
    if (currentTaskIndex > 0) {
      setCurrentTaskIndex(prevIndex => prevIndex - 1);
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


  const isLastTask = currentTaskIndex === tasks.length - 1;
  const taskResponse = taskResponses[currentTask?.id] || {};


  const TaskInput = ({ inputType }) => {
  
    switch (inputType) {
      case InputFormTaskInputType.TextBox:
        return (
          <View style={styles.inputContainer}>
          <TextInput
          style={styles.textInput}
          value={taskResponse.value || ''}
          // onChangeText={handleInputChange}
          placeholder="Enter text"
        />
        </View>
        );
      case InputFormTaskInputType.DropDown:
        return (
          <View style={styles.inputContainer}>
          <Picker
          selectedValue={Enable}
          style={styles.picker}
          mode={"dialog"}
          onValueChange={(itemValue) => setEnable(itemValue)}
        >
          <Picker.Item label="Select an option" value="" />
          <Picker.Item label="Option 1" value="option1" />
          <Picker.Item label="Option 2" value="option2" />
          <Picker.Item label="Option 3" value="option3" />
        </Picker>
        </View>
        );
      case InputFormTaskInputType.CheckBox:
        return (
          <TouchableOpacity style={styles.inputContainer}>
           <Text style={styles.checkMark}>✓</Text> 
           
          </TouchableOpacity>
        );
        case InputFormTaskInputType.RadioButton:
          return (
            <View style={styles.inputContainer}>
              <RadioButton.Group
                onValueChange={(value) => setSelectedValue(value)}
                value={selectedValue}
              >
                {['Option 1', 'Option 2', 'Option 3'].map((option) => (
                  <View key={option} style={styles.radioButton}>
                    <RadioButton.Android value={option} color="#fff" />
                    <Text style={styles.radioText}>{option}</Text>
                  </View>
                ))}
              </RadioButton.Group>
            </View>
          );
      case InputFormTaskInputType.PF:
        return (
          <View style={styles.pfContainer}>
            <TouchableOpacity
              style={[styles.passButton, pfValue === 'Pass' && styles.pfButtonSelected]}
              // onPress={() => handlePFSelect('Pass')}
            >
              <Text style={[styles.pfButtonText, pfValue === 'Pass' && styles.pfButtonTextSelected]}>Pass</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.failButton, pfValue === 'Fail' && styles.pfButtonSelected]}
              // onPress={() => handlePFSelect('Fail')}
            >
              <Text style={[styles.pfButtonText, pfValue === 'Fail' && styles.pfButtonTextSelected]}>Fail</Text>
            </TouchableOpacity>
          </View>
        );
      default:
        return <Text>{value}</Text>;
    }
  };
  
  
  return (
    <View style={styles.container}>
      <View style={styles.greetingBox}>
        <Text style={styles.QueueTxt}>{currentTask?.title}</Text>
        <Text style={styles.greeting}>Step {currentTask?.sequence + 1}</Text>
      </View>
      <View style={styles.tasksWrapper}>
        <View key={currentTask?.id} style={styles.taskContainer}>
          <Text style={styles.taskDetail}>{currentTask?.detail}</Text>
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
    
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>{'BACK'}</Text>
        </TouchableOpacity>
        <View style={styles.verticalBorder} />
        
        <TaskInput inputType={currentTask?.inputType} />

  
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
    lineHeight: 27,
    marginTop: 10,
    marginBottom: 60,
  },
  QueueTxt: {
    position: "absolute",
    top: 70,
  
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
  taskDetail: {
    fontSize: 35,
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
    bottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    width: "140%",
    paddingHorizontal: 0,
    borderTopWidth: 2,
    borderColor: 'white',
    paddingTop: 10,
    
    
  },

 

  backButton: {
    paddingVertical: 40,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 30,
    width: '30%', // Adjust as needed
  },
  backText: {
    color: "#fff",
    fontSize: 20,
  },

  verticalBorder: {
    width: 1,
    backgroundColor: '#fff',
    marginVertical: -10, // Adjust to control border height
  },

  tickButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    right: 80,

  },
  checkMark: {
    color: 'white',
    fontSize: 80,
    fontWeight: 'bold',
    textAlign: 'center', // Center the text horizontally
    textAlignVertical: 'center', // Center the text vertically (for Android)
  },

  inputContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 30,
    right: 20,
  },

  picker: {
    width: '90%',
    height: 50,
    backgroundColor: 'white',
    marginTop: 10,
  },
  
  textInput: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
    width: '90%',  // Adjust width as needed
    height: 80,    // Set a fixed height
    textAlign: 'center',  // Center the text inside the input
  },

  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    right: 10,
  },
  radioText: {
    fontSize: 20,
    marginLeft: 30,
    color: '#fff',
  },
  pfContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 10,
  },
  pfContainer: {
    flexDirection: 'column',
    alignItems: 'stretch',
    width: '50%',
  },
  passButton: {
    backgroundColor: 'green',
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginVertical: 5,
    borderRadius: 5,
    alignItems: 'center',
    alignContent: 'center',
    right: 10,
    width: '80%',
  },

  failButton: {
    backgroundColor: 'red',
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginVertical: 5,
    borderRadius: 5,
    alignItems: 'center',
    alignContent: 'center',
    right: 10,
    width: '80%',
  },
  pfButtonSelected: {
    backgroundColor: '#ffcc00',
  },
  pfButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',

  },
  pfButtonTextSelected: {
    color: '#000',

  },
});

export default TaskDetailScreen;