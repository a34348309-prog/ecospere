# Plan: Switch AQI Data Source to Google Air Quality API

## Context
The backend currently fetches AQI data from OpenWeather Air Pollution API (primary) and WAQI (fallback). The user wants to switch to Google Maps Air Quality API as the primary source. A `GOOGLE_MAPS_API_KEY` is already configured in `.env` and confirmed working — the API returns real-time AQI, pollutant concentrations, and forecasts.

## Approach
Replace OpenWeather as the **primary** AQI source in the backend service (`backend/src/services/aqi.service.ts`) with Google Air Quality API. Keep OpenWeather + WAQI as fallbacks. The frontend stays untouched — the backend maps Google's response to the existing `AQIResult` format.

**Google Air Quality API endpoints used:**
- `POST https://airquality.googleapis.com/v1/currentConditions:lookup` — current AQI
- `POST https://airquality.googleapis.com/v1/forecast:lookup` — hourly forecast

**Key mapping details:**
- Google returns a **local AQI** via `extraComputations: ["LOCAL_AQI", "POLLUTANT_CONCENTRATION"]` — this gives region-appropriate indexes (US EPA for US users, NAQI for India, etc.) on a 0-500 scale that matches the app's existing scale
- The local AQI index code varies by region (`usa_epa`, `ind_cpcb`, etc.), so we pick whichever non-UAQI index is returned, or fall back to Universal AQI with a scale conversion
- **Pollutant mapping**: Google returns PM2.5 and PM10 in μg/m³ (matches existing), O3 and NO2 in ppb (need conversion: O3 ppb×1.96=μg/m³, NO2 ppb×1.88=μg/m³), CO in ppb (×1.15=μg/m³), SO2 in ppb (×2.62=μg/m³). Fields `no` and `nh3` are not provided by Google — set to 0.

## Files to Modify
- `backend/src/services/aqi.service.ts` — Add Google AQI fetch functions, update `fetchAQI` and `fetchAQIForecast`

## Reuse
- `GOOGLE_MAPS_API_KEY` from `process.env` — already in `.env`
- `getAQIStatus()` in `backend/src/services/aqi.service.ts` — maps EPA-scale value to status label, works for local AQI values too
- Existing `AQIResult`, `AQIForecastEntry`, `PollutantComponents` types — response format stays the same
- `mapOpenWeatherAQI()` — still used in OpenWeather fallback path, unchanged
- Entire frontend (`aqi.service.ts`, `Map.tsx`, `Home.tsx`, `App.tsx`) — **no changes needed**, backend contract unchanged

## Steps

- [ ] **Add Google Air Quality API fetch function**: Create `fetchAQIFromGoogle(lat, lng)` in `backend/src/services/aqi.service.ts`. Calls `currentConditions:lookup` with `extraComputations: ["LOCAL_AQI", "POLLUTANT_CONCENTRATION"]`. Extracts the local AQI index (non-UAQI) or converts UAQI to EPA scale. Maps pollutant concentrations to the existing `PollutantComponents` format with unit conversions.

- [ ] **Update `fetchAQI` priority chain**: Change the order to: (1) Google Air Quality API (primary), (2) OpenWeather (fallback), (3) WAQI (fallback), (4) Mock. The `source` field in `AQIResult` is set to `"google"` for Google responses.

- [ ] **Add Google forecast function**: Create `fetchAQIForecastFromGoogle(lat, lng)` that calls `forecast:lookup` for 4 days of hourly data. Returns the same `AQIForecastEntry[]` format. Uses local AQI index when available.

- [ ] **Update `fetchAQIForecast` priority chain**: Try Google forecast first, fall back to OpenWeather forecast if Google fails.

## Verification
- Start backend, hit `GET /api/v1/aqi/current?lat=28.6139&lng=77.209` — should return Google-sourced data with `source: "google"`
- Hit `GET /api/v1/aqi/forecast?lat=28.6139&lng=77.209` — should return hourly forecast entries
- Check Map screen: AQI value, status, and pollutant chips (PM2.5, PM10, O3, NO2) should display real data
- Check Home screen: 4-day AQI forecast card should show real averages
- Remove `GOOGLE_MAPS_API_KEY` temporarily — should fall back to OpenWeather gracefully
