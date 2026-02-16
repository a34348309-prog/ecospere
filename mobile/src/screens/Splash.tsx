import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, StatusBar } from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { TreeDeciduous, TreePine } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export const Splash = ({ onFinish }: { onFinish: () => void }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1200,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 4,
                useNativeDriver: true,
            })
        ]).start();

        const timer = setTimeout(() => {
            onFinish();
        }, 3500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <LinearGradient
            colors={['#14B8A6', '#0891B2', '#0284C7']}
            style={styles.container}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <Animated.View style={[
                styles.content,
                {
                    opacity: fadeAnim,
                    transform: [{ scale: scaleAnim }]
                }
            ]}>
                {/* Custom Logo Approximation from Image */}
                <View style={styles.logoContainer}>
                    <View style={styles.iconRow}>
                        <TreeDeciduous color="#FFFFFF" size={56} strokeWidth={2.5} style={styles.tree1} />
                        <TreePine color="#FFFFFF" size={72} strokeWidth={2.5} style={styles.tree2} />
                    </View>
                </View>

                <Text style={styles.title}>Breathable Cities</Text>
                <Text style={styles.subtitle}>Grow. Compete. Restore.</Text>
            </Animated.View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
        width: '100%',
    },
    logoContainer: {
        marginBottom: 30,
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    tree1: {
        marginRight: -15,
        marginBottom: 5,
    },
    tree2: {
        // Larger pine tree
    },
    title: {
        fontSize: 34,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: -0.5,
        marginTop: 10,
    },
    subtitle: {
        fontSize: 18,
        color: 'rgba(255, 255, 255, 0.7)',
        fontWeight: '500',
        marginTop: 8,
        letterSpacing: 0.5,
    },
});
