import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Card, ProgressBar, Button } from 'react-native-paper';
import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useData } from '../contexts/DataContext';
import wasteService from '../services/wasteService';
import { colors, typography, spacing } from '../utils/theme';

const { width: screenWidth } = Dimensions.get('window');

export default function ImpactScreen({ navigation }) {
  const { userStats, isOnline } = useData();
  const [impactStats, setImpactStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadImpactData();
  }, []);

  const loadImpactData = async () => {
    try {
      setLoading(true);
      if (isOnline) {
        const [impact, leaders] = await Promise.all([
          wasteService.getImpactStats(),
          wasteService.getLeaderboard(5),
        ]);
        setImpactStats(impact);
        setLeaderboard(leaders);
      }
    } catch (error) {
      console.error('Error loading impact data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadImpactData();
    setRefreshing(false);
  };

  const getImpactLevel = (totalSwaps) => {
    if (totalSwaps >= 100) return { level: 'Eco Champion', color: colors.success, icon: 'eco' };
    if (totalSwaps >= 50) return { level: 'Green Warrior', color: colors.info, icon: 'nature' };
    if (totalSwaps >= 20) return { level: 'Eco Enthusiast', color: colors.warning, icon: 'spa' };
    if (totalSwaps >= 5) return { level: 'Green Starter', color: colors.primary, icon: 'local_florist' };
    return { level: 'Beginner', color: colors.textSecondary, icon: 'eco' };
  };

  // Chart data
  const impactData = [
    {
      name: 'CO₂ Saved',
      value: userStats.co2Saved,
      color: colors.success,
      legendFontColor: colors.text,
      legendFontSize: 12,
    },
    {
      name: 'Plastic Recycled',
      value: userStats.plasticRecycled * 2.5, // Normalize for visualization
      color: colors.warning,
      legendFontColor: colors.text,
      legendFontSize: 12,
    },
    {
      name: 'Money Saved',
      value: userStats.moneySaved / 10, // Normalize for visualization
      color: colors.info,
      legendFontColor: colors.text,
      legendFontSize: 12,
    },
  ];

  const monthlyData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        data: [2, 4, 6, 8, 10, 12], // Sample data - replace with actual monthly data
        color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  const chartConfig = {
    backgroundColor: colors.surface,
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: colors.primary,
    },
  };

  const impactLevel = getImpactLevel(userStats.totalSwaps);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Environmental Impact</Text>
        <Text style={styles.headerSubtitle}>
          See how you're making a difference for Kenya's environment
        </Text>
      </View>

      {/* Impact Level */}
      <Card style={styles.levelCard}>
        <Card.Content>
          <View style={styles.levelHeader}>
            <Icon name={impactLevel.icon} size={32} color={impactLevel.color} />
            <View style={styles.levelInfo}>
              <Text style={styles.levelTitle}>{impactLevel.level}</Text>
              <Text style={styles.levelSubtitle}>
                {userStats.totalSwaps} battery swaps completed
              </Text>
            </View>
          </View>
          
          <ProgressBar
            progress={Math.min(userStats.totalSwaps / 100, 1)}
            color={impactLevel.color}
            style={styles.levelProgress}
          />
          
          <Text style={styles.levelTarget}>
            {userStats.totalSwaps < 100 
              ? `${100 - userStats.totalSwaps} more swaps to become an Eco Champion`
              : 'Maximum level achieved! 🏆'
            }
          </Text>
        </Card.Content>
      </Card>

      {/* Impact Stats Grid */}
      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Icon name="eco" size={24} color={colors.success} />
            <Text style={styles.statValue}>{userStats.co2Saved.toFixed(1)} kg</Text>
            <Text style={styles.statLabel}>CO₂ Emissions Saved</Text>
            <Text style={styles.statEquivalent}>
              ≈ {(userStats.co2Saved * 2.2).toFixed(0)} trees planted
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Icon name="recycling" size={24} color={colors.warning} />
            <Text style={styles.statValue}>{userStats.plasticRecycled.toFixed(1)} kg</Text>
            <Text style={styles.statLabel}>Plastic Recycled</Text>
            <Text style={styles.statEquivalent}>
              ≈ {Math.floor(userStats.plasticRecycled * 20)} bottles
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Icon name="account-balance-wallet" size={24} color={colors.info} />
            <Text style={styles.statValue}>KES {userStats.moneySaved.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Money Saved</Text>
            <Text style={styles.statEquivalent}>
              vs. fuel costs
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Icon name="battery-charging-full" size={24} color={colors.primary} />
            <Text style={styles.statValue}>{userStats.totalSwaps}</Text>
            <Text style={styles.statLabel}>Battery Swaps</Text>
            <Text style={styles.statEquivalent}>
              Clean energy rides
            </Text>
          </Card.Content>
        </Card>
      </View>

      {/* Impact Breakdown Chart */}
      <Card style={styles.chartCard}>
        <Card.Content>
          <Text style={styles.chartTitle}>Impact Breakdown</Text>
          {impactData.some(item => item.value > 0) ? (
            <PieChart
              data={impactData}
              width={screenWidth - 64}
              height={200}
              chartConfig={chartConfig}
              accessor="value"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          ) : (
            <View style={styles.emptyChart}>
              <Icon name="eco" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyText}>Start using EcolithSwap to see your impact!</Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Monthly Progress */}
      <Card style={styles.chartCard}>
        <Card.Content>
          <Text style={styles.chartTitle}>Monthly CO₂ Savings</Text>
          <LineChart
            data={monthlyData}
            width={screenWidth - 64}
            height={200}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </Card.Content>
      </Card>

      {/* Community Impact */}
      <Card style={styles.communityCard}>
        <Card.Content>
          <Text style={styles.cardTitle}>Community Leaderboard</Text>
          <Text style={styles.cardSubtitle}>Top eco-warriors this month</Text>
          
          {leaderboard.length > 0 ? (
            leaderboard.map((user, index) => (
              <View key={index} style={styles.leaderboardItem}>
                <View style={styles.leaderboardRank}>
                  <Text style={styles.rankNumber}>{index + 1}</Text>
                </View>
                <View style={styles.leaderboardInfo}>
                  <Text style={styles.leaderboardName}>
                    {user.full_name || `User ${index + 1}`}
                  </Text>
                  <Text style={styles.leaderboardStats}>
                    {user.plastic_recycled.toFixed(1)}kg plastic • {user.total_swaps} swaps
                  </Text>
                </View>
                <View style={styles.leaderboardBadge}>
                  {index === 0 && <Icon name="emoji-events" size={20} color={colors.warning} />}
                  {index === 1 && <Icon name="workspace-premium" size={20} color={colors.textSecondary} />}
                  {index === 2 && <Icon name="military-tech" size={20} color={colors.warning} />}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyLeaderboard}>
              <Text style={styles.emptyText}>No community data available</Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('WasteTab')}
          style={[styles.actionButton, { backgroundColor: colors.success }]}
          icon="recycling"
        >
          Log More Waste
        </Button>
        
        <Button
          mode="outlined"
          onPress={() => navigation.navigate('StationsTab')}
          style={styles.actionButton}
          icon="location-on"
        >
          Find Stations
        </Button>
      </View>

      {/* Environmental Facts */}
      <Card style={styles.factsCard}>
        <Card.Content>
          <Text style={styles.cardTitle}>Did You Know?</Text>
          
          <View style={styles.factItem}>
            <Icon name="info" size={20} color={colors.info} />
            <Text style={styles.factText}>
              Every kg of plastic recycled saves 2.5kg of CO₂ emissions
            </Text>
          </View>
          
          <View style={styles.factItem}>
            <Icon name="info" size={20} color={colors.info} />
            <Text style={styles.factText}>
              Battery swapping reduces urban air pollution by 60%
            </Text>
          </View>
          
          <View style={styles.factItem}>
            <Icon name="info" size={20} color={colors.info} />
            <Text style={styles.factText}>
              Electric vehicles can reduce transport costs by up to 70%
            </Text>
          </View>
        </Card.Content>
      </Card>
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
  levelCard: {
    margin: spacing.md,
    backgroundColor: colors.surface,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  levelInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  levelTitle: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  levelSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  levelProgress: {
    height: 8,
    marginBottom: spacing.sm,
  },
  levelTarget: {
    ...typography.caption,
    textAlign: 'center',
    color: colors.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  statCard: {
    width: (screenWidth - spacing.md * 3) / 2,
    marginBottom: spacing.sm,
  },
  statContent: {
    alignItems: 'center',
    padding: spacing.md,
  },
  statValue: {
    ...typography.h3,
    marginVertical: spacing.xs,
    textAlign: 'center',
  },
  statLabel: {
    ...typography.caption,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  statEquivalent: {
    ...typography.caption,
    textAlign: 'center',
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  chartCard: {
    margin: spacing.md,
    backgroundColor: colors.surface,
  },
  chartTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  chart: {
    borderRadius: 16,
  },
  emptyChart: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  communityCard: {
    margin: spacing.md,
    backgroundColor: colors.surface,
  },
  cardTitle: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  cardSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  leaderboardRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  rankNumber: {
    ...typography.caption,
    color: 'white',
    fontWeight: 'bold',
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardName: {
    ...typography.body,
    fontWeight: '600',
  },
  leaderboardStats: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  leaderboardBadge: {
    width: 24,
    alignItems: 'center',
  },
  emptyLeaderboard: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  actionButtons: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  actionButton: {
    marginBottom: spacing.sm,
  },
  factsCard: {
    margin: spacing.md,
    marginBottom: spacing.xxl,
    backgroundColor: colors.surface,
  },
  factItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  factText: {
    ...typography.body,
    flex: 1,
    lineHeight: 20,
  },
});
