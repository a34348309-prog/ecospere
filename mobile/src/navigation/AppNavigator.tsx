import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();

const TestSplash = ({ navigation }: any) => {
    React.useEffect(() => {
        const timer = setTimeout(() => {
            navigation.navigate('TestLogin');
        }, 2000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={styles.container}>
            <Text style={styles.text}>EcoSphere: Stack Test</Text>
            <Text style={styles.subtext}>Loading Stack Navigator...</Text>
        </View>
    );
};

const TestLogin = () => (
    <View style={styles.container}>
        <Text style={styles.text}>Welcome to Login</Text>
    </View>
);

export const AppNavigator = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Splash" component={TestSplash} />
            <Stack.Screen name="TestLogin" component={TestLogin} />
        </Stack.Navigator>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#00B894',
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    subtext: {
        fontSize: 16,
        color: '#FFFFFF',
        marginTop: 10,
    },
});
