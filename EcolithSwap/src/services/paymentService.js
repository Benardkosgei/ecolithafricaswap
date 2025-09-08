import apiService from './api';
import { offlineService } from './offline';

class PaymentService {
  // Get payment history
  async getPaymentHistory(params = {}) {
    try {
      const response = await apiService.get('/payments', params);
      return response.data || response;
    } catch (error) {
      console.error('Get payment history error:', error);
      return await offlineService.getPaymentHistory();
    }
  }

  // Get single payment details
  async getPayment(paymentId) {
    try {
      const response = await apiService.get(`/payments/${paymentId}`);
      return response.data || response;
    } catch (error) {
      console.error('Get payment error:', error);
      return await offlineService.getPayment(paymentId);
    }
  }

  // Get payment methods
  async getPaymentMethods() {
    try {
      const response = await apiService.get('/users/payment-methods');
      return response.data || response;
    } catch (error) {
      console.error('Get payment methods error:', error);
      return await offlineService.getPaymentMethods();
    }
  }

  // Add payment method
  async addPaymentMethod(methodData) {
    try {
      const response = await apiService.post('/users/payment-methods', methodData);
      return response.data || response;
    } catch (error) {
      console.error('Add payment method error:', error);
      // Save offline for later sync
      await offlineService.savePaymentMethod(methodData);
      throw error;
    }
  }

  // Delete payment method
  async deletePaymentMethod(methodId) {
    try {
      const response = await apiService.delete(`/users/payment-methods/${methodId}`);
      return response.data || response;
    } catch (error) {
      console.error('Delete payment method error:', error);
      throw error;
    }
  }

  // Set default payment method
  async setDefaultPaymentMethod(methodId) {
    try {
      const response = await apiService.patch(`/users/payment-methods/${methodId}/default`);
      return response.data || response;
    } catch (error) {
      console.error('Set default payment method error:', error);
      throw error;
    }
  }

  // Get account balance
  async getAccountBalance() {
    try {
      const response = await apiService.get('/users/balance');
      return response.data || response;
    } catch (error) {
      console.error('Get account balance error:', error);
      return await offlineService.getAccountBalance();
    }
  }

  // Top up account
  async topUpAccount(topUpData) {
    try {
      const response = await apiService.post('/payments/top-up', topUpData);
      return response.data || response;
    } catch (error) {
      console.error('Top up account error:', error);
      // Save offline for later processing
      await offlineService.saveTopUpRequest(topUpData);
      throw error;
    }
  }

  // Get pending transactions
  async getPendingTransactions() {
    try {
      const response = await apiService.get('/payments', {
        status: 'pending',
        limit: 10
      });
      return response.data || response;
    } catch (error) {
      console.error('Get pending transactions error:', error);
      return [];
    }
  }

  // Get payment statistics
  async getPaymentStats(period = '30d') {
    try {
      const response = await apiService.get('/payments/stats', { period });
      return response.data || response;
    } catch (error) {
      console.error('Get payment stats error:', error);
      return await offlineService.getPaymentStats();
    }
  }

  // Process payment
  async processPayment(paymentData) {
    try {
      const response = await apiService.post('/payments', paymentData);
      
      // Save payment locally
      await offlineService.savePayment(response.data || response);
      
      return response.data || response;
    } catch (error) {
      console.error('Process payment error:', error);
      
      // Save offline for later processing
      await offlineService.saveFailedPayment(paymentData);
      throw error;
    }
  }

  // Request refund
  async requestRefund(paymentId, refundData) {
    try {
      const response = await apiService.post(`/payments/${paymentId}/refund`, refundData);
      return response.data || response;
    } catch (error) {
      console.error('Request refund error:', error);
      throw error;
    }
  }

  // Get transaction receipt
  async getTransactionReceipt(transactionId) {
    try {
      const response = await apiService.get(`/payments/${transactionId}/receipt`);
      return response.data || response;
    } catch (error) {
      console.error('Get transaction receipt error:', error);
      throw error;
    }
  }

