import React, { useState } from 'react';
import { TouchableOpacity,Button, View, StyleSheet ,TextInput, Text,Image,Dimensions  } from 'react-native';
import packageJson from '../../package.json';
import appJson from '../../app.json';
import * as WebBrowser from 'expo-web-browser';
import { openAuthSessionAsync } from 'expo-web-browser';
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
//console.log('Redirect URI:', redirectUri);
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

const decodeJWT = (token) => {
  const base64Url = token.split('.')[1];
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  
  // Add padding if necessary
  switch (base64.length % 4) {
    case 2:
      base64 += '==';
      break;
    case 3:
      base64 += '=';
      break;
  }

  const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));

  return JSON.parse(jsonPayload);
};

const fetchEmployeeDetails = async (oid) => {
  try {
    const response = await fetch(`https://gbapidev.yellowmushroom-4d501d6c.westus.azurecontainerapps.io/api/Employee/external/${oid}`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    return { employeeId: data.employeeId, firstName: data.firstName };
  } catch (error) {
    console.error('Failed to fetch employee ID:', error);
    throw error;
  }
};

  const handleSignIn = async () => {
    console.log('Sign-in button pressed');
    promptAsync().then((codeResponse) => {
      if (request && codeResponse?.type === 'success' && discovery) {
        //console.log('Authorization code: ', codeResponse.params.code);

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
        ).then(async (res) => {
          //console.log('Access token: ', res.accessToken);
          setToken(res.accessToken);
          // Decode the access token
          const decodedToken = decodeJWT(res.accessToken);
          //console.log('Decoded token:', decodedToken);

          // Fetch and print the oid
          const oid = decodedToken.oid;
          //console.log('OID:', oid);
          const { employeeId, firstName } = await fetchEmployeeDetails(oid);
          //console.log('Employee ID:', employeeId);
          //console.log('First Name:', firstName);

          // Pass employeeId, firstName, and accessToken to Assignments screen
          navigation.navigate('Assignments', { employeeId, firstName, accessToken: res.accessToken });
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