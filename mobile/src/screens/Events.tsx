import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Card, Button, TextInput } from 'react-native-paper';
import { Colors } from '../theme/colors';
import {
    Calendar,
    ChevronLeft,
    MapPin,
    Clock,
    Users,
    Plus,
    Filter,
    X,
    FileText,
    User,
    Hash
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getEvents, joinEvent, createEvent } from '../services/event.service';
import { useAuthStore } from '../store/useAuthStore';

export const Events = ({ onBack }: any) => {
    const { user } = useAuthStore();
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'upcoming' | 'hosting'>('upcoming');

    // Host event modal
    const [showHostModal, setShowHostModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState({
        title: '',
        description: '',
        organizer: user?.name || '',
        date: '',
        time: '',
        locationName: '',
        lat: '',
        lng: '',
        maxParticipants: '50',
    });

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const result = await getEvents();
            if (result?.data) {
                setEvents(result.data);
            }
        } catch (e) {
            console.log('Events error:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async (eventId: string, eventTitle: string) => {
        try {
            await joinEvent(eventId);
            Alert.alert('Success! 🎉', `You have joined "${eventTitle}"`);
            fetchEvents();
        } catch (error: any) {
            Alert.alert('Join Event', error.toString());
        }
    };

    const handleCreateEvent = async () => {
        // Validate required fields
        if (!form.title || !form.description || !form.date || !form.time || !form.locationName) {
            Alert.alert('Missing Fields', 'Please fill in all required fields (title, description, date, time, location).');
            return;
        }

        if (form.title.length < 3) {
            Alert.alert('Invalid Title', 'Title must be at least 3 characters.');
            return;
        }

        if (form.description.length < 10) {
            Alert.alert('Invalid Description', 'Description must be at least 10 characters.');
            return;
        }

        // Parse coordinates (default to 0,0 if empty — user can update later)
        const lat = parseFloat(form.lat) || 28.6139; // Default: Delhi
        const lng = parseFloat(form.lng) || 77.2090;

        setCreating(true);
        try {
            const result = await createEvent({
                title: form.title.trim(),
                description: form.description.trim(),
                organizer: form.organizer.trim() || user?.name || 'Anonymous',
                date: form.date.trim(),
                time: form.time.trim(),
                locationName: form.locationName.trim(),
                lat,
                lng,
                maxParticipants: parseInt(form.maxParticipants) || 50,
            });

            Alert.alert('Event Created! 🎉', result.message || 'Your event is now live!');
            setShowHostModal(false);
            resetForm();
            fetchEvents();
        } catch (error: any) {
            const msg = typeof error === 'string' ? error : error?.message || 'Failed to create event';
            Alert.alert('Create Failed', msg);
        } finally {
            setCreating(false);
        }
    };

    const resetForm = () => {
        setForm({
            title: '',
            description: '',
            organizer: user?.name || '',
            date: '',
            time: '',
            locationName: '',
            lat: '',
            lng: '',
            maxParticipants: '50',
        });
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                        <ChevronLeft size={24} color={Colors.text} />
                    </TouchableOpacity>
                    <View style={styles.headerText}>
                        <Text style={styles.title}>Eco Events</Text>
                        <Text style={styles.subtitle}>Community actions near you</Text>
                    </View>
                    <TouchableOpacity style={styles.filterBtn}>
                        <Filter size={20} color={Colors.primary} />
                    </TouchableOpacity>
                </View>

                {/* Tabs */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
                        onPress={() => setActiveTab('upcoming')}
                    >
                        <Text style={activeTab === 'upcoming' ? styles.activeTabText : styles.tabText}>Upcoming</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'hosting' && styles.activeTab]}
                        onPress={() => setActiveTab('hosting')}
                    >
                        <Text style={activeTab === 'hosting' ? styles.activeTabText : styles.tabText}>Your Hosting</Text>
                    </TouchableOpacity>
                </View>

                {/* Host Event CTA */}
                <LinearGradient
                    colors={[Colors.secondary, '#1F2937']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.createCard}
                >
                    <View style={styles.createContent}>
                        <View>
                            <Text style={styles.createTitle}>Have an idea?</Text>
                            <Text style={styles.createSubtitle}>Host your own cleanup or planting event</Text>
                        </View>
                        <TouchableOpacity style={styles.plusBtn} onPress={() => setShowHostModal(true)}>
                            <Plus size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </LinearGradient>

                <Text style={styles.sectionTitle}>
                    {activeTab === 'upcoming' ? 'Featured Events' : 'Events You Host'}
                </Text>

                {loading ? (
                    <View style={{ padding: 40, alignItems: 'center' }}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                        <Text style={{ marginTop: 12, color: Colors.textSecondary }}>Loading events...</Text>
                    </View>
                ) : events.length === 0 ? (
                    <Card style={styles.eventCard} elevation={0}>
                        <Text style={{ textAlign: 'center', color: Colors.textSecondary, padding: 20 }}>
                            No upcoming events. Be the first to host one!
                        </Text>
                    </Card>
                ) : (
                    events.map((event) => (
                        <EventCard
                            key={event.id}
                            id={event.id}
                            title={event.title}
                            organizer={event.organizer}
                            date={formatDate(event.date)}
                            time={event.time}
                            location={event.locationName}
                            participants={`${event.currentParticipants} / ${event.maxParticipants}`}
                            onJoin={() => handleJoin(event.id, event.title)}
                        />
                    ))
                )}
            </ScrollView>

            {/* ─── Host Event Modal ─── */}
            <Modal visible={showHostModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.modalContainer}
                    >
                        <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                            {/* Modal Header */}
                            <View style={styles.modalHeader}>
                                <View>
                                    <Text style={styles.modalTitle}>Host an Event</Text>
                                    <Text style={styles.modalSubtitle}>Create a cleanup or planting drive</Text>
                                </View>
                                <TouchableOpacity onPress={() => setShowHostModal(false)} style={styles.closeBtn}>
                                    <X size={20} color={Colors.text} />
                                </TouchableOpacity>
                            </View>

                            {/* Form Fields */}
                            <FormField
                                label="Event Title *"
                                icon={<FileText size={16} color={Colors.textSecondary} />}
                                placeholder="e.g. Community Tree Planting"
                                value={form.title}
                                onChangeText={(v: string) => setForm({ ...form, title: v })}
                            />

                            <Text style={styles.formLabel}>Description *</Text>
                            <TextInput
                                value={form.description}
                                onChangeText={(v) => setForm({ ...form, description: v })}
                                placeholder="Describe your event in detail..."
                                placeholderTextColor={Colors.textLight}
                                multiline
                                numberOfLines={3}
                                mode="flat"
                                style={styles.textArea}
                                underlineColor="transparent"
                                activeUnderlineColor={Colors.primary}
                            />

                            <FormField
                                label="Organizer Name"
                                icon={<User size={16} color={Colors.textSecondary} />}
                                placeholder={user?.name || 'Your name'}
                                value={form.organizer}
                                onChangeText={(v: string) => setForm({ ...form, organizer: v })}
                            />

                            <View style={styles.row}>
                                <View style={styles.halfField}>
                                    <FormField
                                        label="Date *"
                                        icon={<Calendar size={16} color={Colors.textSecondary} />}
                                        placeholder="2026-03-15"
                                        value={form.date}
                                        onChangeText={(v: string) => setForm({ ...form, date: v })}
                                    />
                                </View>
                                <View style={styles.halfField}>
                                    <FormField
                                        label="Time *"
                                        icon={<Clock size={16} color={Colors.textSecondary} />}
                                        placeholder="10:00 AM"
                                        value={form.time}
                                        onChangeText={(v: string) => setForm({ ...form, time: v })}
                                    />
                                </View>
                            </View>

                            <FormField
                                label="Location Name *"
                                icon={<MapPin size={16} color={Colors.textSecondary} />}
                                placeholder="e.g. Central Park, Delhi"
                                value={form.locationName}
                                onChangeText={(v: string) => setForm({ ...form, locationName: v })}
                            />

                            <View style={styles.row}>
                                <View style={styles.halfField}>
                                    <FormField
                                        label="Latitude"
                                        icon={<MapPin size={16} color={Colors.textSecondary} />}
                                        placeholder="28.6139"
                                        value={form.lat}
                                        onChangeText={(v: string) => setForm({ ...form, lat: v })}
                                        keyboardType="numeric"
                                    />
                                </View>
                                <View style={styles.halfField}>
                                    <FormField
                                        label="Longitude"
                                        icon={<MapPin size={16} color={Colors.textSecondary} />}
                                        placeholder="77.2090"
                                        value={form.lng}
                                        onChangeText={(v: string) => setForm({ ...form, lng: v })}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>

                            <FormField
                                label="Max Participants"
                                icon={<Hash size={16} color={Colors.textSecondary} />}
                                placeholder="50"
                                value={form.maxParticipants}
                                onChangeText={(v: string) => setForm({ ...form, maxParticipants: v })}
                                keyboardType="numeric"
                            />

                            {/* Info Banner */}
                            <View style={styles.infoBanner}>
                                <Text style={styles.infoText}>
                                    🌟 You'll earn <Text style={{ fontWeight: '800', color: Colors.primary }}>+10 eco score</Text> for hosting an event!
                                </Text>
                            </View>

                            {/* Submit Button */}
                            <Button
                                mode="contained"
                                onPress={handleCreateEvent}
                                loading={creating}
                                disabled={creating}
                                buttonColor={Colors.primary}
                                style={styles.submitBtn}
                                contentStyle={{ height: 52 }}
                                labelStyle={{ fontSize: 16, fontWeight: '800' }}
                            >
                                Create Event
                            </Button>

                            <TouchableOpacity onPress={() => setShowHostModal(false)} style={styles.cancelBtn}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>

                            <View style={{ height: 40 }} />
                        </ScrollView>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </View>
    );
};

