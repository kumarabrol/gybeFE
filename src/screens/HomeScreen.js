import React, { useState } from 'react';
import { Button, View, StyleSheet ,TextInput, Text,Image,Dimensions  } from 'react-native';
import packageJson from '../../package.json';
import appJson from '../../app.json';

const { width: screenWidth } = Dimensions.get('window');
const HomeScreen = ({ navigation }) => {

const [username, setUsername] = useState('');
const [password, setPassword] = useState('');
const handleSignIn = async () => {

    try {
    console.log('Username:', username);
    console.log('Password:', password);
 
      navigation.navigate('Assignments'); // Navigate to the next screen
    } catch (error) {
      console.error('Sign-in failed:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('./assets/Medley.jpeg')} // Replace with your actual image path
        style={styles.image}
      />
        <Text style={styles.greeting}>Welcome to Gybe</Text>
        
      <Button title="Enter" onPress={handleSignIn} />
      <Text style={styles.versionText}>App Version: {appJson.expo.version}</Text>

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
    image: {
      width: screenWidth * 0.9,  // 90% of screen width
      height: screenWidth * 0.5, // Adjust height proportionally
      resizeMode: 'contain',     // Ensures the image scales properly
      marginBottom: 20,
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
        position: 'absolute',
        bottom: 20,       // Distance from the bottom of the screen
        textAlign: 'center',
        },
});

export default HomeScreen;