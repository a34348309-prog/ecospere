import axios from 'axios';
import { API_ENDPOINTS } from './api.config';
import { useAuthStore } from '../store/useAuthStore';

const getHeaders = () => {
    const token = useAuthStore.getState().token;
    return {
        headers: { Authorization: `Bearer ${token}` }
    };
};

/**
 * Fetch AQI for given coordinates via the authenticated /location/update endpoint.
 * Returns { aqi, status, alert, message } or null on failure.
 */
export const updateLocationAQI = async (lat: number, lng: number) => {
    try {
        const response = await axios.post(
            `${API_ENDPOINTS.LOCATION}/update`,
            { lat, lng },
            getHeaders()
        );
        console.log(response.data)
        return response.data;
    } catch (error) {
        console.error('Error fetching location AQI:', error);
        return null;
    }
};

export const getCurrentAQI = async (city?: string) => {
    try {
        const url = city ? `${API_ENDPOINTS.AQI}/current?city=${city}` : `${API_ENDPOINTS.AQI}/current`;
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error('Error fetching AQI:', error);
        return null;
    }
};

export const getAQIHistory = async () => {
    try {
        const response = await axios.get(`${API_ENDPOINTS.AQI}/history`);
        return response.data;
    } catch (error) {
        console.error('Error fetching AQI history:', error);
        return { data: [] };
    }
};
