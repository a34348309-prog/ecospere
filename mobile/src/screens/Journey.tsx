import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Text, Card, ProgressBar, Button } from "react-native-paper";
import { Colors } from "../theme/colors";
import {
  ChevronLeft,
  Trophy,
  Calendar,
  TreeDeciduous,
  Flame,
  TrendingDown,
  Award,
  ChevronRight,
  Target,
  MapPin,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "../store/useAuthStore";
import { getCalculatorStats } from "../services/auth.service";
import { getMyRank } from "../services/leaderboard.service";
import { getImpactLedger } from "../services/event.service";

export const Journey = ({ onBack }: any) => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [impactHistory, setImpactHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, rankRes, impactRes] = await Promise.all([
        getCalculatorStats(),
        getMyRank(),
        getImpactLedger(),
      ]);
      if (statsRes) setStats(statsRes);
      if (rankRes?.rank) setMyRank(rankRes.rank);
      if (impactRes?.data) setImpactHistory(impactRes.data);
    } catch (e) {
      console.log("Journey data error:", e);
    } finally {
      setLoading(false);
    }
  };

  const treesPlanted = user?.totalTreesPlanted ?? stats?.totalTreesPlanted ?? 0;
  const ecoScore = user?.ecoScore ?? stats?.ecoScore ?? 0;
  const carbonDebt = user?.carbonDebt ?? stats?.carbonDebt ?? 0;
  const level = user?.level ?? 1;

  // Derive rank percentile
  const rankPercentile =
    myRank && myRank <= 5
      ? `Top ${myRank * 5}%`
      : myRank
        ? `Rank #${myRank}`
        : "Unranked";

  // Goal progress: trees (how many vs a target of 200)
  const treeGoalTarget = 200;
  const treeGoalProgress = Math.min(1, treesPlanted / treeGoalTarget);

  // Goal: reduce carbon debt
  const carbonGoalProgress =
    carbonDebt > 0 ? Math.max(0, 1 - carbonDebt / 200) : 1;

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ marginTop: 16, color: Colors.textSecondary }}>
          Loading your journey...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ChevronLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Your Journey</Text>
          <Text style={styles.subtitle}>
            Track your environmental milestones
          </Text>
        </View>
      </View>

      {/* Impact Summary Plate */}
      <LinearGradient
        colors={[Colors.secondary, "#374151"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.impactCard}
      >
        <View style={styles.impactHeader}>
          <Text style={styles.impactTitle}>Global Impact</Text>
          <View style={styles.impactBadge}>
            <TrendingDown size={14} color="#fff" />
            <Text style={styles.impactBadgeText}>{rankPercentile}</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <ImpactStat
            icon={<TreeDeciduous size={24} color={Colors.primary} />}
            val={String(treesPlanted)}
            label="Trees"
          />
          <ImpactStat
            icon={<Calendar size={24} color="#0277BD" />}
            val={`Lv${level}`}
            label="Level"
          />
          <ImpactStat
            icon={<Flame size={24} color="#EF6C00" />}
            val={`${carbonDebt.toFixed(0)}`}
            label="CO₂ Debt"
          />
          <ImpactStat
            icon={<Trophy size={24} color="#FBC02D" />}
            val={
              ecoScore >= 1000
                ? `${(ecoScore / 1000).toFixed(1)}k`
                : String(ecoScore)
            }
            label="Score"
          />
        </View>
      </LinearGradient>

      {/* Goals Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Active Goals</Text>
        <TouchableOpacity
          onPress={() => Alert.alert("Goals", "Manage your eco-goals.")}
        >
          <Text style={styles.seeAll}>Manage</Text>
        </TouchableOpacity>
      </View>

      <GoalItem
        icon={<Target size={20} color={Colors.primary} />}
        title="Plant 200 Trees"
        desc={`${treesPlanted} of ${treeGoalTarget} trees planted`}
        progress={treeGoalProgress}
        status={`${treesPlanted}/${treeGoalTarget}`}
      />

      <GoalItem
        icon={<Calendar size={20} color="#0277BD" />}
        title="Carbon Neutral"
        desc={`Reduce carbon debt to 0 kg`}
        progress={carbonGoalProgress}
        status={`${carbonDebt.toFixed(0)} kg remaining`}
      />

      {/* Achievements */}
      <Text style={styles.sectionTitle}>Recent Achievements</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.achievementScroll}
      >
        {treesPlanted >= 1 && (
          <AchievementCard
            icon={<TreeDeciduous size={32} color={Colors.primary} />}
            title="First Tree"
            date="Unlocked"
          />
        )}
        {ecoScore >= 100 && (
          <AchievementCard
            icon={<Award size={32} color="#FBC02D" />}
            title="Eco Starter"
            date={`${ecoScore} pts`}
          />
        )}
        {level >= 5 && (
          <AchievementCard
            icon={<Flame size={32} color="#EF6C00" />}
            title={`Level ${level}`}
            date="Achieved"
          />
        )}
        {treesPlanted >= 100 && (
          <AchievementCard
            icon={<TreeDeciduous size={32} color="#009688" />}
            title="Century Club"
            date="100+ trees"
          />
        )}
        {ecoScore >= 500 && (
          <AchievementCard
            icon={<Trophy size={32} color="#FBC02D" />}
            title="Eco Warrior"
            date="500+ pts"
          />
        )}
        {treesPlanted === 0 && ecoScore === 0 && (
          <AchievementCard
            icon={<Target size={32} color="#94A3B8" />}
            title="Getting Started"
            date="Begin your journey!"
          />
        )}
      </ScrollView>

      {/* Impact History */}
      {impactHistory.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Impact History</Text>
          {impactHistory.slice(0, 5).map((item: any, index: number) => (
            <Card
              key={item.id || index}
              style={styles.impactHistoryCard}
              elevation={1}
            >
              <View style={styles.impactHistoryRow}>
                <View style={styles.impactHistoryIcon}>
                  <MapPin size={18} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.impactHistoryTitle}>
                    {item.plantationEvent?.title ||
                      item.eventTitle ||
                      "Plantation Event"}
                  </Text>
                  <Text style={styles.impactHistoryDate}>
                    {item.verifiedAt
                      ? new Date(item.verifiedAt).toLocaleDateString()
                      : item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString()
                        : ""}
                  </Text>
                </View>
                {(item.treesContributed ||
                  item.plantationEvent?.treesPlanted) && (
                  <View style={styles.impactHistoryBadge}>
                    <TreeDeciduous size={12} color="#4CAF50" />
                    <Text style={styles.impactHistoryBadgeText}>
                      {item.treesContributed ||
                        item.plantationEvent?.treesPlanted}
                    </Text>
                  </View>
                )}
              </View>
            </Card>
          ))}
        </>
      )}

      <Button
        mode="outlined"
        style={styles.shareBtn}
        textColor={Colors.text}
        icon="share-variant"
        onPress={() =>
          Alert.alert(
            "Share",
            `I've planted ${treesPlanted} trees and earned ${ecoScore} eco points on EcoSphere! 🌿`,
          )
        }
      >
        Share My Progress
      </Button>
    </ScrollView>
  );
};

