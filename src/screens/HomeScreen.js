import React, { useState } from 'react';
import { Button, View, StyleSheet ,TextInput, Text } from 'react-native';
// import { AuthManager } from './authManager'; // Adjust the path as necessary
import packageJson from '../../package.json';

const HomeScreen = ({ navigation }) => {

const [username, setUsername] = useState('');
const [password, setPassword] = useState('');
const handleSignIn = async () => {

    try {
    console.log('Username:', username);
    console.log('Password:', password);
      // const result = await AuthManager.signInAsync();
      // console.log('Sign-in result:', result);
      navigation.navigate('Assignments'); // Navigate to the next screen
    } catch (error) {
      console.error('Sign-in failed:', error);
    }
  };

  return (
    <View style={styles.container}>
        <Text style={styles.greeting}>Welcome to Gybe</Text>
        
      <Button title="Enter" onPress={handleSignIn} />
      <Text style={styles.versionText}>App Version: {packageJson.version}</Text>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    input: {
      width: '100%',
      height: 40,
      borderColor: 'gray',
      borderWidth: 1,
      borderRadius: 5,
      marginBottom: 10,
      paddingHorizontal: 10,
    },
    greetingBox: {
          backgroundColor: '#CAC3C3',
          padding: 20,
          borderRadius: 10,
          marginBottom: 20,
          alignItems: 'center',
        },
     greeting: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
      },
      versionText: {
          fontSize: 16,
          marginTop: 20,
        },
});

export default HomeScreen;