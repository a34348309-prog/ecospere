import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { Colors } from '../theme/colors';

interface ImpactBadgeProps {
    milestones: { name: string; icon: string; achieved: boolean }[];
}

export const ImpactBadge = ({ milestones }: ImpactBadgeProps) => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>🏆 Milestones</Text>
            <View style={styles.badgeRow}>
                {milestones.map((m, i) => (
                    <View
                        key={`${m.name}-${i}`}
                        style={[styles.badge, !m.achieved && styles.badgeLocked]}
                    >
                        <Text style={styles.badgeIcon}>{m.icon}</Text>
                        <Text
                            style={[styles.badgeName, !m.achieved && styles.badgeNameLocked]}
                            numberOfLines={1}
                        >
                            {m.name}
                        </Text>
                        {m.achieved && (
                            <View style={styles.achievedDot} />
                        )}
                    </View>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 8,
    },
    title: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 12,
    },
    badgeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    badge: {
        alignItems: 'center',
        backgroundColor: '#FFF8E1',
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: '#FFE082',
        minWidth: 80,
        position: 'relative',
    },
    badgeLocked: {
        backgroundColor: '#F1F5F9',
        borderColor: '#E2E8F0',
        opacity: 0.6,
    },
    badgeIcon: {
        fontSize: 28,
        marginBottom: 6,
    },
    badgeName: {
        fontSize: 11,
        fontWeight: '700',
        color: '#78350F',
        textAlign: 'center',
    },
    badgeNameLocked: {
        color: '#94A3B8',
    },
    achievedDot: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.primary,
    },
});
