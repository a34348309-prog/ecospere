import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { Colors } from '../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MilestoneCelebrationProps {
    visible: boolean;
    milestoneName: string;
    milestoneIcon: string;
    onDismiss: () => void;
}

/**
 * Confetti-like celebration animation when user hits a milestone.
 * Shows a modal overlay with animated icons and fades out.
 */
export const MilestoneCelebration = ({
    visible,
    milestoneName,
    milestoneIcon,
    onDismiss,
}: MilestoneCelebrationProps) => {
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const confettiAnims = useRef(
        Array.from({ length: 12 }, () => ({
            x: new Animated.Value(0),
            y: new Animated.Value(0),
            opacity: new Animated.Value(1),
            rotate: new Animated.Value(0),
        }))
    ).current;

    useEffect(() => {
        if (visible) {
            // Reset animations
            scaleAnim.setValue(0);
            opacityAnim.setValue(0);
            confettiAnims.forEach((a) => {
                a.x.setValue(0);
                a.y.setValue(0);
                a.opacity.setValue(1);
                a.rotate.setValue(0);
            });

            // Celebrate!
            Animated.parallel([
                // Badge scale in
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 4,
                    tension: 40,
                    useNativeDriver: true,
                }),
                // Opacity in
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                // Confetti particles
                ...confettiAnims.map((a, i) => {
                    const angle = (i / 12) * Math.PI * 2;
                    const distance = 80 + Math.random() * 60;
                    return Animated.parallel([
                        Animated.timing(a.x, {
                            toValue: Math.cos(angle) * distance,
                            duration: 800,
                            useNativeDriver: true,
                        }),
                        Animated.timing(a.y, {
                            toValue: Math.sin(angle) * distance - 30,
                            duration: 800,
                            useNativeDriver: true,
                        }),
                        Animated.timing(a.opacity, {
                            toValue: 0,
                            duration: 1000,
                            delay: 400,
                            useNativeDriver: true,
                        }),
                        Animated.timing(a.rotate, {
                            toValue: Math.random() * 4 - 2,
                            duration: 800,
                            useNativeDriver: true,
                        }),
                    ]);
                }),
            ]).start();

            // Auto dismiss
            const timer = setTimeout(() => {
                Animated.timing(opacityAnim, {
                    toValue: 0,
                    duration: 500,
                    useNativeDriver: true,
                }).start(() => onDismiss());
            }, 2500);

            return () => clearTimeout(timer);
        }
    }, [visible]);

    if (!visible) return null;

    const confettiEmojis = ['🎉', '✨', '🌟', '💚', '🌿', '🎊', '⭐', '🌳', '💫', '🏆', '🍃', '🌱'];

    return (
        <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
            {/* Confetti particles */}
            {confettiAnims.map((a, i) => (
                <Animated.Text
                    key={i}
                    style={[
                        styles.confetti,
                        {
                            transform: [
                                { translateX: a.x },
                                { translateY: a.y },
                                {
                                    rotate: a.rotate.interpolate({
                                        inputRange: [-2, 2],
                                        outputRange: ['-180deg', '180deg'],
                                    }),
                                },
                            ],
                            opacity: a.opacity,
                        },
                    ]}
                >
                    {confettiEmojis[i]}
                </Animated.Text>
            ))}

            {/* Badge */}
            <Animated.View
                style={[
                    styles.badge,
                    { transform: [{ scale: scaleAnim }] },
                ]}
            >
                <Text style={styles.badgeIcon}>{milestoneIcon}</Text>
                <Text style={styles.badgeTitle}>Milestone Achieved!</Text>
                <Text style={styles.badgeName}>{milestoneName}</Text>
            </Animated.View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    confetti: {
        position: 'absolute',
        fontSize: 24,
    },
    badge: {
        backgroundColor: '#fff',
        borderRadius: 24,
        paddingVertical: 32,
        paddingHorizontal: 40,
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
    },
    badgeIcon: {
        fontSize: 56,
        marginBottom: 12,
    },
    badgeTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.primary,
        marginBottom: 4,
    },
    badgeName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#475569',
    },
});
