# Bug: Proxy Pool Dropdown in Add Dialog

## Metadata

issue_number: `25`
adw_id: `bug25-adw-001`
issue_json: `{"title": "Pool dropdown in Add New Proxy dialog", "body": "The Add New Proxy dialog should allow choosing the [Pool] from a drop-down list with the same options as the filter on the proxies page."}`

## Bug Description

In the Proxies management page, the "Add Proxy" modal uses a text input for the "Pool" field, allowing users to enter any string value. This leads to potential inconsistencies and data entry errors, as users must manually type pool names that must exactly match backend expectations or predefined values. The page's filter dropdown provides predefined pool options (e.g., Residential, ISP, Datacenter, Mobile, Web Unblocker, Test), but the modal does not, resulting in users possibly entering invalid or inconsistent pool names that could break proxy associations or filtering. Expected behavior: The pool field in the add/edit proxy modal should be a dropdown select with the same fixed options as the filter dropdown for consistency and to prevent typos. Actual behavior: Free-text input allowing arbitrary values without guidance.

## Problem Statement

The add/edit proxy modal lacks a dropdown for the pool field, causing users to manually enter values that may not match the predefined pool options used in the proxies page filter, leading to invalid configurations and inconsistent data.

## Solution Statement

Replace the text input for the pool field in the add/edit proxy modal with a <select> dropdown. Use a fixed array of pool options matching the filter dropdown (All Pools, Residential, ISP, Datacenter, Mobile, Web Unblocker, Test). Set default to '' (All Pools) for new proxies, and prefill from editData.pool for editing existing proxies. Update the form submission to send the selected value. No backend changes needed, as pools are validated on the server side.

## Steps to Reproduce

1. Start the application: `docker compose up --build -d` and navigate to http://localhost:4173/proxies.
2. Ensure there are proxies listed (if empty, add one via Add Proxy with basic data).
3. Click "Add Proxy" to open the modal.
4. Observe the "Pool" field is a text input.
5. Enter a pool name not in the predefined list (e.g., "custom-pool") and submit.
6. View the proxies list or filter by "All Pools"—the proxy may not display correctly or cause filter mismatches.
7. In the proxies page filter, select pools from the dropdown and verify the new proxy doesn't align with expected options.

## Root Cause Analysis

The Proxies.tsx component implements the pool filter as a <select> with hardcoded options, ensuring consistent values for filtering. However, the add/edit modal uses a basic <input type="text"> for pool, likely a remnant from early implementation before predefined pools were defined, or an oversight to allow flexibility. This disconnect allows non-standard pool values to be saved, which may not be handled by backend logic or filtering, leading to upstream issues in proxy assignment, search, or reporting. The filter dropdown is static and user-friendly, but the modal's text input lacks validation or guidance, root cause being inconsistent UI design across related features in the same page.

## Relevant Files

Use these files to fix the bug:

- `apps/packages/admin/src/pages/Proxies.tsx`: Primary file containing the proxies page, including the pool filter dropdown with hardcoded options. Relevant for extracting the list of pool options (e.g., 'residential', 'isp', 'datacenter', 'mobile', 'web_unblocker', 'test') and ensuring they match exactly for consistency.
- `apps/packages/admin/src/lib/api.ts`: API calls for create/update proxy (POST/PATCH /v1/proxies). Verify pool field is string, no backend enum; solution is frontend-only to enforce options.
- `README.md`: Confirms proxy pools are fixed strings (e.g., from IPRoyal integration); useful for validating option labels vs values.
- `.claude/commands/e2e/test_proxies-management.md` and `.claude/commands/e2e/test_provider-toggle.md`: Examples for E2E test structure in proxies UI.
- `.claude/commands/test_e2e.md`: Guides E2E test execution.

### New Files

- `.claude/commands/e2e/test_proxy-pool-dropdown.md`: New E2E test file to validate pool dropdown in add/edit modal matches filter options.

## Step by Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

### Research and Preparation
- Read `apps/packages/admin/src/pages/Proxies.tsx` to identify the pool filter dropdown options (hardcoded array or switch cases).
- Review `apps/packages/admin/src/lib/api.ts` for proxy create/update payloads to confirm pool is sent as string (no enum changes needed).
- Extract the exact pool options from the filter: ['', 'residential', 'isp', 'datacenter', 'mobile', 'web_unblocker', 'test'] with labels (e.g., "All Pools", "Residential").

### Implement Dropdown in Modal
- In Proxies.tsx, locate the add proxy modal form (likely in the same component as the table).
- Find the pool input: Replace <input type="text" name="pool" defaultValue={editData.pool} /> with <select name="pool" value={poolValue} onChange={(e) => setPool(e.target.value)}>
  - Add <option value="">All Pools</option> as default.
  - Map over the pool options array for <option value={value}>{label}</option>.
- For edit mode, set initial value to editData.pool or '' if none.
- Ensure onChange updates a pool state if needed, but since formData.get('pool') handles it, no extra state.

### Form Submission Update
- In form onSubmit, ensure pool is captured from the select and included in data object (already does via formData.get('pool')).
- Add validation: Make pool required on submit if backend expects it; show error if empty.

### Create E2E Test
- Read `.claude/commands/e2e/test_basic_query.md` and `.claude/commands/e2e/test_complex_query.md` and create a new E2E test file in `.claude/commands/e2e/test_proxy-pool-dropdown.md` that validates the bug is fixed, be specific with the steps to prove the bug is fixed. We want the minimal set of steps to validate the bug is fixed and screen shots to prove it if possible.
  - Steps: Navigate to Proxies page, open Add Proxy modal, verify pool field is a select with options matching filter (screenshot modal dropdown open), select a pool (e.g., Residential), submit with valid data, verify proxy added with correct pool in list, filter by pool to confirm it appears.

### Validation
- Run the application locally and manually test add/edit flows for pool selection.
- Compare add modal dropdown options to filter dropdown (should be identical).
- Your last step should be running the `Validation Commands` to validate the bug is fixed with zero regressions.

## Validation Commands

Execute every command to validate the bug is fixed with zero regressions.

- `docker compose up --build -d && docker compose exec api npx prisma migrate deploy` - Start services and ensure app runs without errors.
- Navigate to http://localhost:4173/proxies, open Add Proxy modal, previously text input now dropdown with matching options, select "Residential" and submit successfully.
- Verify new proxy appears in list with selected pool, and filter dropdown shows it correctly.
- `cd apps/packages/admin && bun tsc --noEmit` - Run TypeScript check to validate no type errors introduced.
- `cd apps/packages/admin && bun run build` - Build frontend to ensure no compilation errors.
- Read `.claude/commands/test_e2e.md`, then read and execute your new E2E `.claude/commands/e2e/test_proxy-pool-dropdown.md` test file to validate this functionality works.
- Test edit flow: Edit a proxy, verify pool dropdown prefills correctly, change selection, submit, confirm update.
- Re-run reproduction steps post-fix and confirm: Pool is selectable from dropdown, no text input, values match filter options.

## Notes

- No new libraries needed; use native select element.
- If pool options need to be dynamic (fetched from API), add a fetchProviders call similar to existing in Proxies.tsx and populate options from providers data, but keep fixed for consistency with filter.
- Ensure option labels are user-friendly (e.g., "All Pools" for '', "Residential" for 'residential').
- Backend accepts string pools; ensure values match backend enums if any.
- For accessibility: Add label "Select pool" to dropdown, and aria-required=true.