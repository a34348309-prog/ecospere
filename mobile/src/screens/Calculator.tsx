import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Text, Card, Button, TextInput, Menu } from 'react-native-paper';
import { Colors } from '../theme/colors';
import {
    TreeDeciduous,
    Car,
    Zap,
    Leaf,
    Info,
    ChevronDown,
    Sprout,
    Clock,
    Footprints,
    RefreshCw
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getCalculatorStats, updateCalculatorStats } from '../services/auth.service';

const VEHICLE_TYPES = [
    { name: 'Car (Petrol)', emissionFactor: 0.192 }, // kg CO2 per km
    { name: 'Car (Diesel)', emissionFactor: 0.171 },
    { name: 'Car (Electric)', emissionFactor: 0.053 },
    { name: 'Bike (Motor)', emissionFactor: 0.103 },
    { name: 'Scooty/Scooter', emissionFactor: 0.075 },
    { name: 'Bus (Public)', emissionFactor: 0.105 },
    { name: 'Train/Metro', emissionFactor: 0.041 },
    { name: 'Bicycle/Walk', emissionFactor: 0 },
];

const TREE_SPECIES = [
    { name: 'Oak', absorption: 25 }, // kg CO2 per year approx
    { name: 'Pine', absorption: 20 },
    { name: 'Maple', absorption: 22 },
    { name: 'Neem', absorption: 28 }, // High absorption
    { name: 'Peepal', absorption: 30 }, // Very high
];

