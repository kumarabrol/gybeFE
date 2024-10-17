import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Text, StyleSheet, View, TouchableOpacity, FlatList, Animated } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/Ionicons';

const DRAG_THRESHOLD = 50;

const DetailScreen = ({ navigation, route }) => {
  const [tasks, setTasks] = useState([]);
  const [deviceId, setDeviceId] = useState(0);
  const [error, setError] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [assignmentName, setAssignmentName] = useState('');

  const pan = useRef(new Animated.ValueXY()).current;
  const arrowOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const { detailedData } = route.params;
    if (detailedData) {
      console.log('Detailed data from route params:', JSON.stringify(detailedData, null, 2));
      setAssignmentName(detailedData.name);
      setDeviceId(detailedData.deviceId);
      
      const processedTasks = detailedData.tasks.map(task => ({
        id: task.inputFormTaskID.toString(),
        name: task.name,
        status: 0, // Assuming 0 represents an uncompleted task
        fields: task.fields,
      }));
      
      console.log('Processed tasks:', JSON.stringify(processedTasks, null, 2));
      setTasks(processedTasks);
    } else {
      setError('No detailed data provided');
    }
  }, [route.params]);

  useFocusEffect(
    useCallback(() => {
      console.log('Screen focused. Route params:', route.params);
      if (route.params?.completedTaskId) {
        console.log('Completed task ID received:', route.params.completedTaskId);
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === route.params.completedTaskId
              ? { ...task, status: 3 } // Assuming 3 represents a completed task
              : task
          )
        );
        setSelectedTaskId(null);
      }
    }, [route.params?.completedTaskId])
  );

  const handleStartPress = (taskId) => {
    const selectedTask = tasks.find(task => task.id === taskId);
    const { assignmentId, instructions, type } = route.params;
    console.log(type);
    console.log(deviceId);
    console.log('assignmentId in details...', assignmentId);
    const { detailedData } = route.params;
    if (selectedTask && selectedTask.status !== 3) {
      setSelectedTaskId(taskId);
      navigation.navigate('Task-Details', {
        assignmentId: assignmentId,
        instructions: instructions,
        type: type,
        deviceId: deviceId,
        taskData: selectedTask,
        detailedData: detailedData
      });
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
    const hasResponse = item.fields.some(field => field.response.trim() !== "");
    return (
      <TouchableOpacity
        style={[
          styles.taskItem,
          hasResponse && styles.taskWithResponse,
          !hasResponse && styles.taskWithoutResponse,
          item.status === 3 && styles.completedTaskItem,
          item.id === selectedTaskId 
        ]}
        onPress={() => handleStartPress(item.id)}
      >
        <Text style={[
          styles.taskName,
          hasResponse && styles.taskWithResponseText,
          !hasResponse && styles.taskWithoutResponseText,
          item.status === 3 && styles.completedTaskName
        ]}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderContent = () => {
    if (error) {
      return (
        <View style={styles.container}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      );
    }

    return (
      <Animated.View 
        style={[
          styles.container,
          { transform: [{ translateY: pan.y }] }
        ]}
      >
      <View style={styles.arrowContainer}>
       <Icon  name="arrow-down" size={24} color="#ffcc00" />
      </View>
        <View style={styles.greetingBox}>
          <Text style={styles.greeting}>{assignmentName || 'Assignment'}</Text>
          <Text style={styles.queueText}>Please complete following tasks:</Text>
        </View>
        <FlatList
          style={styles.tasksWrapper}
          data={tasks}
          renderItem={renderTask}
          keyExtractor={item => item.id}
        />
       
      </Animated.View>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PanGestureHandler
        onGestureEvent={handleGesture}
        onHandlerStateChange={handleStateChange}
      >
        {renderContent()}
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
  completedTaskItem: {
    backgroundColor: '#2a2a2a',
    opacity: 0.7,
  },
 
  taskName: {
    fontSize: 16,
    color: 'white',
  },
  completedTaskName: {
    color: '#888',
    textDecorationLine: 'line-through',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  startButton: {
    flex: 1,
    backgroundColor: '#ffcc00',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#666',
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
});

export default DetailScreen;