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
  Image,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import wasteService from '../services/wasteService';
import { theme } from '../utils/theme';

const EnhancedPlasticWasteScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { stations } = useData();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Submission data
  const [submissionData, setSubmissionData] = useState({
    plastic_type: '',
    weight_kg: '',
    photos: [],
    station_id: '',
    notes: '',
    location: null,
  });
  
  // UI state
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showStationModal, setShowStationModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  
  // Data
  const [wasteHistory, setWasteHistory] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [wasteBreakdown, setWasteBreakdown] = useState([]);
  const [plasticStations, setPlasticStations] = useState([]);

  useEffect(() => {
    loadWasteData();
    getCurrentLocation();
    filterPlasticStations();
  }, [stations]);

  const loadWasteData = async () => {
    try {
      setLoading(true);
      const [history, stats, breakdown] = await Promise.all([
        wasteService.getWasteHistory({ limit: 20 }),
        wasteService.getWasteStats(),
        wasteService.getWasteBreakdown(),
      ]);
      
      setWasteHistory(history || []);
      setUserStats(stats);
      setWasteBreakdown(breakdown || []);
    } catch (error) {
      console.error('Error loading waste data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setSubmissionData(prev => ({
          ...prev,
          location: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          }
        }));
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const filterPlasticStations = () => {
    const filtered = stations.filter(station => station.accepts_plastic);
    setPlasticStations(filtered);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadWasteData();
    setRefreshing(false);
  }, []);

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow camera access to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSubmissionData(prev => ({
        ...prev,
        photos: [...prev.photos, result.assets[0]]
      }));
    }
  };

  const handleSelectFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow photo library access.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setSubmissionData(prev => ({
        ...prev,
        photos: [...prev.photos, ...result.assets]
      }));
    }
  };

  const removePhoto = (index) => {
    setSubmissionData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const handleSubmitWaste = async () => {
    // Validation
    const validation = wasteService.validateSubmissionData(submissionData);
    if (!validation.isValid) {
      Alert.alert('Validation Error', validation.errors.join('\n'));
      return;
    }

    if (submissionData.photos.length === 0) {
      Alert.alert('Photos Required', 'Please add at least one photo of your plastic waste.');
      return;
    }

    try {
      setLoading(true);
      
      // Create form data for file upload
      const formData = new FormData();
      formData.append('waste_type', submissionData.plastic_type);
      formData.append('weight_kg', submissionData.weight_kg);
      formData.append('station_id', submissionData.station_id);
      formData.append('notes', submissionData.notes);
      
      if (submissionData.location) {
        formData.append('latitude', submissionData.location.latitude.toString());
        formData.append('longitude', submissionData.location.longitude.toString());
      }
      
      // Add photos
      submissionData.photos.forEach((photo, index) => {
        formData.append('photos', {
          uri: photo.uri,
          type: 'image/jpeg',
          name: `waste_photo_${index}.jpg`,
        });
      });
      
      const result = await wasteService.submitWaste(formData);
      
      // Calculate estimated credits
      const estimatedCredits = wasteService.calculateCredits(
        submissionData.plastic_type, 
        parseFloat(submissionData.weight_kg)
      );
      
      Alert.alert(
        'Submission Successful!',
        `Your plastic waste submission has been recorded.\n\nWeight: ${submissionData.weight_kg} kg\nEstimated Credits: ${estimatedCredits} KES\n\nIt will be verified within 24 hours.`,
        [
          {
            text: 'Submit More',
            onPress: () => {
              setSubmissionData({
                plastic_type: '',
                weight_kg: '',
                photos: [],
                station_id: '',
                notes: '',
                location: submissionData.location, // Keep location
              });
            }
          },
          {
            text: 'View History',
            onPress: () => navigation.navigate('WasteHistory')
          }
        ]
      );
      
      await loadWasteData();
    } catch (error) {
      Alert.alert('Submission Failed', error.message || 'Failed to submit plastic waste.');
    } finally {
      setLoading(false);
    }
  };

  const renderStats = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Your Impact</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{userStats?.totalWeight?.toFixed(1) || '0'} kg</Text>
          <Text style={styles.statLabel}>Total Recycled</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{userStats?.totalCredits || 0}</Text>
          <Text style={styles.statLabel}>Credits Earned</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{userStats?.totalSubmissions || 0}</Text>
          <Text style={styles.statLabel}>Submissions</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{userStats?.co2Saved?.toFixed(1) || '0'} kg</Text>
          <Text style={styles.statLabel}>CO₂ Saved</Text>
        </View>
      </View>
    </View>
  );

  const renderSubmissionForm = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Submit Plastic Waste</Text>
      
      {/* Plastic Type Selector */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Plastic Type *</Text>
        <TouchableOpacity 
          style={styles.selector} 
          onPress={() => setShowTypeModal(true)}
        >
          <Text style={[styles.selectorText, !submissionData.plastic_type && styles.placeholder]}>
            {submissionData.plastic_type 
              ? wasteService.getWasteTypeInfo(submissionData.plastic_type).name
              : 'Select plastic type'
            }
          </Text>
          <Ionicons name="chevron-down" size={20} color={theme.colors.gray} />
        </TouchableOpacity>
      </View>
      
      {/* Weight Input */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Weight (kg) *</Text>
        <TextInput
          style={styles.input}
          value={submissionData.weight_kg}
          onChangeText={(text) => setSubmissionData(prev => ({ ...prev, weight_kg: text }))}
          placeholder="e.g., 2.5"
          keyboardType="decimal-pad"
        />
      </View>
      
      {/* Station Selector */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Drop-off Station *</Text>
        <TouchableOpacity 
          style={styles.selector} 
          onPress={() => setShowStationModal(true)}
        >
          <Text style={[styles.selectorText, !submissionData.station_id && styles.placeholder]}>
            {submissionData.station_id 
              ? plasticStations.find(s => s.id === submissionData.station_id)?.name
              : 'Select station'
            }
          </Text>
          <Ionicons name="chevron-down" size={20} color={theme.colors.gray} />
        </TouchableOpacity>
      </View>
      
      {/* Photos */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Photos *</Text>
        <View style={styles.photoGrid}>
          {submissionData.photos.map((photo, index) => (
            <View key={index} style={styles.photoContainer}>
              <TouchableOpacity onPress={() => setSelectedPhoto(photo)}>
                <Image source={{ uri: photo.uri }} style={styles.photoThumbnail} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.removePhotoButton} 
                onPress={() => removePhoto(index)}
              >
                <Ionicons name="close-circle" size={20} color={theme.colors.error} />
              </TouchableOpacity>
            </View>
          ))}
          
          <TouchableOpacity style={styles.addPhotoButton} onPress={() => setShowPhotoModal(true)}>
            <Ionicons name="camera" size={24} color={theme.colors.gray} />
            <Text style={styles.addPhotoText}>Add Photo</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Notes */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Notes (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={submissionData.notes}
          onChangeText={(text) => setSubmissionData(prev => ({ ...prev, notes: text }))}
          placeholder="Additional information about your submission..."
          multiline
          numberOfLines={3}
        />
      </View>
      
      {/* Estimated Credits */}
      {submissionData.plastic_type && submissionData.weight_kg && (
        <View style={styles.estimatedCredits}>
          <Text style={styles.estimatedLabel}>Estimated Credits:</Text>
          <Text style={styles.estimatedValue}>
            {wasteService.calculateCredits(
              submissionData.plastic_type, 
              parseFloat(submissionData.weight_kg) || 0
            )} KES
          </Text>
        </View>
      )}
      
      {/* Submit Button */}
      <TouchableOpacity 
        style={[
          styles.submitButton,
          (!submissionData.plastic_type || !submissionData.weight_kg || 
           !submissionData.station_id || submissionData.photos.length === 0) && 
          styles.disabledButton
        ]} 
        onPress={handleSubmitWaste}
        disabled={loading || !submissionData.plastic_type || !submissionData.weight_kg || 
                 !submissionData.station_id || submissionData.photos.length === 0}
      >
        <Text style={styles.submitButtonText}>
          {loading ? 'Submitting...' : 'Submit Plastic Waste'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderRecentSubmissions = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Submissions</Text>
        <TouchableOpacity onPress={() => navigation.navigate('WasteHistory')}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>
      
      {wasteHistory.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="leaf-outline" size={48} color={theme.colors.gray} />
          <Text style={styles.emptyText}>No submissions yet</Text>
        </View>
      ) : (
        wasteHistory.slice(0, 3).map((submission) => (
          <TouchableOpacity 
            key={submission.id} 
            style={styles.submissionItem}
            onPress={() => navigation.navigate('WasteDetails', { submission })}
          >
            <View style={styles.submissionContent}>
              <View style={styles.submissionHeader}>
                <Text style={styles.submissionType}>
                  {wasteService.getWasteTypeInfo(submission.plastic_type).name}
                </Text>
                <Text style={styles.submissionDate}>
                  {new Date(submission.submitted_at).toLocaleDateString()}
                </Text>
              </View>
              
              <Text style={styles.submissionWeight}>
                {submission.weight_kg} kg • {submission.station_name}
              </Text>
              
              <View style={styles.submissionFooter}>
                <View style={[
                  styles.statusBadge,
                  submission.verification_status === 'verified' ? styles.verifiedStatus :
                  submission.verification_status === 'pending_verification' ? styles.pendingStatus :
                  styles.rejectedStatus
                ]}>
                  <Text style={styles.statusText}>
                    {wasteService.formatWasteStatus(submission.verification_status)}
                  </Text>
                </View>
                
                <Text style={styles.submissionCredits}>
                  {submission.credits_earned || 0} KES
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
  const renderTypeModal = () => (
    <Modal visible={showTypeModal} animationType="slide" presentationStyle="formSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowTypeModal(false)}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Select Plastic Type</Text>
          <View style={styles.placeholder} />
        </View>
        
        <ScrollView style={styles.modalContent}>
          {wasteService.getAllWasteTypes().map((type) => {
            const typeInfo = wasteService.getWasteTypeInfo(type.value);
            return (
              <TouchableOpacity
                key={type.value}
                style={styles.typeOption}
                onPress={() => {
                  setSubmissionData(prev => ({ ...prev, plastic_type: type.value }));
                  setShowTypeModal(false);
                }}
              >
                <View style={styles.typeOptionContent}>
                  <Text style={styles.typeName}>{typeInfo.name}</Text>
                  <Text style={styles.typeDescription}>{typeInfo.description}</Text>
                  <Text style={styles.typeRate}>{typeInfo.creditRate} KES per kg</Text>
                </View>
                
                <View style={styles.typeExamples}>
                  {typeInfo.examples.map((example, index) => (
                    <Text key={index} style={styles.exampleText}>• {example}</Text>
                  ))}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );

  const renderStationModal = () => (
    <Modal visible={showStationModal} animationType="slide" presentationStyle="formSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowStationModal(false)}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Select Station</Text>
          <View style={styles.placeholder} />
        </View>
        
        <ScrollView style={styles.modalContent}>
          {plasticStations.map((station) => (
            <TouchableOpacity
              key={station.id}
              style={styles.stationOption}
              onPress={() => {
                setSubmissionData(prev => ({ ...prev, station_id: station.id }));
                setShowStationModal(false);
              }}
            >
              <Text style={styles.stationName}>{station.name}</Text>
              <Text style={styles.stationAddress}>{station.address}</Text>
              <Text style={styles.stationHours}>Hours: {station.operating_hours}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );

  const renderPhotoModal = () => (
    <Modal visible={showPhotoModal} animationType="slide" presentationStyle="formSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowPhotoModal(false)}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Add Photo</Text>
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.photoModalContent}>
          <TouchableOpacity style={styles.photoOption} onPress={handleTakePhoto}>
            <Ionicons name="camera" size={32} color={theme.colors.primary} />
            <Text style={styles.photoOptionText}>Take Photo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.photoOption} onPress={handleSelectFromGallery}>
            <Ionicons name="images" size={32} color={theme.colors.primary} />
            <Text style={styles.photoOptionText}>Choose from Gallery</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderFullSizePhotoModal = () => (
    <Modal visible={!!selectedPhoto} animationType="fade">
      <View style={styles.fullPhotoContainer}>
        <TouchableOpacity 
          style={styles.closeFullPhotoButton} 
          onPress={() => setSelectedPhoto(null)}
        >
          <Ionicons name="close" size={32} color={theme.colors.white} />
        </TouchableOpacity>
        
        {selectedPhoto && (
          <Image source={{ uri: selectedPhoto.uri }} style={styles.fullSizePhoto} />
        )}
      </View>
    </Modal>
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {renderStats()}
      {renderSubmissionForm()}
      {renderRecentSubmissions()}
      {renderTypeModal()}
      {renderStationModal()}
      {renderPhotoModal()}
      {renderFullSizePhotoModal()}
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
    backgroundColor: theme.colors.white,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: theme.colors.white,
  },
  selectorText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  placeholder: {
    color: theme.colors.gray,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photoContainer: {
    position: 'relative',
  },
  photoThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: theme.colors.white,
    borderRadius: 10,
  },
  addPhotoButton: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoText: {
    fontSize: 12,
    color: theme.colors.gray,
    marginTop: 4,
  },
  estimatedCredits: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '10',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  estimatedLabel: {
    fontSize: 16,
    color: theme.colors.text,
  },
  estimatedValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: theme.colors.gray,
  },
  submitButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  submissionItem: {
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
  submissionContent: {
    flex: 1,
  },
  submissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  submissionType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  submissionDate: {
    fontSize: 12,
    color: theme.colors.gray,
  },
  submissionWeight: {
    fontSize: 14,
    color: theme.colors.gray,
    marginBottom: 10,
  },
  submissionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedStatus: {
    backgroundColor: theme.colors.success + '20',
  },
  pendingStatus: {
    backgroundColor: theme.colors.warning + '20',
  },
  rejectedStatus: {
    backgroundColor: theme.colors.error + '20',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.success,
  },
  submissionCredits: {
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
  modalContent: {
    flex: 1,
    padding: 20,
  },
  typeOption: {
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  typeOptionContent: {
    marginBottom: 10,
  },
  typeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 5,
  },
  typeDescription: {
    fontSize: 14,
    color: theme.colors.gray,
    marginBottom: 5,
  },
  typeRate: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  typeExamples: {
    marginTop: 5,
  },
  exampleText: {
    fontSize: 12,
    color: theme.colors.gray,
    marginBottom: 2,
  },
  stationOption: {
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  stationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 5,
  },
  stationAddress: {
    fontSize: 14,
    color: theme.colors.gray,
    marginBottom: 5,
  },
  stationHours: {
    fontSize: 12,
    color: theme.colors.gray,
  },
  photoModalContent: {
    padding: 40,
    gap: 30,
  },
  photoOption: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: theme.colors.background,
    borderRadius: 12,
  },
  photoOptionText: {
    fontSize: 16,
    color: theme.colors.primary,
    marginTop: 10,
    fontWeight: '600',
  },
  fullPhotoContainer: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeFullPhotoButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 1,
  },
  fullSizePhoto: {
    width: '100%',
    height: '80%',
    resizeMode: 'contain',
  },
});

export default EnhancedPlasticWasteScreen;