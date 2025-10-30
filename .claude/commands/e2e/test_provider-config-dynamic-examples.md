# E2E Test: Dynamic Provider Config Examples

Test dynamic configuration examples and file upload in the Providers page.

## User Story

As an admin
I want the provider modal to show type-specific config examples and support file uploads
So that setup is concise and intuitive for different provider types

## Test Steps

1. Navigate to http://localhost:4173/providers
2. Take a screenshot of the Providers page initial state
3. Click "Add Provider" to open the modal
4. **Verify** modal opens with default 'api' type selected
5. Take a screenshot of the modal with API placeholder
6. **Verify** config textarea placeholder shows API example (contains "kind": "iproyal", access_token)
7. Select "File Upload" from type dropdown
8. Take a screenshot of the modal after selecting File Upload
9. **Verify** config textarea placeholder updates to file example (contains "filePath", "format")
10. **Verify** a file input appears below textarea
11. Select a sample JSON file (e.g., create temp proxies.json with {"proxies": []})
12. **Verify** textarea populates with config including "source": "uploaded"
13. Take a screenshot of populated textarea
14. Fill name="Test File Provider", check Active, submit form
15. **Verify** form submits successfully (no error, modal closes, new provider in list)
16. Take a screenshot of providers list with new entry
17. Repeat steps 7-9 for "Manual Entry"
18. **Verify** placeholder updates to manual example (contains "proxies" array)
19. Click Cancel to close modal
20. Take a screenshot of final state

## Success Criteria

- Modal opens correctly
- Placeholder dynamically updates for each type
- File input appears and populates textarea for 'file'
- Form validates JSON and submits without errors
- No regressions in provider list display
- 6 screenshots taken for key states