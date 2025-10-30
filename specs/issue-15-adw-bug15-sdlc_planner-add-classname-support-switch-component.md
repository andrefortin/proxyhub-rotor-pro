# Bug: Add className Support to Switch UI Component

## Metadata

issue_number: `15`
adw_id: `bug15`
issue_json: `{"title":"Add support for \"className\" to the Switch UI component in the Admin module","body":"Add support for \"className\" to the Switch UI component in the Admin module"}`

## Bug Description

The Switch UI component in the Admin module does not properly accept or apply a `className` prop, preventing customization of its styling (e.g., size, colors, positioning) via Tailwind classes or custom CSS. This limits its reusability in different contexts, such as the Providers page table or ThemeToggle.

Expected: Users can pass `className="custom-classes"` to the Switch, and it applies to the root element for styling overrides.

Actual: The component destructures `className` but may not forward it correctly due to the generic React.Component props, or the cn utility doesn't merge it as expected, resulting in no custom styles applied.

## Problem Statement

The Switch component lacks robust support for the `className` prop, making it inflexible for UI customizations in the Admin dashboard without forking or wrapper components.

## Solution Statement

Extend the Switch component's props to explicitly include and apply `className` to the root div using the cn utility. Ensure it merges with default classes without overriding core functionality. Update usages in ThemeToggle and Providers to demonstrate optional className passing if needed. Add TypeScript types for clarity.

## Steps to Reproduce

1. Start the Admin UI: docker compose up --build -d (admin serves at http://localhost:4173)
2. Navigate to Providers page (/providers).
3. Inspect the Switch element in the table (via dev tools).
4. Attempt to add className="w-10 h-6" to the <Switch> in Providers.tsx source and rebuild.
5. Observe that custom classes are not applied or merged correctly to the root div, as the component may not handle the prop properly.
6. Build and reload: bun run build in apps/packages/admin, check if styles change.

## Root Cause Analysis

The Switch component uses React.forwardRef with a generic React.Component props type, which may not explicitly type `className`. Although destructured, if the cn function or default classes conflict, custom className might be ignored. The untracked switch.tsx file suggests it's a recent addition without full prop forwarding (e.g., ...props not spreading className). Shadcn/UI-inspired components often require explicit className handling for Tailwind compatibility.

## Relevant Files

Use these files to fix the bug:

- `apps/packages/admin/src/components/ui/switch.tsx`: Defines the Switch component. Relevant to add/explicitly handle className prop in the root div's className via cn, ensuring it merges with defaults.
- `apps/packages/admin/src/lib/utils.ts`: Contains the cn function for class merging. Relevant to confirm it handles className correctly (clsx + twMerge).
- `apps/packages/admin/src/components/ThemeToggle.tsx`: Uses Switch without className. Relevant to optionally add className="mr-2" for testing custom styling.
- `apps/packages/admin/src/pages/Providers.tsx`: Uses Switch in table for active toggle. Relevant to add className="ml-2" to verify prop application post-fix.
- `README.md`: Mentions Admin UI at localhost:4173. Relevant for any UI notes.
- `apps/packages/admin/src/components/Layout.tsx`: May use Switch; check for additional usages.
- Read `.claude/commands/test_e2e.md` and `.claude/commands/e2e/test_basic_query.md` to understand how to create an E2E test file for UI validation.

### New Files

- `.claude/commands/e2e/test_switch-classname.md`: E2E test file to validate className application on Switch component.

## Step by Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

### Update Switch Component

- Read `apps/packages/admin/src/components/ui/switch.tsx` to confirm current prop handling.
- Modify the props interface to explicitly include className?: string.
- In the root div, ensure className is passed to cn(defaultClasses, className) and spread ...props for additional attributes.
- Export the updated component with displayName for debugging.

### Verify and Update Usages

- Read `apps/packages/admin/src/components/ThemeToggle.tsx` and add className="w-8 h-4 mx-1" to Switch for custom sizing; rebuild and test visual change.
- Read `apps/packages/admin/src/pages/Providers.tsx` and add className="mr-2" to the Switch in the table; ensure it aligns properly without breaking layout.
- Check other files (e.g., Layout.tsx, Sidebar.tsx) for Switch usages and update if present to use className for consistency.

### Add E2E Test

- Read `.claude/commands/e2e/test_basic_query.md` and `.claude/commands/test_e2e.md` and create a new E2E test file in `.claude/commands/e2e/test_switch-classname.md` that validates the bug is fixed, be specific with the steps to prove the bug is fixed. We want the minimal set of steps to validate the bug is fixed and screen shots to prove it if possible.
  - Steps: Navigate to Providers page, inspect Switch element, verify custom class (e.g., 'mr-2') is applied to root div via getAttribute('class'), toggle switch and screenshot before/after, verify no layout break.

### Documentation and Build

- Update any inline comments in switch.tsx about prop support.
- Run bun run build in apps/packages/admin to compile and check for TypeScript errors.

### Final Validation

- Execute the Validation Commands to validate the bug is fixed with zero regressions.

## Validation Commands

Execute every command to validate the bug is fixed with zero regressions.

- `docker compose down && docker compose up --build -d` - Restart Admin UI to apply changes.
- Navigate to http://localhost:4173/providers; inspect Switch elements, confirm className props are applied (e.g., custom margin or width via dev tools).
- Toggle a Switch; verify functionality unchanged, styles applied (e.g., screenshot comparison).
- Before fix simulation (comment out className handling): Custom classes not applied; after: applied correctly.
- `cd apps/packages/admin && bun tsc --noEmit` - TypeScript check for no errors.
- `cd apps/packages/admin && bun run build` - Build without errors.
- Read .claude/commands/test_e2e.md, then read and execute your new E2E .claude/commands/e2e/test_switch-classname.md test file to validate this functionality works.

- `cd apps/packages/api && npm run test` - Ensure no backend regressions (though unrelated).

## Notes

- No new libraries needed; leverage existing cn utility for class merging.
- Ensure className doesn't override essential classes like 'peer inline-flex' for functionality.
- If Switch is based on Shadcn/UI, align with their className strategy (forward to root).
- Test on dark/light themes to prevent styling conflicts.