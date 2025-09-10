// Offline service for handling data when network is unavailable
import AsyncStorage from '@react-native-async-storage/async-storage';

class OfflineService {
  // Profile offline storage
  async saveProfile(profileData) {
    try {
      await AsyncStorage.setItem('offline_profile', JSON.stringify(profileData));
    } catch (error) {
      console.error('Save offline profile error:', error);
    }
  }

  async getProfile(userId) {
    try {
      const data = await AsyncStorage.getItem('offline_profile');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Get offline profile error:', error);
      return null;
    }
  }

  async saveProfileUpdate(profileData) {
    try {
      const updates = await AsyncStorage.getItem('pending_profile_updates') || '[]';
      const updatesArray = JSON.parse(updates);
      updatesArray.push({ ...profileData, timestamp: Date.now() });
      await AsyncStorage.setItem('pending_profile_updates', JSON.stringify(updatesArray));
    } catch (error) {
      console.error('Save pending profile update error:', error);
    }
  }

  // Rental offline storage
  async saveRental(rentalData) {
    try {
      const rentals = await AsyncStorage.getItem('offline_rentals') || '[]';
      const rentalsArray = JSON.parse(rentals);
      rentalsArray.push(rentalData);
      await AsyncStorage.setItem('offline_rentals', JSON.stringify(rentalsArray));
    } catch (error) {
      console.error('Save offline rental error:', error);
    }
  }

  async getRentals() {
    try {
      const data = await AsyncStorage.getItem('offline_rentals');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Get offline rentals error:', error);
      return [];
    }
  }

  // Waste submission offline storage
  async saveWasteSubmission(wasteData) {
    try {
      const submissions = await AsyncStorage.getItem('offline_waste_submissions') || '[]';
      const submissionsArray = JSON.parse(submissions);
      submissionsArray.push(wasteData);
      await AsyncStorage.setItem('offline_waste_submissions', JSON.stringify(submissionsArray));
    } catch (error) {
      console.error('Save offline waste submission error:', error);
    }
  }

  async getWasteSubmissions() {
    try {
      const data = await AsyncStorage.getItem('offline_waste_submissions');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Get offline waste submissions error:', error);
      return [];
    }
  }

  // Station data offline storage
  async saveStations(stationsData) {
    try {
      await AsyncStorage.setItem('offline_stations', JSON.stringify(stationsData));
    } catch (error) {
      console.error('Save offline stations error:', error);
    }
  }

  async getStations() {
    try {
      const data = await AsyncStorage.getItem('offline_stations');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Get offline stations error:', error);
      return [];
    }
  }

  // Payment offline storage
  async savePayment(paymentData) {
    try {
      const payments = await AsyncStorage.getItem('offline_payments') || '[]';
      const paymentsArray = JSON.parse(payments);
      paymentsArray.push(paymentData);
      await AsyncStorage.setItem('offline_payments', JSON.stringify(paymentsArray));
    } catch (error) {
      console.error('Save offline payment error:', error);
    }
  }

  async getPayments() {
    try {
      const data = await AsyncStorage.getItem('offline_payments');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Get offline payments error:', error);
      return [];
    }
  }

  // Sync pending data when online
  async syncPendingData() {
    try {
      // This would be implemented to sync all pending offline data
      console.log('Syncing pending offline data...');
      // Implementation would depend on API endpoints
    } catch (error) {
      console.error('Sync pending data error:', error);
    }
  }

  // Clear all offline data
  async clearOfflineData() {
    try {
      const keys = [
        'offline_profile',
        'offline_rentals',
        'offline_waste_submissions',
        'offline_stations',
        'offline_payments',
        'pending_profile_updates'
      ];
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error('Clear offline data error:', error);
    }
  }
}

const offlineService = new OfflineService();
export default offlineService;