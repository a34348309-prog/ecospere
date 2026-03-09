# Plan: Reposition FAB (Plus Button) to Bottom-Right

## Context
The floating action button (FAB) — a green gradient "+" circle that opens a menu for Journey, Events, and Map — is currently positioned dead center above the tab bar (`alignSelf: 'center'`, `bottom: 90`). This overlaps with scrollable content and gets in the way of interaction.

## Approach
Move the FAB from center to **bottom-right corner**, just above the tab bar. This is the standard Material Design FAB placement — accessible, out of the way, and familiar to users. The pop-up menu items (Journey, Events, Map) will also shift to anchor from the right side instead of center.

## Files to Modify
- `mobile/App.tsx` — Update `tabStyles` for `centerButtonContainer` and `menuContainer` positioning

## Steps

- [ ] **Move FAB to bottom-right**: Change `centerButtonContainer` style from `alignSelf: 'center'` to `right: 20`. Keep `bottom: 90` (above the 80px tab bar). This places it cleanly in the bottom-right corner.

- [ ] **Anchor pop-up menu to the right**: Change `menuContainer` from `alignSelf: 'center'` to `right: 20` and `alignItems: 'flex-end'`. This makes the Journey/Events/Map pills appear above the FAB on the right side instead of floating in the center.

## Verification
- FAB should appear in the bottom-right corner, above the tab bar
- Tapping the FAB should expand the menu upward from the right side
- Menu items (Journey, Events, Map) should be fully visible and tappable
- Content behind should no longer be blocked by the FAB in the center
- Tab bar items should remain unobstructed
