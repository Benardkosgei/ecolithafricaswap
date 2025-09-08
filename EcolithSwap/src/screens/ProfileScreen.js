import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  TextInput,
  Modal,
  Platform,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import profileService from '../services/profileService';
import { theme } from '../utils/theme';

const ProfileScreen = ({ navigation }) => {
  const { user, updateProfile: updateAuthProfile, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  // Profile data
  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    profile_image: user?.profile_image || null,
  });
  
  // Vehicle data
  const [vehicleData, setVehicleData] = useState({
    vehicle_type: user?.vehicle_type || '',
    vehicle_brand: user?.vehicle_brand || '',
    vehicle_model: user?.vehicle_model || '',
    battery_type: user?.battery_type || '',
  });
  
  // Notification preferences
  const [notificationPrefs, setNotificationPrefs] = useState({
    rental_notifications: user?.rental_notifications !== false,
    payment_notifications: user?.payment_notifications !== false,
    promotional_notifications: user?.promotional_notifications !== false,
    maintenance_notifications: user?.maintenance_notifications !== false,
  });
  
  // Password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  // Stats and activity
  const [userStats, setUserStats] = useState(null);
  const [userActivity, setUserActivity] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUserData();
  }, [user]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const [stats, activity] = await Promise.all([
        profileService.getUserStats(user?.id),
        profileService.getUserActivity(user?.id, '30d'),
      ]);
      
      setUserStats(stats);
      setUserActivity(activity || []);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  }, []);

  const handleImagePicker = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      try {
        setLoading(true);
        const uploadResult = await profileService.uploadProfilePhoto(result.assets[0].uri);
        setProfileData(prev => ({ ...prev, profile_image: uploadResult.url }));
        await updateAuthProfile({ profile_image: uploadResult.url });
        Alert.alert('Success', 'Profile photo updated successfully!');
      } catch (error) {
        Alert.alert('Error', 'Failed to upload profile photo.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      await profileService.updateProfile(profileData);
      await updateAuthProfile(profileData);
      setEditMode(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateVehicle = async () => {
    try {
      setLoading(true);
      await profileService.updateVehicleInfo(vehicleData);
      await updateAuthProfile(vehicleData);
      setShowVehicleModal(false);
      Alert.alert('Success', 'Vehicle information updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update vehicle information.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNotifications = async () => {
    try {
      setLoading(true);
      await profileService.updateNotificationPreferences(notificationPrefs);
      setShowNotificationModal(false);
      Alert.alert('Success', 'Notification preferences updated!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update notification preferences.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long.');
      return;
    }

    try {
      setLoading(true);
      await profileService.updatePassword(passwordData.currentPassword, passwordData.newPassword);
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      Alert.alert('Success', 'Password changed successfully!');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={handleImagePicker} style={styles.imageContainer}>
        {profileData.profile_image ? (
          <Image source={{ uri: profileData.profile_image }} style={styles.profileImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="person" size={40} color={theme.colors.gray} />
          </View>
        )}
        <View style={styles.cameraButton}>
          <Ionicons name="camera" size={16} color={theme.colors.white} />
        </View>
      </TouchableOpacity>
      
      <Text style={styles.userName}>{user?.full_name || 'User'}</Text>
      <Text style={styles.userEmail}>{user?.email || ''}</Text>
      
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{userStats?.totalRentals || 0}</Text>
          <Text style={styles.statLabel}>Rentals</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{userStats?.totalCredits || 0}</Text>
          <Text style={styles.statLabel}>Credits</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{userStats?.totalWasteSubmitted || 0}</Text>
          <Text style={styles.statLabel}>Kg Recycled</Text>
        </View>
      </View>
    </View>
  );

  const renderProfileForm = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        <TouchableOpacity onPress={() => setEditMode(!editMode)}>
          <Text style={styles.editButton}>{editMode ? 'Cancel' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={[styles.input, !editMode && styles.disabledInput]}
          value={profileData.full_name}
          onChangeText={(text) => setProfileData(prev => ({ ...prev, full_name: text }))}
          editable={editMode}
        />
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={[styles.input, styles.disabledInput]}
          value={profileData.email}
          editable={false}
        />
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Phone</Text>
        <TextInput
          style={[styles.input, !editMode && styles.disabledInput]}
          value={profileData.phone}
          onChangeText={(text) => setProfileData(prev => ({ ...prev, phone: text }))}
          editable={editMode}
          keyboardType="phone-pad"
        />
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Address</Text>
        <TextInput
          style={[styles.input, styles.textArea, !editMode && styles.disabledInput]}
          value={profileData.address}
          onChangeText={(text) => setProfileData(prev => ({ ...prev, address: text }))}
          editable={editMode}
          multiline
          numberOfLines={3}
        />
      </View>
      
      {editMode && (
        <TouchableOpacity style={styles.saveButton} onPress={handleUpdateProfile}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderMenuOptions = () => (
    <View style={styles.section}>
      <TouchableOpacity 
        style={styles.menuItem} 
        onPress={() => setShowVehicleModal(true)}
      >
        <Ionicons name="car" size={24} color={theme.colors.primary} />
        <Text style={styles.menuText}>Vehicle Information</Text>
        <Ionicons name="chevron-forward" size={20} color={theme.colors.gray} />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.menuItem} 
        onPress={() => setShowNotificationModal(true)}
      >
        <Ionicons name="notifications" size={24} color={theme.colors.primary} />
        <Text style={styles.menuText}>Notification Settings</Text>
        <Ionicons name="chevron-forward" size={20} color={theme.colors.gray} />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.menuItem} 
        onPress={() => setShowPasswordModal(true)}
      >
        <Ionicons name="lock-closed" size={24} color={theme.colors.primary} />
        <Text style={styles.menuText}>Change Password</Text>
        <Ionicons name="chevron-forward" size={20} color={theme.colors.gray} />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.menuItem} 
        onPress={() => navigation.navigate('PaymentHistory')}
      >
        <Ionicons name="card" size={24} color={theme.colors.primary} />
        <Text style={styles.menuText}>Payment Methods</Text>
        <Ionicons name="chevron-forward" size={20} color={theme.colors.gray} />
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={handleLogout}>
        <Ionicons name="log-out" size={24} color={theme.colors.error} />
        <Text style={[styles.menuText, styles.logoutText]}>Logout</Text>
        <Ionicons name="chevron-forward" size={20} color={theme.colors.gray} />
      </TouchableOpacity>
    </View>
  );

  const renderVehicleModal = () => (
    <Modal visible={showVehicleModal} animationType="slide" presentationStyle="formSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowVehicleModal(false)}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Vehicle Information</Text>
          <TouchableOpacity onPress={handleUpdateVehicle}>
            <Text style={styles.saveButton}>Save</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Vehicle Type</Text>
            <TextInput
              style={styles.input}
              value={vehicleData.vehicle_type}
              onChangeText={(text) => setVehicleData(prev => ({ ...prev, vehicle_type: text }))}
              placeholder="e.g., Motorcycle, Scooter"
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Vehicle Brand</Text>
            <TextInput
              style={styles.input}
              value={vehicleData.vehicle_brand}
              onChangeText={(text) => setVehicleData(prev => ({ ...prev, vehicle_brand: text }))}
              placeholder="e.g., Honda, Yamaha"
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Vehicle Model</Text>
            <TextInput
              style={styles.input}
              value={vehicleData.vehicle_model}
              onChangeText={(text) => setVehicleData(prev => ({ ...prev, vehicle_model: text }))}
              placeholder="e.g., Civic, Vario"
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Battery Type</Text>
            <TextInput
              style={styles.input}
              value={vehicleData.battery_type}
              onChangeText={(text) => setVehicleData(prev => ({ ...prev, battery_type: text }))}
              placeholder="e.g., Li-ion 48V"
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  const renderNotificationModal = () => (
    <Modal visible={showNotificationModal} animationType="slide" presentationStyle="formSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowNotificationModal(false)}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Notifications</Text>
          <TouchableOpacity onPress={handleUpdateNotifications}>
            <Text style={styles.saveButton}>Save</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.modalContent}>
          {Object.entries(notificationPrefs).map(([key, value]) => (
            <TouchableOpacity
              key={key}
              style={styles.notificationItem}
              onPress={() => setNotificationPrefs(prev => ({ ...prev, [key]: !value }))}
            >
              <Text style={styles.notificationText}>
                {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Text>
              <View style={[styles.toggle, value && styles.toggleActive]}>
                <View style={[styles.toggleThumb, value && styles.toggleThumbActive]} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );

  const renderPasswordModal = () => (
    <Modal visible={showPasswordModal} animationType="slide" presentationStyle="formSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Change Password</Text>
          <TouchableOpacity onPress={handleChangePassword}>
            <Text style={styles.saveButton}>Save</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.modalContent}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Current Password</Text>
            <TextInput
              style={styles.input}
              value={passwordData.currentPassword}
              onChangeText={(text) => setPasswordData(prev => ({ ...prev, currentPassword: text }))}
              secureTextEntry
              placeholder="Enter current password"
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>New Password</Text>
            <TextInput
              style={styles.input}
              value={passwordData.newPassword}
              onChangeText={(text) => setPasswordData(prev => ({ ...prev, newPassword: text }))}
              secureTextEntry
              placeholder="Enter new password"
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Confirm New Password</Text>
            <TextInput
              style={styles.input}
              value={passwordData.confirmPassword}
              onChangeText={(text) => setPasswordData(prev => ({ ...prev, confirmPassword: text }))}
              secureTextEntry
              placeholder="Confirm new password"
            />
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {renderHeader()}
      {renderProfileForm()}
      {renderMenuOptions()}
      {renderVehicleModal()}
      {renderNotificationModal()}
      {renderPasswordModal()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.white,
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  placeholderImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.primary,
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: theme.colors.gray,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.gray,
    marginTop: 2,
  },
  section: {
    backgroundColor: theme.colors.white,
    margin: 15,
    borderRadius: 12,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  editButton: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme.colors.text,
  },
  disabledInput: {
    backgroundColor: theme.colors.background,
    color: theme.colors.gray,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    marginLeft: 15,
  },
  logoutItem: {
    borderBottomWidth: 0,
  },
  logoutText: {
    color: theme.colors.error,
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
  notificationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  notificationText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.border,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: theme.colors.primary,
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: theme.colors.white,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
});

export default ProfileScreen;