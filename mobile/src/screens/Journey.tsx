import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Text, ProgressBar } from "react-native-paper";
import { Colors } from "../theme/colors";
import {
  ChevronLeft,
  Trophy,
  Calendar,
  TreeDeciduous,
  Flame,
  Award,
  Target,
  MapPin,
  Sparkles,
  TrendingUp,
  Share2,
  Lock,
  Zap,
  Leaf,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "../store/useAuthStore";
import { getCalculatorStats } from "../services/auth.service";
import { getMyRank } from "../services/leaderboard.service";
import { getImpactLedger } from "../services/event.service";

// All possible achievements with thresholds
const ALL_ACHIEVEMENTS = [
  { id: 'first_tree', title: 'First Tree', icon: TreeDeciduous, color: Colors.primary, check: (t: number, s: number, l: number) => t >= 1, desc: 'Plant your first tree' },
  { id: 'eco_starter', title: 'Eco Starter', icon: Award, color: '#FBC02D', check: (t: number, s: number, l: number) => s >= 100, desc: 'Earn 100 eco points' },
  { id: 'eco_250', title: 'Rising Star', icon: Sparkles, color: '#7C3AED', check: (t: number, s: number, l: number) => s >= 250, desc: 'Earn 250 eco points' },
  { id: 'level_3', title: 'Level 3', icon: Zap, color: '#0288D1', check: (t: number, s: number, l: number) => l >= 3, desc: 'Reach level 3' },
  { id: 'fifty_trees', title: '50 Trees', icon: Leaf, color: '#009688', check: (t: number, s: number, l: number) => t >= 50, desc: 'Plant 50 trees' },
  { id: 'level_5', title: 'Level 5', icon: Flame, color: '#EF6C00', check: (t: number, s: number, l: number) => l >= 5, desc: 'Reach level 5' },
  { id: 'century_club', title: 'Century Club', icon: TreeDeciduous, color: '#2E7D32', check: (t: number, s: number, l: number) => t >= 100, desc: 'Plant 100 trees' },
  { id: 'eco_warrior', title: 'Eco Warrior', icon: Trophy, color: '#F59E0B', check: (t: number, s: number, l: number) => s >= 500, desc: 'Earn 500 eco points' },
];

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

  const rankPercentile =
    myRank && myRank <= 5
      ? `Top ${myRank * 5}%`
      : myRank
        ? `#${myRank}`
        : "—";

  // Goals
  const treeGoalTarget = 200;
  const treeGoalProgress = Math.min(1, treesPlanted / treeGoalTarget);
  const carbonGoalProgress =
    carbonDebt > 0 ? Math.max(0, 1 - carbonDebt / 200) : 1;

  // Achievements
  const achievements = ALL_ACHIEVEMENTS.map(a => ({
    ...a,
    achieved: a.check(treesPlanted, ecoScore, level),
  }));
  const achievedCount = achievements.filter(a => a.achieved).length;

  // Next milestone
  const nextMilestone = achievements.find(a => !a.achieved);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ marginTop: 16, color: Colors.textSecondary }}>
          Loading your journey...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ChevronLeft size={22} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Your Journey</Text>
          <Text style={styles.subtitle}>Track your environmental impact</Text>
        </View>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>Lv{level}</Text>
        </View>
      </View>

      {/* Next Milestone Card */}
      {nextMilestone && (
        <View style={styles.milestoneCard}>
          <View style={styles.milestoneLeft}>
            <View style={[styles.milestoneIconBg, { backgroundColor: `${nextMilestone.color}15` }]}>
              <Target size={18} color={nextMilestone.color} />
            </View>
            <View style={styles.milestoneTextWrap}>
              <Text style={styles.milestoneLabel}>Next Milestone</Text>
              <Text style={styles.milestoneTitle}>{nextMilestone.title}</Text>
              <Text style={styles.milestoneDesc}>{nextMilestone.desc}</Text>
            </View>
          </View>
          <View style={styles.milestoneProgress}>
            <Sparkles size={14} color="#F59E0B" />
          </View>
        </View>
      )}

      {/* Impact Summary — 2x2 Grid */}
      <LinearGradient
        colors={["#065F46", "#064E3B"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.impactCard}
      >
        <View style={styles.impactHeader}>
          <View>
            <Text style={styles.impactLabel}>Your Impact</Text>
            <Text style={styles.impactTitle}>Global Footprint</Text>
          </View>
          {myRank && (
            <View style={styles.impactRankBadge}>
              <TrendingUp size={12} color="#10B981" />
              <Text style={styles.impactRankText}>{rankPercentile}</Text>
            </View>
          )}
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <ImpactStat
              icon={<TreeDeciduous size={22} color="#34D399" />}
              val={String(treesPlanted)}
              label="Trees Planted"
            />
            <ImpactStat
              icon={<Trophy size={22} color="#FCD34D" />}
              val={ecoScore >= 1000 ? `${(ecoScore / 1000).toFixed(1)}k` : String(ecoScore)}
              label="Eco Score"
            />
          </View>
          <View style={styles.statsRow}>
            <ImpactStat
              icon={<Flame size={22} color="#FB923C" />}
              val={`${carbonDebt.toFixed(0)} kg`}
              label="Carbon Debt"
            />
            <ImpactStat
              icon={<Award size={22} color="#A78BFA" />}
              val={`${achievedCount}/${ALL_ACHIEVEMENTS.length}`}
              label="Badges Earned"
            />
          </View>
        </View>
      </LinearGradient>

      {/* Goals Section */}
      <Text style={styles.sectionTitle}>Active Goals</Text>

      <GoalItem
        icon={<TreeDeciduous size={20} color={Colors.primary} />}
        iconBg="#F0FDF4"
        title="Plant 200 Trees"
        desc={`${treesPlanted} of ${treeGoalTarget} trees planted`}
        progress={treeGoalProgress}
        status={`${treesPlanted}/${treeGoalTarget}`}
        barColor={Colors.primary}
        nearComplete={treeGoalProgress >= 0.9}
      />

      <GoalItem
        icon={<Leaf size={20} color="#0277BD" />}
        iconBg="#EFF6FF"
        title="Carbon Neutral"
        desc="Reduce carbon debt to 0 kg"
        progress={carbonGoalProgress}
        status={carbonDebt > 0 ? `${carbonDebt.toFixed(0)} kg left` : "Achieved!"}
        barColor="#0277BD"
        nearComplete={carbonGoalProgress >= 0.9}
      />

      {/* Achievements */}
      <View style={styles.achievementHeader}>
        <Text style={styles.sectionTitle}>Achievements</Text>
        <View style={styles.achievementCountBadge}>
          <Text style={styles.achievementCountText}>{achievedCount}/{ALL_ACHIEVEMENTS.length}</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.achievementScroll}
        contentContainerStyle={styles.achievementScrollContent}
      >
        {achievements.map((a) => {
          const IconComponent = a.icon;
          return (
            <AchievementCard
              key={a.id}
              icon={<IconComponent size={28} color={a.achieved ? a.color : '#CBD5E1'} />}
              title={a.title}
              desc={a.desc}
              achieved={a.achieved}
              color={a.color}
            />
          );
        })}
      </ScrollView>

      {/* Impact History */}
      <View style={styles.historyHeader}>
        <Text style={styles.sectionTitle}>Impact Timeline</Text>
        {impactHistory.length > 5 && (
          <TouchableOpacity onPress={() => Alert.alert("History", "Full impact history coming soon!")}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        )}
      </View>

      {impactHistory.length > 0 ? (
        <View style={styles.timelineContainer}>
          {impactHistory.slice(0, 5).map((item: any, index: number) => (
            <View key={item.id || index} style={styles.timelineItem}>
              {/* Timeline connector */}
              <View style={styles.timelineConnector}>
                <View style={[styles.timelineDot, index === 0 && styles.timelineDotActive]} />
                {index < Math.min(impactHistory.length, 5) - 1 && (
                  <View style={styles.timelineLine} />
                )}
              </View>
              {/* Card */}
              <View style={styles.timelineCard}>
                <View style={styles.timelineCardRow}>
                  <View style={styles.timelineCardIcon}>
                    <MapPin size={16} color={Colors.primary} />
                  </View>
                  <View style={styles.timelineCardContent}>
                    <Text style={styles.timelineCardTitle} numberOfLines={1}>
                      {item.plantationEvent?.title || item.eventTitle || "Plantation Event"}
                    </Text>
                    <Text style={styles.timelineCardDate}>
                      {item.verifiedAt
                        ? new Date(item.verifiedAt).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' })
                        : item.createdAt
                          ? new Date(item.createdAt).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' })
                          : ""}
                    </Text>
                  </View>
                  {(item.treesContributed || item.plantationEvent?.treesPlanted) && (
                    <View style={styles.timelineTreeBadge}>
                      <TreeDeciduous size={12} color="#16A34A" />
                      <Text style={styles.timelineTreeText}>
                        {item.treesContributed || item.plantationEvent?.treesPlanted}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyHistory}>
          <View style={styles.emptyHistoryIcon}>
            <MapPin size={24} color={Colors.textLight} />
          </View>
          <Text style={styles.emptyHistoryTitle}>No Events Yet</Text>
          <Text style={styles.emptyHistoryDesc}>
            Join a plantation event to start building your impact timeline!
          </Text>
        </View>
      )}

      {/* Share Button */}
      <TouchableOpacity
        style={styles.shareBtn}
        activeOpacity={0.8}
        onPress={() =>
          Alert.alert(
            "Share",
            `I've planted ${treesPlanted} trees and earned ${ecoScore} eco points on EcoSphere! 🌿`,
          )
        }
      >
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.shareBtnGradient}
        >
          <Share2 size={18} color="#fff" />
          <Text style={styles.shareBtnText}>Share My Progress</Text>
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );
};

// ── Sub-components ──

const ImpactStat = ({ icon, val, label }: any) => (
  <View style={styles.statBox}>
    <View style={styles.statIconBg}>{icon}</View>
    <View style={styles.statTextWrap}>
      <Text style={styles.statVal}>{val}</Text>
      <Text style={styles.statLab}>{label}</Text>
    </View>
  </View>
);

const GoalItem = ({ icon, iconBg, title, desc, progress, status, barColor, nearComplete }: any) => (
  <View style={styles.goalCard}>
    <View style={styles.goalHeader}>
      <View style={[styles.goalIconBg, { backgroundColor: iconBg }]}>{icon}</View>
      <View style={styles.goalTextContainer}>
        <Text style={styles.goalTitle}>{title}</Text>
        <Text style={styles.goalDesc}>{desc}</Text>
      </View>
      {nearComplete && (
        <View style={styles.nearCompleteBadge}>
          <Text style={styles.nearCompleteText}>Almost!</Text>
        </View>
      )}
    </View>
    <View style={styles.progressContainer}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressStatus}>{status}</Text>
        <Text style={[styles.progressPercent, { color: barColor }]}>
          {Math.round(progress * 100)}%
        </Text>
      </View>
      <ProgressBar
        progress={progress}
        color={barColor}
        style={styles.progressBar}
      />
    </View>
  </View>
);

