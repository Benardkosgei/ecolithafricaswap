import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { Searchbar, FAB, Card, Chip, ActivityIndicator } from 'react-native-paper';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useData } from '../contexts/DataContext';
import { stationService } from '../services/stationService';
import { colors, typography, spacing } from '../utils/theme';

const { width, height } = Dimensions.get('window');

export default function StationFinderScreen({ navigation }) {
  const { stations, isOnline, loading } = useData();
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [userLocation, setUserLocation] = useState(null);
  const [filteredStations, setFilteredStations] = useState([]);
  const [loadingLocation, setLoadingLocation] = useState(false);

  useEffect(() => {
    getUserLocation();
  }, []);

  useEffect(() => {
    filterStations();
  }, [stations, searchQuery, selectedFilter]);

  const getUserLocation = async () => {
    try {
      setLoadingLocation(true);
      const location = await stationService.getCurrentLocation();
      setUserLocation(location);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(
        'Location Error',
        'Could not get your current location. Showing all stations.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoadingLocation(false);
    }
  };

  const filterStations = () => {
    let filtered = stations;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(station =>
        station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        station.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by type
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(station =>
        station.station_type === selectedFilter || station.station_type === 'both'
      );
    }

    // Add distance if user location is available
    if (userLocation) {
      filtered = filtered.map(station => ({
        ...station,
        distance: stationService.calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          parseFloat(station.latitude),
          parseFloat(station.longitude)
        )
      })).sort((a, b) => a.distance - b.distance);
    }

    setFilteredStations(filtered);
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

  const getAvailabilityColor = (available, total) => {
    const ratio = available / total;
    if (ratio > 0.5) return colors.success;
    if (ratio > 0.2) return colors.warning;
    return colors.error;
  };

  const renderStationCard = ({ item: station }) => (
    <Card style={styles.stationCard}>
      <TouchableOpacity
        onPress={() => navigation.navigate('StationDetail', { station })}
      >
        <Card.Content>
          <View style={styles.stationHeader}>
            <View style={styles.stationInfo}>
              <Text style={styles.stationName}>{station.name}</Text>
              <Text style={styles.stationAddress}>{station.address}</Text>
              {station.distance && (
                <Text style={styles.stationDistance}>
                  {station.distance.toFixed(1)} km away
                </Text>
              )}
            </View>
            <Icon
              name={getStationIcon(station.station_type)}
              size={32}
              color={colors.primary}
            />
          </View>

          <View style={styles.stationDetails}>
            <View style={styles.availabilityContainer}>
              <Text style={styles.availabilityLabel}>Available Batteries:</Text>
              <Text
                style={[
                  styles.availabilityCount,
                  { color: getAvailabilityColor(station.available_batteries, station.total_slots) }
                ]}
              >
                {station.available_batteries}/{station.total_slots}
              </Text>
            </View>

            <View style={styles.chipContainer}>
              <Chip
                mode="outlined"
                compact
                style={[styles.typeChip, { borderColor: colors.primary }]}
              >
                {station.station_type.toUpperCase()}
              </Chip>
              {station.accepts_plastic && (
                <Chip
                  mode="outlined"
                  compact
                  icon="recycling"
                  style={[styles.typeChip, { borderColor: colors.success }]}
                >
                  Plastic
                </Chip>
              )}
              {station.self_service && (
                <Chip
                  mode="outlined"
                  compact
                  icon="android"
                  style={[styles.typeChip, { borderColor: colors.info }]}
                >
                  Self-Service
                </Chip>
              )}
            </View>
          </View>
        </Card.Content>
      </TouchableOpacity>
    </Card>
  );

  const renderMapView = () => (
    <MapView
      provider={PROVIDER_GOOGLE}
      style={styles.map}
      region={{
        latitude: userLocation?.latitude || -1.286389, // Nairobi default
        longitude: userLocation?.longitude || 36.817223,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
      showsUserLocation={true}
      showsMyLocationButton={true}
    >
      {filteredStations.map((station) => (
        <Marker
          key={station.id}
          coordinate={{
            latitude: parseFloat(station.latitude),
            longitude: parseFloat(station.longitude),
          }}
          title={station.name}
          description={`${station.available_batteries}/${station.total_slots} batteries available`}
          onPress={() => navigation.navigate('StationDetail', { station })}
        >
          <View style={styles.markerContainer}>
            <Icon
              name={getStationIcon(station.station_type)}
              size={24}
              color={colors.primary}
            />
          </View>
        </Marker>
      ))}
    </MapView>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <TouchableOpacity
        style={[
          styles.filterChip,
          selectedFilter === 'all' && styles.filterChipActive
        ]}
        onPress={() => setSelectedFilter('all')}
      >
        <Text style={[
          styles.filterText,
          selectedFilter === 'all' && styles.filterTextActive
        ]}>
          All
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.filterChip,
          selectedFilter === 'swap' && styles.filterChipActive
        ]}
        onPress={() => setSelectedFilter('swap')}
      >
        <Text style={[
          styles.filterText,
          selectedFilter === 'swap' && styles.filterTextActive
        ]}>
          Swap Only
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.filterChip,
          selectedFilter === 'charge' && styles.filterChipActive
        ]}
        onPress={() => setSelectedFilter('charge')}
      >
        <Text style={[
          styles.filterText,
          selectedFilter === 'charge' && styles.filterTextActive
        ]}>
          Charge Only
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading stations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <Searchbar
        placeholder="Search stations..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

      {/* Filters */}
      {renderFilters()}

      {/* View Toggle */}
      <View style={styles.viewToggle}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            viewMode === 'list' && styles.toggleButtonActive
          ]}
          onPress={() => setViewMode('list')}
        >
          <Icon name="list" size={20} color={viewMode === 'list' ? 'white' : colors.primary} />
          <Text style={[
            styles.toggleText,
            viewMode === 'list' && styles.toggleTextActive
          ]}>
            List
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleButton,
            viewMode === 'map' && styles.toggleButtonActive
          ]}
          onPress={() => setViewMode('map')}
        >
          <Icon name="map" size={20} color={viewMode === 'map' ? 'white' : colors.primary} />
          <Text style={[
            styles.toggleText,
            viewMode === 'map' && styles.toggleTextActive
          ]}>
            Map
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {viewMode === 'list' ? (
        <FlatList
          data={filteredStations}
          renderItem={renderStationCard}
          keyExtractor={(item) => item.id}
          style={styles.stationsList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="location-off" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyText}>No stations found</Text>
              <Text style={styles.emptySubtext}>
                {!isOnline 
                  ? 'You are offline. Showing cached stations only.'
                  : 'Try adjusting your search or filters.'
                }
              </Text>
            </View>
          }
        />
      ) : (
        renderMapView()
      )}

      {/* Refresh FAB */}
      <FAB
        style={styles.refreshFab}
        icon="refresh"
        onPress={getUserLocation}
        loading={loadingLocation}
        small
      />

      {/* Results Counter */}
      <View style={styles.resultsCounter}>
        <Text style={styles.resultsText}>
          {filteredStations.length} station{filteredStations.length !== 1 ? 's' : ''} found
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    marginTop: spacing.md,
    color: colors.textSecondary,
  },
  searchBar: {
    margin: spacing.md,
    backgroundColor: colors.surface,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    ...typography.caption,
    color: colors.text,
  },
  filterTextActive: {
    color: 'white',
  },
  viewToggle: {
    flexDirection: 'row',
    margin: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: 6,
    gap: spacing.xs,
  },
  toggleButtonActive: {
    backgroundColor: colors.primary,
  },
  toggleText: {
    ...typography.caption,
    color: colors.primary,
  },
  toggleTextActive: {
    color: 'white',
  },
  stationsList: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  stationCard: {
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  stationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  stationInfo: {
    flex: 1,
  },
  stationName: {
    ...typography.h3,
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
  stationDetails: {
    gap: spacing.sm,
  },
  availabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  availabilityLabel: {
    ...typography.body,
  },
  availabilityCount: {
    ...typography.h3,
    fontWeight: 'bold',
  },
  chipContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  typeChip: {
    height: 28,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: spacing.sm,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  refreshFab: {
    position: 'absolute',
    margin: spacing.md,
    right: 0,
    top: height * 0.3,
    backgroundColor: colors.primary,
  },
  resultsCounter: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  resultsText: {
    ...typography.caption,
    color: 'white',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    ...typography.h3,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    color: colors.textSecondary,
  },
  emptySubtext: {
    ...typography.body,
    textAlign: 'center',
    color: colors.textSecondary,
    paddingHorizontal: spacing.xl,
  },
});
