import React, { useState } from 'react';
import { Button, View, StyleSheet ,TextInput, Text } from 'react-native';
// import { AuthManager } from './authManager'; // Adjust the path as necessary
import packageJson from '../../package.json';
/* Auth ref - https://docs.expo.dev/guides/authentication/#azure */
import * as WebBrowser from 'expo-web-browser';
import {
  exchangeCodeAsync,
  makeRedirectUri,
  useAuthRequest,
  useAutoDiscovery,
} from 'expo-auth-session';
import { openAuthSessionAsync } from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const HomeScreen = ({ navigation }) => {

/* Auth */
// Endpoint
const b2cname = 'gybeb2cdev';
const policyName = 'B2C_1_signupsignin1';
const scheme = 'rnstarter';

const discovery = useAutoDiscovery(
  'https://' + b2cname + '.b2clogin.com/' + b2cname + '.onmicrosoft.com/' + policyName + '/v2.0'
);

const redirectUri = makeRedirectUri({
  scheme: scheme,
  path: 'com.devgybecloud.rnstarter/auth',
});
console.log('Redirect URI:', redirectUri);
const clientId = 'edb617eb-dce8-454a-a120-390b9da0096f';

// We store the JWT in here
const [token, setToken] = useState(null);

// Request
const [request, , promptAsync] = useAuthRequest(
  {
    clientId,
    scopes: ['openid', 'offline_access', `https://${b2cname}.onmicrosoft.com/api/resources`],
    redirectUri,
  },
  discovery,
);
/* Auth */

/*
const [username, setUsername] = useState('');
const [password, setPassword] = useState('');
const handleSignIn_old = async () => {

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
*/
const handleSignIn = async () => {
    console.log('Sign-in button pressed');
    promptAsync().then((codeResponse) => {
      if (request && codeResponse?.type === 'success' && discovery) {
        console.log('Authorization code: ', codeResponse.params.code);

        exchangeCodeAsync(
          {
            clientId,
            code: codeResponse.params.code,
            extraParams: request.codeVerifier
              ? { code_verifier: request.codeVerifier }
              : undefined,
            redirectUri,
          },
          discovery,
        ).then((res) => {
          console.log('Access token: ', res.accessToken);
          setToken(res.accessToken);
          console.log('Token:', token);
          navigation.navigate('Assignments'); // Navigate to the next screen
        }).catch((error) => {
          console.error('Failed to exchange code:', error);
        });
      }
    }).catch((error) => {
      console.error('Failed to prompt:', error);
    });
  };

  const handleSignOut = () => {
    console.log('Signing out...');
    const params = new URLSearchParams({
      client_id: clientId,
      post_logout_redirect_uri: redirectUri,
    });
    openAuthSessionAsync(discovery.endSessionEndpoint + '?' + params.toString(), redirectUri)
      .then((result) => {
        if (result.type !== 'success') {
          handleError(new Error('Please, confirm the logout request and wait for it to finish.'));
          console.error(result);
          return;
        }
      }).then(() => {
      console.log('Signed out');
    }).catch((error) => {
      console.error('Failed to sign out:', error);
    }).finally(() => {
      setToken(null);
    });
  };

  return (
    <View style={styles.container}>
        <Text style={styles.greeting}>Welcome to Gybe</Text>
        {/* <TextInput
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
            secureTextEntry={true} // For password input
          />
       */}
      <Button title="Sign In" onPress={handleSignIn} disabled={!request} />
      {/* new line */}
      <Text>&nbsp;</Text>
      <Button title='Sign Out' onPress={handleSignOut} disabled={!token} />
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