  // Validate payment method
  validatePaymentMethod(methodData) {
    const errors = [];
    
    if (!methodData.type) {
      errors.push('Payment method type is required');
    }
    
    if (methodData.type === 'mpesa') {
      if (!methodData.phone_number) {
        errors.push('Phone number is required for M-Pesa');
      } else if (!/^254\d{9}$/.test(methodData.phone_number)) {
        errors.push('Invalid M-Pesa phone number format');
      }
    }
    
    if (methodData.type === 'card') {
      if (!methodData.card_number || methodData.card_number.length < 13) {
        errors.push('Valid card number is required');
      }
      
      if (!methodData.card_holder_name) {
        errors.push('Card holder name is required');
      }
      
      if (!methodData.expiry_date || !/^\d{2}\/\d{2}$/.test(methodData.expiry_date)) {
        errors.push('Valid expiry date (MM/YY) is required');
      }
      
      if (!methodData.cvv || methodData.cvv.length < 3) {
        errors.push('Valid CVV is required');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Calculate transaction fees
  calculateFees(amount, paymentType) {
    let fee = 0;
    
    switch (paymentType) {
      case 'mpesa':
        // M-Pesa transaction fees (simplified)
        if (amount <= 100) fee = 0;
        else if (amount <= 500) fee = 5;
        else if (amount <= 1000) fee = 10;
        else if (amount <= 5000) fee = 25;
        else fee = amount * 0.015; // 1.5% for large amounts
        break;
        
      case 'card':
        // Credit card processing fee
        fee = amount * 0.029 + 2; // 2.9% + KES 2
        break;
        
      default:
        fee = 0;
    }
    
    return Math.round(fee * 100) / 100; // Round to 2 decimal places
  }

  // Format payment method display
  formatPaymentMethodDisplay(method) {
    if (method.type === 'mpesa') {
      return {
        name: 'M-Pesa',
        details: method.phone_number,
        icon: 'phone-portrait'
      };
    }
    
    if (method.type === 'card') {
      return {
        name: 'Credit Card',
        details: `**** **** **** ${method.card_number?.slice(-4)}`,
        icon: 'card'
      };
    }
    
    return {
      name: 'Unknown',
      details: 'Unknown payment method',
      icon: 'help-circle'
    };
  }

  // Get payment status color
  getPaymentStatusColor(status) {
    switch (status) {
      case 'completed':
      case 'success':
        return '#4CAF50'; // Green
      case 'pending':
      case 'processing':
        return '#FF9800'; // Orange
      case 'failed':
      case 'cancelled':
        return '#F44336'; // Red
      default:
        return '#9E9E9E'; // Grey
    }
  }

  // Format payment status display
  formatPaymentStatus(status) {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'pending':
        return 'Pending';
      case 'processing':
        return 'Processing';
      case 'failed':
        return 'Failed';
      case 'cancelled':
        return 'Cancelled';
      case 'refunded':
        return 'Refunded';
      default:
        return 'Unknown';
    }
  }

  // Generate payment reference
  generatePaymentReference(prefix = 'PAY') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 5).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  // Validate top-up amount
  validateTopUpAmount(amount) {
    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount) || numAmount <= 0) {
      return { isValid: false, error: 'Amount must be a positive number' };
    }
    
    if (numAmount < 10) {
      return { isValid: false, error: 'Minimum top-up amount is KES 10' };
    }
    
    if (numAmount > 50000) {
      return { isValid: false, error: 'Maximum top-up amount is KES 50,000' };
    }
    
    return { isValid: true };
  }

  // Get transaction type icon
  getTransactionTypeIcon(type) {
    switch (type) {
      case 'top_up':
      case 'deposit':
        return 'add-circle';
      case 'rental':
      case 'battery_rental':
        return 'battery-charging';
      case 'plastic_reward':
      case 'credits':
        return 'leaf';
      case 'refund':
        return 'arrow-back';
      case 'withdrawal':
        return 'remove-circle';
      default:
        return 'swap-horizontal';
    }
  }

  // Sync offline payment data
  async syncOfflineData() {
    try {
      const offlineData = await offlineService.getOfflinePaymentData();
      
      // Sync failed payments
      for (const payment of offlineData.failedPayments || []) {
        try {
          await this.processPayment(payment.data);
          await offlineService.removeFailedPayment(payment.id);
        } catch (error) {
          console.error('Failed to sync payment:', error);
        }
      }
      
      // Sync top-up requests
      for (const topUp of offlineData.topUpRequests || []) {
        try {
          await this.topUpAccount(topUp.data);
          await offlineService.removeTopUpRequest(topUp.id);
        } catch (error) {
          console.error('Failed to sync top-up:', error);
        }
      }
      
      // Sync payment methods
      for (const method of offlineData.paymentMethods || []) {
        try {
          await this.addPaymentMethod(method.data);
          await offlineService.removeOfflinePaymentMethod(method.id);
        } catch (error) {
          console.error('Failed to sync payment method:', error);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Sync offline payment data error:', error);
      return false;
    }
  }
}

// Create and export a singleton instance
const paymentService = new PaymentService();
export default paymentService;