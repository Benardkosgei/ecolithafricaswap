import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Card, Chip, Searchbar, FAB } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useData } from '../contexts/DataContext';
import batteryService from '../services/batteryService';
import wasteService from '../services/wasteService';
import { colors, typography, spacing } from '../utils/theme';

export default function HistoryScreen({ navigation }) {
  const { isOnline } = useData();
  const [activeTab, setActiveTab] = useState('all'); // all, swaps, waste
  const [searchQuery, setSearchQuery] = useState('');
  const [rentalHistory, setRentalHistory] = useState([]);
  const [wasteHistory, setWasteHistory] = useState([]);
  const [combinedHistory, setCombinedHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    combineAndFilterHistory();
  }, [rentalHistory, wasteHistory, activeTab, searchQuery]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      if (isOnline) {
        const [rentals, waste] = await Promise.all([
          batteryService.getRentalHistory(50),
          wasteService.getWasteHistory(50),
        ]);
        setRentalHistory(rentals);
        setWasteHistory(waste);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const combineAndFilterHistory = () => {
    let combined = [];

    // Add rental history
    if (activeTab === 'all' || activeTab === 'swaps') {
      const formattedRentals = rentalHistory.map(rental => ({
        ...rental,
        type: 'rental',
        date: rental.created_at,
        title: `Battery Swap - ${rental.stations?.name}`,
        subtitle: `Battery ${rental.battery_id}`,
        amount: rental.cost,
        status: rental.is_active ? 'Active' : 'Completed',
      }));
      combined = [...combined, ...formattedRentals];
    }

    // Add waste history
    if (activeTab === 'all' || activeTab === 'waste') {
      const formattedWaste = wasteHistory.map(waste => ({
        ...waste,
        type: 'waste',
        date: waste.logged_at,
        title: `Plastic Waste - ${waste.stations?.name}`,
        subtitle: `${parseFloat(waste.weight_kg).toFixed(1)} kg`,
        amount: waste.points_earned,
        status: 'Completed',
      }));
      combined = [...combined, ...formattedWaste];
    }

    // Filter by search query
    if (searchQuery) {
      combined = combined.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort by date (newest first)
    combined.sort((a, b) => new Date(b.date) - new Date(a.date));

    setCombinedHistory(combined);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-KE', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-KE', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  };

  const getItemIcon = (type, status) => {
    if (type === 'rental') {
      return status === 'Active' ? 'battery-charging-full' : 'battery-full';
    }
    return 'recycling';
  };

  const getItemColor = (type, status) => {
    if (type === 'rental') {
      return status === 'Active' ? colors.warning : colors.primary;
    }
    return colors.success;
  };

  const getAmountDisplay = (item) => {
    if (item.type === 'rental') {
      return `KES ${item.amount || 0}`;
    }
    return `+${item.amount} pts`;
  };

  const renderHistoryItem = ({ item }) => (
    <Card style={styles.historyCard}>
      <TouchableOpacity>
        <Card.Content>
          <View style={styles.historyHeader}>
            <View style={styles.historyIcon}>
              <Icon
                name={getItemIcon(item.type, item.status)}
                size={24}
                color={getItemColor(item.type, item.status)}
              />
            </View>
            
            <View style={styles.historyInfo}>
              <Text style={styles.historyTitle}>{item.title}</Text>
              <Text style={styles.historySubtitle}>{item.subtitle}</Text>
              <Text style={styles.historyDate}>{formatDate(item.date)}</Text>
            </View>

            <View style={styles.historyAmount}>
              <Text style={[
                styles.amountText,
                { color: getItemColor(item.type, item.status) }
              ]}>
                {getAmountDisplay(item)}
              </Text>
              
              <Chip
                mode="outlined"
                compact
                style={[
                  styles.statusChip,
                  { borderColor: getItemColor(item.type, item.status) }
                ]}
              >
                {item.status}
              </Chip>
            </View>
          </View>

          {/* Additional Details */}
          {item.type === 'rental' && item.start_time && item.end_time && (
            <View style={styles.rentalDetails}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Duration:</Text>
                <Text style={styles.detailValue}>
                  {Math.ceil((new Date(item.end_time) - new Date(item.start_time)) / (1000 * 60 * 60))} hours
                </Text>
              </View>
              {item.payment_status && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Payment:</Text>
                  <Text style={[
                    styles.detailValue,
                    { color: item.payment_status === 'completed' ? colors.success : colors.warning }
                  ]}>
                    {item.payment_status.charAt(0).toUpperCase() + item.payment_status.slice(1)}
                  </Text>
                </View>
              )}
            </View>
          )}
        </Card.Content>
      </TouchableOpacity>
    </Card>
  );

  const renderTabButton = (tab, label) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        activeTab === tab && styles.activeTabButton
      ]}
      onPress={() => setActiveTab(tab)}
    >
      <Text style={[
        styles.tabText,
        activeTab === tab && styles.activeTabText
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const getEmptyMessage = () => {
    if (!isOnline) {
      return 'History not available offline. Connect to internet to view your history.';
    }
    
    switch (activeTab) {
      case 'swaps':
        return 'No battery swaps yet. Start by scanning a QR code at any station.';
      case 'waste':
        return 'No plastic waste logged yet. Visit a station to recycle plastic and earn points.';
      default:
        return 'No activity yet. Start using EcolithSwap to see your history here.';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Activity History</Text>
        <Text style={styles.headerSubtitle}>
          Track your battery swaps and plastic recycling
        </Text>
      </View>

      {/* Search Bar */}
      <Searchbar
        placeholder="Search history..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {renderTabButton('all', 'All')}
        {renderTabButton('swaps', 'Battery Swaps')}
        {renderTabButton('waste', 'Plastic Waste')}
      </View>

      {/* History List */}
      <FlatList
        data={combinedHistory}
        renderItem={renderHistoryItem}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        style={styles.historyList}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon
              name={activeTab === 'swaps' ? 'battery-alert' : activeTab === 'waste' ? 'recycling' : 'history'}
              size={64}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyTitle}>No History Found</Text>
            <Text style={styles.emptyText}>{getEmptyMessage()}</Text>
            
            {isOnline && (
              <View style={styles.emptyActions}>
                <TouchableOpacity
                  style={styles.emptyAction}
                  onPress={() => navigation.navigate('HomeTab')}
                >
                  <Icon name="qr-code-scanner" size={24} color={colors.primary} />
                  <Text style={styles.emptyActionText}>Start Swapping</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.emptyAction}
                  onPress={() => navigation.navigate('WasteTab')}
                >
                  <Icon name="recycling" size={24} color={colors.success} />
                  <Text style={styles.emptyActionText}>Log Waste</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Quick Action FAB */}
      <FAB
        style={styles.fab}
        icon="add"
        onPress={() => navigation.navigate('HomeTab')}
        label="New Activity"
      />
    </View>
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
  searchBar: {
    margin: spacing.md,
    backgroundColor: colors.surface,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.xs,
    borderRadius: 8,
  },
  activeTabButton: {
    backgroundColor: colors.primary,
  },
  tabText: {
    ...typography.button,
    color: colors.text,
  },
  activeTabText: {
    color: 'white',
  },
  historyList: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  historyCard: {
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  historyInfo: {
    flex: 1,
  },
  historyTitle: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  historySubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  historyDate: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  historyAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  statusChip: {
    height: 24,
  },
  rentalDetails: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  detailLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  detailValue: {
    ...typography.caption,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    ...typography.h3,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    color: colors.textSecondary,
  },
  emptyText: {
    ...typography.body,
    textAlign: 'center',
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  emptyActions: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  emptyAction: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyActionText: {
    ...typography.caption,
    color: colors.primary,
  },
  fab: {
    position: 'absolute',
    margin: spacing.md,
    right: 0,
    bottom: spacing.xl,
    backgroundColor: colors.primary,
  },
});
