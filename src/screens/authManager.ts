import * as AuthSession from 'expo-auth-session';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Azure AD Configuration
const config = {
  clientId: '5271376c-3a90-43bf-bdfd-4ef45fe68031',
  redirectUri: AuthSession.makeRedirectUri({

  }),
  scopes: ['openid', 'profile', 'email', 'offline_access', 'User.Read'],
  responseType: 'token', 
  authorizationEndpoint: 'https://login.microsoftonline.com/organizations/oauth2/v2.0/authorize',
  tokenEndpoint: 'https://login.microsoftonline.com/organizations/oauth2/v2.0/token',
};

export class AuthManager {
  static signInAsync = async () => {
    try {
      console.log('Redirect URI:', config.redirectUri);

      console.log('Signing in...');
     
      // Create a discovery document
      const discovery = {
        authorizationEndpoint: config.authorizationEndpoint,
        tokenEndpoint: config.tokenEndpoint,
      };

      // Create an authorization request
      const authRequest = new AuthSession.AuthRequest({
        clientId: config.clientId,
        redirectUri: config.redirectUri,
        scopes: config.scopes,
        responseType: config.responseType,
        // Remove authorizationEndpoint from here
      });

      // Start the authorization flow
      const result = await authRequest.promptAsync(discovery);

      if (result.type === 'success' && result.authentication?.accessToken) {
        console.log('Authorization result:', result);
        // Store tokens and expiration date
        await AsyncStorage.setItem('accessToken', result.authentication.accessToken);
        // Handle token expiration based on the result
        const expiresIn = result.authentication.expiresIn
          ? (result.authentication.expiresIn * 1000) + new Date().getTime()
          : new Date().getTime() + (60 * 60 * 1000); // Default to 1 hour if expiration not provided
        await AsyncStorage.setItem('expireTime', expiresIn.toString());
        return result;
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      console.error('Sign-in failed', error);
      throw error;
    }
  };

}
