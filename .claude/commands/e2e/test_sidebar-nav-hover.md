# E2E Test: Sidebar Nav Hover Text Color

Test sidebar navigation hover text visibility in light and dark themes.

## User Story

As an admin user
I want sidebar nav items to have readable text on hover in both themes
So that I can navigate easily without visibility issues

## Test Steps

1. Navigate to http://localhost:4173
2. Take a screenshot of the initial sidebar in light mode
3. **Verify** sidebar is visible with nav items (Dashboard, Proxies, etc.)
4. Hover over a nav item (e.g., 'Providers')
5. Take a screenshot of the hover state in light mode
6. **Verify** hover text color is dark/visible (e.g., inspect getComputedStyle(element).color includes 'rgb(0' for dark text)
7. Toggle to dark theme (using ThemeToggle)
8. Take a screenshot of the sidebar in dark mode
9. **Verify** theme is dark (body classList contains 'dark')
10. Hover over the same nav item
11. Take a screenshot of the hover state in dark mode
12. **Verify** hover text color is light/white (e.g., getComputedStyle(element).color === 'rgb(255, 255, 255)' or 'rgb(248, 250, 252)' for gray-50)
13. **Verify** contrast ratio >4.5:1 (text light on dark bg-gray-800)
14. Toggle back to light, hover again to ensure no regression

## Success Criteria

- Hover text readable in both themes
- No color blending in dark mode
- Theme toggle works
- 4 screenshots captured: light initial/hover, dark initial/hover
- All verifications pass without errors