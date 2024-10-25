import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, TextInput, Alert, Dimensions, Keyboard, Animated } from 'react-native';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import { AntDesign } from '@expo/vector-icons'; 
// import NetInfo from '@react-native-community/netinfo';
// import * as ImagePicker from 'expo-image-picker'; // Add this import
// import * as FileSystem from 'expo-file-system';
import {AsyncStorage} from 'react-native';

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
const DRAG_THRESHOLD = 100;

const TaskDetailScreen = ({ navigation, route }) => {
  const [tasks, setTasks] = useState([]);
  const [taskResponses, setTaskResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const { assignmentId , detailedData , alltasks} = route.params;
  const [isConnected, setIsConnected] = useState(true);

  


  
  const pan = useRef(new Animated.ValueXY()).current;

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
      if (alltasks) {
        setTasks(alltasks);
        console.log('all tasks:', JSON.stringify(alltasks, null, 2));

        // Initialize responses with proper structure
        const initialResponses = {};
        alltasks.forEach(task => {
          task.fields.forEach(field => {
            initialResponses[field.assignmentTaskFieldID] = {
              value: field.response || '',  // Provide default empty string if no response
              status: false
            };
          });
        });

        // console.log('Initializing taskResponses:', initialResponses);
        setTaskResponses(initialResponses);
        setLoading(false);
      } else {
        console.error('No detailed data provided in route params');
        Alert.alert('Error', 'Failed to load task data. Please go back and try again.');
        setLoading(false);
      }
    }, [alltasks])
  );

  const handleGesture = Animated.event(
    [{ nativeEvent: { translationY: pan.y } }],
    { useNativeDriver: false }
  );
  
  const toggleConnection = () => {
    setIsConnected(!isConnected);
  };
  const handleStateChange = ({ nativeEvent }) => {
    if (nativeEvent.oldState === State.ACTIVE) {
      if (nativeEvent.translationY > DRAG_THRESHOLD) {
        Alert.alert(
          "Confirm Navigation",
          "Are you sure you want to go back? Your responses will be submitted.",
          [
            {
              text: "No",
              onPress: () => {
                Animated.spring(pan, {
                  toValue: { x: 0, y: 0 },
                  useNativeDriver: false,
                }).start();
              },
              style: "cancel"
            },
            { 
              text: "Yes", 
              onPress: handleSubmitAndGoBack
            }
          ],
          { cancelable: false }
        );
      } else {
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
        }).start();
      }
    }
  };

  const handleInputChange = (fieldId, value) => {
    // console.log('HandleInputChange called with:', { fieldId, value });
    
    setTaskResponses(prevResponses => {
      const newResponses = {
        ...prevResponses,
        [fieldId]: {
          value: value,
          status: true
        }
      };
      
      // Log the state update
      // console.log('Updated taskResponses:', newResponses);
      return newResponses;
    });
  };
  const handleCaptureImage = async (fieldId) => {
    console.log('Capture image for field:', fieldId);
    
    // Request camera permissions
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Sorry, we need camera permissions to make this work!');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        console.log('Image captured');
        
        let base64Image = asset.base64;
        if (!base64Image) {
          const fileUri = asset.uri;
          base64Image = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });
        }

        const base64ImageWithPrefix = `data:image/jpeg;base64,${base64Image}`;
        handleInputChange(fieldId, base64ImageWithPrefix);
      }
    } catch (error) {
      console.error('Error capturing image:', error);
      Alert.alert('Error', 'Failed to capture image. Please try again.');
    }
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
          response: taskResponses[field.as]?.value.toString(),
          inputFormCellLocation: field.inputFormCellLocation || ''
        }))
      }));

      const { assignmentId, instructions } = route.params
      console.log('assignmentId...168...',assignmentId)

      const payload = {
        assignmentId: assignmentId,
        deviceId: 1,
        tasks: formattedTasks
      };

      console.log('Submitting payload:', JSON.stringify(payload, null, 2));

      const response = await axios.put(
        'https://gbapiks.lemonriver-6b83669d.australiaeast.azurecontainerapps.io/api/Assignment/RecordAssignmentWork',
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
          <View style={styles.fieldContainer}>
            <Text style={styles.labelText}>{field.detail}</Text>
          </View>
        );
      case InputFormTaskInputType.TextBox:
        return (
          <View style={[styles.fieldContainer, { justifyContent: 'center', alignItems: 'center' }]}>
            <TextInput
              style={[styles.textInput, { width: width * 0.8 , height: 50 }] }
              placeholder={field.detail}
              value={taskResponses[field.assignmentTaskFieldID]?.value}
              onChangeText={(text) => handleInputChange(field.assignmentTaskFieldID, text)}
              multiline={true}
              numberOfLines={4}
            />
          </View>
        );
      case InputFormTaskInputType.DropDown:
        const options = field.fieldLabel.split(';').map(option => option.trim());
        return (
          <View style={[styles.fieldContainer, { justifyContent: 'center', alignItems: 'center' }]}>
            <Picker
              selectedValue={taskResponses[field.assignmentTaskFieldID]?.value}
              style={[styles.dropfieldContainer, { width: width * 0.8 }]}
              mode="dialog"
              onValueChange={(itemValue) => handleInputChange(field.assignmentTaskFieldID, itemValue)}
            >
              <Picker.Item label="Select an option" value="" />
              {options.map((option, index) => (
                <Picker.Item key={`${field.inputFormTaskFieldID}-option-${index}`} label={option} value={option} />
              ))}
            </Picker>
          </View>
        );
      case InputFormTaskInputType.CheckBox:
        return (
          <TouchableOpacity 
            style={styles.fieldContainer} 
            onPress={() => handleInputChange(field.assignmentTaskFieldID, !taskResponses[field.assignmentTaskFieldID]?.value)}
          >
            <Text style={styles.checkMark}>
              {taskResponses[field.assignmentTaskFieldID]?.value ? "✓" : "✓"}
            </Text>
            <Text style={styles.checkboxLabel}></Text>
          </TouchableOpacity>
        );
      case InputFormTaskInputType.Button:
        return (
          <View style={styles.buttonContainer}>
            {field.detail.split(';').map((option, index) => (
              <TouchableOpacity
                key={`${field.inputFormTaskFieldID}-button-${index}`}
                style={[styles.button, { width: width * 0.8 }]}
                onPress={() => handleInputChange(field.assignmentTaskFieldID, option)}
              >
                <Text style={styles.buttonText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );
      case InputFormTaskInputType.PF:
        return (
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>{field.detail}</Text>
            <View style={styles.pfButtonContainer}>
              {field.detail.split(';').map((option, index) => (
                <TouchableOpacity 
                  key={`${field.assignmentTaskFieldID}-pf-${index}`}
                  style={[
                    styles.pfButton,
                    taskResponses[field.assignmentTaskFieldID]?.value === option && styles.pfButtonSelected,
                    { width: (width * 0.8) / field.detail.split(';').length }
                  ]}
                  onPress={() => handleInputChange(field.assignmentTaskFieldID, option)}
                >
                  <Text style={styles.pfButtonText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      case InputFormTaskInputType.CaptureImage:
        return (
          <View style={{ width: 400, alignItems: 'center'}}>
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={() => handleCaptureImage(field.assignmentTaskFieldID)}
            >
              <MaterialIcons name="camera-alt" size={30}  color="#fff" />
            </TouchableOpacity>
            {taskResponses[field.assignmentTaskFieldID]?.value && (
              <View>
                <Text style={styles.imageCapturedText}>Image captured</Text>
                <View style={styles.imagePlaceholder}>
                  <Text style={styles.imagePlaceholderText}>Image Preview</Text>
                </View>
              </View>
            )}
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
 


  // console.log(' tasks on:', JSON.stringify(tasks, null, 2));
      
  const currentTask = tasks[currentTaskIndex];
  // console.log("currentTask", JSON.stringify(currentTask, null, 2))

  const isLastTask = currentTaskIndex === tasks.length - 1;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PanGestureHandler
        onGestureEvent={handleGesture}
        onHandlerStateChange={handleStateChange}
      >
        <Animated.View style={[styles.container, { transform: [{ translateY: pan.y }] }]}>
          
      <View style={styles.networkToggle}>
       
        <TouchableOpacity
          style={[
            styles.toggleButton,
            { backgroundColor: isConnected ? '#4CAF50' : '#F44336' }
          ]}
          onPress={toggleConnection}
        >
          <Text style={styles.toggleButtonText}>
            {isConnected ? 'Go Offline' : 'Go Online'}
          </Text>
        </TouchableOpacity>
      </View> 
          
          
          <View style={styles.header}>
            <Text style={styles.headerText}>{currentTask?.name}</Text>
          </View>
          <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
         {currentTask?.fields.map((field, index) => (
        <View key={`${field.inputFormTaskFieldID}-${index}`}>
          {renderField(field)}
        </View>
))}
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
         
           <TouchableOpacity 
             style={styles.submitButton} 
             onPress={handleSubmitAndGoBack}
             disabled={submitting}
           >
             <Text style={styles.submitButtonText}>
               {submitting ? 'Submitting...' : 'Submit'}
             </Text>
           </TouchableOpacity>
         
           <TouchableOpacity 
             style={[styles.navButton, isLastTask && styles.disabledNavButton]}
             onPress={handleNextTask}
             disabled={isLastTask}
           >
             <Text style={[styles.navText, isLastTask && styles.disabledNavText]}>{'>'}</Text>
           </TouchableOpacity>
   
            

         </View>
          )}
          <View style={styles.arrowContainer}>
          <AntDesign name="arrowdown" size={24} color="#ffcc00" />
          </View>
        </Animated.View>
      </PanGestureHandler>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  arrowContainer: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
  },
  
  header: {
    justifyContent: "center",
    alignItems: "center",
    width: '100%',
    height: 120,
    backgroundColor: "#CAC3C3",
    marginBottom: 20,
    marginTop: 50,
   
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
    alignItems: 'left',
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
    left: 170,
  },
  checkboxLabel: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
  },
  button: {
    backgroundColor: '#ffcc00',
    padding: 10,
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
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  navButton: {
    padding: 10,
    width: 60,
    alignItems: 'center',
  },
  navText: {
    color: "#fff",
    fontSize: 30,
  },
  disabledNavButton: {
    opacity: 0.5,
  },
  disabledNavText: {
    color: "#888",
  },
  submitButton: {
    backgroundColor: "#ffcc00",
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 10,
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
    padding: 5,
    borderRadius: 500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  networkToggle: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f0f0f0',
  },
  networkToggleText: {
    fontSize: 16,
    marginBottom: 10,
    color: '#000',
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
  fieldLabel: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 10,
  },
  labelText: {
    color: '#fff',
    fontSize: 20,
    textAlign: 'left',
  },
  imageCapturedText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },

  cameraButton: {
    backgroundColor: '#ffcc00',
    padding: 15,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  imageCapturedText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
    marginBottom: 5,
  },
  imagePlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  imagePlaceholderText: {
    color: '#666',
    fontSize: 12,
  },
  

});


export default TaskDetailScreen;
