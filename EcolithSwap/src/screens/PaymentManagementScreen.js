import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import paymentService from '../services/paymentService';
import { theme } from '../utils/theme';

const PaymentManagementScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Payment data
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [accountBalance, setAccountBalance] = useState(0);
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [paymentStats, setPaymentStats] = useState(null);
  
  // UI state
  const [showAddMethodModal, setShowAddMethodModal] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  
  // Form data
  const [newPaymentMethod, setNewPaymentMethod] = useState({
    type: 'mpesa',
    phone_number: '',
    card_number: '',
    card_holder_name: '',
    expiry_date: '',
    cvv: '',
    is_default: false,
  });
  
  const [topUpAmount, setTopUpAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');

  useEffect(() => {
    loadPaymentData();
  }, []);

  const loadPaymentData = async () => {
    try {
      setLoading(true);
      const [history, methods, balance, pending, stats] = await Promise.all([
        paymentService.getPaymentHistory({ limit: 20 }),
        paymentService.getPaymentMethods(),
        paymentService.getAccountBalance(),
        paymentService.getPendingTransactions(),
        paymentService.getPaymentStats('30d'),
      ]);
      
      setPaymentHistory(history || []);
      setPaymentMethods(methods || []);
      setAccountBalance(balance?.balance || 0);
      setPendingTransactions(pending || []);
      setPaymentStats(stats);
    } catch (error) {
      console.error('Error loading payment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPaymentData();
    setRefreshing(false);
  }, []);

  const handleAddPaymentMethod = async () => {
    // Validation
    if (newPaymentMethod.type === 'mpesa' && !newPaymentMethod.phone_number) {
      Alert.alert('Phone Number Required', 'Please enter your M-Pesa phone number.');
      return;
    }
    
    if (newPaymentMethod.type === 'card') {
      if (!newPaymentMethod.card_number || !newPaymentMethod.card_holder_name || 
          !newPaymentMethod.expiry_date || !newPaymentMethod.cvv) {
        Alert.alert('Card Details Required', 'Please fill in all card details.');
        return;
      }
    }

    try {
      setLoading(true);
      await paymentService.addPaymentMethod({
        ...newPaymentMethod,
        user_id: user.id,
      });
      
      setShowAddMethodModal(false);
      setNewPaymentMethod({
        type: 'mpesa',
        phone_number: '',
        card_number: '',
        card_holder_name: '',
        expiry_date: '',
        cvv: '',
        is_default: false,
      });
      
      Alert.alert('Payment Method Added', 'Your payment method has been added successfully.');
      await loadPaymentData();
    } catch (error) {
      Alert.alert('Failed to Add Payment Method', error.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTopUp = async () => {
    const amount = parseFloat(topUpAmount);
    
    if (!amount || amount < 10) {
      Alert.alert('Invalid Amount', 'Minimum top-up amount is KES 10.');
      return;
    }
    
    if (amount > 50000) {
      Alert.alert('Amount Too High', 'Maximum top-up amount is KES 50,000.');
      return;
    }
    
    if (!selectedPaymentMethod) {
      Alert.alert('Payment Method Required', 'Please select a payment method.');
      return;
    }

    try {
      setLoading(true);
      const result = await paymentService.topUpAccount({
        amount,
        payment_method_id: selectedPaymentMethod,
        user_id: user.id,
      });
      
      setShowTopUpModal(false);
      setTopUpAmount('');
      setSelectedPaymentMethod('');
      
      Alert.alert(
        'Top-up Initiated',
        `Your account will be credited with KES ${amount} once payment is confirmed.`,
        [
          {
            text: 'View Transaction',
            onPress: () => setSelectedTransaction(result.transaction)
          },
          { text: 'OK' }
        ]
      );
      
      await loadPaymentData();
    } catch (error) {
      Alert.alert('Top-up Failed', error.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePaymentMethod = (methodId) => {
    Alert.alert(
      'Delete Payment Method',
      'Are you sure you want to remove this payment method?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await paymentService.deletePaymentMethod(methodId);
              Alert.alert('Payment Method Removed', 'The payment method has been deleted.');
              await loadPaymentData();
            } catch (error) {
              Alert.alert('Failed to Delete', error.message || 'Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleSetDefaultPaymentMethod = async (methodId) => {
    try {
      await paymentService.setDefaultPaymentMethod(methodId);
      Alert.alert('Default Payment Method Updated');
      await loadPaymentData();
    } catch (error) {
      Alert.alert('Failed to Update', error.message || 'Please try again.');
    }
  };

  const renderAccountBalance = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Account Balance</Text>
      
      <View style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <Ionicons name="wallet" size={32} color={theme.colors.primary} />
          <View style={styles.balanceInfo}>
            <Text style={styles.balanceAmount}>KES {accountBalance.toFixed(2)}</Text>
            <Text style={styles.balanceLabel}>Available Balance</Text>
          </View>
        </View>
        
        <View style={styles.balanceActions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.primaryButton]} 
            onPress={() => setShowTopUpModal(true)}
          >
            <Ionicons name="add" size={20} color={theme.colors.white} />
            <Text style={styles.primaryButtonText}>Top Up</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.secondaryButton]} 
            onPress={() => navigation.navigate('TransactionHistory')}
          >
            <Ionicons name="list" size={20} color={theme.colors.primary} />
            <Text style={styles.secondaryButtonText}>History</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderPaymentStats = () => {
    if (!paymentStats) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Overview (30 days)</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>KES {paymentStats.totalSpent || 0}</Text>
            <Text style={styles.statLabel}>Total Spent</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{paymentStats.totalTransactions || 0}</Text>
            <Text style={styles.statLabel}>Transactions</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>KES {paymentStats.averageTransaction || 0}</Text>
            <Text style={styles.statLabel}>Average</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>KES {paymentStats.totalTopUps || 0}</Text>
            <Text style={styles.statLabel}>Top-ups</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderPaymentMethods = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Payment Methods</Text>
        <TouchableOpacity onPress={() => setShowAddMethodModal(true)}>
          <Text style={styles.addMethodText}>Add Method</Text>
        </TouchableOpacity>
      </View>
      
      {paymentMethods.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="card-outline" size={48} color={theme.colors.gray} />
          <Text style={styles.emptyText}>No payment methods added</Text>
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={() => setShowAddMethodModal(true)}
          >
            <Text style={styles.addButtonText}>Add Payment Method</Text>
          </TouchableOpacity>
        </View>
      ) : (
        paymentMethods.map((method) => (
          <View key={method.id} style={styles.methodCard}>
            <View style={styles.methodHeader}>
              <View style={styles.methodInfo}>
                <Ionicons 
                  name={method.type === 'mpesa' ? 'phone-portrait' : 'card'} 
                  size={24} 
                  color={theme.colors.primary} 
                />
                <View style={styles.methodDetails}>
                  <Text style={styles.methodType}>
                    {method.type === 'mpesa' ? 'M-Pesa' : 'Credit Card'}
                  </Text>
                  <Text style={styles.methodNumber}>
                    {method.type === 'mpesa' 
                      ? method.phone_number 
                      : `**** **** **** ${method.card_number?.slice(-4)}`
                    }
                  </Text>
                </View>
              </View>
              
              {method.is_default && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultText}>Default</Text>
                </View>
              )}
            </View>
            
            <View style={styles.methodActions}>
              {!method.is_default && (
                <TouchableOpacity 
                  style={styles.methodAction} 
                  onPress={() => handleSetDefaultPaymentMethod(method.id)}
                >
                  <Text style={styles.methodActionText}>Set Default</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={styles.methodAction} 
                onPress={() => handleDeletePaymentMethod(method.id)}
              >
                <Text style={[styles.methodActionText, styles.deleteText]}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </View>
  );

  const renderPendingTransactions = () => {
    if (pendingTransactions.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pending Transactions</Text>
        
        {pendingTransactions.map((transaction) => (
          <TouchableOpacity
            key={transaction.id}
            style={styles.transactionItem}
            onPress={() => {
              setSelectedTransaction(transaction);
              setShowTransactionModal(true);
            }}
          >
            <View style={styles.transactionContent}>
              <View style={styles.transactionHeader}>
                <Text style={styles.transactionType}>{transaction.type}</Text>
                <Text style={styles.transactionAmount}>
                  {transaction.type === 'top_up' ? '+' : '-'}KES {transaction.amount}
                </Text>
              </View>
              
              <Text style={styles.transactionDescription}>
                {transaction.description || transaction.type}
              </Text>
              
              <View style={styles.transactionFooter}>
                <View style={[styles.statusBadge, styles.pendingStatus]}>
                  <Text style={styles.statusText}>Pending</Text>
                </View>
                
                <Text style={styles.transactionDate}>
                  {new Date(transaction.created_at).toLocaleDateString()}
                </Text>
              </View>
            </View>
            
            <Ionicons name="chevron-forward" size={20} color={theme.colors.gray} />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderRecentTransactions = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        <TouchableOpacity onPress={() => navigation.navigate('TransactionHistory')}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>
      
      {paymentHistory.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={48} color={theme.colors.gray} />
          <Text style={styles.emptyText}>No transactions yet</Text>
        </View>
      ) : (
        paymentHistory.slice(0, 5).map((transaction) => (
          <TouchableOpacity
            key={transaction.id}
            style={styles.transactionItem}
            onPress={() => {
              setSelectedTransaction(transaction);
              setShowTransactionModal(true);
            }}
          >
            <View style={styles.transactionContent}>
              <View style={styles.transactionHeader}>
                <Text style={styles.transactionType}>{transaction.type}</Text>
                <Text style={[
                  styles.transactionAmount,
                  transaction.type === 'top_up' ? styles.positiveAmount : styles.negativeAmount
                ]}>
                  {transaction.type === 'top_up' ? '+' : '-'}KES {transaction.amount}
                </Text>
              </View>
              
              <Text style={styles.transactionDescription}>
                {transaction.description || transaction.type}
              </Text>
              
              <View style={styles.transactionFooter}>
                <View style={[
                  styles.statusBadge,
                  transaction.status === 'completed' ? styles.completedStatus :
                  transaction.status === 'pending' ? styles.pendingStatus :
                  styles.failedStatus
                ]}>
                  <Text style={styles.statusText}>{transaction.status}</Text>
                </View>
                
                <Text style={styles.transactionDate}>
                  {new Date(transaction.created_at).toLocaleDateString()}
                </Text>
              </View>
            </View>
            
            <Ionicons name="chevron-forward" size={20} color={theme.colors.gray} />
          </TouchableOpacity>
        ))
      )}
    </View>
  );

  // Modals
  const renderAddMethodModal = () => (
    <Modal visible={showAddMethodModal} animationType="slide" presentationStyle="formSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowAddMethodModal(false)}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Add Payment Method</Text>
          <TouchableOpacity onPress={handleAddPaymentMethod}>
            <Text style={styles.saveButton}>Add</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Payment Type</Text>
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[
                  styles.typeOption,
                  newPaymentMethod.type === 'mpesa' && styles.selectedType
                ]}
                onPress={() => setNewPaymentMethod(prev => ({ ...prev, type: 'mpesa' }))}
              >
                <Ionicons name="phone-portrait" size={24} color={theme.colors.primary} />
                <Text style={styles.typeText}>M-Pesa</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.typeOption,
                  newPaymentMethod.type === 'card' && styles.selectedType
                ]}
                onPress={() => setNewPaymentMethod(prev => ({ ...prev, type: 'card' }))}
              >
                <Ionicons name="card" size={24} color={theme.colors.primary} />
                <Text style={styles.typeText}>Credit Card</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {newPaymentMethod.type === 'mpesa' ? (
            <View style={styles.formGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={newPaymentMethod.phone_number}
                onChangeText={(text) => setNewPaymentMethod(prev => ({ ...prev, phone_number: text }))}
                placeholder="e.g., 254712345678"
                keyboardType="phone-pad"
              />
            </View>
          ) : (
            <>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Card Number</Text>
                <TextInput
                  style={styles.input}
                  value={newPaymentMethod.card_number}
                  onChangeText={(text) => setNewPaymentMethod(prev => ({ ...prev, card_number: text }))}
                  placeholder="1234 5678 9012 3456"
                  keyboardType="number-pad"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Card Holder Name</Text>
                <TextInput
                  style={styles.input}
                  value={newPaymentMethod.card_holder_name}
                  onChangeText={(text) => setNewPaymentMethod(prev => ({ ...prev, card_holder_name: text }))}
                  placeholder="John Doe"
                />
              </View>
              
              <View style={styles.formRow}>
                <View style={[styles.formGroup, styles.halfWidth]}>
                  <Text style={styles.label}>Expiry Date</Text>
                  <TextInput
                    style={styles.input}
                    value={newPaymentMethod.expiry_date}
                    onChangeText={(text) => setNewPaymentMethod(prev => ({ ...prev, expiry_date: text }))}
                    placeholder="MM/YY"
                    keyboardType="number-pad"
                  />
                </View>
                
                <View style={[styles.formGroup, styles.halfWidth]}>
                  <Text style={styles.label}>CVV</Text>
                  <TextInput
                    style={styles.input}
                    value={newPaymentMethod.cvv}
                    onChangeText={(text) => setNewPaymentMethod(prev => ({ ...prev, cvv: text }))}
                    placeholder="123"
                    keyboardType="number-pad"
                    secureTextEntry
                  />
                </View>
              </View>
            </>
          )}
          
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setNewPaymentMethod(prev => ({ ...prev, is_default: !prev.is_default }))}
          >
            <View style={[
              styles.checkbox,
              newPaymentMethod.is_default && styles.checkedCheckbox
            ]}>
              {newPaymentMethod.is_default && (
                <Ionicons name="checkmark" size={16} color={theme.colors.white} />
              )}
            </View>
            <Text style={styles.checkboxText}>Set as default payment method</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );

  const renderTopUpModal = () => (
    <Modal visible={showTopUpModal} animationType="slide" presentationStyle="formSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowTopUpModal(false)}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Top Up Account</Text>
          <TouchableOpacity onPress={handleTopUp}>
            <Text style={styles.saveButton}>Top Up</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.modalContent}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Amount (KES)</Text>
            <TextInput
              style={styles.input}
              value={topUpAmount}
              onChangeText={setTopUpAmount}
              placeholder="Enter amount (min. 10)"
              keyboardType="decimal-pad"
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Payment Method</Text>
            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentMethodOption,
                  selectedPaymentMethod === method.id && styles.selectedPaymentMethod
                ]}
                onPress={() => setSelectedPaymentMethod(method.id)}
              >
                <Ionicons 
                  name={method.type === 'mpesa' ? 'phone-portrait' : 'card'} 
                  size={24} 
                  color={theme.colors.primary} 
                />
                <Text style={styles.paymentMethodText}>
                  {method.type === 'mpesa' ? 'M-Pesa' : 'Credit Card'} - 
                  {method.type === 'mpesa' 
                    ? method.phone_number 
                    : `**** ${method.card_number?.slice(-4)}`
                  }
                </Text>
                
                {selectedPaymentMethod === method.id && (
                  <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
          
          {topUpAmount && parseFloat(topUpAmount) >= 10 && (
            <View style={styles.feeBreakdown}>
              <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>Amount:</Text>
                <Text style={styles.feeValue}>KES {topUpAmount}</Text>
              </View>
              <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>Processing Fee:</Text>
                <Text style={styles.feeValue}>KES {(parseFloat(topUpAmount) * 0.02).toFixed(2)}</Text>
              </View>
              <View style={[styles.feeRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total:</Text>
                <Text style={styles.totalValue}>
                  KES {(parseFloat(topUpAmount) * 1.02).toFixed(2)}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );

  const renderTransactionModal = () => (
    <Modal visible={showTransactionModal} animationType="slide" presentationStyle="formSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowTransactionModal(false)}>
            <Text style={styles.cancelButton}>Close</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Transaction Details</Text>
          <View style={styles.placeholder} />
        </View>
        
        {selectedTransaction && (
          <ScrollView style={styles.modalContent}>
            <View style={styles.transactionDetail}>
              <Text style={styles.detailLabel}>Transaction ID</Text>
              <Text style={styles.detailValue}>{selectedTransaction.id}</Text>
            </View>
            
            <View style={styles.transactionDetail}>
              <Text style={styles.detailLabel}>Type</Text>
              <Text style={styles.detailValue}>{selectedTransaction.type}</Text>
            </View>
            
            <View style={styles.transactionDetail}>
              <Text style={styles.detailLabel}>Amount</Text>
              <Text style={[
                styles.detailValue,
                selectedTransaction.type === 'top_up' ? styles.positiveAmount : styles.negativeAmount
              ]}>
                {selectedTransaction.type === 'top_up' ? '+' : '-'}KES {selectedTransaction.amount}
              </Text>
            </View>
            
            <View style={styles.transactionDetail}>
              <Text style={styles.detailLabel}>Status</Text>
              <View style={[
                styles.statusBadge,
                selectedTransaction.status === 'completed' ? styles.completedStatus :
                selectedTransaction.status === 'pending' ? styles.pendingStatus :
                styles.failedStatus
              ]}>
                <Text style={styles.statusText}>{selectedTransaction.status}</Text>
              </View>
            </View>
            
            <View style={styles.transactionDetail}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>
                {new Date(selectedTransaction.created_at).toLocaleString()}
              </Text>
            </View>
            
            {selectedTransaction.description && (
              <View style={styles.transactionDetail}>
                <Text style={styles.detailLabel}>Description</Text>
                <Text style={styles.detailValue}>{selectedTransaction.description}</Text>
              </View>
            )}
            
            {selectedTransaction.payment_method && (
              <View style={styles.transactionDetail}>
                <Text style={styles.detailLabel}>Payment Method</Text>
                <Text style={styles.detailValue}>{selectedTransaction.payment_method}</Text>
              </View>
            )}
            
            {selectedTransaction.reference && (
              <View style={styles.transactionDetail}>
                <Text style={styles.detailLabel}>Reference</Text>
                <Text style={styles.detailValue}>{selectedTransaction.reference}</Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </Modal>
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {renderAccountBalance()}
      {renderPaymentStats()}
      {renderPendingTransactions()}
      {renderPaymentMethods()}
      {renderRecentTransactions()}
      {renderAddMethodModal()}
      {renderTopUpModal()}
      {renderTransactionModal()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 15,
  },
  addMethodText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  seeAllText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  balanceCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  balanceInfo: {
    marginLeft: 15,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  balanceLabel: {
    fontSize: 14,
    color: theme.colors.gray,
  },
  balanceActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
  },
  secondaryButton: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  primaryButtonText: {
    color: theme.colors.white,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  statCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 15,
    width: '47%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.gray,
    textAlign: 'center',
  },
  methodCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  methodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  methodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodDetails: {
    marginLeft: 10,
  },
  methodType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  methodNumber: {
    fontSize: 14,
    color: theme.colors.gray,
  },
  defaultBadge: {
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  methodActions: {
    flexDirection: 'row',
    gap: 15,
  },
  methodAction: {
    paddingVertical: 5,
  },
  methodActionText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  deleteText: {
    color: theme.colors.error,
  },
  transactionItem: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  transactionContent: {
    flex: 1,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    textTransform: 'capitalize',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  positiveAmount: {
    color: theme.colors.success,
  },
  negativeAmount: {
    color: theme.colors.error,
  },
  transactionDescription: {
    fontSize: 14,
    color: theme.colors.gray,
    marginBottom: 10,
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedStatus: {
    backgroundColor: theme.colors.success + '20',
  },
  pendingStatus: {
    backgroundColor: theme.colors.warning + '20',
  },
  failedStatus: {
    backgroundColor: theme.colors.error + '20',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.success,
  },
  transactionDate: {
    fontSize: 12,
    color: theme.colors.gray,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.gray,
    marginTop: 10,
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addButtonText: {
    color: theme.colors.white,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  cancelButton: {
    color: theme.colors.gray,
    fontSize: 16,
  },
  saveButton: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
    gap: 15,
  },
  halfWidth: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme.colors.text,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 15,
  },
  typeOption: {
    flex: 1,
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  selectedType: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  typeText: {
    fontSize: 14,
    color: theme.colors.text,
    marginTop: 8,
    fontWeight: '600',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkedCheckbox: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkboxText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  paymentMethodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 10,
    backgroundColor: theme.colors.background,
  },
  selectedPaymentMethod: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  paymentMethodText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
    marginLeft: 10,
  },
  feeBreakdown: {
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    padding: 15,
    marginTop: 20,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 8,
  },
  feeLabel: {
    fontSize: 14,
    color: theme.colors.text,
  },
  feeValue: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '600',
  },
  totalLabel: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  transactionDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  detailLabel: {
    fontSize: 14,
    color: theme.colors.gray,
  },
  detailValue: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  placeholder: {
    width: 60,
  },
});

export default PaymentManagementScreen;