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
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import stationService from '../services/stationService';
import { theme } from '../utils/theme';

const EnhancedStationScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const { stations, loadStations } = useData();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  
  // Station data
  const [selectedStation, setSelectedStation] = useState(route?.params?.station || null);
  const [stationDetails, setStationDetails] = useState(null);
  const [nearbyStations, setNearbyStations] = useState([]);
  const [stationReviews, setStationReviews] = useState([]);
  const [stationIssues, setStationIssues] = useState([]);
  
  // UI state
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [mapRegion, setMapRegion] = useState(null);
  
  // Form data
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [issueType, setIssueType] = useState('maintenance');
  const [issueDescription, setIssueDescription] = useState('');
  const [requestData, setRequestData] = useState({
    location_name: '',
    address: '',
    latitude: '',
    longitude: '',
    reason: '',
    station_type: 'swap',
  });

  useEffect(() => {
    getCurrentLocation();
    if (selectedStation) {
      loadStationDetails();
    } else {
      loadNearbyStations();
    }
  }, [selectedStation]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        const coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        setUserLocation(coords);
        
        // Set map region
        setMapRegion({
          ...coords,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
        
        // Update request form with current location
        setRequestData(prev => ({
          ...prev,
          latitude: coords.latitude.toString(),
          longitude: coords.longitude.toString(),
        }));
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const loadStationDetails = async () => {
    try {
      setLoading(true);
      const [details, reviews, issues] = await Promise.all([
        stationService.getStation(selectedStation.id),
        stationService.getStationReviews(selectedStation.id),
        stationService.getStationIssues(selectedStation.id),
      ]);
      
      setStationDetails(details);
      setStationReviews(reviews || []);
      setStationIssues(issues || []);
    } catch (error) {
      console.error('Error loading station details:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNearbyStations = async () => {
    try {
      setLoading(true);
      if (userLocation) {
        const nearby = await stationService.getNearbyStations(
          userLocation.latitude,
          userLocation.longitude,
          5000 // 5km radius
        );
        setNearbyStations(nearby || []);
      }
    } catch (error) {
      console.error('Error loading nearby stations:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      loadStations(),
      selectedStation ? loadStationDetails() : loadNearbyStations(),
    ]);
    setRefreshing(false);
  }, [selectedStation]);

  const handleRateStation = async () => {
    if (!reviewText.trim()) {
      Alert.alert('Review Required', 'Please write a review.');
      return;
    }

    try {
      setLoading(true);
      await stationService.addStationReview(selectedStation.id, {
        rating,
        review_text: reviewText,
        user_id: user.id,
      });
      
      setShowRatingModal(false);
      setRating(5);
      setReviewText('');
      
      Alert.alert('Review Submitted', 'Thank you for your feedback!');
      await loadStationDetails();
    } catch (error) {
      Alert.alert('Failed to Submit Review', error.message || 'Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleReportIssue = async () => {
    if (!issueDescription.trim()) {
      Alert.alert('Description Required', 'Please describe the issue.');
      return;
    }

    try {
      setLoading(true);
      await stationService.reportStationIssue(selectedStation.id, {
        issue_type: issueType,
        description: issueDescription,
        user_id: user.id,
        reported_at: new Date().toISOString(),
      });
      
      setShowIssueModal(false);
      setIssueType('maintenance');
      setIssueDescription('');
      
      Alert.alert('Issue Reported', 'Thank you for reporting this issue. Our team will investigate.');
      await loadStationDetails();
    } catch (error) {
      Alert.alert('Failed to Report Issue', error.message || 'Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestStation = async () => {
    if (!requestData.location_name.trim() || !requestData.address.trim() || !requestData.reason.trim()) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    try {
      setLoading(true);
      await stationService.requestNewStation({
        ...requestData,
        user_id: user.id,
        requested_at: new Date().toISOString(),
      });
      
      setShowRequestModal(false);
      setRequestData({
        location_name: '',
        address: '',
        latitude: userLocation?.latitude?.toString() || '',
        longitude: userLocation?.longitude?.toString() || '',
        reason: '',
        station_type: 'swap',
      });
      
      Alert.alert(
        'Request Submitted',
        'Your station request has been submitted. We will review it and get back to you.'
      );
    } catch (error) {
      Alert.alert('Failed to Submit Request', error.message || 'Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleGetDirections = (station) => {
    if (!userLocation) {
      Alert.alert('Location Required', 'Please enable location services.');
      return;
    }
    
    const url = `https://maps.google.com/maps?daddr=${station.latitude},${station.longitude}&saddr=${userLocation.latitude},${userLocation.longitude}`;
    Linking.openURL(url);
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const renderStationDetails = () => {
    if (!selectedStation) return null;

    return (
      <View style={styles.section}>
        <View style={styles.stationHeader}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => setSelectedStation(null)}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          
          <View style={styles.stationHeaderContent}>
            <Text style={styles.stationName}>{selectedStation.name}</Text>
            <Text style={styles.stationAddress}>{selectedStation.address}</Text>
            
            <View style={styles.stationMeta}>
              <View style={[styles.statusBadge, 
                selectedStation.is_active ? styles.activeStatus : styles.inactiveStatus
              ]}>
                <Text style={styles.statusText}>
                  {selectedStation.is_active ? 'Active' : 'Inactive'}
                </Text>
              </View>
              
              <Text style={styles.stationType}>
                {selectedStation.station_type?.toUpperCase() || 'UNKNOWN'}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Station Stats */}
        <View style={styles.stationStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stationDetails?.available_batteries || 0}</Text>
            <Text style={styles.statLabel}>Available Batteries</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stationDetails?.average_rating?.toFixed(1) || 'N/A'}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stationReviews.length}</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stationIssues.length}</Text>
            <Text style={styles.statLabel}>Issues</Text>
          </View>
        </View>
        
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.primaryButton]} 
            onPress={() => handleGetDirections(selectedStation)}
          >
            <Ionicons name="navigate" size={20} color={theme.colors.white} />
            <Text style={styles.primaryButtonText}>Get Directions</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.secondaryButton]} 
            onPress={() => setShowRatingModal(true)}
          >
            <Ionicons name="star" size={20} color={theme.colors.primary} />
            <Text style={styles.secondaryButtonText}>Rate Station</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.secondaryButton]} 
            onPress={() => setShowIssueModal(true)}
          >
            <Ionicons name="warning" size={20} color={theme.colors.warning} />
            <Text style={styles.secondaryButtonText}>Report Issue</Text>
          </TouchableOpacity>
        </View>
        
        {/* Operating Hours */}
        {stationDetails?.operating_hours && (
          <View style={styles.operatingHours}>
            <Text style={styles.sectionSubtitle}>Operating Hours</Text>
            <Text style={styles.hoursText}>{stationDetails.operating_hours}</Text>
          </View>
        )}
        
        {/* Recent Reviews */}
        {stationReviews.length > 0 && (
          <View style={styles.reviewsSection}>
            <Text style={styles.sectionSubtitle}>Recent Reviews</Text>
            {stationReviews.slice(0, 3).map((review) => (
              <View key={review.id} style={styles.reviewItem}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewUser}>{review.user_name || 'Anonymous'}</Text>
                  <View style={styles.ratingStars}>
                    {[...Array(5)].map((_, i) => (
                      <Ionicons
                        key={i}
                        name={i < review.rating ? 'star' : 'star-outline'}
                        size={16}
                        color={theme.colors.warning}
                      />
                    ))}
                  </View>
                </View>
                <Text style={styles.reviewText}>{review.review_text}</Text>
                <Text style={styles.reviewDate}>
                  {new Date(review.created_at).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </View>
        )}
        
        {/* Recent Issues */}
        {stationIssues.length > 0 && (
          <View style={styles.issuesSection}>
            <Text style={styles.sectionSubtitle}>Recent Issues</Text>
            {stationIssues.slice(0, 3).map((issue) => (
              <View key={issue.id} style={styles.issueItem}>
                <View style={styles.issueHeader}>
                  <Text style={styles.issueType}>
                    {issue.issue_type.replace('_', ' ').toUpperCase()}
                  </Text>
                  <View style={[
                    styles.issueStatusBadge,
                    issue.status === 'resolved' ? styles.resolvedStatus :
                    issue.status === 'in_progress' ? styles.progressStatus :
                    styles.openStatus
                  ]}>
                    <Text style={styles.issueStatusText}>{issue.status}</Text>
                  </View>
                </View>
                <Text style={styles.issueDescription}>{issue.description}</Text>
                <Text style={styles.issueDate}>
                  {new Date(issue.reported_at).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderStationMap = () => {
    if (!mapRegion) return null;

    const stationsToShow = selectedStation ? [selectedStation] : nearbyStations;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Station Locations</Text>
        
        <MapView
          style={styles.map}
          region={mapRegion}
          showsUserLocation
          showsMyLocationButton
        >
          {stationsToShow.map((station) => (
            <Marker
              key={station.id}
              coordinate={{
                latitude: parseFloat(station.latitude),
                longitude: parseFloat(station.longitude),
              }}
              title={station.name}
              description={station.address}
              onPress={() => setSelectedStation(station)}
            >
              <View style={[
                styles.markerContainer,
                station.is_active ? styles.activeMarker : styles.inactiveMarker
              ]}>
                <Ionicons 
                  name="battery-charging" 
                  size={20} 
                  color={theme.colors.white} 
                />
              </View>
            </Marker>
          ))}
        </MapView>
      </View>
    );
  };

  const renderStationList = () => {
    if (selectedStation) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nearby Stations</Text>
          <TouchableOpacity onPress={() => setShowRequestModal(true)}>
            <Text style={styles.requestStationText}>Request Station</Text>
          </TouchableOpacity>
        </View>
        
        {nearbyStations.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="location-outline" size={48} color={theme.colors.gray} />
            <Text style={styles.emptyText}>No stations found nearby</Text>
            <TouchableOpacity 
              style={styles.requestButton} 
              onPress={() => setShowRequestModal(true)}
            >
              <Text style={styles.requestButtonText}>Request a Station</Text>
            </TouchableOpacity>
          </View>
        ) : (
          nearbyStations.map((station) => {
            const distance = userLocation ? 
              calculateDistance(
                userLocation.latitude, 
                userLocation.longitude,
                parseFloat(station.latitude),
                parseFloat(station.longitude)
              ) : null;

            return (
              <TouchableOpacity
                key={station.id}
                style={styles.stationItem}
                onPress={() => setSelectedStation(station)}
              >
                <View style={styles.stationItemContent}>
                  <View style={styles.stationItemHeader}>
                    <Text style={styles.stationItemName}>{station.name}</Text>
                    {distance && (
                      <Text style={styles.stationDistance}>
                        {distance.toFixed(1)} km
                      </Text>
                    )}
                  </View>
                  
                  <Text style={styles.stationItemAddress}>{station.address}</Text>
                  
                  <View style={styles.stationItemFooter}>
                    <View style={[
                      styles.statusBadge,
                      station.is_active ? styles.activeStatus : styles.inactiveStatus
                    ]}>
                      <Text style={styles.statusText}>
                        {station.is_active ? 'Active' : 'Inactive'}
                      </Text>
                    </View>
                    
                    <Text style={styles.stationTypeText}>
                      {station.station_type?.toUpperCase() || 'UNKNOWN'}
                    </Text>
                    
                    {station.accepts_plastic && (
                      <Ionicons name="leaf" size={16} color={theme.colors.success} />
                    )}
                  </View>
                </View>
                
                <Ionicons name="chevron-forward" size={20} color={theme.colors.gray} />
              </TouchableOpacity>
            );
          })
        )}
      </View>
    );
  };

  // Modals...
  const renderRatingModal = () => (
    <Modal visible={showRatingModal} animationType="slide" presentationStyle="formSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowRatingModal(false)}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Rate Station</Text>
          <TouchableOpacity onPress={handleRateStation}>
            <Text style={styles.saveButton}>Submit</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.modalContent}>
          <Text style={styles.ratingLabel}>Rating</Text>
          <View style={styles.starRating}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star)}>
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={32}
                  color={theme.colors.warning}
                  style={styles.starButton}
                />
              </TouchableOpacity>
            ))}
          </View>
          
          <Text style={styles.label}>Review</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={reviewText}
            onChangeText={setReviewText}
            placeholder="Share your experience with this station..."
            multiline
            numberOfLines={4}
          />
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
          <Text style={styles.label}>Issue Type</Text>
          <View style={styles.issueTypeGrid}>
            {[
              { value: 'maintenance', label: 'Maintenance Needed' },
              { value: 'out_of_order', label: 'Out of Order' },
              { value: 'safety', label: 'Safety Concern' },
              { value: 'cleanliness', label: 'Cleanliness' },
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
          
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={issueDescription}
            onChangeText={setIssueDescription}
            placeholder="Please describe the issue in detail..."
            multiline
            numberOfLines={4}
          />
        </ScrollView>
      </View>
    </Modal>
  );

  const renderRequestModal = () => (
    <Modal visible={showRequestModal} animationType="slide" presentationStyle="formSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowRequestModal(false)}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Request New Station</Text>
          <TouchableOpacity onPress={handleRequestStation}>
            <Text style={styles.saveButton}>Submit</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Location Name *</Text>
            <TextInput
              style={styles.input}
              value={requestData.location_name}
              onChangeText={(text) => setRequestData(prev => ({ ...prev, location_name: text }))}
              placeholder="e.g., City Mall, University Campus"
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Address *</Text>
            <TextInput
              style={styles.input}
              value={requestData.address}
              onChangeText={(text) => setRequestData(prev => ({ ...prev, address: text }))}
              placeholder="Full address of the proposed location"
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Station Type</Text>
            <View style={styles.stationTypeGrid}>
              {[
                { value: 'swap', label: 'Swap Only' },
                { value: 'charge', label: 'Charge Only' },
                { value: 'both', label: 'Swap & Charge' },
              ].map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.stationTypeButton,
                    requestData.station_type === type.value && styles.selectedStationType
                  ]}
                  onPress={() => setRequestData(prev => ({ ...prev, station_type: type.value }))}
                >
                  <Text style={[
                    styles.stationTypeText,
                    requestData.station_type === type.value && styles.selectedStationTypeText
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Reason for Request *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={requestData.reason}
              onChangeText={(text) => setRequestData(prev => ({ ...prev, reason: text }))}
              placeholder="Why do you think a station is needed at this location?"
              multiline
              numberOfLines={4}
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {renderStationDetails()}
      {renderStationMap()}
      {renderStationList()}
      {renderRatingModal()}
      {renderIssueModal()}
      {renderRequestModal()}
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
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 10,
  },
  requestStationText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  stationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  backButton: {
    marginRight: 15,
    marginTop: 5,
  },
  stationHeaderContent: {
    flex: 1,
  },
  stationName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 5,
  },
  stationAddress: {
    fontSize: 16,
    color: theme.colors.gray,
    marginBottom: 10,
  },
  stationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeStatus: {
    backgroundColor: theme.colors.success + '20',
  },
  inactiveStatus: {
    backgroundColor: theme.colors.error + '20',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.success,
  },
  stationType: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  stationStats: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.gray,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
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
  operatingHours: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  hoursText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  reviewsSection: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  reviewItem: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingBottom: 15,
    marginBottom: 15,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewUser: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewText: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 5,
  },
  reviewDate: {
    fontSize: 12,
    color: theme.colors.gray,
  },
  issuesSection: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  issueItem: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingBottom: 15,
    marginBottom: 15,
  },
  issueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  issueType: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  issueStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  resolvedStatus: {
    backgroundColor: theme.colors.success + '20',
  },
  progressStatus: {
    backgroundColor: theme.colors.warning + '20',
  },
  openStatus: {
    backgroundColor: theme.colors.error + '20',
  },
  issueStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text,
  },
  issueDescription: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 5,
  },
  issueDate: {
    fontSize: 12,
    color: theme.colors.gray,
  },
  map: {
    height: 300,
    borderRadius: 12,
  },
  markerContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeMarker: {
    backgroundColor: theme.colors.primary,
  },
  inactiveMarker: {
    backgroundColor: theme.colors.gray,
  },
  stationItem: {
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
  stationItemContent: {
    flex: 1,
  },
  stationItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  stationItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  stationDistance: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  stationItemAddress: {
    fontSize: 14,
    color: theme.colors.gray,
    marginBottom: 10,
  },
  stationItemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stationTypeText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '600',
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
  requestButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  requestButtonText: {
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
  ratingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 15,
  },
  starRating: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  starButton: {
    marginHorizontal: 5,
  },
  issueTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
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
  stationTypeGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  stationTypeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
  },
  selectedStationType: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  stationTypeText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  selectedStationTypeText: {
    color: theme.colors.white,
  },
});

export default EnhancedStationScreen;