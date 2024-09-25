import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './src/screens/HomeScreen'; // Adjust the path as necessary
import TaskScreen from './src/screens/TaskScreen';
import TaskDatailScreen from './src/screens/TaskDetailScreen';
import DetailScreen from './src/screens/Detail';                           

const Stack = createStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Gybe" component={HomeScreen} />
        <Stack.Screen name="Assignments" component={TaskScreen} />
        <Stack.Screen name="Task" component={DetailScreen} />
        <Stack.Screen name="Task-Details" component={TaskDatailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;