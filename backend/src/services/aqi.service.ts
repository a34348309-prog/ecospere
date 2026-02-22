import axios from "axios";
import prisma from "../lib/prisma";
import { emitToUser } from "../lib/socket";

const AQI_THRESHOLD = 100;

// ── API URLs ────────────────────────────────────────────────
const OPENWEATHER_AQI_URL =
  "http://api.openweathermap.org/data/2.5/air_pollution";
const WAQI_BASE_URL = "https://api.waqi.info/feed";

// ── Types ───────────────────────────────────────────────────
export interface PollutantComponents {
  co: number; // Carbon monoxide, μg/m³
  no: number; // Nitrogen monoxide, μg/m³
  no2: number; // Nitrogen dioxide, μg/m³
  o3: number; // Ozone, μg/m³
  so2: number; // Sulphur dioxide, μg/m³
  pm2_5: number; // Fine particles (PM2.5), μg/m³
  pm10: number; // Coarse particles (PM10), μg/m³
  nh3: number; // Ammonia, μg/m³
}

export interface AQIResult {
  aqiValue: number; // EPA-mapped value (0–500 scale)
  aqiRaw: number; // Original OpenWeather value (1–5)
  status: string;
  source: string;
  components?: PollutantComponents;
}

export interface AQIForecastEntry {
  dt: number;
  aqiValue: number;
  aqiRaw: number;
  status: string;
  components: PollutantComponents;
}

// ── AQI Scale Mapping ───────────────────────────────────────

/**
 * Map OpenWeather 1–5 AQI scale → approximate US EPA 0–500 scale.
 * 1 (Good) → 25, 2 (Fair) → 75, 3 (Moderate) → 125,
 * 4 (Poor) → 175, 5 (Very Poor) → 350
 */
export const mapOpenWeatherAQI = (owAqi: number): number => {
  const mapping: Record<number, number> = {
    1: 25,
    2: 75,
    3: 125,
    4: 175,
    5: 350,
  };
  return mapping[owAqi] ?? 100;
};

/**
 * Get AQI status label from EPA-scale value.
 */
export const getAQIStatus = (aqi: number): string => {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for Sensitive Groups";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Unhealthy";
  return "Hazardous";
};

// ── Core Fetch Functions ────────────────────────────────────

/**
 * Fetch current AQI from OpenWeather Air Pollution API.
 * Falls back to WAQI, then mock data.
 */
export const fetchAQI = async (
  lat: number,
  lng: number,
): Promise<AQIResult> => {
  // 1. Try OpenWeather Air Pollution API (primary)
  console.log("[AQIIIIIIIIIII] Using OpenWeather APIIIIIIIIIIIIIIIIIIII");
  const owKey = process.env.OPENWEATHER_API_KEY;
  if (owKey && owKey !== "YOUR_OPENWEATHER_API_KEY") {
    try {
      const response = await axios.get(
        `${OPENWEATHER_AQI_URL}?lat=${lat}&lon=${lng}&appid=${owKey}`,
      );
      console.log("[AQI] OpenWeather API response:", response.data);
      const entry = response.data?.list?.[0];
      if (entry) {
        const rawAqi = entry.main.aqi;
        const epaAqi = mapOpenWeatherAQI(rawAqi);
        return {
          aqiValue: epaAqi,
          aqiRaw: rawAqi,
          status: getAQIStatus(epaAqi),
          source: "openweather",
          components: entry.components,
        };
      }
    } catch (error) {
      console.warn("[AQI] OpenWeather API failed, falling back to WAQI");
    }
  }

  // 2. Fallback to WAQI
  const waqiKey = process.env.AQI_API_KEY;
  if (waqiKey) {
    console.log("[AQI] Using WAQI API");
    try {
      const response = await axios.get(
        `${WAQI_BASE_URL}/geo:${lat};${lng}/?token=${waqiKey}`,
      );
      if (response.data?.status === "ok") {
        const aqi = response.data.data.aqi;
        return {
          aqiValue: aqi,
          aqiRaw: 0,
          status: getAQIStatus(aqi),
          source: "waqi",
        };
      }
    } catch (error) {
      console.warn("[AQI] WAQI API failed, using mock data");
    }
  }

  // 3. Mock fallback for development
  const mockAqi = Math.floor(Math.random() * 200) + 20;
  return {
    aqiValue: mockAqi,
    aqiRaw: 0,
    status: getAQIStatus(mockAqi),
    source: "mock",
  };
};

