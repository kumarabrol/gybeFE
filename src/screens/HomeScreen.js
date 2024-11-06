import React, { useState } from 'react';
import { TouchableOpacity,Button, View, StyleSheet ,TextInput, Text,Image,Dimensions  } from 'react-native';
import packageJson from '../../package.json';
import appJson from '../../app.json';
import * as WebBrowser from 'expo-web-browser';
import {
  exchangeCodeAsync,
  makeRedirectUri,
  useAuthRequest,
  useAutoDiscovery,
} from 'expo-auth-session';

import { authConfig } from './authConfig';


WebBrowser.maybeCompleteAuthSession();

const { width: screenWidth } = Dimensions.get('window');
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
/*
const [username, setUsername] = useState('');
const [password, setPassword] = useState('');
const handleSignIn = async () => {

    try {
    console.log('Username:', username);
    console.log('Password:', password);
 
      navigation.navigate('Assignments'); 
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
          navigation.navigate('Assignments'); // Navigate to the next screen
        }).catch((error) => {
          console.error('Failed to exchange code:', error);
        });
      }
    }).catch((error) => {
      console.error('Failed to prompt:', error);
    });
  };
  return (
    <View style={styles.container}>
      <Image
        source={require('./assets/safeboatslogo.png')} 
        style={styles.image}
      />
      <TouchableOpacity style={styles.button} onPress={handleSignIn}  disabled={!request} >
        <Text style={styles.buttonText}>Enter</Text>
      </TouchableOpacity>
      <View style={styles.rowContainer}>
        <Text style={styles.versionText}>App Version: {appJson.expo.version}</Text>
        <View style={styles.logoContainer}>
          <Image
            source={require('./assets/gybelogo.png')} 
            style={styles.logo}
          />
        </View>
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
      width: screenWidth * 1,  
      height: screenWidth * 0.5, 
      resizeMode: 'contain',     
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
        width: screenWidth * 0.7, 
        paddingVertical: 15, 
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
      rowContainer: {
        position: 'absolute',
        bottom: 10,
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,              
      },
      versionText: {                 
        alignSelf: 'center',
        fontSize: 12,
        color: '#333',
        },
        logoContainer: {
         
        },
        logo: {
          width: 50, 
          height: 50, 
          resizeMode: 'contain',
        },
});

export default HomeScreen;