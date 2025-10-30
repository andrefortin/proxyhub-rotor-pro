# E2E Test: Dynamic Switch Thumb

## Test Steps

1. **Start UI**: `cd apps/packages/admin && bun dev`; load http://localhost:4173.

2. **ThemeToggle Test**: Dashboard header Switch.
   - Screenshot: "dynamic-thumb-initial.png" – Light mode, thumb left, no overlap.
   - Toggle on: Verify thumb centers (dynamic calc), no Moon overlap (gap ~8px + buffer).
   - Screenshot: "dynamic-thumb-checked.png" – Thumb positioned midway in Switch.
   - Toggle off: Screenshot revert.

3. **Standalone Test**: /providers, status Switch (no prop).
   - Toggle: Fixed offset, no icons, full slide.
   - Screenshot: "standalone-thumb.png" – Thumb right, no overlap (table cell).

4. **Width Test**: DevTools, force Switch w-6 (24px).
   - Toggle: Verify thumb adjusts (calc ~8px translate), fits without overflow.
   - Screenshot: "narrow-switch.png".

## Expected Outcomes

- Dynamic: Thumb ~16px translate in w-8 (32-16=16px), centered.
- Standalone: No prop, fixed 12px (w-10 default).
- No overlaps; screenshots show centering.

## Validation

- Inspect: Computed --thumb-offset on Switch root, translate on thumb.