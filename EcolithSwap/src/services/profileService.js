import apiService from './api';
import { offlineService } from './offline';

class ProfileService {
  // Get user profile
  async getProfile(userId) {
    try {
      const response = await apiService.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Get profile error:', error);
      return await offlineService.getProfile(userId);
    }
  }

  // Update user profile
  async updateProfile(profileData) {
    try {
      const response = await apiService.put('/auth/profile', profileData);
      
      // Save updated profile offline
      await offlineService.saveProfile(response.data);
      
      return response.data;
    } catch (error) {
      console.error('Update profile error:', error);
      
      // Save offline for later sync
      await offlineService.saveProfileUpdate(profileData);
      throw error;
    }
  }

  // Upload profile photo
  async uploadProfilePhoto(imageUri) {
    try {
      const formData = new FormData();
      formData.append('avatar', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'profile.jpg',
      });
      
      const response = await apiService.uploadFile('/files/profile-avatar', formData);
      return response.data;
    } catch (error) {
      console.error('Upload profile photo error:', error);
      throw error;
    }
  }

  // Update notification preferences
  async updateNotificationPreferences(preferences) {
    try {
      const response = await apiService.patch('/auth/notifications', preferences);
      return response.data;
    } catch (error) {
      console.error('Update notification preferences error:', error);
      throw error;
    }
  }

  // Update vehicle information
  async updateVehicleInfo(vehicleData) {
    try {
      const response = await apiService.patch('/auth/vehicle', vehicleData);
      return response.data;
    } catch (error) {
      console.error('Update vehicle info error:', error);
      throw error;
    }
  }

  // Get user activity history
  async getUserActivity(userId, period = '30d') {
    try {
      const response = await apiService.get(`/profiles/${userId}/activity`, { period });
      return response.data;
    } catch (error) {
      console.error('Get user activity error:', error);
      return null;
    }
  }

  // Get user statistics
  async getUserStats(userId) {
    try {
      const response = await apiService.get(`/profiles/${userId}/stats`);
      return response.data;
    } catch (error) {
      console.error('Get user stats error:', error);
      return await offlineService.getUserStats(userId);
    }
  }

  // Get points history
  async getPointsHistory(userId, params = {}) {
    try {
      const response = await apiService.get(`/profiles/${userId}/points/history`, params);
      return response.data;
    } catch (error) {
      console.error('Get points history error:', error);
      return await offlineService.getPointsHistory(userId);
    }
  }

  // Redeem points
  async redeemPoints(userId, pointsAmount, rewardType) {
    try {
      const response = await apiService.post(`/profiles/${userId}/points/redeem`, {
        points_amount: pointsAmount,
        reward_type: rewardType
      });
      return response.data;
    } catch (error) {
      console.error('Redeem points error:', error);
      throw error;
    }
  }

  // Update password
  async updatePassword(currentPassword, newPassword) {
    try {
      const response = await apiService.patch('/auth/change-password', {
        currentPassword,
        newPassword
      });
      return response.data;
    } catch (error) {
      console.error('Update password error:', error);
      throw error;
    }
  }

  // Delete account
  async deleteAccount(password) {
    try {
      const response = await apiService.delete('/auth/account', {
        password
      });
      return response.data;
    } catch (error) {
      console.error('Delete account error:', error);
      throw error;
    }
  }

  // Request data export
  async requestDataExport() {
    try {
      const response = await apiService.post('/auth/export-data');
      return response.data;
    } catch (error) {
      console.error('Request data export error:', error);
      throw error;
    }
  }

  // Sync offline profile updates
  async syncOfflineUpdates() {
    try {
      const offlineUpdates = await offlineService.getOfflineProfileUpdates();
      
      for (const update of offlineUpdates) {
        await this.updateProfile(update.data);
        await offlineService.removeOfflineProfileUpdate(update.id);
      }
      
      return true;
    } catch (error) {
      console.error('Sync offline profile updates error:', error);
      return false;
    }
  }
}

// Create and export a singleton instance
const profileService = new ProfileService();
export default profileService;
