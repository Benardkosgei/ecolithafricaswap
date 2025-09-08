import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
// Use production backend URL for Railway deployment
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api' 
  : 'https://ecolithswap-backend-production.up.railway.app/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = null;
  }

  // Set authentication token
  setAuthToken(token) {
    this.token = token;
  }

  // Get stored token from AsyncStorage
  async getStoredToken() {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        this.token = token;
      }
      return token;
    } catch (error) {
      console.error('Error getting stored token:', error);
      return null;
    }
  }

  // Store token in AsyncStorage
  async storeToken(token) {
    try {
      await AsyncStorage.setItem('authToken', token);
      this.setAuthToken(token);
    } catch (error) {
      console.error('Error storing token:', error);
    }
  }

  // Remove token from AsyncStorage
  async removeToken() {
    try {
      await AsyncStorage.removeItem('authToken');
      this.token = null;
    } catch (error) {
      console.error('Error removing token:', error);
    }
  }

  // Make API request with authentication
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // Add authorization header if token exists
    if (this.token) {
      defaultOptions.headers.Authorization = `Bearer ${this.token}`;
    }

    const requestOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, requestOptions);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Request error:', error);
      throw error;
    }
  }

  // GET request
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    
    return this.makeRequest(url, {
      method: 'GET',
    });
  }

  // POST request
  async post(endpoint, data = {}) {
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT request
  async put(endpoint, data = {}) {
    return this.makeRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // PATCH request
  async patch(endpoint, data = {}) {
    return this.makeRequest(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete(endpoint) {
    return this.makeRequest(endpoint, {
      method: 'DELETE',
    });
  }

  // Upload file
  async uploadFile(endpoint, file, additionalData = {}) {
    const formData = new FormData();
    formData.append('file', file);
    
    Object.keys(additionalData).forEach(key => {
      formData.append(key, additionalData[key]);
    });

    return this.makeRequest(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;