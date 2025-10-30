# E2E Test: Delete Confirmation Modal

Test the delete confirmation prompt for providers and proxies.

## User Story

As a user
I want a one-time delete confirmation with remember option per session
So that I can avoid repeated prompts while ensuring safety

## Test Steps

1. Navigate to the Application URL (http://localhost:4173)
2. Take a screenshot of the initial state (Providers page)
3. Go to Providers page
4. **Verify** table shows providers
5. Click delete (Trash2) button on a provider
6. **Verify** custom modal appears with message "Are you sure you want to delete this provider? This action cannot be undone." and checkbox for remember
7. Take a screenshot of the delete modal
8. Check the remember checkbox and confirm delete
9. **Verify** provider is deleted and list updates
10. Click delete on another provider
11. **Verify** no modal appears (direct delete)
12. Take a screenshot of no-modal delete action
13. Reload the page (new session)
14. Click delete on a provider
15. **Verify** modal appears again
16. Take a screenshot of modal in new session
17. Repeat steps 3-12 for Proxies page, with message "Are you sure you want to delete this proxy? This is irreversible."

## Success Criteria

- Modal shows on first delete per session
- Checkbox remembers choice (no prompt on second delete)
- Session clears on reload (modal reappears)
- Delete actions succeed without errors
- 6 screenshots taken (3 for providers, 3 for proxies): initial, modal, no-modal, reload modal