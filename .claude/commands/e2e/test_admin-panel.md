# E2E Test: Admin Panel

## Steps to Validate

1. Run `docker compose -f docker-compose.dev.yml up --build admin` to start the admin panel.
2. Open browser to http://localhost:4173
3. Verify the page loads without errors in console.
4. Check that the left sidebar is visible with links: Dashboard, Proxies, Providers, Settings.
5. Click on ThemeToggle (sun/moon icon in header) - verify the page switches to dark mode (background changes to dark).
6. Navigate to Dashboard by clicking sidebar link - verify it shows proxy stats cards and list.
7. Expected: No broken CSS, responsive layout, API data loads.

## Expected Screenshots
- Initial load: Light mode dashboard with sidebar.
- After toggle: Dark mode applied.
- Note: Take screenshot of full page to show layout.