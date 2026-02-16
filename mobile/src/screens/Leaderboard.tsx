import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Alert } from 'react-native';
import { Text, Avatar, Card, TextInput, Button } from 'react-native-paper';
import { Colors } from '../theme/colors';
import { Trophy, Medal, Award, TrendingUp, UserPlus, X, Mail, Users } from 'lucide-react-native';
import { getLeaderboard, getMyRank, getFriendsLeaderboard, addFriend } from '../services/leaderboard.service';
import { useAuthStore } from '../store/useAuthStore';

export const Leaderboard = () => {
    const [globalUsers, setGlobalUsers] = useState<any[]>([]);
    const [friendUsers, setFriendUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [friendsLoading, setFriendsLoading] = useState(false);
    const [myRank, setMyRank] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<'global' | 'friends'>('global');
    const { user: currentUser } = useAuthStore();

    // Add friend modal
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
            fetchFriendsData(); // Refresh friends list
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

    // Top 3 for the podium
    const top3 = users.slice(0, 3);
    const rest = users.slice(3);

    const podiumColors = ['#F59E0B', '#94A3B8', '#B45309']; // gold, silver, bronze
    const podiumHeights = [140, 110, 90];

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Leaderboard</Text>
                    <View style={styles.tabSwitcher}>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'global' && styles.activeTab]}
                            onPress={() => handleTabSwitch('global')}
                        >
                            <Text style={activeTab === 'global' ? styles.activeTabText : styles.tabText}>Global</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
                            onPress={() => handleTabSwitch('friends')}
                        >
                            <Text style={activeTab === 'friends' ? styles.activeTabText : styles.tabText}>Friends</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Add Friend button (only on Friends tab) */}
                {activeTab === 'friends' && (
                    <TouchableOpacity style={styles.addFriendBar} onPress={() => setShowAddFriend(true)}>
                        <View style={styles.addFriendLeft}>
                            <View style={styles.addFriendIcon}>
                                <UserPlus size={18} color="#fff" />
                            </View>
                            <View>
                                <Text style={styles.addFriendTitle}>Add a Friend</Text>
                                <Text style={styles.addFriendSub}>Invite by email to compete together</Text>
                            </View>
                        </View>
                        <View style={styles.addBtnSmall}>
                            <Text style={styles.addBtnSmallText}>+ Add</Text>
                        </View>
                    </TouchableOpacity>
                )}

                {/* Empty state for friends tab */}
                {activeTab === 'friends' && users.length <= 1 && !isLoading && (
                    <Card style={styles.emptyCard} elevation={0}>
                        <View style={styles.emptyContent}>
                            <Users size={48} color={Colors.textLight} />
                            <Text style={styles.emptyTitle}>No Friends Yet</Text>
                            <Text style={styles.emptySubtitle}>
                                Add friends by their email to see how you rank against them!
                            </Text>
                            <Button
                                mode="contained"
                                onPress={() => setShowAddFriend(true)}
                                buttonColor={Colors.primary}
                                style={{ borderRadius: 14, marginTop: 16 }}
                                icon={() => <UserPlus size={16} color="#fff" />}
                            >
                                Add Your First Friend
                            </Button>
                        </View>
                    </Card>
                )}

                {/* Podium Section */}
                {top3.length >= 3 && (
                    <View style={styles.podiumContainer}>
                        {/* 2nd place */}
                        <PodiumItem
                            rank={2}
                            name={top3[1].name}
                            points={formatPoints(top3[1].ecoScore)}
                            height={podiumHeights[1]}
                            color={podiumColors[1]}
                            icon={<Medal size={20} color={podiumColors[1]} />}
                            isCurrentUser={top3[1].id === currentUser?.id}
                        />
                        {/* 1st place */}
                        <PodiumItem
                            rank={1}
                            name={top3[0].name}
                            points={formatPoints(top3[0].ecoScore)}
                            height={podiumHeights[0]}
                            color={podiumColors[0]}
                            isWinner={true}
                            icon={<Trophy size={24} color={podiumColors[0]} />}
                            isCurrentUser={top3[0].id === currentUser?.id}
                        />
                        {/* 3rd place */}
                        <PodiumItem
                            rank={3}
                            name={top3[2].name}
                            points={formatPoints(top3[2].ecoScore)}
                            height={podiumHeights[2]}
                            color={podiumColors[2]}
                            icon={<Award size={20} color={podiumColors[2]} />}
                            isCurrentUser={top3[2].id === currentUser?.id}
                        />
                    </View>
                )}

                {/* If fewer than 3, show list only */}
                {top3.length > 0 && top3.length < 3 && (
                    <Card style={styles.listCard} elevation={0}>
                        <View style={styles.listHeader}>
                            <Text style={styles.listHeaderTitle}>
                                {activeTab === 'friends' ? 'Friends Ranking' : 'Top Warriors'}
                            </Text>
                        </View>
                        {users.map((u) => (
                            <RankRow
                                key={u.id}
                                rank={u.rank}
                                name={u.name}
                                points={formatPoints(u.ecoScore)}
                                isUser={u.id === currentUser?.id}
                            />
                        ))}
                    </Card>
                )}

                {/* List Section (4th place and below) */}
                {rest.length > 0 && (
                    <Card style={styles.listCard} elevation={0}>
                        <View style={styles.listHeader}>
                            <Text style={styles.listHeaderTitle}>
                                {activeTab === 'friends' ? 'Friends Ranking' : 'Top Warriors'}
                            </Text>
                            <View style={styles.trendBadge}>
                                <TrendingUp size={12} color={Colors.primary} />
                                <Text style={styles.trendText}>Active Now</Text>
                            </View>
                        </View>

                        {rest.map((u) => (
                            <RankRow
                                key={u.id}
                                rank={u.rank}
                                name={u.name}
                                points={formatPoints(u.ecoScore)}
                                isUser={u.id === currentUser?.id}
                            />
                        ))}

                        {activeTab === 'global' && myRank && myRank > users.length && (
                            <View style={{ marginTop: 12 }}>
                                <Text style={{ fontSize: 12, color: Colors.textSecondary, marginBottom: 8, textAlign: 'center' }}>• • •</Text>
                                <RankRow
                                    rank={myRank}
                                    name={currentUser?.name || 'You'}
                                    points={formatPoints(currentUser?.ecoScore || 0)}
                                    isUser={true}
                                />
                            </View>
                        )}
                    </Card>
                )}
            </ScrollView>

            {/* ─── Add Friend Modal ─── */}
            <Modal visible={showAddFriend} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>Add Friend</Text>
                                <Text style={styles.modalSubtitle}>Enter their email to connect</Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowAddFriend(false)} style={styles.closeBtn}>
                                <X size={20} color={Colors.text} />
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
    <View style={[styles.podiumItem, { height: height + 80 }]}>
        <View style={styles.podiumAvatarContainer}>
            <Avatar.Text
                size={isWinner ? 75 : 60}
                label={name.substring(0, 2).toUpperCase()}
                style={[styles.podiumAvatar, { borderColor: color }]}
                labelStyle={{ color: Colors.text }}
            />
            <View style={[styles.rankBadge, { backgroundColor: color }]}>
                <Text style={styles.rankBadgeText}>{rank}</Text>
            </View>
        </View>
        <Text style={styles.podiumName}>{name.split(' ')[0]}{isCurrentUser ? ' (You)' : ''}</Text>
        <Text style={styles.podiumPoints}>{points} pts</Text>
        <View style={[styles.podiumBase, { height: height, backgroundColor: `${color}15`, borderColor: `${color}30` }]}>
            {icon}
        </View>
    </View>
);

