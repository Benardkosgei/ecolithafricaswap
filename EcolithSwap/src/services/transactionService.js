import apiService from './api';
import { offlineService } from './offline';

class TransactionService {
  // Get payment history
  async getPaymentHistory(params = {}) {
    try {
      const response = await apiService.get('/payments', params);
      return response.data;
    } catch (error) {
      console.error('Get payment history error:', error);
      return await offlineService.getPaymentHistory();
    }
  }

  // Get payment details
  async getPaymentDetails(paymentId) {
    try {
      const response = await apiService.get(`/payments/${paymentId}`);
      return response.data;
    } catch (error) {
      console.error('Get payment details error:', error);
      return null;
    }
  }

  // Process payment
  async processPayment(paymentData) {
    try {
      const response = await apiService.post('/payments', paymentData);
      
      // Save payment record offline
      await offlineService.savePayment(response.data);
      
      return response.data;
    } catch (error) {
      console.error('Process payment error:', error);
      
      // Save offline for later processing
      const offlinePayment = {
        ...paymentData,
        status: 'pending',
        created_at: new Date().toISOString(),
        offline: true
      };
      
      await offlineService.savePayment(offlinePayment);
      return { ...offlinePayment, offline: true };
    }
  }

  // Get account balance
  async getAccountBalance() {
    try {
      const response = await apiService.get('/payments/balance');
      return response.data;
    } catch (error) {
      console.error('Get account balance error:', error);
      return await offlineService.getAccountBalance();
    }
  }

  // Top up account
  async topUpAccount(amount, paymentMethod, paymentDetails) {
    try {
      const response = await apiService.post('/payments/topup', {
        amount,
        payment_method: paymentMethod,
        payment_details: paymentDetails
      });
      
      return response.data;
    } catch (error) {
      console.error('Top up account error:', error);
      throw error;
    }
  }

  // Get payment methods
  async getPaymentMethods() {
    try {
      const response = await apiService.get('/payments/methods');
      return response.data;
    } catch (error) {
      console.error('Get payment methods error:', error);
      return await offlineService.getPaymentMethods();
    }
  }

  // Add payment method
  async addPaymentMethod(methodData) {
    try {
      const response = await apiService.post('/payments/methods', methodData);
      return response.data;
    } catch (error) {
      console.error('Add payment method error:', error);
      throw error;
    }
  }

  // Remove payment method
  async removePaymentMethod(methodId) {
    try {
      const response = await apiService.delete(`/payments/methods/${methodId}`);
      return response.data;
    } catch (error) {
      console.error('Remove payment method error:', error);
      throw error;
    }
  }

  // Request refund
  async requestRefund(paymentId, reason) {
    try {
      const response = await apiService.post(`/payments/${paymentId}/refund`, {
        reason
      });
      return response.data;
    } catch (error) {
      console.error('Request refund error:', error);
      throw error;
    }
  }

  // Get transaction receipt
  async getTransactionReceipt(transactionId) {
    try {
      const response = await apiService.get(`/payments/${transactionId}/receipt`);
      return response.data;
    } catch (error) {
      console.error('Get transaction receipt error:', error);
      return null;
    }
  }

  // Get payment analytics
  async getPaymentAnalytics(period = '30d') {
    try {
      const response = await apiService.get('/payments/analytics', { period });
      return response.data;
    } catch (error) {
      console.error('Get payment analytics error:', error);
      return null;
    }
  }

  // Process M-Pesa payment
  async processMpesaPayment(phoneNumber, amount, description) {
    try {
      const response = await apiService.post('/payments/mpesa', {
        phone_number: phoneNumber,
        amount,
        description
      });
      return response.data;
    } catch (error) {
      console.error('Process M-Pesa payment error:', error);
      throw error;
    }
  }

  // Check M-Pesa payment status
  async checkMpesaStatus(checkoutRequestId) {
    try {
      const response = await apiService.get(`/payments/mpesa/status/${checkoutRequestId}`);
      return response.data;
    } catch (error) {
      console.error('Check M-Pesa status error:', error);
      throw error;
    }
  }

  // Sync offline payments
  async syncOfflinePayments() {
    try {
      const offlinePayments = await offlineService.getOfflinePayments();
      
      for (const payment of offlinePayments) {
        await this.processPayment(payment);
        await offlineService.removeOfflinePayment(payment.id);
      }
      
      return true;
    } catch (error) {
      console.error('Sync offline payments error:', error);
      return false;
    }
  }
}

// Create and export a singleton instance
const transactionService = new TransactionService();
export default transactionService;
