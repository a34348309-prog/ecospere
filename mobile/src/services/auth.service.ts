import axios from 'axios';
import { API_ENDPOINTS } from './api.config';
import { useAuthStore } from '../store/useAuthStore';

const getHeaders = () => {
    const token = useAuthStore.getState().token;
    return {
        headers: { Authorization: `Bearer ${token}` }
    };
};

// ─── Auth ────────────────────────────────────────────
export const loginUser = async (email: string, password: string) => {
    try {
        const response = await axios.post(`${API_ENDPOINTS.AUTH}/login`, { email, password });
        return response.data;
    } catch (error: any) {
        throw error.response?.data?.error?.message || error.response?.data?.message || 'Login failed';
    }
};

export const registerUser = async (name: string, email: string, password: string) => {
    try {
        const response = await axios.post(`${API_ENDPOINTS.AUTH}/register`, { name, email, password });
        return response.data;
    } catch (error: any) {
        if (error.response) {
            // Server responded with an error
            const serverMsg = error.response.data?.error?.message
                || error.response.data?.message;

            // Zod validation errors
            const validationDetails = error.response.data?.error?.details;
            if (validationDetails && Array.isArray(validationDetails)) {
                const fieldErrors = validationDetails.map((d: any) => `${d.field}: ${d.message}`).join('\n');
                throw fieldErrors;
            }

            throw serverMsg || 'Registration failed';
        } else if (error.request) {
            // Network error — no response received
            throw 'Cannot connect to server. Please check that the backend is running and your device is on the same network.';
        } else {
            throw 'An unexpected error occurred. Please try again.';
        }
    }
};

export const getMe = async () => {
    try {
        const response = await axios.get(`${API_ENDPOINTS.AUTH}/me`, getHeaders());
        return response.data;
    } catch (error: any) {
        throw error.response?.data?.error?.message || 'Failed to fetch profile';
    }
};

// ─── User Stats ──────────────────────────────────────
export const getCalculatorStats = async () => {
    try {
        const response = await axios.get(`${API_ENDPOINTS.USERS}/stats`, getHeaders());
        return response.data;
    } catch (error: any) {
        throw error.response?.data?.error?.message || 'Failed to fetch stats';
    }
};

export const updateCalculatorStats = async (lifetimeCarbon: number, treesToOffset: number) => {
    try {
        const response = await axios.post(`${API_ENDPOINTS.USERS}/stats`, { lifetimeCarbon, treesToOffset }, getHeaders());
        return response.data;
    } catch (error: any) {
        throw error.response?.data?.error?.message || 'Failed to update stats';
    }
};

export const updateProfile = async (data: { name?: string; email?: string }) => {
    try {
        const response = await axios.put(`${API_ENDPOINTS.USERS}/profile`, data, getHeaders());
        return response.data;
    } catch (error: any) {
        throw error.response?.data?.error?.message || 'Failed to update profile';
    }
};
