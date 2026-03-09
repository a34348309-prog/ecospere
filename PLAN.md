# UI Improvement Plan: Journey & Leaderboard Pages

## Context
The Journey and Leaderboard (ranking) screens in the EcoSphere React Native app need UI improvements. The Leaderboard page has overlapping buttons/elements (podium items clip on smaller screens, header layout overflows, rank rows use negative margins causing overlap). The Journey page needs a visual refresh to match the polished Home screen design.

## Approach
Redesign both screens focusing on proper spacing, responsive layouts, and a more polished visual hierarchy. Follow the existing design system (colors, card patterns, typography weights) from `Home.tsx` for consistency.

## Files to Modify
- `mobile/src/screens/Leaderboard.tsx` — Fix overlaps, redesign podium, improve layout
- `mobile/src/screens/Journey.tsx` — Visual upgrade, better sections, improved cards

## Reuse
- **Colors**: `mobile/src/theme/colors.ts` — All existing color tokens (`Colors.primary`, `Colors.background`, etc.)
- **Card pattern**: From `Home.tsx` — `borderRadius: 18`, `padding: 20`, soft `elevation: 2` shadow pattern
- **LinearGradient**: Already imported in Journey via `expo-linear-gradient`
- **Components**: `react-native-paper` (`Text`, `Card`, `ProgressBar`, `Button`, `Avatar`)
- **Icons**: `lucide-react-native` — already used throughout

---

## Steps

### Leaderboard.tsx Fixes & Improvements

- [x] **Fix header layout**: Stacked vertically — title/subtitle on top, full-width tabs below. Added "Your Rank" badge.

- [x] **Fix podium overlap**: flex:1 with gap spacing, smaller avatars (64/52), numberOfLines={1}, reduced podium heights (110/85/65), maxWidth constraint.

- [x] **Fix rank row overlap**: Removed negative marginHorizontal, using proper padding + border-based highlight with green border accent.

- [x] **Fix Add Friend bar**: Added flexShrink:0 to button, marginRight on left section, text wrapping with numberOfLines.

- [x] **Improve overall spacing**: paddingBottom reduced to 40, consistent margins, proper section gaps.

- [x] **Improve podium visual design**: Crown icon for #1, gradient background behind podium section, better bronze color (#CD7F32).

- [x] **Improve empty state**: Circular icon container, better typography spacing, larger padding.

- [x] **Polish rank list card**: Border only between items (isLast prop), rank number in styled container, green accent for "You" row with border, Star icons for 4th/5th.

### Journey.tsx Improvements

- [x] **Improve header**: Added level badge on the right. Better back button with shadow. Cleaner typography.

- [x] **Upgrade Impact Summary card**:
  - 2x2 grid layout instead of 4-across row (more readable)
  - Deep green gradient (#065F46 → #064E3B) with shadow/glow
  - Each stat is a horizontal card with icon + text side by side
  - Added "Badges Earned" stat replacing redundant "Level" stat
  - Added "Your Impact" / "Global Footprint" label hierarchy

- [x] **Improve Goals section**:
  - Removed useless "Manage" button
  - Each goal has themed icon background colors
  - Added "Almost!" badge when goal is >90% complete
  - Color-coded progress bars per goal

- [x] **Upgrade Achievements section**:
  - Wider cards (140px) with better padding
  - Added locked state with Lock icon overlay for unachieved milestones
  - Added 8 achievement tiers including "Rising Star (250pts)", "50 Trees", "Level 3"
  - Shows all achievements (locked + unlocked) — no more "Getting Started" only
  - Added count badge (e.g., "3/8") next to section title

- [x] **Improve Impact History section**:
  - Timeline design with vertical connector line and dots
  - Active dot for most recent event
  - "View All" link when >5 items
  - Added empty state with icon, title, and description

- [x] **Upgrade Share button**: 
  - Gradient-filled button (primary → primaryDark)
  - Share2 icon with white text
  - Shadow with green tint

- [x] **Add motivational section**: "Next Milestone" card at top shows the next unachieved badge with its description and a sparkle icon.

---

## Verification
- Run the app with `npx expo start` and test both screens on Android/iOS
- Verify on small screen (320px width) that no elements overlap on Leaderboard
- Check that podium displays correctly with 0, 1, 2, and 3+ users
- Verify Journey page loads correctly with both populated and empty data states
- Confirm all existing functionality (tab switching, add friend modal, share, navigation) still works
- Check scroll behavior — no content cut off at bottom
