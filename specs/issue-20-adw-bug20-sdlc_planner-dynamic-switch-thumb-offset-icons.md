# Bug: Dynamic Switch Thumb Offset for Icons

## Metadata

issue_number: `20`
adw_id: `bug20`
issue_json: `{ "title": "Dynamic Switch Thumb with Icons", "body": "the offset is realtive to the inner displayed width of the switch which adjusts itself if there are overlapping icons or images" }`

## Bug Description

Switch thumb positioning doesn't dynamically adjust relative to the inner track width in layouts with adjacent icons (e.g., ThemeToggle with Sun/Moon). Fixed translate values cause overlap or misalignment when content affects effective width/padding.

## Problem Statement

Fixed translate-x in Switch thumb doesn't adapt to container dimensions or neighboring elements, leading to overlaps in icon-integrated toggles like ThemeToggle.

## Solution Statement

Make thumb offset dynamic using CSS custom property on Switch root: `--thumb-offset: calc(100% - 1rem)` (subtracts thumb size from track). Thumb uses `data-[state=checked]:translate-x-[var(--thumb-offset)]` for automatic centering in any width (e.g., w-8). For standalone (Providers), it falls back to fixed or prop-disables. Test to ensure no regressions.

## Steps to Reproduce

1. `cd apps/packages/admin && bun dev`; load http://localhost:4173.
2. To Dashboard: Toggle theme Switch—thumb may crowd Moon icon if width constrained.
3. Expected: Thumb always centers within Switch bounds, independent of icons.

## Root Cause Analysis

Switch translate is fixed (e.g., translate-x-3), not relative to track (varies with className like w-8 in ThemeToggle). Icons (h-4 w-4, space-x-2) reduce available space; thumb (size-4) overflows on slide. Dynamic calc on root enables self-adjusting offset.

## Relevant Files

Use these files to fix the bug:

- `README.md`: Dev server for reproduction.
- `apps/packages/admin/src/components/ui/switch.tsx`: Add --thumb-offset style to root; update thumb to use var for checked translate.
- `apps/packages/admin/src/components/ThemeToggle.tsx`: Layout with icons; test dynamic here.
- `.claude/commands/test_e2e.md` and `.claude/commands/e2e/test_basic_query.md`: For test_switch-dynamic-thumb.md.

### New Files

- `.claude/commands/e2e/test_switch-dynamic-thumb.md`: Validate thumb centers with icons.

## Step by Step Tasks

### Task 1: Implement Dynamic Offset

- In `switch.tsx`, add to outer div (after className):
  ```
  style={{ '--thumb-offset': 'calc(100% - 1rem)' }}  // Adjusts to width - thumb
  ```
- Thumb class: Change `data-[state=checked]:translate-x-3` to `data-[state=checked]:translate-x-[var(--thumb-offset)]` (arbitrary for var).
- Add prop `dynamicThumb?: boolean` to interface; if true, use calc, else fixed.

### Task 2: Update ThemeToggle Usage

- In `ThemeToggle.tsx`, pass `dynamicThumb={true}` to Switch:
  ```
  <Switch
    checked={darkMode}
    onCheckedChange={(checked) => setDarkMode(!!checked)}
    dynamicThumb={true}
    className="w-8 h-4 mx-1"
    aria-label="Toggle theme"
  />
  ```

### Task 3: Create E2E Test

- Create `.claude/commands/e2e/test_switch-dynamic-thumb.md`: Load /, toggle—screenshot thumb centered no overlap. Test Providers (no prop, default fixed). Include widths.

### Task 4: Validate

- Run `bun dev`; verify ThemeToggle thumb centers.
- Run `bun tsc --noEmit` and `bun run build`.

### Task 5: Regression

- Execute E2E: Confirm dynamic in ThemeToggle, fixed in others.

## Validation Commands

Execute every command to validate the bug is fixed with zero regressions.

- Read `.claude/commands/test_e2e.md`, then read and execute `.claude/commands/e2e/test_switch-dynamic-thumb.md`.
- `cd apps/packages/admin && bun tsc --noEmit`.
- `cd apps/packages/admin && bun run build`.

## Notes

- Calc works for any width; fixed fallback for standalone.
- No deps; CSS-only adjustment.