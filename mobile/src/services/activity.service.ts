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

/**
 * Get optimized carbon reduction plan (Knapsack algorithm).
 */
export const getOptimizedPlan = async (effort: number) => {
  try {
    const response = await axios.get(
      `${API_ENDPOINTS.ACTIVITIES}/optimize?effort=${effort}`,
      getHeaders(),
    );
    return response.data;
  } catch (error: any) {
    console.error("Error fetching plan:", error);
    return { success: false, data: null };
  }
};

/**
 * Get user's current streak info.
 */
export const getStreak = async () => {
  try {
    const response = await axios.get(
      `${API_ENDPOINTS.ACTIVITIES}/streak`,
      getHeaders(),
    );
    return response.data?.data ?? { currentStreak: 0, longestStreak: 0, isActiveToday: false };
  } catch (error: any) {
    console.error("Error fetching streak:", error);
    return { currentStreak: 0, longestStreak: 0, isActiveToday: false };
  }
};

/**
 * Get weekly challenges (auto-generated).
 */
export const getChallenges = async () => {
  try {
    const response = await axios.get(
      `${API_ENDPOINTS.ACTIVITIES}/challenges`,
      getHeaders(),
    );
    return response.data?.data ?? [];
  } catch (error: any) {
    console.error("Error fetching challenges:", error);
    return [];
  }
};

/**
 * Get "You vs Average" insights.
 */
export const getInsightsData = async () => {
  try {
    const response = await axios.get(
      `${API_ENDPOINTS.ACTIVITIES}/insights`,
      getHeaders(),
    );
    return response.data?.data ?? null;
  } catch (error: any) {
    console.error("Error fetching insights:", error);
    return null;
  }
};

/**
 * Get carbon analytics (timeline, trends, category breakdown).
 */
export const getAnalytics = async (period: 'weekly' | 'monthly' | 'yearly' = 'monthly') => {
  try {
    const response = await axios.get(
      `${API_ENDPOINTS.ACTIVITIES}/analytics?period=${period}`,
      getHeaders(),
    );
    return response.data?.data ?? null;
  } catch (error: any) {
    console.error("Error fetching analytics:", error);
    return null;
  }
};
