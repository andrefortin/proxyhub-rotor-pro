# E2E Test: Switch UI Component Functionality

Test the Switch UI component in the admin dashboard for toggle switch behavior.

## User Story

As an admin user
I want to use toggle switches for settings like theme and provider status
So that I can easily enable/disable features without complex interactions

## Test Steps

1. Navigate to the `Application URL` (http://localhost:4173)
2. Take a screenshot of the initial dashboard state
3. Verify the ThemeToggle Switch is visible in the header (look for sun/moon icons with toggle)
4. Take a screenshot of the ThemeToggle Switch in unchecked state (light mode)
5. Click the ThemeToggle Switch to toggle to dark mode
6. Verify the page background changes to dark theme (e.g., body class 'dark' added)
7. Take a screenshot of the ThemeToggle Switch in checked state (dark mode)
8. Navigate to the Providers page (/providers)
9. Take a screenshot of the Providers table
10. For the first provider row, verify the Switch exists in the Actions column
11. Take a screenshot of a provider Switch in its initial state
12. Click the Switch for the first provider to toggle its status
13. Verify the status badge updates (e.g., from 'Active' to 'Inactive' or vice versa)
14. Verify no console errors occur during toggles
15. Take a screenshot of the toggled Switch state
16. Toggle back if needed and confirm API call (via network tab, expect PATCH /providers/{id})
17. Click browser refresh and verify Switch state persists (if API updated)
18. Take a final screenshot of the Providers page after interactions

## Success Criteria

- Switch renders correctly with slide animation
- Toggle changes state and updates UI (theme, status badge)
- Accessibility attributes (role="switch", aria-checked) present
- No JavaScript errors in console
- Theme toggle affects global dark mode class
- Provider toggle triggers API update without errors
- 7 screenshots captured: initial, theme unchecked, theme checked, providers table, provider switch initial, toggled, final page
- Interactions are responsive and disabled state handled if applicable (e.g., during loading)