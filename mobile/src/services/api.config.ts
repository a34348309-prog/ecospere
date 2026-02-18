// import Constants from 'expo-constants';

/**
 * API Configuration
 * 
 * IMPORTANT: Mobile devices (Expo Go) cannot connect to 'localhost'.
 * We must use the local IP address of your computer.
 */

// Your Computer's Local IP
export const LOCAL_IP = '192.168.137.1';
export const PORT = '5000';

export const API_BASE_URL = `http://${LOCAL_IP}:${PORT}/api/v1`;

export const API_ENDPOINTS = {
    AUTH: `${API_BASE_URL}/auth`,
    USERS: `${API_BASE_URL}/users`,
    EVENTS: `${API_BASE_URL}/events`,
    LEADERBOARD: `${API_BASE_URL}/leaderboard`,
    AQI: `${API_BASE_URL}/aqi`,
    NGO: `${API_BASE_URL}/ngos`,
    LOCATION: `${API_BASE_URL}/location`,
    CARBON: `${API_BASE_URL}/carbon`,
    FRIENDS: `${API_BASE_URL}/friends`,
    PLANTATION: `${API_BASE_URL}/events/plantation`,
};
