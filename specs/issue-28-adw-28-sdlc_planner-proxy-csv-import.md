# Feature: Proxy CSV Import

## Metadata

issue_number: `28`
adw_id: `28`
issue_json: `{"title": "add the ability to drop a csv file of proxies onto a drop zone, or choose a file to upload to import the csv list of proxies into the system. We will not not add the same proxy ip more than once, we need to choose the type pool type and provider type from dropdowns. this should all be contained on a panel the appears when we click a button to import Proxies from a a csv. Make the user interface consistent with our site, we use shadcdn, and make it simple for non-techinical people, include micro-animations, and make it sexy.", "body": "add the ability to drop a csv file of proxies onto a drop zone, or choose a file to upload to import the csv list of proxies into the system. We will not not add the same proxy ip more than once, we need to choose the type pool type and provider type from dropdowns. this should all be contained on a panel the appears when we click a button to import Proxies from a a csv. Make the user interface consistent with our site, we use shadcdn, and make it simple for non-techinical people, include micro-animations, and make it sexy."}`

## Feature Description

This feature adds a user-friendly CSV import capability to the Proxies page in the admin UI. Users can click an "Import from CSV" button to open a modal panel with a drag-and-drop zone for CSV files. The CSV should contain proxy details (e.g., host, port, username, password, protocol). Dropdowns allow selecting a pool (e.g., residential, datacenter) and provider (from existing list). Imports will skip duplicate IPs (based on host field) to avoid redundancy. The UI uses Shadcn components for consistency, with micro-animations (e.g., fade-ins, hover effects) via Tailwind or framer-motion for a polished, intuitive experience suitable for non-technical users. Backend handles parsing, validation, deduplication, and bulk insertion via Prisma.

## User Story

As an admin user
I want to upload a CSV file of proxy details via drag-and-drop or file selection
So that I can bulk import proxies efficiently, selecting pool and provider, without adding duplicates or manually entering each one

## Problem Statement

Currently, proxies can only be added individually via the create modal, which is time-consuming for bulk imports (e.g., from external lists). There's no file upload support, deduplication logic, or guided UI for batch operations, leading to errors and inefficiency for users managing large proxy lists.

## Solution Statement

Introduce an "Import CSV" button on the Proxies page that opens a Shadcn Dialog modal. Inside: React Dropzone for CSV upload, PapaParse for client-side parsing, dropdown selects for pool (enum options) and provider (fetched list), preview table for rows, and submit button. On submit, POST multipart form to new backend endpoint `/v1/proxies/import` using Multer for file handling, csv-parser for server-side validation, Prisma for deduplication (query existing hosts, skip matches), and bulk `createMany`. Return import stats (imported/skipped). Use optimistic updates and refetch list. Add subtle animations (e.g., modal slide-in, success toast) for engagement. Ensure accessibility and error feedback.

## Relevant Files

Use these files to implement the feature:

