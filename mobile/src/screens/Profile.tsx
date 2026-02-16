import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Avatar, Switch, Card, Button, Divider, TextInput } from 'react-native-paper';
import { Colors } from '../theme/colors';
import {
    Settings,
    Bell,
    MapPin,
    ShieldCheck,
    Mail,
    User,
    LogOut,
    Award,
    TreeDeciduous,
    Trophy,
    Flame,
    Users,
    Sprout,
    Moon,
    X,
    Check,
    Pencil,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../store/useAuthStore';
import { getMyRank } from '../services/leaderboard.service';
import { getCalculatorStats, updateProfile } from '../services/auth.service';

export const Profile = ({ onLogout }: any) => {
    const { user, updateUser } = useAuthStore();
    const [darkMode, setDarkMode] = useState(false);
    const [notifications, setNotifications] = useState(true);
    const [locationServices, setLocationServices] = useState(true);
    const [privacy, setPrivacy] = useState(true);
    const [myRank, setMyRank] = useState<number | null>(null);
    const [stats, setStats] = useState<any>(null);

    // Edit Profile State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editName, setEditName] = useState(user?.name || '');
    const [editEmail, setEditEmail] = useState(user?.email || '');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchProfileData();
    }, []);

    const fetchProfileData = async () => {
        try {
            const [rankResult, statsResult] = await Promise.all([
                getMyRank(),
                getCalculatorStats(),
            ]);
            if (rankResult?.rank) setMyRank(rankResult.rank);
            if (statsResult) setStats(statsResult);
        } catch (e) {
            console.log('Profile data error:', e);
        }
    };

    const openEditModal = () => {
        setEditName(user?.name || '');
        setEditEmail(user?.email || '');
        setShowEditModal(true);
    };

    const handleSaveProfile = async () => {
        // Client-side validation
        if (!editName.trim() || editName.trim().length < 2) {
            Alert.alert('Invalid Name', 'Name must be at least 2 characters.');
            return;
        }

        if (!editEmail.trim() || !editEmail.includes('@')) {
            Alert.alert('Invalid Email', 'Please enter a valid email address.');
            return;
        }

        // Check if anything actually changed
        const nameChanged = editName.trim() !== user?.name;
        const emailChanged = editEmail.trim().toLowerCase() !== user?.email;

        if (!nameChanged && !emailChanged) {
            setShowEditModal(false);
            return;
        }

        setSaving(true);
        try {
            const updateData: { name?: string; email?: string } = {};
            if (nameChanged) updateData.name = editName.trim();
            if (emailChanged) updateData.email = editEmail.trim().toLowerCase();

            const result = await updateProfile(updateData);

            // Update local auth store with new data
            if (result?.user) {
                updateUser({
                    name: result.user.name,
                    email: result.user.email,
                    ecoScore: result.user.ecoScore,
                    level: result.user.level,
                    totalTreesPlanted: result.user.totalTreesPlanted,
                    oxygenContribution: result.user.oxygenContribution,
                    carbonDebt: result.user.carbonDebt,
                    lifetimeCarbon: result.user.lifetimeCarbon,
                    treesToOffset: result.user.treesToOffset,
                });
            }

            Alert.alert('Success ✅', result?.message || 'Profile updated successfully!');
            setShowEditModal(false);
        } catch (error: any) {
            const msg = typeof error === 'string' ? error : error?.message || 'Failed to update profile';
            Alert.alert('Update Failed', msg);
        } finally {
            setSaving(false);
        }
    };

    const treesPlanted = user?.totalTreesPlanted ?? stats?.totalTreesPlanted ?? 0;
    const ecoScore = user?.ecoScore ?? stats?.ecoScore ?? 0;
    const memberSince = user?.createdAt
        ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'Member';

    const BADGES = [
        { id: 1, name: 'First Seed', icon: Sprout, color: '#8BC34A', bg: '#F1F8E9' },
        { id: 2, name: 'Tree Hugger', icon: TreeDeciduous, color: '#4CAF50', bg: '#E8F5E9' },
        { id: 3, name: 'Week Warrior', icon: Flame, color: '#FF9800', bg: '#FFF3E0' },
        { id: 4, name: 'Community Builder', icon: Users, color: '#9C27B0', bg: '#F3E5F5' },
        { id: 5, name: 'Eco Champion', icon: Trophy, color: '#FFC107', bg: '#FFF8E1' },
        { id: 6, name: 'Forest Creator', icon: TreeDeciduous, color: '#009688', bg: '#E0F2F1' },
    ];

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Profile</Text>
                    <Text style={styles.headerSubtitle}>Manage your account and preferences</Text>
                </View>

                {/* Profile Card */}
                <LinearGradient
                    colors={['#E0F2F1', '#E0F2F1']}
                    style={styles.profileCard}
                >
                    <View style={styles.avatarContainer}>
                        <Avatar.Text
                            size={80}
                            label={user?.name?.substring(0, 2).toUpperCase() || 'EW'}
                            style={{ backgroundColor: '#00BFA5' }}
                            labelStyle={{ color: '#fff', fontWeight: 'bold', fontSize: 24 }}
                        />
                        <View style={styles.smallBadge}>
                            <Sprout size={14} color="#fff" />
                        </View>
                    </View>

                    <Text style={styles.userName}>{user?.name || 'Eco Warrior'}</Text>
                    <View style={styles.locationRow}>
                        <Mail size={14} color="#546E7A" />
                        <Text style={styles.locationText}>{user?.email || ''}</Text>
                    </View>

                    <View style={styles.badgeRow}>
                        <View style={styles.pBadge}>
                            <Text style={styles.pBadgeText}>Level {user?.level ?? 1}</Text>
                        </View>
                        <View style={[styles.pBadge, styles.pBadgeLight]}>
                            <Text style={[styles.pBadgeText, { color: '#0288D1' }]}>
                                {myRank ? `Rank #${myRank}` : 'Unranked'}
                            </Text>
                        </View>
                    </View>

                    <Button
                        mode="outlined"
                        onPress={openEditModal}
                        style={styles.editBtn}
                        labelStyle={{ color: '#004D40', fontSize: 12 }}
                        icon={() => <Pencil size={14} color="#004D40" />}
                    >
                        Edit Profile
                    </Button>
                </LinearGradient>

                {/* Stats Section */}
                <Text style={styles.sectionTitle}>Your Stats</Text>
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <TreeDeciduous size={24} color="#00BFA5" style={{ marginBottom: 8 }} />
                        <Text style={styles.statValue}>{treesPlanted}</Text>
                        <Text style={styles.statLabel}>Trees Planted</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Trophy size={24} color="#039BE5" style={{ marginBottom: 8 }} />
                        <Text style={styles.statValue}>{myRank ? `#${myRank}` : '-'}</Text>
                        <Text style={styles.statLabel}>Global Rank</Text>
                    </View>
                    <View style={styles.statCard}>
                        <User size={24} color="#00897B" style={{ marginBottom: 8 }} />
                        <Text style={styles.statValue}>{ecoScore}</Text>
                        <Text style={styles.statLabel}>Eco Score</Text>
                    </View>
                </View>

                {/* Badges Section */}
                <Card style={styles.badgesCard} elevation={0}>
                    <Text style={styles.cardTitle}>Your Badges</Text>
                    <Text style={styles.cardSubtitle}>Achievements you've unlocked</Text>

                    <View style={styles.badgesGrid}>
                        {BADGES.map((badge) => (
                            <View key={badge.id} style={styles.badgeItem}>
                                <View style={[styles.badgeIconBg, { backgroundColor: badge.bg }]}>
                                    <badge.icon size={20} color={badge.color} />
                                </View>
                                <Text style={styles.badgeName}>{badge.name}</Text>
                            </View>
                        ))}
                    </View>
                </Card>

                {/* Settings Section */}
                <Card style={styles.settingsCard} elevation={0}>
                    <SettingItem
                        icon={Moon}
                        label="Dark Mode"
                        sublabel="Toggle dark theme"
                        isSwitch
                        value={darkMode}
                        onToggle={setDarkMode}
                    />
                    <Divider style={styles.divider} />
                    <SettingItem
                        icon={Bell}
                        label="Notifications"
                        sublabel="Get event and challenge alerts"
                        isSwitch
                        value={notifications}
                        onToggle={setNotifications}
                    />
                    <Divider style={styles.divider} />
                    <SettingItem
                        icon={MapPin}
                        label="Location Services"
                        sublabel="Find events near you"
                        isSwitch
                        value={locationServices}
                        onToggle={setLocationServices}
                    />
                    <Divider style={styles.divider} />
                    <SettingItem
                        icon={ShieldCheck}
                        label="Privacy"
                        sublabel="Show profile in leaderboards"
                        isSwitch
                        value={privacy}
                        onToggle={setPrivacy}
                    />
                </Card>

                {/* Account Info */}
                <Card style={styles.infoCard} elevation={0}>
                    <Text style={styles.cardTitle}>Account Information</Text>
                    <View style={{ height: 16 }} />
                    <InfoRow icon={Mail} label="Email" value={user?.email || 'N/A'} />
                    <InfoRow icon={User} label="Member since" value={memberSince} highlight />
                    <InfoRow icon={Award} label="Eco Score" value={`${ecoScore} pts`} color="#00BFA5" />
                </Card>

                <Button
                    mode="outlined"
                    onPress={onLogout}
                    textColor="#D32F2F"
                    style={[styles.logoutBtn, { borderColor: '#FFCDD2' }]}
                    icon={() => <LogOut size={16} color="#D32F2F" />}
                >
                    Log Out
                </Button>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* ─── Edit Profile Modal ─── */}
            <Modal visible={showEditModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.modalContainer}
                    >
                        {/* Modal Header */}
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>Edit Profile</Text>
                                <Text style={styles.modalSubtitle}>Update your personal information</Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowEditModal(false)} style={styles.closeBtn}>
                                <X size={20} color={Colors.text} />
                            </TouchableOpacity>
                        </View>

                        {/* Avatar Preview */}
                        <View style={styles.editAvatarSection}>
                            <Avatar.Text
                                size={72}
                                label={editName?.substring(0, 2).toUpperCase() || 'EW'}
                                style={{ backgroundColor: '#00BFA5' }}
                                labelStyle={{ color: '#fff', fontWeight: 'bold', fontSize: 22 }}
                            />
                            <Text style={styles.editAvatarHint}>Avatar updates with your initials</Text>
                        </View>

                        {/* Name Input */}
                        <Text style={styles.formLabel}>Full Name</Text>
                        <View style={styles.inputWrapper}>
                            <User size={16} color={Colors.textSecondary} />
                            <TextInput
                                value={editName}
                                onChangeText={setEditName}
                                placeholder="Your name"
                                placeholderTextColor={Colors.textLight}
                                mode="flat"
                                style={styles.inputField}
                                underlineColor="transparent"
                                activeUnderlineColor="transparent"
                                autoCapitalize="words"
                            />
                        </View>

                        {/* Email Input */}
                        <Text style={styles.formLabel}>Email Address</Text>
                        <View style={styles.inputWrapper}>
                            <Mail size={16} color={Colors.textSecondary} />
                            <TextInput
                                value={editEmail}
                                onChangeText={setEditEmail}
                                placeholder="your@email.com"
                                placeholderTextColor={Colors.textLight}
                                mode="flat"
                                style={styles.inputField}
                                underlineColor="transparent"
                                activeUnderlineColor="transparent"
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>

                        {/* Change indicators */}
                        <View style={styles.changeIndicators}>
                            {editName.trim() !== (user?.name || '') && (
                                <View style={styles.changeChip}>
                                    <Pencil size={12} color="#00897B" />
                                    <Text style={styles.changeChipText}>Name will be updated</Text>
                                </View>
                            )}
                            {editEmail.trim().toLowerCase() !== (user?.email || '') && (
                                <View style={styles.changeChip}>
                                    <Pencil size={12} color="#00897B" />
                                    <Text style={styles.changeChipText}>Email will be updated</Text>
                                </View>
                            )}
                        </View>

                        {/* Save Button */}
                        <Button
                            mode="contained"
                            onPress={handleSaveProfile}
                            loading={saving}
                            disabled={saving}
                            buttonColor="#00BFA5"
                            style={styles.saveBtn}
                            contentStyle={{ height: 52 }}
                            labelStyle={{ fontSize: 16, fontWeight: '800' }}
                            icon={() => !saving ? <Check size={18} color="#fff" /> : null}
                        >
                            Save Changes
                        </Button>

                        <TouchableOpacity onPress={() => setShowEditModal(false)} style={styles.cancelBtn}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </View>
    );
};

