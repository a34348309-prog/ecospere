import axios from 'axios';
import { API_ENDPOINTS } from './api.config';

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
