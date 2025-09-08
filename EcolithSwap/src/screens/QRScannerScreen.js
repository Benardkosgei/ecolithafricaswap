import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Vibration,
  BackHandler,
} from 'react-native';
import { Camera } from 'expo-camera';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { Button, ActivityIndicator, FAB } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useData } from '../contexts/DataContext';
import { colors, typography, spacing } from '../utils/theme';

export default function QRScannerScreen({ navigation }) {
  const { initiateBatterySwap, completeBatteryReturn, activeRental, isOnline } = useData();
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [flashOn, setFlashOn] = useState(false);

  useEffect(() => {
    getCameraPermissions();
    
    // Handle back button
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => backHandler.remove();
  }, []);

  const getCameraPermissions = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const handleBackPress = () => {
    if (processing) {
      // Don't allow back during processing
      return true;
    }
    navigation.goBack();
    return true;
  };

  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanned || processing) return;
    
    setScanned(true);
    setProcessing(true);
    Vibration.vibrate(100);

    try {
      // Parse QR code data
      const qrData = JSON.parse(data);
      
      if (!qrData.stationId || !qrData.batteryId) {
        throw new Error('Invalid QR code format');
      }

      // Determine action based on current state
      if (activeRental) {
        // User has active rental - this should be a return
        await handleBatteryReturn(qrData);
      } else {
        // User doesn't have active rental - this should be a swap
        await handleBatterySwap(qrData);
      }
    } catch (error) {
      console.error('QR scan error:', error);
      Alert.alert(
        'Scan Error',
        error.message || 'Invalid QR code. Please try again.',
        [
          {
            text: 'Try Again',
            onPress: () => {
              setScanned(false);
              setProcessing(false);
            },
          },
          {
            text: 'Cancel',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }
  };

  const handleBatterySwap = async (qrData) => {
    try {
      const result = await initiateBatterySwap(qrData.stationId, qrData.batteryId);
      
      if (result.success) {
        Alert.alert(
          'Battery Swap Initiated',
          result.offline 
            ? 'Swap recorded offline. Will sync when connection is restored.'
            : 'Battery swap started successfully!',
          [
            {
              text: 'Continue',
              onPress: () => {
                navigation.navigate('Payment', { 
                  rental: result.rental,
                  offline: result.offline 
                });
              },
            },
          ]
        );
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      throw error;
    } finally {
      setProcessing(false);
    }
  };

  const handleBatteryReturn = async (qrData) => {
    try {
      // Confirm return action
      Alert.alert(
        'Return Battery',
        `Are you sure you want to return your battery to ${qrData.stationName || 'this station'}?`,
        [
          {
            text: 'Cancel',
            onPress: () => {
              setScanned(false);
              setProcessing(false);
            },
          },
          {
            text: 'Return',
            onPress: async () => {
              try {
                const result = await completeBatteryReturn(qrData.stationId);
                
                if (result.success) {
                  Alert.alert(
                    'Battery Returned',
                    result.offline
                      ? 'Return recorded offline. Will sync when connection is restored.'
                      : `Battery returned successfully!\\n\\nTotal Cost: KES ${result.totalCost}\\nDuration: ${result.durationHours} hours`,
                    [
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
                setScanned(false);
                setProcessing(false);
              }
            },
          },
        ]
      );
    } catch (error) {
      throw error;
    }
  };

  const toggleFlash = () => {
    setFlashOn(!flashOn);
  };

  const resetScanner = () => {
    setScanned(false);
    setProcessing(false);
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Icon name="camera-alt" size={64} color={colors.textSecondary} />
        <Text style={styles.permissionText}>No access to camera</Text>
        <Text style={styles.permissionSubtext}>
          Camera permission is required to scan QR codes
        </Text>
        <Button
          mode="contained"
          onPress={getCameraPermissions}
          style={styles.permissionButton}
        >
          Grant Permission
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={styles.camera}
        type={Camera.Constants.Type.back}
        flashMode={flashOn ? Camera.Constants.FlashMode.torch : Camera.Constants.FlashMode.off}
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        barCodeScannerSettings={{
          barCodeTypes: [BarCodeScanner.Constants.BarCodeType.qr],
        }}
      >
        <View style={styles.overlay}>
          {/* Header */}
          <View style={styles.header}>
            <FAB
              style={styles.backButton}
              icon="arrow-left"
              size="small"
              onPress={() => navigation.goBack()}
              disabled={processing}
            />
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>
                {activeRental ? 'Return Battery' : 'Scan for Battery Swap'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {isOnline ? 'Online' : 'Offline Mode'}
              </Text>
            </View>
            <FAB
              style={styles.flashButton}
              icon={flashOn ? 'flash-off' : 'flash-on'}
              size="small"
              onPress={toggleFlash}
              disabled={processing}
            />
          </View>

          {/* Scanning Frame */}
          <View style={styles.scanningFrame}>
            <View style={styles.frame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
              
              {processing && (
                <View style={styles.processingOverlay}>
                  <ActivityIndicator size="large" color="white" />
                  <Text style={styles.processingText}>Processing...</Text>
                </View>
              )}
            </View>
          </View>

          {/* Instructions */}
          <View style={styles.instructions}>
            <Text style={styles.instructionTitle}>
              {activeRental ? 'Scan station QR to return battery' : 'Scan battery QR code to start rental'}
            </Text>
            <Text style={styles.instructionText}>
              Position the QR code within the frame above
            </Text>
            
            {!isOnline && (
              <View style={styles.offlineWarning}>
                <Icon name="wifi-off" size={16} color={colors.warning} />
                <Text style={styles.offlineText}>
                  Offline mode: Actions will sync when connected
                </Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {scanned && !processing && (
              <Button
                mode="outlined"
                onPress={resetScanner}
                style={styles.actionButton}
                labelStyle={styles.actionButtonLabel}
              >
                Scan Again
              </Button>
            )}
            
            <Button
              mode="text"
              onPress={() => navigation.goBack()}
              disabled={processing}
              style={styles.actionButton}
              labelStyle={styles.actionButtonLabel}
            >
              Cancel
            </Button>
          </View>
        </View>
      </Camera>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.h3,
    color: 'white',
    textAlign: 'center',
  },
  headerSubtitle: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: spacing.xs,
  },
  flashButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  scanningFrame: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderWidth: 4,
    borderColor: 'white',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    ...typography.body,
    color: 'white',
    marginTop: spacing.md,
  },
  instructions: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  instructionTitle: {
    ...typography.h3,
    color: 'white',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  instructionText: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  offlineWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
    borderRadius: 8,
    gap: spacing.sm,
  },
  offlineText: {
    ...typography.caption,
    color: colors.warning,
  },
  actionButtons: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  actionButton: {
    borderColor: 'white',
  },
  actionButtonLabel: {
    color: 'white',
  },
  permissionText: {
    ...typography.h3,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textAlign: 'center',
    color: colors.textSecondary,
  },
  permissionSubtext: {
    ...typography.body,
    textAlign: 'center',
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  permissionButton: {
    backgroundColor: colors.primary,
  },
});
