// src/screens/DetailScreen.js
import React, { useState } from 'react';
import { Text, StyleSheet, View, TextInput, Alert,TouchableOpacity } from 'react-native';

const DetailScreen = ({navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = () => {
    Alert.alert('Submitted', `Username: ${username}\nPassword: ${password}`);
    // Add your submit logic here
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Welcome to the Detail Screen!</Text>
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {/* <Button title="Submit" onPress={handleSubmit} /> */}
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Task')}>
        <Text style={styles.buttonText}>Submit</Text>
      </TouchableOpacity>
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
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
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

export default DetailScreen;
