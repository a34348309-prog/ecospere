import axios from "axios";
import { API_ENDPOINTS } from "./api.config";
import { useAuthStore } from "../store/useAuthStore";

const getHeaders = () => {
  const token = useAuthStore.getState().token;
  return {
    headers: { Authorization: `Bearer ${token}` },
  };
};

// ── Types ───────────────────────────────────────────────────
export interface PollutantComponents {
  co: number;
  no: number;
  no2: number;
  o3: number;
  so2: number;
  pm2_5: number;
  pm10: number;
  nh3: number;
}

export interface AQIResponse {
  success: boolean;
  aqi: number;
  status: string;
  alert: boolean;
  components?: PollutantComponents;
  message?: string;
}

export interface AQIForecastEntry {
  dt: number;
  aqiValue: number;
  aqiRaw: number;
  status: string;
  components: PollutantComponents;
}

// ── API Calls ───────────────────────────────────────────────

/**
 * Fetch AQI for given coordinates via the authenticated /location/update endpoint.
 * Returns { aqi, status, alert, components, message } or null on failure.
 */
export const updateLocationAQI = async (
  lat: number,
  lng: number,
): Promise<AQIResponse | null> => {
  try {
    const response = await axios.post(
      `${API_ENDPOINTS.LOCATION}/update`,
      { lat, lng },
      getHeaders(),
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching location AQI:", error);
    return null;
  }
};

/**
 * Get current AQI — by coordinates (preferred) or city name.
 */
export const getCurrentAQI = async (options?: {
  city?: string;
  lat?: number;
  lng?: number;
}) => {
  try {
    let url = `${API_ENDPOINTS.AQI}/current`;
    const params: string[] = [];

    if (options?.lat !== undefined && options?.lng !== undefined) {
      params.push(`lat=${options.lat}`, `lng=${options.lng}`);
    } else if (options?.city) {
      params.push(`city=${options.city}`);
    }

    if (params.length) url += `?${params.join("&")}`;

    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching AQI:", error);
    return null;
  }
};

/**
 * Get 4-day hourly AQI forecast for given coordinates.
 */
export const getAQIForecast = async (
  lat: number,
  lng: number,
): Promise<AQIForecastEntry[] | null> => {
  try {
    const response = await axios.get(
      `${API_ENDPOINTS.AQI}/forecast?lat=${lat}&lng=${lng}`,
    );
    return response.data?.data ?? [];
  } catch (error) {
    console.error("Error fetching AQI forecast:", error);
    return null;
  }
};

/**
 * Get user's AQI reading history.
 */
export const getAQIHistory = async () => {
  try {
    const response = await axios.get(
      `${API_ENDPOINTS.AQI}/history`,
      getHeaders(),
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching AQI history:", error);
    return { data: [] };
  }
};
