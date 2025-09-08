import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Card,
  Button,
  TextInput,
  RadioButton,
  ActivityIndicator,
  Divider,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useData } from '../contexts/DataContext';
import { colors, typography, spacing } from '../utils/theme';

export default function PaymentScreen({ navigation, route }) {
  const { rental, offline } = route.params || {};
  const { isOnline } = useData();
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [processing, setProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('pending');

  useEffect(() => {
    // Simulate payment processing for demo
    if (offline) {
      setPaymentStatus('offline');
    }
  }, [offline]);

  const handlePayment = async () => {
    if (!phoneNumber && paymentMethod === 'mpesa') {
      Alert.alert('Phone Number Required', 'Please enter your M-Pesa phone number.');
      return;
    }

    if (phoneNumber && !phoneNumber.match(/^254\d{9}$/)) {
      Alert.alert('Invalid Phone Number', 'Please enter a valid Kenyan phone number (254XXXXXXXXX).');
      return;
    }

    try {
      setProcessing(true);

      if (offline || !isOnline) {
        // Offline payment - stored for later processing
        Alert.alert(
          'Payment Recorded',
          'Your payment has been recorded offline and will be processed when connection is restored.',
          [
            {
              text: 'Continue',
              onPress: () => navigation.navigate('HomeTab'),
            },
          ]
        );
        return;
      }

      // Simulate M-Pesa payment flow
      if (paymentMethod === 'mpesa') {
        await simulateMpesaPayment();
      } else {
        await simulateCardPayment();
      }

    } catch (error) {
      Alert.alert('Payment Error', error.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const simulateMpesaPayment = async () => {
    // Simulate M-Pesa STK push
    setPaymentStatus('processing');
    
    Alert.alert(
      'M-Pesa Payment',
      `A payment request has been sent to ${phoneNumber}. Please check your phone and enter your M-Pesa PIN to complete the payment.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => setPaymentStatus('cancelled'),
        },
        {
          text: 'Continue',
          onPress: () => {
            // Simulate payment completion
            setTimeout(() => {
              setPaymentStatus('completed');
              Alert.alert(
                'Payment Successful',
                'Your payment has been processed successfully!',
                [
                  {
                    text: 'View Receipt',
                    onPress: () => navigation.navigate('HistoryTab'),
                  },
                  {
                    text: 'Done',
                    onPress: () => navigation.navigate('HomeTab'),
                  },
                ]
              );
            }, 2000);
          },
        },
      ]
    );
  };

  const simulateCardPayment = async () => {
    // Simulate card payment processing
    setPaymentStatus('processing');
    
    setTimeout(() => {
      setPaymentStatus('completed');
      Alert.alert(
        'Payment Successful',
        'Your card payment has been processed successfully!',
        [
          {
            text: 'Done',
            onPress: () => navigation.navigate('HomeTab'),
          },
        ]
      );
    }, 3000);
  };

  const formatPhoneNumber = (text) => {
    // Auto-format phone number
    let cleaned = text.replace(/\D/g, '');
    
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.substring(1);
    } else if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
      cleaned = '254' + cleaned;
    }
    
    return cleaned;
  };

  const getPaymentIcon = (method) => {
    switch (method) {
      case 'mpesa':
        return 'phone-android';
      case 'card':
        return 'credit-card';
      default:
        return 'payment';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return colors.success;
      case 'processing':
        return colors.warning;
      case 'offline':
        return colors.info;
      case 'cancelled':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Payment Completed';
      case 'processing':
        return 'Processing Payment...';
      case 'offline':
        return 'Payment Recorded Offline';
      case 'cancelled':
        return 'Payment Cancelled';
      default:
        return 'Payment Pending';
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Payment</Text>
        <Text style={styles.headerSubtitle}>
          {offline ? 'Complete payment when online' : 'Complete your battery swap payment'}
        </Text>
      </View>

      {/* Payment Status */}
      <Card style={styles.statusCard}>
        <Card.Content>
          <View style={styles.statusHeader}>
            <Icon
              name={paymentStatus === 'completed' ? 'check-circle' : 'payment'}
              size={24}
              color={getStatusColor(paymentStatus)}
            />
            <Text style={[styles.statusText, { color: getStatusColor(paymentStatus) }]}>
              {getStatusText(paymentStatus)}
            </Text>
          </View>
          
          {processing && (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={styles.statusLoader}
            />
          )}
        </Card.Content>
      </Card>

      {/* Rental Summary */}
      {rental && (
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Text style={styles.cardTitle}>Rental Summary</Text>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Station:</Text>
              <Text style={styles.summaryValue}>{rental.stations?.name}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Battery:</Text>
              <Text style={styles.summaryValue}>{rental.battery_id}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Start Time:</Text>
              <Text style={styles.summaryValue}>
                {new Date(rental.start_time).toLocaleString()}
              </Text>
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Amount Due:</Text>
              <Text style={styles.totalValue}>KES {rental.cost || 50}</Text>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Payment Methods */}
      {!offline && paymentStatus === 'pending' && (
        <Card style={styles.paymentCard}>
          <Card.Content>
            <Text style={styles.cardTitle}>Payment Method</Text>
            
            {/* M-Pesa Option */}
            <View style={styles.paymentOption}>
              <RadioButton
                value="mpesa"
                status={paymentMethod === 'mpesa' ? 'checked' : 'unchecked'}
                onPress={() => setPaymentMethod('mpesa')}
                color={colors.primary}
              />
              <View style={styles.paymentInfo}>
                <View style={styles.paymentHeader}>
                  <Icon name="phone-android" size={20} color={colors.success} />
                  <Text style={styles.paymentTitle}>M-Pesa</Text>
                </View>
                <Text style={styles.paymentDescription}>
                  Pay with your M-Pesa mobile money account
                </Text>
              </View>
            </View>

            {/* Card Option */}
            <View style={styles.paymentOption}>
              <RadioButton
                value="card"
                status={paymentMethod === 'card' ? 'checked' : 'unchecked'}
                onPress={() => setPaymentMethod('card')}
                color={colors.primary}
              />
              <View style={styles.paymentInfo}>
                <View style={styles.paymentHeader}>
                  <Icon name="credit-card" size={20} color={colors.info} />
                  <Text style={styles.paymentTitle}>Debit/Credit Card</Text>
                </View>
                <Text style={styles.paymentDescription}>
                  Pay with Visa, Mastercard, or local banks
                </Text>
              </View>
            </View>

            {/* Phone Number Input for M-Pesa */}
            {paymentMethod === 'mpesa' && (
              <TextInput
                label="M-Pesa Phone Number"
                value={phoneNumber}
                onChangeText={(text) => setPhoneNumber(formatPhoneNumber(text))}
                mode="outlined"
                keyboardType="phone-pad"
                placeholder="254712345678"
                style={styles.phoneInput}
                left={<TextInput.Icon icon="phone" />}
              />
            )}
          </Card.Content>
        </Card>
      )}

      {/* Offline Payment Info */}
      {offline && (
        <Card style={styles.offlineCard}>
          <Card.Content>
            <View style={styles.offlineHeader}>
              <Icon name="wifi-off" size={24} color={colors.warning} />
              <Text style={styles.offlineTitle}>Offline Payment</Text>
            </View>
            
            <Text style={styles.offlineText}>
              You are currently offline. Your rental has been recorded and payment will be processed automatically when you reconnect to the internet.
            </Text>
            
            <View style={styles.offlineInfo}>
              <Text style={styles.offlineInfoText}>
                • Rental is active and you can use the battery
              </Text>
              <Text style={styles.offlineInfoText}>
                • Payment will be processed via your default payment method
              </Text>
              <Text style={styles.offlineInfoText}>
                • You'll receive a confirmation SMS when payment is complete
              </Text>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Security Info */}
      <Card style={styles.securityCard}>
        <Card.Content>
          <View style={styles.securityHeader}>
            <Icon name="security" size={20} color={colors.success} />
            <Text style={styles.securityTitle}>Secure Payment</Text>
          </View>
          
          <Text style={styles.securityText}>
            Your payment information is encrypted and secure. We never store your card details or M-Pesa PIN.
          </Text>
        </Card.Content>
      </Card>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {!offline && paymentStatus === 'pending' && (
          <Button
            mode="contained"
            onPress={handlePayment}
            style={styles.payButton}
            loading={processing}
            disabled={processing}
            icon={getPaymentIcon(paymentMethod)}
          >
            {processing ? 'Processing...' : `Pay KES ${rental?.cost || 50}`}
          </Button>
        )}
        
        <Button
          mode="text"
          onPress={() => navigation.navigate('HomeTab')}
          style={styles.cancelButton}
          disabled={processing}
        >
          {offline || paymentStatus === 'completed' ? 'Continue' : 'Cancel'}
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  headerTitle: {
    ...typography.h2,
    color: 'white',
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statusCard: {
    margin: spacing.md,
    backgroundColor: colors.surface,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusText: {
    ...typography.h3,
  },
  statusLoader: {
    marginTop: spacing.sm,
  },
  summaryCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  cardTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  summaryValue: {
    ...typography.body,
    fontWeight: '600',
  },
  divider: {
    marginVertical: spacing.md,
  },
  totalLabel: {
    ...typography.h3,
  },
  totalValue: {
    ...typography.h3,
    color: colors.primary,
  },
  paymentCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  paymentInfo: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  paymentTitle: {
    ...typography.body,
    fontWeight: '600',
  },
  paymentDescription: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  phoneInput: {
    marginTop: spacing.md,
    backgroundColor: colors.background,
  },
  offlineCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.warning + '10',
    borderWidth: 1,
    borderColor: colors.warning,
  },
  offlineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  offlineTitle: {
    ...typography.h3,
    color: colors.warning,
  },
  offlineText: {
    ...typography.body,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  offlineInfo: {
    gap: spacing.xs,
  },
  offlineInfoText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  securityCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  securityTitle: {
    ...typography.body,
    fontWeight: '600',
  },
  securityText: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  actionButtons: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  payButton: {
    backgroundColor: colors.primary,
  },
  cancelButton: {
    marginTop: spacing.sm,
  },
});
