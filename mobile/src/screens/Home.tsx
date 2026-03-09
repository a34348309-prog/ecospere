import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Text, Card } from "react-native-paper";
import { Colors } from "../theme/colors";
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
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "../store/useAuthStore";
import { getCalculatorStats } from "../services/auth.service";
import { getAQIForecast } from "../services/aqi.service";
import { getStreak, getChallenges, getInsightsData } from "../services/activity.service";
import * as Location from "expo-location";

export const Home = ({ onNavigate }: any) => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [forecast, setForecast] = useState<any[]>([]);
  const [forecastLoading, setForecastLoading] = useState(true);
  const [streak, setStreak] = useState<{ currentStreak: number; longestStreak: number; isActiveToday: boolean }>({ currentStreak: 0, longestStreak: 0, isActiveToday: false });
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
      console.log("Streak fetch error:", e);
    }
  };

  const fetchChallenges = async () => {
    try {
      const data = await getChallenges();
      if (data) setChallenges(data);
    } catch (e) {
      console.log("Challenges fetch error:", e);
    }
  };

  const fetchInsights = async () => {
    try {
      const data = await getInsightsData();
      if (data) setInsights(data);
    } catch (e) {
      console.log("Insights fetch error:", e);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await getCalculatorStats();
      if (data) setStats(data);
    } catch (e) {
      console.log("Stats fetch error:", e);
    }
  };

  const fetchForecast = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      let lat = 42.3601,
        lng = -71.0589; // default Boston
      if (status === "granted") {
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
          const day = new Date(item.dt * 1000).toLocaleDateString("en-US", {
            weekday: "short",
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
      console.log("Forecast error:", e);
    } finally {
      setForecastLoading(false);
    }
  };

  const treesPlanted = user?.totalTreesPlanted ?? stats?.totalTreesPlanted ?? 0;
  const oxygenKg = user?.oxygenContribution ?? stats?.oxygenContribution ?? 0;
  const co2Reduced = (oxygenKg / 1000).toFixed(1);
  const ecoScore = user?.ecoScore ?? stats?.ecoScore ?? 0;
  const level = user?.level ?? 1;

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
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Area */}
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.greeting}>
            Welcome back, {user?.name?.split(" ")[0] || "Eco Warrior"}!
          </Text>
          <Text style={styles.tagline}>Let's make today count 🌿</Text>
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
      <LinearGradient colors={["#E0F2F1", "#E0F2F1"]} style={styles.levelCard}>
        <View style={styles.levelHeader}>
          <View style={styles.levelTitleRow}>
            <Trophy size={18} color={Colors.primary} />
            <Text style={styles.levelTitle}>Level {level}</Text>
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
      </LinearGradient>

      {/* Oxygen Contribution Card */}
      <LinearGradient colors={["#E0F7FA", "#E0F7FA"]} style={styles.oxygenCard}>
        <View style={styles.oxygenHeader}>
          <Leaf size={20} color={Colors.primary} />
          <Text style={styles.oxygenTitle}>Oxygen Contribution</Text>
        </View>
        <Text style={styles.oxygenSubtitle}>
          Your positive impact on the environment
        </Text>

        <Text style={styles.oxygenPercent}>{oxygenPercent}%</Text>
        <Text style={styles.oxygenNote}>
          Trees planted contribute to cleaner air
        </Text>

        <View style={styles.oxygenStatsRow}>
          <View style={styles.oxygenStatItem}>
            <Text style={styles.oxygenStatValue}>{treesPlanted}</Text>
            <Text style={styles.oxygenStatLabel}>Trees Planted</Text>
          </View>
          <View style={styles.oxygenDivider} />
          <View style={styles.oxygenStatItem}>
            <Text style={styles.oxygenStatValue}>{co2Reduced}t</Text>
            <Text style={styles.oxygenStatLabel}>CO₂ Reduced</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Weekly Eco-Challenges */}
      <LinearGradient
        colors={["#E1F5FE", "#E1F5FE"]}
        style={styles.challengeCard}
      >
        <View style={styles.challengeHeader}>
          <View style={styles.challengeTitleRow}>
            <Zap size={20} color="#0288D1" />
            <Text style={styles.challengeTitle}>Weekly Challenges</Text>
          </View>
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>
              {streak.currentStreak > 0
                ? `🔥 ${streak.currentStreak}-day streak`
                : `Eco Score: ${ecoScore}`}
            </Text>
          </View>
        </View>

        {challenges.length > 0 ? (
          challenges.map((ch: any, index: number) => {
            const progress = ch.targetValue > 0 ? Math.min(ch.currentValue / ch.targetValue, 1) : 0;
            return (
              <ChallengeItem
                key={ch.id || index}
                num={ch.icon || String(index + 1)}
                title={ch.title}
                desc={ch.isCompleted ? "✅ Completed!" : `${ch.currentValue}/${ch.targetValue} — ${ch.description}`}
                xp={`+${ch.xpReward} XP`}
                progress={progress}
                isCompleted={ch.isCompleted}
              />
            );
          })
        ) : (
          <>
            <ChallengeItem
              num="1"
              title="Loading challenges..."
              desc="Your personalized challenges will appear here"
              xp=""
            />
          </>
        )}
      </LinearGradient>

      {/* AQI Forecast */}
      <Card style={styles.forecastCard} elevation={0}>
        <View style={styles.forecastHeader}>
          <Wind size={18} color="#0288D1" />
          <Text style={styles.forecastTitle}>4-Day AQI Forecast</Text>
        </View>
        {forecastLoading ? (
          <ActivityIndicator
            size="small"
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
                  ? "#4CAF50"
                  : item.aqi <= 100
                    ? "#FF9800"
                    : item.aqi <= 150
                      ? "#FF5722"
                      : "#F44336";
              const label =
                item.aqi <= 50
                  ? "Good"
                  : item.aqi <= 100
                    ? "Moderate"
                    : item.aqi <= 150
                      ? "Unhealthy"
                      : "Poor";
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
      </Card>

      {/* You vs Average — Insights Card */}
      {insights && insights.totalLogs > 0 && (
        <Card style={styles.insightsCard} elevation={0}>
          <View style={styles.insightsHeader}>
            <TrendingUp size={18} color="#6A1B9A" />
            <Text style={styles.insightsTitle}>You vs. Average</Text>
            <View style={[styles.insightsPercentile, { backgroundColor: insights.isBetter ? '#E8F5E9' : '#FFF3E0' }]}>
              <Text style={[styles.insightsPercentileText, { color: insights.isBetter ? '#2E7D32' : '#E65100' }]}>
                Top {100 - insights.percentile}%
              </Text>
            </View>
          </View>

          {/* Overall comparison bar */}
          <View style={styles.insightsOverall}>
            <View style={styles.insightsBarContainer}>
              <Text style={styles.insightsBarLabel}>You</Text>
              <View style={styles.insightsBarBg}>
                <View style={[styles.insightsBarFill, {
                  width: `${Math.min(100, Math.round((insights.userWeeklyCarbon / insights.nationalAvgWeekly) * 100))}%`,
                  backgroundColor: insights.isBetter ? '#4CAF50' : '#FF9800',
                }]} />
              </View>
              <Text style={styles.insightsBarValue}>{insights.userWeeklyCarbon} kg</Text>
            </View>
            <View style={styles.insightsBarContainer}>
              <Text style={styles.insightsBarLabel}>Avg</Text>
              <View style={styles.insightsBarBg}>
                <View style={[styles.insightsBarFill, {
                  width: '100%',
                  backgroundColor: '#B0BEC5',
                }]} />
              </View>
              <Text style={styles.insightsBarValue}>{insights.nationalAvgWeekly} kg</Text>
            </View>
          </View>

          <Text style={[styles.insightsVerdict, { color: insights.isBetter ? '#2E7D32' : '#E65100' }]}>
            {insights.isBetter
              ? `🎉 You're ${Math.abs(insights.percentBetter)}% below the national average!`
              : `📊 ${Math.abs(insights.percentBetter)}% above average — keep improving!`}
          </Text>

          {/* All-Green Badge: below average in EVERY category */}
          {insights.categories?.length > 0 && insights.categories.every((c: any) => c.isBetter) && (
            <View style={{
              marginTop: 12, backgroundColor: '#E8F5E9', borderRadius: 14,
              paddingVertical: 10, paddingHorizontal: 16, alignItems: 'center',
              borderWidth: 1.5, borderColor: '#A5D6A7',
            }}>
              <Text style={{ fontSize: 13, fontWeight: '900', color: '#1B5E20' }}>
                🌟 All-Green Champion — below average in every category!
              </Text>
            </View>
          )}
        </Card>
      )}

      {/* Quick Actions Grid */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickGrid}>
        <QuickAction
          icon={<TreeDeciduous size={24} color={Colors.primary} />}
          label="Calculate Trees"
          onPress={() => onNavigate("calculator")}
        />
        <QuickAction
          icon={<Calendar size={24} color={Colors.primary} />}
          label="Join Event"
          onPress={() => onNavigate("events")}
        />
        <QuickAction
          icon={<MapIcon size={24} color="#0288D1" />}
          label="Explore Map"
          onPress={() => onNavigate("map")}
        />
        <QuickAction
          icon={<TrendingUp size={24} color={Colors.primary} />}
          label="Leaderboard"
          onPress={() => onNavigate("leaderboard")}
        />
        <QuickAction
          icon={<Leaf size={24} color="#4CAF50" />}
          label="Eco Tracker"
          onPress={() => onNavigate("ecoTracker")}
        />
        <QuickAction
          icon={<Target size={24} color="#00897B" />}
          label="Eco Plan"
          onPress={() => onNavigate("ecoPlan")}
        />
      </View>

      {/* Eco Stats Summary */}
      <Text style={styles.sectionTitle}>Your Eco Stats</Text>
      <Card style={styles.activityCard} elevation={0}>
        <ActivityItem
          icon={<TreeDeciduous size={20} color={Colors.primary} />}
          iconBg="#E8F5E9"
          title={`${treesPlanted} trees planted lifetime`}
          time={`${oxygenKg.toFixed(0)} kg oxygen contributed`}
        />
        <ActivityItem
          icon={<Trophy size={20} color="#0288D1" />}
          iconBg="#E1F5FE"
          title={`Eco Score: ${ecoScore}`}
          time={`Level ${level} eco warrior`}
        />
        <ActivityItem
          icon={<Calendar size={20} color="#009688" />}
          iconBg="#E0F2F1"
          title={`Carbon Debt: ${(user?.carbonDebt ?? 0).toFixed(1)} kg`}
          time={`${user?.treesToOffset ?? 0} trees needed to offset`}
        />
      </Card>
    </ScrollView>
  );
};