const FormField = ({ label, icon, placeholder, value, onChangeText, keyboardType }: any) => (
    <View style={{ marginBottom: 14 }}>
        <Text style={styles.formLabel}>{label}</Text>
        <View style={styles.inputWrapper}>
            {icon}
            <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={Colors.textLight}
                mode="flat"
                style={styles.inputField}
                underlineColor="transparent"
                activeUnderlineColor="transparent"
                keyboardType={keyboardType || 'default'}
            />
        </View>
    </View>
);

const EventCard = ({ id, title, organizer, date, time, location, participants, onJoin }: any) => (
    <Card style={styles.eventCard} elevation={2}>
        <View style={styles.eventHeader}>
            <View style={styles.eventImgBg}>
                <Calendar size={28} color={Colors.primary} />
            </View>
            <View style={styles.eventInfo}>
                <Text style={styles.eventTitle}>{title}</Text>
                <Text style={styles.eventOrganizer}>by {organizer}</Text>
            </View>
        </View>

        <View style={styles.detailsGrid}>
            <DetailItem icon={<Calendar size={14} color={Colors.textSecondary} />} text={date} />
            <DetailItem icon={<Clock size={14} color={Colors.textSecondary} />} text={time} />
            <DetailItem icon={<MapPin size={14} color={Colors.textSecondary} />} text={location} />
            <DetailItem icon={<Users size={14} color={Colors.textSecondary} />} text={`${participants} joined`} />
        </View>

        <View style={styles.actions}>
            <Button
                mode="contained"
                style={styles.rsvpBtn}
                buttonColor={Colors.primary}
                onPress={onJoin}
            >
                RSVP Now
            </Button>
            <Button
                mode="outlined"
                style={styles.detailsBtn}
                textColor={Colors.secondary}
                onPress={() => Alert.alert('Event Details', `${title}\n\n📍 ${location}\n📅 ${date}\n⏰ ${time}\n👥 ${participants} joined`)}
            >
                Details
            </Button>
        </View>
    </Card>
);