/**
 * Fetch 4-day hourly AQI forecast from OpenWeather.
 */
export const fetchAQIForecast = async (
  lat: number,
  lng: number,
): Promise<AQIForecastEntry[]> => {
  const owKey = process.env.OPENWEATHER_API_KEY;
  if (!owKey || owKey === "YOUR_OPENWEATHER_API_KEY") {
    throw new Error("OPENWEATHER_API_KEY is not configured");
  }

  const response = await axios.get(
    `${OPENWEATHER_AQI_URL}/forecast?lat=${lat}&lon=${lng}&appid=${owKey}`,
  );

  const list = response.data?.list ?? [];
  return list.map((entry: any) => {
    const rawAqi = entry.main.aqi;
    const epaAqi = mapOpenWeatherAQI(rawAqi);
    return {
      dt: entry.dt,
      aqiValue: epaAqi,
      aqiRaw: rawAqi,
      status: getAQIStatus(epaAqi),
      components: entry.components,
    };
  });
};

/**
 * Fetch historical AQI data from OpenWeather.
 * @param start Unix timestamp (UTC)
 * @param end   Unix timestamp (UTC)
 */
export const fetchAQIHistoryFromAPI = async (
  lat: number,
  lng: number,
  start: number,
  end: number,
): Promise<AQIForecastEntry[]> => {
  const owKey = process.env.OPENWEATHER_API_KEY;
  if (!owKey || owKey === "YOUR_OPENWEATHER_API_KEY") {
    throw new Error("OPENWEATHER_API_KEY is not configured");
  }

  const response = await axios.get(
    `${OPENWEATHER_AQI_URL}/history?lat=${lat}&lon=${lng}&start=${start}&end=${end}&appid=${owKey}`,
  );

  const list = response.data?.list ?? [];
  return list.map((entry: any) => {
    const rawAqi = entry.main.aqi;
    const epaAqi = mapOpenWeatherAQI(rawAqi);
    return {
      dt: entry.dt,
      aqiValue: epaAqi,
      aqiRaw: rawAqi,
      status: getAQIStatus(epaAqi),
      components: entry.components,
    };
  });
};

// ── Location Update Flow ────────────────────────────────────

/**
 * Full location update flow:
 * 1. Fetch real-time AQI (OpenWeather primary)
 * 2. Save to AQI_Log
 * 3. Compare against threshold
 * 4. Emit Socket.io alert if exceeded
 */
export const processLocationUpdate = async (
  userId: string,
  lat: number,
  lng: number,
): Promise<{
  aqiValue: number;
  status: string;
  alert: boolean;
  components?: PollutantComponents;
}> => {
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
    emitToUser(userId, "aqi-alert", {
      type: "AQI_THRESHOLD_EXCEEDED",
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
    components: aqi.components,
  };
};

// ── User History / Cleanup ──────────────────────────────────

/**
 * Get AQI history for a user.
 */
export const getUserAQIHistory = async (userId: string, limit: number = 20) => {
  const logs = await prisma.aQILog.findMany({
    where: { userId },
    orderBy: { timestamp: "desc" },
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
 * Get AQI by city name (legacy support — uses WAQI).
 */
export const getAQIByCity = async (city: string): Promise<AQIResult> => {
  const waqiKey = process.env.AQI_API_KEY;
  if (waqiKey) {
    try {
      const response = await axios.get(
        `${WAQI_BASE_URL}/${city}/?token=${waqiKey}`,
      );
      if (response.data?.status === "ok") {
        const aqi = response.data.data.aqi;
        return {
          aqiValue: aqi,
          aqiRaw: 0,
          status: getAQIStatus(aqi),
          source: "waqi",
        };
      }
    } catch (error) {
      console.warn("[AQI] City lookup failed");
    }
  }

  const mockAqi = Math.floor(Math.random() * 100) + 20;
  return {
    aqiValue: mockAqi,
    aqiRaw: 0,
    status: getAQIStatus(mockAqi),
    source: "mock",
  };
};