const ChallengeItem = ({ num, title, desc, xp, progress, isCompleted }: any) => (
  <View style={[styles.challengeItem, isCompleted && { opacity: 0.6 }]}>
    <View style={[styles.challengeNumCircle, isCompleted && { backgroundColor: "#C8E6C9" }]}>
      <Text style={styles.challengeNum}>{typeof num === 'string' && num.length > 2 ? num : num}</Text>
    </View>
    <View style={styles.challengeInfo}>
      <Text style={[styles.challengeItemTitle, isCompleted && { textDecorationLine: "line-through" }]}>{title}</Text>
      <Text style={styles.challengeItemDesc}>{desc}</Text>
      {progress !== undefined && progress > 0 && !isCompleted && (
        <View style={{ height: 4, backgroundColor: "#E0E0E0", borderRadius: 2, marginTop: 6 }}>
          <View style={{ height: 4, backgroundColor: "#0288D1", borderRadius: 2, width: `${Math.round(progress * 100)}%` }} />
        </View>
      )}
    </View>
    {xp ? (
      <View style={[styles.xpBadge, isCompleted && { borderColor: "#4CAF50", backgroundColor: "#E8F5E9" }]}>
        <Text style={[styles.xpText, isCompleted && { color: "#4CAF50" }]}>{isCompleted ? "✓" : xp}</Text>
      </View>
    ) : null}
  </View>
);

