import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Card, Button, FAB, Chip, ActivityIndicator } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useData } from '../contexts/DataContext';
import batteryService from '../services/batteryService';
import { colors, typography, spacing } from '../utils/theme';

export default function SwapChargeScreen({ navigation }) {
  const { 
    activeRental, 
    stations, 
    isOnline, 
    completeBatteryReturn 
  } = useData();
  
  const [rentalTimer, setRentalTimer] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [nearbyStations, setNearbyStations] = useState([]);

  // Update rental timer every minute
  useEffect(() => {
    let interval;
    if (activeRental) {
      interval = setInterval(() => {
        const timer = batteryService.calculateRentalTimer(activeRental.start_time);
        setRentalTimer(timer);
      }, 60000);
      
      // Initial calculation
      const timer = batteryService.calculateRentalTimer(activeRental.start_time);
      setRentalTimer(timer);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeRental]);

  // Filter nearby stations for returns
  useEffect(() => {
    const swapStations = stations.filter(station => 
      station.station_type === 'swap' || station.station_type === 'both'
    );
    setNearbyStations(swapStations.slice(0, 5)); // Show top 5
  }, [stations]);

  const handleReturnBattery = async (stationId) => {
    try {
      setProcessing(true);
      
      Alert.alert(
        'Confirm Battery Return',
        'Are you sure you want to return your battery at this station?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setProcessing(false),
          },
          {
            text: 'Return',
            onPress: async () => {
              try {
                const result = await completeBatteryReturn(stationId);
                
                if (result.success) {
                  Alert.alert(
                    'Battery Returned Successfully',
                    result.offline
                      ? 'Return recorded offline. Will sync when connected.'
                      : `Rental completed!\\n\\nDuration: ${result.durationHours} hours\\nTotal Cost: KES ${result.totalCost}\\nCO₂ Saved: ${result.co2Saved.toFixed(1)} kg`,
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
                } else {
                  throw new Error(result.error);
                }
              } catch (error) {
                Alert.alert('Return Error', error.message);
              } finally {
                setProcessing(false);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Return error:', error);
      setProcessing(false);
    }
  };

  const calculateEstimatedCost = () => {
    if (!rentalTimer) return 50; // Minimum cost
    
    const totalMinutes = rentalTimer.totalMinutes;
    const hours = Math.ceil(totalMinutes / 60);
    return Math.max(50, hours * 25); // 50 KES minimum, 25 KES per hour
  };

  const navigateToQRScanner = () => {
    navigation.navigate('QRScanner');
  };

  const navigateToStationFinder = () => {
    navigation.navigate('StationsTab');
  };

  if (!activeRental) {
    return (
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Battery Swap & Charge</Text>
          <Text style={styles.headerSubtitle}>
            Swap or charge your battery at any EcolithSwap station
          </Text>
        </View>

        {/* No Active Rental */}
        <Card style={styles.noRentalCard}>
          <Card.Content style={styles.noRentalContent}>
            <Icon name="battery-alert" size={64} color={colors.textSecondary} />
            <Text style={styles.noRentalTitle}>No Active Battery Rental</Text>
            <Text style={styles.noRentalText}>
              Start a battery swap by scanning a QR code at any station
            </Text>
            
            <Button
              mode="contained"
              onPress={navigateToQRScanner}
              style={styles.scanButton}
              icon="qr-code-scanner"
            >
              Scan QR Code
            </Button>
          </Card.Content>
        </Card>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={navigateToStationFinder}
          >
            <Icon name="location-on" size={32} color={colors.primary} />
            <Text style={styles.actionTitle}>Find Stations</Text>
            <Text style={styles.actionSubtitle}>
              Locate nearby swap and charging stations
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={navigateToQRScanner}
          >
            <Icon name="qr-code-scanner" size={32} color={colors.primary} />
            <Text style={styles.actionTitle}>Scan QR</Text>
            <Text style={styles.actionSubtitle}>
              Scan battery or station QR code
            </Text>
          </TouchableOpacity>
        </View>

        {/* How It Works */}
        <Card style={styles.howItWorksCard}>
          <Card.Content>
            <Text style={styles.cardTitle}>How Battery Swapping Works</Text>
            
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepText}>Find a nearby station with available batteries</Text>
            </View>
            
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>Scan the QR code on the battery you want to rent</Text>
            </View>
            
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepText}>Use the battery for your electric vehicle</Text>
            </View>
            
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>4</Text>
              </View>
              <Text style={styles.stepText}>Return the battery at any station when done</Text>
            </View>
          </Card.Content>
        </Card>

        {/* Pricing */}
        <Card style={styles.pricingCard}>
          <Card.Content>
            <Text style={styles.cardTitle}>Pricing</Text>
            
            <View style={styles.pricingItem}>
              <Text style={styles.pricingLabel}>Base Rate:</Text>
              <Text style={styles.pricingValue}>KES 50</Text>
            </View>
            
            <View style={styles.pricingItem}>
              <Text style={styles.pricingLabel}>Per Hour:</Text>
              <Text style={styles.pricingValue}>KES 25</Text>
            </View>
            
            <View style={styles.pricingNote}>
              <Icon name="info" size={16} color={colors.info} />
              <Text style={styles.pricingNoteText}>
                Minimum charge is KES 50. Additional charges apply per hour of usage.
              </Text>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    );
  }

  // Has active rental
  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Active Battery Rental</Text>
        <Text style={styles.headerSubtitle}>
          Return your battery at any swap station
        </Text>
        
        {!isOnline && (
          <View style={styles.offlineWarning}>
            <Icon name="wifi-off" size={16} color={colors.warning} />
            <Text style={styles.offlineText}>
              Offline mode - return will sync when connected
            </Text>
          </View>
        )}
      </View>

      {/* Active Rental Info */}
      <Card style={styles.activeRentalCard}>
        <Card.Content>
          <View style={styles.rentalHeader}>
            <Icon name="battery-charging-full" size={24} color={colors.primary} />
            <Text style={styles.rentalTitle}>Battery {activeRental.battery_id}</Text>
            <Chip mode="outlined" compact style={styles.statusChip}>
              Active
            </Chip>
          </View>
          
          <View style={styles.rentalDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Station:</Text>
              <Text style={styles.detailValue}>{activeRental.stations?.name}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Started:</Text>
              <Text style={styles.detailValue}>
                {new Date(activeRental.start_time).toLocaleString()}
              </Text>
            </View>
            
            {rentalTimer && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Duration:</Text>
                <Text style={[styles.detailValue, styles.timerValue]}>
                  {rentalTimer.formattedTime}
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
        </Card.Content>
      </Card>

      {/* Return Options */}
      <View style={styles.returnOptions}>
        <Text style={styles.sectionTitle}>Return Battery</Text>
        
        <Card style={styles.scanReturnCard}>
          <Card.Content>
            <View style={styles.scanReturnContent}>
              <Icon name="qr-code-scanner" size={32} color={colors.primary} />
              <View style={styles.scanReturnText}>
                <Text style={styles.scanReturnTitle}>Scan Station QR</Text>
                <Text style={styles.scanReturnSubtitle}>
                  Scan the QR code at any station to return
                </Text>
              </View>
            </View>
            
            <Button
              mode="contained"
              onPress={navigateToQRScanner}
              style={styles.scanReturnButton}
              disabled={processing}
            >
              Scan QR Code
            </Button>
          </Card.Content>
        </Card>

        {/* Nearby Stations */}
        {nearbyStations.length > 0 && (
          <View style={styles.nearbyStations}>
            <Text style={styles.stationsTitle}>Nearby Return Stations</Text>
            
            {nearbyStations.map((station) => (
              <Card key={station.id} style={styles.stationCard}>
                <Card.Content>
                  <View style={styles.stationInfo}>
                    <View style={styles.stationDetails}>
                      <Text style={styles.stationName}>{station.name}</Text>
                      <Text style={styles.stationAddress}>{station.address}</Text>
                      <View style={styles.stationMeta}>
                        <Text style={styles.availabilityText}>
                          {station.available_batteries}/{station.total_slots} slots available
                        </Text>
                      </View>
                    </View>
                    
                    <Button
                      mode="outlined"
                      compact
                      onPress={() => handleReturnBattery(station.id)}
                      disabled={processing}
                      loading={processing}
                    >
                      Return Here
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            ))}
            
            <Button
              mode="text"
              onPress={navigateToStationFinder}
              style={styles.viewAllStationsButton}
            >
              View All Stations
            </Button>
          </View>
        )}
      </View>

      {/* FAB for QR Scanner */}
      <FAB
        style={styles.fab}
        icon="qr-code-scanner"
        onPress={navigateToQRScanner}
        label="Scan QR"
        disabled={processing}
      />
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
  offlineWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    gap: spacing.sm,
  },
  offlineText: {
    ...typography.caption,
    color: 'white',
  },
  noRentalCard: {
    margin: spacing.md,
    backgroundColor: colors.surface,
  },
  noRentalContent: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  noRentalTitle: {
    ...typography.h3,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  noRentalText: {
    ...typography.body,
    textAlign: 'center',
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  scanButton: {
    backgroundColor: colors.primary,
  },
  quickActions: {
    padding: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  actionCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  actionTitle: {
    ...typography.h3,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  actionSubtitle: {
    ...typography.body,
    textAlign: 'center',
    color: colors.textSecondary,
  },
  howItWorksCard: {
    margin: spacing.md,
    backgroundColor: colors.surface,
  },
  cardTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  stepNumberText: {
    ...typography.caption,
    color: 'white',
    fontWeight: 'bold',
  },
  stepText: {
    ...typography.body,
    flex: 1,
    lineHeight: 20,
  },
  pricingCard: {
    margin: spacing.md,
    marginBottom: spacing.xxl,
    backgroundColor: colors.surface,
  },
  pricingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  pricingLabel: {
    ...typography.body,
  },
  pricingValue: {
    ...typography.h3,
    color: colors.primary,
  },
  pricingNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  pricingNoteText: {
    ...typography.caption,
    flex: 1,
    color: colors.textSecondary,
  },
  activeRentalCard: {
    margin: spacing.md,
    backgroundColor: colors.surface,
  },
  rentalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  rentalTitle: {
    ...typography.h3,
    marginLeft: spacing.sm,
    flex: 1,
  },
  statusChip: {
    borderColor: colors.success,
  },
  rentalDetails: {
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  detailValue: {
    ...typography.body,
    fontWeight: '600',
  },
  timerValue: {
    color: colors.primary,
    fontSize: 18,
  },
  costValue: {
    color: colors.warning,
    fontSize: 18,
  },
  returnOptions: {
    padding: spacing.md,
  },
  scanReturnCard: {
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  scanReturnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  scanReturnText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  scanReturnTitle: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  scanReturnSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  scanReturnButton: {
    backgroundColor: colors.primary,
  },
  nearbyStations: {
    marginTop: spacing.md,
  },
  stationsTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  stationCard: {
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  stationInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stationDetails: {
    flex: 1,
  },
  stationName: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  stationAddress: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  stationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availabilityText: {
    ...typography.caption,
    color: colors.success,
  },
  viewAllStationsButton: {
    marginTop: spacing.sm,
  },
  fab: {
    position: 'absolute',
    margin: spacing.md,
    right: 0,
    bottom: spacing.xl,
    backgroundColor: colors.primary,
  },
});
