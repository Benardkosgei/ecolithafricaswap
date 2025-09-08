import apiService from './api';
import { offlineService } from './offline';

class StationService {
  // Get all stations
  async getStations(params = {}) {
    try {
      const response = await apiService.get('/stations', params);
      return response.data || response;
    } catch (error) {
      console.error('Get stations error:', error);
      // Return offline data if available
      return await offlineService.getStations();
    }
  }

  // Get single station details
  async getStation(stationId) {
    try {
      const response = await apiService.get(`/stations/${stationId}`);
      return response.data || response;
    } catch (error) {
      console.error('Get station error:', error);
      return await offlineService.getStation(stationId);
    }
  }

  // Get nearby stations
  async getNearbyStations(latitude, longitude, radius = 5000) {
    try {
      const response = await apiService.get(`/stations/nearby/${latitude}/${longitude}`, {
        radius
      });
      return response.data || response;
    } catch (error) {
      console.error('Get nearby stations error:', error);
      return await offlineService.getNearbyStations(latitude, longitude, radius);
    }
  }

  // Get station reviews
  async getStationReviews(stationId, params = {}) {
    try {
      const response = await apiService.get(`/stations/${stationId}/reviews`, params);
      return response.data || response;
    } catch (error) {
      console.error('Get station reviews error:', error);
      return [];
    }
  }

  // Add station review
  async addStationReview(stationId, reviewData) {
    try {
      const response = await apiService.post(`/stations/${stationId}/reviews`, reviewData);
      return response.data || response;
    } catch (error) {
      console.error('Add station review error:', error);
      // Save offline for later sync
      await offlineService.saveStationReview(stationId, reviewData);
      throw error;
    }
  }

  // Get station issues
  async getStationIssues(stationId, params = {}) {
    try {
      const response = await apiService.get(`/stations/${stationId}/issues`, params);
      return response.data || response;
    } catch (error) {
      console.error('Get station issues error:', error);
      return [];
    }
  }

  // Report station issue
  async reportStationIssue(stationId, issueData) {
    try {
      const response = await apiService.post(`/stations/${stationId}/issues`, issueData);
      return response.data || response;
    } catch (error) {
      console.error('Report station issue error:', error);
      // Save offline for later sync
      await offlineService.saveStationIssue(stationId, issueData);
      throw error;
    }
  }

  // Request new station
  async requestNewStation(requestData) {
    try {
      const response = await apiService.post('/stations/requests', requestData);
      return response.data || response;
    } catch (error) {
      console.error('Request new station error:', error);
      // Save offline for later sync
      await offlineService.saveStationRequest(requestData);
      throw error;
    }
  }

  // Get station statistics
  async getStationStats(stationId) {
    try {
      const response = await apiService.get(`/stations/${stationId}/stats`);
      return response.data || response;
    } catch (error) {
      console.error('Get station stats error:', error);
      return null;
    }
  }

  // Update station status (for station managers)
  async updateStationStatus(stationId, isActive, notes = '') {
    try {
      const response = await apiService.patch(`/stations/${stationId}/status`, {
        is_active: isActive,
        notes
      });
      return response.data || response;
    } catch (error) {
      console.error('Update station status error:', error);
      throw error;
    }
  }

  // Get station battery availability
  async getStationBatteries(stationId) {
    try {
      const response = await apiService.get(`/stations/${stationId}/batteries`);
      return response.data || response;
    } catch (error) {
      console.error('Get station batteries error:', error);
      return [];
    }
  }

