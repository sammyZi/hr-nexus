import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'access_token';
const ORG_ID_KEY = 'organization_id';
const USER_KEY = 'user_data';

export const storage = {
  // Token management
  async setToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      // Decode JWT to extract organization_id
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.organization_id) {
        await SecureStore.setItemAsync(ORG_ID_KEY, payload.organization_id);
      }
    } catch (error) {
      console.error('Error storing token:', error);
    }
  },

  async getToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  },

  async removeToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(ORG_ID_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
    } catch (error) {
      console.error('Error removing token:', error);
    }
  },

  // Organization ID
  async getOrganizationId(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(ORG_ID_KEY);
    } catch (error) {
      console.error('Error getting organization ID:', error);
      return null;
    }
  },

  // User data
  async setUser(user: any): Promise<void> {
    try {
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Error storing user:', error);
    }
  },

  async getUser(): Promise<any | null> {
    try {
      const userData = await SecureStore.getItemAsync(USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  },

  // Check authentication
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  },
};
