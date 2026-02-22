import React, { useState, useRef } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Animated,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { Colors } from '../theme/colors';
import {
    Car,
    Zap,
    Utensils,
    Home,
    Recycle,
    ChevronLeft,
    ChevronRight,
    Check,
    TreeDeciduous,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { generateEcoPlan, LifestyleFormData } from '../services/ecoPlan.service';

interface PreferenceFormProps {
    onBack: () => void;
    onPlanGenerated: (plan: any) => void;
}

const STEPS = [
    { title: 'Transport', icon: Car, color: '#E3F2FD' },
    { title: 'Energy', icon: Zap, color: '#FFF8E1' },
    { title: 'Diet', icon: Utensils, color: '#F1F8E9' },
    { title: 'Lifestyle', icon: Home, color: '#FCE4EC' },
    { title: 'Habits', icon: Recycle, color: '#E0F2F1' },
];

const VEHICLE_OPTIONS = [
    { label: 'Car', value: 'car' },
    { label: 'Bike/Scooter', value: 'bike' },
    { label: 'Public Transport', value: 'public_transport' },
    { label: 'Walk/Cycle', value: 'none' },
];

const DIET_OPTIONS = [
    { label: 'Non-Vegetarian', value: 'non_vegetarian' },
    { label: 'Flexitarian', value: 'flexitarian' },
    { label: 'Vegetarian', value: 'vegetarian' },
    { label: 'Vegan', value: 'vegan' },
];

const RECYCLING_OPTIONS = [
    { label: 'Always', value: 'always' },
    { label: 'Sometimes', value: 'sometimes' },
    { label: 'Never', value: 'never' },
];

const TIME_OPTIONS = [
    { label: 'Low (< 2 hrs/week)', value: 'low' },
    { label: 'Medium (2-5 hrs/week)', value: 'medium' },
    { label: 'High (> 5 hrs/week)', value: 'high' },
];

const OWNERSHIP_OPTIONS = [
    { label: 'Own', value: 'own' },
    { label: 'Rent', value: 'rent' },
];

export const PreferenceForm = ({ onBack, onPlanGenerated }: PreferenceFormProps) => {
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const fadeAnim = useRef(new Animated.Value(1)).current;

    // Form state
    const [form, setForm] = useState<LifestyleFormData>({
        commuteDistance: 0,
        vehicleType: 'car',
        monthlyElectricity: 0,
        age: 25,
        city: '',
        dietaryPreference: 'non_vegetarian',
        meatMealsPerWeek: 7,
        hasGarden: false,
        homeOwnership: 'rent',
        householdSize: 1,
        acUsageHours: 0,
        wasteRecycling: 'sometimes',
        monthlyGroceryBill: 0,
        willingnessChangeDiet: 3,
        willingnessPublicTransport: 3,
        timeAvailability: 'medium',
    });

    const updateForm = (key: keyof LifestyleFormData, value: any) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const animateTransition = (callback: () => void) => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
        }).start(() => {
            callback();
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }).start();
        });
    };

    const nextStep = () => {
        if (step < STEPS.length - 1) {
            animateTransition(() => setStep(step + 1));
        }
    };

    const prevStep = () => {
        if (step > 0) {
            animateTransition(() => setStep(step - 1));
        }
    };

    const validateForm = (): boolean => {
        if (!form.city.trim()) {
            Alert.alert('Missing Info', 'Please enter your city.');
            return false;
        }
        if (form.age < 10 || form.age > 120) {
            Alert.alert('Invalid Age', 'Please enter a valid age (10-120).');
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setGenerating(true);
        try {
            const result = await generateEcoPlan(form);
            if (result.success) {
                onPlanGenerated(result.data);
            } else {
                Alert.alert('Error', result.message || 'Failed to generate  plan');
            }
        } catch (error) {
            Alert.alert('Error', 'Something went wrong. Please try again.');
        } finally {
            setGenerating(false);
        }
    };

    // ── Option selector component ─────────────────────────────
    const OptionSelector = ({
        options,
        value,
        onSelect,
    }: {
        options: { label: string; value: string }[];
        value: string;
        onSelect: (val: string) => void;
    }) => (
        <View style={styles.optionsRow}>
            {options.map((opt) => (
                <TouchableOpacity
                    key={opt.value}
                    style={[styles.optionBtn, value === opt.value && styles.optionBtnActive]}
                    onPress={() => onSelect(opt.value)}
                >
                    <Text style={[styles.optionText, value === opt.value && styles.optionTextActive]}>
                        {opt.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    // ── Scale selector (1-5) ──────────────────────────────────
    const ScaleSelector = ({
        value,
        onSelect,
        label,
    }: {
        value: number;
        onSelect: (val: number) => void;
        label: string;
    }) => (
        <View style={styles.scaleContainer}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.scaleRow}>
                {[1, 2, 3, 4, 5].map((n) => (
                    <TouchableOpacity
                        key={n}
                        style={[styles.scaleDot, value === n && styles.scaleDotActive]}
                        onPress={() => onSelect(n)}
                    >
                        <Text style={[styles.scaleNum, value === n && styles.scaleNumActive]}>
                            {n}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
            <View style={styles.scaleLabels}>
                <Text style={styles.scaleLabelText}>Not willing</Text>
                <Text style={styles.scaleLabelText}>Very willing</Text>
            </View>
        </View>
    );

    // ── Generating animation screen ───────────────────────────
    if (generating) {
        return (
            <View style={styles.generatingContainer}>
                <LinearGradient colors={['#E0F2F1', '#B2DFDB']} style={styles.generatingCard}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.generatingTitle}>Analyzing your lifestyle...</Text>
                    <Text style={styles.generatingSubtitle}>
                        Creating your personalized 12-month plan...
                    </Text>
                    <Text style={styles.generatingEmoji}>🌍</Text>
                </LinearGradient>
            </View>
        );
    }

    // ── Render each step ─────────────────────────────────────
    const renderStep = () => {
        switch (step) {
            case 0: // Transport
                return (
                    <View>
                        <Text style={styles.label}>Daily Commute Distance (km)</Text>
                        <TextInput
                            mode="outlined"
                            placeholder="e.g. 20"
                            value={form.commuteDistance ? String(form.commuteDistance) : ''}
                            onChangeText={(v) => updateForm('commuteDistance', parseFloat(v) || 0)}
                            keyboardType="numeric"
                            style={styles.input}
                            outlineColor="transparent"
                            activeOutlineColor={Colors.primary}
                            theme={{ roundness: 12 }}
                        />

                        <Text style={styles.label}>Type of Vehicle</Text>
                        <OptionSelector
                            options={VEHICLE_OPTIONS}
                            value={form.vehicleType}
                            onSelect={(v) => updateForm('vehicleType', v)}
                        />

                        <Text style={styles.label}>Your Age</Text>
                        <TextInput
                            mode="outlined"
                            placeholder="e.g. 25"
                            value={form.age ? String(form.age) : ''}
                            onChangeText={(v) => updateForm('age', parseInt(v) || 0)}
                            keyboardType="numeric"
                            style={styles.input}
                            outlineColor="transparent"
                            activeOutlineColor={Colors.primary}
                            theme={{ roundness: 12 }}
                        />

                        <Text style={styles.label}>City</Text>
                        <TextInput
                            mode="outlined"
                            placeholder="e.g. Mumbai"
                            value={form.city}
                            onChangeText={(v) => updateForm('city', v)}
                            style={styles.input}
                            outlineColor="transparent"
                            activeOutlineColor={Colors.primary}
                            theme={{ roundness: 12 }}
                        />
                    </View>
                );

            case 1: // Energy
                return (
                    <View>
                        <Text style={styles.label}>Monthly Electricity Usage (kWh)</Text>
                        <TextInput
                            mode="outlined"
                            placeholder="e.g. 200"
                            value={form.monthlyElectricity ? String(form.monthlyElectricity) : ''}
                            onChangeText={(v) => updateForm('monthlyElectricity', parseFloat(v) || 0)}
                            keyboardType="numeric"
                            style={styles.input}
                            outlineColor="transparent"
                            activeOutlineColor={Colors.primary}
                            theme={{ roundness: 12 }}
                        />

                        <Text style={styles.label}>AC Usage (hours per day in summer)</Text>
                        <TextInput
                            mode="outlined"
                            placeholder="e.g. 6"
                            value={form.acUsageHours ? String(form.acUsageHours) : ''}
                            onChangeText={(v) => updateForm('acUsageHours', parseFloat(v) || 0)}
                            keyboardType="numeric"
                            style={styles.input}
                            outlineColor="transparent"
                            activeOutlineColor={Colors.primary}
                            theme={{ roundness: 12 }}
                        />

                        <Text style={styles.label}>Number of People in Household</Text>
                        <View style={styles.counterRow}>
                            <TouchableOpacity
                                style={styles.counterBtn}
                                onPress={() => updateForm('householdSize', Math.max(1, form.householdSize - 1))}
                            >
                                <Text style={styles.counterBtnText}>−</Text>
                            </TouchableOpacity>
                            <Text style={styles.counterValue}>{form.householdSize}</Text>
                            <TouchableOpacity
                                style={styles.counterBtn}
                                onPress={() => updateForm('householdSize', Math.min(20, form.householdSize + 1))}
                            >
                                <Text style={styles.counterBtnText}>+</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                );

            case 2: // Diet
                return (
                    <View>
                        <Text style={styles.label}>Dietary Preference</Text>
                        <OptionSelector
                            options={DIET_OPTIONS}
                            value={form.dietaryPreference}
                            onSelect={(v) => updateForm('dietaryPreference', v)}
                        />

                        {(form.dietaryPreference === 'non_vegetarian' ||
                            form.dietaryPreference === 'flexitarian') && (
                            <>
                                <Text style={styles.label}>Meals with Meat Per Week</Text>
                                <View style={styles.counterRow}>
                                    <TouchableOpacity
                                        style={styles.counterBtn}
                                        onPress={() =>
                                            updateForm('meatMealsPerWeek', Math.max(0, form.meatMealsPerWeek - 1))
                                        }
                                    >
                                        <Text style={styles.counterBtnText}>−</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.counterValue}>{form.meatMealsPerWeek}</Text>
                                    <TouchableOpacity
                                        style={styles.counterBtn}
                                        onPress={() =>
                                            updateForm('meatMealsPerWeek', Math.min(21, form.meatMealsPerWeek + 1))
                                        }
                                    >
                                        <Text style={styles.counterBtnText}>+</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}

                        <Text style={styles.label}>Monthly Grocery Bill (₹)</Text>
                        <TextInput
                            mode="outlined"
                            placeholder="e.g. 5000"
                            value={form.monthlyGroceryBill ? String(form.monthlyGroceryBill) : ''}
                            onChangeText={(v) => updateForm('monthlyGroceryBill', parseFloat(v) || 0)}
                            keyboardType="numeric"
                            style={styles.input}
                            outlineColor="transparent"
                            activeOutlineColor={Colors.primary}
                            theme={{ roundness: 12 }}
                        />
                    </View>
                );

            case 3: // Lifestyle
                return (
                    <View>
                        <Text style={styles.label}>Do you have a Garden/Balcony?</Text>
                        <View style={styles.optionsRow}>
                            <TouchableOpacity
                                style={[styles.optionBtn, form.hasGarden && styles.optionBtnActive]}
                                onPress={() => updateForm('hasGarden', true)}
                            >
                                <Text style={[styles.optionText, form.hasGarden && styles.optionTextActive]}>
                                    Yes 🌿
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.optionBtn, !form.hasGarden && styles.optionBtnActive]}
                                onPress={() => updateForm('hasGarden', false)}
                            >
                                <Text style={[styles.optionText, !form.hasGarden && styles.optionTextActive]}>
                                    No
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.label}>Home Ownership</Text>
                        <OptionSelector
                            options={OWNERSHIP_OPTIONS}
                            value={form.homeOwnership}
                            onSelect={(v) => updateForm('homeOwnership', v)}
                        />

                        <Text style={styles.label}>Time Available for Eco Activities</Text>
                        <OptionSelector
                            options={TIME_OPTIONS}
                            value={form.timeAvailability}
                            onSelect={(v) => updateForm('timeAvailability', v)}
                        />
                    </View>
                );

            case 4: // Habits
                return (
                    <View>
                        <Text style={styles.label}>Do You Separate Waste for Recycling?</Text>
                        <OptionSelector
                            options={RECYCLING_OPTIONS}
                            value={form.wasteRecycling}
                            onSelect={(v) => updateForm('wasteRecycling', v)}
                        />

                        <ScaleSelector
                            value={form.willingnessChangeDiet}
                            onSelect={(v) => updateForm('willingnessChangeDiet', v)}
                            label="Willingness to Change Diet"
                        />

                        <ScaleSelector
                            value={form.willingnessPublicTransport}
                            onSelect={(v) => updateForm('willingnessPublicTransport', v)}
                            label="Willingness to Use Public Transport"
                        />
                    </View>
                );

            default:
                return null;
        }
    };

    const StepIcon = STEPS[step].icon;

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                        <ChevronLeft size={24} color={Colors.text} />
                    </TouchableOpacity>
                    <View style={styles.headerCenter}>
                        <Text style={styles.headerTitle}>Eco Plan Setup</Text>
                        <Text style={styles.headerSubtitle}>
                            Step {step + 1} of {STEPS.length}
                        </Text>
                    </View>
                    <View style={{ width: 40 }} />
                </View>

                {/* Progress indicators */}
                <View style={styles.progressRow}>
                    {STEPS.map((s, i) => (
                        <View key={i} style={styles.progressItem}>
                            <View
                                style={[
                                    styles.progressDot,
                                    i <= step && styles.progressDotActive,
                                    i < step && styles.progressDotCompleted,
                                ]}
                            >
                                {i < step ? (
                                    <Check size={12} color="#fff" strokeWidth={3} />
                                ) : (
                                    <Text style={[styles.progressNum, i <= step && { color: '#fff' }]}>
                                        {i + 1}
                                    </Text>
                                )}
                            </View>
                            {i < STEPS.length - 1 && (
                                <View style={[styles.progressLine, i < step && styles.progressLineActive]} />
                            )}
                        </View>
                    ))}
                </View>

                {/* Step card */}
                <View style={[styles.stepCard, { borderColor: STEPS[step].color }]}>
                    <View style={styles.stepHeader}>
                        <View style={[styles.stepIconBg, { backgroundColor: STEPS[step].color }]}>
                            <StepIcon size={22} color={Colors.primary} />
                        </View>
                        <Text style={styles.stepTitle}>{STEPS[step].title}</Text>
                    </View>

                    <Animated.View style={{ opacity: fadeAnim }}>
                        {renderStep()}
                    </Animated.View>
                </View>

                {/* Navigation buttons */}
                <View style={styles.navRow}>
                    {step > 0 ? (
                        <TouchableOpacity style={styles.prevBtn} onPress={prevStep}>
                            <ChevronLeft size={20} color={Colors.primary} />
                            <Text style={styles.prevBtnText}>Back</Text>
                        </TouchableOpacity>
                    ) : (
                        <View />
                    )}

                    {step < STEPS.length - 1 ? (
                        <TouchableOpacity style={styles.nextBtn} onPress={nextStep}>
                            <Text style={styles.nextBtnText}>Next</Text>
                            <ChevronRight size={20} color="#fff" />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                            <TreeDeciduous size={20} color="#fff" />
                            <Text style={styles.submitBtnText}>Generate My Plan</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
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
        paddingBottom: 40,
    },
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
    headerCenter: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0F172A',
    },
    headerSubtitle: {
        fontSize: 13,
        color: Colors.textSecondary,
        marginTop: 2,
    },

    // Progress
    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    progressItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    progressDot: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressDotActive: {
        backgroundColor: Colors.primary,
    },
    progressDotCompleted: {
        backgroundColor: Colors.primaryDark,
    },
    progressNum: {
        fontSize: 12,
        fontWeight: '700',
        color: '#94A3B8',
    },
    progressLine: {
        width: 32,
        height: 2,
        backgroundColor: '#E2E8F0',
        marginHorizontal: 4,
    },
    progressLineActive: {
        backgroundColor: Colors.primary,
    },

    // Step card
    stepCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        marginBottom: 20,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    stepHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    stepIconBg: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    stepTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1E293B',
    },

    // Form elements
    label: {
        fontSize: 13,
        fontWeight: '700',
        color: '#374151',
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        backgroundColor: '#F8FAFC',
        height: 50,
        fontSize: 14,
    },
    optionsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    optionBtn: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        backgroundColor: '#F8FAFC',
    },
    optionBtnActive: {
        borderColor: Colors.primary,
        backgroundColor: '#E0F2F1',
    },
    optionText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748B',
    },
    optionTextActive: {
        color: Colors.primaryDark,
        fontWeight: '700',
    },
    counterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    counterBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E0F2F1',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 1,
    },
    counterBtnText: {
        fontSize: 22,
        fontWeight: '700',
        color: Colors.primary,
    },
    counterValue: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1E293B',
        minWidth: 40,
        textAlign: 'center',
    },

    // Scale selector
    scaleContainer: {
        marginTop: 16,
    },
    scaleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    scaleDot: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 2,
        borderColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
    },
    scaleDotActive: {
        borderColor: Colors.primary,
        backgroundColor: '#E0F2F1',
    },
    scaleNum: {
        fontSize: 16,
        fontWeight: '700',
        color: '#94A3B8',
    },
    scaleNumActive: {
        color: Colors.primaryDark,
    },
    scaleLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    scaleLabelText: {
        fontSize: 11,
        color: Colors.textSecondary,
    },

    // Navigation
    navRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    prevBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 4,
    },
    prevBtnText: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.primary,
    },
    nextBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary,
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 14,
        gap: 4,
        elevation: 2,
    },
    nextBtnText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#fff',
    },
    submitBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primaryDark,
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 14,
        gap: 8,
        elevation: 3,
    },
    submitBtnText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#fff',
    },

    // Generating state
    generatingContainer: {
        flex: 1,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    generatingCard: {
        borderRadius: 24,
        padding: 40,
        alignItems: 'center',
        width: '100%',
    },
    generatingTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#004D40',
        marginTop: 20,
    },
    generatingSubtitle: {
        fontSize: 14,
        color: '#00695C',
        marginTop: 8,
        textAlign: 'center',
    },
    generatingEmoji: {
        fontSize: 48,
        marginTop: 20,
    },
});
