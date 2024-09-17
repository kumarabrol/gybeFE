import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, TextInput, Alert, Dimensions, Keyboard } from 'react-native';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

const InputFormTaskInputType = {
  Label: 0,
  TextBox: 1,
  DropDown: 2,
  CheckBox: 3,
  Button: 4,
  PF: 5,
  CaptureImage: 6, 
};

const { width, height } = Dimensions.get('window');

const TaskDetailScreen = ({ navigation, route }) => {
  const [tasks, setTasks] = useState([]);
  const [taskResponses, setTaskResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const { assignmentId } = route.params;

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const fetchTasks = async () => {
        try {
          const response = await axios.get(`http://gybeapis-v36.westus.azurecontainer.io/api/Assignment/AssignmentTasksNew/16`);
          setTasks(response.data.tasks);
          
          const initialResponses = response.data.tasks.reduce((acc, task) => {
            task.fields.forEach(field => {
              acc[field.inputFormTaskFieldID] = { 
                value: field.inputFormTaskInputType === InputFormTaskInputType.CheckBox ? false : '', 
                status: false 
              };
            });
            return acc;
          }, {});
          setTaskResponses(initialResponses);
        } catch (error) {
          console.error('Error fetching tasks:', error);
          Alert.alert('Error', 'Failed to fetch tasks. Please try again.');
        } finally {
          setLoading(false);
        }
      };

      fetchTasks();
      return () => {
        // Clean up function if needed
      };
    }, [assignmentId])
  );

  const handleInputChange = (fieldId, value) => {
    console.log('Field ID:', fieldId, 'Value:', value);
    setTaskResponses(prevResponses => ({
      ...prevResponses,
      [fieldId]: { value: value, status: true }
    }));
  };


  const handleCaptureImage = (fieldId) => {
    // TODO: Implement image capture functionality
    console.log('Capture image for field:', fieldId);
    Alert.alert('Image Capture', 'Image capture functionality to be implemented.');
  };

  const handleNextTask = () => {
    if (currentTaskIndex < tasks.length - 1) {
      setCurrentTaskIndex(prevIndex => prevIndex + 1);
    }
  };

  const handlePreviousTask = () => {
    if (currentTaskIndex > 0) {
      setCurrentTaskIndex(prevIndex => prevIndex - 1);
    }
  };







  const handleBackPress = () => {
    Alert.alert(
      "Confirm Navigation",
      "Are you sure you want to go back? Your responses will be submitted.",
      [
        {
          text: "No",
          onPress: () => console.log("Navigation cancelled"),
          style: "cancel"
        },
        { 
          text: "Yes", 
          onPress: handleSubmitAndGoBack
        }
      ],
      { cancelable: false }
    );
  };

  const handleSubmitAndGoBack = async () => {
    setSubmitting(true);
    try {
      const formattedTasks = tasks.map(task => ({
        inputFormTaskID: task.inputFormTaskID,
        taskSequence: task.taskSequence,
        name: task.name,
        fields: task.fields.map(field => ({
          inputFormTaskFieldID: field.inputFormTaskFieldID,
          fieldSequence: field.fieldSequence,
          inputFormTaskInputType: field.inputFormTaskInputType,
          detail: field.detail,
          response: taskResponses[field.inputFormTaskFieldID]?.value.toString(),
          inputFormCellLocation: field.inputFormCellLocation || ''
        }))
      }));

      const payload = {
        assignmentId: 16,
        deviceId: 1,
        tasks: formattedTasks
      };

      console.log('Submitting payload:', JSON.stringify(payload, null, 2));

      const response = await axios.put(
        'http://gybeapis-v36.westus.azurecontainer.io/api/Assignment/RecordAssignmentWork',
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'accept': '*/*'
          }
        }
      );

      console.log('Submit response:', response.data);
      Alert.alert('Success', 'Responses submitted successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error submitting responses:', error);
      
      let errorMessage = 'Failed to submit responses. Please try again.';
      if (error.response) {
        console.error('Error data:', error.response.data);
        console.error('Error status:', error.response.status);
        console.error('Error headers:', error.response.headers);
        
        if (error.response.status === 500) {
          errorMessage = 'The server encountered an internal error. Please try again later or contact support.';
          console.error('Server error details:', error.response.data);
        } else {
          errorMessage = `Server error (${error.response.status}): ${JSON.stringify(error.response.data)}`;
        }
      } else if (error.request) {
        console.error('Error request:', error.request);
        errorMessage = 'No response received from server. Please check your internet connection.';
      } else {
        console.error('Error message:', error.message);
        errorMessage = `Error: ${error.message}`;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field) => {
    switch (field.inputFormTaskInputType) {
      case InputFormTaskInputType.Label:
        return (
          <View key={field.inputFormTaskFieldID} style={styles.fieldContainer}>
            <Text style={styles.labelText}>{field.detail}</Text>
          </View>
        );
      case InputFormTaskInputType.TextBox:
        return (
          <View style={styles.fieldContainer} key={field.inputFormTaskFieldID}>
            <TextInput
              style={[styles.textInput, { width: width * 0.6 , height: 60 }] }
              placeholder={field.detail}
              value={taskResponses[field.inputFormTaskFieldID]?.value}
              onChangeText={(text) => handleInputChange(field.inputFormTaskFieldID, text)}
              multiline={true}
              numberOfLines={4}
            />
          </View>
        );
      case InputFormTaskInputType.DropDown:
        const options = field.detail.split(';').map(option => option.trim());
        return (
          <View style={styles.fieldContainer} key={field.inputFormTaskFieldID}>
            <Picker
              selectedValue={taskResponses[field.inputFormTaskFieldID]?.value}
              style={[styles.dropfieldContainer, { width: width * 0.8 }]}
              mode="dialog"
              onValueChange={(itemValue) => handleInputChange(field.inputFormTaskFieldID, itemValue)}
            >
              <Picker.Item label="Select an option" value="" />
              {options.map((option, index) => (
                <Picker.Item key={index} label={option} value={option} />
              ))}
            </Picker>
          </View>
        );
        case InputFormTaskInputType.CheckBox:
          return (
            <TouchableOpacity 
              style={styles.fieldContainer} 
              key={field.inputFormTaskFieldID}
              onPress={() => handleInputChange(field.inputFormTaskFieldID, !taskResponses[field.inputFormTaskFieldID]?.value)}
            >
              <Text style={styles.checkMark}>
                {taskResponses[field.inputFormTaskFieldID]?.value ? "✓" : "✓"}
              </Text>
              <Text style={styles.checkboxLabel}></Text>
            </TouchableOpacity>
          );
      case InputFormTaskInputType.Button:
        return (
          <View style={styles.buttonContainer} key={field.inputFormTaskFieldID}>
            {field.detail.split(';').map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.button, { width: width * 0.8 }]}
                onPress={() => handleInputChange(field.inputFormTaskFieldID, option)}
              >
                <Text style={styles.buttonText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );
      case InputFormTaskInputType.PF:
        return (
          <View style={styles.fieldContainer} key={field.inputFormTaskFieldID}>
            <Text style={styles.fieldLabel}>{field.detail}</Text>
            <View style={styles.pfButtonContainer}>
              {field.detail.split(';').map((option, index) => (
                <TouchableOpacity 
                  key={index}
                  style={[
                    styles.pfButton,
                    taskResponses[field.inputFormTaskFieldID]?.value === option && styles.pfButtonSelected,
                    { width: (width * 0.8) / field.detail.split(';').length }
                  ]}
                  onPress={() => handleInputChange(field.inputFormTaskFieldID, option)}
                >
                  <Text style={styles.pfButtonText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );



        case InputFormTaskInputType.CaptureImage:
        return (
          <View style={styles.fieldContainer} key={field.inputFormTaskFieldID}>
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={() => handleCaptureImage(field.inputFormTaskFieldID)}
            >
              <MaterialIcons name="camera-alt" size={40} color="#fff" />
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>{currentTask?.name}</Text>
      </View>
      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        {currentTask?.fields.map((field) => renderField(field))}
      </ScrollView>
      {!keyboardVisible && (
        <View style={styles.navigationContainer}>
          <TouchableOpacity 
            style={[styles.navButton, currentTaskIndex === 0 && styles.disabledNavButton]} 
            onPress={handlePreviousTask}
            disabled={currentTaskIndex === 0}
          >
            <Text style={[styles.navText, currentTaskIndex === 0 && styles.disabledNavText]}>{'<'}</Text>
          </TouchableOpacity>
          {isLastTask ? (
            <TouchableOpacity 
              style={styles.submitButton} 
              onPress={handleSubmitAndGoBack}
              disabled={submitting}
            >
              <Text style={styles.submitButtonText}>
                {submitting ? 'Submitting...' : 'Submit All Responses'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.navButton}
              onPress={handleNextTask}
            >
              <Text style={styles.navText}>{'>'}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      {!keyboardVisible && (
        <TouchableOpacity style={styles.backButton}  onPress={handleBackPress}>
          <Text style={styles.backText}>BACK</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    justifyContent: "center",
    alignItems: "center",
    width: '100%',
    height: 120,
    backgroundColor: "#CAC3C3",
    marginBottom: 20,
  },
  headerText: {
    fontStyle: "normal",
    fontWeight: "bold",
    fontSize: 30,
    color: "#000",
  },
  subHeaderText: {
    textAlign: "center",
    fontStyle: "normal",
    fontWeight: "bold",
    fontSize: 20,
    marginTop: 10,
    color: "#000",
  },
  scrollView: {
    flex: 1,
    padding: 0,
  },
  fieldContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  dropfieldContainer: {
    backgroundColor: 'white',
    borderRadius: 5,
  },
  fieldLabel: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 10,
  },
  textInput: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  checkMark: {
    color: 'white',
    fontSize: 60,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
  },
  button: {
    backgroundColor: '#ffcc00',
    padding: 15,
    borderRadius: 5,
    marginVertical: 5,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    color: '#000',
    textAlign: 'center',
  },
  buttonContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  pfButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  pfButton: {
    backgroundColor: '#ffcc00',
    padding: 15,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  pfButtonText: {
    color: '#000',
    textAlign: 'center',
    fontSize: 16,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
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
  backButton: {
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
    borderWidth: 1,
    borderColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 5,
  },
  backText: {
    color: "#fff",
    fontSize: 20,
  },
  labelText: {
    color: '#fff',
    fontSize: 40,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: "#ffcc00",
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
    borderRadius: 5,
    flex: 1,
    marginLeft: 10,
  },
  submitButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },

  cameraButton: {
    backgroundColor: '#ffcc00',
    padding: 20,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },

});


export default TaskDetailScreen;