import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, TextInput, Alert, Dimensions, Keyboard, Animated, Image , Modal  } from 'react-native';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import { AntDesign } from '@expo/vector-icons'; 
// import NetInfo from '@react-native-community/netinfo';
import * as ImagePicker from 'expo-image-picker'; // Add this import
 import * as FileSystem from 'expo-file-system';
import {AsyncStorage} from 'react-native';
import {
  exchangeCodeAsync,
  makeRedirectUri,
  useAuthRequest,
  useAutoDiscovery,
} from 'expo-auth-session';
import { openAuthSessionAsync } from 'expo-web-browser';

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
  const { assignmentId , detailedData , alltasks, selectedTask} = route.params;
  const [isConnected, setIsConnected] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const b2cname = 'gybeb2cdev';
  const policyName = 'B2C_1_signupsignin1';
  const scheme = 'rnstarter';
  // We store the JWT in here
const [token, setToken] = useState(null);

  const discovery = useAutoDiscovery(
    'https://' + b2cname + '.b2clogin.com/' + b2cname + '.onmicrosoft.com/' + policyName + '/v2.0'
  );

  const redirectUri = makeRedirectUri({
    scheme: scheme,
    path: 'com.devgybecloud.rnstarter/auth',
  });
  //console.log('Redirect URI:', redirectUri);
  const clientId = 'edb617eb-dce8-454a-a120-390b9da0096f';
  const handleImagePreview = (imageUri) => {
    setSelectedImage(imageUri);
    setModalVisible(true);
  };
  
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

  const handleSignOut = async () => {
    console.log('Signing out...');
    const params = new URLSearchParams({
      client_id: clientId,
      post_logout_redirect_uri: redirectUri,
    });
    try {
      const result = await openAuthSessionAsync(discovery.endSessionEndpoint + '?' + params.toString(), redirectUri);
      if (result.type !== 'success') {
        handleError(new Error('Please, confirm the logout request and wait for it to finish.'));
        console.error(result);
        return;
      }
      console.log('Signed out');
      navigation.navigate('Gybe'); // Navigate to Home screen
    } catch (error) {
      console.error('Failed to sign out:', error);
    } finally {
      setToken(null);
    }
  };


  useFocusEffect(
    React.useCallback(() => {
      if (alltasks) {
        setTasks(alltasks);
        //console.log('all tasks:', JSON.stringify(alltasks, null, 2));
  
        // Initialize responses with proper structure
        const initialResponses = {};
        alltasks.forEach(task => {
          task.fields.forEach(field => {
            initialResponses[field.assignmentTaskFieldID] = {
              value: field.response || '',  
              status: false
            };
          });
        });
  
        //console.log('Initializing taskResponses:', initialResponses);
        //console.log('Initializing alltasks:', alltasks);
        let baseSelTask;
        if(selectedTask === undefined){
          baseSelTask=alltasks[0].assignmentTaskID
          //selectedTask = alltasks[0];
        }
        else{
          baseSelTask=selectedTask.id;
        }

        //console.log('selectedTask :', JSON.stringify(selectedTask, null, 2));
        setTaskResponses(initialResponses);
      //  console.log('Initializing alltasks:', alltasks);
  
        // Find the index of the selected task
        const selectedTaskIndex = alltasks.findIndex(task => task.id === baseSelTask);
       // console.log('Initializing taskResponses:', initialResponses);
        setCurrentTaskIndex(selectedTaskIndex !== -1 ? selectedTaskIndex : 0);
  
        setLoading(false);
      } else {
        console.error('No detailed data provided in route params');
        Alert.alert('Error', 'Failed to load task data. Please go back and try again.');
        setLoading(false);
      }
    }, [alltasks, selectedTask])
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
       //console.log('Updated taskResponses:', newResponses);
      return newResponses;
    });
  };
  const handleCaptureImage = async (fieldId) => {
   // console.log('Capture image for field:', fieldId);
    
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
       // console.log('base64ImageWithPrefix..',base64ImageWithPrefix);
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
      //console.log('tasks...205...',tasks)
      const formattedTasks = tasks.map(task => ({
        //inputFormTaskID: task.inputFormTaskID,
        taskSequence: task.taskSequence,
        assignmentTaskID: task.id?? task.assignmentTaskID,
        name: task.name,
        startTime: task.startTime,
        userClickedSave: task.userClickedSave,
        fields: task.fields.map(field => ({
          inputFormTaskFieldID: field.inputFormTaskFieldID,
          assignmentTaskFieldID: field.assignmentTaskFieldID,
          fieldSequence: field.fieldSequence,
          fieldLabel: field.fieldLabel,
          inputFormTaskInputType: field.inputFormTaskInputType,
          detail: field.detail,
          response: taskResponses[field.assignmentTaskFieldID]?.value.toString()
        }))
      }));

      const { assignmentId, instructions } = route.params
      console.log('assignmentId...168...',assignmentId)

      const payload = {
        assignmentId: assignmentId,
        deviceId: -1,
        tasks: formattedTasks
      };

      //console.log('Submitting payload:', JSON.stringify(payload, null, 2));

      const response = await axios.put(
        'https://gbapidev.yellowmushroom-4d501d6c.westus.azurecontainerapps.io/api/Assignment/RecordAssignmentWork',
        [payload],
        {
          headers: {
            'Content-Type': 'application/json',
            'accept': '*/*'
          }
        }
      );

      //console.log('Submit response:', response.data);
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
          <View style={[styles.fieldContainer, {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20
          }]}>
            <Text style={[styles.labelText, { flex: 0.3 }]}>{field.fieldLabel}:</Text>
            <Text style={[styles.labelText, { flex: 0.7,  }]}>{field.detail}</Text>
          </View>
        );
  
      case InputFormTaskInputType.TextBox:
        return (
          <View style={[styles.fieldContainer, {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20
          }]}>
            <Text style={[styles.labelText, { flex: 0.3 }]}>{field.fieldLabel}:</Text>
            <TextInput
              style={[styles.textInput, { flex: 0.7 }]}
              placeholder={field.detail}
              value={taskResponses[field.assignmentTaskFieldID]?.value}
              onChangeText={(text) => handleInputChange(field.assignmentTaskFieldID, text)}
              multiline={true}
              numberOfLines={4}
            />
          </View>
        );
  
      case InputFormTaskInputType.DropDown:
        const options = field.detail.split(',').map(option => option.trim());
        return (
          <View style={[styles.fieldContainer, {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20
          }]}>
            <Text style={[styles.labelText, { flex: 0.3 }]}>{field.fieldLabel}:</Text>
            <Picker
              selectedValue={taskResponses[field.assignmentTaskFieldID]?.value}
              style={[styles.dropfieldContainer, { flex: 0.7 }]}
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
            <View style={[styles.fieldContainer, {
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 20
            }]}>
              <Text style={[styles.labelText, { flex: 0.3 }]}>{field.fieldLabel}:</Text>
              <TouchableOpacity 
                onPress={() => handleInputChange(field.assignmentTaskFieldID, !taskResponses[field.assignmentTaskFieldID]?.value)}
                style={[styles.checkboxContainer, { flex: 0.7 }]}
              >
                <View style={styles.checkbox}>
                  {taskResponses[field.assignmentTaskFieldID]?.value && (
                    <MaterialIcons name="check" size={20} color="#ffcc00" />
                  )}
                </View>
              </TouchableOpacity>
            </View>
          );
  
     {/*} case InputFormTaskInputType.Button:
        return (
          <View style={[styles.fieldContainer, {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20
          }]}>
            <Text style={[styles.labelText, { flex: 0.3 }]}>{field.fieldLabel}:</Text>
            <View style={{ flex: 0.7 }}>
              {field.detail.split(';').map((option, index) => (
                <TouchableOpacity
                  key={`${field.inputFormTaskFieldID}-button-${index}`}
                  style={styles.button}
                  onPress={() => handleInputChange(field.assignmentTaskFieldID, option)}
                >
                  <Text style={styles.buttonText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ); */}

    case InputFormTaskInputType.Button:
  // Rename the variable from `options` to `radioOptions`
      const radioOptions = field.detail.split(',').map(option => option.trim());
      console.log(radioOptions);
        return (
          <View style={[styles.fieldContainer, {
            flexDirection: 'row', // Stack radio buttons vertically
            alignItems: 'center',
            paddingHorizontal: 20
          }]}>
            <Text style={[styles.labelText,  { flex: 0.55 }]}>{field.fieldLabel}:</Text>
            {radioOptions.map((option, index) => (
              <TouchableOpacity
                key={`${field.inputFormTaskFieldID}-option-${index}`}
                style={[styles.radioOptionContainer ,  { flex: 0.7 }]}
                onPress={() => handleInputChange(field.assignmentTaskFieldID, option)}
              >
                <View style={[
                  styles.radioCircle,
                  taskResponses[field.assignmentTaskFieldID]?.value === option && styles.radioCircleSelected
                ]} />
                <Text style={styles.radioLabel}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case InputFormTaskInputType.PF:
        return (
          <View style={[styles.fieldContainer, {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20
          }]}>
            <Text style={[styles.labelText, { flex: 0.3 }]}>{field.fieldLabel}:</Text>
            <View style={[styles.pfButtonContainer, { flex: 0.7 }]}>
              {field.detail.split(';').map((option, index) => (
                <TouchableOpacity 
                  key={`${field.assignmentTaskFieldID}-pf-${index}`}
                  style={[
                    styles.pfButton,
                    taskResponses[field.assignmentTaskFieldID]?.value === option && styles.pfButtonSelected
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
          <View style={[styles.fieldContainer, {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20
          }]}>
            <Text style={[styles.labelText, { flex: 0.3 }]}>{field.fieldLabel}:</Text>
            <View style={{ flex: 0.7, alignItems: 'flex-start' }}>
              <TouchableOpacity
                style={styles.cameraButton}
                onPress={() => handleCaptureImage(field.assignmentTaskFieldID)}
              >
                <MaterialIcons name="camera-alt" size={30} color="#fff" />
              </TouchableOpacity>
              {taskResponses[field.assignmentTaskFieldID]?.value && (
                 <View style={styles.imageContainer}>
                  <Text style={styles.imageCapturedText}>Image captured</Text>
                  <View>
                  <TouchableOpacity onPress={() => handleImagePreview(taskResponses[field.assignmentTaskFieldID].value)}>
                  <Image
                    source={{ uri: taskResponses[field.assignmentTaskFieldID].value }}
                    style={styles.capturedImage}
                  />
                  </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        );
  
      default:
        return null;
    }
  };


  // console.log(' tasks on:', JSON.stringify(tasks, null, 2));
      
  const currentTask = tasks[currentTaskIndex];
  // console.log("currentTask", JSON.stringify(currentTask, null, 2))

  const isLastTask = currentTaskIndex === tasks.length - 1;

  return (
    <View style={styles.container}>
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Image
            source={require('./assets/left-arrow.png')} // Ensure this path is correct
            style={styles.backButtonImage}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

        <Animated.View style={[styles.container, { transform: [{ translateY: pan.y }] }]}>
        <View style={styles.greetingBox}>
          <Text style={styles.headerText}>{currentTask?.name}</Text>
        </View>
          <View style={{ height: 30 }} /> 
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
             <View style={styles.navigation}>
                <Image
                  source={require('./assets/back-button.png')}
                  style={[styles.navIcon, currentTaskIndex === 0 && styles.disabledNavText]}
                />
              </View>
           </TouchableOpacity>
           <View style={{ height: 20 }} />
           <TouchableOpacity 
             style={styles.submitButton} 
             onPress={handleSubmitAndGoBack}
             disabled={submitting}
           >
             <Text style={styles.submitButtonText}>
               {submitting ? 'Submitting...' : 'Submit'}
             </Text>
           </TouchableOpacity>
           <View style={{ height: 20 }} />
           <TouchableOpacity 
             style={[styles.navButton, isLastTask && styles.disabledNavButton]}
             onPress={handleNextTask}
             disabled={isLastTask}
           >
             
             <View style={styles.navigation}>
                <Image
                  source={require('./assets/next-button.png')}
                  style={[styles.navIcon, isLastTask && styles.disabledNavIcon]}
                />
              </View>
           </TouchableOpacity>

         </View>
          )}
          <View style={styles.arrowContainer}>
          
          </View>
          <Modal
            visible={modalVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setModalVisible(false)}
          >
            <TouchableOpacity style={styles.modalContainer} onPress={() => setModalVisible(false)}>
              <Image source={{ uri: selectedImage }} style={styles.fullScreenImage} />
            </TouchableOpacity>
          </Modal>

     </Animated.View>
      
    </GestureHandlerRootView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'black',
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 0,
    },
    navigation: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    backButton: {
     left: 20, // Adjust this to position the button horizontally
      zIndex: 1, // Ensure the button is above other elements
    },
    backButtonImage: {
      width: 67, // Adjust width as needed
      height: 67, // Adjust height as needed
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
      paddingHorizontal: 10,
      marginTop: 10,
    },
    signOutButton: {
      padding: 10,
    },
    signOutButtonText: {
      color: 'blue',
      fontSize: 16,
    },
    greetingBox: {
      backgroundColor: '#CAC3C3',
      padding: 20,
      borderRadius: 10,
      marginBottom: 20,
      alignItems: 'center',
      marginTop: 10,
    },
    imageContainer: {
      alignItems: 'center',
      marginTop: 10,
    },
    capturedImage: {
      width: 100,
      height: 100,
      borderRadius: 10,
      marginTop: 10,
    },
    greeting: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 10,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    fullScreenImage: {
      width: '80%',
      height: '80%',
      borderRadius: 10,
    },
    imagePreview: {
      width: 100,
      height: 100,
      borderRadius: 5,
      marginTop: 10,
    },
    navIcon: {
      width: 100,  // Adjust width as needed
      height: 100, // Adjust height as needed
    },
    disabledNavIcon: {
      opacity: 0.5, // Disabled style for the image
    },
    radioOptionContainer: {
      flexDirection: 'row', // Align radio button and label horizontally
      alignItems: 'center', // Center align items vertically
      marginBottom: 10,
      paddingLeft: '1%',
    },
    radioCircle: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#ffcc00',
    borderRadius: 15,
    backgroundColor: 'transparent'
    },
    radioCircleSelected: {
      backgroundColor: '#ffcc00', // Change to desired selected color
    },
    radioLabel: {
      fontSize: 24,
      alignSelf: 'center',
      color: 'white',
      paddingLeft:'8%'
    },
    arrowContainer: {
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
    marginBottom: 0,
    marginTop: 10,
   
  },
  headerText: {
    fontStyle: "normal",
    fontWeight: "bold",
    fontSize: 50,
    color: "#000",
  },
  subHeaderText: {
    textAlign: "center",
    fontStyle: "normal",
    fontWeight: "bold",
    fontSize: 50,
    marginTop: 10,
    color: "#000",
  },
  scrollView: {
    flex: 1,
    padding: 0,
  },
  fieldContainer: {
    marginBottom: 20,
    width: '100%'
  },
  dropfieldContainer: {
    backgroundColor: 'white',
    borderRadius: 5,
    height: 50
  },
  fieldLabel: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 10,
  },

  textInput: {
    backgroundColor: 'white',
  
    borderRadius: 5,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 20
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
    marginVertical: 2,
    alignItems: 'center'
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
    justifyContent: 'flex-start'
  },
  pfButton: {
    backgroundColor: '#ffcc00',
    padding: 10,
    borderRadius: 5,
    marginRight: 5,
    flex: 1
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
    padding: 5,
    borderRadius: 5,
    marginHorizontal: 10,
    width: '50%' ,
  },
  submitButtonText: {
    color: "#000",
    fontSize: 50,
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
   
    right: 90,
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
    fontSize: 24,
    marginRight: 10
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
    justifyContent: 'center'
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
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#ffcc00',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent'
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // paddingHorizontal: 20
  }

});


export default TaskDetailScreen;
