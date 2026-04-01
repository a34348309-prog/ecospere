# EcoSphere — Feature Improvement & Addition Plan

## Context

**Breathable Cities / EcoSphere** is a mobile-first environmental app (React Native + Express/Prisma/PostGIS) that tracks carbon footprint, monitors AQI, organizes eco-events, and gamifies sustainability. After a full codebase review, this plan identifies features that should be improved (wired up properly, bugs fixed, incomplete) and new features that would significantly enhance the app's value.

---

## Part A: Existing Features That Need Improvement

These are things already in the UI or backend that are broken, incomplete, or non-functional.

### 1. 🌙 Dark Mode — Toggle Exists but Does Nothing ✅ DONE
- **File**: `mobile/src/screens/Profile.tsx` (line ~63, `darkMode` state)
- **Issue**: The dark mode switch is purely local state. No theme context, no style changes, no persistence.
- **Fix**: Created `useThemeStore` Zustand store, defined dark color palette in `mobile/src/theme/colors.ts`, and wired Home + Profile screens.
- [x] Create `useThemeStore.ts` with persisted dark mode preference
- [x] Add dark color palette to `colors.ts`
- [x] Wire Profile toggle and Home screen cards with dynamic colors

### 2. 🔍 Map Search Bar — Non-Functional Placeholder ✅ DONE
- **Fix**: Converted to real `TextInput`, searches through NGOs, events, plantation drives client-side, animates map to selected result.
- [x] Replace placeholder with TextInput + search logic
- [x] Add search results dropdown with navigation

### 3. 📊 Map Bottom Card Stats — Hardcoded Values ✅ DONE
- **Fix**: Now shows real counts from fetched NGOs, events, and plantation drives.
- [x] Fetch community events alongside plantation events
- [x] Display real counts in bottom card

### 4. 📷 Bill OCR Upload — Type Always Defaults to "electricity" ✅ DONE
- **Fix**: Added bill type selector chips (Electricity/Gas/Water) above scan buttons.
- [x] Add bill type selector UI
- [x] Pass selected type to upload calls

### 5. 🔔 Notifications Toggle — Not Wired to Anything
- **File**: `mobile/src/screens/Profile.tsx` (line ~64)
- **Issue**: Notification switch is local state only. No push notification registration, no backend notification system.
- **Fix**: Integrate Expo Push Notifications, register device token with backend, send eco-alerts.
- [ ] Add `expo-notifications` package
- [ ] Create device token registration endpoint
- [ ] Send push notifications for: AQI alerts, challenge completion, event reminders, streak warnings

### 6. 🛡️ Privacy & Location Toggles — Not Connected ✅ DONE (Privacy)
- **Fix**: Added `isPublic` field to User model, wired privacy toggle to call backend `updateProfile`, leaderboard filters by `isPublic`.
- [x] Add `isPublic` field to User model
- [x] Wire privacy toggle to backend
- [x] Filter leaderboard queries by `isPublic`

### 7. 📌 Navigate Button on Map — Does Nothing ✅ DONE
- **Fix**: Added `onPress` handler that animates map to user's current location.
- [x] Add `onPress` to animate to `userLocation`

### 8. 👤 Profile Picture — Only Initials, No Image Upload
- **File**: `mobile/src/screens/Profile.tsx`
- **Issue**: Uses `Avatar.Text` with initials only. No profile image upload capability.
- **Fix**: Add image picker, upload to backend, store URL in User model.
- [ ] Add `profileImage` field to Prisma User model
- [ ] Create image upload endpoint (reuse multer config from carbon)
- [ ] Add image picker to edit profile modal

### 9. 🔑 No Password Change / Forgot Password Flow ✅ DONE
- **Fix**: Added `PUT /api/v1/auth/change-password` endpoint + password change modal in Profile.
- [x] Add `PUT /api/v1/auth/change-password` with Zod validation
- [x] Add password change modal in Profile
- [x] Add `DELETE /api/v1/auth/account` for account deletion with cascade

### 10. 📱 Onboarding Calculator — One-Shot, Can't Re-Trigger
- **File**: `mobile/src/navigation/AppNavigator.tsx`, `mobile/src/screens/Calculator.tsx`
- **Issue**: If a user skips or completes onboarding calculator, there's no way to see that guided flow again.
- **Fix**: Minor — the recalculate button exists, but consider adding a "Reset Onboarding" option in settings for testing/demo purposes.

---

## Part B: New Features to Add

