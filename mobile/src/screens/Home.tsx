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
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "../store/useAuthStore";
import { getCalculatorStats } from "../services/auth.service";
import { getAQIForecast } from "../services/aqi.service";
import * as Location from "expo-location";

export const Home = ({ onNavigate }: any) => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [forecast, setForecast] = useState<any[]>([]);
  const [forecastLoading, setForecastLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchForecast();
  }, []);

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
          byDay[day].push(item.main?.aqi || 0);
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

      {/* Daily Eco-Challenge */}
      <LinearGradient
        colors={["#E1F5FE", "#E1F5FE"]}
        style={styles.challengeCard}
      >
        <View style={styles.challengeHeader}>
          <View style={styles.challengeTitleRow}>
            <Zap size={20} color="#0288D1" />
            <Text style={styles.challengeTitle}>Daily Eco-Challenge</Text>
          </View>
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>Eco Score: {ecoScore} 🔥</Text>
          </View>
        </View>

        <ChallengeItem
          num="1"
          title="Plant a virtual tree"
          desc="Complete the tree calculator challenge"
          xp="+50 XP"
        />
        <ChallengeItem
          num="2"
          title="Complete eco-quiz"
          desc="Test your environmental knowledge"
          xp="+30 XP"
        />
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
                item.aqi <= 1
                  ? "#4CAF50"
                  : item.aqi <= 2
                    ? "#FF9800"
                    : item.aqi <= 3
                      ? "#FF5722"
                      : "#F44336";
              const label =
                item.aqi <= 1
                  ? "Good"
                  : item.aqi <= 2
                    ? "Fair"
                    : item.aqi <= 3
                      ? "Moderate"
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

const ChallengeItem = ({ num, title, desc, xp }: any) => (
  <View style={styles.challengeItem}>
    <View style={styles.challengeNumCircle}>
      <Text style={styles.challengeNum}>{num}</Text>
    </View>
    <View style={styles.challengeInfo}>
      <Text style={styles.challengeItemTitle}>{title}</Text>
      <Text style={styles.challengeItemDesc}>{desc}</Text>
    </View>
    <View style={styles.xpBadge}>
      <Text style={styles.xpText}>{xp}</Text>
    </View>
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
});
