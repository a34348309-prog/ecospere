# Plan: Clean Up Home Screen + Onboarding Calculator Visual Polish

## Context

The Home screen feels "too saturated" — every section has its own colored background (green `#E0F2F1`, cyan `#E0F7FA`, blue `#E1F5FE`) stacked directly on top of each other on a mint `#F0FDFA` background. Combined with heavy borders and `800`-weight fonts everywhere, it creates visual noise. The user wants a cleaner, calmer experience while keeping all existing content.

The onboarding Calculator screen also needs visual polish to feel like a proper first-impression experience.

## Approach

**Design direction: Calm, airy, neutral base with surgical color accents.**

The core principle: color should highlight data, not decorate containers. Cards become white with subtle shadows. The background becomes near-white. Color is reserved for progress bars, badges, icons, and key numbers — the things you actually want the user's eye drawn to.

### Home Screen Changes (styles + layout, no content removal)

1. **Background**: `#F0FDFA` (mint) → `#F7F8FA` (neutral near-white). Stops the entire screen from feeling tinted.
2. **Card containers**: All colored `LinearGradient` backgrounds (Level, Oxygen, Challenge cards) → clean `#FFFFFF` with subtle shadow, no border. Consistent treatment across every card.
3. **Section spacing**: Increase `marginBottom` between cards from 20→24, add 8px spacing between section titles and prior content for breathing room.
4. **Font weights**: Reduce secondary labels from `800` → `600`. Keep primary titles at `800` but make section titles `700`. Tone down the visual weight.
5. **Borders removed**: Strip the `borderWidth: 1` + colored `borderColor` from all cards. Use `elevation: 2` + soft shadow instead — one consistent card look.
6. **Oxygen card**: Remove the giant `56px` percentage number that dominates the screen. Show stats in a compact horizontal row instead, same as a normal card. Keep all data (trees, CO₂, percentage) but flatten hierarchy.
7. **Challenge card accent**: Use a small colored left-border accent (`borderLeftWidth: 3, borderLeftColor`) instead of full background tint — communicates grouping without saturation.
8. **Quick Actions grid**: Reduce padding from 24→18, lighter card styling.
9. **Color accent consistency**: All icon accent circles use the same `#F0FDF4` (barely-green) background instead of various tinted colors.

### Onboarding Calculator Changes

1. Add a step indicator / welcome illustration area at top when `isOnboarding=true`.
2. Softer card styling matching the new Home aesthetic.

## Files to Modify

| File | Change |
|------|--------|
| `mobile/src/theme/colors.ts` | Update `background` from `#F0FDFA` to `#F7F8FA` |
| `mobile/src/screens/Home.tsx` | Restyle all cards/sections: remove colored backgrounds, add consistent white+shadow, adjust spacing, tone down font weights, flatten oxygen card |
| `mobile/src/screens/Calculator.tsx` | Polish onboarding mode header with step badge + softer card styles |

## Steps

- [ ] **1. Update theme background** — Change `Colors.background` in `colors.ts` from `#F0FDFA` to `#F7F8FA`. Update `inputBg` from `#F0FDF8` to `#F5F6F8`.

- [ ] **2. Restyle Home screen cards** — In `Home.tsx`:
  - Replace all `LinearGradient` card wrappers (levelCard, oxygenCard, challengeCard) with plain `View` components using white bg + subtle shadow
  - Remove `borderWidth`/`borderColor` from all card styles, use consistent `elevation: 2` shadow
  - Increase `marginBottom` on cards to 24
  - Reduce section title fontWeight to `700`, secondary label weights to `600`
  - Remove the `LinearGradient` import dependency if no longer needed (or keep for progress bar fill)

- [ ] **3. Flatten Oxygen Contribution card** — Convert from a tall centered layout (big 56px percentage number) to a compact horizontal card with stats side-by-side. Keep all data (percentage, trees planted, CO₂ reduced) in a single-height row.

- [ ] **4. Add accent styling to Challenge card** — Replace full blue background with white bg + `borderLeftWidth: 3, borderLeftColor: '#0288D1'` accent. Adjust internal text colors from dark-blue to neutral dark.

- [ ] **5. Clean up Quick Actions + Eco Stats cards** — Reduce quick action card padding (24→18), use lighter border (`#F0F2F5`), smaller border-radius (14). Remove last `activityItem` marginBottom to avoid trailing space.

- [ ] **6. Polish onboarding Calculator** — Add a step/progress badge ("Step 1 of 1 · Carbon Footprint") at the top when `isOnboarding=true`. Match card styles to the new cleaner aesthetic (white bg, subtle shadow, no green-tinted border).

## Verification

1. Open the app → sign up as new user → onboarding Calculator should show with polished header and clean card styling
2. Complete onboarding → land on Home → all cards should be white with subtle shadows, no colored backgrounds
3. Scroll through Home — every section should feel visually calm and consistent, with color only on accents (icons, progress bars, badges, key numbers)
4. All data (level, XP, oxygen, trees, challenges, AQI, insights, quick actions, eco stats) is still present — nothing removed
5. Tab bar should be visible immediately
