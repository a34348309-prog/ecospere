import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Alert, Dimensions } from 'react-native';
import { Text, TextInput, Button, Card } from 'react-native-paper';
import { Colors } from '../theme/colors';
import { loginUser } from '../services/auth.service';
import { useAuthStore } from '../store/useAuthStore';
import { Mail, Lock, Eye, EyeOff, Leaf } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export const Login = ({ onGoToSignup }: any) => {
    const [email, setEmail] = useState('alex.j@example.com');
    const [password, setPassword] = useState('password123');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const { setAuth } = useAuthStore();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            const data = await loginUser(email, password);
            setAuth(data.user, data.token);
        } catch (error: any) {
            Alert.alert('Login Failed', error.toString());
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Card style={styles.loginCard} elevation={5}>
                <View style={styles.logoContainer}>
                    <View style={styles.logoCircle}>
                        <Leaf color="#fff" size={32} />
                    </View>
                    <Text style={styles.title}>Welcome Back</Text>
                    <Text style={styles.subtitle}>Continue your eco-journey</Text>
                </View>

                <View style={styles.form}>
                    <Text style={styles.label}>Email</Text>
                    <View style={styles.inputWrapper}>
                        <Mail size={18} color={Colors.textSecondary} style={styles.inputIcon} />
                        <TextInput
                            value={email}
                            onChangeText={setEmail}
                            placeholder="your@email.com"
                            style={styles.inputField}
                            placeholderTextColor={Colors.textLight}
                            autoCapitalize="none"
                            mode="flat"
                            underlineColor="transparent"
                            activeUnderlineColor="transparent"
                        />
                    </View>

                    <Text style={styles.label}>Password</Text>
                    <View style={styles.inputWrapper}>
                        <Lock size={18} color={Colors.textSecondary} style={styles.inputIcon} />
                        <TextInput
                            value={password}
                            onChangeText={setPassword}
                            placeholder="••••••••"
                            secureTextEntry={!showPassword}
                            style={styles.inputField}
                            placeholderTextColor={Colors.textLight}
                            mode="flat"
                            underlineColor="transparent"
                            activeUnderlineColor="transparent"
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                            {showPassword ? <EyeOff size={18} color={Colors.textSecondary} /> : <Eye size={18} color={Colors.textSecondary} />}
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.forgotBtn}>
                        <Text style={styles.forgotText}>Forgot password?</Text>
                    </TouchableOpacity>

                    <Button
                        mode="contained"
                        onPress={handleLogin}
                        loading={loading}
                        disabled={loading}
                        style={styles.signInBtn}
                        contentStyle={styles.btnContent}
                        buttonColor={Colors.primary}
                        labelStyle={{ fontSize: 16, fontWeight: '800' }}
                    >
                        Sign In
                    </Button>

                    <View style={styles.dividerContainer}>
                        <View style={styles.line} />
                        <Text style={styles.orText}>OR</Text>
                        <View style={styles.line} />
                    </View>

                    <TouchableOpacity style={styles.googleBtn}>
                        <Text style={styles.googleG}>G</Text>
                        <Text style={styles.googleText}>Continue with Google</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={onGoToSignup} style={styles.signupBtn}>
                        <Text style={styles.signupText}>
                            Don't have an account? <Text style={styles.signupLink}>Sign up</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </Card>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    content: {
        padding: 20,
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loginCard: {
        width: '100%',
        maxWidth: 380,
        backgroundColor: '#fff',
        borderRadius: 32,
        paddingHorizontal: 28,
        paddingVertical: 40,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
    },
    logoContainer: { alignItems: 'center', marginBottom: 32 },
    logoCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        elevation: 4,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8
    },
    title: { fontSize: 26, fontWeight: '800', color: Colors.text, marginBottom: 8 },
    subtitle: { fontSize: 15, color: Colors.textSecondary, fontWeight: '500' },
    form: { width: '100%' },
    label: { fontSize: 13, fontWeight: '700', color: Colors.text, marginBottom: 8, marginTop: 16 },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.inputBg,
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 52,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    inputIcon: { marginRight: 12 },
    inputField: {
        flex: 1,
        backgroundColor: 'transparent',
        height: 52,
        fontSize: 15,
        color: Colors.text,
        fontWeight: '500'
    },
    eyeIcon: { padding: 8 },
    forgotBtn: { alignSelf: 'flex-end', marginTop: 12, marginBottom: 24 },
    forgotText: { color: Colors.primary, fontSize: 13, fontWeight: '700' },
    signInBtn: { borderRadius: 16, elevation: 2 },
    btnContent: { height: 52 },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 24
    },
    line: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
    orText: { marginHorizontal: 16, color: Colors.textLight, fontSize: 12, fontWeight: '700' },
    googleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 52,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#fff',
        marginBottom: 24,
    },
    googleG: { fontSize: 20, fontWeight: '900', color: Colors.text, marginRight: 12 },
    googleText: { fontSize: 15, fontWeight: '700', color: Colors.text },
    signupBtn: { alignItems: 'center', paddingVertical: 8 },
    signupText: { color: Colors.textSecondary, fontSize: 14, fontWeight: '500' },
    signupLink: { color: Colors.primary, fontWeight: '800' },
});
