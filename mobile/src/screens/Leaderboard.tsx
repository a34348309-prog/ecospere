import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Alert, Dimensions } from 'react-native';
import { Text, Avatar, TextInput, Button } from 'react-native-paper';
import { Colors } from '../theme/colors';
import { Trophy, Medal, Award, TrendingUp, UserPlus, X, Mail, Users, Crown, Star } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getLeaderboard, getMyRank, getFriendsLeaderboard, addFriend } from '../services/leaderboard.service';
import { useAuthStore } from '../store/useAuthStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const Leaderboard = () => {
    const [globalUsers, setGlobalUsers] = useState<any[]>([]);
    const [friendUsers, setFriendUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [friendsLoading, setFriendsLoading] = useState(false);
    const [myRank, setMyRank] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<'global' | 'friends'>('global');
    const { user: currentUser } = useAuthStore();

    const [showAddFriend, setShowAddFriend] = useState(false);
    const [friendEmail, setFriendEmail] = useState('');
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        fetchGlobalData();
    }, []);

    const fetchGlobalData = async () => {
        setLoading(true);
        try {
            const [leaderboardRes, myRankRes] = await Promise.all([
                getLeaderboard(),
                getMyRank(),
            ]);
            if (leaderboardRes?.data) {
                setGlobalUsers(leaderboardRes.data);
            }
            if (myRankRes?.rank) {
                setMyRank(myRankRes.rank);
            }
        } catch (e) {
            console.log('Leaderboard error:', e);
        } finally {
            setLoading(false);
        }
    };

    const fetchFriendsData = async () => {
        setFriendsLoading(true);
        try {
            const result = await getFriendsLeaderboard();
            if (result?.data) {
                setFriendUsers(result.data);
            }
        } catch (e) {
            console.log('Friends leaderboard error:', e);
        } finally {
            setFriendsLoading(false);
        }
    };

    const handleTabSwitch = (tab: 'global' | 'friends') => {
        setActiveTab(tab);
        if (tab === 'friends' && friendUsers.length === 0) {
            fetchFriendsData();
        }
    };

    const handleAddFriend = async () => {
        if (!friendEmail.trim()) {
            Alert.alert('Error', 'Please enter an email address');
            return;
        }
        if (!friendEmail.includes('@')) {
            Alert.alert('Error', 'Please enter a valid email address');
            return;
        }
        setAdding(true);
        try {
            const result = await addFriend(friendEmail.trim().toLowerCase());
            Alert.alert('Friend Added! 🎉', result.message || 'Friend added successfully');
            setShowAddFriend(false);
            setFriendEmail('');
            fetchFriendsData();
        } catch (error: any) {
            const msg = typeof error === 'string' ? error : error?.message || 'Failed to add friend';
            Alert.alert('Add Friend Failed', msg);
        } finally {
            setAdding(false);
        }
    };

    const formatPoints = (pts: number) => {
        return pts >= 1000 ? `${(pts / 1000).toFixed(1)}k` : pts.toString();
    };

    const users = activeTab === 'global' ? globalUsers : friendUsers;
    const isLoading = activeTab === 'global' ? loading : friendsLoading;

    if (isLoading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={{ marginTop: 16, color: Colors.textSecondary }}>
                    Loading {activeTab === 'global' ? 'leaderboard' : 'friends'}...
                </Text>
            </View>
        );
    }

    const top3 = users.slice(0, 3);
    const rest = users.slice(3);

    const podiumColors = ['#F59E0B', '#94A3B8', '#CD7F32'];

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Header - stacked vertically */}
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <View>
                            <Text style={styles.headerTitle}>Leaderboard</Text>
                            <Text style={styles.headerSubtitle}>
                                {activeTab === 'global' ? 'Compete with eco warriors worldwide' : 'See how you stack up against friends'}
                            </Text>
                        </View>
                        {myRank && activeTab === 'global' && (
                            <View style={styles.myRankBadge}>
                                <Text style={styles.myRankLabel}>Your Rank</Text>
                                <Text style={styles.myRankValue}>#{myRank}</Text>
                            </View>
                        )}
                    </View>
                    <View style={styles.tabSwitcher}>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'global' && styles.activeTab]}
                            onPress={() => handleTabSwitch('global')}
                        >
                            <Trophy size={14} color={activeTab === 'global' ? Colors.primary : Colors.textSecondary} />
                            <Text style={activeTab === 'global' ? styles.activeTabText : styles.tabText}>Global</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
                            onPress={() => handleTabSwitch('friends')}
                        >
                            <Users size={14} color={activeTab === 'friends' ? Colors.primary : Colors.textSecondary} />
                            <Text style={activeTab === 'friends' ? styles.activeTabText : styles.tabText}>Friends</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Add Friend bar (Friends tab only) */}
                {activeTab === 'friends' && (
                    <TouchableOpacity style={styles.addFriendBar} onPress={() => setShowAddFriend(true)} activeOpacity={0.7}>
                        <View style={styles.addFriendLeft}>
                            <View style={styles.addFriendIcon}>
                                <UserPlus size={16} color="#fff" />
                            </View>
                            <View style={styles.addFriendTextWrap}>
                                <Text style={styles.addFriendTitle} numberOfLines={1}>Add a Friend</Text>
                                <Text style={styles.addFriendSub} numberOfLines={1}>Invite by email to compete</Text>
                            </View>
                        </View>
                        <View style={styles.addBtnSmall}>
                            <UserPlus size={14} color="#fff" />
                            <Text style={styles.addBtnSmallText}>Add</Text>
                        </View>
                    </TouchableOpacity>
                )}

                {/* Empty state for friends tab */}
                {activeTab === 'friends' && users.length <= 1 && !isLoading && (
                    <View style={styles.emptyCard}>
                        <View style={styles.emptyIconCircle}>
                            <Users size={32} color={Colors.textLight} />
                        </View>
                        <Text style={styles.emptyTitle}>No Friends Yet</Text>
                        <Text style={styles.emptySubtitle}>
                            Add friends by their email to see how you{'\n'}rank against them!
                        </Text>
                        <Button
                            mode="contained"
                            onPress={() => setShowAddFriend(true)}
                            buttonColor={Colors.primary}
                            style={{ borderRadius: 14, marginTop: 20 }}
                            contentStyle={{ height: 48 }}
                            icon={() => <UserPlus size={16} color="#fff" />}
                        >
                            Add Your First Friend
                        </Button>
                    </View>
                )}

                {/* Podium Section */}
                {top3.length >= 3 && (
                    <View style={styles.podiumSection}>
                        <LinearGradient
                            colors={['#F0FDF4', '#ECFDF5', Colors.background]}
                            style={styles.podiumGradient}
                        >
                            <View style={styles.podiumContainer}>
                                {/* 2nd place */}
                                <PodiumItem
                                    rank={2}
                                    name={top3[1].name}
                                    points={formatPoints(top3[1].ecoScore)}
                                    height={85}
                                    color={podiumColors[1]}
                                    icon={<Medal size={18} color={podiumColors[1]} />}
                                    isCurrentUser={top3[1].id === currentUser?.id}
                                />
                                {/* 1st place */}
                                <PodiumItem
                                    rank={1}
                                    name={top3[0].name}
                                    points={formatPoints(top3[0].ecoScore)}
                                    height={110}
                                    color={podiumColors[0]}
                                    isWinner={true}
                                    icon={<Trophy size={20} color={podiumColors[0]} />}
                                    isCurrentUser={top3[0].id === currentUser?.id}
                                />
                                {/* 3rd place */}
                                <PodiumItem
                                    rank={3}
                                    name={top3[2].name}
                                    points={formatPoints(top3[2].ecoScore)}
                                    height={65}
                                    color={podiumColors[2]}
                                    icon={<Award size={18} color={podiumColors[2]} />}
                                    isCurrentUser={top3[2].id === currentUser?.id}
                                />
                            </View>
                        </LinearGradient>
                    </View>
                )}

                {/* If fewer than 3, show list only */}
                {top3.length > 0 && top3.length < 3 && (
                    <View style={styles.listCard}>
                        <View style={styles.listHeader}>
                            <Text style={styles.listHeaderTitle}>
                                {activeTab === 'friends' ? 'Friends Ranking' : 'Top Warriors'}
                            </Text>
                        </View>
                        {users.map((u, index) => (
                            <RankRow
                                key={u.id}
                                rank={u.rank}
                                name={u.name}
                                points={formatPoints(u.ecoScore)}
                                isUser={u.id === currentUser?.id}
                                isLast={index === users.length - 1}
                            />
                        ))}
                    </View>
                )}

                {/* List Section (4th place and below) */}
                {rest.length > 0 && (
                    <View style={styles.listCard}>
                        <View style={styles.listHeader}>
                            <Text style={styles.listHeaderTitle}>
                                {activeTab === 'friends' ? 'Full Ranking' : 'All Warriors'}
                            </Text>
                            <View style={styles.trendBadge}>
                                <TrendingUp size={12} color={Colors.primary} />
                                <Text style={styles.trendText}>Live</Text>
                            </View>
                        </View>

                        {rest.map((u, index) => (
                            <RankRow
                                key={u.id}
                                rank={u.rank}
                                name={u.name}
                                points={formatPoints(u.ecoScore)}
                                isUser={u.id === currentUser?.id}
                                isLast={index === rest.length - 1 && !(activeTab === 'global' && myRank && myRank > users.length)}
                            />
                        ))}

                        {activeTab === 'global' && myRank && myRank > users.length && (
                            <View style={styles.yourRankSection}>
                                <View style={styles.dotSeparator}>
                                    <View style={styles.dot} />
                                    <View style={styles.dot} />
                                    <View style={styles.dot} />
                                </View>
                                <RankRow
                                    rank={myRank}
                                    name={currentUser?.name || 'You'}
                                    points={formatPoints(currentUser?.ecoScore || 0)}
                                    isUser={true}
                                    isLast={true}
                                />
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>

            {/* ─── Add Friend Modal ─── */}
            <Modal visible={showAddFriend} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHandle} />
                        <View style={styles.modalHeader}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.modalTitle}>Add Friend</Text>
                                <Text style={styles.modalSubtitle}>Enter their email to connect</Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowAddFriend(false)} style={styles.closeBtn}>
                                <X size={18} color={Colors.text} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.formLabel}>Friend's Email</Text>
                        <View style={styles.inputWrapper}>
                            <Mail size={16} color={Colors.textSecondary} />
                            <TextInput
                                value={friendEmail}
                                onChangeText={setFriendEmail}
                                placeholder="friend@example.com"
                                placeholderTextColor={Colors.textLight}
                                mode="flat"
                                style={styles.inputField}
                                underlineColor="transparent"
                                activeUnderlineColor="transparent"
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>

                        <View style={styles.infoBox}>
                            <Text style={styles.infoText}>
                                👋 Your friend must already have an EcoSphere account. They'll appear in your Friends leaderboard instantly!
                            </Text>
                        </View>

                        <Button
                            mode="contained"
                            onPress={handleAddFriend}
                            loading={adding}
                            disabled={adding}
                            buttonColor={Colors.primary}
                            style={styles.addBtn}
                            contentStyle={{ height: 52 }}
                            labelStyle={{ fontSize: 16, fontWeight: '800' }}
                            icon={() => !adding ? <UserPlus size={18} color="#fff" /> : null}
                        >
                            Add Friend
                        </Button>

                        <TouchableOpacity onPress={() => setShowAddFriend(false)} style={styles.cancelBtn}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const PodiumItem = ({ rank, name, points, height, color, isWinner, icon, isCurrentUser }: any) => (
    <View style={[styles.podiumItem, isWinner && styles.podiumItemWinner]}>
        {/* Crown for winner */}
        {isWinner && (
            <View style={styles.crownContainer}>
                <Crown size={22} color="#F59E0B" fill="#F59E0B" />
            </View>
        )}
        <View style={styles.podiumAvatarContainer}>
            <Avatar.Text
                size={isWinner ? 64 : 52}
                label={name.substring(0, 2).toUpperCase()}
                style={[styles.podiumAvatar, { borderColor: color, borderWidth: isWinner ? 3 : 2 }]}
                labelStyle={{ color: Colors.text, fontSize: isWinner ? 20 : 16 }}
            />
            <View style={[styles.rankBadge, { backgroundColor: color }]}>
                <Text style={styles.rankBadgeText}>{rank}</Text>
            </View>
        </View>
        <Text style={styles.podiumName} numberOfLines={1}>
            {name.split(' ')[0]}{isCurrentUser ? ' (You)' : ''}
        </Text>
        <Text style={[styles.podiumPoints, isWinner && { color: '#F59E0B', fontWeight: '800' }]}>
            {points} pts
        </Text>
        <View style={[styles.podiumBase, { height, backgroundColor: `${color}12`, borderColor: `${color}25` }]}>
            <View style={styles.podiumBaseIcon}>{icon}</View>
        </View>
    </View>
);

