# Bug: Dynamic Provider Config Examples

## Metadata

issue_number: `24`
adw_id: `bug24-adw-001`
issue_json: `{"title": "Dynamic provider config examples based on type", "body": "when adding/editing a provider, we should show the same example for each provider type depending on which provider type is chosen in the dropdown. This should keep the dialog more concise. Ensure the setup for file upload is working as well."}`

## Bug Description

When adding or editing a provider in the admin UI, the configuration textarea displays a fixed generic JSON placeholder example regardless of the selected provider type (API, File Upload, or Manual Entry). This leads to confusion as the example is API-focused and does not adapt to the chosen type, making the dialog verbose and unhelpful for non-API configurations. Additionally, for the 'File Upload' type, there is no dedicated file input mechanism in the form; users must awkwardly paste file paths or JSON into the textarea, which does not facilitate actual file uploads and breaks the expected workflow.

Expected behavior: The placeholder example in the config textarea should dynamically update based on the selected provider type to show concise, type-specific guidance. For 'File Upload', integrate a proper file input to handle uploads, with the config textarea serving as fallback or supplementary.

Actual behavior: Static API-like JSON placeholder for all types; no file input, leading to incomplete setup for file-based providers.

## Problem Statement

The provider creation/editing modal lacks dynamic, type-specific configuration guidance and proper file upload support, resulting in a non-intuitive UI that fails to guide users effectively for different provider types and hinders file-based setups.

## Solution Statement

Implement dynamic placeholder updates in the config textarea based on the provider type selection using React state. For 'File Upload' type, add a conditional file input component to allow direct file selection and upload, preprocessing the file (e.g., JSON/CSV parsing) into the config field if needed. Ensure the modal remains concise by tailoring examples: API shows endpoint/auth JSON, File shows upload instructions/path, Manual shows key-value pairs.

## Steps to Reproduce

1. Start the application: `docker compose up --build -d` and navigate to http://localhost:4173/providers.
2. Click "Add Provider" to open the modal.
3. Select different types (API, File Upload, Manual) from the dropdown.
4. Observe the config textarea placeholder remains the same generic API JSON example.
5. For 'File Upload', attempt to upload a file—note no file input exists, forcing manual entry into textarea.
6. Submit the form for 'File Upload' with a sample file path in config; verify backend receives invalid/incomplete data.

## Root Cause Analysis

The Providers.tsx component hardcodes the textarea placeholder as an API-specific JSON example without listening to type changes via onChange event or state synchronization. The form relies solely on a textarea for all config inputs, ignoring type-specific needs like file uploads for 'file' type. This stems from a one-size-fits-all approach in the modal form, likely an oversight during initial UI development where API was prioritized. No form validation or type-aware rendering exacerbates usability issues, allowing invalid configs to be submitted.

## Relevant Files

Use these files to fix the bug:

- `apps/packages/admin/src/pages/Providers.tsx`: Primary file containing the add/edit modal form. Relevant for adding state to track selected type, implementing onChange for dropdown to update textarea placeholder dynamically, and conditionally rendering a file input for 'file' type. Modify the form submission to handle file uploads (e.g., read file contents and set config JSON).
- `apps/packages/admin/src/lib/api.ts`: API functions for create/update provider. Ensure handling of file-based configs if backend changes needed, but minimal—focus on frontend sending correct data (e.g., file contents as config string).
- `README.md`: Provides example configs (e.g., IPRoyal for API), useful for defining type-specific placeholders.
- `.claude/commands/e2e/test_providers-management.md` and `.claude/commands/e2e/test_provider-toggle.md`: Examples for E2E test structure in provider UI flows.
- `.claude/commands/test_e2e.md`: Guides E2E test execution with Playwright.

### New Files

- `.claude/commands/e2e/test_provider-config-dynamic-examples.md`: New E2E test file to validate dynamic placeholders and file upload functionality.

## Step by Step Tasks

### Research and Preparation
- Read `apps/packages/admin/src/pages/Providers.tsx` to understand current modal structure, form handling, and state management.
- Review `apps/packages/admin/src/lib/api.ts` for provider create/update payloads to ensure compatibility with dynamic configs.
- Define type-specific examples:
  - API: Use IPRoyal JSON from README.md.
  - File: Instructions like `{"filePath": "path/to/proxies.json", "format": "json"}` with file upload.
  - Manual: Simple object like `{"proxies": ["ip:port", "ip:port"]}`.

### Implement Dynamic Placeholder
- In Providers.tsx, add useState for selectedType, initialize from editData.type or 'api'.
- Add onChange to select element to update selectedType.
- Update textarea placeholder attribute conditionally based on selectedType, e.g., using a switch or object map for examples.

### Add File Upload Support
- Conditionally render a file input below textarea when selectedType === 'file'.
- On file select, read file contents (e.g., via FileReader for JSON/CSV) and auto-populate textarea with parsed config (e.g., {"source": "uploaded_file", "data": contents}).
- Update form submission to include file data if present, ensuring config is valid JSON.

### Form Enhancements
- Add basic validation: Ensure config is valid JSON on submit, show error if not.
- Update help text/info box to reference dynamic examples.

### Create E2E Test
- Read `.claude/commands/e2e/test_basic_query.md` and `.claude/commands/e2e/test_complex_query.md` and create a new E2E test file in `.claude/commands/e2e/test_provider-config-dynamic-examples.md` that validates the bug is fixed, be specific with the steps to prove the bug is fixed. We want the minimal set of steps to validate the bug is fixed and screen shots to prove it if possible.
  - Steps: Navigate to Providers page, open Add Provider modal, select each type and verify placeholder updates (screenshot modal for each), for 'file' select a sample file and verify config populates, submit and check success.

### Validation
- Run the application locally and manually test add/edit flows for all types.
- Your last step should be running the `Validation Commands` to validate the bug is fixed with zero regressions.

## Validation Commands

Execute every command to validate the bug is fixed with zero regressions.

- `docker compose up --build -d && docker compose exec api npx prisma migrate deploy` - Start services and ensure app runs without errors.
- Navigate to http://localhost:4173/providers, reproduce bug steps before fix (static placeholder), apply changes, then re-test: Verify dynamic placeholders change per type, file upload populates config, forms submit successfully for all types.
- `cd apps/packages/admin && bun tsc --noEmit` - Run TypeScript check to validate no type errors introduced.
- `cd apps/packages/admin && bun run build` - Build frontend to ensure no compilation errors.
- Read `.claude/commands/test_e2e.md`, then read and execute your new E2E `.claude/commands/e2e/test_provider-config-dynamic-examples.md` test file to validate this functionality works.
- `cd apps/packages/api && npm run test:watch` - Run backend tests; confirm no regressions in provider endpoints (assuming tests cover create/update).
- Re-run reproduction steps post-fix and confirm: Placeholders update dynamically, file upload works, modal remains concise.

## Notes

- No new libraries needed; use native FileReader API for file handling.
- For file types, assume common formats (JSON/CSV for proxies list); add parsing logic to convert to standard config shape.
- Ensure accessibility: Update labels/aria for dynamic content.
- If backend requires multipart for files, update api.ts createProvider to handle FormData.