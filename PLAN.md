# Plan: XP Update Bug, Navigation Change, Profile UI Improvement

## Context
Three issues to address:
1. **XP not updating on Home page** — When a weekly challenge is completed via the EcoTracker, the backend awards XP (`ecoScore`) but the frontend auth store is never updated. Home reads `user?.ecoScore` from the stale store, so it shows old values until app restart.
2. **Navigation swap** — Replace "Calculator" tab in bottom nav with "Daily Tracker" (EcoTracker). Move Calculator access into the Profile page as a tools section.
3. **Profile UI improvement** — The current profile page has a flat teal design with basic cards and hardcoded badges. Redesign to match the polished Home/Journey aesthetic.

## Approach

### Issue 1: XP not updating
**Root cause:** In `EcoTracker.handleLogActivity`, when the backend responds with `completedChallenges`, it has already incremented `ecoScore` in the DB. But the frontend never syncs — `useAuthStore.user.ecoScore` stays stale. Home uses `user?.ecoScore ?? stats?.ecoScore`, so the stale store value always wins.

**Fix:** After logging an activity in EcoTracker, refetch fresh user stats via `getCalculatorStats()` and call `useAuthStore.getState().updateUser()` to sync the store. This ensures Home (and all other screens) immediately reflect the new XP/level.

### Issue 2: Navigation swap
Change the `TAB_ITEMS` array in `App.tsx` to replace calculator with ecoTracker. Update the `renderScreen` switch. Add a "Calculator" entry point in Profile as a touchable tools row. EcoTracker needs its `onBack` removed since it's now a tab screen (no back button needed).

### Issue 3: Profile UI
Redesign with the same design system as Home/Journey: neutral `Colors.background`, proper card shadows, gradient header card, meaningful stat display, tools section with Calculator link, and proper badges tied to real achievement data.

---

## Files to Modify
- `mobile/src/screens/EcoTracker.tsx` — Sync auth store after activity log (fix XP bug); adapt for tab usage (remove back button when used as tab)
- `mobile/App.tsx` — Swap calculator → ecoTracker in TAB_ITEMS and renderScreen; pass `onNavigate` to Profile
- `mobile/src/screens/Profile.tsx` — Full UI redesign; add Calculator navigation link
- `mobile/src/screens/Home.tsx` — Use fresh stats over stale store data for ecoScore/level

## Reuse
- `useAuthStore.updateUser()` — `mobile/src/store/useAuthStore.ts` — Update user fields in persisted store
- `getCalculatorStats()` — `mobile/src/services/auth.service.ts` — Returns fresh `ecoScore`, `level`, `totalTreesPlanted`, etc. from DB
- `Colors` — `mobile/src/theme/colors.ts` — All color tokens
- `LinearGradient` — `expo-linear-gradient` — Already used across the app
- Card pattern from Home.tsx — `borderRadius: 18`, `padding: 20`, soft shadow

---

## Steps

### Issue 1: Fix XP not updating

- [x] **EcoTracker.tsx — Sync store after activity log**

- [x] **Home.tsx — Prefer fresh stats over stale store**

### Issue 2: Replace Calculator with Daily Tracker in nav

- [x] **App.tsx — Update TAB_ITEMS**

- [x] **App.tsx — Update isTabScreen check**

- [x] **App.tsx — Update renderScreen**

- [x] **EcoTracker.tsx — Support tab mode**

- [x] **App.tsx — Pass onNavigate to Profile**

- [x] **Home.tsx — Quick Actions** — Already navigates to `'calculator'` which remains a valid screen.

### Issue 3: Profile UI redesign

- [x] **Profile.tsx — Redesigned header**: Dark green gradient card (#065F46 → #064E3B), horizontal layout with avatar + info side-by-side, level badge on avatar, rank & member-since tags.

- [x] **Profile.tsx — Redesigned stats section**: 4-column stats row with icon backgrounds, dividers. Shows Trees, Eco Score, Rank, CO₂ Debt.

- [x] **Profile.tsx — Added Tools section**: Card with rows for Carbon Calculator and Eco Plan, each with icon, title, subtitle, and chevron for navigation.

- [x] **Profile.tsx — Redesigned badges section**: 8 data-driven badges with real thresholds (trees/ecoScore/level), locked state with Lock icon overlay, count chip showing earned/total.

- [x] **Profile.tsx — Redesigned settings section**: `Colors.background` page background, icon backgrounds for each setting, cleaner dividers, consistent card styling.

- [x] **Profile.tsx — Polished account info & logout**: Info rows with icon backgrounds and bottom borders, red logout button with FEF2F2 background and FECACA border.

---

## Verification
- Run `npx tsc --noEmit` for type checking
- Test EcoTracker: log an activity that completes a challenge → navigate to Home → verify XP/level updates immediately
- Test nav: verify "Tracker" tab opens EcoTracker, Calculator is accessible from Profile tools, back navigation works from Calculator
- Test Profile: verify all sections render, Calculator link navigates correctly, edit profile modal still works, logout works
- Test on small screen to verify no layout issues
