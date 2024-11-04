import * as React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, TextInput, Alert, Dimensions, Keyboard, Animated, Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Ionicons'
import HomeScreen from './src/screens/HomeScreen'; // Adjust the path as necessary
import TaskScreen from './src/screens/TaskScreen';
import TaskDatailScreen from './src/screens/TaskDetailScreen';
import DetailScreen from './src/screens/Detail';        
import CustomHeader from './src/screens/CustomAssignmentHeader';    
import Immersive from 'react-native-immersive';
            

const Stack = createStackNavigator();

function App() {
  return (
    <View style={styles.container}>
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,  // Hide header if it's not needed
          headerStyle: { height: 0 },
        }}
      >
        <Stack.Screen name="Gybe" component={HomeScreen} options={{
            headerTitle: () => null, // Use the custom header
          }} />
        <Stack.Screen
          name="Assignments"
          component={TaskScreen}
          options={{
            headerTitle: () => null, // Use the custom header
            headerStyle: {
              backgroundColor: '#000',  // You can customize the header background color here
            },
          }}
        />
        <Stack.Screen name="Task" component={DetailScreen} options={{
            headerTitle: () => null, // Use the custom header
            headerStyle: {
              backgroundColor: '#000',  // You can customize the header background color here
            },
          }}/>
        <Stack.Screen name="Task-Details" component={TaskDatailScreen} options={{
            headerTitle: () => null, // Use the custom header
            headerStyle: {
              backgroundColor: '#000',  // You can customize the header background color here
            },
          }}/>
      </Stack.Navigator>
    </NavigationContainer>
    </View>
  );
}

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,        // Make sure the view takes the full height
    borderColor: 'black',  
  },
});