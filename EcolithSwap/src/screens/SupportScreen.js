import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import {
  Card,
  List,
  Button,
  TextInput,
  Modal,
  Portal,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as SMS from 'expo-sms';
import { useData } from '../contexts/DataContext';
import { colors, typography, spacing } from '../utils/theme';

export default function SupportScreen({ navigation }) {
  const { isOnline, activeRental } = useData();
  const [showContactModal, setShowContactModal] = useState(false);
  const [message, setMessage] = useState('');
  const [contactType, setContactType] = useState('');

  const supportPhone = '+254700000000'; // Replace with actual support number
  const supportEmail = 'support@ecolithswap.co.ke';
  const supportSMS = '+254700000000'; // SMS support number

  const handlePhoneCall = () => {
    Alert.alert(
      'Call Support',
      `Call EcolithSwap support at ${supportPhone}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () => Linking.openURL(`tel:${supportPhone}`),
        },
      ]
    );
  };

  const handleSMSSupport = async () => {
    try {
      const isAvailable = await SMS.isAvailableAsync();
      if (isAvailable) {
        await SMS.sendSMSAsync(
          supportSMS,
          `EcolithSwap Support Request: ${message || 'Need assistance with the app'}`
        );
        Alert.alert('SMS Sent', 'Your message has been sent to support.');
        setMessage('');
        setShowContactModal(false);
      } else {
        Alert.alert('SMS Not Available', 'SMS is not available on this device.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send SMS. Please try calling instead.');
    }
  };

  const handleEmailSupport = () => {
    const subject = 'EcolithSwap Support Request';
    const body = message || 'I need assistance with the EcolithSwap app.';
    const emailUrl = `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    Linking.openURL(emailUrl).catch(() => {
      Alert.alert('Email Not Available', 'Please install an email app or contact us directly.');
    });
  };

  const handleEmergencySupport = () => {
    if (activeRental) {
      Alert.alert(
        'Emergency Support',
        'If you have an active battery rental and need immediate assistance, we recommend:',
        [
          {
            text: 'Call Support',
            onPress: () => Linking.openURL(`tel:${supportPhone}`),
          },
          {
            text: 'Send SMS',
            onPress: () => {
              setContactType('emergency');
              setMessage(`EMERGENCY: Active rental ${activeRental.battery_id}. Need immediate assistance.`);
              setShowContactModal(true);
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } else {
      handlePhoneCall();
    }
  };

  const faqData = [
    {
      question: 'How do I start a battery swap?',
      answer: 'Find a nearby station using the Stations tab, then scan the QR code on the battery you want to rent using the Scan QR feature.',
    },
    {
      question: 'How much does battery swapping cost?',
      answer: 'Base rate is KES 50 with KES 25 per hour of usage. Payment is processed through M-Pesa.',
    },
    {
      question: 'Can I return a battery at any station?',
      answer: 'Yes, you can return your rented battery at any EcolithSwap station that accepts returns.',
    },
    {
      question: 'How do I earn eco points?',
      answer: 'Earn 10 eco points for every kg of plastic waste you recycle at participating stations.',
    },
    {
      question: 'What if I lose connection during a swap?',
      answer: 'The app works offline. Your actions will be synced when you reconnect to the internet.',
    },
    {
      question: 'How do I track my environmental impact?',
      answer: 'Visit the Impact tab to see your CO₂ savings, plastic recycled, and money saved.',
    },
    {
      question: 'What types of plastic can I recycle?',
      answer: 'We accept most plastic bottles, containers, and packaging. Check with station staff for specific guidelines.',
    },
    {
      question: 'How do I contact support if offline?',
      answer: 'You can send SMS to our support number even without internet connection.',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Support & Help</Text>
        <Text style={styles.headerSubtitle}>
          Get help with EcolithSwap or contact our support team
        </Text>
        
        {!isOnline && (
          <View style={styles.offlineWarning}>
            <Icon name="wifi-off" size={16} color={colors.warning} />
            <Text style={styles.offlineText}>
              Offline mode - SMS and phone support available
            </Text>
          </View>
        )}
      </View>

      {/* Emergency Support */}
      {activeRental && (
        <Card style={styles.emergencyCard}>
          <Card.Content>
            <View style={styles.emergencyHeader}>
              <Icon name="emergency" size={24} color={colors.error} />
              <Text style={styles.emergencyTitle}>Need Immediate Help?</Text>
            </View>
            <Text style={styles.emergencyText}>
              You have an active battery rental. If you need urgent assistance, contact support immediately.
            </Text>
            <Button
              mode="contained"
              onPress={handleEmergencySupport}
              style={styles.emergencyButton}
              icon="phone"
            >
              Emergency Support
            </Button>
          </Card.Content>
        </Card>
      )}

      {/* Quick Contact */}
      <Card style={styles.contactCard}>
        <Card.Content>
          <Text style={styles.cardTitle}>Contact Support</Text>
          
          <List.Item
            title="Call Support"
            description={`${supportPhone} (24/7 available)`}
            left={props => <List.Icon {...props} icon="phone" color={colors.primary} />}
            onPress={handlePhoneCall}
            style={styles.contactItem}
          />
          
          <List.Item
            title="Send SMS"
            description="Works even without internet"
            left={props => <List.Icon {...props} icon="message" color={colors.success} />}
            onPress={() => {
              setContactType('sms');
              setShowContactModal(true);
            }}
            style={styles.contactItem}
          />
          
          <List.Item
            title="Email Support"
            description={supportEmail}
            left={props => <List.Icon {...props} icon="email" color={colors.info} />}
            onPress={() => {
              setContactType('email');
              setShowContactModal(true);
            }}
            style={styles.contactItem}
          />
        </Card.Content>
      </Card>

      {/* FAQ Section */}
      <Card style={styles.faqCard}>
        <Card.Content>
          <Text style={styles.cardTitle}>Frequently Asked Questions</Text>
          
          {faqData.map((faq, index) => (
            <List.Accordion
              key={index}
              title={faq.question}
              titleStyle={styles.faqQuestion}
              style={styles.faqItem}
            >
              <List.Item
                title={faq.answer}
                titleNumberOfLines={0}
                titleStyle={styles.faqAnswer}
              />
            </List.Accordion>
          ))}
        </Card.Content>
      </Card>

      {/* App Info */}
      <Card style={styles.appInfoCard}>
        <Card.Content>
          <Text style={styles.cardTitle}>App Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Version:</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Build:</Text>
            <Text style={styles.infoValue}>2025.01.001</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Connection:</Text>
            <Text style={[styles.infoValue, { color: isOnline ? colors.success : colors.warning }]}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Legal Links */}
      <Card style={styles.legalCard}>
        <Card.Content>
          <Text style={styles.cardTitle}>Legal & Privacy</Text>
          
          <List.Item
            title="Terms of Service"
            left={props => <List.Icon {...props} icon="description" />}
            onPress={() => {/* Navigate to terms */}}
            style={styles.legalItem}
          />
          
          <List.Item
            title="Privacy Policy"
            left={props => <List.Icon {...props} icon="privacy-tip" />}
            onPress={() => {/* Navigate to privacy */}}
            style={styles.legalItem}
          />
          
          <List.Item
            title="About EcolithSwap"
            left={props => <List.Icon {...props} icon="info" />}
            onPress={() => {/* Navigate to about */}}
            style={styles.legalItem}
          />
        </Card.Content>
      </Card>

      {/* Contact Modal */}
      <Portal>
        <Modal
          visible={showContactModal}
          onDismiss={() => setShowContactModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalTitle}>
            {contactType === 'emergency' ? 'Emergency Support' : 'Contact Support'}
          </Text>
          
          <TextInput
            label="Describe your issue"
            value={message}
            onChangeText={setMessage}
            mode="outlined"
            multiline
            numberOfLines={4}
            style={styles.messageInput}
            placeholder="Please describe your issue or question..."
          />
          
          <View style={styles.modalActions}>
            <Button
              mode="text"
              onPress={() => setShowContactModal(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            
            {contactType === 'sms' || contactType === 'emergency' ? (
              <Button
                mode="contained"
                onPress={handleSMSSupport}
                style={styles.modalButton}
                icon="message"
              >
                Send SMS
              </Button>
            ) : (
              <Button
                mode="contained"
                onPress={handleEmailSupport}
                style={styles.modalButton}
                icon="email"
              >
                Send Email
              </Button>
            )}
          </View>
        </Modal>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.info,
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
  emergencyCard: {
    margin: spacing.md,
    backgroundColor: colors.error + '10',
    borderWidth: 1,
    borderColor: colors.error,
  },
  emergencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  emergencyTitle: {
    ...typography.h3,
    marginLeft: spacing.sm,
    color: colors.error,
  },
  emergencyText: {
    ...typography.body,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  emergencyButton: {
    backgroundColor: colors.error,
  },
  contactCard: {
    margin: spacing.md,
    backgroundColor: colors.surface,
  },
  cardTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  contactItem: {
    paddingHorizontal: 0,
  },
  faqCard: {
    margin: spacing.md,
    backgroundColor: colors.surface,
  },
  faqItem: {
    backgroundColor: colors.background,
    marginBottom: spacing.xs,
    borderRadius: 8,
  },
  faqQuestion: {
    ...typography.body,
    fontWeight: '600',
  },
  faqAnswer: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  appInfoCard: {
    margin: spacing.md,
    backgroundColor: colors.surface,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  infoLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  infoValue: {
    ...typography.body,
    fontWeight: '600',
  },
  legalCard: {
    margin: spacing.md,
    marginBottom: spacing.xxl,
    backgroundColor: colors.surface,
  },
  legalItem: {
    paddingHorizontal: 0,
  },
  modalContainer: {
    backgroundColor: colors.surface,
    margin: spacing.lg,
    borderRadius: 12,
    padding: spacing.lg,
  },
  modalTitle: {
    ...typography.h3,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  messageInput: {
    marginBottom: spacing.lg,
    backgroundColor: colors.background,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
  },
});
