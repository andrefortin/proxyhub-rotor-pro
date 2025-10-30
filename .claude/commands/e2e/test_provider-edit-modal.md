# E2E Test: Provider Edit Modal Functionality

Test the edit functionality in the Providers page, ensuring the modal displays correctly without rendering errors.

## User Story

As an admin
I want to edit an existing provider
So that I can update provider details without issues, and the modal renders properly

## Test Steps

1. Navigate to http://localhost:4173/providers
2. Take a screenshot of the Providers page with at least one provider listed (assume one exists or add via UI if needed)
3. Click the "Edit" button (pencil icon) for the first provider in the list
4. **Verify** the edit modal opens successfully
5. Take a screenshot of the opened edit modal
6. **Verify** the modal is populated with the provider's existing data (name, type, config, etc.)
7. **Verify** no empty page or rendering errors occur (page should show modal overlay)
8. Make a small change, e.g., toggle "Active" checkbox
9. Click "Save Provider"
10. **Verify** modal closes and list updates with changes
11. Take a screenshot of the updated providers list
12. Click "Edit" again on the same provider
13. **Verify** modal reopens without issues
14. Click "Cancel" to close
15. Take a screenshot of the final state after cancel

## Success Criteria

- Edit button triggers modal display
- Modal renders correctly with pre-filled data
- No blank pages or console errors during edit
- Changes save and reflect in list
- Cancel works without issues
- 4 screenshots taken for key states