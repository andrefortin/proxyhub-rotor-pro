# E2E Test: Admin UI Components (Badge, Tooltip, Button)

Test the Badge, Tooltip, and Button components in the Proxies page of the Admin UI.

## User Story

As an admin user
I want to see proxy pools badged, tooltips for actions, and interactive buttons for management
So that I can quickly understand and operate on proxies without errors

## Test Steps

1. Navigate to the `Application URL` (http://localhost:4173/proxies for Admin Proxies page)
2. Take a screenshot of the initial Proxies page state
3. **Verify** the page loads without console errors (check for missing component imports)
4. **Verify** Badge components render: Locate a proxy row, check Badge with variant="secondary" shows pool name (e.g., text 'default'), and variant="default" for score badge
5. Hover over a TooltipTrigger (e.g., the test button icon): **Verify** TooltipContent appears (e.g., 'Test proxy connectivity')
6. Take a screenshot of Tooltip open (use hover simulation)
7. Click a Button (e.g., the reset filters Button variant="outline"): **Verify** no runtime errors, page responds (filters reset if applicable)
8. Click another Button (e.g., ghost variant test button): **Verify** modal or action triggers without crash
9. Take a screenshot of Button interactions (e.g., post-click state)
10. **Verify** all components use correct styling (e.g., Badge rounded, Button hover effects via dev tools)
11. Close any modals and refresh page to confirm no regressions

## Success Criteria

- Page renders without import or render errors for Badge/Tooltip/Button
- Badge displays text with variant classes (e.g., secondary bg-secondary)
- Tooltip shows content on hover without delay issues
- Buttons are clickable, handle onClick, apply variants/sizes (outline/ghost/sm)
- 3 screenshots captured: Initial page, Tooltip hover, Button interaction
- No console errors related to missing props or Radix hydration

