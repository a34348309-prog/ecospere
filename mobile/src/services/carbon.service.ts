import axios from "axios";
import { API_ENDPOINTS } from "./api.config";
import { useAuthStore } from "../store/useAuthStore";

const getHeaders = () => {
  const token = useAuthStore.getState().token;
  return {
    headers: { Authorization: `Bearer ${token}` },
  };
};

export interface CarbonBillResult {
  success: boolean;
  message: string;
  carbonKg?: number;
  bill?: any;
  formula?: string;
  requiresManualInput?: boolean;
  rawText?: string;
}

/**
 * Upload a utility bill image for OCR processing.
 */
export const uploadBillImage = async (
  imageUri: string,
  billType: string = "electricity",
): Promise<CarbonBillResult> => {
  try {
    const token = useAuthStore.getState().token;
    const fileName = imageUri.split("/").pop() || "bill.jpg";
    const formData = new FormData();
    formData.append("billImage", {
      uri: imageUri,
      name: fileName,
      type: "image/jpeg",
    } as any);
    formData.append("billType", billType);

    const response = await axios.post(
      `${API_ENDPOINTS.CARBON}/upload-bill`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        timeout: 30000, // OCR can take time
      },
    );
    return response.data;
  } catch (error: any) {
    console.error("Error uploading bill:", error);
    return {
      success: false,
      message: error.response?.data?.error?.message || "Upload failed",
      requiresManualInput: true,
    };
  }
};

/**
 * Submit a manual bill entry.
 */
export const submitManualBill = async (
  billType: string,
  totalUnits: number,
): Promise<CarbonBillResult> => {
  try {
    const response = await axios.post(
      `${API_ENDPOINTS.CARBON}/manual`,
      { billType, totalUnits },
      getHeaders(),
    );
    return response.data;
  } catch (error: any) {
    console.error("Error submitting bill:", error);
    return {
      success: false,
      message: error.response?.data?.error?.message || "Submission failed",
    };
  }
};

/**
 * Get carbon bill history.
 */
export const getCarbonHistory = async (limit: number = 10) => {
  try {
    const response = await axios.get(
      `${API_ENDPOINTS.CARBON}/history?limit=${limit}`,
      getHeaders(),
    );
    return response.data?.data ?? [];
  } catch (error) {
    console.error("Error fetching carbon history:", error);
    return [];
  }
};

/**
 * Get carbon footprint summary.
 */
export const getCarbonSummary = async () => {
  try {
    const response = await axios.get(
      `${API_ENDPOINTS.CARBON}/summary`,
      getHeaders(),
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching carbon summary:", error);
    return null;
  }
};
