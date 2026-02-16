# Breathable Cities - Production-Ready Full Stack App

Breathable Cities is a mobile-first environmental application designed to track carbon footprint, join eco-events, and monitor environmental analytics.

## Tech Stack
- **Frontend**: React Native (Expo), TypeScript, Zustand, React Navigation, React Native Paper.
- **Backend**: Node.js, Express, Prisma ORM, PostgreSQL + PostGIS, Socket.io.

## Prerequisites
- Node.js (v18+)
- PostgreSQL with PostGIS extension installed.
- Expo Go app on your mobile device for testing.

## Getting Started

### 1. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables:
   Create a `.env` file in the `backend` folder:
   ```env
   DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/ecosphere?schema=public"
   JWT_SECRET="your_very_secret_key"
   AQI_API_KEY="your_waqi_api_token"
   ```
4. Run Prisma migrations:
   ```bash
   npx prisma migrate dev --name init
   ```
5. Seed the database:
   ```bash
   npm run prisma:seed
   ```
6. Start the development server:
   ```bash
   npm run dev
   ```

### 2. Frontend Setup
1. Navigate to the mobile directory:
   ```bash
   cd mobile
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Expo server:
   ```bash
   npx expo start
   ```
4. Scan the QR code with your Expo Go app (Android) or Camera app (iOS).

## Features Implemented
- **Premium UI**: Exactly matching Figma screenshots using React Native Paper and Lucide icons.
- **Navigation**: Full Auth flow (Splash, Login, Signup) and Main flow (Home, Calculator, Map, Leaderboard, Profile).
- **Impact Analysis**: Visual breakdown of carbon footprint and environmental contribution.
- **Eco Map**: Interactive map (via `react-native-maps`) with PostGIS-ready spatial query support.
- **Real-time**: Socket.io integration for live updates (AQI, Events).
- **Zustand Store**: Clean state management for auth and user data.

## Note on PostGIS
The database requires the PostGIS extension. Run the following in your SQL editor:
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```