const AchievementCard = ({ icon, title, desc, achieved, color }: any) => (
  <View style={[styles.achievementCard, !achieved && styles.achievementCardLocked]}>
    <View style={[
      styles.achievementIconBg,
      { backgroundColor: achieved ? `${color}15` : '#F1F5F9' },
    ]}>
      {icon}
      {!achieved && (
        <View style={styles.lockOverlay}>
          <Lock size={12} color="#94A3B8" />
        </View>
      )}
    </View>
    <Text style={[styles.achievementTitle, !achieved && styles.achievementTitleLocked]} numberOfLines={1}>
      {title}
    </Text>
    <Text style={[styles.achievementDesc, !achieved && styles.achievementDescLocked]} numberOfLines={1}>
      {achieved ? '✓ Unlocked' : desc}
    </Text>
  </View>
);

// ── Styles ──

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },

  // Header
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  headerText: { flex: 1, marginLeft: 14 },
  title: { fontSize: 24, fontWeight: "900", color: Colors.text },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  headerBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  headerBadgeText: { color: '#fff', fontSize: 13, fontWeight: '800' },

  // Next Milestone
  milestoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  milestoneLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  milestoneIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  milestoneTextWrap: { flex: 1 },
  milestoneLabel: { fontSize: 10, fontWeight: '700', color: '#92400E', textTransform: 'uppercase', letterSpacing: 0.5 },
  milestoneTitle: { fontSize: 15, fontWeight: '800', color: Colors.text, marginTop: 1 },
  milestoneDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  milestoneProgress: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },

  // Impact Card — 2x2
  impactCard: {
    borderRadius: 24,
    padding: 22,
    marginBottom: 28,
    elevation: 4,
    shadowColor: '#065F46',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  impactHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  impactLabel: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 0.5 },
  impactTitle: { fontSize: 20, fontWeight: "900", color: "#fff", marginTop: 2 },
  impactRankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  impactRankText: { fontSize: 13, fontWeight: '800', color: '#34D399' },

  // Stats 2x2 grid
  statsGrid: { gap: 12 },
  statsRow: { flexDirection: "row", gap: 12 },
  statBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  statIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  statTextWrap: { flex: 1 },
  statVal: { fontSize: 20, fontWeight: "900", color: "#fff" },
  statLab: { fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 1 },

  // Section
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.text,
    marginBottom: 14,
  },

  // Goals
  goalCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F0F2F5",
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  goalHeader: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  goalIconBg: {
    width: 42,
    height: 42,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  goalTextContainer: { flex: 1 },
  goalTitle: { fontSize: 15, fontWeight: "800", color: Colors.text },
  goalDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  nearCompleteBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  nearCompleteText: { fontSize: 11, fontWeight: '700', color: '#92400E' },
  progressContainer: { marginTop: 2 },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressStatus: { fontSize: 12, fontWeight: "700", color: Colors.text },
  progressPercent: { fontSize: 12, fontWeight: "800" },
  progressBar: { height: 8, borderRadius: 4, backgroundColor: "#F0F2F5" },

  // Achievements
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  achievementCountBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 14,
  },
  achievementCountText: { fontSize: 12, fontWeight: '800', color: Colors.primary },
  achievementScroll: {
    marginHorizontal: -20,
    marginBottom: 16,
  },
  achievementScrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  achievementCard: {
    width: 140,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F0F2F5",
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  achievementCardLocked: {
    backgroundColor: '#FAFBFC',
    opacity: 0.7,
  },
  achievementIconBg: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  lockOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  achievementTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.text,
    textAlign: "center",
  },
  achievementTitleLocked: {
    color: Colors.textSecondary,
  },
  achievementDesc: {
    fontSize: 11,
    color: Colors.primary,
    marginTop: 3,
    fontWeight: '600',
  },
  achievementDescLocked: {
    color: Colors.textLight,
  },

  // Impact History / Timeline
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  viewAllText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '700',
    marginBottom: 14,
  },
  timelineContainer: {
    marginBottom: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 72,
  },
  timelineConnector: {
    width: 28,
    alignItems: 'center',
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#D1FAE5',
    borderWidth: 2,
    borderColor: Colors.primary,
    marginTop: 16,
  },
  timelineDotActive: {
    backgroundColor: Colors.primary,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 0,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#E5E7EB',
    marginTop: 4,
  },
  timelineCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginLeft: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F0F2F5',
  },
  timelineCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timelineCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineCardContent: { flex: 1 },
  timelineCardTitle: { fontSize: 14, fontWeight: "700", color: Colors.text },
  timelineCardDate: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  timelineTreeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  timelineTreeText: { fontSize: 13, fontWeight: '800', color: '#16A34A' },

  // Empty history
  emptyHistory: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F2F5',
    marginBottom: 8,
  },
  emptyHistoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyHistoryTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  emptyHistoryDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },

  // Share Button
  shareBtn: {
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  shareBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  shareBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});