- **apps/packages/admin/src/pages/Proxies.tsx**: Main page for proxies; add "Import CSV" button near "Add Proxy", integrate modal trigger, handle form submission and refetch on success. Relevant for table refresh post-import and consistent styling with existing modals/forms.
- **apps/packages/api/src/modules/proxies/proxies.service.ts**: Extend with `importProxies(file: Express.Multer.File, pool: string, providerId?: string)` method for CSV parsing, deduplication (Prisma `findMany` on hosts, `createMany` with skipDuplicates), and error handling. Builds on existing Prisma models.
- **apps/packages/api/src/modules/proxies/proxies.controller.ts**: Add POST `/import` endpoint with `@UseInterceptors(FileInterceptor('file'))`, `@Body()` for pool/provider, call service, return {imported, skipped, errors}.
- **apps/packages/admin/src/lib/api.ts**: Update or add API call for import (use axios.post with FormData for multipart).
- **apps/packages/admin/src/components/ui/** (e.g., button.tsx, dialog.tsx, select.tsx, card.tsx, input.tsx): Shadcn primitives for modal (Dialog), dropdowns (Select), file input styling, and buttons. Ensures UI consistency.
- **prisma/schema.prisma**: Verify Proxy model (host as unique? if not, handle in code); no changes needed but reference for fields (host, port, pool, providerId, etc.).
- **README.md**: Reference for API patterns (e.g., pagination, auth) and quickstart to test imports.
- **app_docs/feature-490eb6b5-one-click-table-exports.md**: Although for export, provides CSV handling patterns (pandas-based, but adapt for import with csv-parser); conditions match CSV functionality.
- **.claude/commands/test_e2e.md** and **.claude/commands/e2e/test_basic_query.md**: To understand E2E test creation for validating import UI flow.

### New Files

- **apps/packages/admin/src/pages/ProxiesImportModal.tsx**: New component for the import modal (Dropzone, form, preview).
- **apps/packages/admin/src/components/ProxyImportDropzone.tsx**: Reusable dropzone with PapaParse integration.
- **.claude/commands/e2e/test_proxy-csv-import.md**: E2E test for the import feature (modal open, file drop, select pool/provider, submit, verify table update).

## Implementation Plan

### Phase 1: Foundation

Install necessary libraries: react-dropzone and papaparse for frontend CSV handling; multer, csv-parser for backend. Ensure Shadcn Dialog and Select are available (add if missing via CLI). Update Prisma if needed for unique host constraint.

### Phase 2: Core Implementation

Build frontend modal with dropzone, parsing, dropdowns, and preview. Implement backend endpoint for parsing, deduping, and inserting. Add validation for CSV columns (require host/port).

### Phase 3: Integration

Connect frontend submit to backend API. Add success/error toasts, optimistic refetch. Integrate E2E test for end-to-end validation.

## Step by Step Tasks

### Task 1: Install Dependencies
- Run `cd apps/packages/admin && npm install react-dropzone papaparse` for frontend CSV upload and parsing.
- Run `cd apps/packages/api && npm install multer csv-parser @types/multer --save-dev` for backend file upload and CSV processing.
- If animations needed, run `cd apps/packages/admin && npm install framer-motion` and import Motion components.
- Add to package.json if Shadcn Dialog/Select missing: `npx shadcn-ui@latest add dialog select`.
- Commit changes with message "chore: add deps for proxy CSV import".

### Task 2: Create E2E Test File
- Read `.claude/commands/test_e2e.md` and `.claude/commands/e2e/test_basic_query.md` for format.
- Create `.claude/commands/e2e/test_proxy-csv-import.md` with steps: Navigate to Proxies page, click "Import CSV" button (verify modal opens with dropzone), drag sample CSV (verify preview shows rows, dropdowns show options), select pool "datacenter" and provider "IPRoyal", submit (verify success message, table refetches with new proxies, no duplicates), close modal. Include expected screenshots (modal, preview, table before/after).

### Task 3: Backend - Add Import Service Method
- In `apps/packages/api/src/modules/proxies/proxies.service.ts`, add `importProxies(@UploadedFile() file: Express.Multer.File, pool: string, providerId?: string)`: Use csv-parser on file stream, map rows to Proxy data (default fields if missing), query existing hosts with `prisma.proxy.findMany({ where: { host: { in: uniqueHosts } } })`, filter out duplicates, use `prisma.proxy.createMany({ data: validProxies, skipDuplicates: true })`, return { imported: count, skipped: dupes.length, errors: [] }.
- Add validation: Ensure CSV has 'host', 'port' columns; throw BadRequest if invalid.
- Handle optional fields (username, password, protocol='http').

### Task 4: Backend - Add Import Controller Endpoint
- In `apps/packages/api/src/modules/proxies/proxies.controller.ts`, import MulterModule in module, add `@Post('import') @UseInterceptors(FileInterceptor('file')) importProxies(@UploadedFile() file, @Body() { pool, providerId })`: Call service, return JSON response with stats. Add Swagger docs `@ApiConsumes('multipart/form-data') @ApiBody({ type: 'multipart/form-data', schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' }, pool: { type: 'string' }, providerId: { type: 'string' } } } })`.

### Task 5: Frontend - Create Import Modal Component
- Create `apps/packages/admin/src/components/ProxyImportModal.tsx`: Use Shadcn Dialog (trigger button "Import CSV" with Upload icon), content with Card: Header "Import Proxies from CSV", Dropzone area (use react-dropzone, styled dashed border, hover effects), onDrop parse with papaparse (header: true), show preview DataTable if rows >0 (limit 5, columns host/port/etc.), Shadcn Select for pool (options: residential/datacenter/etc., default 'default'), Select for provider (fetch via getProviders, placeholder "No Provider"), Submit button (disabled if no file/rows), onSubmit: FormData with file, pool, providerId, POST to /v1/proxies/import, onSuccess: close modal, refetch proxies, show toast "Imported X proxies".
- Add micro-animations: Tailwind fade-in on modal (opacity-0 to 1, scale-95), hover scale on dropzone.

### Task 6: Integrate Modal into Proxies Page
- In `apps/packages/admin/src/pages/Proxies.tsx`, import ProxyImportModal, add <ProxyImportModal open={showImport} onClose={() => setShowImport(false)} />, button near Add Proxy: <Button onClick={() => setShowImport(true)}><Upload>Import CSV</Button>, pass refetch callback to modal for post-import refresh.
- Update fetchProxies to handle new proxies in pagination/filtering.

### Task 7: Add Deduplication Logic
- In backend service: Before createMany, collect hosts from CSV, query `findMany({ select: { host: true }, where: { host: { in: hosts } } })`, filter rows where !existingHosts.includes(row.host), log skips.
- Frontend: After parse, optional client check (but defer to backend), show warning if preview detects potential dupes.

### Task 8: Testing and Validation
- Add unit tests in proxies.service.spec.ts: Mock Prisma/Multer, test parse valid CSV (returns correct count), test with dupe hosts (skips, no insert), test invalid CSV (errors).
- Edge cases: Empty CSV (error), missing host column (400), large file (>1MB, limit?), no pool selected (default 'default').

### Task 9: Run Validation Commands
- Read .claude/commands/test_e2e.md, then read and execute .claude/commands/e2e/test_proxy-csv-import.md to validate functionality.
- cd apps/packages/admin && bun tsc --noEmit
- cd apps/packages/api && npm run test
- docker compose up api admin (test UI import end-to-end).
- cd apps/packages/admin && bun run build

## Testing Strategy

### Unit Tests

- Backend: Test importProxies with mock file/stream (valid CSV → imported count, dupe CSV → skipped, invalid columns → error). Use Jest mocks for Prisma createMany/findMany.
- Frontend: Test Dropzone onDrop → parsed rows, Select onValueChange → state updates, submit FormData with file/pool.

### Edge Cases

- CSV with missing host/port → validation error.
- Duplicate IPs in CSV or DB → skip without insert.
- Invalid CSV format (no headers) → parse error toast.
- Large CSV (>1000 rows) → progress indicator, chunked insert if needed.
- No provider selected → optional, defaults to null.
- File types: Only .csv accepted, reject others.

## Acceptance Criteria

- "Import CSV" button appears on Proxies page, opens modal on click.
- Modal has dropzone: Drag/drop or click uploads CSV, parses/previews rows (table with host/port/etc.).
- Dropdowns: Pool (required, options match enum), Provider (optional, lists existing).
- Submit: Calls API, shows loading, closes on success, refetches table (new proxies visible, no dupes).
- Deduplication: Existing IPs skipped, response shows "Imported X, Skipped Y".
- UI: Shadcn consistent (Dialog, Select, Button), simple labels/tooltips, micro-animations (fade, hover), responsive.
- Errors: Inline messages for parse failures, API errors (toast).
- No regressions: Existing CRUD (add/edit/delete/test) works.

## Validation Commands

Execute every command to validate the feature works correctly with zero regressions.

- Read .claude/commands/test_e2e.md, then read and execute .claude/commands/e2e/test_proxy-csv-import.md to validate this functionality works.
- cd apps/packages/api && npm run test - Run backend tests (including new import units) with zero failures.
- cd apps/packages/admin && bun tsc --noEmit - Type-check frontend with zero errors.
- cd apps/packages/admin && bun run build - Build frontend successfully.
- docker compose up -d api admin - Start services.
- # Manual E2E: Open http://localhost:4173/proxies, click Import CSV, upload sample CSV (2 rows, 1 dupe), select pool/provider, submit → verify table shows 1 new proxy, no dupe.

## Notes

- New libraries: react-dropzone, papaparse (frontend, npm i); multer, csv-parser (backend, npm i). Consider framer-motion for advanced animations if Tailwind transitions insufficient.
- CSV Format Assumption: Headers 'host','port','username','password','protocol'; optional 'tags','meta'. Validate/skip invalid rows.
- Security: Limit file size (Multer maxFileSize=5MB), validate MIME 'text/csv'.
- Future: Export to CSV symmetry, provider-specific import validation.
- Animations: Keep subtle (Tailwind preferred over heavy lib) for performance.