  // Calculate distance between two coordinates
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.degToRad(lat2 - lat1);
    const dLon = this.degToRad(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degToRad(lat1)) * Math.cos(this.degToRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  degToRad(deg) {
    return deg * (Math.PI / 180);
  }

  // Format station type for display
  formatStationType(type) {
    switch (type) {
      case 'swap':
        return 'Battery Swap';
      case 'charge':
        return 'Charging Only';
      case 'both':
        return 'Swap & Charge';
      default:
        return 'Unknown';
    }
  }

  // Get station type color
  getStationTypeColor(type) {
    switch (type) {
      case 'swap':
        return '#4CAF50'; // Green
      case 'charge':
        return '#2196F3'; // Blue
      case 'both':
        return '#9C27B0'; // Purple
      default:
        return '#9E9E9E'; // Grey
    }
  }

  // Validate station operating hours
  isStationOpen(operatingHours) {
    if (!operatingHours) return true; // Assume 24/7 if no hours specified
    
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Minutes since midnight
    
    // Parse operating hours (simplified - assumes format like "Mon-Fri: 08:00-20:00")
    // This would need more sophisticated parsing for real-world use
    try {
      const parts = operatingHours.split(':');
      if (parts.length < 2) return true;
      
      const timeRange = parts[1].trim();
      const [startTime, endTime] = timeRange.split('-');
      
      if (!startTime || !endTime) return true;
      
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);
      
      const startMinutes = startHour * 60 + (startMin || 0);
      const endMinutes = endHour * 60 + (endMin || 0);
      
      return currentTime >= startMinutes && currentTime <= endMinutes;
    } catch (error) {
      console.error('Error parsing operating hours:', error);
      return true; // Default to open if parsing fails
    }
  }

  // Filter stations by criteria
  filterStations(stations, filters = {}) {
    let filtered = [...stations];
    
    if (filters.isActive !== undefined) {
      filtered = filtered.filter(station => station.is_active === filters.isActive);
    }
    
    if (filters.stationType) {
      filtered = filtered.filter(station => station.station_type === filters.stationType);
    }
    
    if (filters.acceptsPlastic !== undefined) {
      filtered = filtered.filter(station => station.accepts_plastic === filters.acceptsPlastic);
    }
    
    if (filters.userLocation) {
      filtered = filtered.map(station => {
        const distance = this.calculateDistance(
          filters.userLocation.latitude,
          filters.userLocation.longitude,
          parseFloat(station.latitude),
          parseFloat(station.longitude)
        );
        return { ...station, distance };
      });
      
      if (filters.maxDistance) {
        filtered = filtered.filter(station => station.distance <= filters.maxDistance);
      }
      
      // Sort by distance
      filtered = filtered.sort((a, b) => a.distance - b.distance);
    }
    
    return filtered;
  }

  // Get station status display info
  getStationStatusInfo(station) {
    if (!station.is_active) {
      return { status: 'Inactive', color: '#F44336', icon: 'close-circle' };
    }
    
    if (station.maintenance_mode) {
      return { status: 'Maintenance', color: '#FF9800', icon: 'build' };
    }
    
    const isOpen = this.isStationOpen(station.operating_hours);
    if (!isOpen) {
      return { status: 'Closed', color: '#FF9800', icon: 'time' };
    }
    
    return { status: 'Open', color: '#4CAF50', icon: 'checkmark-circle' };
  }

  // Sync offline station data
  async syncOfflineData() {
    try {
      const offlineData = await offlineService.getOfflineStationData();
      
      // Sync reviews
      for (const review of offlineData.reviews || []) {
        try {
          await this.addStationReview(review.station_id, review.data);
          await offlineService.removeOfflineStationReview(review.id);
        } catch (error) {
          console.error('Failed to sync review:', error);
        }
      }
      
      // Sync issues
      for (const issue of offlineData.issues || []) {
        try {
          await this.reportStationIssue(issue.station_id, issue.data);
          await offlineService.removeOfflineStationIssue(issue.id);
        } catch (error) {
          console.error('Failed to sync issue:', error);
        }
      }
      
      // Sync station requests
      for (const request of offlineData.requests || []) {
        try {
          await this.requestNewStation(request.data);
          await offlineService.removeOfflineStationRequest(request.id);
        } catch (error) {
          console.error('Failed to sync station request:', error);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Sync offline station data error:', error);
      return false;
    }
  }
}

// Create and export a singleton instance
const stationService = new StationService();
export default stationService;