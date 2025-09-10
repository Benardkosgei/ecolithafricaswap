import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { Card, Button, Chip, FAB, ActivityIndicator } from 'react-native-paper';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useData } from '../contexts/DataContext';
import stationService from '../services/stationService';
import { colors, typography, spacing } from '../utils/theme';

export default function StationDetailScreen({ navigation, route }) {
  const { station } = route.params;
  const { isOnline, activeRental } = useData();
  const [stationDetails, setStationDetails] = useState(station);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStationDetails();
    getUserLocation();
  }, []);

  const loadStationDetails = async () => {
    try {
      setLoading(true);
      if (isOnline) {
        const details = await stationService.getStationById(station.id);
        setStationDetails(details);
      }
    } catch (error) {
      console.error('Error loading station details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserLocation = async () => {
    try {
      const location = await stationService.getCurrentLocation();
      setUserLocation(location);
    } catch (error) {
      console.error('Error getting user location:', error);
    }
  };

  const getDirections = () => {
    const destination = `${stationDetails.latitude},${stationDetails.longitude}`;
    const label = encodeURIComponent(stationDetails.name);
    
    Alert.alert(
      'Get Directions',
      'Choose your preferred navigation app:',
      [
        {
          text: 'Google Maps',
          onPress: () => {
            const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}&destination_place_id=${label}`;
            Linking.openURL(url);
          },
        },
        {
          text: 'Apple Maps',
          onPress: () => {
            const url = `http://maps.apple.com/?daddr=${destination}`;
            Linking.openURL(url);
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleQRScan = () => {
    navigation.navigate('QRScanner');
  };

  const getAvailabilityColor = (available, total) => {
    const ratio = available / total;
    if (ratio > 0.5) return colors.success;
    if (ratio > 0.2) return colors.warning;
    return colors.error;
  };

  const getAvailabilityText = (available, total) => {
    const ratio = available / total;
    if (ratio > 0.5) return 'Good Availability';
    if (ratio > 0.2) return 'Limited Availability';
    if (available > 0) return 'Low Availability';
    return 'No Batteries Available';
  };

  const getStationIcon = (stationType) => {
    switch (stationType) {
      case 'swap':
        return 'swap-horizontal-circle';
      case 'charge':
        return 'battery-charging-full';
      case 'both':
        return 'battery-plus';
      default:
        return 'location-on';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading station details...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Station Header */}
      <Card style={styles.headerCard}>
        <Card.Content>
          <View style={styles.stationHeader}>
            <View style={styles.stationIcon}>
              <Icon
                name={getStationIcon(stationDetails.station_type)}
                size={32}
                color={colors.primary}
              />
            </View>
            <View style={styles.stationInfo}>
              <Text style={styles.stationName}>{stationDetails.name}</Text>
              <Text style={styles.stationAddress}>{stationDetails.address}</Text>
              
              {stationDetails.distance && (
                <Text style={styles.stationDistance}>
                  📍 {stationDetails.distance.toFixed(1)} km away
                </Text>
              )}
            </View>
          </View>

          {/* Station Status */}
          <View style={styles.statusContainer}>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Status:</Text>
              <Chip
                mode="outlined"
                compact
                style={[
                  styles.statusChip,
                  { borderColor: stationDetails.is_active ? colors.success : colors.error }
                ]}
              >
                {stationDetails.is_active ? 'Active' : 'Inactive'}
              </Chip>
            </View>

            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Type:</Text>
              <Chip mode="outlined" compact style={styles.typeChip}>
                {stationDetails.station_type.toUpperCase()}
              </Chip>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Battery Availability */}
      <Card style={styles.availabilityCard}>
        <Card.Content>
          <View style={styles.availabilityHeader}>
            <Icon name="battery-full" size={24} color={colors.primary} />
            <Text style={styles.cardTitle}>Battery Availability</Text>
          </View>

          <View style={styles.availabilityStats}>
            <View style={styles.availabilityNumbers}>
              <Text style={styles.availableCount}>
                {stationDetails.available_batteries}
              </Text>
              <Text style={styles.totalCount}>
                / {stationDetails.total_slots}
              </Text>
            </View>
            
            <View style={styles.availabilityInfo}>
              <Text style={[
                styles.availabilityStatus,
                { color: getAvailabilityColor(stationDetails.available_batteries, stationDetails.total_slots) }
              ]}>
                {getAvailabilityText(stationDetails.available_batteries, stationDetails.total_slots)}
              </Text>
              <Text style={styles.availabilitySubtext}>
                Batteries available for swap
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${(stationDetails.available_batteries / stationDetails.total_slots) * 100}%`,
                    backgroundColor: getAvailabilityColor(stationDetails.available_batteries, stationDetails.total_slots),
                  }
                ]}
              />
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Features */}
      <Card style={styles.featuresCard}>
        <Card.Content>
          <Text style={styles.cardTitle}>Station Features</Text>
          
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Icon
                name={getStationIcon(stationDetails.station_type)}
                size={20}
                color={colors.primary}
              />
              <Text style={styles.featureText}>
                {stationDetails.station_type === 'both' 
                  ? 'Battery Swap & Charging'
                  : stationDetails.station_type === 'swap'
                  ? 'Battery Swap Only'
                  : 'Charging Only'
                }
              </Text>
            </View>

            {stationDetails.accepts_plastic && (
              <View style={styles.featureItem}>
                <Icon name="recycling" size={20} color={colors.success} />
                <Text style={styles.featureText}>Plastic Waste Recycling</Text>
              </View>
            )}

            {stationDetails.self_service && (
              <View style={styles.featureItem}>
                <Icon name="touch-app" size={20} color={colors.info} />
                <Text style={styles.featureText}>Self-Service Available</Text>
              </View>
            )}

            <View style={styles.featureItem}>
              <Icon name="access-time" size={20} color={colors.textSecondary} />
              <Text style={styles.featureText}>24/7 Available</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Map */}
      <Card style={styles.mapCard}>
        <Card.Content style={styles.mapContent}>
          <Text style={styles.cardTitle}>Location</Text>
          
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            region={{
              latitude: parseFloat(stationDetails.latitude),
              longitude: parseFloat(stationDetails.longitude),
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
          >
            <Marker
              coordinate={{
                latitude: parseFloat(stationDetails.latitude),
                longitude: parseFloat(stationDetails.longitude),
              }}
              title={stationDetails.name}
              description={stationDetails.address}
            >
              <View style={styles.markerContainer}>
                <Icon
                  name={getStationIcon(stationDetails.station_type)}
                  size={24}
                  color={colors.primary}
                />
              </View>
            </Marker>
          </MapView>

          <Button
            mode="outlined"
            onPress={getDirections}
            style={styles.directionsButton}
            icon="directions"
          >
            Get Directions
          </Button>
        </Card.Content>
      </Card>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {stationDetails.available_batteries > 0 && !activeRental && (
          <Button
            mode="contained"
            onPress={handleQRScan}
            style={styles.actionButton}
            icon="qr-code-scanner"
          >
            Scan QR to Swap Battery
          </Button>
        )}

        {activeRental && (
          <Button
            mode="contained"
            onPress={handleQRScan}
            style={[styles.actionButton, { backgroundColor: colors.warning }]}
            icon="qr-code-scanner"
          >
            Scan QR to Return Battery
          </Button>
        )}

        {stationDetails.accepts_plastic && (
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('WasteTab')}
            style={styles.actionButton}
            icon="recycling"
          >
            Log Plastic Waste
          </Button>
        )}

        <Button
          mode="text"
          onPress={getDirections}
          style={styles.actionButton}
          icon="directions"
        >
          Get Directions
        </Button>
      </View>

      {/* Info Section */}
      <Card style={styles.infoCard}>
        <Card.Content>
          <Text style={styles.cardTitle}>Need Help?</Text>
          
          <Text style={styles.infoText}>
            If you're having trouble at this station or need assistance, you can:
          </Text>

          <View style={styles.helpOptions}>
            <Button
              mode="text"
              onPress={() => navigation.navigate('SupportTab')}
              icon="help"
              compact
            >
              Contact Support
            </Button>
            
            <Button
              mode="text"
              onPress={() => navigation.navigate('SupportTab')}
              icon="message"
              compact
            >
              Report Issue
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Quick Action FAB */}
      <FAB
        style={styles.fab}
        icon="qr-code-scanner"
        onPress={handleQRScan}
        label="Scan QR"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    ...typography.body,
    marginTop: spacing.md,
    color: colors.textSecondary,
  },
  headerCard: {
    margin: spacing.md,
    backgroundColor: colors.surface,
  },
  stationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  stationIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  stationInfo: {
    flex: 1,
  },
  stationName: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  stationAddress: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  stationDistance: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  statusContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  statusChip: {
    height: 28,
  },
  typeChip: {
    height: 28,
    borderColor: colors.primary,
  },
  availabilityCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  availabilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardTitle: {
    ...typography.h3,
    marginLeft: spacing.sm,
  },
  availabilityStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  availabilityNumbers: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginRight: spacing.lg,
  },
  availableCount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
  },
  totalCount: {
    ...typography.h2,
    color: colors.textSecondary,
  },
  availabilityInfo: {
    flex: 1,
  },
  availabilityStatus: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  availabilitySubtext: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  progressContainer: {
    marginTop: spacing.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  featuresCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  featuresList: {
    gap: spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  featureText: {
    ...typography.body,
  },
  mapCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  mapContent: {
    padding: 0,
  },
  map: {
    height: 200,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  markerContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: spacing.sm,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  directionsButton: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderColor: colors.primary,
  },
  actionButtons: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  actionButton: {
    marginBottom: spacing.sm,
  },
  infoCard: {
    margin: spacing.md,
    marginBottom: spacing.xxl,
    backgroundColor: colors.surface,
  },
  infoText: {
    ...typography.body,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  helpOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  fab: {
    position: 'absolute',
    margin: spacing.md,
    right: 0,
    bottom: spacing.xl,
    backgroundColor: colors.primary,
  },
});