const SettingItem = ({ icon: Icon, label, sublabel, isSwitch, value, onToggle }: any) => (
    <View style={styles.settingItem}>
        <Icon size={20} color="#37474F" style={{ marginTop: 2 }} />
        <View style={styles.settingText}>
            <Text style={styles.settingLabel}>{label}</Text>
            {sublabel && <Text style={styles.settingSublabel}>{sublabel}</Text>}
        </View>
        {isSwitch && (
            <Switch value={value} onValueChange={onToggle} color="#00BFA5" />
        )}
    </View>
);

const InfoRow = ({ icon: Icon, label, value, color, highlight }: any) => (
    <View style={styles.infoRow}>
        <Icon size={18} color="#546E7A" />
        <Text style={styles.infoLabel}>{label}:</Text>
        <Text style={[styles.infoValue, color && { color }, highlight && { fontWeight: '700' }]}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    content: { padding: 20 },

    header: { marginTop: 10, marginBottom: 20 },
    headerTitle: { fontSize: 28, fontWeight: '800', color: '#004D40' },
    headerSubtitle: { fontSize: 14, color: '#546E7A', marginTop: 4 },

    profileCard: {
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#B2DFDB',
        marginBottom: 24
    },
    avatarContainer: { position: 'relative', marginBottom: 16 },
    smallBadge: {
        position: 'absolute',
        bottom: 0,
        right: -4,
        backgroundColor: '#0288D1',
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#E0F2F1'
    },
    userName: { fontSize: 20, fontWeight: '800', color: '#004D40', marginBottom: 4 },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 },
    locationText: { fontSize: 13, color: '#546E7A' },

    badgeRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    pBadge: { backgroundColor: '#00BFA5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    pBadgeLight: { backgroundColor: '#E1F5FE' },
    pBadgeText: { color: '#fff', fontSize: 13, fontWeight: '700' },

    editBtn: { backgroundColor: '#fff', borderColor: '#B2DFDB', width: 150 },

    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#004D40', marginBottom: 16 },

    statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    statCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0F2F1'
    },
    statValue: { fontSize: 18, fontWeight: '800', color: '#263238', marginBottom: 2 },
    statLabel: { fontSize: 11, color: '#546E7A' },

    badgesCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#E0F2F1'
    },
    cardTitle: { fontSize: 16, fontWeight: '700', color: '#004D40', marginBottom: 4 },
    cardSubtitle: { fontSize: 13, color: '#546E7A', marginBottom: 20 },
    badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    badgeItem: { width: '30%', alignItems: 'center', marginBottom: 12 },
    badgeIconBg: {
        width: 48, height: 48, borderRadius: 12,
        justifyContent: 'center', alignItems: 'center', marginBottom: 8
    },
    badgeName: { fontSize: 11, textAlign: 'center', color: '#37474F', lineHeight: 14 },

    settingsCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#E0F2F1',
        marginBottom: 24,
        paddingVertical: 8
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    settingText: { flex: 1, marginLeft: 16 },
    settingLabel: { fontSize: 15, fontWeight: '600', color: '#263238' },
    settingSublabel: { fontSize: 12, color: '#78909C', marginTop: 2 },
    divider: { backgroundColor: '#F0F2F5', height: 1 },

    infoCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#E0F2F1',
        padding: 24,
        marginBottom: 24
    },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
    infoLabel: { fontSize: 14, color: '#546E7A', width: 100 },
    infoValue: { fontSize: 14, color: '#263238', fontWeight: '500' },

    logoutBtn: { backgroundColor: '#FFEBEE', borderColor: '#FFEBEE', marginBottom: 20 },

    // ─── Edit Profile Modal ────────────────
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
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
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
    modalTitle: { fontSize: 22, fontWeight: '800', color: '#004D40' },
    modalSubtitle: { fontSize: 13, color: '#546E7A', marginTop: 4 },
    closeBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: '#F0F2F5',
        justifyContent: 'center', alignItems: 'center',
    },
    editAvatarSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    editAvatarHint: {
        fontSize: 12,
        color: '#78909C',
        marginTop: 10,
    },
    formLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#004D40',
        marginBottom: 8,
        marginTop: 8,
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
        marginBottom: 8,
    },
    inputField: {
        flex: 1,
        backgroundColor: 'transparent',
        height: 52,
        fontSize: 15,
        color: '#263238',
        fontWeight: '500',
    },
    changeIndicators: {
        marginTop: 8,
        marginBottom: 16,
        gap: 6,
    },
    changeChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E0F2F1',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        gap: 6,
        alignSelf: 'flex-start',
    },
    changeChipText: {
        fontSize: 12,
        color: '#00897B',
        fontWeight: '600',
    },
    saveBtn: {
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
        color: '#546E7A',
    },
});
