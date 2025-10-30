# E2E Test: Dynamic Switch Thumb

## Test Steps

1. **Start UI**: `cd apps/packages/admin && bun dev`; load http://localhost:4173.

2. **ThemeToggle Test**: Dashboard header Switch (dynamicThumb=true).
   - Screenshot: \"dynamic-thumb-initial.png\" – Light mode, thumb left (translate-x-0), no Sun overlap.
   - Toggle on: Verify thumb centers dynamically (calc(100% - 1rem) ~16px shift in w-8), gap ~8px to Moon, no overlap.
   - Screenshot: \"dynamic-thumb-checked.png\" – Dark mode, thumb midway, Moon separated.
   - Toggle off: Revert; screenshot initial state.

3. **Standalone Test**: Navigate to /providers, status Switch in table (no dynamicThumb prop).
   - Toggle: Fixed 12px shift (translate-x-3), full slide within w-10, no icons.
   - Screenshot: \"standalone-thumb.png\" – Checked, thumb right-aligned, no overlap issues.

4. **Width Test**: DevTools, force Switch class &quot;w-6 h-3&quot; (24px) on ThemeToggle.
   - Toggle: Dynamic adjusts (~8px shift), thumb fits without overflow.
   - Screenshot: \"narrow-switch.png\" – Compact, centered thumb.

## Expected Outcomes

- Dynamic (ThemeToggle): --thumb-offset: calc(100% - 1rem); translate ~16px in 32px width, centered.
- Standalone (Providers): No var, fixed translate-x-3 (12px in 40px width), full right slide.
- No overlaps; smooth transitions; screenshots confirm gaps/positions.
- Regression: Providers toggles move correctly (no prior breakage).

## Validation

- Inspect: Root has --thumb-offset for dynamic; thumb computed translate matches calc/fixed.
- Console: No errors on toggle; state updates.
- Run in narrow browser: Layout adapts, no clipping.