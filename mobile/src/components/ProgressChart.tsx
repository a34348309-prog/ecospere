import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { Colors } from '../theme/colors';

interface ProgressChartProps {
    completionPercent: number;
    completedActions: number;
    totalActions: number;
}

export const ProgressChart = ({ completionPercent, completedActions, totalActions }: ProgressChartProps) => {
    const clampedPercent = Math.min(100, Math.max(0, completionPercent));

    return (
        <View style={styles.container}>
            <View style={styles.circleContainer}>
                <View style={styles.outerCircle}>
                    <View style={styles.innerCircle}>
                        <Text style={styles.percentText}>{clampedPercent}%</Text>
                        <Text style={styles.percentLabel}>Complete</Text>
                    </View>
                </View>
                {/* Progress ring simulation using border */}
                <View style={[
                    styles.progressRing,
                    {
                        borderTopColor: clampedPercent >= 25 ? Colors.primary : '#E2E8F0',
                        borderRightColor: clampedPercent >= 50 ? Colors.primary : '#E2E8F0',
                        borderBottomColor: clampedPercent >= 75 ? Colors.primary : '#E2E8F0',
                        borderLeftColor: clampedPercent >= 100 ? Colors.primary : '#E2E8F0',
                    },
                ]} />
            </View>

            <View style={styles.statsRow}>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{completedActions}</Text>
                    <Text style={styles.statLabel}>Done</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{totalActions - completedActions}</Text>
                    <Text style={styles.statLabel}>Remaining</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{totalActions}</Text>
                    <Text style={styles.statLabel}>Total</Text>
                </View>
            </View>

            {/* Linear progress bar */}
            <View style={styles.barContainer}>
                <View style={styles.barBg}>
                    <View style={[styles.barFill, { width: `${Math.max(2, clampedPercent)}%` }]} />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    circleContainer: {
        width: 120,
        height: 120,
        marginBottom: 20,
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    outerCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#E0F2F1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    innerCircle: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    progressRing: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 6,
        borderColor: '#E2E8F0',
    },
    percentText: {
        fontSize: 28,
        fontWeight: '900',
        color: Colors.primary,
    },
    percentLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    statItem: {
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1E293B',
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: Colors.textSecondary,
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: '#E2E8F0',
    },
    barContainer: {
        width: '100%',
        paddingHorizontal: 20,
    },
    barBg: {
        height: 8,
        backgroundColor: '#E2E8F0',
        borderRadius: 4,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        backgroundColor: Colors.primary,
        borderRadius: 4,
    },
});
