import axios from 'axios';
import { API_ENDPOINTS } from './api.config';
import { useAuthStore } from '../store/useAuthStore';

const getHeaders = () => {
    const token = useAuthStore.getState().token;
    return {
        headers: { Authorization: `Bearer ${token}` }
    };
};

export const getLeaderboard = async () => {
    try {
        const response = await axios.get(API_ENDPOINTS.LEADERBOARD);
        return response.data;
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return { data: [] };
    }
};

export const getMyRank = async () => {
    try {
        const response = await axios.get(`${API_ENDPOINTS.LEADERBOARD}/me`, getHeaders());
        return response.data;
    } catch (error) {
        console.error('Error fetching rank:', error);
        return null;
    }
};

export const getFriendsLeaderboard = async () => {
    try {
        const response = await axios.get(`${API_ENDPOINTS.FRIENDS}/leaderboard`, getHeaders());
        return response.data;
    } catch (error) {
        console.error('Error fetching friends leaderboard:', error);
        return { data: [] };
    }
};

export const addFriend = async (email: string) => {
    try {
        const response = await axios.post(`${API_ENDPOINTS.FRIENDS}/add`, { email }, getHeaders());
        return response.data;
    } catch (error: any) {
        throw error.response?.data?.error?.message || 'Failed to add friend';
    }
};

export const removeFriend = async (friendId: string) => {
    try {
        const response = await axios.delete(`${API_ENDPOINTS.FRIENDS}/${friendId}`, getHeaders());
        return response.data;
    } catch (error: any) {
        throw error.response?.data?.error?.message || 'Failed to remove friend';
    }
};