const ImpactStat = ({ icon, val, label }: any) => (
  <View style={styles.statBox}>
    <View style={styles.statIconBg}>{icon}</View>
    <Text style={styles.statVal}>{val}</Text>
    <Text style={styles.statLab}>{label}</Text>
  </View>
);

const GoalItem = ({ icon, title, desc, progress, status }: any) => (
  <Card
    style={styles.goalCard}
    elevation={2}
    onPress={() => Alert.alert(title, desc)}
  >
    <View style={styles.goalHeader}>
      <View style={styles.goalIconBg}>{icon}</View>
      <View style={styles.goalTextContainer}>
        <Text style={styles.goalTitle}>{title}</Text>
        <Text style={styles.goalDesc}>{desc}</Text>
      </View>
      <ChevronRight size={18} color={Colors.textLight} />
    </View>
    <View style={styles.progressContainer}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressStatus}>{status}</Text>
        <Text style={styles.progressPercent}>
          {Math.round(progress * 100)}%
        </Text>
      </View>
      <ProgressBar
        progress={progress}
        color={Colors.primary}
        style={styles.progressBar}
      />
    </View>
  </Card>
);

const AchievementCard = ({ icon, title, date }: any) => (
  <Card style={styles.achievementCard} elevation={2}>
    <View style={styles.achievementIconBg}>{icon}</View>
    <Text style={styles.achievementTitle}>{title}</Text>
    <Text style={styles.achievementDate}>{date}</Text>
  </Card>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 60 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
    marginTop: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
  },
  headerText: { flex: 1, marginLeft: 15 },
  title: { fontSize: 24, fontWeight: "900", color: Colors.text },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },

  impactCard: { borderRadius: 28, padding: 24, marginBottom: 35 },
  impactHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },
  impactTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
  impactBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  impactBadgeText: { fontSize: 11, fontWeight: "800", color: "#fff" },
  statsGrid: { flexDirection: "row", justifyContent: "space-between" },
  statBox: { alignItems: "center" },
  statIconBg: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  statVal: { fontSize: 18, fontWeight: "900", color: "#fff" },
  statLab: { fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 2 },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.text,
    marginVertical: 10,
  },
  seeAll: { fontSize: 13, color: Colors.primaryLight, fontWeight: "700" },

  goalCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F0F2F5",
  },
  goalHeader: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  goalIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F8FAF5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  goalTextContainer: { flex: 1 },
  goalTitle: { fontSize: 16, fontWeight: "800", color: Colors.text },
  goalDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  progressContainer: { marginTop: 5 },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressStatus: { fontSize: 12, fontWeight: "700", color: Colors.text },
  progressPercent: { fontSize: 12, fontWeight: "800", color: Colors.primary },
  progressBar: { height: 8, borderRadius: 4, backgroundColor: "#F0F2F5" },

  achievementScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  achievementCard: {
    width: 130,
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 16,
    marginRight: 15,
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F0F2F5",
  },
  achievementIconBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#F8FAF5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  achievementTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.text,
    textAlign: "center",
  },
  achievementDate: { fontSize: 11, color: Colors.textSecondary, marginTop: 4 },

  shareBtn: {
    marginTop: 20,
    borderRadius: 16,
    paddingVertical: 5,
    borderColor: "#F0F2F5",
  },

  impactHistoryCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F0F2F5",
  },
  impactHistoryRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  impactHistoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F0FFF4",
    justifyContent: "center",
    alignItems: "center",
  },
  impactHistoryTitle: { fontSize: 14, fontWeight: "700", color: Colors.text },
  impactHistoryDate: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  impactHistoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  impactHistoryBadgeText: { fontSize: 12, fontWeight: "800", color: "#4CAF50" },
});
