# E2E Test: Proxy Pool Dropdown

Test the pool dropdown in the Add/Edit Proxy modal matches the filter options on the Proxies page.

## User Story

As an admin
I want the pool field in the Add/Edit Proxy modal to be a dropdown with the same options as the page filter
So that I can select consistent pool values without typing errors, ensuring matching with filters

## Test Steps

1. Navigate to http://localhost:4173/proxies
2. Take a screenshot of the Proxies page with filter dropdown visible (expand if needed)
3. **Verify** the pool filter is a <select> with options: All Pools, Residential, ISP, Datacenter, Mobile, Web Unblocker, Test
4. Click "Add Proxy" to open the modal
5. Take a screenshot of the Add Proxy modal with pool field
6. **Verify** the pool field is now a <select> dropdown (not text input) with the same options as filter (All Pools, Residential, etc.)
7. Select "Residential" from the pool dropdown
8. Take a screenshot of the selected option in dropdown
9. Fill required fields (host: "1.2.3.4", port: "8080", pool: selected) and submit
10. **Verify** modal closes and new proxy appears in list with pool "residential"
11. Click edit on the new proxy
12. Take a screenshot of the Edit Proxy modal with prefilled pool "Residential"
13. **Verify** pool dropdown prefills to "Residential" and can change to another option
14. Click Cancel to close
15. Take a screenshot of the final proxies list
16. In the page filter, select "Residential" and **Verify** the new proxy appears (no mismatches)
17. Clear filter and confirm all proxies visible

## Success Criteria

- Pool filter on page has predefined options
- Add modal pool field is dropdown with identical options
- Edit modal prefills pool from existing data
- Submission saves selected pool correctly
- New proxy shows in list and filters properly
- 5 screenshots taken (page filter, add modal, selected option, edit prefill, final list)