const RankRow = ({ rank, name, points, isUser }: any) => (
    <View style={[styles.rankRow, isUser && styles.userRow]}>
        <Text style={styles.rankNum}>{rank}</Text>
        <Avatar.Text size={40} label={name.substring(0, 2).toUpperCase()} style={styles.rowAvatar} />
        <View style={styles.rowInfo}>
            <Text style={styles.rowName}>{name} {isUser && <Text style={styles.youTag}>(You)</Text>}</Text>
            <Text style={styles.rowPoints}>{points} points earned</Text>
        </View>
        <View style={styles.medalIcon}>
            {rank === 4 ? <Award size={18} color="#94A3B8" /> : null}
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    content: { padding: 20, paddingBottom: 100 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 25
    },
    headerTitle: { fontSize: 26, fontWeight: '900', color: Colors.text },
    tabSwitcher: {
        flexDirection: 'row',
        backgroundColor: '#F0F2F5',
        borderRadius: 12,
        padding: 4
    },
    tab: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8 },
    activeTab: { backgroundColor: '#fff', elevation: 2 },
    activeTabText: { fontSize: 13, fontWeight: '800', color: Colors.text },
    tabText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },

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
    },
    addFriendIcon: {
        width: 36, height: 36, borderRadius: 12,
        backgroundColor: Colors.primary,
        justifyContent: 'center', alignItems: 'center',
    },
    addFriendTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
    addFriendSub: { fontSize: 11, color: Colors.textSecondary, marginTop: 1 },
    addBtnSmall: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 14, paddingVertical: 8,
        borderRadius: 10,
    },
    addBtnSmallText: { color: '#fff', fontWeight: '800', fontSize: 12 },

    // Empty state
    emptyCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 32,
        borderWidth: 1,
        borderColor: '#F0F2F5',
        marginBottom: 20,
    },
    emptyContent: { alignItems: 'center' },
    emptyTitle: { fontSize: 18, fontWeight: '800', color: Colors.text, marginTop: 16 },
    emptySubtitle: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 20 },

    podiumContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        marginBottom: 40,
        marginTop: 10
    },
    podiumItem: { alignItems: 'center', justifyContent: 'flex-end', width: '30%' },
    podiumAvatarContainer: { alignItems: 'center', marginBottom: 12 },
    podiumAvatar: { backgroundColor: '#fff', borderWidth: 3 },
    rankBadge: {
        position: 'absolute',
        bottom: -8,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff'
    },
    rankBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
    podiumName: { fontSize: 14, fontWeight: '800', color: Colors.text, textAlign: 'center' },
    podiumPoints: { fontSize: 12, color: Colors.primary, fontWeight: '700', marginTop: 2 },
    podiumBase: {
        width: '100%',
        marginTop: 8,
        borderRadius: 12,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },

    listCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: '#F0F2F5'
    },
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
    },
    listHeaderTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
    trendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12
    },
    trendText: { fontSize: 10, color: Colors.primary, fontWeight: '700', marginLeft: 4 },

    rankRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F8FAF5'
    },
    userRow: { backgroundColor: '#F8FAF5', borderRadius: 16, marginHorizontal: -10, paddingHorizontal: 10 },
    rankNum: { width: 30, fontSize: 16, fontWeight: '800', color: Colors.textSecondary },
    rowAvatar: { backgroundColor: '#E6F4F1' },
    rowInfo: { flex: 1, marginLeft: 16 },
    rowName: { fontSize: 15, fontWeight: '700', color: Colors.text },
    youTag: { color: Colors.primaryLight, fontSize: 12 },
    rowPoints: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
    medalIcon: { paddingLeft: 10 },

    // ─── Add Friend Modal ────────────────
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingHorizontal: 24,
        paddingBottom: 32,
        paddingTop: 8,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F2F5',
        marginBottom: 20,
    },
    modalTitle: { fontSize: 22, fontWeight: '800', color: Colors.text },
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
