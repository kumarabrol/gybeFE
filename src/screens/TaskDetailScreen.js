import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, TextInput, Alert, Dimensions, Keyboard, Animated } from 'react-native';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import { AntDesign } from '@expo/vector-icons'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as ImagePicker from 'expo-image-picker'; // Add this import
import * as FileSystem from 'expo-file-system';


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
  const { assignmentId , instructions, detailedData } = route.params;
  const [isConnected, setIsConnected] = useState(true);
  const [isReallyConnected, setIsReallyConnected] = useState(true);
  


  
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
      if (detailedData && detailedData.tasks) {
        setTasks(detailedData.tasks);
        
        const initialResponses = detailedData.tasks.reduce((acc, task) => {
          task.fields.forEach(field => {
            acc[field.inputFormTaskFieldID] = { 
              value: field.response,
              status: false 
            };
          });
          return acc;
        }, {});

        console.log('Initial field responses:', initialResponses);
        setTaskResponses(initialResponses);
        setLoading(false);
      } else {
        console.error('No detailed data provided in route params');
        Alert.alert('Error', 'Failed to load task data. Please go back and try again.');
        setLoading(false);
      }
    }, [detailedData])
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
    console.log('Field ID:', fieldId, 'Value:', value);
    setTaskResponses(prevResponses => ({
      ...prevResponses,
      [fieldId]: { value: value, status: true }
    }));
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

  const saveResponsesLocally = async (response) => {
    try {
      console.log('Attempting to save response locally:', JSON.stringify(response, null, 2));
  
      const existingResponsesString = await AsyncStorage.getItem('offlineResponses');
      let offlineResponses = [];
      if (existingResponsesString) {
        try {
          offlineResponses = JSON.parse(existingResponsesString);
          if (!Array.isArray(offlineResponses)) {
            console.warn('Existing responses is not an array, resetting to empty array');
            offlineResponses = [];
          }
        } catch (parseError) {
          console.error('Error parsing existing responses:', parseError);
          offlineResponses = [];
        }
      }
  
      offlineResponses.push(response);
  
      const updatedResponsesString = JSON.stringify(offlineResponses);
      await AsyncStorage.setItem('offlineResponses', updatedResponsesString);
  
      console.log('Response saved successfully. Updated storage:', updatedResponsesString);
  
      // Verify storage
      const verificationString = await AsyncStorage.getItem('offlineResponses');
      console.log('Verification of saved data:', verificationString);
  
    } catch (error) {
      console.error('Error saving response locally:', error);
    }
  };


  const syncOfflineResponses = async () => {
    try {
      console.log('Starting to sync offline responses');
      const offlineResponsesString = await AsyncStorage.getItem('offlineResponses');
      console.log(offlineResponsesString)
      if (!offlineResponsesString) {
        console.log('No offline responses found to sync');
        return { successful: [], failed: [] };
      }
  
      let responses;
      try {
        responses = JSON.parse(offlineResponsesString);
        console.log('Parsed offline responses:', JSON.stringify(responses, null, 2));
      } catch (parseError) {
        console.error('Error parsing offline responses:', parseError);
        await AsyncStorage.removeItem('offlineResponses');
        return { successful: [], failed: [] };
      }
  
      if (!Array.isArray(responses) || responses.length === 0) {
        console.log('No valid offline responses to sync');
        await AsyncStorage.removeItem('offlineResponses');
        return { successful: [], failed: [] };
      }
  
      const successfulSubmissions = [];
      const failedSubmissions = [];
  
      for (const response of responses) {
        try {
          console.log('Submitting offline response:', JSON.stringify(response, null, 2));
          await submitResponse(response);
          successfulSubmissions.push(response);
          console.log('Successfully submitted offline response');
        } catch (submissionError) {
          console.error('Error submitting offline response:', submissionError);
          // failedSubmissions.push({ response, error: submissionError.message });
        }
      }
  
      if (failedSubmissions.length > 0) {
        console.log('Some submissions failed. Retaining failed submissions in storage.');
        await AsyncStorage.setItem('offlineResponses', JSON.stringify(failedSubmissions.map(f => f.response)));
      } else {
        console.log('All offline responses synced successfully. Clearing storage.');
        await AsyncStorage.removeItem('offlineResponses');
      }
  
      console.log(`Sync complete. Successful: ${successfulSubmissions.length}, Failed: ${failedSubmissions.length}`);
  
      return { successful: successfulSubmissions, failed: failedSubmissions };
    } catch (error) {
      console.error('Error in syncOfflineResponses:', error);
      throw error;
    }
  };
  const submitResponse = async (payload) => {
    try {
      const response = await axios.put(
        'http://gybeapis-v43.westus.azurecontainer.io/api/Assignment/RecordAssignmentWork',
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'accept': '*/*'
          }
        }
      );
      console.log('Submit response:', response.data);
    } catch (error) {
      console.error('Error submitting response:', error);
      throw error;
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
          response: taskResponses[field.inputFormTaskFieldID]?.value.toString(),
          inputFormCellLocation: field.inputFormCellLocation || ''
        }))
      }));
      
      const { type, deviceId } = route.params;
      
      const payload = {
        assignmentId: parseInt(assignmentId, 10),
        deviceId: deviceId,
        assignmentType: type,
        name: instructions,
        tasks: formattedTasks
      };
      console.log('Submitting payload:', JSON.stringify(payload, null, 2));

      if (isConnected) {
        const response = await submitResponse(payload);
        console.log('Current response submitted successfully:', response);
        await syncOfflineResponses();
        Alert.alert('Success', 'Responses submitted successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        await saveResponsesLocally(payload);
        Alert.alert('Offline Mode', 'Responses saved locally. They will be submitted when internet connection is restored.', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      console.error('Error in handleSubmitAndGoBack:', error);
      Alert.alert('Error', 'Failed to handle submission. Please check the console for more details and try again.');
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
            <View style={{ width: 400, alignItems: 'center'}} key={field.inputFormTaskFieldID}>
              <TouchableOpacity
                style={styles.cameraButton}
                onPress={() => handleCaptureImage(field.inputFormTaskFieldID)}
              >
                <MaterialIcons name="camera-alt" size={30}  color="#fff" />
              </TouchableOpacity>
              {taskResponses[field.inputFormTaskFieldID]?.value && (
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

  const currentTask = tasks[currentTaskIndex];
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
    left: 170,
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
    padding: 20,
    borderRadius: 50,
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
