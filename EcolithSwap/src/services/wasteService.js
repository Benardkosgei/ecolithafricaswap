import apiService from './api';

class WasteService {
  constructor() {
    this.userCredits = 0;
    this.pendingCredits = 0;
  }

  // Submit plastic waste
  async submitWaste(wasteData) {
    try {
      const response = await apiService.post('/waste', wasteData);
      
      // Update pending credits
      if (response.creditEarned) {
        this.pendingCredits += response.creditEarned;
      }
      
      return response;
    } catch (error) {
      console.error('Submit waste error:', error);
      throw error;
    }
  }

  // Get user's waste submission history
  async getWasteHistory(params = {}) {
    try {
      const response = await apiService.get('/waste', params);
      return response.wasteLogs || [];
    } catch (error) {
      console.error('Get waste history error:', error);
      throw error;
    }
  }

  // Get waste submission by ID
  async getWasteById(wasteId) {
    try {
      const response = await apiService.get(`/waste/${wasteId}`);
      return response.wasteLog;
    } catch (error) {
      console.error('Get waste error:', error);
      throw error;
    }
  }

  // Get waste statistics
  async getWasteStats() {
    try {
      const response = await apiService.get('/waste/stats/overview');
      return response;
    } catch (error) {
      console.error('Get waste stats error:', error);
      throw error;
    }
  }

  // Get waste breakdown by type
  async getWasteBreakdown() {
    try {
      const response = await apiService.get('/waste/stats/breakdown');
      return response.breakdown || [];
    } catch (error) {
      console.error('Get waste breakdown error:', error);
      throw error;
    }
  }

  // Calculate credits for waste submission
  calculateCredits(wasteType, weightKg) {
    const creditRates = {
      'PET': 10, // KES per kg
      'HDPE': 8,
      'LDPE': 6,
      'PP': 7,
      'PS': 5,
      'Other': 4
    };
    
    const rate = creditRates[wasteType] || creditRates['Other'];
    return Math.round(weightKg * rate);
  }

  // Get waste type information
  getWasteTypeInfo(wasteType) {
    const wasteTypes = {
      'PET': {
        name: 'PET Bottles',
        description: 'Polyethylene Terephthalate - Water bottles, soft drink bottles',
        creditRate: 10,
        color: '#4CAF50',
        examples: ['Water bottles', 'Soda bottles', 'Food containers']
      },
      'HDPE': {
        name: 'HDPE Containers',
        description: 'High-Density Polyethylene - Milk jugs, detergent bottles',
        creditRate: 8,
        color: '#2196F3',
        examples: ['Milk jugs', 'Detergent bottles', 'Yogurt containers']
      },
      'LDPE': {
        name: 'LDPE Films',
        description: 'Low-Density Polyethylene - Plastic bags, films',
        creditRate: 6,
        color: '#FF9800',
        examples: ['Plastic bags', 'Food wraps', 'Squeezable bottles']
      },
      'PP': {
        name: 'Polypropylene',
        description: 'Polypropylene - Food containers, bottle caps',
        creditRate: 7,
        color: '#9C27B0',
        examples: ['Food containers', 'Bottle caps', 'Straws']
      },
      'PS': {
        name: 'Polystyrene',
        description: 'Polystyrene - Foam containers, disposable cups',
        creditRate: 5,
        color: '#F44336',
        examples: ['Foam containers', 'Disposable cups', 'Packaging materials']
      },
      'Other': {
        name: 'Other Plastics',
        description: 'Mixed or unidentified plastic types',
        creditRate: 4,
        color: '#9E9E9E',
        examples: ['Mixed plastics', 'Multi-layer packaging']
      }
    };
    
    return wasteTypes[wasteType] || wasteTypes['Other'];
  }

  // Get all waste types
  getAllWasteTypes() {
    return [
      { value: 'PET', label: 'PET Bottles', rate: 10 },
      { value: 'HDPE', label: 'HDPE Containers', rate: 8 },
      { value: 'LDPE', label: 'LDPE Films', rate: 6 },
      { value: 'PP', label: 'Polypropylene', rate: 7 },
      { value: 'PS', label: 'Polystyrene', rate: 5 },
      { value: 'Other', label: 'Other Plastics', rate: 4 }
    ];
  }

  // Get waste status color
  getWasteStatusColor(status) {
    switch (status) {
      case 'verified':
        return '#4CAF50'; // Green
      case 'pending_verification':
        return '#FF9800'; // Orange
      case 'rejected':
        return '#F44336'; // Red
      default:
        return '#9E9E9E'; // Grey
    }
  }

  // Format waste status display
  formatWasteStatus(status) {
    switch (status) {
      case 'verified':
        return 'Verified';
      case 'pending_verification':
        return 'Pending Verification';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Unknown';
    }
  }

  // Calculate environmental impact
  calculateEnvironmentalImpact(weightKg) {
    // Approximate calculations
    const co2Saved = weightKg * 2.8; // kg CO2 saved per kg plastic recycled
    const energySaved = weightKg * 2000; // kJ energy saved per kg plastic
    const waterSaved = weightKg * 25; // liters water saved per kg plastic
    
    return {
      co2Saved: parseFloat(co2Saved.toFixed(2)),
      energySaved: Math.round(energySaved),
      waterSaved: Math.round(waterSaved)
    };
  }

  // Get submission tips
  getSubmissionTips() {
    return [
      'Clean containers before submission to get better rates',
      'Remove labels and caps when possible',
      'Sort by plastic type for faster verification',
      'Weigh your plastic accurately for precise credits',
      'Take photos of your submission for records',
      'Submit during station operating hours for immediate verification'
    ];
  }

  // Validate waste submission data
  validateSubmissionData(data) {
    const errors = [];
    
    if (!data.waste_type) {
      errors.push('Waste type is required');
    }
    
    if (!data.weight_kg || data.weight_kg <= 0) {
      errors.push('Weight must be greater than 0');
    }
    
    if (data.weight_kg > 100) {
      errors.push('Weight cannot exceed 100kg per submission');
    }
    
    if (!data.station_id) {
      errors.push('Station selection is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Format weight display
  formatWeight(weightKg) {
    if (weightKg >= 1) {
      return `${weightKg.toFixed(1)} kg`;
    }
    return `${(weightKg * 1000).toFixed(0)} g`;
  }

  // Set user credits
  setUserCredits(available, pending = 0) {
    this.userCredits = available;
    this.pendingCredits = pending;
  }

  // Get user credits
  getUserCredits() {
    return {
      available: this.userCredits,
      pending: this.pendingCredits
    };
  }
}

// Create and export a singleton instance
const wasteService = new WasteService();
export default wasteService;