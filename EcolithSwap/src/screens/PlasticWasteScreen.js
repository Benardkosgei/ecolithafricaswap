import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  TextInput,
  Button,
  Card,
  FAB,
  ActivityIndicator,
  Modal,
  Portal,
  List,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useData } from '../contexts/DataContext';
import wasteService from '../services/wasteService';
import { colors, typography, spacing } from '../utils/theme';

export default function PlasticWasteScreen({ navigation }) {
  const { userStats, stations, isOnline, logPlasticWaste } = useData();
  const [weight, setWeight] = useState('');
  const [selectedStation, setSelectedStation] = useState(null);
  const [showStationPicker, setShowStationPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [wasteHistory, setWasteHistory] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadWasteData();
  }, []);

  const loadWasteData = async () => {
    try {
      setLoading(true);
      if (isOnline) {
        const [history, monthly] = await Promise.all([
          wasteService.getWasteHistory(10),
          wasteService.getMonthlyWasteStats(),
        ]);
        setWasteHistory(history);
        setMonthlyStats(monthly);
      }
    } catch (error) {
      console.error('Error loading waste data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitWaste = async () => {
    // Validation
    const weightNum = parseFloat(weight);
    if (!weightNum || weightNum <= 0) {
      Alert.alert('Invalid Weight', 'Please enter a valid weight in kg.');
      return;
    }

    if (weightNum > 100) {
      Alert.alert('Weight Too High', 'Maximum weight allowed is 100kg per entry.');
      return;
    }

    if (!selectedStation) {
      Alert.alert('Station Required', 'Please select a station where you dropped off the plastic.');
      return;
    }

    try {
      setSubmitting(true);
      
      const result = await logPlasticWaste(weightNum, selectedStation.id);
      
      if (result.success) {
        const pointsMessage = `You earned ${result.points} eco points!`;
        const offlineMessage = result.offline ? '\\n\\nLogged offline. Will sync when connected.' : '';
        
        Alert.alert(
          'Plastic Waste Logged',
          `${weightNum}kg of plastic waste recorded successfully!\\n${pointsMessage}${offlineMessage}`,
          [
            {
              text: 'Log More',
              onPress: () => {
                setWeight('');
                setSelectedStation(null);
                loadWasteData(); // Refresh data
              },
            },
            {
              text: 'View Impact',
              onPress: () => navigation.navigate('ImpactTab'),
            },
          ]
        );
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      Alert.alert('Submit Error', error.message || 'Failed to log plastic waste. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateNextReward = (currentPoints) => {
    const rewardTiers = [100, 250, 500, 1000, 2500, 5000];
    const nextTier = rewardTiers.find(tier => tier > currentPoints);
    return nextTier || null;
  };

  const plasticStations = stations.filter(station => station.accepts_plastic);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header Stats */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Plastic Waste Recycling</Text>
          <Text style={styles.headerSubtitle}>
            Turn plastic waste into eco points and impact
          </Text>
          
          {!isOnline && (
            <View style={styles.offlineWarning}>
              <Icon name="wifi-off" size={16} color={colors.warning} />
              <Text style={styles.offlineText}>
                Offline mode - entries will sync when connected
              </Text>
            </View>
          )}
        </View>

        {/* Current Points Card */}
        <Card style={styles.pointsCard}>
          <Card.Content>
            <View style={styles.pointsHeader}>
              <Icon name="stars" size={24} color={colors.warning} />
              <Text style={styles.pointsTitle}>Your Eco Points</Text>
            </View>
            
            <Text style={styles.pointsValue}>{userStats.currentPoints}</Text>
            
            <View style={styles.pointsInfo}>
              <Text style={styles.pointsSubtext}>
                Total Plastic Recycled: {userStats.plasticRecycled.toFixed(1)} kg
              </Text>
              
              {(() => {
                const nextReward = calculateNextReward(userStats.currentPoints);
                return nextReward ? (
                  <Text style={styles.nextReward}>
                    {nextReward - userStats.currentPoints} points to next reward
                  </Text>
                ) : (
                  <Text style={styles.nextReward}>
                    🏆 Max tier achieved!
                  </Text>
                );
              })()}
            </View>
          </Card.Content>
        </Card>

        {/* Monthly Stats */}
        {monthlyStats && (
          <Card style={styles.monthlyCard}>
            <Card.Content>
              <Text style={styles.cardTitle}>This Month</Text>
              <View style={styles.monthlyStats}>
                <View style={styles.monthlyStat}>
                  <Text style={styles.monthlyValue}>{monthlyStats.totalWeight.toFixed(1)} kg</Text>
                  <Text style={styles.monthlyLabel}>Plastic Recycled</Text>
                </View>
                <View style={styles.monthlyStat}>
                  <Text style={styles.monthlyValue}>{monthlyStats.totalPoints}</Text>
                  <Text style={styles.monthlyLabel}>Points Earned</Text>
                </View>
                <View style={styles.monthlyStat}>
                  <Text style={styles.monthlyValue}>{monthlyStats.logCount}</Text>
                  <Text style={styles.monthlyLabel}>Drop-offs</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Log Waste Form */}
        <Card style={styles.formCard}>
          <Card.Content>
            <Text style={styles.cardTitle}>Log Plastic Waste</Text>
            
            {/* Weight Input */}
            <TextInput
              label="Weight (kg)"
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
              mode="outlined"
              style={styles.weightInput}
              placeholder="e.g., 2.5"
              right={<TextInput.Affix text="kg" />}
            />
            
            {/* Station Selector */}
            <Button
              mode="outlined"
              onPress={() => setShowStationPicker(true)}
              style={styles.stationSelector}
              contentStyle={styles.stationSelectorContent}
            >
              {selectedStation ? selectedStation.name : 'Select Drop-off Station'}
            </Button>
            
            {selectedStation && (
              <Text style={styles.selectedStationAddress}>
                📍 {selectedStation.address}
              </Text>
            )}
            
            {/* Points Preview */}
            {weight && parseFloat(weight) > 0 && (
              <View style={styles.pointsPreview}>
                <Text style={styles.previewText}>
                  You will earn: {Math.floor(parseFloat(weight) * 10)} eco points
                </Text>
              </View>
            )}
            
            {/* Submit Button */}
            <Button
              mode="contained"
              onPress={handleSubmitWaste}
              style={styles.submitButton}
              loading={submitting}
              disabled={!weight || !selectedStation || submitting}
            >
              Log Plastic Waste
            </Button>
          </Card.Content>
        </Card>

        {/* Recent History */}
        {wasteHistory.length > 0 && (
          <Card style={styles.historyCard}>
            <Card.Content>
              <Text style={styles.cardTitle}>Recent Drop-offs</Text>
              
              {wasteHistory.slice(0, 5).map((entry, index) => (
                <View key={entry.id || index} style={styles.historyItem}>
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyWeight}>
                      {parseFloat(entry.weight_kg).toFixed(1)} kg
                    </Text>
                    <Text style={styles.historyStation}>
                      {entry.stations?.name || 'Unknown Station'}
                    </Text>
                    <Text style={styles.historyDate}>
                      {formatDate(entry.logged_at)}
                    </Text>
                  </View>
                  <View style={styles.historyPoints}>
                    <Text style={styles.historyPointsText}>
                      +{entry.points_earned}
                    </Text>
                    <Icon name="stars" size={16} color={colors.warning} />
                  </View>
                </View>
              ))}
              
              <Button
                mode="text"
                onPress={() => navigation.navigate('HistoryTab')}
                style={styles.viewAllButton}
              >
                View All History
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* Info Card */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <Text style={styles.cardTitle}>How It Works</Text>
            
            <View style={styles.infoItem}>
              <Icon name="recycling" size={20} color={colors.success} />
              <Text style={styles.infoText}>
                Drop off plastic waste at participating stations
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <Icon name="stars" size={20} color={colors.warning} />
              <Text style={styles.infoText}>
                Earn 10 eco points per kg of plastic
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <Icon name="eco" size={20} color={colors.info} />
              <Text style={styles.infoText}>
                Help save the environment and earn rewards
              </Text>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Station Selection Modal */}
      <Portal>
        <Modal
          visible={showStationPicker}
          onDismiss={() => setShowStationPicker(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalTitle}>Select Drop-off Station</Text>
          
          <ScrollView style={styles.stationList}>
            {plasticStations.map((station) => (
              <List.Item
                key={station.id}
                title={station.name}
                description={station.address}
                left={props => <List.Icon {...props} icon="location-on" />}
                onPress={() => {
                  setSelectedStation(station);
                  setShowStationPicker(false);
                }}
              />
            ))}
          </ScrollView>
          
          <Button
            mode="text"
            onPress={() => setShowStationPicker(false)}
            style={styles.modalCloseButton}
          >
            Cancel
          </Button>
        </Modal>
      </Portal>

      {/* QR Scanner FAB */}
      <FAB
        style={styles.fab}
        icon="qr-code-scanner"
        onPress={() => navigation.navigate('QRScanner')}
        label="Scan QR"
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: colors.success,
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
  pointsCard: {
    margin: spacing.md,
    backgroundColor: colors.surface,
  },
  pointsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  pointsTitle: {
    ...typography.h3,
    marginLeft: spacing.sm,
  },
  pointsValue: {
    ...typography.h1,
    color: colors.warning,
    marginBottom: spacing.sm,
  },
  pointsInfo: {
    gap: spacing.xs,
  },
  pointsSubtext: {
    ...typography.body,
    color: colors.textSecondary,
  },
  nextReward: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  monthlyCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  cardTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  monthlyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  monthlyStat: {
    alignItems: 'center',
  },
  monthlyValue: {
    ...typography.h3,
    color: colors.success,
    marginBottom: spacing.xs,
  },
  monthlyLabel: {
    ...typography.caption,
    textAlign: 'center',
  },
  formCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  weightInput: {
    marginBottom: spacing.md,
    backgroundColor: colors.background,
  },
  stationSelector: {
    marginBottom: spacing.sm,
    borderColor: colors.border,
  },
  stationSelectorContent: {
    paddingVertical: spacing.sm,
  },
  selectedStationAddress: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  pointsPreview: {
    backgroundColor: colors.warning + '20',
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  previewText: {
    ...typography.body,
    color: colors.warning,
    textAlign: 'center',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: colors.success,
  },
  historyCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyInfo: {
    flex: 1,
  },
  historyWeight: {
    ...typography.body,
    fontWeight: '600',
  },
  historyStation: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  historyDate: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  historyPoints: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  historyPointsText: {
    ...typography.caption,
    color: colors.warning,
    fontWeight: '600',
  },
  viewAllButton: {
    marginTop: spacing.sm,
  },
  infoCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.xxl,
    backgroundColor: colors.surface,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  infoText: {
    ...typography.body,
    flex: 1,
  },
  modalContainer: {
    backgroundColor: colors.surface,
    margin: spacing.lg,
    borderRadius: 12,
    maxHeight: '80%',
  },
  modalTitle: {
    ...typography.h3,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  stationList: {
    maxHeight: 400,
  },
  modalCloseButton: {
    margin: spacing.md,
  },
  fab: {
    position: 'absolute',
    margin: spacing.md,
    right: 0,
    bottom: spacing.xl,
    backgroundColor: colors.success,
  },
});
