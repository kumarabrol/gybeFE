import React, { useState } from 'react';
import { TouchableOpacity,Button, View, StyleSheet ,TextInput, Text,Image,Dimensions  } from 'react-native';
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
        source={require('./assets/safeboatslogo.png')} // Replace with your actual image path
        style={styles.image}
      />
      <TouchableOpacity style={styles.button} onPress={handleSignIn}>
        <Text style={styles.buttonText}>Enter</Text>
      </TouchableOpacity>
      <Text style={styles.versionText}>App Version: {appJson.expo.version}</Text>
      <View style={styles.logoContainer}>
        <Image
          source={require('./assets/gybelogo.png')} // Replace with the actual path of gybelogo.png
          style={styles.logo}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 0,
      marginTop:0,
      borderColor: 'black',
    },
    input: {
      width: '100%',
      borderColor: 'gray',
      borderWidth: 1,
      borderRadius: 5,
      marginBottom: 10,
      paddingHorizontal: 10,
    },
    image: {
      width: screenWidth * 1,  // 90% of screen width
      height: screenWidth * 0.5, // Adjust height proportionally
      resizeMode: 'contain',     // Ensures the image scales properly
      marginBottom: 20,
    },
    greetingBox: {
          backgroundColor: '#CAC3C3',
          padding: 0,
          borderRadius: 10,
          marginBottom: 20,
          alignItems: 'center',
        },
     greeting: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
      },
       button: {
        backgroundColor: '#ffcc00',
        width: screenWidth * 0.7, // 70% of screen width
        paddingVertical: 15, // Adjust vertical padding to make the button larger
        borderRadius: 10,
        alignItems: 'center',
        marginVertical: 20,
        fontSize:24,

      },
      buttonText: {
        color: 'black',
        fontSize: 24,
        fontWeight: 'bold',
        textTransform: 'uppercase',
      },
      versionText: {
        fontSize: 12,
        position: 'absolute',
        bottom: 30,       // Distance from the bottom of the screen
        textAlign: 'center',
        },
        logoContainer: {
          position: 'absolute',
          bottom: 20,
          right: 20,
          padding: 5, // Adds padding around the logo
          borderRadius: 10, // Rounded corners; increase for a circular effect
        },
        logo: {
          width: 50, // Adjust width
          height: 50, // Adjust height
          resizeMode: 'contain',
        },
});

export default HomeScreen;