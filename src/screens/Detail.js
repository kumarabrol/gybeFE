import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Text, StyleSheet, View, TouchableOpacity, FlatList, Animated,Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  exchangeCodeAsync,
  makeRedirectUri,
  useAuthRequest,
  useAutoDiscovery,
} from 'expo-auth-session';
import { openAuthSessionAsync } from 'expo-web-browser';

const DRAG_THRESHOLD = 50;

const DetailScreen = ({ navigation, route }) => {
  const [tasks, setTasks] = useState([]);
  const [deviceId, setDeviceId] = useState(-1);
  const [error, setError] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [assignmentName, setAssignmentName] = useState('');

  const pan = useRef(new Animated.ValueXY()).current;
  const arrowOpacity = useRef(new Animated.Value(1)).current;
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


  useEffect(() => {
    // Log the entire route.params to debug
    //console.log('Route params received:', JSON.stringify(route.params, null, 2));

    // Check for tasks in the correct location
    if (route.params?.tasks) {
      const taskData = route.params.tasks;
      setAssignmentName(route.params.name || 'Assignment');
      setDeviceId(route.params.deviceId || -1);
      
      const processedTasks = taskData.map(task => ({
        id: task.assignmentTaskID.toString(),
        name: task.name,
        status: 0,
        fields: task.fields,
        taskSequence: task.taskSequence,
        startTime: task.startTime,
        endTime: task.endTime,
        userClickedSave: task.userClickedSave
      }));
      
      // Sort tasks by sequence number
      processedTasks.sort((a, b) => a.taskSequence - b.taskSequence);
      //console.log('Processed tasks:', JSON.stringify(processedTasks, null, 2));
      setTasks(processedTasks);
    } else if (route.params?.detailedData?.tasks) {
      // Alternative path if tasks are nested in detailedData
      const { detailedData } = route.params;
      setAssignmentName(detailedData.name);
      setDeviceId(detailedData.deviceId);
      
      const processedTasks = detailedData.tasks.map(task => ({
        id: task.assignmentTaskID.toString(),
        name: task.name,
        status: 0,
        fields: task.fields,
        taskSequence: task.taskSequence,
        startTime: task.startTime,
        endTime: task.endTime,
        userClickedSave: task.userClickedSave
      }));
      
      processedTasks.sort((a, b) => a.taskSequence - b.taskSequence);
      setTasks(processedTasks);
    } else {
      console.error('No tasks found in route params:', route.params);
      setError('No task data available. Please try again.');
    }
  }, [route.params]);

  useFocusEffect(
    useCallback(() => {
      if (route.params?.completedTaskId) {
        console.log('Task completed:', route.params.completedTaskId);
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === route.params.completedTaskId
              ? { ...task, status: 3, userClickedSave: true }
              : task
          )
        );
        setSelectedTaskId(null);
      }
    }, [route.params?.completedTaskId])
  );

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

  const handleStartPress = (taskId) => {
    const selectedTask = tasks.find(task => task.id === taskId);
    if (selectedTask && selectedTask.status !== 3) {
      setSelectedTaskId(taskId);
      navigation.navigate('Task-Details', {
        assignmentId: route.params.assignmentId,
        deviceId: deviceId,
        type: route.params.type,
        detailedData : selectedTask,
        alltasks: tasks,
        entire : route.params,
        selectedTask: selectedTask

      });

    //console.log('All tasks:', JSON.stringify(route.params, null, 2));

    }
  };

  const handleGesture = Animated.event(
    [{ nativeEvent: { translationY: pan.y } }],
    { useNativeDriver: false }
  );

  const handleStateChange = ({ nativeEvent }) => {
    if (nativeEvent.oldState === 4) {
      if (nativeEvent.translationY > DRAG_THRESHOLD) {
        Animated.timing(pan, {
          toValue: { x: 0, y: DRAG_THRESHOLD * 2 },
          duration: 200,
          useNativeDriver: false,
        }).start(() => {
          navigation.goBack();
        });
      } else {
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
        }).start();
      }
    }
  };

  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(arrowOpacity, {
          toValue: 0.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(arrowOpacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    pulseAnimation.start();
    return () => pulseAnimation.stop();
  }, [arrowOpacity]);

  const renderTask = ({ item }) => {
    const hasResponse = item.fields.some(field => field.response?.trim() !== "");
    const isCompleted = item.userClickedSave;

    return (
      <TouchableOpacity
        style={[
          styles.taskItem,
          hasResponse && styles.taskWithResponse,
          !hasResponse && styles.taskWithoutResponse,
          isCompleted && styles.completedTaskItem,
          item.id === selectedTaskId 
        ]}
        onPress={() => handleStartPress(item.id)}
      >
        <View style={styles.textWithCheckmark}>
        <Text style={[
          styles.taskName,
          hasResponse && styles.taskWithResponseText,
          !hasResponse && styles.taskWithoutResponseText,
          isCompleted && styles.completedTaskName
        ]}>
          {item.name}
        </Text>
        {hasResponse && (
          <Icon name="checkmark" size={50} color="black" style={styles.checkmarkIcon} />
        )}
        </View>
      </TouchableOpacity>
    );
  };

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
          <View style={styles.greetingBox}>
            <Text style={styles.greeting}>{assignmentName}</Text>
            <Text style={styles.queueText}>Please complete following tasks:</Text>
          </View>
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <FlatList
              style={styles.tasksWrapper}
              data={tasks}
              renderItem={renderTask}
              keyExtractor={item => item.id}
            />
          )}
       
    </GestureHandlerRootView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'black',
      flex: 1,
      padding: 0,
    },
  arrowContainer: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
  },
  backButton: {
    top: 0, // Adjust this to position the button vertically
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
    color: 'gold',
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
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  textWithCheckmark: {
    flexDirection: 'row', // Aligns text and icon horizontally
    justifyContent: 'space-between', 
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginBottom: 5,
  },
  checkmarkIcon: {
   // marginLeft: 5, // Pushes the checkmark to the far right
  },
  queueText: {
    fontSize: 18,
    fontWeight: '500',
  },
  tasksWrapper: {
    flex: 1,
  },
  taskItem: {
    backgroundColor: '#FFD700',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  taskWithResponse: {
    backgroundColor: '#FFD700',
    padding: 25,
    borderRadius: 8,
    marginBottom: 10,
  },
  taskWithoutResponse: {
    backgroundColor: 'gold',
    padding: 35,
    borderRadius: 8,
    marginBottom: 10,

  },
  selectedTaskItem: {
    backgroundColor: '#333',
    borderColor: '#ffcc00',
    borderWidth: 2,
  },
  taskName: {
    fontSize: 24,
    color: 'black',
  },
  taskWithResponseText: {
    fontSize: 24,
    color: 'black',
  },
  taskWithoutResponseText: {
    fontSize: 24,
    color: 'black',
  },
  completedTaskItem: {
    backgroundColor: '#2a2a2a',
    opacity: 0.7,
  },
  completedTaskName: {
    color: '#888',
    textDecorationLine: 'line-through',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
});

export default DetailScreen;