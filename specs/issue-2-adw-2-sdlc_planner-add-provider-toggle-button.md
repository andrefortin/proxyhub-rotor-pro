# Feature: Provider Toggle Button

## Metadata

issue_number: 2
adw_id: 2
issue_json: {}

## Feature Description

Add a toggle button to the actions column of the providers management page in the admin module to enable/disable or active/inactive the proxy provider directly from the providers list. This allows users to quickly toggle provider status without navigating to edit mode, improving user experience for managing provider states.

## User Story

As an admin user managing proxy providers
I want to toggle a provider's active/inactive status directly from the providers list table
So that I can quickly enable or disable providers without editing full details, saving time during management.

## Problem Statement

Currently, to change a provider's status, users must click 'Edit', modify the active field in the dialog, and save. This is inefficient for simple status changes, requiring extra steps for what should be a quick action directly from the list view.

## Solution Statement

Add a toggle switch button in the Actions column of the Providers table. The toggle will call the updateProvider API with only the 'active' field changed. Include loading state during the API call and optimistic UI update. Follow existing UI patterns for toggles (e.g., green/red colors for active/inactive). Confirm changes with a subtle toast or status indicator.

## Relevant Files

Use these files to implement the feature:

- `README.md` - Project overview for UI/UX conventions.
- `app/server/**` - Server-side API logic for provider updates (providers.controller.ts, providers.service.ts).
- `app/client/**` - Client-side UI for providers page (Providers.tsx in admin module).
- `scripts/**` - No specific scripts needed, but use existing start commands for testing.

### New Files

No new files required; modifications to existing Providers page and API.

### Additional Documentation

Read `.claude/commands/test_e2e.md` and `.claude/commands/e2e/test_basic_query.md` to understand how to create an E2E test file for validating the toggle functionality.

## Implementation Plan

### Phase 1: Foundation

Prepare the Providers page for the toggle by ensuring the update API supports partial updates for 'active' field only. Verify the API endpoint works with PATCH /v1/providers/:id for boolean 'active' field.

### Phase 2: Core Implementation

Add the toggle component in the table row's Actions column. Implement on/off states based on provider.active. Handle toggle click with API call to update status, optimistic UI flip, and error rollback. Add loading spinner on toggle during request.

### Phase 3: Integration

Integrate with existing table rendering to refresh the list after toggle success. Add confirmation tooltip or modal for destructive actions if needed, but keep it inline for speed. Test with real data to ensure status changes propagate.

## Step by Step Tasks

### Prepare API for Toggle

- Read providers.controller.ts to confirm PATCH /v1/providers/:id accepts Partial<Provider> including 'active' boolean.
- Read providers.service.ts to ensure update logic updates only provided fields, especially 'active'.
- Test API manually: PATCH /v1/providers/{id} with {"active": false} to confirm status toggles without full object.

### Add Toggle to Actions Column

- Read apps/packages/admin/src/pages/Providers.tsx to locate the table row rendering for each provider.
- In the Actions <td>, add a toggle switch next to Edit/Delete buttons using existing UI library (e.g., Switch from shadcn/ui).
- Style the toggle green when active, red when inactive, with hover effects.

### Implement Toggle Logic

- Add state management for loading per provider ID using a Set or object to track toggling providers.
- On toggle click, flip the local provider.active optimistically and set loading state.
- Call updateProvider(id, { active: !currentActive }) from api.ts.
- On success, keep the optimistic update; on error, revert local state and show error toast.
- After success, optionally refetch providers list or just update the specific row.

### Create E2E Test

- Create a separate E2E test file `.claude/commands/e2e/test_provider-toggle.md` based on existing examples.
- The test should: Navigate to providers page, toggle a provider OFF, verify status changes to Inactive with red toggle, toggle back ON, verify green toggle.

### Validate End-to-End

Running the `Validation Commands` to validate the feature works correctly with zero regressions.

## Testing Strategy

### Unit Tests

- Test updateProvider API call with { active: true/false } in isolation.
- Test toggle component renders correctly for active/inactive states.
- Test optimistic update and rollback on error in Providers component.

### Edge Cases

- Toggle during network error: Revert UI and show error.
- Multiple toggles simultaneous: Handle loading states without race conditions.
- Toggle inactive provider to active: Confirm API succeeds and UI updates.
- Provider without ID or API failure: Graceful handling.

## Acceptance Criteria

- Toggle button appears in Actions column for each provider row.
- Toggle shows green when active, red when inactive.
- Clicking toggle calls API, shows loading spinner, flips state on success.
- UI optimistically updates during request; reverts on error.
- Status badge in Type column updates to match toggle state.
- No console errors; works with existing edit/delete actions.
- E2E test validates toggle flow.

## Validation Commands

Execute every command to validate the feature works correctly with zero regressions.

- `docker compose -f docker-compose.dev.yml up` - Start services.
- Navigate to http://localhost:4173/providers in browser.
- Verify toggle in actions column, click to toggle - check network tab for PATCH request and status change.
- Check console for no errors.
- Read .claude/commands/test_e2e.md, then read and execute new .claude/commands/e2e/test_provider-toggle.md test file to validate functionality.
- `docker compose -f docker-compose.dev.yml logs admin` - Check admin logs for errors.

- `cd app/server && uv run pytest` - Run server tests to validate the feature works with zero regressions
- `cd app/client && bun tsc --noEmit` - Run frontend tests to validate the feature works with zero regressions
- `cd app/client && bun run build` - Run frontend build to validate the feature works with zero regressions

## Notes

- Ensure toggle doesn't interfere with existing Edit/Delete buttons (space them appropriately).
- Consider adding confirmation for disabling if the provider is actively leasing proxies, but keep simple for now.
- If API needs update for partial fields, add validation to accept boolean active only.