import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Avatar, Switch, Button, TextInput } from 'react-native-paper';
import { Colors, getColors } from '../theme/colors';
import {
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
    Sprout,
    Moon,
    X,
    Check,
    Pencil,
    ChevronRight,
    Footprints,
    Zap,
    Leaf,
    Lock,
    Calendar,
    Target,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { getMyRank } from '../services/leaderboard.service';
import { getCalculatorStats, updateProfile, changePassword, deleteAccount } from '../services/auth.service';

// Achievement definitions tied to real data
const PROFILE_BADGES = [
    { id: 'first_seed', name: 'First Seed', icon: Sprout, color: '#8BC34A', bg: '#F1F8E9', check: (t: number, s: number, l: number) => t >= 1 },
    { id: 'tree_hugger', name: 'Tree Hugger', icon: TreeDeciduous, color: '#4CAF50', bg: '#E8F5E9', check: (t: number, s: number, l: number) => t >= 10 },
    { id: 'eco_starter', name: 'Eco Starter', icon: Award, color: '#FFC107', bg: '#FFF8E1', check: (t: number, s: number, l: number) => s >= 100 },
    { id: 'level_3', name: 'Level Up', icon: Zap, color: '#0288D1', bg: '#E3F2FD', check: (t: number, s: number, l: number) => l >= 3 },
    { id: 'fifty_trees', name: '50 Trees', icon: Leaf, color: '#009688', bg: '#E0F2F1', check: (t: number, s: number, l: number) => t >= 50 },
    { id: 'eco_warrior', name: 'Eco Warrior', icon: Trophy, color: '#F59E0B', bg: '#FFF8E1', check: (t: number, s: number, l: number) => s >= 500 },
    { id: 'fire_streak', name: 'On Fire', icon: Flame, color: '#EF6C00', bg: '#FFF3E0', check: (t: number, s: number, l: number) => l >= 5 },
    { id: 'century', name: 'Century Club', icon: TreeDeciduous, color: '#2E7D32', bg: '#E8F5E9', check: (t: number, s: number, l: number) => t >= 100 },
];

export const Profile = ({ onLogout, onNavigate }: any) => {
    const { user, updateUser } = useAuthStore();
    const { isDarkMode, toggleDarkMode } = useThemeStore();
    const [notifications, setNotifications] = useState(true);
    const [locationServices, setLocationServices] = useState(true);
    const [privacy, setPrivacy] = useState(true);

    const handlePrivacyToggle = async (value: boolean) => {
        setPrivacy(value);
        try {
            await updateProfile({ isPublic: value } as any);
        } catch (e) {
            console.log('Privacy update error:', e);
            setPrivacy(!value); // revert on failure
        }
    };
    const [myRank, setMyRank] = useState<number | null>(null);
    const [stats, setStats] = useState<any>(null);

    // Edit Profile State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editName, setEditName] = useState(user?.name || '');
    const [editEmail, setEditEmail] = useState(user?.email || '');
    const [saving, setSaving] = useState(false);

    // Password Change State
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [currentPwd, setCurrentPwd] = useState('');
    const [newPwd, setNewPwd] = useState('');
    const [confirmPwd, setConfirmPwd] = useState('');
    const [changingPwd, setChangingPwd] = useState(false);

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
        if (!editName.trim() || editName.trim().length < 2) {
            Alert.alert('Invalid Name', 'Name must be at least 2 characters.');
            return;
        }
        if (!editEmail.trim() || !editEmail.includes('@')) {
            Alert.alert('Invalid Email', 'Please enter a valid email address.');
            return;
        }
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

    const handleChangePassword = async () => {
        if (!currentPwd || !newPwd) {
            Alert.alert('Missing Fields', 'Please fill in all password fields.');
            return;
        }
        if (newPwd.length < 6) {
            Alert.alert('Weak Password', 'New password must be at least 6 characters.');
            return;
        }
        if (newPwd !== confirmPwd) {
            Alert.alert('Mismatch', 'New password and confirmation do not match.');
            return;
        }
        setChangingPwd(true);
        try {
            await changePassword(currentPwd, newPwd);
            Alert.alert('Success ✅', 'Password changed successfully!');
            setShowPasswordModal(false);
            setCurrentPwd('');
            setNewPwd('');
            setConfirmPwd('');
        } catch (error: any) {
            const msg = typeof error === 'string' ? error : error?.message || 'Failed to change password';
            Alert.alert('Error', msg);
        } finally {
            setChangingPwd(false);
        }
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            '⚠️ Delete Account',
            'This action is permanent and cannot be undone. All your data including eco plans, activity logs, carbon bills, and friend connections will be permanently deleted.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete Forever',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteAccount();
                            Alert.alert('Account Deleted', 'Your account has been permanently deleted.');
                            onLogout();
                        } catch (error: any) {
                            const msg = typeof error === 'string' ? error : error?.message || 'Failed to delete account';
                            Alert.alert('Error', msg);
                        }
                    },
                },
            ],
        );
    };

    const treesPlanted = stats?.totalTreesPlanted ?? user?.totalTreesPlanted ?? 0;
    const ecoScore = stats?.ecoScore ?? user?.ecoScore ?? 0;
    const carbonDebt = stats?.carbonDebt ?? user?.carbonDebt ?? 0;
    const level = stats?.level ?? user?.level ?? 1;
    const memberSince = user?.createdAt
        ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        : 'Member';

    // Compute badges from real data
    const badges = PROFILE_BADGES.map(b => ({
        ...b,
        achieved: b.check(treesPlanted, ecoScore, level),
    }));
    const achievedCount = badges.filter(b => b.achieved).length;

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Profile</Text>
                    <TouchableOpacity onPress={openEditModal} style={styles.editHeaderBtn}>
                        <Pencil size={16} color={Colors.text} />
                    </TouchableOpacity>
                </View>

                {/* Profile Card */}
                <LinearGradient
                    colors={['#065F46', '#064E3B']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.profileCard}
                >
                    <View style={styles.profileCardContent}>
                        <View style={styles.avatarContainer}>
                            <Avatar.Text
                                size={72}
                                label={user?.name?.substring(0, 2).toUpperCase() || 'EW'}
                                style={styles.avatar}
                                labelStyle={{ color: '#065F46', fontWeight: '800', fontSize: 24 }}
                            />
                            <View style={styles.levelBadge}>
                                <Text style={styles.levelBadgeText}>{level}</Text>
                            </View>
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={styles.userName}>{user?.name || 'Eco Warrior'}</Text>
                            <View style={styles.emailRow}>
                                <Mail size={12} color="rgba(255,255,255,0.5)" />
                                <Text style={styles.emailText} numberOfLines={1}>{user?.email || ''}</Text>
                            </View>
                            <View style={styles.profileTagsRow}>
                                <View style={styles.profileTag}>
                                    <Text style={styles.profileTagText}>
                                        {myRank ? `Rank #${myRank}` : 'Unranked'}
                                    </Text>
                                </View>
                                <View style={[styles.profileTag, { backgroundColor: 'rgba(251,191,36,0.2)' }]}>
                                    <Text style={[styles.profileTagText, { color: '#FCD34D' }]}>
                                        Since {memberSince}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </LinearGradient>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                        <View style={[styles.statIconBg, { backgroundColor: '#F0FDF4' }]}>
                            <TreeDeciduous size={18} color={Colors.primary} />
                        </View>
                        <Text style={styles.statValue}>{treesPlanted}</Text>
                        <Text style={styles.statLabel}>Trees</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statBox}>
                        <View style={[styles.statIconBg, { backgroundColor: '#FFF8E1' }]}>
                            <Trophy size={18} color="#F59E0B" />
                        </View>
                        <Text style={styles.statValue}>{ecoScore}</Text>
                        <Text style={styles.statLabel}>Eco Score</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statBox}>
                        <View style={[styles.statIconBg, { backgroundColor: '#EFF6FF' }]}>
                            <Target size={18} color="#3B82F6" />
                        </View>
                        <Text style={styles.statValue}>{myRank ? `#${myRank}` : '—'}</Text>
                        <Text style={styles.statLabel}>Rank</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statBox}>
                        <View style={[styles.statIconBg, { backgroundColor: '#FFF7ED' }]}>
                            <Flame size={18} color="#EA580C" />
                        </View>
                        <Text style={styles.statValue}>{carbonDebt.toFixed(0)}</Text>
                        <Text style={styles.statLabel}>CO₂ Debt</Text>
                    </View>
                </View>

                {/* Tools Section */}
                <Text style={styles.sectionTitle}>Tools</Text>
                <View style={styles.card}>
                    <ToolRow
                        icon={Footprints}
                        iconBg="#F0FDF4"
                        iconColor={Colors.primary}
                        title="Carbon Calculator"
                        subtitle="Calculate your lifetime carbon footprint"
                        onPress={() => onNavigate?.('calculator')}
                    />
                    <View style={styles.toolDivider} />
                    <ToolRow
                        icon={Calendar}
                        iconBg="#EFF6FF"
                        iconColor="#3B82F6"
                        title="Eco Plan"
                        subtitle="Get a personalized sustainability plan"
                        onPress={() => onNavigate?.('ecoPlan')}
                    />
                </View>

                {/* Badges Section */}
                <View style={styles.badgeSectionHeader}>
                    <Text style={styles.sectionTitle}>Badges</Text>
                    <View style={styles.badgeCountChip}>
                        <Text style={styles.badgeCountText}>{achievedCount}/{PROFILE_BADGES.length}</Text>
                    </View>
                </View>
                <View style={styles.card}>
                    <View style={styles.badgesGrid}>
                        {badges.map((badge) => {
                            const IconComp = badge.icon;
                            return (
                                <View key={badge.id} style={[styles.badgeItem, !badge.achieved && styles.badgeItemLocked]}>
                                    <View style={[styles.badgeIconBg, { backgroundColor: badge.achieved ? badge.bg : '#F1F5F9' }]}>
                                        <IconComp size={20} color={badge.achieved ? badge.color : '#CBD5E1'} />
                                        {!badge.achieved && (
                                            <View style={styles.badgeLockIcon}>
                                                <Lock size={8} color="#94A3B8" />
                                            </View>
                                        )}
                                    </View>
                                    <Text style={[styles.badgeName, !badge.achieved && styles.badgeNameLocked]} numberOfLines={1}>
                                        {badge.name}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* Settings Section */}
                <Text style={styles.sectionTitle}>Preferences</Text>
                <View style={styles.card}>
                    <SettingItem
                        icon={Moon}
                        label="Dark Mode"
                        sublabel="Toggle dark theme"
                        isSwitch
                        value={isDarkMode}
                        onToggle={toggleDarkMode}
                    />
                    <View style={styles.settingDivider} />
                    <SettingItem
                        icon={Bell}
                        label="Notifications"
                        sublabel="Event and challenge alerts"
                        isSwitch
                        value={notifications}
                        onToggle={setNotifications}
                    />
                    <View style={styles.settingDivider} />
                    <SettingItem
                        icon={MapPin}
                        label="Location"
                        sublabel="Find events near you"
                        isSwitch
                        value={locationServices}
                        onToggle={setLocationServices}
                    />
                    <View style={styles.settingDivider} />
                    <SettingItem
                        icon={ShieldCheck}
                        label="Privacy"
                        sublabel="Show on leaderboards"
                        isSwitch
                        value={privacy}
                        onToggle={handlePrivacyToggle}
                    />
                </View>

                {/* Account Info */}
                <Text style={styles.sectionTitle}>Account</Text>
                <View style={styles.card}>
                    <InfoRow icon={Mail} label="Email" value={user?.email || 'N/A'} />
                    <InfoRow icon={User} label="Member since" value={memberSince} />
                    <InfoRow icon={Award} label="Eco Score" value={`${ecoScore} pts`} color={Colors.primary} isLast />
                </View>

                {/* Security */}
                <Text style={styles.sectionTitle}>Security</Text>
                <View style={styles.card}>
                    <ToolRow
                        icon={Lock}
                        iconBg="#FFF7ED"
                        iconColor="#EA580C"
                        title="Change Password"
                        subtitle="Update your account password"
                        onPress={() => setShowPasswordModal(true)}
                    />
                </View>

                {/* Logout */}
                <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.7}>
                    <LogOut size={18} color="#DC2626" />
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>

                {/* Delete Account */}
                <TouchableOpacity
                    style={[styles.logoutBtn, { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5', marginTop: 12 }]}
                    onPress={handleDeleteAccount}
                    activeOpacity={0.7}
                >
                    <X size={18} color="#DC2626" />
                    <Text style={styles.logoutText}>Delete Account</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* ─── Edit Profile Modal ─── */}
            <Modal visible={showEditModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.modalContainer}
                    >
                        <View style={styles.modalHandle} />
                        <View style={styles.modalHeader}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.modalTitle}>Edit Profile</Text>
                                <Text style={styles.modalSubtitle}>Update your personal information</Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowEditModal(false)} style={styles.closeBtn}>
                                <X size={18} color={Colors.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.editAvatarSection}>
                            <Avatar.Text
                                size={68}
                                label={editName?.substring(0, 2).toUpperCase() || 'EW'}
                                style={styles.avatar}
                                labelStyle={{ color: '#065F46', fontWeight: '800', fontSize: 22 }}
                            />
                            <Text style={styles.editAvatarHint}>Avatar updates with your initials</Text>
                        </View>

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

                        <View style={styles.changeIndicators}>
                            {editName.trim() !== (user?.name || '') && (
                                <View style={styles.changeChip}>
                                    <Pencil size={12} color={Colors.primary} />
                                    <Text style={styles.changeChipText}>Name will be updated</Text>
                                </View>
                            )}
                            {editEmail.trim().toLowerCase() !== (user?.email || '') && (
                                <View style={styles.changeChip}>
                                    <Pencil size={12} color={Colors.primary} />
                                    <Text style={styles.changeChipText}>Email will be updated</Text>
                                </View>
                            )}
                        </View>

                        <Button
                            mode="contained"
                            onPress={handleSaveProfile}
                            loading={saving}
                            disabled={saving}
                            buttonColor={Colors.primary}
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

            {/* ─── Change Password Modal ─── */}
            <Modal visible={showPasswordModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.modalContainer}
                    >
                        <View style={styles.modalHandle} />
                        <View style={styles.modalHeader}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.modalTitle}>Change Password</Text>
                                <Text style={styles.modalSubtitle}>Enter your current and new password</Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowPasswordModal(false)} style={styles.closeBtn}>
                                <X size={18} color={Colors.text} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.formLabel}>Current Password</Text>
                        <View style={styles.inputWrapper}>
                            <Lock size={16} color={Colors.textSecondary} />
                            <TextInput
                                value={currentPwd}
                                onChangeText={setCurrentPwd}
                                placeholder="Current password"
                                placeholderTextColor={Colors.textLight}
                                secureTextEntry
                                mode="flat"
                                style={styles.inputField}
                                underlineColor="transparent"
                                activeUnderlineColor="transparent"
                            />
                        </View>

                        <Text style={styles.formLabel}>New Password</Text>
                        <View style={styles.inputWrapper}>
                            <Lock size={16} color={Colors.textSecondary} />
                            <TextInput
                                value={newPwd}
                                onChangeText={setNewPwd}
                                placeholder="New password (min 6 chars)"
                                placeholderTextColor={Colors.textLight}
                                secureTextEntry
                                mode="flat"
                                style={styles.inputField}
                                underlineColor="transparent"
                                activeUnderlineColor="transparent"
                            />
                        </View>

                        <Text style={styles.formLabel}>Confirm New Password</Text>
                        <View style={styles.inputWrapper}>
                            <Lock size={16} color={Colors.textSecondary} />
                            <TextInput
                                value={confirmPwd}
                                onChangeText={setConfirmPwd}
                                placeholder="Confirm new password"
                                placeholderTextColor={Colors.textLight}
                                secureTextEntry
                                mode="flat"
                                style={styles.inputField}
                                underlineColor="transparent"
                                activeUnderlineColor="transparent"
                            />
                        </View>

                        <Button
                            mode="contained"
                            onPress={handleChangePassword}
                            loading={changingPwd}
                            disabled={changingPwd}
                            buttonColor={Colors.primary}
                            style={[styles.saveBtn, { marginTop: 16 }]}
                            contentStyle={{ height: 52 }}
                            labelStyle={{ fontSize: 16, fontWeight: '800' }}
                            icon={() => !changingPwd ? <Check size={18} color="#fff" /> : null}
                        >
                            Update Password
                        </Button>

                        <TouchableOpacity onPress={() => setShowPasswordModal(false)} style={styles.cancelBtn}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </View>
    );
};

