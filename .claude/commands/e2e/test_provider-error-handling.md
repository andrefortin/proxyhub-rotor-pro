# E2E Test: Provider Error Handling

## User Story

As a user,
I want to see the full Providers page UI even when the API fetch fails
So that I can still interact with the page (add providers, retry fetch) instead of seeing a blank error page.

## Test Steps

1. Start the admin UI: `cd apps/packages/admin && bun dev`; load http://localhost:4173/providers.
2. Take a screenshot: "initial-ui.png" – Verify full page structure: Card header "Providers Management", Add Provider button, search input, empty table ("No providers found. Add one to get started!"), pagination.
3. Simulate API failure: Use DevTools Network tab to throttle or block getProviders request (simulate backend down).
4. Reload or trigger fetch: Verify UI remains fully loaded (title, button, search, table placeholder intact), no blank page; error banner appears below table: "Failed to fetch providers" with Retry button.
5. Take a screenshot: "error-banner.png" – UI visible, inline red banner with error text and Retry button.
6. Click Retry button: Verify loading spinner shows briefly in content area, then refetch (unthrottle network); table updates if success, or error persists.
7. Take a screenshot: "retry-state.png" – Loading spinner or updated table post-retry.
8. Verify add button works: Click Add Provider, ensure modal opens despite error.

## Success Criteria

- Full UI (header, search, table, pagination, buttons) always visible, even on fetch error.
- Loading state shows inline spinner centered in CardContent.
- Error displayed as inline banner (bg-destructive/10 styled) below content, not blocking UI, with functional Retry button.
- Interactions (add/edit) work independently of fetch state.
- No early return to plain error div; page never looks broken/blank.
- 3 screenshots: Initial full UI, error banner with structure, retry/loading.
- No console errors from render logic.