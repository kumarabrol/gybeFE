import React, { useState, useCallback } from "react";
import {
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  ScrollView,
  Image,
  StatusBar 
} from "react-native";
import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@assignments_cache';
const LAST_UPDATED_KEY = '@assignments_last_updated';

const AssignmentTypeIcon = ({ type }) => {
  let iconSource;
  switch (type) {
    case 0: // Checklist
      iconSource = require("./assets/checklisticon.png");
      break;
    case 1: // Instructions
      iconSource = require("./assets/instructionicon.png");
      break;
    case 2: // Alert
      iconSource = require("./assets/alerticon.png");
      break;
    case 3: // Ticket
      iconSource = require("./assets/ticket.png");
      break;
  }
  return <Image source={iconSource} style={styles.assignmentIcon} />;
};

const AssignmentItem = ({ item, onPress, isSelected, isCompleted }) => (
  <TouchableOpacity
    style={[
      styles.assignmentItem,
      isCompleted && styles.completedAssignmentItem,
      isSelected,
    ]}
    onPress={onPress}
    disabled={isCompleted}
  >
    <View style={styles.assignmentContent}>
      <AssignmentTypeIcon type={item.assignmentType} />
      <View style={styles.assignmentTextContainer}>
        <Text
          style={[
            styles.assignmentName,
            isCompleted && styles.completedAssignmentInstructions,
          ]}
        >
          {item.name}
        </Text>
      </View>
    </View>
  </TouchableOpacity>
);

const TaskScreen = ({ navigation }) => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const toggleConnection = () => setIsOnline(!isOnline);

  const storeData = async (data) => {
    try {
      const jsonValue = JSON.stringify(data);
      await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
      const timestamp = new Date().toISOString();
      await AsyncStorage.setItem(LAST_UPDATED_KEY, timestamp);
      setLastUpdated(timestamp);
    } catch (e) {
      console.error('Error saving data:', e);
    }
  };

  const getStoredData = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
      const timestamp = await AsyncStorage.getItem(LAST_UPDATED_KEY);
      setLastUpdated(timestamp);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e) {
      console.error('Error reading data:', e);
      return null;
    }
  };

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    try {
      if (isOnline) {
        // Try to fetch from API
        const response = await axios.get(
          "https://gbapidev.yellowmushroom-4d501d6c.westus.azurecontainerapps.io/api/Assignment/Assignments/9"
        );
        
        const fetchedAssignments = response.data.map((assignment) => ({
          id: assignment.assignmentId.toString(),
          name: assignment.name,
          assignmentType: assignment.assignmentType,
          tasks: assignment.tasks[0]?.fields.find(
            (field) => field.fieldLabel === "Instruction:"
          )?.detail ||
          assignment.tasks[0]?.fields.find(
            (field) => field.fieldLabel === "Description:"
          )?.detail ||
          "No instructions available",
          tasks: assignment.tasks,
        }));

        // Store the fetched data
        await storeData(fetchedAssignments);
        setAssignments(fetchedAssignments);
      } else {
        // Try to load from storage when offline
        const storedAssignments = await getStoredData();
        if (!storedAssignments) {
          throw new Error("No stored assignments available. Please connect to the internet to fetch assignments.");
        }
        setAssignments(storedAssignments);
      }
      setError(null);
    } catch (error) {
      console.error("Error fetching assignments:", error.stack);
      // If online fetch fails, try to fall back to stored data
      if (isOnline) {
        const storedAssignments = await getStoredData();
        if (storedAssignments) {
          setAssignments(storedAssignments);
          setError("Could not fetch new assignments. Showing cached data.");
        } else {
          setError("Could not fetch assignments. Please check your internet connection.");
        }
      } else {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  }, [isOnline]);

  React.useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments, isOnline]);

  const handleStartPress = useCallback(
    (assignmentId) => {
      const selectedAssignment = assignments.find(
        (assignment) => assignment.id === assignmentId
      );
  
      if (selectedAssignment) {
        setSelectedAssignmentId(assignmentId);
        if (selectedAssignment.tasks.length === 1) {
          navigation.navigate("Task-Details", {
            assignmentId: assignmentId,
            detailedData: selectedAssignment,
            alltasks: selectedAssignment.tasks
          });
        } else {
          navigation.navigate("Task", {
            assignmentId: assignmentId,
            name: selectedAssignment.name,
            instructions: selectedAssignment.instructions,
            type: selectedAssignment.assignmentType,
            tasks: selectedAssignment.tasks,
          });
        }
      }
    },
    [assignments, navigation]
  );

  const renderAssignment = ({ item }) => (
    <AssignmentItem
      item={item}
      onPress={() => handleStartPress(item.id)}
      isSelected={item.id === selectedAssignmentId}
      isCompleted={item.status === 3}
    />
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="black" />
        <Text style={styles.loadingText}>It is going to be a busy day</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Image
          source={require('./assets/left-arrow.png')}
          style={styles.backButtonImage}
        />
      </TouchableOpacity>
      <View style={styles.headerContainer}>
        <View style={styles.greetingBox}>
          <Text style={styles.greeting}>Hi Terry!</Text>
          <Text style={styles.queueText}>Pending Assignments are:</Text>
          {lastUpdated && (
            <Text style={styles.lastUpdated}>
              Last updated: {new Date(lastUpdated).toLocaleString()}
            </Text>
          )}
          {error && <Text style={styles.errorBanner}>{error}</Text>}
        </View>
      </View>
      <FlatList
        style={styles.assignmentsWrapper}
        data={assignments}
        renderItem={renderAssignment}
        keyExtractor={(item) => item.id}
      />
      <TouchableOpacity 
        style={[
          styles.connectionToggle,
          { backgroundColor: isOnline ? '#4CAF50' : '#F44336' }
        ]}
        onPress={toggleConnection}
      >
        <Text style={styles.connectionToggleText}>
          {isOnline ? 'Online' : 'Offline'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  backButton: {top: 0, // Adjust this to position the button vertically
    left: 20, // Adjust this to position the button horizontally
    zIndex: 1, // Ensure the button is above other elements
  },
  backButtonImage: {
    width: 67, // Adjust width as needed
    height: 67, // Adjust height as needed
  },
  greetingBox: {
    backgroundColor: "#CAC3C3",
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: "center",
    width: "100%"
  },
  loadingText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
    marginTop: 10,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  queueText: {
    fontSize: 18,
    fontWeight: "500",
  },
  assignmentsWrapper: {
    flex: 1,
  },
  assignmentItem: {
    backgroundColor: "#1c1c1c",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  completedAssignmentItem: {
    backgroundColor: "#2a2a2a",
    opacity: 0.7,
  },
  assignmentContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  assignmentTextContainer: {
    flex: 1,
  },
  assignmentName: {
    fontSize: 24,
    color: "white",
    marginLeft: 10,
  },
  completedAssignmentInstructions: {
    color: "#888",
    textDecorationLine: "line-through",
  },
  assignmentIcon: {
    width: 25,
    height: 22,
    marginRight: 10,
  },
  errorText: {
    color: "red",
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
  },
  retryButton: {
    backgroundColor: "#ffcc00",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  toggleButton: {
    padding: 10,
    borderRadius: 5,
    minWidth: 100,
    alignItems: "center",
  },
  toggleButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  lastUpdated: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  errorBanner: {
    color: '#F44336',
    fontSize: 14,
    marginTop: 5,
    textAlign: 'center',
  },
  connectionToggle: {
    position: 'absolute',
    right: 20,
    top: 20,
    padding: 8,
    borderRadius: 20,
    zIndex: 1,
  },
  connectionToggleText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default TaskScreen;