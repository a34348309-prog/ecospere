import axios from "axios";
import prisma from "../lib/prisma";
import { emitToUser } from "../lib/socket";

const AQI_THRESHOLD = 100;

// ── API URLs ────────────────────────────────────────────────
const OPENWEATHER_AQI_URL =
  "http://api.openweathermap.org/data/2.5/air_pollution";
const WAQI_BASE_URL = "https://api.waqi.info/feed";
const GOOGLE_AQI_URL = "https://airquality.googleapis.com/v1";

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
 * Compute US EPA AQI from PM2.5 concentration (μg/m³).
 * Uses official EPA breakpoint table for accurate continuous values.
 */
const computeAQIFromPM25 = (pm25: number): number => {
  const breakpoints = [
    { cLow: 0,     cHigh: 12,    iLow: 0,   iHigh: 50  },
    { cLow: 12.1,  cHigh: 35.4,  iLow: 51,  iHigh: 100 },
    { cLow: 35.5,  cHigh: 55.4,  iLow: 101, iHigh: 150 },
    { cLow: 55.5,  cHigh: 150.4, iLow: 151, iHigh: 200 },
    { cLow: 150.5, cHigh: 250.4, iLow: 201, iHigh: 300 },
    { cLow: 250.5, cHigh: 350.4, iLow: 301, iHigh: 400 },
    { cLow: 350.5, cHigh: 500.4, iLow: 401, iHigh: 500 },
  ];

  // Truncate to 1 decimal (EPA standard)
  const c = Math.floor(pm25 * 10) / 10;
  if (c < 0) return 0;
  if (c > 500.4) return 500;

  for (const bp of breakpoints) {
    if (c >= bp.cLow && c <= bp.cHigh) {
      return Math.round(
        ((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (c - bp.cLow) + bp.iLow,
      );
    }
  }

  return 100; // safe fallback
};

// ── PPB → μg/m³ conversion factors (at 25°C, 1 atm) ────
const PPB_TO_UGM3: Record<string, number> = {
  co: 1.145,   // CO molecular weight 28.01
  no2: 1.88,   // NO2 molecular weight 46.01
  o3: 1.96,    // O3 molecular weight 48.00
  so2: 2.62,   // SO2 molecular weight 64.07
};

/**
 * Convert Google's Universal AQI (0-100, higher = better) to
 * approximate US EPA scale (0-500, lower = better).
 */
const mapUAQItoEPA = (uaqi: number): number => {
  if (uaqi >= 80) return Math.round(50 - ((uaqi - 80) / 20) * 50);     // 80-100 → 50-0
  if (uaqi >= 60) return Math.round(100 - ((uaqi - 60) / 20) * 50);    // 60-79 → 100-51
  if (uaqi >= 40) return Math.round(150 - ((uaqi - 40) / 20) * 50);    // 40-59 → 150-101
  if (uaqi >= 20) return Math.round(200 - ((uaqi - 20) / 20) * 50);    // 20-39 → 200-151
  return Math.round(500 - (uaqi / 20) * 300);                            // 0-19 → 500-201
};

/**
 * Extract pollutant components from Google Air Quality API response.
 */
const mapGooglePollutants = (pollutants: any[]): PollutantComponents => {
  const components: PollutantComponents = {
    co: 0, no: 0, no2: 0, o3: 0, so2: 0, pm2_5: 0, pm10: 0, nh3: 0,
  };

  for (const p of pollutants) {
    const val = p.concentration?.value ?? 0;
    const unit = p.concentration?.units;
    const isUgm3 = unit === "MICROGRAMS_PER_CUBIC_METER";

    switch (p.code) {
      case "pm25":
        components.pm2_5 = val; // always μg/m³
        break;
      case "pm10":
        components.pm10 = val;
        break;
      case "co":
        components.co = isUgm3 ? val : val * PPB_TO_UGM3.co;
        break;
      case "no2":
        components.no2 = isUgm3 ? val : val * PPB_TO_UGM3.no2;
        break;
      case "o3":
        components.o3 = isUgm3 ? val : val * PPB_TO_UGM3.o3;
        break;
      case "so2":
        components.so2 = isUgm3 ? val : val * PPB_TO_UGM3.so2;
        break;
    }
  }

  return components;
};

/**
 * Fetch current AQI from Google Air Quality API.
 * Returns null on failure so callers can fall back.
 */
const fetchAQIFromGoogle = async (
  lat: number,
  lng: number,
): Promise<AQIResult | null> => {
  const googleKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!googleKey) return null;

  try {
    const response = await axios.post(
      `${GOOGLE_AQI_URL}/currentConditions:lookup?key=${googleKey}`,
      {
        location: { latitude: lat, longitude: lng },
        extraComputations: ["LOCAL_AQI", "POLLUTANT_CONCENTRATION"],
      },
    );

    const data = response.data;
    const indexes = data?.indexes ?? [];
    const pollutants = data?.pollutants ?? [];

    // Prefer the local AQI index (USA EPA, India NAQI, etc.) — skip UAQI
    const localIndex = indexes.find((i: any) => i.code !== "uaqi");
    const uaqiIndex = indexes.find((i: any) => i.code === "uaqi");

    let aqiValue: number;
    let status: string;

    if (localIndex) {
      // Local AQI is on a 0-500 scale (EPA/NAQI), use directly
      aqiValue = localIndex.aqi;
      status = getAQIStatus(aqiValue);
    } else if (uaqiIndex) {
      // Convert Universal AQI to EPA-like scale
      aqiValue = mapUAQItoEPA(uaqiIndex.aqi);
      status = getAQIStatus(aqiValue);
    } else {
      return null;
    }

    const components = pollutants.length > 0
      ? mapGooglePollutants(pollutants)
      : undefined;

    console.log(
      `[AQI] Google API: AQI ${aqiValue} (${status}), source index: ${localIndex?.code ?? "uaqi"}`,
    );

    return {
      aqiValue,
      aqiRaw: uaqiIndex?.aqi ?? 0,
      status,
      source: "google",
      components,
    };
  } catch (error: any) {
    console.warn("[AQI] Google Air Quality API failed:", error?.message || error);
    return null;
  }
};

/**
 * Fetch current AQI — tries Google (primary), then OpenWeather, then WAQI, then mock.
 */
export const fetchAQI = async (
  lat: number,
  lng: number,
): Promise<AQIResult> => {
  // 1. Try Google Air Quality API (primary)
  const googleResult = await fetchAQIFromGoogle(lat, lng);
  if (googleResult) return googleResult;

  // 2. Fallback: OpenWeather Air Pollution API
  const owKey = process.env.OPENWEATHER_API_KEY;
  if (owKey && owKey !== "YOUR_OPENWEATHER_API_KEY") {
    try {
      const response = await axios.get(
        `${OPENWEATHER_AQI_URL}?lat=${lat}&lon=${lng}&appid=${owKey}`,
      );
      const entry = response.data?.list?.[0];
      if (entry) {
        const rawAqi = entry.main.aqi;
        const epaAqi = mapOpenWeatherAQI(rawAqi);
        console.log(`[AQI] OpenWeather fallback: AQI ${epaAqi}`);
        return {
          aqiValue: epaAqi,
          aqiRaw: rawAqi,
          status: getAQIStatus(epaAqi),
          source: "openweather",
          components: entry.components,
        };
      }
    } catch (error) {
      console.warn("[AQI] OpenWeather API failed, trying WAQI");
    }
  }

  // 3. Fallback: WAQI
  const waqiKey = process.env.AQI_API_KEY;
  if (waqiKey) {
    try {
      const response = await axios.get(
        `${WAQI_BASE_URL}/geo:${lat};${lng}/?token=${waqiKey}`,
      );
      if (response.data?.status === "ok") {
        const aqi = response.data.data.aqi;
        console.log(`[AQI] WAQI fallback: AQI ${aqi}`);
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

  // 4. Mock fallback for development
  const mockAqi = Math.floor(Math.random() * 200) + 20;
  return {
    aqiValue: mockAqi,
    aqiRaw: 0,
    status: getAQIStatus(mockAqi),
    source: "mock",
  };
};

/**
 * Fetch hourly AQI forecast from Google Air Quality API.
 * Returns null on failure so callers can fall back to OpenWeather.
 */
const fetchAQIForecastFromGoogle = async (
  lat: number,
  lng: number,
): Promise<AQIForecastEntry[] | null> => {
  const googleKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!googleKey) return null;

  try {
    // Google forecast supports up to ~4 days ahead
    const now = new Date();
    const end = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);

    const response = await axios.post(
      `${GOOGLE_AQI_URL}/forecast:lookup?key=${googleKey}`,
      {
        location: { latitude: lat, longitude: lng },
        period: {
          startTime: now.toISOString(),
          endTime: end.toISOString(),
        },
        universalAqi: true,
        pageSize: 96, // ~4 days of hourly data
      },
    );

    const forecasts = response.data?.hourlyForecasts ?? [];
    if (forecasts.length === 0) return null;

    console.log(`[AQI] Google forecast: ${forecasts.length} hourly entries`);

    return forecasts.map((entry: any) => {
      const indexes = entry.indexes ?? [];
      const localIndex = indexes.find((i: any) => i.code !== "uaqi");
      const uaqiIndex = indexes.find((i: any) => i.code === "uaqi");

      let aqiValue: number;
      if (localIndex) {
        aqiValue = localIndex.aqi;
      } else if (uaqiIndex) {
        aqiValue = mapUAQItoEPA(uaqiIndex.aqi);
      } else {
        aqiValue = 50; // safe default
      }

      return {
        dt: Math.floor(new Date(entry.dateTime).getTime() / 1000),
        aqiValue,
        aqiRaw: uaqiIndex?.aqi ?? 0,
        status: getAQIStatus(aqiValue),
        components: {
          co: 0, no: 0, no2: 0, o3: 0, so2: 0, pm2_5: 0, pm10: 0, nh3: 0,
        },
      };
    });
  } catch (error: any) {
    console.warn("[AQI] Google forecast API failed:", error?.message || error);
    return null;
  }
};

/**
 * Fetch 4-day hourly AQI forecast — tries Google (primary), then OpenWeather.
 */
export const fetchAQIForecast = async (
  lat: number,
  lng: number,
): Promise<AQIForecastEntry[]> => {
  // 1. Try Google Air Quality API forecast
  const googleForecast = await fetchAQIForecastFromGoogle(lat, lng);
  if (googleForecast && googleForecast.length > 0) return googleForecast;

  // 2. Fallback: OpenWeather forecast
  const owKey = process.env.OPENWEATHER_API_KEY;
  if (!owKey || owKey === "YOUR_OPENWEATHER_API_KEY") {
    throw new Error("No AQI forecast API available (Google failed, OpenWeather not configured)");
  }

  console.log("[AQI] Falling back to OpenWeather forecast");
  const response = await axios.get(
    `${OPENWEATHER_AQI_URL}/forecast?lat=${lat}&lon=${lng}&appid=${owKey}`,
  );

  const list = response.data?.list ?? [];
  return list.map((entry: any) => {
    const rawAqi = entry.main.aqi;
    // Use PM2.5 concentration for accurate EPA AQI instead of crude 1-5 mapping
    const pm25 = entry.components?.pm2_5 ?? 0;
    const epaAqi = pm25 > 0 ? computeAQIFromPM25(pm25) : mapOpenWeatherAQI(rawAqi);
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
    const pm25 = entry.components?.pm2_5 ?? 0;
    const epaAqi = pm25 > 0 ? computeAQIFromPM25(pm25) : mapOpenWeatherAQI(rawAqi);
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
