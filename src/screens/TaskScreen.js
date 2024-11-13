import React, { useState, useCallback } from "react";
import {
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  ScrollView,
  Image,StatusBar 
} from "react-native";
import axios from "axios";
import {AsyncStorage} from 'react-native';
import {
  exchangeCodeAsync,
  makeRedirectUri,
  useAuthRequest,
  useAutoDiscovery,
} from 'expo-auth-session';
import { openAuthSessionAsync } from 'expo-web-browser';

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

const TaskScreen = ({  route,navigation }) => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const { employeeId, accessToken, firstName } = route.params;
  const toggleConnection = () => setIsOnline(!isOnline);
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

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    try {
      let fetchedAssignments;
     // console.log('hello...');
     // console.log('Employee ID:', employeeId);
      if (isOnline) {
        const response = await axios.get(
          `https://gbapidev.yellowmushroom-4d501d6c.westus.azurecontainerapps.io/api/Assignment/Assignments/${employeeId}`,{
            headers: {
              Authorization: `Bearer ${accessToken}`
            }
          }
        );
        
        fetchedAssignments = response.data.map((assignment) => ({
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

       
      } else {
        fetchedAssignments = await getDataFromStorage("assignments");
        if (!fetchedAssignments) {
          throw new Error("No stored assignments available");
        }
      }
      setAssignments(fetchedAssignments);
      setError(null);
    } catch (error) {
      console.error("Error fetching assignments:", error.stack);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [isOnline]);

  React.useEffect(() => {
  
    fetchAssignments();
  }, [fetchAssignments, isOnline]);

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

  const handleStartPress = useCallback(
    (assignmentId) => {
      const selectedAssignment = assignments.find(
        (assignment) => assignment.id === assignmentId
      );
  
      if (selectedAssignment) {
        setSelectedAssignmentId(assignmentId);
        console.log(`assignmentId: ${assignmentId}`);
        console.log(selectedAssignment.tasks.length);
        // Check if the assignment has only one task
        if (selectedAssignment.tasks.length === 1) {
          // Navigate directly to TaskDetail screen
          navigation.navigate("Task-Details", {
            assignmentId: assignmentId,
            detailedData: selectedAssignment,
            alltasks: selectedAssignment.tasks
          });
        } else {
          // Navigate to Task screen for multiple tasks
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

  if (error) {
    return (
      <ScrollView style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchAssignments}>
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
       <StatusBar hidden={true} />
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
      <View style={styles.headerContainer}>
        <View style={styles.greetingBox}>
          <Text style={styles.greeting}>Hi {firstName}!</Text>
          <Text style={styles.queueText}>Pending Assignments are:</Text>
        </View>
      </View>
      <FlatList
        style={styles.assignmentsWrapper}
        data={assignments}
        renderItem={renderAssignment}
        keyExtractor={(item) => item.id}
      />
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
});

export default TaskScreen;
