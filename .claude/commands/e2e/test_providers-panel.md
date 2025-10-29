# E2E Test: Providers Panel Management

## User Story

As a ProxyHub admin user
I want to view and manage providers in a clean card panel with add functionality
So that I can easily add new providers and toggle their status to control associated proxies without navigating multiple screens

## Test Steps

1. Navigate to the Application URL (http://localhost:5173)
2. Take a screenshot of the initial state (Providers section)
3. **Verify** the page loads the ProxyHub Admin dashboard
4. **Verify** the "Providers" card is visible with "Provider Management" header and "Add Provider" button
5. **Verify** if no providers exist, the empty state message "No providers configured yet." is displayed; otherwise, provider cards are shown with name, type, active toggle, and config previews
6. Click the "Add Provider" button to open the modal
7. Take a screenshot of the Add Provider modal
8. **Verify** the modal contains form fields: Name (text input), Type (select: API/File/Manual), Config (JSON textarea), Logo URL (optional URL input)
9. Fill the form:
   - Name: "Test Provider"
   - Type: "api"
   - Config: {"website": "test.com", "apiKey": "test-key"}
   - Logo URL: "" (leave empty)
10. Click "Create Provider" button
11. **Verify** the modal closes and a new card for "Test Provider" appears in the grid
12. Take a screenshot of the new provider card
13. **Verify** the new provider shows Type: api and Active: Yes
14. Click the active toggle checkbox on the "Test Provider" card to disable it
15. Take a screenshot of the toggling action (loading state if present)
16. **Verify** the active status changes to "No" (red color) and "Updating..." appears briefly, then disappears
17. **Verify** a network request to PATCH /v1/providers/{id} was made (check browser dev tools or assume based on UI update)
18. Take a screenshot of the disabled provider card
19. (Optional) Verify in database or API that proxies related to this provider are disabled (via curl or console, but focus on UI)
20. Click the active toggle again to re-enable
21. **Verify** status changes back to "Yes" (green)

## Success Criteria

- Providers panel displays as card grid with details or empty state
- "Add Provider" modal opens with required form fields
- Form submission creates new provider via POST to /v1/providers and refreshes list
- New card appears immediately after creation
- Active toggle sends PATCH request and updates UI status with loading state
- Toggle cascades (UI reflects change; assume backend handles proxy disable)
- No JavaScript errors in console
- All verifications pass without timeouts or missing elements
- 5 screenshots are taken: initial panel, add modal, new card, toggle disable, toggle re-enable
- Test completes without failures; cleanup by optionally deleting test provider via API if possible