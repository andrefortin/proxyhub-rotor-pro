# E2E Test: Switch Thumb Animation

## Test Steps

1. **Start the Admin UI**: Run `cd apps/packages/admin && bun dev` to start the development server. Verify it loads at http://localhost:4173.

2. **Navigate to Providers Page**: Go to http://localhost:4173/providers. If no providers, add a test one (name: "Test", type: "manual", submit) to have a status Switch.

3. **Inspect Initial Switch State**: Focus on the first provider's status Switch in the table.
   - Screenshot: "initial-switch-left.png" – Capture the Switch with thumb on left (unchecked/active false if applicable).
   - Expected: Thumb positioned at left, background input or red.

4. **Click to Toggle**: Click the Switch thumb or track.
   - Verify: Thumb slides smoothly to right (translate-x-5 animation), background changes to primary or green.
   - Console: Check no errors; state log if present.
   - Screenshot: "toggle-to-right.png" – Thumb on right after click.

5. **Toggle Back**: Click again to toggle off.
   - Verify: Thumb slides back to left, background reverts.
   - Screenshot: "toggle-back-left.png" – Thumb returned to left.

6. **Test Theme Toggle in Header**: Navigate to any page (e.g., /dashboard), click Sun/Moon Switch in header.
   - Verify: Thumb moves left/right, theme changes (e.g., sidebar bg-side-panel darkens), body foreground adapts.
   - Screenshot: "theme-toggle.png" – Before/after header Switch and sidebar change.

7. **Keyboard Test**: Focus Switch (Tab to it), press Space/Enter—verify thumb toggles without mouse.

8. **Disabled State (if applicable)**: In Providers, if toggling during API (togglingId set), verify no movement, disabled cursor/opacity.

## Expected Outcomes

- Thumb animates smoothly on each toggle (transition-transform duration).
- No regressions: Colors change, state persists (e.g., API update in Providers), accessibility keys work.
- Screenshots prove visual movement; console clean.

## Validation

- Run `cd apps/packages/admin && bun tsc --noEmit` – No TS errors.
- Inspect: DevTools confirm data-state on thumb, translate-x applied on checked.