// ── Sub-components ──

const ToolRow = ({ icon: Icon, iconBg, iconColor, title, subtitle, onPress }: any) => (
    <TouchableOpacity style={styles.toolRow} onPress={onPress} activeOpacity={0.6}>
        <View style={[styles.toolIconBg, { backgroundColor: iconBg }]}>
            <Icon size={20} color={iconColor} />
        </View>
        <View style={styles.toolInfo}>
            <Text style={styles.toolTitle}>{title}</Text>
            <Text style={styles.toolSubtitle}>{subtitle}</Text>
        </View>
        <ChevronRight size={18} color={Colors.textLight} />
    </TouchableOpacity>
);

const SettingItem = ({ icon: Icon, label, sublabel, isSwitch, value, onToggle }: any) => (
    <View style={styles.settingItem}>
        <View style={styles.settingIconBg}>
            <Icon size={18} color={Colors.text} />
        </View>
        <View style={styles.settingText}>
            <Text style={styles.settingLabel}>{label}</Text>
            {sublabel && <Text style={styles.settingSublabel}>{sublabel}</Text>}
        </View>
        {isSwitch && (
            <Switch value={value} onValueChange={onToggle} color={Colors.primary} />
        )}
    </View>
);

const InfoRow = ({ icon: Icon, label, value, color, isLast }: any) => (
    <View style={[styles.infoRow, !isLast && styles.infoRowBorder]}>
        <View style={styles.infoIconBg}>
            <Icon size={16} color={Colors.textSecondary} />
        </View>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, color && { color }]}>{value}</Text>
    </View>
);

