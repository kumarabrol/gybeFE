import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './src/screens/HomeScreen'; // Adjust the path as necessary
import TaskScreen from './src/screens/TaskScreen';
import TaskDatailScreen from './src/screens/TaskDetailScreen';

const Stack = createStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Task" component={TaskScreen} />
        <Stack.Screen name="TaskDetail" component={TaskDatailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;