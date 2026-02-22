import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Animated,
    RefreshControl,
    Modal,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Text } from 'react-native-paper';
import { Colors } from '../theme/colors';
import {
    ChevronLeft,
    TreeDeciduous,
    Flame,
    Leaf,
    DollarSign,
    Target,
    Award,
    RefreshCw,
    Info,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
    getCurrentEcoPlan,
    updateActionProgress,
    getEcoImpactSummary,
    EcoPlan,
    PlanAction,
    ImpactSummary,
} from '../services/ecoPlan.service';
import { ActionCard } from '../components/ActionCard';
import { ProgressChart } from '../components/ProgressChart';
import { ImpactBadge } from '../components/ImpactBadge';
import { SharePlan } from '../components/SharePlan';
import { MilestoneCelebration } from '../components/MilestoneCelebration';

interface EcoPlanScreenProps {
    onBack: () => void;
    onNavigate: (screen: string) => void;
    initialPlan?: EcoPlan;
}

const PHASE_INFO: Record<string, { title: string; emoji: string; color: string }> = {
    immediate: { title: 'Start Now', emoji: '⚡', color: '#E3F2FD' },
    short_term: { title: '1-3 Months', emoji: '🌱', color: '#F1F8E9' },
    medium_term: { title: '3-6 Months', emoji: '🌿', color: '#FFF8E1' },
    long_term: { title: '6-12 Months', emoji: '🌳', color: '#F3E5F5' },
};

const MILESTONES = [
    { threshold: 5, emoji: '🌱', label: 'Eco Starter' },
    { threshold: 10, emoji: '🌿', label: 'Green Advocate' },
    { threshold: 15, emoji: '🌳', label: 'Planet Protector' },
    { threshold: 20, emoji: '🌍', label: 'Eco Champion' },
];

