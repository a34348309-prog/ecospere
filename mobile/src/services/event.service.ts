import axios from "axios";
import { API_ENDPOINTS } from "./api.config";
import { useAuthStore } from "../store/useAuthStore";

const getHeaders = () => {
  const token = useAuthStore.getState().token;
  return {
    headers: { Authorization: `Bearer ${token}` },
  };
};

export const getEvents = async () => {
  try {
    const response = await axios.get(API_ENDPOINTS.EVENTS);
    return response.data;
  } catch (error) {
    console.error("Error fetching events:", error);
    return { data: [] };
  }
};

export const joinEvent = async (eventId: string) => {
  try {
    const response = await axios.post(
      `${API_ENDPOINTS.EVENTS}/join/${eventId}`,
      {},
      getHeaders(),
    );
    return response.data;
  } catch (error: any) {
    console.error("Error joining event:", error);
    throw error.response?.data?.error?.message || "Failed to join event";
  }
};

export const getPlantationEvents = async () => {
  try {
    const response = await axios.get(API_ENDPOINTS.PLANTATION);
    return response.data;
  } catch (error) {
    console.error("Error fetching plantation events:", error);
    return { data: [] };
  }
};

export const verifyAttendance = async (
  eventId: string,
  lat: number,
  lng: number,
) => {
  try {
    const response = await axios.post(
      `${API_ENDPOINTS.EVENTS}/verify-attendance`,
      { eventId, userLat: lat, userLng: lng },
      getHeaders(),
    );
    return response.data;
  } catch (error: any) {
    console.error("Error verifying attendance:", error);
    return {
      verified: false,
      message: error.response?.data?.error?.message || "Verification failed",
    };
  }
};

export const createEvent = async (eventData: {
  title: string;
  description: string;
  organizer: string;
  date: string;
  time: string;
  locationName: string;
  lat: number;
  lng: number;
  maxParticipants?: number;
}) => {
  try {
    const response = await axios.post(
      API_ENDPOINTS.EVENTS,
      eventData,
      getHeaders(),
    );
    return response.data;
  } catch (error: any) {
    if (error.response) {
      const validationDetails = error.response.data?.error?.details;
      if (validationDetails && Array.isArray(validationDetails)) {
        const fieldErrors = validationDetails
          .map((d: any) => `${d.field}: ${d.message}`)
          .join("\n");
        throw fieldErrors;
      }
      throw error.response.data?.error?.message || "Failed to create event";
    }
    throw "Cannot connect to server. Please check your connection.";
  }
};
