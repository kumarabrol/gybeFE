import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Text, StyleSheet, View, TouchableOpacity, FlatList, Animated } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/Ionicons';

const DRAG_THRESHOLD = 50;

const DetailScreen = ({ navigation, route }) => {
  const [tasks, setTasks] = useState([]);
  const [deviceId, setDeviceId] = useState(-1);
  const [error, setError] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [assignmentName, setAssignmentName] = useState('');

  const pan = useRef(new Animated.ValueXY()).current;
  const arrowOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Log the entire route.params to debug
    console.log('Route params received:', JSON.stringify(route.params, null, 2));

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
      console.log('Processed tasks:', JSON.stringify(processedTasks, null, 2));
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
        entire : route.params

      });

    console.log('All tasks:', JSON.stringify(route.params, null, 2));

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
          item.id === selectedTaskId && styles.selectedTaskItem
        ]}
        onPress={() => handleStartPress(item.id)}
      >
        <Text style={[
          styles.taskName,
          hasResponse && styles.taskWithResponseText,
          !hasResponse && styles.taskWithoutResponseText,
          isCompleted && styles.completedTaskName
        ]}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PanGestureHandler
        onGestureEvent={handleGesture}
        onHandlerStateChange={handleStateChange}
      >
        <Animated.View style={[styles.container, { transform: [{ translateY: pan.y }] }]}>
          <View style={styles.arrowContainer}>
            <Animated.View style={{ opacity: arrowOpacity }}>
              <Icon name="arrow-down" size={24} color="#ffcc00" />
            </Animated.View>
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
        </Animated.View>
      </PanGestureHandler>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
  },
  arrowContainer: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
  },
  greetingBox: {
    backgroundColor: '#CAC3C3',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
    marginTop: 50,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  queueText: {
    fontSize: 18,
    fontWeight: '500',
  },
  tasksWrapper: {
    flex: 1,
  },
  taskItem: {
    backgroundColor: '#1c1c1c',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  taskWithResponse: {
    backgroundColor: 'green',
  },
  taskWithoutResponse: {
    backgroundColor: 'yellow',
  },
  selectedTaskItem: {
    backgroundColor: '#333',
    borderColor: '#ffcc00',
    borderWidth: 2,
  },
  taskName: {
    fontSize: 16,
    color: 'white',
  },
  taskWithResponseText: {
    color: 'white',
  },
  taskWithoutResponseText: {
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