export const EcoPlanScreen = ({ onBack, onNavigate, initialPlan }: EcoPlanScreenProps) => {
    const [plan, setPlan] = useState<EcoPlan | null>(initialPlan || null);
    const [impact, setImpact] = useState<ImpactSummary | null>(null);
    const [loading, setLoading] = useState(!initialPlan);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedAction, setSelectedAction] = useState<PlanAction | null>(null);
    const [activePhase, setActivePhase] = useState('immediate');
    const [celebration, setCelebration] = useState<{ emoji: string; label: string } | null>(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        if (!initialPlan) {
            fetchPlan();
        } else {
            fadeIn();
        }
        fetchImpact();
    }, []);

    const fadeIn = () => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const fetchPlan = async () => {
        try {
            const result = await getCurrentEcoPlan();
            if (result.success && result.data) {
                setPlan(result.data);
                fadeIn();
            }
        } catch (err) {
            Alert.alert('Error', 'Could not load your eco plan.');
        } finally {
            setLoading(false);
        }
    };

    const fetchImpact = async () => {
        try {
            const result = await getEcoImpactSummary();
            if (result.success && result.data) {
                setImpact(result.data);
            }
        } catch {
            // silently fail
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([fetchPlan(), fetchImpact()]);
        setRefreshing(false);
    }, []);

    const handleToggleAction = async (actionId: string, isCompleted: boolean) => {
        try {
            const prev = plan;
            // Optimistic update
            if (plan?.actions) {
                const updated = plan.actions.map((a) =>
                    a.id === actionId ? { ...a, isCompleted } : a,
                );
                const completedCount = updated.filter((a) => a.isCompleted).length;

                setPlan({
                    ...plan,
                    actions: updated,
                    completedActions: completedCount,
                    completionPercentage: Math.round((completedCount / updated.length) * 100),
                });

                // Check milestones
                const milestone = MILESTONES.find((m) => m.threshold === completedCount);
                if (milestone && isCompleted) {
                    setTimeout(() => setCelebration(milestone), 300);
                }
            }

            const result = await updateActionProgress(actionId, isCompleted);
            if (!result.success) {
                setPlan(prev);
                Alert.alert('Error', 'Could not update progress.');
            }
        } catch {
            Alert.alert('Error', 'Could not update progress.');
        }
    };

    const getPhaseActions = (phase: string): PlanAction[] => {
        return plan?.actions?.filter((a) => a.phase === phase) || [];
    };

    // ── Loading ────────────────────────────────────────────
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={{ marginTop: 12, color: Colors.textSecondary }}>
                    Loading your plan...
                </Text>
            </View>
        );
    }

    // ── No plan ────────────────────────────────────────────
    if (!plan) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>🌱</Text>
                <Text style={styles.emptyTitle}>No Eco Plan Yet</Text>
                <Text style={styles.emptySubtitle}>
                    Create your personalized 12-month action plan.
                </Text>
                <TouchableOpacity
                    style={styles.createBtn}
                    onPress={() => onNavigate('ecoPlanForm')}
                >
                    <TreeDeciduous size={20} color="#fff" />
                    <Text style={styles.createBtnText}>Create My Plan</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.backLink} onPress={onBack}>
                    <Text style={{ color: Colors.primary, fontWeight: '600' }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const completionPct = plan.completionPercentage || 0;
    const totalActions = plan.actions?.length || 0;
    const completedActions = plan.completedActions || 0;

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={Colors.primary}
                    />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                        <ChevronLeft size={24} color={Colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>My Eco Plan</Text>
                    <SharePlan
                        planName="My EcoSphere Plan"
                        treeDebt={plan.treeDebt || 0}
                        totalCO2Reduced={plan.totalCarbonSaved || 0}
                        totalSavings={plan.totalMonthlySavings || 0}
                        completionPct={completionPct}
                    />
                </View>

                {/* Hero card */}
                <Animated.View
                    style={[
                        styles.heroCard,
                        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                    ]}
                >
                    <LinearGradient
                        colors={['#E0F2F1', '#E0F7FA', '#E1F5FE']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.heroGrad}
                    >
                        <View style={styles.heroRow}>
                            <View style={styles.heroStat}>
                                <TreeDeciduous size={20} color="#2E7D32" />
                                <Text style={styles.heroNum}>{plan.treeDebt || 0}</Text>
                                <Text style={styles.heroLabel}>Tree Debt</Text>
                            </View>
                            <View style={styles.heroDivider} />
                            <View style={styles.heroStat}>
                                <Flame size={20} color="#E65100" />
                                <Text style={styles.heroNum}>
                                    {((plan.totalCarbonSaved || 0) / 1000).toFixed(1)}t
                                </Text>
                                <Text style={styles.heroLabel}>CO₂ Saved</Text>
                            </View>
                            <View style={styles.heroDivider} />
                            <View style={styles.heroStat}>
                                <DollarSign size={20} color="#1565C0" />
                                <Text style={styles.heroNum}>
                                    ₹{((plan.totalMonthlySavings || 0) / 1000).toFixed(1)}k
                                </Text>
                                <Text style={styles.heroLabel}>Monthly Savings</Text>
                            </View>
                        </View>
                    </LinearGradient>
                </Animated.View>

                {/* Progress */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Your Progress</Text>
                    <ProgressChart
                        completed={completedActions}
                        total={totalActions}
                    />
                </View>

                {/* Impact summary */}
                {impact && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Environmental Impact</Text>
                        <View style={styles.impactGrid}>
                            <View style={styles.impactItem}>
                                <Leaf size={18} color="#2E7D32" />
                                <Text style={styles.impactValue}>
                                    {(impact.totalCarbonSaved / 1000).toFixed(1)} tonnes
                                </Text>
                                <Text style={styles.impactLabel}>CO₂ Reduced / Year</Text>
                            </View>
                            <View style={styles.impactItem}>
                                <TreeDeciduous size={18} color="#1B5E20" />
                                <Text style={styles.impactValue}>
                                    {impact.treesEquivalent} trees
                                </Text>
                                <Text style={styles.impactLabel}>Equivalent Planted</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Milestones */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Milestones</Text>
                    <View style={styles.badgeRow}>
                        {MILESTONES.map((m) => (
                            <ImpactBadge
                                key={m.threshold}
                                emoji={m.emoji}
                                label={m.label}
                                achieved={completedActions >= m.threshold}
                            />
                        ))}
                    </View>
                </View>

                {/* Phase tabs */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Action Plan</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.phaseTabsRow}>
                            {Object.entries(PHASE_INFO).map(([key, val]) => {
                                const count = getPhaseActions(key).length;
                                const completedInPhase = getPhaseActions(key).filter(
                                    (a) => a.isCompleted,
                                ).length;
                                return (
                                    <TouchableOpacity
                                        key={key}
                                        style={[
                                            styles.phaseTab,
                                            activePhase === key && styles.phaseTabActive,
                                        ]}
                                        onPress={() => setActivePhase(key)}
                                    >
                                        <Text style={styles.phaseEmoji}>{val.emoji}</Text>
                                        <Text
                                            style={[
                                                styles.phaseTabText,
                                                activePhase === key && styles.phaseTabTextActive,
                                            ]}
                                        >
                                            {val.title}
                                        </Text>
                                        <Text style={styles.phaseCount}>
                                            {completedInPhase}/{count}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </ScrollView>
                </View>

                {/* Action cards */}
                <View style={styles.actionsSection}>
                    {getPhaseActions(activePhase).length === 0 ? (
                        <View style={styles.noActions}>
                            <Text style={styles.noActionsText}>
                                No actions in this phase yet.
                            </Text>
                        </View>
                    ) : (
                        getPhaseActions(activePhase).map((action) => (
                            <ActionCard
                                key={action.id}
                                action={action}
                                onToggle={(completed) => handleToggleAction(action.id, completed)}
                                onPress={() => setSelectedAction(action)}
                            />
                        ))
                    )}
                </View>

                {/* Financial summary */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Financial Summary</Text>
                    <View style={styles.financialCard}>
                        <View style={styles.finRow}>
                            <Text style={styles.finLabel}>Monthly Savings</Text>
                            <Text style={[styles.finValue, { color: '#2E7D32' }]}>
                                +₹{(plan.totalMonthlySavings || 0).toLocaleString()}
                            </Text>
                        </View>
                        <View style={styles.finDivider} />
                        <View style={styles.finRow}>
                            <Text style={styles.finLabel}>Upfront Investment</Text>
                            <Text style={[styles.finValue, { color: '#C62828' }]}>
                                ₹{(plan.totalUpfrontCost || 0).toLocaleString()}
                            </Text>
                        </View>
                        <View style={styles.finDivider} />
                        <View style={styles.finRow}>
                            <Text style={styles.finLabel}>Payback Period</Text>
                            <Text style={[styles.finValue, { color: Colors.primaryDark }]}>
                                {plan.totalUpfrontCost && plan.totalMonthlySavings
                                    ? `${Math.ceil(plan.totalUpfrontCost / plan.totalMonthlySavings)} months`
                                    : 'N/A'}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Action detail modal */}
            <Modal
                visible={!!selectedAction}
                transparent
                animationType="slide"
                onRequestClose={() => setSelectedAction(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        {selectedAction && (
                            <>
                                <Text style={styles.modalTitle}>{selectedAction.name}</Text>
                                <View style={styles.modalBadge}>
                                    <Text style={styles.modalBadgeText}>
                                        {selectedAction.category.replace('_', ' ')}
                                    </Text>
                                </View>
                                <View style={styles.modalStats}>
                                    <View style={styles.modalStatItem}>
                                        <Leaf size={16} color="#2E7D32" />
                                        <Text style={styles.modalStatVal}>
                                            {selectedAction.carbonSavedKg} kg CO₂/yr
                                        </Text>
                                    </View>
                                    <View style={styles.modalStatItem}>
                                        <DollarSign size={16} color="#1565C0" />
                                        <Text style={styles.modalStatVal}>
                                            ₹{selectedAction.monthlySavings}/mo saved
                                        </Text>
                                    </View>
                                    {selectedAction.upfrontCost > 0 && (
                                        <View style={styles.modalStatItem}>
                                            <Target size={16} color="#E65100" />
                                            <Text style={styles.modalStatVal}>
                                                ₹{selectedAction.upfrontCost} upfront
                                            </Text>
                                        </View>
                                    )}
                                </View>
                                <View style={styles.modalDiffRow}>
                                    <Text style={styles.modalDiffLabel}>Difficulty</Text>
                                    <View style={styles.diffDots}>
                                        {[1, 2, 3, 4, 5].map((n) => (
                                            <View
                                                key={n}
                                                style={[
                                                    styles.diffDot,
                                                    n <= selectedAction.difficulty &&
                                                        styles.diffDotFilled,
                                                ]}
                                            />
                                        ))}
                                    </View>
                                </View>

                                <View style={styles.modalScoreRow}>
                                    <Text style={styles.modalDiffLabel}>Your Score</Text>
                                    <View style={styles.scoreBar}>
                                        <View
                                            style={[
                                                styles.scoreFill,
                                                {
                                                    width: `${selectedAction.personalizedScore || 0}%`,
                                                },
                                            ]}
                                        />
                                    </View>
                                    <Text style={styles.scoreText}>
                                        {selectedAction.personalizedScore || 0}/100
                                    </Text>
                                </View>

                                <TouchableOpacity
                                    style={styles.modalCloseBtn}
                                    onPress={() => setSelectedAction(null)}
                                >
                                    <Text style={styles.modalCloseBtnText}>Close</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Celebration overlay */}
            {celebration && (
                <MilestoneCelebration
                    emoji={celebration.emoji}
                    label={celebration.label}
                    onDismiss={() => setCelebration(null)}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
        padding: 40,
    },
    emptyEmoji: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1E293B',
    },
    emptySubtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 24,
    },
    createBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: Colors.primary,
        paddingVertical: 14,
        paddingHorizontal: 28,
        borderRadius: 14,
        elevation: 2,
    },
    createBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    backLink: {
        marginTop: 16,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
        marginTop: 10,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0F172A',
    },

    // Hero card
    heroCard: {
        borderRadius: 24,
        marginBottom: 20,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
    },
    heroGrad: {
        padding: 20,
        borderRadius: 24,
    },
    heroRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    heroStat: {
        alignItems: 'center',
        gap: 4,
    },
    heroNum: {
        fontSize: 22,
        fontWeight: '900',
        color: '#1E293B',
    },
    heroLabel: {
        fontSize: 11,
        color: '#475569',
        fontWeight: '600',
    },
    heroDivider: {
        width: 1,
        height: 40,
        backgroundColor: '#B2DFDB',
    },

    // Section
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 12,
    },

    // Impact grid
    impactGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    impactItem: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        gap: 6,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    impactValue: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1E293B',
    },
    impactLabel: {
        fontSize: 11,
        color: Colors.textSecondary,
        textAlign: 'center',
    },

    // Badge row
    badgeRow: {
        flexDirection: 'row',
        gap: 10,
        justifyContent: 'center',
    },

    // Phase tabs
    phaseTabsRow: {
        flexDirection: 'row',
        gap: 8,
        paddingBottom: 4,
    },
    phaseTab: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 14,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        alignItems: 'center',
        minWidth: 80,
    },
    phaseTabActive: {
        backgroundColor: '#E0F2F1',
        borderColor: Colors.primary,
    },
    phaseEmoji: {
        fontSize: 18,
    },
    phaseTabText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#64748B',
        marginTop: 2,
    },
    phaseTabTextActive: {
        color: Colors.primaryDark,
    },
    phaseCount: {
        fontSize: 10,
        color: Colors.textSecondary,
        marginTop: 2,
    },

    // Actions
    actionsSection: {
        marginBottom: 20,
    },
    noActions: {
        padding: 24,
        alignItems: 'center',
    },
    noActionsText: {
        color: Colors.textSecondary,
        fontSize: 14,
    },

    // Financial
    financialCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    finRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    finLabel: {
        fontSize: 14,
        color: '#475569',
        fontWeight: '600',
    },
    finValue: {
        fontSize: 16,
        fontWeight: '800',
    },
    finDivider: {
        height: 1,
        backgroundColor: '#F1F5F9',
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalCard: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: 28,
        paddingBottom: 40,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 8,
    },
    modalBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#E0F2F1',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 8,
        marginBottom: 16,
    },
    modalBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.primaryDark,
        textTransform: 'capitalize',
    },
    modalStats: {
        gap: 10,
        marginBottom: 16,
    },
    modalStatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    modalStatVal: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
    },
    modalDiffRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    modalDiffLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
    },
    diffDots: {
        flexDirection: 'row',
        gap: 4,
    },
    diffDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#E2E8F0',
    },
    diffDotFilled: {
        backgroundColor: '#F59E0B',
    },
    modalScoreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 20,
    },
    scoreBar: {
        flex: 1,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#E2E8F0',
        overflow: 'hidden',
    },
    scoreFill: {
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.primary,
    },
    scoreText: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.primaryDark,
        width: 50,
        textAlign: 'right',
    },
    modalCloseBtn: {
        backgroundColor: Colors.primary,
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
    },
    modalCloseBtnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
});
