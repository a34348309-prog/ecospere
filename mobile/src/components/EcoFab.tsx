import React, { useState } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { Colors } from '../theme/colors';
import { Sparkles, Route, Calendar, Map as MapIcon } from 'lucide-react-native';

export const EcoFab = ({ navigation }: any) => {
    const [open, setOpen] = useState(false);
    const animation = new Animated.Value(open ? 1 : 0);

    const toggleMenu = () => {
        const toValue = open ? 0 : 1;
        Animated.spring(animation, {
            toValue,
            friction: 5,
            useNativeDriver: true,
        }).start();
        setOpen(!open);
    };

    const menuStyle = (index: number) => ({
        transform: [
            { scale: animation },
            {
                translateY: animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -70 * (index + 1)],
                }),
            },
        ],
    });

    return (
        <View style={styles.container}>
            {open && <TouchableOpacity style={styles.overlay} onPress={toggleMenu} activeOpacity={1} />}

            <Animated.View style={[styles.menuItem, menuStyle(0)]}>
                <TouchableOpacity style={[styles.button, { backgroundColor: '#00D1B2' }]} onPress={() => { toggleMenu(); navigation.navigate('Journey'); }}>
                    <Route color="#FFFFFF" size={20} />
                    <Text style={styles.menuLabel}>Journey</Text>
                </TouchableOpacity>
            </Animated.View>

            <Animated.View style={[styles.menuItem, menuStyle(1)]}>
                <TouchableOpacity style={[styles.button, { backgroundColor: '#00BFA5' }]} onPress={() => { toggleMenu(); navigation.navigate('Events'); }}>
                    <Calendar color="#FFFFFF" size={20} />
                    <Text style={styles.menuLabel}>Events</Text>
                </TouchableOpacity>
            </Animated.View>

            <Animated.View style={[styles.menuItem, menuStyle(2)]}>
                <TouchableOpacity style={[styles.button, { backgroundColor: '#00A8FF' }]} onPress={() => { toggleMenu(); navigation.navigate('Map'); }}>
                    <MapIcon color="#FFFFFF" size={20} />
                    <Text style={styles.menuLabel}>Map</Text>
                </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity style={styles.mainButton} onPress={toggleMenu} activeOpacity={0.8}>
                <Animated.View style={{ transform: [{ rotate: animation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] }) }] }}>
                    <Sparkles color="#FFFFFF" size={32} />
                </Animated.View>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        alignItems: 'center',
        bottom: 30, // Adjusted for tab bar
        alignSelf: 'center',
        zIndex: 1000,
    },
    overlay: {
        position: 'absolute',
        bottom: -100,
        width: 2000,
        height: 2000,
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    mainButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        borderWidth: 4,
        borderColor: '#FFFFFF',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    menuItem: {
        position: 'absolute',
        alignItems: 'center',
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 30,
        elevation: 4,
        minWidth: 120,
        justifyContent: 'center',
    },
    menuLabel: {
        color: '#FFFFFF',
        fontWeight: '700',
        marginLeft: 8,
    },
});
