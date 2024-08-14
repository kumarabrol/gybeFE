import React from 'react';
import { Button, View, StyleSheet } from 'react-native';
import { AuthManager } from './authManager'; // Adjust the path as necessary

const HomeScreen = ({ navigation }) => {
  const handleSignIn = async () => {
    try {
      const result = await AuthManager.signInAsync();
      console.log('Sign-in result:', result);
      navigation.navigate('Task'); // Navigate to the next screen
    } catch (error) {
      console.error('Sign-in failed:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Button title="Sign In" onPress={handleSignIn} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default HomeScreen;
