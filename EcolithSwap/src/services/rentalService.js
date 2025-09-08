import apiService from './api';
import { offlineService } from './offline';

class RentalService {
  // Get current active rental
  async getCurrentRental() {
    try {
      const response = await apiService.get('/rentals/current');
      return response.data;
    } catch (error) {
      console.error('Get current rental error:', error);
      // Try to get from offline storage
      return await offlineService.getCurrentRental();
    }
  }

  // Get rental history
  async getRentalHistory(params = {}) {
    try {
      const response = await apiService.get('/rentals', params);
      return response.data;
    } catch (error) {
      console.error('Get rental history error:', error);
      // Return offline data if available
      return await offlineService.getRentalHistory();
    }
  }

  // Start a new rental
  async startRental(batteryId, stationId) {
    try {
      const response = await apiService.post('/rentals', {
        battery_id: batteryId,
        pickup_station_id: stationId
      });
      
      // Save rental data offline for sync
      await offlineService.saveRental(response.data);
      
      return response.data;
    } catch (error) {
      console.error('Start rental error:', error);
      
      // Save offline for later sync
      const offlineRental = {
        battery_id: batteryId,
        pickup_station_id: stationId,
        start_time: new Date().toISOString(),
        status: 'active',
        offline: true
      };
      
      await offlineService.saveRental(offlineRental);
      return { ...offlineRental, offline: true };
    }
  }

  // End rental (return battery)
  async endRental(rentalId, returnStationId) {
    try {
      const response = await apiService.patch(`/rentals/${rentalId}/return`, {
        return_station_id: returnStationId
      });
      
      await offlineService.updateRental(rentalId, response.data);
      return response.data;
    } catch (error) {
      console.error('End rental error:', error);
      
      // Save offline for later sync
      const update = {
        return_station_id: returnStationId,
        end_time: new Date().toISOString(),
        status: 'completed',
        offline: true
      };
      
      await offlineService.updateRental(rentalId, update);
      return { offline: true, ...update };
    }
  }

  // Extend rental
  async extendRental(rentalId, hours) {
    try {
      const response = await apiService.patch(`/rentals/${rentalId}/extend`, {
        extension_hours: hours
      });
      
      await offlineService.updateRental(rentalId, response.data);
      return response.data;
    } catch (error) {
      console.error('Extend rental error:', error);
      throw error;
    }
  }

  // Cancel rental
  async cancelRental(rentalId) {
    try {
      const response = await apiService.patch(`/rentals/${rentalId}/cancel`);
      
      await offlineService.updateRental(rentalId, response.data);
      return response.data;
    } catch (error) {
      console.error('Cancel rental error:', error);
      throw error;
    }
  }

  // Get rental analytics
  async getRentalAnalytics(period = '30d') {
    try {
      const response = await apiService.get('/rentals/analytics', { period });
      return response.data;
    } catch (error) {
      console.error('Get rental analytics error:', error);
      return null;
    }
  }

  // Report issue with rental
  async reportIssue(rentalId, issueData) {
    try {
      const response = await apiService.post(`/rentals/${rentalId}/issues`, issueData);
      return response.data;
    } catch (error) {
      console.error('Report rental issue error:', error);
      // Save offline for later sync
      await offlineService.saveRentalIssue(rentalId, issueData);
      throw error;
    }
  }

  // Sync offline rentals
  async syncOfflineRentals() {
    try {
      const offlineRentals = await offlineService.getOfflineRentals();
      
      for (const rental of offlineRentals) {
        if (rental.action === 'start') {
          await this.startRental(rental.battery_id, rental.pickup_station_id);
        } else if (rental.action === 'end') {
          await this.endRental(rental.id, rental.return_station_id);
        }
        
        await offlineService.removeOfflineRental(rental.id);
      }
      
      return true;
    } catch (error) {
      console.error('Sync offline rentals error:', error);
      return false;
    }
  }
}

// Create and export a singleton instance
const rentalService = new RentalService();
export default rentalService;