const QuickAction = ({ icon, label, onPress }: any) => (
  <TouchableOpacity style={styles.quickActionCard} onPress={onPress}>
    <View style={styles.quickActionIcon}>{icon}</View>
    <Text style={styles.quickActionLabel}>{label}</Text>
  </TouchableOpacity>
);

const ActivityItem = ({ icon, iconBg, title, time }: any) => (
  <View style={styles.activityItem}>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  headerTextContainer: { flex: 1 },
  greeting: { fontSize: 22, fontWeight: "800", color: "#0F172A" },
  tagline: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  levelBadgeCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
  levelBadgeText: { color: "#fff", fontSize: 18, fontWeight: "800" },

  streakBadgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#FFE0B2",
    gap: 2,
  },
  streakFireEmoji: { fontSize: 16 },
  streakCount: { fontSize: 16, fontWeight: "900", color: "#E65100" },

  levelCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#B2DFDB",
  },
  levelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  levelTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  levelTitle: { fontSize: 14, fontWeight: "700", color: "#004D40" },
  levelXp: { fontSize: 12, color: "#00695C", fontWeight: "500" },
  progressBarBg: {
    height: 8,
    backgroundColor: "#fff",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: { height: "100%", borderRadius: 4 },

  oxygenCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#B3E5FC",
    alignItems: "center",
  },
  oxygenHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  oxygenTitle: { fontSize: 16, fontWeight: "800", color: "#006064" },
  oxygenSubtitle: {
    fontSize: 13,
    color: "#455A64",
    textAlign: "center",
    marginBottom: 20,
  },
  oxygenPercent: {
    fontSize: 56,
    fontWeight: "900",
    color: Colors.primary,
    lineHeight: 60,
  },
  oxygenNote: {
    fontSize: 13,
    color: "#455A64",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  oxygenStatsRow: { flexDirection: "row", alignItems: "center", width: "100%" },
  oxygenStatItem: { flex: 1, alignItems: "center" },
  oxygenDivider: { width: 1, height: 40, backgroundColor: "#B0BEC5" },
  oxygenStatValue: { fontSize: 20, fontWeight: "800", color: Colors.primary },
  oxygenStatLabel: { fontSize: 12, color: "#546E7A", marginTop: 4 },

  challengeCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: "#B3E5FC",
  },
  challengeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  challengeTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  challengeTitle: { fontSize: 16, fontWeight: "800", color: "#01579B" },
  streakBadge: {
    backgroundColor: "#B3E5FC",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  streakText: { fontSize: 11, fontWeight: "700", color: "#0277BD" },
  challengeItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  challengeNumCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#B3E5FC",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  challengeNum: { fontSize: 13, fontWeight: "800", color: "#0277BD" },
  challengeInfo: { flex: 1 },
  challengeItemTitle: { fontSize: 14, fontWeight: "700", color: "#01579B" },
  challengeItemDesc: { fontSize: 12, color: "#455A64", marginTop: 2 },
  xpBadge: {
    backgroundColor: "#fff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  xpText: { fontSize: 10, fontWeight: "800", color: Colors.primary },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 16,
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 30,
  },
  quickActionCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    elevation: 1,
  },
  quickActionIcon: { marginBottom: 12 },
  quickActionLabel: { fontSize: 13, fontWeight: "700", color: "#334155" },

  activityCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  activityIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  activityInfo: { flex: 1 },
  activityTitle: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  activityTime: { fontSize: 12, color: "#64748B", marginTop: 2 },

  forecastCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  forecastHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  forecastTitle: { fontSize: 16, fontWeight: "800", color: "#01579B" },
  forecastEmpty: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
    padding: 12,
  },
  forecastRow: { flexDirection: "row", justifyContent: "space-around" },
  forecastDay: { alignItems: "center", gap: 6 },
  forecastDayLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  forecastBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  forecastAqi: { fontSize: 16, fontWeight: "900", color: "#fff" },
  forecastStatus: { fontSize: 10, fontWeight: "700" },

  // Insights Card
  insightsCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  insightsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  insightsTitle: { fontSize: 16, fontWeight: "800", color: "#4A148C", flex: 1 },
  insightsPercentile: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  insightsPercentileText: { fontSize: 11, fontWeight: "800" },
  insightsOverall: { gap: 10, marginBottom: 14 },
  insightsBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  insightsBarLabel: { fontSize: 12, fontWeight: "700", color: "#546E7A", width: 30 },
  insightsBarBg: {
    flex: 1,
    height: 12,
    backgroundColor: "#F0F2F5",
    borderRadius: 6,
    overflow: "hidden",
  },
  insightsBarFill: { height: 12, borderRadius: 6 },
  insightsBarValue: { fontSize: 12, fontWeight: "800", color: "#263238", width: 55, textAlign: "right" },
  insightsVerdict: { fontSize: 13, fontWeight: "700", textAlign: "center" },
});
