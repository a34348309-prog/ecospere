import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Text } from 'react-native-paper';
import { Colors, getColors } from '../theme/colors';
import {
  TreeDeciduous,
  Leaf,
  Zap,
  Trophy,
  Calendar,
  Map as MapIcon,
  TrendingUp,
  Wind,
  Target,
  BarChart3,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { getCalculatorStats } from '../services/auth.service';
import { getAQIForecast } from '../services/aqi.service';
import {
  getStreak,
  getChallenges,
  getInsightsData,
} from '../services/activity.service';
import * as Location from 'expo-location';

export const Home = ({ onNavigate }: any) => {
  const { user } = useAuthStore();
  const { isDarkMode } = useThemeStore();
  const theme = getColors(isDarkMode);
  const [stats, setStats] = useState<any>(null);
  const [forecast, setForecast] = useState<any[]>([]);
  const [forecastLoading, setForecastLoading] = useState(true);
  const [streak, setStreak] = useState<{
    currentStreak: number;
    longestStreak: number;
    isActiveToday: boolean;
  }>({ currentStreak: 0, longestStreak: 0, isActiveToday: false });
  const [challenges, setChallenges] = useState<any[]>([]);
  const [insights, setInsights] = useState<any>(null);

  useEffect(() => {
    fetchStats();
    fetchForecast();
    fetchStreak();
    fetchChallenges();
    fetchInsights();
  }, []);

  const fetchStreak = async () => {
    try {
      const data = await getStreak();
      if (data) setStreak(data);
    } catch (e) {
      console.log('Streak fetch error:', e);
    }
  };

  const fetchChallenges = async () => {
    try {
      const data = await getChallenges();
      if (data) setChallenges(data);
    } catch (e) {
      console.log('Challenges fetch error:', e);
    }
  };

  const fetchInsights = async () => {
    try {
      const data = await getInsightsData();
      if (data) setInsights(data);
    } catch (e) {
      console.log('Insights fetch error:', e);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await getCalculatorStats();
      if (data) setStats(data);
    } catch (e) {
      console.log('Stats fetch error:', e);
    }
  };

  const fetchForecast = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      let lat = 42.3601,
        lng = -71.0589; // default Boston
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        lat = loc.coords.latitude;
        lng = loc.coords.longitude;
      }
      const result = await getAQIForecast(lat, lng);
      if (result && result.length > 0) {
        // Group by day and average
        const byDay: Record<string, number[]> = {};
        result.forEach((item: any) => {
          const day = new Date(item.dt * 1000).toLocaleDateString('en-US', {
            weekday: 'short',
          });
          if (!byDay[day]) byDay[day] = [];
          byDay[day].push(item.aqiValue || 0);
        });
        const daily = Object.entries(byDay)
          .slice(0, 4)
          .map(([day, values]) => ({
            day,
            aqi: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
          }));
        setForecast(daily);
      }
    } catch (e) {
      console.log('Forecast error:', e);
    } finally {
      setForecastLoading(false);
    }
  };

  const treesPlanted = stats?.totalTreesPlanted ?? user?.totalTreesPlanted ?? 0;
  const oxygenKg = stats?.oxygenContribution ?? user?.oxygenContribution ?? 0;
  const co2Reduced = (oxygenKg / 1000).toFixed(1);
  const ecoScore = stats?.ecoScore ?? user?.ecoScore ?? 0;
  const level = stats?.level ?? user?.level ?? 1;

  // XP approximation: ecoScore maps to level progress
  const xpCurrent = ecoScore % 500;
  const xpMax = 500;
  const progressPercent = xpMax > 0 ? Math.round((xpCurrent / xpMax) * 100) : 0;
  const oxygenPercent =
    treesPlanted > 0
      ? Math.min(100, Math.round((treesPlanted / 200) * 100))
      : 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Area */}
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={[styles.greeting, { color: theme.text }]}>
            Welcome back, {user?.name?.split(' ')[0] || 'Eco Warrior'}!
          </Text>
          <Text style={[styles.tagline, { color: theme.textSecondary }]}>Let's make today count 🌿</Text>
        </View>
        {/* Streak Badge */}
        {streak.currentStreak > 0 && (
          <View style={styles.streakBadgeContainer}>
            <Text style={styles.streakFireEmoji}>🔥</Text>
            <Text style={styles.streakCount}>{streak.currentStreak}</Text>
          </View>
        )}
        <View style={styles.levelBadgeCircle}>
          <Text style={styles.levelBadgeText}>{level}</Text>
        </View>
      </View>

      {/* Level Progress Card */}
      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <View style={styles.levelHeader}>
          <View style={styles.levelTitleRow}>
            <View style={styles.accentIconBg}>
              <Trophy size={16} color={Colors.primary} />
            </View>
            <Text style={[styles.cardLabel, { color: theme.text }]}>Level {level}</Text>
          </View>
          <Text style={styles.levelXp}>
            {xpCurrent} / {xpMax} XP
          </Text>
        </View>
        <View style={styles.progressBarBg}>
          <LinearGradient
            colors={[Colors.primary, Colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.progressBarFill,
              { width: `${Math.max(5, progressPercent)}%` },
            ]}
          />
        </View>
      </View>

      {/* Impact Stats Row — compact horizontal */}
      <View style={[styles.statsRow, { backgroundColor: theme.card }]}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{oxygenPercent}%</Text>
          <Text style={styles.statLabel}>O₂ Impact</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{treesPlanted}</Text>
          <Text style={styles.statLabel}>Trees Planted</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{co2Reduced}t</Text>
          <Text style={styles.statLabel}>CO₂ Reduced</Text>
        </View>
      </View>

      {/* Weekly Eco-Challenges */}
      <View style={[styles.card, styles.challengeCard, { backgroundColor: theme.card }]}>
        <View style={styles.challengeHeader}>
          <View style={styles.challengeTitleRow}>
            <Zap size={18} color='#0288D1' />
            <Text style={styles.cardLabel}>Weekly Challenges</Text>
          </View>
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>
              {streak.currentStreak > 0
                ? `🔥 ${streak.currentStreak}-day streak`
                : `Score: ${ecoScore}`}
            </Text>
          </View>
        </View>

        {challenges.length > 0 ? (
          challenges.map((ch: any, index: number) => {
            const progress =
              ch.targetValue > 0
                ? Math.min(ch.currentValue / ch.targetValue, 1)
                : 0;
            return (
              <ChallengeItem
                key={ch.id || index}
                num={ch.icon || String(index + 1)}
                title={ch.title}
                desc={
                  ch.isCompleted
                    ? '✅ Completed!'
                    : `${ch.currentValue}/${ch.targetValue} — ${ch.description}`
                }
                xp={`+${ch.xpReward} XP`}
                progress={progress}
                isCompleted={ch.isCompleted}
              />
            );
          })
        ) : (
          <ChallengeItem
            num='1'
            title='Loading challenges...'
            desc='Your personalized challenges will appear here'
            xp=''
          />
        )}
      </View>

      {/* AQI Forecast */}
      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <View style={styles.forecastHeader}>
          <Wind size={18} color='#0288D1' />
          <Text style={styles.cardLabel}>4-Day AQI Forecast</Text>
        </View>
        {forecastLoading ? (
          <ActivityIndicator
            size='small'
            color={Colors.primary}
            style={{ padding: 16 }}
          />
        ) : forecast.length === 0 ? (
          <Text style={styles.forecastEmpty}>Forecast unavailable</Text>
        ) : (
          <View style={styles.forecastRow}>
            {forecast.map((item, i) => {
              const color =
                item.aqi <= 50
                  ? '#4CAF50'
                  : item.aqi <= 100
                    ? '#FF9800'
                    : item.aqi <= 150
                      ? '#FF5722'
                      : '#F44336';
              const label =
                item.aqi <= 50
                  ? 'Good'
                  : item.aqi <= 100
                    ? 'Moderate'
                    : item.aqi <= 150
                      ? 'Unhealthy'
                      : 'Poor';
              return (
                <View key={i} style={styles.forecastDay}>
                  <Text style={styles.forecastDayLabel}>{item.day}</Text>
                  <View
                    style={[styles.forecastBadge, { backgroundColor: color }]}
                  >
                    <Text style={styles.forecastAqi}>{item.aqi}</Text>
                  </View>
                  <Text style={[styles.forecastStatus, { color }]}>
                    {label}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* You vs Average — Insights Card */}
      {insights && insights.totalLogs > 0 && (
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <View style={styles.insightsHeader}>
            <TrendingUp size={18} color='#6A1B9A' />
            <Text style={[styles.cardLabel, { flex: 1 }]}>You vs. Average</Text>
            <View
              style={[
                styles.insightsPercentile,
                { backgroundColor: insights.isBetter ? '#F0FDF4' : '#FFF7ED' },
              ]}
            >
              <Text
                style={[
                  styles.insightsPercentileText,
                  { color: insights.isBetter ? '#16A34A' : '#EA580C' },
                ]}
              >
                Top {100 - insights.percentile}%
              </Text>
            </View>
          </View>

          <View style={styles.insightsOverall}>
            <View style={styles.insightsBarContainer}>
              <Text style={styles.insightsBarLabel}>You</Text>
              <View style={styles.insightsBarBg}>
                <View
                  style={[
                    styles.insightsBarFill,
                    {
                      width: `${Math.min(100, Math.round((insights.userWeeklyCarbon / insights.nationalAvgWeekly) * 100))}%`,
                      backgroundColor: insights.isBetter
                        ? '#10B981'
                        : '#F59E0B',
                    },
                  ]}
                />
              </View>
              <Text style={styles.insightsBarValue}>
                {insights.userWeeklyCarbon} kg
              </Text>
            </View>
            <View style={styles.insightsBarContainer}>
              <Text style={styles.insightsBarLabel}>Avg</Text>
              <View style={styles.insightsBarBg}>
                <View
                  style={[
                    styles.insightsBarFill,
                    {
                      width: '100%',
                      backgroundColor: '#CBD5E1',
                    },
                  ]}
                />
              </View>
              <Text style={styles.insightsBarValue}>
                {insights.nationalAvgWeekly} kg
              </Text>
            </View>
          </View>

          <Text
            style={[
              styles.insightsVerdict,
              { color: insights.isBetter ? '#16A34A' : '#EA580C' },
            ]}
          >
            {insights.isBetter
              ? `🎉 You're ${Math.abs(insights.percentBetter)}% below the national average!`
              : `📊 ${Math.abs(insights.percentBetter)}% above average — keep improving!`}
          </Text>

          {insights.categories?.length > 0 &&
            insights.categories.every((c: any) => c.isBetter) && (
              <View
                style={{
                  marginTop: 12,
                  backgroundColor: '#F0FDF4',
                  borderRadius: 12,
                  paddingVertical: 8,
                  paddingHorizontal: 14,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{ fontSize: 12, fontWeight: '700', color: '#16A34A' }}
                >
                  🌟 All-Green Champion — below average in every category!
                </Text>
              </View>
            )}
        </View>
      )}

      {/* Quick Actions Grid */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Actions</Text>
      <View style={styles.quickGrid}>
        <QuickAction
          icon={<TreeDeciduous size={22} color={Colors.primary} />}
          label='Calculate Trees'
          onPress={() => onNavigate('calculator')}
        />
        <QuickAction
          icon={<Calendar size={22} color={Colors.primary} />}
          label='Join Event'
          onPress={() => onNavigate('events')}
        />
        <QuickAction
          icon={<MapIcon size={22} color='#0288D1' />}
          label='Explore Map'
          onPress={() => onNavigate('map')}
        />
        <QuickAction
          icon={<TrendingUp size={22} color={Colors.primary} />}
          label='Leaderboard'
          onPress={() => onNavigate('leaderboard')}
        />
        <QuickAction
          icon={<Leaf size={22} color='#4CAF50' />}
          label='Daily Tracker'
          onPress={() => onNavigate('ecoTracker')}
        />
        <QuickAction
          icon={<Target size={22} color='#00897B' />}
          label='Eco Plan'
          onPress={() => onNavigate('ecoPlan')}
        />
        <QuickAction
          icon={<BarChart3 size={22} color='#6A1B9A' />}
          label='Analytics'
          onPress={() => onNavigate('analytics')}
        />
      </View>

      {/* Eco Stats Summary */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Your Eco Stats</Text>
      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <ActivityItem
          icon={<TreeDeciduous size={18} color={Colors.primary} />}
          iconBg='#F0FDF4'
          title={`${treesPlanted} trees planted lifetime`}
          time={`${oxygenKg.toFixed(0)} kg oxygen contributed`}
        />
        <ActivityItem
          icon={<Trophy size={18} color='#0288D1' />}
          iconBg='#EFF6FF'
          title={`Eco Score: ${ecoScore}`}
          time={`Level ${level} eco warrior`}
        />
        <ActivityItem
          icon={<Calendar size={18} color='#009688' />}
          iconBg='#F0FDFA'
          title={`Carbon Debt: ${(user?.carbonDebt ?? 0).toFixed(1)} kg`}
          time={`${user?.treesToOffset ?? 0} trees needed to offset`}
          isLast
        />
      </View>
    </ScrollView>
  );
};

const ChallengeItem = ({
  num,
  title,
  desc,
  xp,
  progress,
  isCompleted,
}: any) => (
  <View style={[styles.challengeItem, isCompleted && { opacity: 0.5 }]}>
    <View
      style={[
        styles.challengeNumCircle,
        isCompleted && { backgroundColor: '#D1FAE5' },
      ]}
    >
      <Text style={styles.challengeNum}>
        {typeof num === 'string' && num.length > 2 ? num : num}
      </Text>
    </View>
    <View style={styles.challengeInfo}>
      <Text
        style={[
          styles.challengeItemTitle,
          isCompleted && { textDecorationLine: 'line-through' },
        ]}
      >
        {title}
      </Text>
      <Text style={styles.challengeItemDesc}>{desc}</Text>
      {progress !== undefined && progress > 0 && !isCompleted && (
        <View
          style={{
            height: 3,
            backgroundColor: '#E5E7EB',
            borderRadius: 2,
            marginTop: 6,
          }}
        >
          <View
            style={{
              height: 3,
              backgroundColor: '#0288D1',
              borderRadius: 2,
              width: `${Math.round(progress * 100)}%`,
            }}
          />
        </View>
      )}
    </View>
    {xp ? (
      <View
        style={[styles.xpBadge, isCompleted && { backgroundColor: '#F0FDF4' }]}
      >
        <Text style={[styles.xpText, isCompleted && { color: '#16A34A' }]}>
          {isCompleted ? '✓' : xp}
        </Text>
      </View>
    ) : null}
  </View>
);

const QuickAction = ({ icon, label, onPress, cardBg }: any) => (
  <TouchableOpacity style={[styles.quickActionCard, cardBg && { backgroundColor: cardBg }]} onPress={onPress}>
    <View style={styles.quickActionIcon}>{icon}</View>
    <Text style={styles.quickActionLabel}>{label}</Text>
  </TouchableOpacity>
);

const ActivityItem = ({ icon, iconBg, title, time, isLast }: any) => (
  <View style={[styles.activityItem, isLast && { marginBottom: 0 }]}>
    <View style={[styles.activityIconBg, { backgroundColor: iconBg }]}>
      {icon}
    </View>
    <View style={styles.activityInfo}>
      <Text style={styles.activityTitle}>{title}</Text>
      <Text style={styles.activityTime}>{time}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 100 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 24,
  },
  headerTextContainer: { flex: 1 },
  greeting: { fontSize: 22, fontWeight: '800', color: Colors.text },
  tagline: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  levelBadgeCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelBadgeText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  streakBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginRight: 10,
    gap: 3,
  },
  streakFireEmoji: { fontSize: 14 },
  streakCount: { fontSize: 15, fontWeight: '800', color: '#EA580C' },

  // Unified card base
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardLabel: { fontSize: 15, fontWeight: '700', color: Colors.text },

  // Small accent icon circle
  accentIconBg: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  // Level card
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  levelTitleRow: { flexDirection: 'row', alignItems: 'center' },
  levelXp: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  progressBarBg: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: { height: '100%', borderRadius: 3 },

  // Impact Stats Row (replaces old oxygen card)
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: Colors.primary },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 3,
    fontWeight: '600',
  },
  statDivider: { width: 1, height: 32, backgroundColor: '#E5E7EB' },

  // Challenge card — accent left border
  challengeCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#0288D1',
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  challengeTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  streakBadge: {
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  streakText: { fontSize: 11, fontWeight: '600', color: '#0369A1' },
  challengeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  challengeNumCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  challengeNum: { fontSize: 13, fontWeight: '700', color: '#0369A1' },
  challengeInfo: { flex: 1 },
  challengeItemTitle: { fontSize: 14, fontWeight: '600', color: Colors.text },
  challengeItemDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  xpBadge: {
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  xpText: { fontSize: 10, fontWeight: '700', color: '#0369A1' },

  // Section title
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 14,
    marginTop: 8,
  },

  // Quick Actions
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 28,
  },
  quickActionCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  quickActionIcon: { marginBottom: 10 },
  quickActionLabel: { fontSize: 13, fontWeight: '600', color: '#374151' },

  // Eco Stats
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  activityIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  activityInfo: { flex: 1 },
  activityTitle: { fontSize: 14, fontWeight: '600', color: Colors.text },
  activityTime: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },

  // AQI Forecast
  forecastHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  forecastEmpty: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    padding: 12,
  },
  forecastRow: { flexDirection: 'row', justifyContent: 'space-around' },
  forecastDay: { alignItems: 'center', gap: 6 },
  forecastDayLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  forecastBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  forecastAqi: { fontSize: 15, fontWeight: '800', color: '#fff' },
  forecastStatus: { fontSize: 10, fontWeight: '600' },

  // Insights
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  insightsPercentile: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  insightsPercentileText: { fontSize: 11, fontWeight: '700' },
  insightsOverall: { gap: 10, marginBottom: 14 },
  insightsBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  insightsBarLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    width: 30,
  },
  insightsBarBg: {
    flex: 1,
    height: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 5,
    overflow: 'hidden',
  },
  insightsBarFill: { height: 10, borderRadius: 5 },
  insightsBarValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
    width: 55,
    textAlign: 'right',
  },
  insightsVerdict: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
});
