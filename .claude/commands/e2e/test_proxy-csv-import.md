# E2E Test: Proxy CSV Import Functionality

This test validates the CSV import feature on the Proxies page. It ensures the modal opens, file is uploaded via dropzone, pool/provider are selectable, submission processes without duplicates, and the table updates correctly.

## Test Steps

1. **Navigate to Proxies Page**:
   - Open http://localhost:4173/proxies
   - Verify: Page loads with table (if proxies exist) or empty state, "Add Proxy" button visible.

2. **Open Import Modal**:
   - Click "Import CSV" button (Upload icon, next to Add Proxy).
   - Verify: Shadcn Dialog modal opens (backdrop, centered, title "Import Proxies from CSV"), dropzone area (dashed border, "Drag CSV here or click to browse"), pool Select dropdown (placeholder "Select Pool", options: residential, datacenter, etc.), provider Select (placeholder "Select Provider", populates from API or empty if none).

3. **Upload Sample CSV**:
   - Create sample CSV file: headers "host,port,username,password,protocol,pool", rows: "1.2.3.4,8080,user1,pass1,http,residential\n5.6.7.8,8080,user2,pass2,http,datacenter" (one row to simulate dupe later).
   - Drag/drop file onto dropzone or click/browse.
   - Verify: Animation (fade/bounce on drop), preview table appears (DataTable with columns host/port/etc., shows 2 rows), any parse errors shown inline.

4. **Select Pool and Provider**:
   - Click pool Select → choose "datacenter".
   - Click provider Select → choose an existing provider (e.g., "IPRoyal") if available, or leave as "No Provider".
   - Verify: Values update in dropdowns, preview rows have pool applied (if global), submit button enables.

5. **Submit Import**:
   - Click "Import Proxies" button.
   - Verify: Loading spinner on button (text "Importing..."), modal shows progress, API call succeeds (no network error).
   - On success: Toast/message "Imported 2 proxies" (or stats: Imported X, Skipped Y if dupe), modal closes, table refetches (new proxies visible in list, sorted by recent).

6. **Verify No Duplicates and Table Update**:
   - If second test: Upload CSV with dupe IP (e.g., repeat first row).
   - Submit: Verify response shows "Imported 0, Skipped 1", table unchanged (no new row).
   - Filter/search by new host → row appears with correct pool/provider.
   - Toggle enable/disable on new proxy → updates without error.

7. **Error Handling**:
   - Upload invalid file (e.g., TXT): Verify error toast "Invalid CSV format".
   - Submit without file: Button disabled, no submit.
   - Network error (mock): Modal stays open, error message "Upload failed, try again".

## Screenshots/Expected Visuals
- Modal open: Centered panel with dropzone (dashed, hover blue), dropdowns below, preview table (striped rows).
- After drop: Green success border, table with 2 rows (host 1.2.3.4, etc.).
- Post-import: Table row added (e.g., <Card> with host/port, badges for pool/provider), no dupe.
- Animation: Modal slide-up from bottom, dropzone scale on hover/drop.

## Validation
- Run in browser: Chrome dev tools, console no errors.
- API check: Network tab shows POST /v1/proxies/import (multipart/form-data, 200 OK with {imported:2, skipped:0}).
- Database: Prisma query shows new proxies with correct pool/providerId, no dupe hosts.