// ── Styles ──

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerTitle: { fontSize: 28, fontWeight: '900', color: Colors.text },
    editHeaderBtn: {
        width: 40,
        height: 40,
        borderRadius: 14,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
    },

    // Profile Card
    profileCard: {
        borderRadius: 24,
        padding: 22,
        marginBottom: 20,
        elevation: 4,
        shadowColor: '#065F46',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
    },
    profileCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 18,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        backgroundColor: '#D1FAE5',
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.25)',
    },
    levelBadge: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        backgroundColor: Colors.primary,
        width: 26,
        height: 26,
        borderRadius: 13,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#064E3B',
    },
    levelBadgeText: { color: '#fff', fontSize: 11, fontWeight: '900' },
    profileInfo: { flex: 1 },
    userName: { fontSize: 20, fontWeight: '900', color: '#fff' },
    emailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginTop: 4,
    },
    emailText: { fontSize: 12, color: 'rgba(255,255,255,0.55)', flex: 1 },
    profileTagsRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
    },
    profileTag: {
        backgroundColor: 'rgba(16,185,129,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    profileTagText: { fontSize: 11, fontWeight: '700', color: '#34D399' },

    // Stats Row
    statsRow: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 18,
        marginBottom: 24,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    statBox: { flex: 1, alignItems: 'center' },
    statIconBg: {
        width: 36,
        height: 36,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    statValue: { fontSize: 18, fontWeight: '800', color: Colors.text },
    statLabel: { fontSize: 10, color: Colors.textSecondary, marginTop: 2, fontWeight: '600' },
    statDivider: { width: 1, height: 40, backgroundColor: '#F0F2F5' },

    // Section title
    sectionTitle: { fontSize: 17, fontWeight: '800', color: Colors.text, marginBottom: 12 },

    // Card base
    card: {
        backgroundColor: '#fff',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#F0F2F5',
        marginBottom: 24,
        overflow: 'hidden',
    },

    // Tools
    toolRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 14,
    },
    toolIconBg: {
        width: 42,
        height: 42,
        borderRadius: 13,
        justifyContent: 'center',
        alignItems: 'center',
    },
    toolInfo: { flex: 1 },
    toolTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
    toolSubtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
    toolDivider: { height: 1, backgroundColor: '#F3F4F6', marginHorizontal: 16 },

    // Badges
    badgeSectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    badgeCountChip: {
        backgroundColor: '#F0FDF4',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
        marginBottom: 12,
    },
    badgeCountText: { fontSize: 12, fontWeight: '800', color: Colors.primary },
    badgesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 16,
        gap: 10,
    },
    badgeItem: {
        width: '22%',
        alignItems: 'center',
        paddingVertical: 8,
    },
    badgeItemLocked: { opacity: 0.5 },
    badgeIconBg: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    badgeLockIcon: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    badgeName: { fontSize: 10, textAlign: 'center', color: Colors.text, fontWeight: '600', lineHeight: 13 },
    badgeNameLocked: { color: Colors.textLight },

    // Settings
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        gap: 14,
    },
    settingIconBg: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingText: { flex: 1 },
    settingLabel: { fontSize: 15, fontWeight: '600', color: Colors.text },
    settingSublabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
    settingDivider: { height: 1, backgroundColor: '#F3F4F6', marginHorizontal: 16 },

    // Account Info
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        gap: 12,
    },
    infoRowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    infoIconBg: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoLabel: { fontSize: 14, color: Colors.textSecondary, flex: 1 },
    infoValue: { fontSize: 14, color: Colors.text, fontWeight: '600' },

    // Logout
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#FEF2F2',
        borderRadius: 16,
        paddingVertical: 16,
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    logoutText: { fontSize: 15, fontWeight: '700', color: '#DC2626' },

    // ─── Edit Profile Modal ────────────────
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
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
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
    editAvatarSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    editAvatarHint: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 10,
    },
    formLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.text,
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
        color: Colors.text,
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
        backgroundColor: '#F0FDF4',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        gap: 6,
        alignSelf: 'flex-start',
    },
    changeChipText: {
        fontSize: 12,
        color: Colors.primary,
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
        color: Colors.textSecondary,
    },
});
