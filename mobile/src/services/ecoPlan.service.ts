import axios from 'axios';
import { API_BASE_URL } from './api.config';
import { useAuthStore } from '../store/useAuthStore';

const ECO_PLAN_URL = `${API_BASE_URL}/eco-plan`;

const getHeaders = () => {
    const token = useAuthStore.getState().token;
    return {
        headers: { Authorization: `Bearer ${token}` },
    };
};

// ─── Types ───────────────────────────────────────────────────

export interface LifestyleFormData {
    commuteDistance: number;
    vehicleType: string;
    monthlyElectricity: number;
    age: number;
    city: string;
    dietaryPreference: string;
    meatMealsPerWeek: number;
    hasGarden: boolean;
    homeOwnership: string;
    householdSize: number;
    acUsageHours: number;
    wasteRecycling: string;
    monthlyGroceryBill: number;
    willingnessChangeDiet: number;
    willingnessPublicTransport: number;
    timeAvailability: string;
}

export interface PlanAction {
    id: string;
    actionId: string;
    phase: string;
    isCompleted: boolean;
    completedAt: string | null;
    score: number;
    action: {
        id: string;
        name: string;
        category: string;
        description: string;
        icon: string;
        carbonSavedKg: number;
        monthlySavings: number;
        upfrontCost: number;
        difficulty: number;
        phase: string;
        treesEquivalent: number;
        tips: string;
    };
}

export interface EcoPlan {
    id: string;
    userId: string;
    treesNeeded: number;
    treesReducedByActions: number;
    treesRemaining: number;
    totalMonthlySavings: number;
    totalUpfrontCost: number;
    totalYearlySavings: number;
    totalCO2Reduced: number;
    sponsorCost: number;
    netSavingsYear1: number;
    planData: any;
    completionPercent: number;
    generatedAt: string;
    actions: PlanAction[];
}

export interface ImpactSummary {
    totalActions: number;
    completedActions: number;
    completionPercent: number;
    co2SavedAnnually: number;
    monthlySavings: number;
    treesOffsetByActions: number;
    treesRemaining: number;
    milestones: { name: string; icon: string; achieved: boolean }[];
    planGeneratedAt: string;
}

// ─── API Calls ───────────────────────────────────────────────

/**
 * Generate a personalized eco plan from lifestyle form data.
 */
export const generateEcoPlan = async (formData: LifestyleFormData): Promise<{ success: boolean; data: any; message: string; isExisting?: boolean }> => {
    try {
        const response = await axios.post(`${ECO_PLAN_URL}/generate`, formData, getHeaders());
        return response.data;
    } catch (error: any) {
        console.error('Error generating eco plan:', error);
        return {
            success: false,
            data: null,
            message: error.response?.data?.error?.message || 'Failed to generate plan',
        };
    }
};

/**
 * Get the user's current eco plan.
 */
export const getCurrentEcoPlan = async (): Promise<EcoPlan | null> => {
    try {
        const response = await axios.get(`${ECO_PLAN_URL}/current`, getHeaders());
        return response.data?.data ?? null;
    } catch (error: any) {
        console.error('Error fetching eco plan:', error);
        return null;
    }
};

/**
 * Update action progress (complete/uncomplete).
 */
export const updateActionProgress = async (
    actionId: string,
    isCompleted: boolean,
): Promise<{ success: boolean; data: any; message: string }> => {
    try {
        const response = await axios.put(
            `${ECO_PLAN_URL}/update-progress`,
            { actionId, isCompleted },
            getHeaders(),
        );
        return response.data;
    } catch (error: any) {
        console.error('Error updating progress:', error);
        return {
            success: false,
            data: null,
            message: error.response?.data?.error?.message || 'Failed to update progress',
        };
    }
};

/**
 * Get all available eco actions.
 */
export const getAllEcoActions = async () => {
    try {
        const response = await axios.get(`${ECO_PLAN_URL}/actions`);
        return response.data?.data ?? [];
    } catch (error) {
        console.error('Error fetching actions:', error);
        return [];
    }
};

/**
 * Get user's impact summary.
 */
export const getEcoImpactSummary = async (): Promise<ImpactSummary | null> => {
    try {
        const response = await axios.get(`${ECO_PLAN_URL}/impact-summary`, getHeaders());
        return response.data?.data ?? null;
    } catch (error) {
        console.error('Error fetching impact summary:', error);
        return null;
    }
};
