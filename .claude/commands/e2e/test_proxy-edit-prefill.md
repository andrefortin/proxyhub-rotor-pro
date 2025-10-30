# E2E Test: Proxy Edit Prefill

Test that all fields in the Edit Proxy modal are prefilled with existing data.

## User Story

As an admin
I want to edit a proxy and see all fields prefilled correctly
So that I can update details without re-entering everything

## Test Steps

1. Navigate to http://localhost:4173/proxies (assume at least one proxy exists, or add one)
2. Take a screenshot of the proxies list showing a test proxy (host:port, pool, provider, etc.)
3. Click "Edit" on the first proxy
4. Take a screenshot of the Edit modal
5. **Verify** host field prefilled with proxy.host
6. **Verify** port field prefilled with proxy.port
7. **Verify** username prefilled with proxy.username or empty
8. **Verify** password shows '*****' if set, empty if not
9. **Verify** protocol selected as proxy.protocol or 'http'
10. **Verify** pool selected as proxy.pool or 'default'
11. **Verify** provider selected as proxy.providerId
12. **Verify** tags input shows comma-separated proxy.tags
13. **Verify** meta textarea shows JSON.stringify(proxy.meta)
14. **Verify** disabled checkbox checked if proxy.disabled = true
15. Change port to 8081 and submit
16. **Verify** list updates with new port, Host:Port shows correctly
17. Take a screenshot of updated list
18. Re-open edit on same proxy
19. **Verify** port now prefilled as 8081
20. Cancel modal
21. Take a screenshot of final state

## Success Criteria

- All fields in edit modal prefill from existing proxy data
- Password masked but updatable
- Changes save and reflect in list/display
- Host:Port column shows both host and port correctly
- 4 screenshots taken (list, initial edit, updated list, final)
- No empty fields on prefill except optional