const DetailItem = ({ icon, text }: any) => (
    <View style={styles.detailItem}>
        {icon}
        <Text style={styles.detailText}>{text}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    content: { padding: 20, paddingBottom: 60 },
    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 25, marginTop: 10 },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 2 },
    headerText: { flex: 1, marginLeft: 15 },
    title: { fontSize: 24, fontWeight: '900', color: Colors.text },
    subtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
    filterBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 2 },

    tabContainer: { flexDirection: 'row', backgroundColor: '#F0F2F5', borderRadius: 14, padding: 4, marginBottom: 25 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    activeTab: { backgroundColor: '#fff', elevation: 2 },
    activeTabText: { fontSize: 13, fontWeight: '800', color: Colors.text },
    tabText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },

    createCard: { borderRadius: 24, padding: 20, marginBottom: 30 },
    createContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    createTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
    createSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
    plusBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center' },

    sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: 16 },

    eventCard: { backgroundColor: '#fff', borderRadius: 24, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#F0F2F5' },
    eventHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    eventImgBg: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#F8FAF5', justifyContent: 'center', alignItems: 'center' },
    eventInfo: { marginLeft: 16, flex: 1 },
    eventTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
    eventOrganizer: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },

    detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
    detailItem: { flexDirection: 'row', alignItems: 'center', width: '50%', marginBottom: 10, gap: 8 },
    detailText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },

    actions: { flexDirection: 'row', gap: 12 },
    rsvpBtn: { flex: 2, borderRadius: 14 },
    detailsBtn: { flex: 1, borderRadius: 14, borderColor: '#F0F2F5' },

    // ─── Modal Styles ────────────────────────────
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        maxHeight: '92%',
        paddingTop: 8,
    },
    modalScroll: {
        paddingHorizontal: 24,
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
        height: 48,
        borderWidth: 1,
        borderColor: '#E8F5E9',
        gap: 10,
    },
    inputField: {
        flex: 1,
        backgroundColor: 'transparent',
        height: 48,
        fontSize: 14,
        color: Colors.text,
        fontWeight: '500',
    },
    textArea: {
        backgroundColor: '#F8FAF5',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E8F5E9',
        paddingHorizontal: 16,
        fontSize: 14,
        color: Colors.text,
        minHeight: 80,
        marginBottom: 14,
        textAlignVertical: 'top',
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    halfField: {
        flex: 1,
    },
    infoBanner: {
        backgroundColor: '#E8F5E9',
        borderRadius: 14,
        padding: 14,
        marginVertical: 16,
        alignItems: 'center',
    },
    infoText: {
        fontSize: 13,
        color: Colors.text,
        fontWeight: '500',
        textAlign: 'center',
    },
    submitBtn: {
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
