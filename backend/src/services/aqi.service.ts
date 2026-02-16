import axios from 'axios';
import prisma from '../lib/prisma';
import { emitToUser } from '../lib/socket';

const AQI_THRESHOLD = 100;

// Google Maps Air Quality API (with WAQI fallback)
const GOOGLE_AQI_URL = 'https://airquality.googleapis.com/v1/currentConditions:lookup';
const WAQI_BASE_URL = 'https://api.waqi.info/feed';

interface AQIResult {
    aqiValue: number;
    status: string;
    source: string;
}

/**
 * Get AQI status label from value.
 */
export const getAQIStatus = (aqi: number): string => {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
};

/**
 * Fetch AQI from Google Maps Air Quality API.
 * Falls back to WAQI, then generates mock data.
 */
export const fetchAQI = async (lat: number, lng: number): Promise<AQIResult> => {
    // Try Google Maps Air Quality API first
    const googleKey = process.env.GOOGLE_MAPS_API_KEY;
    if (googleKey) {
        try {
            const response = await axios.post(
                `${GOOGLE_AQI_URL}?key=${googleKey}`,
                {
                    location: { latitude: lat, longitude: lng },
                    extraComputations: ['DOMINANT_POLLUTANT_CONCENTRATION'],
                }
            );
            const index = response.data?.indexes?.[0];
            if (index) {
                return {
                    aqiValue: index.aqi || index.aqiDisplay || 50,
                    status: getAQIStatus(index.aqi || 50),
                    source: 'google',
                };
            }
        } catch (error) {
            console.warn('[AQI] Google API failed, falling back to WAQI');
        }
    }

    // Fallback to WAQI
    const waqiKey = process.env.AQI_API_KEY;
    if (waqiKey) {
        try {
            const response = await axios.get(`${WAQI_BASE_URL}/geo:${lat};${lng}/?token=${waqiKey}`);
            if (response.data?.status === 'ok') {
                const aqi = response.data.data.aqi;
                return {
                    aqiValue: aqi,
                    status: getAQIStatus(aqi),
                    source: 'waqi',
                };
            }
        } catch (error) {
            console.warn('[AQI] WAQI API failed, using mock data');
        }
    }

    // Mock fallback for development
    const mockAqi = Math.floor(Math.random() * 200) + 20;
    return {
        aqiValue: mockAqi,
        status: getAQIStatus(mockAqi),
        source: 'mock',
    };
};

/**
 * Full location update flow:
 * 1. Fetch real-time AQI
 * 2. Save to AQI_Log
 * 3. Compare against threshold
 * 4. Emit Socket.io alert if exceeded
 */
export const processLocationUpdate = async (
    userId: string,
    lat: number,
    lng: number
): Promise<{ aqiValue: number; status: string; alert: boolean }> => {
    // 1. Fetch AQI
    const aqi = await fetchAQI(lat, lng);

    // 2. Save to AQI_Log with TTL (30 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await prisma.$executeRaw`
        INSERT INTO "AQILog" (id, "userId", "aqiValue", location, status, timestamp, "expiresAt")
        VALUES (
            gen_random_uuid(),
            ${userId},
            ${aqi.aqiValue},
            ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326),
            ${aqi.status},
            NOW(),
            ${expiresAt}
        )
    `;

    // 3. Check threshold and emit alert
    const alert = aqi.aqiValue > AQI_THRESHOLD;
    if (alert) {
        emitToUser(userId, 'aqi-alert', {
            type: 'AQI_THRESHOLD_EXCEEDED',
            aqiValue: aqi.aqiValue,
            status: aqi.status,
            message: `⚠️ Air quality is ${aqi.status} (AQI: ${aqi.aqiValue}). Consider wearing a mask outdoors.`,
            lat,
            lng,
            timestamp: new Date().toISOString(),
        });
    }

    return {
        aqiValue: aqi.aqiValue,
        status: aqi.status,
        alert,
    };
};

/**
 * Get AQI history for a user.
 */
export const getUserAQIHistory = async (userId: string, limit: number = 20) => {
    const logs = await prisma.aQILog.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        take: limit,
    });
    return logs;
};

/**
 * Cleanup expired AQI logs (TTL enforcement).
 */
export const cleanupExpiredAQILogs = async (): Promise<number> => {
    const result = await prisma.aQILog.deleteMany({
        where: {
            expiresAt: { lt: new Date() },
        },
    });
    return result.count;
};

/**
 * Get AQI by city name (legacy support).
 */
export const getAQIByCity = async (city: string): Promise<AQIResult> => {
    const waqiKey = process.env.AQI_API_KEY;
    if (waqiKey) {
        try {
            const response = await axios.get(`${WAQI_BASE_URL}/${city}/?token=${waqiKey}`);
            if (response.data?.status === 'ok') {
                const aqi = response.data.data.aqi;
                return {
                    aqiValue: aqi,
                    status: getAQIStatus(aqi),
                    source: 'waqi',
                };
            }
        } catch (error) {
            console.warn('[AQI] City lookup failed');
        }
    }

    const mockAqi = Math.floor(Math.random() * 100) + 20;
    return {
        aqiValue: mockAqi,
        status: getAQIStatus(mockAqi),
        source: 'mock',
    };
};
