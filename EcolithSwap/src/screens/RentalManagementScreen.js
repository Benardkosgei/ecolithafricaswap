import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import rentalService from '../services/rentalService';
import { theme } from '../utils/theme';

const RentalManagementScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { currentRental, loadCurrentRental } = useData();
  const [refreshing, setRefreshing] = useState(false);
  const [rentalHistory, setRentalHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rentalTimer, setRentalTimer] = useState(null);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [extensionHours, setExtensionHours] = useState('1');
  const [issueDescription, setIssueDescription] = useState('');
  const [issueType, setIssueType] = useState('battery_defect');
  const [rentalAnalytics, setRentalAnalytics] = useState(null);

  useEffect(() => {
    loadRentalData();
    
    // Update timer every minute for active rental
    const interval = setInterval(() => {
      if (currentRental && currentRental.status === 'active') {
        updateRentalTimer();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [currentRental]);

  const loadRentalData = async () => {
    try {
      setLoading(true);
      const [history, analytics] = await Promise.all([
        rentalService.getRentalHistory({ limit: 20 }),
        rentalService.getRentalAnalytics('30d'),
      ]);
      
      setRentalHistory(history?.data || []);
      setRentalAnalytics(analytics);
      
      if (currentRental) {
        updateRentalTimer();
      }
    } catch (error) {
      console.error('Error loading rental data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateRentalTimer = () => {
    if (currentRental) {
      const startTime = new Date(currentRental.rental_date);
      const now = new Date();
      const diffMs = now - startTime;
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      setRentalTimer({ hours, minutes, totalMinutes: Math.floor(diffMs / (1000 * 60)) });
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      loadRentalData(),
      loadCurrentRental(),
    ]);
    setRefreshing(false);
  }, []);

  const handleExtendRental = async () => {
    try {
      setLoading(true);
      const hours = parseInt(extensionHours);
      
      if (hours < 1 || hours > 24) {
        Alert.alert('Invalid Extension', 'Extension must be between 1 and 24 hours.');
        return;
      }
      
      const result = await rentalService.extendRental(currentRental.id, hours);
      setShowExtendModal(false);
      setExtensionHours('1');
      
      Alert.alert(
        'Rental Extended',
        `Your rental has been extended by ${hours} hour(s). Additional charge: KES ${hours * 25}`
      );
      
      await loadCurrentRental();
    } catch (error) {
      Alert.alert('Extension Failed', error.message || 'Failed to extend rental.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRental = () => {
    Alert.alert(
      'Cancel Rental',
      'Are you sure you want to cancel this rental? Cancellation fees may apply.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await rentalService.cancelRental(currentRental.id);
              Alert.alert('Rental Cancelled', 'Your rental has been cancelled successfully.');
              await loadCurrentRental();
            } catch (error) {
              Alert.alert('Cancellation Failed', error.message || 'Failed to cancel rental.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleReportIssue = async () => {
    if (!issueDescription.trim()) {
      Alert.alert('Issue Description Required', 'Please describe the issue you are experiencing.');
      return;
    }

    try {
      setLoading(true);
      await rentalService.reportIssue(currentRental.id, {
        issue_type: issueType,
        description: issueDescription,
        reported_at: new Date().toISOString(),
      });
      
      setShowIssueModal(false);
      setIssueDescription('');
      setIssueType('battery_defect');
      
      Alert.alert('Issue Reported', 'Your issue has been reported. Our support team will contact you soon.');
    } catch (error) {
      Alert.alert('Failed to Report Issue', error.message || 'Unable to report issue at this time.');
    } finally {
      setLoading(false);
    }
  };

  const handleReturnBattery = () => {
    navigation.navigate('StationFinder', { 
      mode: 'return',
      rentalId: currentRental.id 
    });
  };

  const calculateEstimatedCost = () => {
    if (!rentalTimer) return 50;
    const hours = Math.ceil(rentalTimer.totalMinutes / 60);
    return Math.max(50, hours * 25);
  };

  const renderCurrentRental = () => {
    if (!currentRental) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Rental</Text>
        
        <View style={styles.rentalCard}>
          <View style={styles.rentalHeader}>
            <View style={styles.batteryInfo}>
              <Ionicons name="battery-charging" size={24} color={theme.colors.primary} />
              <View style={styles.batteryDetails}>
                <Text style={styles.batterySerial}>Battery #{currentRental.battery_serial}</Text>
                <Text style={styles.stationName}>{currentRental.pickup_station_name}</Text>
              </View>
            </View>
            <View style={[styles.statusBadge, styles.activeStatus]}>
              <Text style={styles.statusText}>Active</Text>
            </View>
          </View>
          
          <View style={styles.rentalDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Started:</Text>
              <Text style={styles.detailValue}>
                {new Date(currentRental.rental_date).toLocaleString()}
              </Text>
            </View>
            
            {rentalTimer && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Duration:</Text>
                <Text style={styles.detailValue}>
                  {rentalTimer.hours}h {rentalTimer.minutes}m
                </Text>
              </View>
            )}
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Estimated Cost:</Text>
              <Text style={[styles.detailValue, styles.costValue]}>
                KES {calculateEstimatedCost()}
              </Text>
            </View>
          </View>
          
          <View style={styles.rentalActions}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.primaryButton]} 
              onPress={handleReturnBattery}
            >
              <Ionicons name="arrow-back" size={20} color={theme.colors.white} />
              <Text style={styles.primaryButtonText}>Return Battery</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.secondaryButton]} 
              onPress={() => setShowExtendModal(true)}
            >
              <Ionicons name="time" size={20} color={theme.colors.primary} />
              <Text style={styles.secondaryButtonText}>Extend</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.secondaryButton]} 
              onPress={() => setShowIssueModal(true)}
            >
              <Ionicons name="warning" size={20} color={theme.colors.warning} />
              <Text style={styles.secondaryButtonText}>Report Issue</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={handleCancelRental}
          >
            <Text style={styles.cancelButtonText}>Cancel Rental</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderAnalytics = () => {
    if (!rentalAnalytics) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Rental Stats (30 days)</Text>
        
        <View style={styles.analyticsGrid}>
          <View style={styles.analyticsCard}>
            <Text style={styles.analyticsValue}>{rentalAnalytics.totalRentals || 0}</Text>
            <Text style={styles.analyticsLabel}>Total Rentals</Text>
          </View>
          
          <View style={styles.analyticsCard}>
            <Text style={styles.analyticsValue}>{rentalAnalytics.totalHours || 0}h</Text>
            <Text style={styles.analyticsLabel}>Total Usage</Text>
          </View>
          
          <View style={styles.analyticsCard}>
            <Text style={styles.analyticsValue}>KES {rentalAnalytics.totalSpent || 0}</Text>
            <Text style={styles.analyticsLabel}>Total Spent</Text>
          </View>
          
          <View style={styles.analyticsCard}>
            <Text style={styles.analyticsValue}>{rentalAnalytics.co2Saved || 0} kg</Text>
            <Text style={styles.analyticsLabel}>CO₂ Saved</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderRentalHistory = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Rentals</Text>
        <TouchableOpacity onPress={() => navigation.navigate('History')}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>
      
      {rentalHistory.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="battery-outline" size={48} color={theme.colors.gray} />
          <Text style={styles.emptyText}>No rental history yet</Text>
        </View>
      ) : (
        rentalHistory.slice(0, 5).map((rental) => (
          <TouchableOpacity 
            key={rental.id} 
            style={styles.historyItem}
            onPress={() => navigation.navigate('RentalDetails', { rental })}
          >
            <View style={styles.historyItemContent}>
              <View style={styles.historyItemHeader}>
                <Text style={styles.historyItemTitle}>Battery #{rental.battery_serial}</Text>
                <Text style={styles.historyItemDate}>
                  {new Date(rental.rental_date).toLocaleDateString()}
                </Text>
              </View>
              
              <Text style={styles.historyItemLocation}>
                {rental.pickup_station_name} → {rental.return_station_name || 'In Progress'}
              </Text>
              
              <View style={styles.historyItemFooter}>
                <View style={[styles.statusBadge, 
                  rental.status === 'completed' ? styles.completedStatus :
                  rental.status === 'active' ? styles.activeStatus :
                  styles.cancelledStatus
                ]}>
                  <Text style={styles.statusText}>{rental.status}</Text>
                </View>
                
                <Text style={styles.historyItemCost}>KES {rental.total_cost || '0'}</Text>
              </View>
            </View>
            
            <Ionicons name="chevron-forward" size={20} color={theme.colors.gray} />
          </TouchableOpacity>
        ))
      )}
    </View>
  );

  const renderExtendModal = () => (
    <Modal visible={showExtendModal} animationType="slide" presentationStyle="formSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowExtendModal(false)}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Extend Rental</Text>
          <TouchableOpacity onPress={handleExtendRental}>
            <Text style={styles.saveButton}>Extend</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.modalContent}>
          <Text style={styles.modalDescription}>
            Select how many hours you want to extend your rental. Additional charges apply.
          </Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Extension Hours</Text>
            <TextInput
              style={styles.input}
              value={extensionHours}
              onChangeText={setExtensionHours}
              keyboardType="number-pad"
              placeholder="Enter hours (1-24)"
            />
          </View>
          
          <View style={styles.costBreakdown}>
            <Text style={styles.costLabel}>Additional Cost:</Text>
            <Text style={styles.costValue}>
              KES {parseInt(extensionHours || 0) * 25}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderIssueModal = () => (
    <Modal visible={showIssueModal} animationType="slide" presentationStyle="formSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowIssueModal(false)}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Report Issue</Text>
          <TouchableOpacity onPress={handleReportIssue}>
            <Text style={styles.saveButton}>Report</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Issue Type</Text>
            <View style={styles.issueTypeGrid}>
              {[
                { value: 'battery_defect', label: 'Battery Defect' },
                { value: 'charging_issue', label: 'Charging Issue' },
                { value: 'station_problem', label: 'Station Problem' },
                { value: 'billing_issue', label: 'Billing Issue' },
                { value: 'other', label: 'Other' },
              ].map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.issueTypeButton,
                    issueType === type.value && styles.selectedIssueType
                  ]}
                  onPress={() => setIssueType(type.value)}
                >
                  <Text style={[
                    styles.issueTypeText,
                    issueType === type.value && styles.selectedIssueTypeText
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={issueDescription}
              onChangeText={setIssueDescription}
              placeholder="Please describe the issue in detail..."
              multiline
              numberOfLines={4}
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  if (!currentRental && rentalHistory.length === 0) {
    return (
      <ScrollView 
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.emptyContainer}>
          <Ionicons name="battery-outline" size={80} color={theme.colors.gray} />
          <Text style={styles.emptyTitle}>No Rentals Yet</Text>
          <Text style={styles.emptyDescription}>
            Start your first battery rental by finding a nearby station and scanning a QR code.
          </Text>
          
          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={() => navigation.navigate('StationFinder')}
          >
            <Text style={styles.primaryButtonText}>Find Stations</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {renderCurrentRental()}
      {renderAnalytics()}
      {renderRentalHistory()}
      {renderExtendModal()}
      {renderIssueModal()}
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
  seeAllText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  rentalCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rentalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  batteryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  batteryDetails: {
    marginLeft: 10,
  },
  batterySerial: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  stationName: {
    fontSize: 14,
    color: theme.colors.gray,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeStatus: {
    backgroundColor: theme.colors.success + '20',
  },
  completedStatus: {
    backgroundColor: theme.colors.primary + '20',
  },
  cancelledStatus: {
    backgroundColor: theme.colors.error + '20',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.success,
  },
  rentalDetails: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: theme.colors.gray,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  costValue: {
    color: theme.colors.primary,
  },
  rentalActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
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
  cancelButton: {
    alignItems: 'center',
    padding: 8,
  },
  cancelButtonText: {
    color: theme.colors.error,
    fontWeight: '600',
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  analyticsCard: {
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
  analyticsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 5,
  },
  analyticsLabel: {
    fontSize: 12,
    color: theme.colors.gray,
    textAlign: 'center',
  },
  historyItem: {
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
  historyItemContent: {
    flex: 1,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  historyItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  historyItemDate: {
    fontSize: 12,
    color: theme.colors.gray,
  },
  historyItemLocation: {
    fontSize: 14,
    color: theme.colors.gray,
    marginBottom: 10,
  },
  historyItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyItemCost: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.gray,
    marginTop: 10,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 20,
    marginBottom: 10,
  },
  emptyDescription: {
    fontSize: 16,
    color: theme.colors.gray,
    textAlign: 'center',
    marginBottom: 30,
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
  modalContent: {
    padding: 20,
  },
  modalDescription: {
    fontSize: 16,
    color: theme.colors.gray,
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 20,
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  costBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: 15,
    borderRadius: 8,
  },
  costLabel: {
    fontSize: 16,
    color: theme.colors.text,
  },
  issueTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  issueTypeButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },
  selectedIssueType: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  issueTypeText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  selectedIssueTypeText: {
    color: theme.colors.white,
  },
  saveButton: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
});

export default RentalManagementScreen;