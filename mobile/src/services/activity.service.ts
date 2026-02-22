import axios from "axios";
import { API_ENDPOINTS } from "./api.config";
import { useAuthStore } from "../store/useAuthStore";

const getHeaders = () => {
  const token = useAuthStore.getState().token;
  return { headers: { Authorization: `Bearer ${token}` } };
};

/**
 * Log a daily activity.
 */
export const logActivity = async (data: {
  category: string;
  activity: string;
  value: number;
  date?: string;
}) => {
  try {
    const response = await axios.post(
      API_ENDPOINTS.ACTIVITIES,
      data,
      getHeaders(),
    );
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw error.response.data?.error?.message || "Failed to log activity";
    }
    throw "Cannot connect to server.";
  }
};

/**
 * Get activity history.
 */
export const getActivities = async (days: number = 7) => {
  try {
    const response = await axios.get(
      `${API_ENDPOINTS.ACTIVITIES}?days=${days}`,
      getHeaders(),
    );
    return response.data;
  } catch (error: any) {
    console.error("Error fetching activities:", error);
    return { success: false, data: [] };
  }
};

/**
 * Get weekly carbon summary.
 */
export const getWeeklySummary = async () => {
  try {
    const response = await axios.get(
      `${API_ENDPOINTS.ACTIVITIES}/summary`,
      getHeaders(),
    );
    return response.data;
  } catch (error: any) {
    console.error("Error fetching summary:", error);
    return { success: false, data: null };
  }
};

/**
 * Get personalized eco tips.
 */
export const getEcoTips = async () => {
  try {
    const response = await axios.get(
      `${API_ENDPOINTS.ACTIVITIES}/tips`,
      getHeaders(),
    );
    return response.data;
  } catch (error: any) {
    console.error("Error fetching tips:", error);
    return { success: false, data: null };
  }
};
