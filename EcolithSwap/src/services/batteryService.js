import apiService from './api';

class BatteryService {
  constructor() {
    this.currentRental = null;
  }

  // Get all batteries
  async getAllBatteries(params = {}) {
    try {
      const response = await apiService.get('/batteries', params);
      return response.batteries || [];
    } catch (error) {
      console.error('Get batteries error:', error);
      throw error;
    }
  }

  // Get battery by ID
  async getBatteryById(batteryId) {
    try {
      const response = await apiService.get(`/batteries/${batteryId}`);
      return response.battery;
    } catch (error) {
      console.error('Get battery error:', error);
      throw error;
    }
  }

  // Get available batteries at station
  async getAvailableBatteriesAtStation(stationId) {
    try {
      const response = await apiService.get('/batteries', {
        station_id: stationId,
        status: 'available'
      });
      return response.batteries || [];
    } catch (error) {
      console.error('Get available batteries error:', error);
      throw error;
    }
  }

  // Rent/Swap battery
  async rentBattery(batteryId, pickupStationId) {
    try {
      const response = await apiService.post('/rentals', {
        battery_id: batteryId,
        pickup_station_id: pickupStationId
      });
      
      this.currentRental = response.rental;
      return response;
    } catch (error) {
      console.error('Rent battery error:', error);
      throw error;
    }
  }

  // Return battery
  async returnBattery(rentalId, returnStationId) {
    try {
      const response = await apiService.patch(`/rentals/${rentalId}/return`, {
        return_station_id: returnStationId
      });
      
      this.currentRental = null;
      return response;
    } catch (error) {
      console.error('Return battery error:', error);
      throw error;
    }
  }

  // Cancel rental
  async cancelRental(rentalId) {
    try {
      const response = await apiService.patch(`/rentals/${rentalId}/cancel`);
      this.currentRental = null;
      return response;
    } catch (error) {
      console.error('Cancel rental error:', error);
      throw error;
    }
  }

  // Get user's rental history
  async getRentalHistory(params = {}) {
    try {
      const response = await apiService.get('/rentals', params);
      return response.rentals || [];
    } catch (error) {
      console.error('Get rental history error:', error);
      throw error;
    }
  }

  // Get current active rental
  async getCurrentRental() {
    try {
      const response = await apiService.get('/rentals', {
        status: 'active',
        limit: 1
      });
      
      const activeRentals = response.rentals || [];
      this.currentRental = activeRentals.length > 0 ? activeRentals[0] : null;
      
      return this.currentRental;
    } catch (error) {
      console.error('Get current rental error:', error);
      throw error;
    }
  }

  // Get rental by ID
  async getRentalById(rentalId) {
    try {
      const response = await apiService.get(`/rentals/${rentalId}`);
      return response.rental;
    } catch (error) {
      console.error('Get rental error:', error);
      throw error;
    }
  }

  // Calculate rental cost
  calculateRentalCost(startTime, endTime, hourlyRate) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const hours = Math.ceil((end - start) / (1000 * 60 * 60));
    return Math.max(1, hours) * hourlyRate; // Minimum 1 hour charge
  }

  // Get battery health status color
  getBatteryHealthColor(healthStatus) {
    switch (healthStatus) {
      case 'excellent':
        return '#4CAF50'; // Green
      case 'good':
        return '#8BC34A'; // Light Green
      case 'fair':
        return '#FF9800'; // Orange
      case 'poor':
        return '#F44336'; // Red
      default:
        return '#9E9E9E'; // Grey
    }
  }

  // Get charge level color
  getChargeLevelColor(chargeLevel) {
    if (chargeLevel >= 80) return '#4CAF50'; // Green
    if (chargeLevel >= 50) return '#FF9800'; // Orange
    if (chargeLevel >= 20) return '#FF5722'; // Red-Orange
    return '#F44336'; // Red
  }

  // Format battery type display
  formatBatteryType(batteryType) {
    return batteryType
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  // Get estimated runtime based on charge level and capacity
  getEstimatedRuntime(chargeLevel, capacity) {
    // Basic calculation: assume 1000mAh = 1 hour runtime at 50% efficiency
    const efficiency = 0.5;
    const baseHours = (capacity / 1000) * efficiency;
    const actualHours = baseHours * (chargeLevel / 100);
    
    if (actualHours < 1) {
      return `${Math.round(actualHours * 60)} minutes`;
    }
    
    return `${actualHours.toFixed(1)} hours`;
  }

  // Check if battery is suitable for rental
  isBatterySuitableForRental(battery) {
    return (
      battery.status === 'available' &&
      battery.charge_level >= 20 && // Minimum 20% charge
      battery.health_status !== 'poor' // Not in poor condition
    );
  }

  // Get rental status color
  getRentalStatusColor(status) {
    switch (status) {
      case 'active':
        return '#4CAF50'; // Green
      case 'completed':
        return '#2196F3'; // Blue
      case 'cancelled':
        return '#F44336'; // Red
      case 'pending':
        return '#FF9800'; // Orange
      default:
        return '#9E9E9E'; // Grey
    }
  }

  // Format rental duration
  formatRentalDuration(startTime, endTime) {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diffMs = end - start;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    }
    return `${diffMinutes}m`;
  }

  // Get current rental data
  getCurrentRentalData() {
    return this.currentRental;
  }

  // Check if user has active rental
  hasActiveRental() {
    return this.currentRental !== null;
  }

  // Clear current rental data
  clearCurrentRental() {
    this.currentRental = null;
  }

  // Get battery statistics
  async getBatteryStats() {
    try {
      const response = await apiService.get('/batteries/stats/overview');
      return response;
    } catch (error) {
      console.error('Get battery stats error:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const batteryService = new BatteryService();
export default batteryService;