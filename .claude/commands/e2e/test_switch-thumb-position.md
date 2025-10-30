# E2E Test: Switch Thumb Positioning

## Test Steps

1. **Start the Admin UI**: Run `cd apps/packages/admin && bun dev`. Load http://localhost:4173.

2. **Navigate to Dashboard**: Go to http://localhost:4173 (shows header with theme toggle).

3. **Inspect ThemeToggle Initial State**: Locate Sun-Switch-Moon in header.
   - Screenshot: "theme-toggle-initial.png" – Thumb on left, no overlap with Moon.

4. **Toggle to Dark**: Click the Switch.
   - Verify: Thumb slides right but stays within Switch bounds (no visual overlap with Moon icon; gap preserved via space-x-2).
   - Background: Changes to primary color.
   - Screenshot: "thumb-checked-no-overlap.png" – Thumb positioned right, Moon icon separated (measure gap ~8px).

5. **Toggle Back to Light**: Click again.
   - Verify: Thumb slides left, no overlap with Sun.
   - Screenshot: "thumb-unchecked-no-overlap.png" – Thumb left, Sun separated.

6. **Resize Test**: Browser dev tools: Narrow window (e.g., 320px width).
   - Toggle: Verify no clipping or increased overlap; layout flex-wraps if needed but thumb fits.
   - Screenshot: "narrow-view-toggle.png" – Compact view, thumb not overlapping icons.

## Expected Outcomes

- Thumb translate-x-4 ensures ~4px buffer inside 32px Switch (w-8), preventing intrusion into 8px icon gap.
- No overlap: Moon icon remains 8px from Switch edge.
- Animation smooth; no regressions in other Switches (e.g., Providers status).
- Screenshots show clear separation before/after toggle.

## Validation

- Inspect: DevTools confirm translate-x-4 on checked thumb (computed style ~16px shift).
- Console clean; toggle state updates.