const RankRow = ({ rank, name, points, isUser, isLast }: any) => (
    <View style={[
        styles.rankRow,
        isUser && styles.userRow,
        !isLast && !isUser && styles.rankRowBorder,
    ]}>
        <View style={[styles.rankNumContainer, { backgroundColor: rank <= 5 ? '#F0FDF4' : '#F8FAFC' }]}>
            <Text style={[styles.rankNum, rank <= 5 && { color: Colors.primary }]}>{rank}</Text>
        </View>
        <Avatar.Text
            size={38}
            label={name.substring(0, 2).toUpperCase()}
            style={[styles.rowAvatar, isUser && { backgroundColor: '#D1FAE5' }]}
            labelStyle={{ fontSize: 14, color: Colors.text }}
        />
        <View style={styles.rowInfo}>
            <Text style={styles.rowName} numberOfLines={1}>
                {name}{' '}
                {isUser && <Text style={styles.youTag}>(You)</Text>}
            </Text>
            <Text style={styles.rowPoints}>{points} points</Text>
        </View>
        {rank <= 5 && (
            <View style={styles.rankMedalContainer}>
                {rank === 4 && <Star size={14} color="#94A3B8" />}
                {rank === 5 && <Star size={14} color="#CBD5E1" />}
            </View>
        )}
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },

    // Header - stacked vertically
    header: {
        marginBottom: 20,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    headerTitle: { fontSize: 28, fontWeight: '900', color: Colors.text },
    headerSubtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
    myRankBadge: {
        backgroundColor: '#F0FDF4',
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#D1FAE5',
    },
    myRankLabel: { fontSize: 10, fontWeight: '600', color: Colors.textSecondary },
    myRankValue: { fontSize: 18, fontWeight: '900', color: Colors.primary, marginTop: 1 },

    // Tabs
    tabSwitcher: {
        flexDirection: 'row',
        backgroundColor: '#F0F2F5',
        borderRadius: 14,
        padding: 4,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 10,
        gap: 6,
    },
    activeTab: {
        backgroundColor: '#fff',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
    },
    activeTabText: { fontSize: 14, fontWeight: '800', color: Colors.text },
    tabText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },

    // Add Friend Bar
    addFriendBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#E8F5E9',
        borderRadius: 16,
        padding: 14,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#C8E6C9',
    },
    addFriendLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
        marginRight: 12,
    },
    addFriendTextWrap: {
        flex: 1,
    },
    addFriendIcon: {
        width: 36, height: 36, borderRadius: 12,
        backgroundColor: Colors.primary,
        justifyContent: 'center', alignItems: 'center',
        flexShrink: 0,
    },
    addFriendTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
    addFriendSub: { fontSize: 11, color: Colors.textSecondary, marginTop: 1 },
    addBtnSmall: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: Colors.primary,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        flexShrink: 0,
    },
    addBtnSmallText: { color: '#fff', fontWeight: '800', fontSize: 13 },

    // Empty state
    emptyCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        paddingVertical: 40,
        paddingHorizontal: 32,
        borderWidth: 1,
        borderColor: '#F0F2F5',
        marginBottom: 20,
        alignItems: 'center',
    },
    emptyIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyTitle: { fontSize: 20, fontWeight: '800', color: Colors.text },
    emptySubtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 22,
    },

    // Podium
    podiumSection: {
        marginBottom: 24,
        marginHorizontal: -20,
    },
    podiumGradient: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 8,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
    },
    podiumContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: 4,
    },
    podiumItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-end',
        maxWidth: (SCREEN_WIDTH - 56) / 3,
    },
    podiumItemWinner: {
        marginBottom: 0,
    },
    crownContainer: {
        marginBottom: 4,
    },
    podiumAvatarContainer: {
        alignItems: 'center',
        marginBottom: 8,
    },
    podiumAvatar: {
        backgroundColor: '#fff',
    },
    rankBadge: {
        position: 'absolute',
        bottom: -6,
        width: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    rankBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
    podiumName: {
        fontSize: 13,
        fontWeight: '800',
        color: Colors.text,
        textAlign: 'center',
        maxWidth: '100%',
    },
    podiumPoints: {
        fontSize: 12,
        color: Colors.primary,
        fontWeight: '700',
        marginTop: 2,
    },
    podiumBase: {
        width: '90%',
        marginTop: 8,
        borderRadius: 14,
        borderTopLeftRadius: 14,
        borderTopRightRadius: 14,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    podiumBaseIcon: {
        marginTop: 12,
    },

    // Rank List
    listCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 18,
        borderWidth: 1,
        borderColor: '#F0F2F5',
        marginBottom: 16,
    },
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
        paddingHorizontal: 4,
    },
    listHeaderTitle: { fontSize: 17, fontWeight: '800', color: Colors.text },
    trendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        gap: 4,
    },
    trendText: { fontSize: 11, color: Colors.primary, fontWeight: '700' },

    // Rank Row - FIXED: no negative margins
    rankRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
    },
    rankRowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    userRow: {
        backgroundColor: '#F0FDF4',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#D1FAE5',
        marginVertical: 2,
    },
    rankNumContainer: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    rankNum: { fontSize: 14, fontWeight: '800', color: Colors.textSecondary },
    rowAvatar: { backgroundColor: '#E6F4F1' },
    rowInfo: { flex: 1, marginLeft: 12 },
    rowName: { fontSize: 14, fontWeight: '700', color: Colors.text },
    youTag: { color: Colors.primary, fontSize: 12, fontWeight: '800' },
    rowPoints: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
    rankMedalContainer: { paddingLeft: 8 },

    // Your rank separator
    yourRankSection: {
        marginTop: 4,
    },
    dotSeparator: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.textLight,
    },

    // ─── Add Friend Modal ────────────────
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 24,
        paddingBottom: 32,
        paddingTop: 8,
    },
    modalHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#E5E7EB',
        alignSelf: 'center',
        marginBottom: 8,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F2F5',
        marginBottom: 20,
    },
    modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.text },
    modalSubtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
    closeBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: '#F0F2F5',
        justifyContent: 'center', alignItems: 'center',
    },
    formLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAF5',
        borderRadius: 14,
        paddingHorizontal: 14,
        height: 52,
        borderWidth: 1,
        borderColor: '#E8F5E9',
        gap: 10,
        marginBottom: 12,
    },
    inputField: {
        flex: 1,
        backgroundColor: 'transparent',
        height: 52,
        fontSize: 15,
        color: Colors.text,
        fontWeight: '500',
    },
    infoBox: {
        backgroundColor: '#FFF8E1',
        borderRadius: 14,
        padding: 14,
        marginBottom: 20,
    },
    infoText: {
        fontSize: 13,
        color: '#5D4037',
        lineHeight: 20,
    },
    addBtn: {
        borderRadius: 16,
        elevation: 3,
        marginBottom: 12,
    },
    cancelBtn: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    cancelText: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.textSecondary,
    },
});
