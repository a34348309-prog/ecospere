# Plan: Carbon Calculator Onboarding + Nav Footer Fix

## Context

Two issues to address:

1. **Carbon Calculator as onboarding step** — The Calculator screen (2nd tab in bottom nav) should be shown as part of the onboarding flow after signup. When users subsequently log daily activities via EcoTracker, those emissions should accumulate on top of the baseline calculated during onboarding.

2. **Nav footer missing on Home after login** — After login/signup, `currentScreen` stays as `"login"` or `"signup"`. The `renderScreen()` renders `<Home>` but the tab bar visibility check (`isTabScreen`) fails because `currentScreen` isn't `"home"` — it's still `"login"`. The tab bar only appears after navigating to another tab screen and back.

## Approach

### Bug Fix: Nav Footer

In `App.tsx`, there's a commented-out `useEffect` (line ~251) that does exactly what's needed — when a `user` exists and `currentScreen` is still auth-related, it should set `currentScreen` to `"home"`. **Uncomment this useEffect.**

### Feature: Onboarding Calculator

**Flow:** `Signup → setAuth() → App detects user with lifetimeCarbon=0 → show Calculator (onboarding mode) → user calculates → Continue → Home`

- Add an `isOnboarding` prop and `onComplete` callback to `Calculator`.
- When `isOnboarding=true`:
  - Hide the "Scan Utility Bill" OCR section and bill history (not relevant during onboarding).
  - Show a welcome header ("Let's calculate your carbon footprint") instead of the default one.
  - After calculation results are shown, display a prominent "Continue to Home" button instead of just "Recalculate".
- In `App.tsx`, add a new screen `"onboarding"` that renders `<Calculator isOnboarding onComplete={() => setCurrentScreen("home")} />`.
- The navigation logic: when `user` exists and `currentScreen` transitions away from auth screens, check if `user.lifetimeCarbon === 0` (never calculated). If so, go to `"onboarding"` instead of `"home"`.
- After onboarding completes, `updateCalculatorStats` saves the baseline → `lifetimeCarbon` is set on the backend. Subsequent calls to `logActivity` in EcoTracker already do `lifetimeCarbon: { increment: Math.max(carbonKg, 0) }` on the backend, so daily logs automatically add to the baseline. When user opens Calculator again from the tab, `fetchUserStats` fetches the accumulated total.
- After `updateCalculatorStats` returns, call `updateUser({ lifetimeCarbon, treesToOffset })` on the auth store so the local user object is up-to-date (prevents re-triggering onboarding).

## Files to Modify

| File | Change |
|------|--------|
| `mobile/App.tsx` | Uncomment the `useEffect` for nav fix; add `"onboarding"` screen routing; check `user.lifetimeCarbon` to decide initial screen |
| `mobile/src/screens/Calculator.tsx` | Add `isOnboarding?: boolean` and `onComplete?: () => void` props; conditionally hide OCR section and bill history; show onboarding header + "Continue" button |

## Reuse

- `updateCalculatorStats()` in `mobile/src/services/auth.service.ts` — already saves `lifetimeCarbon` and `treesToOffset` to backend.
- `useAuthStore.updateUser()` in `mobile/src/store/useAuthStore.ts` — updates local user object.
- `logActivity` in `backend/src/services/activity.service.ts` (line ~60) — already increments `lifetimeCarbon` on the user when activities are logged: `lifetimeCarbon: { increment: Math.max(carbonKg, 0) }`. No backend changes needed.
- The commented-out `useEffect` in `App.tsx` (~line 251) — directly solves the nav footer bug.

## Steps

- [ ] **1. Fix nav footer bug** — In `App.tsx`, uncomment the `useEffect` that sets `currentScreen="home"` and `activeTab="home"` when `user` exists and `currentScreen` is `"login"`, `"signup"`, or `"splash"`.

- [ ] **2. Add onboarding props to Calculator** — Add `isOnboarding?: boolean` and `onComplete?: () => void` props to `Calculator`. When `isOnboarding` is true:
  - Change header title to "Let's calculate your carbon footprint" with a welcome subtitle.
  - After results are shown, add a prominent "Continue to Home →" button that calls `onComplete()`.
  - Hide the "Scan Utility Bill" card and bill history section.
  - After `handleCalculate` succeeds, also call `useAuthStore.getState().updateUser({ lifetimeCarbon: lifeEmission, treesToOffset: trees })` so the local user store reflects the new values immediately.

- [ ] **3. Add onboarding routing in App.tsx** — In the `useEffect` that handles auth→home transitions, check `user.lifetimeCarbon`: if it's `0` (or falsy), set `currentScreen` to `"onboarding"` instead of `"home"`. Add `"onboarding"` to the `renderScreen()` switch, rendering `<Calculator isOnboarding onComplete={() => { setCurrentScreen("home"); setActiveTab("home"); }} />`. Keep `"onboarding"` out of the `isTabScreen` list so the tab bar doesn't show during onboarding.

## Verification

1. **New user signup flow**: Sign up → should see Calculator in onboarding mode (no OCR section, welcome header) → fill in travel/electricity/age → calculate → see results → tap "Continue to Home" → land on Home with tab bar visible.
2. **Existing user login**: Log in (user has `lifetimeCarbon > 0`) → land directly on Home with tab bar visible.
3. **Nav footer on first load**: After login, the bottom tab bar should be immediately visible on Home — no need to navigate away and back.
4. **Emissions accumulation**: After onboarding, go to EcoTracker → log an activity (e.g., drove 20km) → go to Calculator tab → the displayed lifetime emission should be higher than the original onboarding calculation (backend incremented it).