export const Calculator = () => {
    // Inputs
    const [travelDistance, setTravelDistance] = useState('');
    const [electricity, setElectricity] = useState('');
    const [age, setAge] = useState('');
    const [selectedVehicle, setSelectedVehicle] = useState(VEHICLE_TYPES[0]);
    const [showVehicleMenu, setShowVehicleMenu] = useState(false);

    // State
    const [showResults, setShowResults] = useState(false);
    const [loading, setLoading] = useState(false);
    const [savedStats, setSavedStats] = useState<any>(null);

    // Initial Load
    useEffect(() => {
        fetchUserStats();
    }, []);

    const fetchUserStats = async () => {
        setLoading(true);
        try {
            const stats = await getCalculatorStats();
            if (stats && stats.lifetimeCarbon > 0) {
                setSavedStats(stats);
                setShowResults(true);
            }
        } catch (error) {
            console.log('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    // Calculation Results (Derived from either inputs or saved stats)
    const LIFE_EXPECTANCY = 80;
    const currentAge = parseInt(age) || 25;
    const yearsRemaining = Math.max(1, LIFE_EXPECTANCY - currentAge);

    // If showing saved results, use those values directly. Otherwise calculate.
    let lifetimeEmission = 0;
    let treesNeeded = 0;

    if (savedStats && showResults && !travelDistance) {
        // Mode 1: Viewing Saved Stats
        lifetimeEmission = savedStats.lifetimeCarbon;
        treesNeeded = savedStats.treesToOffset;
    } else {
        // Mode 2: Calculating New Input
        const dailyTravelEmission = (parseFloat(travelDistance) || 0) * selectedVehicle.emissionFactor;
        const dailyElectricityEmission = (parseFloat(electricity) || 0) * 0.82;
        const totalDailyEmission = dailyTravelEmission + dailyElectricityEmission;
        const annualEmission = totalDailyEmission * 365;
        lifetimeEmission = annualEmission * yearsRemaining;

        const AVG_TREE_LIFETIME_ABSORPTION = 1000;
        treesNeeded = Math.ceil(lifetimeEmission / AVG_TREE_LIFETIME_ABSORPTION);
    }

    const handleCalculate = async () => {
        if (travelDistance && electricity && age) {
            setLoading(true);
            try {
                // Calculate and Save
                const dailyTravelEmission = (parseFloat(travelDistance) || 0) * selectedVehicle.emissionFactor;
                const dailyElectricityEmission = (parseFloat(electricity) || 0) * 0.82;
                const annualEmission = (dailyTravelEmission + dailyElectricityEmission) * 365;
                const lifeEmission = annualEmission * yearsRemaining;
                const trees = Math.ceil(lifeEmission / 1000);

                await updateCalculatorStats(lifeEmission, trees);

                // Update local state to reflect 'saved' status
                setSavedStats({ lifetimeCarbon: lifeEmission, treesToOffset: trees });
                setShowResults(true);
            } catch (error) {
                Alert.alert('Error', 'Failed to save calculation');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleRecalculate = () => {
        setShowResults(false);
        setSavedStats(null);
        setTravelDistance('');
        setElectricity('');
        setAge('');
    };

    const formatNumber = (num: number) => {
        return num.toLocaleString('en-US', { maximumFractionDigits: 1 });
    };

    if (loading && !showResults) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={{ marginTop: 20, color: Colors.textSecondary }}>Loading your eco-profile...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Personal Footprint</Text>
                <Text style={styles.headerSubtitle}>Calculate your lifetime emissions & offset goals</Text>
            </View>

            {/* Input Form - Hide if showing results */}
            {!showResults && (
                <Card style={styles.inputCard} elevation={0}>
                    <View style={styles.cardHeader}>
                        <View style={styles.iconBg}>
                            <Footprints size={20} color={Colors.primary} />
                        </View>
                        <Text style={styles.cardTitle}>Daily Habits & Lifestyle</Text>
                    </View>

                    {/* Travel Input */}
                    <Text style={styles.label}>Daily Travel (km)</Text>
                    <View style={styles.inputRow}>
                        <TextInput
                            mode="outlined"
                            placeholder="e.g. 25"
                            value={travelDistance}
                            onChangeText={setTravelDistance}
                            keyboardType="numeric"
                            style={[styles.input, { flex: 1, marginRight: 10 }]}
                            outlineColor="transparent"
                            activeOutlineColor={Colors.primary}
                            theme={{ roundness: 12 }}
                            left={<TextInput.Icon icon={() => <Car size={20} color={Colors.textSecondary} />} />}
                        />

                        {/* Vehicle Selector */}
                        <Menu
                            visible={showVehicleMenu}
                            onDismiss={() => setShowVehicleMenu(false)}
                            anchor={
                                <TouchableOpacity onPress={() => setShowVehicleMenu(true)} style={styles.selector}>
                                    <Text numberOfLines={1} style={styles.selectorText}>{selectedVehicle.name}</Text>
                                    <ChevronDown size={18} color={Colors.textSecondary} />
                                </TouchableOpacity>
                            }
                            contentStyle={{ backgroundColor: '#fff' }}
                        >
                            {VEHICLE_TYPES.map((v) => (
                                <Menu.Item
                                    key={v.name}
                                    onPress={() => { setSelectedVehicle(v); setShowVehicleMenu(false); }}
                                    title={v.name}
                                />
                            ))}
                        </Menu>
                    </View>

                    {/* Electricity Input */}
                    <Text style={styles.label}>Daily Electricity Usage (kWh)</Text>
                    <TextInput
                        mode="outlined"
                        placeholder="e.g. 10"
                        value={electricity}
                        onChangeText={setElectricity}
                        keyboardType="numeric"
                        style={styles.input}
                        outlineColor="transparent"
                        activeOutlineColor={Colors.primary}
                        theme={{ roundness: 12 }}
                        left={<TextInput.Icon icon={() => <Zap size={20} color={Colors.textSecondary} />} />}
                    />

                    {/* Age Input */}
                    <Text style={styles.label}>Current Age</Text>
                    <TextInput
                        mode="outlined"
                        placeholder="e.g. 24"
                        value={age}
                        onChangeText={setAge}
                        keyboardType="numeric"
                        style={styles.input}
                        outlineColor="transparent"
                        activeOutlineColor={Colors.primary}
                        theme={{ roundness: 12 }}
                        left={<TextInput.Icon icon={() => <Clock size={20} color={Colors.textSecondary} />} />}
                    />

                    <Button
                        mode="contained"
                        onPress={handleCalculate}
                        style={styles.calculateBtn}
                        contentStyle={{ height: 50 }}
                        buttonColor={Colors.secondary}
                        labelStyle={{ fontSize: 16, fontWeight: '700' }}
                        loading={loading}
                    >
                        Calculate Impact
                    </Button>
                </Card>
            )}

            {/* Results Section */}
            {showResults && (
                <>
                    <LinearGradient
                        colors={['#E0F2F1', '#B2DFDB']}
                        style={styles.resultCard}
                    >
                        <View style={[styles.resultHeader, { justifyContent: 'space-between' }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Leaf size={22} color={Colors.primary} />
                                <Text style={styles.resultTitle}>Lifetime Projection</Text>
                            </View>
                            <TouchableOpacity onPress={handleRecalculate}>
                                <RefreshCw size={20} color={Colors.primary} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.emissionValue}>{formatNumber(lifetimeEmission / 1000)} Tonnes</Text>
                        <Text style={styles.emissionLabel}>Total expected CO₂ emission for remaining life</Text>

                        <View style={styles.divider} />

                        <View style={styles.offsetRow}>
                            <View>
                                <Text style={styles.offsetValue}>{treesNeeded}</Text>
                                <Text style={styles.offsetLabel}>Trees needed to offset</Text>
                            </View>
                            <View style={styles.treeIconContainer}>
                                <TreeDeciduous size={40} color={Colors.primary} />
                            </View>
                        </View>

                        <Button
                            mode="text"
                            textColor={Colors.primary}
                            onPress={handleRecalculate}
                            style={{ alignSelf: 'center', marginTop: 10 }}
                        >
                            Recalculate
                        </Button>
                    </LinearGradient>

                    <Text style={styles.sectionTitle}>Recommended Trees to Plant</Text>
                    {TREE_SPECIES.map((tree) => {
                        const specificTreesNeeded = Math.ceil(lifetimeEmission / (tree.absorption * 40));

                        return (
                            <View key={tree.name} style={styles.speciesCard}>
                                <View style={styles.speciesIconBg}>
                                    <Sprout size={24} color={Colors.primary} />
                                </View>
                                <View style={styles.speciesInfo}>
                                    <Text style={styles.speciesName}>{tree.name}</Text>
                                    <Text style={styles.speciesDetail}>Absorbs ~{tree.absorption} kg CO₂/year</Text>
                                </View>
                                <View style={styles.plantCount}>
                                    <Text style={styles.countValue}>{specificTreesNeeded}</Text>
                                    <Text style={styles.countLabel}>Trees</Text>
                                </View>
                            </View>
                        );
                    })}

                    <View style={styles.infoBox}>
                        <Info size={16} color={Colors.primary} style={{ marginTop: 2 }} />
                        <Text style={styles.infoText}>
                            Calculations are based on average emission factors and a tree lifespan of 40 productive years.
                        </Text>
                    </View>
                </>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    content: { padding: 20, paddingBottom: 100 },
    header: { marginTop: 10, marginBottom: 20 },
    headerTitle: { fontSize: 28, fontWeight: '800', color: '#004D40' },
    headerSubtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4, lineHeight: 20 },

    inputCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        marginBottom: 30,
        borderWidth: 1,
        borderColor: '#E0F2F1'
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    iconBg: {
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: '#E0F2F1', alignItems: 'center', justifyContent: 'center', marginRight: 12
    },
    cardTitle: { fontSize: 16, fontWeight: '700', color: '#004D40' },

    label: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 },
    inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    input: {
        backgroundColor: '#F8FAF5',
        height: 50,
        fontSize: 14,
        marginBottom: 20
    },
    selector: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F8FAF5',
        borderRadius: 12,
        height: 50,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: 'transparent'
    },
    selectorText: { fontSize: 13, color: '#374151', flex: 1 },
    calculateBtn: { borderRadius: 12, marginTop: 10 },

    resultCard: {
        borderRadius: 24,
        padding: 24,
        marginBottom: 30,
        elevation: 2,
        shadowColor: Colors.primary,
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 4 }
    },
    resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    resultTitle: { fontSize: 16, fontWeight: '700', color: '#00695C' },
    emissionValue: { fontSize: 36, fontWeight: '900', color: '#004D40', marginBottom: 4 },
    emissionLabel: { fontSize: 13, color: '#00695C', marginBottom: 20 },
    divider: { height: 1, backgroundColor: 'rgba(0, 77, 64, 0.1)', marginBottom: 20 },

    offsetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    offsetValue: { fontSize: 32, fontWeight: '800', color: Colors.primary },
    offsetLabel: { fontSize: 13, color: '#00695C' },
    treeIconContainer: {
        width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff',
        alignItems: 'center', justifyContent: 'center', elevation: 2
    },

    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#004D40', marginBottom: 16 },
    speciesCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F0F2F5'
    },
    speciesIconBg: {
        width: 44, height: 44, borderRadius: 22, backgroundColor: '#E8F5E9',
        justifyContent: 'center', alignItems: 'center', marginRight: 16
    },
    speciesInfo: { flex: 1 },
    speciesName: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
    speciesDetail: { fontSize: 12, color: '#6B7280' },
    plantCount: { alignItems: 'flex-end' },
    countValue: { fontSize: 18, fontWeight: '800', color: Colors.primary },
    countLabel: { fontSize: 11, color: '#6B7280' },

    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#E3F2FD',
        padding: 16,
        borderRadius: 12,
        gap: 12,
        marginTop: 10
    },
    infoText: { flex: 1, fontSize: 12, color: '#0277BD', lineHeight: 18 },
});
