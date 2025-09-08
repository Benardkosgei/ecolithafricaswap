import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { theme } from '../utils/theme';

const HomeScreen = ({ navigation }) => {
  const { user, isAuthenticated } = useAuth();
  const {
    stations,
    nearbyStations,
    currentRental,
    userCredits,
    isLoading,
    loadStations,
    loadNearbyStations,
    loadCurrentRental,
    loadUserCredits,
    setUserLocation,
  } = useData();

  const [refreshing, setRefreshing] = useState(false);
  const [locationPermission, setLocationPermission] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadInitialData();
      getCurrentLocation();
    }
  }, [isAuthenticated]);

  const loadInitialData = async () => {
    try {
      await Promise.all([
        loadStations(),
        loadCurrentRental(),
        loadUserCredits(),
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
      Alert.alert('Error', 'Failed to load data. Please try again.');
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
      
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;
        
        setUserLocation(latitude, longitude);
        await loadNearbyStations(latitude, longitude);
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadInitialData();
      if (locationPermission) {
        await getCurrentLocation();
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'findStation':
        navigation.navigate('StationFinder');
        break;
      case 'swapBattery':
        if (currentRental) {
          navigation.navigate('SwapCharge');
        } else {
          navigation.navigate('StationFinder');
        }
        break;
      case 'submitWaste':
        navigation.navigate('PlasticWaste');
        break;
      case 'viewHistory':
        navigation.navigate('History');
        break;
      default:
        break;
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.logoContainer}>
        <Image
          source={require('../../../user_input_files/Ecolith Logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      <View style={styles.welcomeContainer}>
        <Text style={styles.welcomeText}>Welcome back,</Text>
        <Text style={styles.userName}>{user?.full_name || 'User'}</Text>
      </View>
      <TouchableOpacity
        style={styles.profileButton}
        onPress={() => navigation.navigate('Profile')}
      >
        <Ionicons name="person-circle-outline" size={32} color={theme.colors.primary} />
      </TouchableOpacity>
    </View>
  );

  const renderStatsCards = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statsCard}>
        <View style={styles.statsIcon}>
          <Ionicons name="leaf" size={24} color={theme.colors.success} />
        </View>
        <Text style={styles.statsValue}>{userCredits.available || 0}</Text>
        <Text style={styles.statsLabel}>EcoCredits</Text>
      </View>
      
      <View style={styles.statsCard}>
        <View style={styles.statsIcon}>
          <Ionicons name="battery-charging" size={24} color={theme.colors.primary} />
        </View>
        <Text style={styles.statsValue}>{nearbyStations.length || 0}</Text>
        <Text style={styles.statsLabel}>Nearby Stations</Text>
      </View>
      
      <View style={styles.statsCard}>
        <View style={styles.statsIcon}>
          <Ionicons name="time" size={24} color={theme.colors.warning} />
        </View>
        <Text style={styles.statsValue}>{currentRental ? '1' : '0'}</Text>
        <Text style={styles.statsLabel}>Active Rental</Text>
      </View>
    </View>
  );

  const renderCurrentRental = () => {
    if (!currentRental) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Rental</Text>
        <TouchableOpacity
          style={styles.rentalCard}
          onPress={() => navigation.navigate('SwapCharge')}
        >
          <View style={styles.rentalInfo}>
            <View style={styles.rentalHeader}>
              <Ionicons name="battery-charging" size={20} color={theme.colors.primary} />
              <Text style={styles.rentalTitle}>Battery #{currentRental.battery_serial}</Text>
            </View>
            <Text style={styles.rentalStation}>
              From: {currentRental.pickup_station_name}
            </Text>
            <Text style={styles.rentalTime}>
              Started: {new Date(currentRental.rental_date).toLocaleString()}
            </Text>
          </View>
          <View style={styles.rentalStatus}>
            <Text style={styles.statusText}>Active</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.gray} />
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderQuickActions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => handleQuickAction('findStation')}
        >
          <View style={[styles.actionIcon, { backgroundColor: theme.colors.primary + '20' }]}>
            <Ionicons name="location" size={24} color={theme.colors.primary} />
          </View>
          <Text style={styles.actionTitle}>Find Station</Text>
          <Text style={styles.actionSubtitle}>Locate nearby charging stations</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => handleQuickAction('swapBattery')}
        >
          <View style={[styles.actionIcon, { backgroundColor: theme.colors.success + '20' }]}>
            <Ionicons name="battery-charging" size={24} color={theme.colors.success} />
          </View>
          <Text style={styles.actionTitle}>Swap Battery</Text>
          <Text style={styles.actionSubtitle}>Rent or return battery</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => handleQuickAction('submitWaste')}
        >
          <View style={[styles.actionIcon, { backgroundColor: theme.colors.accent + '20' }]}>
            <Ionicons name="leaf" size={24} color={theme.colors.accent} />
          </View>
          <Text style={styles.actionTitle}>Recycle Plastic</Text>
          <Text style={styles.actionSubtitle}>Earn credits for plastic waste</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => handleQuickAction('viewHistory')}
        >
          <View style={[styles.actionIcon, { backgroundColor: theme.colors.warning + '20' }]}>
            <Ionicons name="time" size={24} color={theme.colors.warning} />
          </View>
          <Text style={styles.actionTitle}>View History</Text>
          <Text style={styles.actionSubtitle}>Check past transactions</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderNearbyStations = () => {
    if (!nearbyStations.length) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nearby Stations</Text>
          <TouchableOpacity onPress={() => navigation.navigate('StationFinder')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        
        {nearbyStations.slice(0, 3).map((station) => (
          <TouchableOpacity
            key={station.id}
            style={styles.stationCard}
            onPress={() => {
              navigation.navigate('StationDetail', { station });
            }}
          >
            <View style={styles.stationInfo}>
              <Text style={styles.stationName}>{station.name}</Text>
              <Text style={styles.stationLocation}>{station.location}</Text>
              <View style={styles.stationMeta}>
                <Ionicons name="location" size={14} color={theme.colors.gray} />
                <Text style={styles.stationDistance}>
                  {station.distance ? `${station.distance.toFixed(1)} km` : 'Distance unknown'}
                </Text>
              </View>
            </View>
            <View style={styles.stationStatus}>
              <View style={[styles.statusDot, {
                backgroundColor: station.is_active ? theme.colors.success : theme.colors.error
              }]} />
              <Text style={styles.statusText}>
                {station.is_active ? 'Open' : 'Closed'}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Please log in to access the app</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {renderHeader()}
      {renderStatsCards()}
      {renderCurrentRental()}
      {renderQuickActions()}
      {renderNearbyStations()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  logoContainer: {
    marginRight: 15,
  },
  logo: {
    width: 40,
    height: 40,
  },
  welcomeContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    color: theme.colors.gray,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  profileButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
  },
  statsCard: {
    flex: 1,
    backgroundColor: theme.colors.white,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 5,
  },
  statsLabel: {
    fontSize: 12,
    color: theme.colors.gray,
    textAlign: 'center',
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
  },
  seeAllText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  rentalCard: {
    backgroundColor: theme.colors.white,
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rentalInfo: {
    flex: 1,
  },
  rentalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rentalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginLeft: 8,
  },
  rentalStation: {
    fontSize: 14,
    color: theme.colors.gray,
    marginBottom: 4,
  },
  rentalTime: {
    fontSize: 12,
    color: theme.colors.gray,
  },
  rentalStatus: {
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    color: theme.colors.success,
    fontWeight: '600',
    marginBottom: 4,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  actionCard: {
    width: '47%',
    backgroundColor: theme.colors.white,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 12,
    color: theme.colors.gray,
    textAlign: 'center',
  },
  stationCard: {
    backgroundColor: theme.colors.white,
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stationInfo: {
    flex: 1,
  },
  stationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  stationLocation: {
    fontSize: 14,
    color: theme.colors.gray,
    marginBottom: 4,
  },
  stationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stationDistance: {
    fontSize: 12,
    color: theme.colors.gray,
    marginLeft: 4,
  },
  stationStatus: {
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.error,
    textAlign: 'center',
    margin: 20,
  },
});

export default HomeScreen;