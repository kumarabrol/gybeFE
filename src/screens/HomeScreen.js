import React from 'react';
import { Button, View } from 'react-native';
import { AuthManager } from './path/to/authManager'; // Adjust the import path as necessary

const HomeScreen = ({ navigation }) => {
  const handleSignIn = async () => {
    try {
      await AuthManager.signInAsync();
      // Navigate to the next screen or perform any other action after successful sign-in
    } catch (error) {
      console.error('Sign-in failed', error);
    }
  };

  return (
    <View>
      <Button title="Sign In" onPress={handleSignIn} />
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  welcome: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  button: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#007bff",
    borderRadius: 5,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
  },
});

export default HomeScreen;