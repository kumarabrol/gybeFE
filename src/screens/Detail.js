import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Text, StyleSheet, View, TouchableOpacity, ActivityIndicator, FlatList, Animated } from 'react-native';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/Ionicons'; // Use 'Ionicons' or another icon set

const DRAG_THRESHOLD = 50;

const DetailScreen = ({ navigation, route }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(true);


  const pan = useRef(new Animated.ValueXY()).current;
  const arrowOpacity = useRef(new Animated.Value(1)).current;
  const [assignmentId, setAssignmentId] = useState(null);

  const fetchTasks = useCallback(async () => {
    try {
    const { assignmentId, instructions } = route.params
    console.log('assignmentId...',assignmentId)
      const response = await axios.get(`https://gbapidev.yellowmushroom-4d501d6c.westus.azurecontainerapps.io/api/Assignment/AssignmentTasksNew/${assignmentId}`);
      
      console.log('Raw API response:', JSON.stringify(response.data, null, 2));
      
      const fetchedTasks = response.data.tasks.map(task => ({
        id: task.inputFormTaskID.toString(),
        name: task.name,
        status: 0, // Assuming 0 represents an uncompleted task
        fields: task.fields,
      }));
       setAssignmentId(response.data.name);
      
      console.log('Processed tasks:', JSON.stringify(fetchedTasks, null, 2));
      setTasks(fetchedTasks);
      setError(null);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError('Failed to fetch tasks. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useFocusEffect(
    useCallback(() => {
      console.log('Screen focused. Route params:......', route.params);
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

  const handleTaskPress = (taskId) => {
    if (tasks.find(task => task.id === taskId).status !== 3) {
      setSelectedTaskId(taskId);
    }
  };

  const handleStartPress = (taskId) => {
    const selectedTask = tasks.find(task => task.id === taskId);
    const { assignmentId } = route.params
    console.log('assignmentId in details...',route.params)
    if (selectedTask && selectedTask.status !== 3) {
      setSelectedTaskId(taskId);
      navigation.navigate('Task-Details', {
        assignmentId: assignmentId,
      });
    }
  };

 /* const handleStartPress = (taskId) => {
    if (selectedTaskId) {
       //const selectedTask = tasks.find(task => task.id === taskId);
      const selectedTask = tasks.find(task => task.id === selectedTaskId);
      navigation.navigate('Task-Details', {
        taskId: selectedTaskId,
        fields: selectedTask.fields,
      });
    }

    if (tasks.find(task => task.id === taskId).status !== 3) {
      setSelectedTaskId(taskId);
    }
  };*/

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
    console.info('item at line 148..', item.id)
    return (
      <TouchableOpacity
        style={[
          styles.taskItem,
          hasResponse && styles.taskWithResponse, // Green for tasks with responses
          !hasResponse && styles.taskWithoutResponse, // Yellow for tasks without responses
          item.status === 3 && styles.completedTaskItem, // For completed tasks
          item.id === selectedTaskId && styles.selectedTaskItem // Highlight selected task
        ]}
        onPress={() => handleStartPress(item.id)}
        //disabled={hasResponse || item.status === 3} // Disable if the task has response or is completed
      >
        <Text style={[
          styles.taskName,
          hasResponse && styles.taskWithResponseText,
          !hasResponse && styles.taskWithoutResponseText,
          item.status === 3 && styles.completedTaskName // Line-through for completed tasks
        ]}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.container}>
          <ActivityIndicator size="large" color="#ffcc00" />
        </View>
      );
    }

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
          <Icon name="arrow-down" size={24} color="#ffcc00" />
        </View>
        <View style={styles.greetingBox}>
          <Text style={styles.greeting}>{assignmentId ? `${assignmentId}` : 'there'}!</Text>
          <Text style={styles.queueText}>Please complete following tasks :</Text>
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
  taskWithResponse: {
    backgroundColor: 'green', // Green for tasks with response
  },
  taskWithoutResponse: {
    backgroundColor: 'yellow', // Yellow for tasks without response
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
    color: 'white', // White text for tasks with response
  },
  taskWithoutResponseText: {
    color: 'black', // Black text for tasks without response
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
