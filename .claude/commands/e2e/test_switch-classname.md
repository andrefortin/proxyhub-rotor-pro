# E2E Test: Switch className Support

## User Story

As a developer
I want to apply custom className to the Switch component
So that I can style it for different UI contexts without breaking functionality

## Test Steps

1. Navigate to the Admin UI at Application URL (default http://localhost:4173)
2. Go to /providers page
3. Take a screenshot of the providers table with Switch elements
4. Locate a Switch in the table (first row if available)
5. Inspect the Switch element (root div) and verify it has the 'mr-2' class in its class attribute
6. Toggle the Switch and verify it works (state changes, no errors)
7. Take a screenshot of the toggled Switch showing applied styles (e.g., margin-right)
8. Navigate to theme toggle in sidebar or header
9. Inspect the ThemeToggle Switch and verify it has 'w-8 h-4 mx-1' classes applied
10. Toggle theme and take screenshot showing custom sizing and margins
11. Verify no layout breaks or console errors

## Success Criteria

- Switch root div includes custom className (e.g., 'mr-2', 'w-8 h-4 mx-1') merged with defaults
- Functionality unchanged: Toggles correctly
- Styles applied: Visible margin/sizing changes
- 3 screenshots: Initial table, toggled provider Switch, theme Switch
- No errors in console or failed assertions

## Output Format

```json
{
  "test_name": "Switch className Support",
  "status": "passed|failed",
  "screenshots": [
    "<absolute path>/agents/<adw_id>/<agent_name>/img/switch-classname/01_initial-table.png",
    "<absolute path>/agents/<adw_id>/<agent_name>/img/switch-classname/02_toggled-provider.png",
    "<absolute path>/agents/<adw_id>/<agent_name>/img/switch-classname/03_theme-toggle.png"
  ],
  "error": null
}
```