### 11. 📈 Analytics Dashboard — Monthly/Yearly Carbon Trends ✅ DONE
- **What**: New Analytics screen with timeline bar chart, category breakdown, trend indicator, period selector.
- [x] Create `GET /api/v1/activities/analytics?period=monthly` endpoint
- [x] Build `Analytics.tsx` screen with bar chart and category breakdown
- [x] Add to navigation + Home quick actions

### 12. 🏆 Team/Group Challenges
- **Why**: Only individual challenges exist. Social accountability is a key motivator.
- **What**:
  - Create a "Team" model where friends can form eco-teams
  - Team-wide challenges (e.g., "Team plants 100 trees this month")
  - Team leaderboard
- [ ] Add `Team` and `TeamMember` models to Prisma
- [ ] Add team CRUD + team challenges endpoints
- [ ] Build team challenge UI component

### 13. 💧 Water Footprint Tracking
- **Why**: The app focuses only on carbon. Water is another critical environmental resource.
- **What**: 
  - Add water usage tracking (shower time, laundry loads, etc.)
  - Water footprint calculator  
  - Combine into an overall "Environmental Impact Score"
- [ ] Add water activity types to activity tracker
- [ ] Calculate water consumption impact
- [ ] Display in home dashboard alongside carbon stats

### 14. 📤 Social Sharing — Share Eco Achievements
- **Why**: `SharePlan` component exists (`mobile/src/components/SharePlan.tsx`) but limited.
- **What**:
  - Share eco score, streaks, badges, and milestones as shareable image cards
  - Deep links back to app
  - Share weekly/monthly progress reports
- [ ] Generate shareable image cards (react-native-view-shot)
- [ ] Add `expo-sharing` integration
- [ ] Create shareable templates for milestones, badges, streaks

### 15. 🌍 Community Activity Feed
- **Why**: No visibility into what friends are doing. Social proof drives engagement.
- **What**:
  - Feed showing friend activities: "Alice planted 5 trees", "Bob completed Green Commuter challenge"
  - Like/react to friend actions  
  - Activity sharing opt-in via privacy settings
- [ ] Create `FeedItem` model or aggregate from existing data
- [ ] Build `CommunityFeed.tsx` screen
- [ ] Add feed API endpoint

### 16. 📆 Event Reminders & Calendar Integration
- **Why**: Users join events but have no reminder system. Easy to forget.
- **What**:
  - Add events to device calendar (`expo-calendar`)
  - Send push notification reminders 24h and 1h before event
  - Show upcoming joined events on home screen
- [ ] Integrate `expo-calendar` for adding events
- [ ] Build reminder notification system
- [ ] Add "My Events" section to home or events screen

### 17. 🌡️ Weather Integration on Map
- **Why**: AQI data exists but weather context (temperature, humidity, wind) helps users make outdoor decisions.
- **What**: Show current weather alongside AQI in the map insight card.
- [ ] Fetch weather data from OpenWeather alongside AQI (same API key)
- [ ] Display temperature, humidity, wind in map bottom card

### 18. 📵 Offline Mode & Data Caching
- **Why**: App fully depends on network. No offline capability at all.
- **What**:
  - Cache last known stats, challenges, eco plan locally
  - Queue activity logs when offline, sync when back online
  - Show cached AQI when network unavailable
- [ ] Add offline queue for activity logging
- [ ] Cache critical data in AsyncStorage
- [ ] Add network status indicator

### 19. 🗑️ Account Deletion ✅ DONE
- **Fix**: Added `DELETE /api/v1/auth/account` with cascade deletion of all user data + confirmation dialog in Profile.
- [x] Add cascade delete endpoint
- [x] Add delete account button in Profile with confirmation modal

### 20. 🔄 Refresh Token Mechanism
- **Why**: Current JWT has fixed 7-day expiry. No refresh mechanism — users get silently logged out.
- **What**:
  - Implement refresh token rotation
  - Auto-refresh on 401 responses in Axios interceptor
  - Secure token storage
- [ ] Add refresh token generation and storage
- [ ] Create `POST /api/v1/auth/refresh` endpoint
- [ ] Add Axios interceptor for automatic token refresh

### 21. 📧 Email Verification on Signup
- **Why**: No email verification — anyone can register with any email, including fake ones.
- **What**:
  - Send verification email/OTP on registration
  - Add `emailVerified` field to User model
  - Restrict certain features to verified users
- [ ] Add email service (nodemailer/SendGrid)
- [ ] Add verification flow
- [ ] Add `emailVerified` boolean to User model

### 22. 🌿 Nearby Green Spaces on Map
- **Why**: Map shows NGOs and plantation drives but not parks, gardens, or green spaces.
- **What**:
  - Integrate Google Places API to fetch nearby parks/gardens
  - Show as green markers on map
  - Include walking distance and directions
