import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Text } from 'react-native-paper';
import { Colors } from '../theme/colors';
import {
  ChevronLeft,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Calendar,
  ArrowDown,
  ArrowUp,
  Minus,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getAnalytics } from '../services/activity.service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 80;

const CATEGORY_COLORS: Record<string, string> = {
  transport: '#1565C0',
  food: '#E65100',
  energy: '#F9A825',
  waste: '#2E7D32',
};

const CATEGORY_ICONS: Record<string, string> = {
  transport: '🚗',
  food: '🍽️',
  energy: '⚡',
  waste: '♻️',
};

interface AnalyticsProps {
  onBack: () => void;
}

export const Analytics = ({ onBack }: AnalyticsProps) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const result = await getAnalytics(period);
      setData(result);
    } catch (e) {
      console.log('Analytics error:', e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  }, [period]);

  // Find the max value in timeline for scaling the bar chart
  const maxEmission = data?.timeline?.length > 0
    ? Math.max(...data.timeline.map((t: any) => t.emissions), 1)
    : 1;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ChevronLeft size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Carbon Analytics</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
      >
        {/* Period Tabs */}
        <View style={styles.periodTabs}>
          {(['weekly', 'monthly', 'yearly'] as const).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.periodTab, period === p && styles.periodTabActive]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.periodTabText, period === p && styles.periodTabTextActive]}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={{ marginTop: 12, color: Colors.textSecondary }}>Loading analytics...</Text>
          </View>
        ) : !data || data.totalLogs === 0 ? (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>📊</Text>
            <Text style={styles.emptyTitle}>No Data Yet</Text>
            <Text style={styles.emptyDesc}>
              Start logging your daily activities in the Eco Tracker to see analytics here.
            </Text>
          </View>
        ) : (
          <>
            {/* Trend Card */}
            <LinearGradient
              colors={data.trend <= 0 ? ['#ECFDF5', '#D1FAE5'] : ['#FFF7ED', '#FED7AA']}
              style={styles.trendCard}
            >
              <View style={styles.trendHeader}>
                {data.trend <= 0 ? (
                  <TrendingDown size={22} color="#059669" />
                ) : (
                  <TrendingUp size={22} color="#EA580C" />
                )}
                <Text style={[styles.trendLabel, { color: data.trend <= 0 ? '#059669' : '#EA580C' }]}>
                  {data.trendLabel}
                </Text>
              </View>
              <Text style={styles.trendValue}>
                {data.totalEmissions} kg CO₂
              </Text>
              <Text style={[styles.trendSubtext, { color: data.trend <= 0 ? '#065F46' : '#9A3412' }]}>
                Total emissions over {data.timeline?.length || 0} periods
              </Text>
            </LinearGradient>

            {/* Timeline Bar Chart */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <BarChart3 size={18} color={Colors.primary} />
                <Text style={styles.cardTitle}>Emissions Timeline</Text>
              </View>

              <View style={styles.barChart}>
                {data.timeline?.map((item: any, index: number) => {
                  const barHeight = maxEmission > 0
                    ? Math.max(4, (item.emissions / maxEmission) * 120)
                    : 4;
                  const offsetHeight = maxEmission > 0
                    ? Math.max(0, (item.offsets / maxEmission) * 120)
                    : 0;

                  return (
                    <View key={index} style={styles.barGroup}>
                      <Text style={styles.barValue}>
                        {item.net > 0 ? item.net.toFixed(1) : item.emissions.toFixed(1)}
                      </Text>
                      <View style={styles.barStack}>
                        {offsetHeight > 0 && (
                          <View
                            style={[styles.barOffset, { height: offsetHeight }]}
                          />
                        )}
                        <View
                          style={[
                            styles.bar,
                            {
                              height: barHeight,
                              backgroundColor: item.net <= 0 ? '#10B981' : '#F59E0B',
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.barLabel} numberOfLines={1}>{item.label}</Text>
                    </View>
                  );
                })}
              </View>

              <View style={styles.barLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
                  <Text style={styles.legendText}>Emissions</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                  <Text style={styles.legendText}>Offsets</Text>
                </View>
              </View>
            </View>

            {/* Category Breakdown */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <PieChart size={18} color="#6A1B9A" />
                <Text style={styles.cardTitle}>Category Breakdown</Text>
              </View>

              {data.categoryBreakdown?.map((cat: any) => (
                <View key={cat.category} style={styles.categoryRow}>
                  <Text style={styles.categoryIcon}>
                    {CATEGORY_ICONS[cat.category] || '📊'}
                  </Text>
                  <View style={styles.categoryInfo}>
                    <View style={styles.categoryLabelRow}>
                      <Text style={styles.categoryName}>
                        {cat.category.charAt(0).toUpperCase() + cat.category.slice(1)}
                      </Text>
                      <Text style={styles.categoryValue}>
                        {cat.total} kg ({cat.percentage}%)
                      </Text>
                    </View>
                    <View style={styles.categoryBarBg}>
                      <View
                        style={[
                          styles.categoryBarFill,
                          {
                            width: `${Math.max(2, cat.percentage)}%`,
                            backgroundColor: CATEGORY_COLORS[cat.category] || Colors.primary,
                          },
                        ]}
                      />
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* Summary Stats */}
            <View style={styles.summaryRow}>
              <View style={styles.summaryBox}>
                <Text style={styles.summaryValue}>{data.totalLogs}</Text>
                <Text style={styles.summaryLabel}>Activities</Text>
              </View>
              <View style={styles.summaryBox}>
                <Text style={styles.summaryValue}>{data.totalEmissions}</Text>
                <Text style={styles.summaryLabel}>kg CO₂</Text>
              </View>
              <View style={styles.summaryBox}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {data.trend < 0 ? (
                    <ArrowDown size={14} color="#10B981" />
                  ) : data.trend > 0 ? (
                    <ArrowUp size={14} color="#EF4444" />
                  ) : (
                    <Minus size={14} color={Colors.textSecondary} />
                  )}
                  <Text style={[styles.summaryValue, {
                    color: data.trend < 0 ? '#10B981' : data.trend > 0 ? '#EF4444' : Colors.text,
                  }]}>
                    {Math.abs(data.trend)}%
                  </Text>
                </View>
                <Text style={styles.summaryLabel}>Trend</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.text },
  content: { padding: 20, paddingBottom: 100 },

  // Period tabs
  periodTabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
    elevation: 1,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  periodTabActive: {
    backgroundColor: Colors.primary,
  },
  periodTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  periodTabTextActive: {
    color: '#fff',
    fontWeight: '700',
  },

  // Trend card
  trendCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
  },
  trendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  trendLabel: { fontSize: 14, fontWeight: '700' },
  trendValue: { fontSize: 32, fontWeight: '900', color: Colors.text },
  trendSubtext: { fontSize: 13, marginTop: 4 },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },

  // Bar chart
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 160,
    paddingTop: 20,
  },
  barGroup: {
    flex: 1,
    alignItems: 'center',
    maxWidth: 50,
  },
  barValue: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  barStack: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: 20,
    borderRadius: 4,
    minHeight: 4,
  },
  barOffset: {
    width: 20,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginBottom: 2,
  },
  barLabel: {
    fontSize: 9,
    color: Colors.textSecondary,
    marginTop: 6,
    fontWeight: '600',
    textAlign: 'center',
  },
  barLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },

  // Category breakdown
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryIcon: {
    fontSize: 20,
    marginRight: 14,
  },
  categoryInfo: { flex: 1 },
  categoryLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  categoryValue: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  categoryBarBg: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  categoryBarFill: {
    height: 8,
    borderRadius: 4,
  },

  // Summary row
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  summaryBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    elevation: 1,
  },
  summaryValue: { fontSize: 20, fontWeight: '800', color: Colors.text },
  summaryLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 4, fontWeight: '600' },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: Colors.text, marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
});
