import AsyncStorage from '@react-native-async-storage/async-storage';
import { authorize, refresh, AuthConfiguration } from 'react-native-app-auth';
import { AuthConfig } from '../../authConfig';

const config: AuthConfiguration = {
  clientId: AuthConfig.appId,
  redirectUrl: 'https://login.microsoftonline.com/common/oauth2/nativeclient',
  scopes: AuthConfig.appScopes,
  additionalParameters: { prompt: 'select_account' },
  serviceConfiguration: {
    authorizationEndpoint: 'https://login.microsoftonline.com/444f5a79-d01d-4ae0-956f-de57f3e55942/oauth2/v2.0/authorize',
    tokenEndpoint: 'https://login.microsoftonline.com/444f5a79-d01d-4ae0-956f-de57f3e55942/oauth2/v2.0/token',
  },
};

export class AuthManager {
  static signInAsync = async () => {
    try {
      const result = await authorize(config);
      console.log(result.accessToken);

      // Store the access token, refresh token, and expiration time in storage
      await AsyncStorage.setItem('userToken', result.accessToken);
      await AsyncStorage.setItem('refreshToken', result.refreshToken);
      await AsyncStorage.setItem('expireTime', result.accessTokenExpirationDate);
    } catch (error) {
      console.error('Sign-in failed', error);
    }
  };

  static signOutAsync = async () => {
    try {
      // Clear storage
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('expireTime');
    } catch (error) {
      console.error('Sign-out failed', error);
    }
  };

  static getAccessTokenAsync = async () => {
    try {
      const expireTime = await AsyncStorage.getItem('expireTime');

      if (expireTime !== null) {
        // Get expiration time - 5 minutes
        const expire = new Date(new Date(expireTime).getTime() - 5 * 60 * 1000);
        const now = new Date();

        if (now >= expire) {
          // Expired, refresh
          console.log('Refreshing token');
          const refreshToken = await AsyncStorage.getItem('refreshToken');
          console.log(`Refresh token: ${refreshToken}`);
          const result = await refresh(config, {
            refreshToken: refreshToken || '',
          });

          // Store the new access token, refresh token, and expiration time in storage
          await AsyncStorage.setItem('userToken', result.accessToken);
          await AsyncStorage.setItem('refreshToken', result.refreshToken || '');
          await AsyncStorage.setItem('expireTime', result.accessTokenExpirationDate);

          return result.accessToken;
        }

        // Not expired, just return saved access token
        const accessToken = await AsyncStorage.getItem('userToken');
        return accessToken;
      }

      return null;
    } catch (error) {
      console.error('Failed to get access token', error);
      return null;
    }
  };
}
