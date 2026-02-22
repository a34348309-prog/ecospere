import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { Colors } from '../theme/colors';
import { Check, ChevronRight } from 'lucide-react-native';

interface ActionCardProps {
    name: string;
    icon: string;
    category: string;
    description: string;
    carbonSavedKg: number;
    monthlySavings: number;
    upfrontCost: number;
    tips: string;
    isCompleted: boolean;
    onToggle: () => void;
    onPress: () => void;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
    energy: { bg: '#FFF8E1', text: '#F57F17' },
    transport: { bg: '#E3F2FD', text: '#1565C0' },
    diet: { bg: '#F1F8E9', text: '#33691E' },
    waste: { bg: '#FBE9E7', text: '#BF360C' },
    tree_planting: { bg: '#E8F5E9', text: '#1B5E20' },
};

export const ActionCard = ({
    name,
    icon,
    category,
    description,
    carbonSavedKg,
    monthlySavings,
    isCompleted,
    onToggle,
    onPress,
}: ActionCardProps) => {
    const catColor = CATEGORY_COLORS[category] || CATEGORY_COLORS.energy;

    return (
        <TouchableOpacity
            style={[styles.container, isCompleted && styles.containerCompleted]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <TouchableOpacity
                style={[styles.checkbox, isCompleted && styles.checkboxCompleted]}
                onPress={onToggle}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                {isCompleted && <Check size={14} color="#fff" strokeWidth={3} />}
            </TouchableOpacity>

            <View style={styles.iconContainer}>
                <Text style={styles.icon}>{icon}</Text>
            </View>

            <View style={styles.content}>
                <Text
                    style={[styles.name, isCompleted && styles.nameCompleted]}
                    numberOfLines={1}
                >
                    {name}
                </Text>
                <View style={styles.metaRow}>
                    <View style={[styles.categoryBadge, { backgroundColor: catColor.bg }]}>
                        <Text style={[styles.categoryText, { color: catColor.text }]}>
                            {category.replace('_', ' ')}
                        </Text>
                    </View>
                    {monthlySavings > 0 && (
                        <Text style={styles.savings}>₹{monthlySavings}/mo</Text>
                    )}
                    <Text style={styles.carbon}>{carbonSavedKg}kg CO₂</Text>
                </View>
            </View>

            <ChevronRight size={18} color={Colors.textLight} />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    containerCompleted: {
        backgroundColor: '#F0FDF4',
        borderColor: '#BBF7D0',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#CBD5E1',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    checkboxCompleted: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    icon: {
        fontSize: 20,
    },
    content: {
        flex: 1,
    },
    name: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 4,
    },
    nameCompleted: {
        textDecorationLine: 'line-through',
        color: '#64748B',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    categoryBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    categoryText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'capitalize',
    },
    savings: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.primary,
    },
    carbon: {
        fontSize: 11,
        fontWeight: '600',
        color: '#64748B',
    },
});
