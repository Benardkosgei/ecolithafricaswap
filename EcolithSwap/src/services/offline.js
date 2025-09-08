import AsyncStorage from '@react-native-async-storage/async-storage';

// Offline service for storing data when network is unavailable
class OfflineService {
  constructor() {
    this.KEYS = {
      PROFILE: 'offline_profile',
      STATIONS: 'offline_stations', 
      RENTALS: 'offline_rentals',
      PAYMENTS: 'offline_payments',
      WASTE: 'offline_waste',
      USER_STATS: 'offline_user_stats',
      ACCOUNT_BALANCE: 'offline_account_balance',
    };
  }

  // Generic storage methods
  async setItem(key, value) {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Offline storage error:', error);
    }
  }

  async getItem(key, defaultValue = null) {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : defaultValue;
    } catch (error) {
      console.error('Offline retrieval error:', error);
      return defaultValue;
    }
  }

  async removeItem(key) {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Offline removal error:', error);
    }
  }

  // Profile methods
  async getProfile(userId) {
    return await this.getItem(`${this.KEYS.PROFILE}_${userId}`);
  }

  async saveProfile(profileData) {
    if (profileData.id) {
      await this.setItem(`${this.KEYS.PROFILE}_${profileData.id}`, profileData);
    }
  }

  async saveProfileUpdate(profileData) {
    const updates = await this.getItem('offline_profile_updates', []);
    updates.push({ id: Date.now(), data: profileData, timestamp: new Date().toISOString() });
    await this.setItem('offline_profile_updates', updates);
  }

  async getOfflineProfileUpdates() {
    return await this.getItem('offline_profile_updates', []);
  }

  async removeOfflineProfileUpdate(updateId) {
    const updates = await this.getItem('offline_profile_updates', []);
    const filtered = updates.filter(update => update.id !== updateId);
    await this.setItem('offline_profile_updates', filtered);
  }

  async getUserStats(userId) {
    return await this.getItem(`${this.KEYS.USER_STATS}_${userId}`, {
      totalRentals: 0,
      totalCredits: 0,
      totalWasteSubmitted: 0,
      co2Saved: 0,
    });
  }

  async getPointsHistory(userId) {
    return await this.getItem(`points_history_${userId}`, []);
  }

  // Station methods
  async getStations() {
    return await this.getItem(this.KEYS.STATIONS, []);
  }

  async saveStations(stations) {
    await this.setItem(this.KEYS.STATIONS, stations);
  }

  async getStation(stationId) {
    const stations = await this.getStations();
    return stations.find(station => station.id === stationId);
  }

  async getNearbyStations(latitude, longitude, radius) {
    const stations = await this.getStations();
    // Simple filter - in real implementation would calculate distance
    return stations.filter(station => station.is_active);
  }

  async saveStationReview(stationId, reviewData) {
    const reviews = await this.getItem('offline_station_reviews', []);
    reviews.push({ 
      id: Date.now(), 
      station_id: stationId, 
      data: reviewData, 
      timestamp: new Date().toISOString() 
    });
    await this.setItem('offline_station_reviews', reviews);
  }

  async saveStationIssue(stationId, issueData) {
    const issues = await this.getItem('offline_station_issues', []);
    issues.push({ 
      id: Date.now(), 
      station_id: stationId, 
      data: issueData, 
      timestamp: new Date().toISOString() 
    });
    await this.setItem('offline_station_issues', issues);
  }

  async saveStationRequest(requestData) {
    const requests = await this.getItem('offline_station_requests', []);
    requests.push({ 
      id: Date.now(), 
      data: requestData, 
      timestamp: new Date().toISOString() 
    });
    await this.setItem('offline_station_requests', requests);
  }

  async getOfflineStationData() {
    const [reviews, issues, requests] = await Promise.all([
      this.getItem('offline_station_reviews', []),
      this.getItem('offline_station_issues', []),
      this.getItem('offline_station_requests', []),
    ]);
    return { reviews, issues, requests };
  }

  async removeOfflineStationReview(reviewId) {
    const reviews = await this.getItem('offline_station_reviews', []);
    const filtered = reviews.filter(review => review.id !== reviewId);
    await this.setItem('offline_station_reviews', filtered);
  }

  async removeOfflineStationIssue(issueId) {
    const issues = await this.getItem('offline_station_issues', []);
    const filtered = issues.filter(issue => issue.id !== issueId);
    await this.setItem('offline_station_issues', filtered);
  }

  async removeOfflineStationRequest(requestId) {
    const requests = await this.getItem('offline_station_requests', []);
    const filtered = requests.filter(request => request.id !== requestId);
    await this.setItem('offline_station_requests', filtered);
  }

  // Rental methods
  async getCurrentRental() {
    return await this.getItem('current_rental');
  }

  async saveRental(rentalData) {
    if (rentalData.status === 'active') {
      await this.setItem('current_rental', rentalData);
    }
    
    const history = await this.getRentalHistory();
    history.unshift(rentalData);
    await this.setItem('rental_history', history.slice(0, 50)); // Keep last 50
  }

  async updateRental(rentalId, updateData) {
    const current = await this.getCurrentRental();
    if (current && current.id === rentalId) {
      const updated = { ...current, ...updateData };
      if (updated.status === 'completed' || updated.status === 'cancelled') {
        await this.removeItem('current_rental');
      } else {
        await this.setItem('current_rental', updated);
      }
    }
  }

  async getRentalHistory() {
    return await this.getItem('rental_history', []);
  }

  async saveRentalIssue(rentalId, issueData) {
    const issues = await this.getItem('offline_rental_issues', []);
    issues.push({ 
      id: Date.now(), 
      rental_id: rentalId, 
      data: issueData, 
      timestamp: new Date().toISOString() 
    });
    await this.setItem('offline_rental_issues', issues);
  }

  async getOfflineRentals() {
    return await this.getItem('offline_rentals', []);
  }

  async removeOfflineRental(rentalId) {
    const rentals = await this.getItem('offline_rentals', []);
    const filtered = rentals.filter(rental => rental.id !== rentalId);
    await this.setItem('offline_rentals', filtered);
  }

  // Payment methods
  async getPaymentHistory() {
    return await this.getItem('payment_history', []);
  }

  async getPayment(paymentId) {
    const history = await this.getPaymentHistory();
    return history.find(payment => payment.id === paymentId);
  }

  async savePayment(paymentData) {
    const history = await this.getPaymentHistory();
    history.unshift(paymentData);
    await this.setItem('payment_history', history.slice(0, 100)); // Keep last 100
  }

  async getPaymentMethods() {
    return await this.getItem('payment_methods', []);
  }

  async savePaymentMethod(methodData) {
    const methods = await this.getItem('offline_payment_methods', []);
    methods.push({ 
      id: Date.now(), 
      data: methodData, 
      timestamp: new Date().toISOString() 
    });
    await this.setItem('offline_payment_methods', methods);
  }

  async getAccountBalance() {
    return await this.getItem(this.KEYS.ACCOUNT_BALANCE, { balance: 0 });
  }

  async saveTopUpRequest(topUpData) {
    const requests = await this.getItem('offline_topup_requests', []);
    requests.push({ 
      id: Date.now(), 
      data: topUpData, 
      timestamp: new Date().toISOString() 
    });
    await this.setItem('offline_topup_requests', requests);
  }

  async saveFailedPayment(paymentData) {
    const failed = await this.getItem('offline_failed_payments', []);
    failed.push({ 
      id: Date.now(), 
      data: paymentData, 
      timestamp: new Date().toISOString() 
    });
    await this.setItem('offline_failed_payments', failed);
  }

  async getPaymentStats() {
    return await this.getItem('payment_stats', {
      totalSpent: 0,
      totalTransactions: 0,
      averageTransaction: 0,
      totalTopUps: 0,
    });
  }

  async getOfflinePaymentData() {
    const [failedPayments, topUpRequests, paymentMethods] = await Promise.all([
      this.getItem('offline_failed_payments', []),
      this.getItem('offline_topup_requests', []),
      this.getItem('offline_payment_methods', []),
    ]);
    return { failedPayments, topUpRequests, paymentMethods };
  }

  async removeFailedPayment(paymentId) {
    const failed = await this.getItem('offline_failed_payments', []);
    const filtered = failed.filter(payment => payment.id !== paymentId);
    await this.setItem('offline_failed_payments', filtered);
  }

  async removeTopUpRequest(requestId) {
    const requests = await this.getItem('offline_topup_requests', []);
    const filtered = requests.filter(request => request.id !== requestId);
    await this.setItem('offline_topup_requests', filtered);
  }

  async removeOfflinePaymentMethod(methodId) {
    const methods = await this.getItem('offline_payment_methods', []);
    const filtered = methods.filter(method => method.id !== methodId);
    await this.setItem('offline_payment_methods', filtered);
  }

  // Clear all offline data
  async clearAllOfflineData() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const offlineKeys = keys.filter(key => key.startsWith('offline_'));
      await AsyncStorage.multiRemove(offlineKeys);
    } catch (error) {
      console.error('Error clearing offline data:', error);
    }
  }

  // Get offline data size
  async getOfflineDataSize() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const offlineKeys = keys.filter(key => key.startsWith('offline_'));
      return offlineKeys.length;
    } catch (error) {
      console.error('Error getting offline data size:', error);
      return 0;
    }
  }
}

// Create and export a singleton instance
export const offlineService = new OfflineService();
export default offlineService;