- [ ] Fetch nearby parks using Places API
- [ ] Add green space markers to map
- [ ] Show distance and basic info

---

## Priority Ranking (by impact × effort)

| Priority | Feature | Type | Impact | Effort |
|----------|---------|------|--------|--------|
| 🔴 P0 | Dark Mode (#1) | Fix | High | Medium |
| 🔴 P0 | Map Search (#2) | Fix | High | Low |
| 🔴 P0 | Map Stats (#3) | Fix | Medium | Low |
| 🔴 P0 | Bill Type Selector (#4) | Fix | Medium | Low |
| 🔴 P0 | Navigate Button (#7) | Fix | Low | Very Low |
| 🟡 P1 | Push Notifications (#5) | Fix+New | High | Medium |
| 🟡 P1 | Analytics Dashboard (#11) | New | Very High | Medium |
| 🟡 P1 | Social Sharing (#14) | New | High | Medium |
| 🟡 P1 | Password Change (#9) | Fix | Medium | Low |
| 🟡 P1 | Account Deletion (#19) | New | Medium | Low |
| 🟢 P2 | Profile Picture (#8) | Fix | Medium | Medium |
| 🟢 P2 | Community Feed (#15) | New | High | High |
| 🟢 P2 | Event Reminders (#16) | New | High | Medium |
| 🟢 P2 | Team Challenges (#12) | New | High | High |
| 🟢 P2 | Privacy/Location Toggles (#6) | Fix | Low | Low |
| 🟢 P2 | Refresh Token (#20) | New | Medium | Medium |
| 🔵 P3 | Weather on Map (#17) | New | Medium | Low |
| 🔵 P3 | Water Footprint (#13) | New | Medium | High |
| 🔵 P3 | Offline Mode (#18) | New | Medium | High |
| 🔵 P3 | Email Verification (#21) | New | Medium | Medium |
| 🔵 P3 | Green Spaces on Map (#22) | New | Low | Medium |

---

## Files That Will Be Modified (Summary)

### Backend
- `backend/prisma/schema.prisma` — New fields (profileImage, isPublic, emailVerified) + new models (Team, FeedItem, DeviceToken)
- `backend/src/controllers/auth.controller.ts` — Password change, account deletion, email verification
- `backend/src/controllers/user.controller.ts` — Profile image upload, privacy settings
- `backend/src/controllers/activity.controller.ts` — Analytics aggregation endpoint
- `backend/src/routes/*.routes.ts` — New routes for search, analytics, teams, etc.
- `backend/src/services/` — New services for notifications, analytics, search
- `backend/src/schemas/index.ts` — New Zod schemas for new endpoints

### Mobile
- `mobile/src/theme/colors.ts` — Dark mode color palette
- `mobile/src/store/useThemeStore.ts` — New theme store
- `mobile/src/store/useAuthStore.ts` — Extended with theme preference
- `mobile/src/screens/Profile.tsx` — Wire dark mode, privacy, add password change, delete account
- `mobile/src/screens/Map.tsx` — Fix search, stats, navigate button, add weather
- `mobile/src/screens/Calculator.tsx` — Bill type selector
- `mobile/src/screens/Analytics.tsx` — New screen
- `mobile/src/screens/CommunityFeed.tsx` — New screen
- `mobile/src/services/api.config.ts` — New endpoints
- `mobile/src/navigation/AppNavigator.tsx` — Add new screens

### Existing Code to Reuse
- `backend/src/middleware/auth.middleware.ts` — Existing JWT auth for new routes
- `backend/src/middleware/validate.ts` — Existing Zod validation middleware
- `backend/src/middleware/rateLimiter.ts` — Existing rate limiting
- `backend/src/lib/prisma.ts` — Existing Prisma client
- `backend/src/lib/socket.ts` — Existing Socket.io for real-time notifications
- `mobile/src/services/api.config.ts` — Existing API config pattern
- `mobile/src/store/useAuthStore.ts` — Existing Zustand store pattern
- `mobile/src/components/ActionCard.tsx` — Reusable card pattern

## Verification

- Run `npm run dev` in backend, check all new endpoints via Swagger at `/api/docs`
- Run `npx expo start` in mobile, verify each screen for new/fixed features
- Test dark mode toggle persists across app restarts
- Test map search returns real results and animates to location
- Test bill upload with gas/water type selection
- Test push notifications delivery on AQI alert
- Test password change flow end-to-end
- Test account deletion removes all user data
