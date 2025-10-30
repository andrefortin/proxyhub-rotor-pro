# Bug: Add Delete Confirmation Prompt

## Metadata

issue_number: `18`
adw_id: `a1b2c3d4`
issue_json: `{\"title\": \"Add Delete Confirmation Prompt\", \"body\": \"When clicking a \\\"Delete\\\" button that will remove an item like a provider or a proxy, we should prompt at least 1 time per session if they are sure they want to delete, and if we should remember this choice for the rest of the session and stop asking or just this one time. Make it clear and concise.\"}`

## Bug Description

The current delete functionality in the Admin UI uses the browser's native `confirm()` dialog for both providers and proxies, which prompts every time a delete button is clicked. This is repetitive and does not offer an option to remember the choice for the session. The expected behavior is a more user-friendly confirmation that asks once per session with a checkbox to suppress future prompts, providing a clear and concise message.

Actual behavior: Native confirm dialog appears on every delete attempt, e.g., "Delete provider?" or "Delete this proxy? This is irreversible.", without session persistence or remember option.

## Problem Statement

Lack of a persistent, customizable delete confirmation in the Admin UI leads to poor user experience, as users are repeatedly prompted without the ability to opt-out for the session, potentially leading to accidental deletions or frustration.

## Solution Statement

Implement a custom delete confirmation modal/component that displays on the first delete attempt per session (using localStorage or sessionStorage for persistence). The modal should include a checkbox to "Remember this choice for this session" and suppress future prompts if checked. Apply this to both Providers and Proxies pages by refactoring the handleDelete functions to use the new confirmation logic. Use a shared confirmation hook or component for consistency.

## Steps to Reproduce

1. Start the application: `docker compose up --build -d` and navigate to http://localhost:4173.
2. Go to Providers page (or Proxies page).
3. Click the delete (Trash2) button for any item.
4. Observe native confirm dialog appears.
5. Click Cancel, then click delete again on the same or another item.
6. Confirm dialog reappears without any remember option.

## Root Cause Analysis

The handleDelete functions in Providers.tsx (line 102-109) and Proxies.tsx (line 142-149) directly invoke `confirm()` without any session state management. This is a simple but non-persistent UX choice, assuming every delete needs confirmation, but it ignores user preference for session-long suppression. No shared state or localStorage is used to track confirmation acknowledgments, leading to repeated prompts.

## Relevant Files

Use these files to fix the bug:

- `README.md`: Project overview, confirms Admin UI at http://localhost:4173 and pages for Providers/Proxies.
- `apps/packages/admin/src/pages/Providers.tsx`: Contains handleDelete function using native confirm; modify to integrate custom confirmation.
- `apps/packages/admin/src/pages/Proxies.tsx`: Similar handleDelete with native confirm; needs update for custom prompt.
- `apps/packages/admin/src/components/ui/button.tsx`: Base Button component used for delete actions; no change needed but referenced for UI consistency.
- `apps/packages/admin/src/lib/api.ts`: API functions like deleteProvider and deleteProxy; no change, but called after confirmation.
- `.claude/commands/test_e2e.md`: Guide for running E2E tests; read to understand execution.
- `.claude/commands/e2e/test_basic_query.md`: Example of basic E2E test structure; reference for new test format.
- `.claude/commands/e2e/test_complex_query.md`: Example of detailed E2E steps with verifications; use for validation steps in new test.

### New Files

- `.claude/commands/e2e/test_delete-confirmation.md`: New E2E test file to validate the confirmation modal behavior.

## Step by Step Tasks

### Step 1: Create a Shared Confirmation Hook/Component

- Create a new file `apps/packages/admin/src/hooks/useDeleteConfirmation.ts` with a custom hook that checks sessionStorage for 'deleteConfirmed' key. If not set or false, show a modal with message: "Are you sure you want to delete this item? This action cannot be undone." Include a checkbox: "Remember this choice for this session (don't ask again)". On confirm, set sessionStorage and proceed with delete. On cancel, close modal.
- Export a useDeleteConfirmation hook that returns a function to trigger the confirmation.

### Step 2: Update Providers.tsx

- Import the new hook from Step 1.
- Replace the native confirm in handleDelete (around line 102) with the confirmation function from the hook.
- If confirmation passes, proceed with `await deleteProvider(id); fetchProviders();`.
- Ensure the modal is clear and concise, targeting provider deletion.

### Step 3: Update Proxies.tsx

- Import the new hook from Step 1.
- Replace the native confirm in handleDelete (around line 142) with the confirmation function from the hook.
- If confirmation passes, proceed with `await deleteProxy(id); fetchProxies();`.
- Adapt the message slightly for proxies: "Are you sure you want to delete this proxy? This is irreversible."

### Step 4: Add E2E Test Task

- Read `.claude/commands/e2e/test_basic_query.md` and `.claude/commands/e2e/test_complex_query.md` to understand E2E test structure, including user story, steps with verifications, screenshots, and success criteria.
- Create a new E2E test file in `.claude/commands/e2e/test_delete-confirmation.md` that validates the bug is fixed: Navigate to Providers/Proxies page, click delete button, verify custom modal appears with checkbox, confirm with remember option, verify no prompt on second delete in session, take screenshots of initial delete modal, confirmation without prompt, and include verifications for modal text and session persistence (e.g., reload and test again). Minimal steps: 1. Load page, 2. Delete first item (modal shows), 3. Confirm with checkbox, 4. Delete second item (no modal), 5. Screenshots: modal and no-modal state.

### Step 5: Validation and Testing

- Run the application and manually test the new confirmation on both pages.
- Verify sessionStorage is set correctly and cleared on new session.
- Ensure no regressions in delete API calls.
- Read `.claude/commands/test_e2e.md`, then read and execute the new E2E `.claude/commands/e2e/test_delete-confirmation.md` test file to validate this functionality works.

## Validation Commands

Execute every command to validate the bug is fixed with zero regressions.

- Reproduce bug before fix: `docker compose up --build -d`, navigate to Providers page, click delete multiple times, confirm native dialog appears each time.
- After implementing: Reload page, click delete on provider, verify custom modal appears once, check checkbox and confirm, click delete again, verify no modal, check sessionStorage for 'deleteConfirmed'.
- Same for Proxies page: Verify proxy delete shows modal first time only if remembered.
- `cd apps/packages/admin && bun run build` - Run frontend build to ensure no TypeScript errors or build failures post-changes.
- `cd apps/packages/admin && bun tsc --noEmit` - Run TypeScript check to validate types.
- Read `.claude/commands/test_e2e.md`, then read and execute your new E2E `.claude/commands/e2e/test_delete-confirmation.md` test file to validate this functionality works.
- `docker compose exec api npx prisma generate` - Regenerate Prisma client if schema touched (unlikely here).
- Manually test: Start new session (incognito), confirm modal shows; existing session, no modal.

## Notes

- Use sessionStorage for persistence (clears on tab close, suitable for "session").
- Ensure modal is accessible and follows UI patterns (e.g., use existing Button and Card components).
- No new libraries needed; leverage React state and sessionStorage.
- Update any recent commits if UI fixes in switch.tsx affect modals, but focus on delete only.
- Minimal changes: Hook + updates to two handleDelete functions + E2E test.