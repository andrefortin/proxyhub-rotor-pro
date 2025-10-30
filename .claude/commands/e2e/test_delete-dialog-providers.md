# E2E Test: Delete Dialog on Providers Page

Test the delete confirmation modal rendering and functionality on Providers page.

## User Story

As a user
I want the delete dialog to appear consistently on Providers page
So that I can safely delete providers without UI inconsistencies

## Test Steps

1. Navigate to the `Application URL` (http://localhost:4173/providers)
2. Take a screenshot of the initial Providers list
3. **Verify** providers table is visible with delete icons (Trash2)
4. Click delete icon (Trash2) on a provider item
5. **Verify** modal appears with title "Confirm Delete", message "Are you sure you want to delete this provider? This action cannot be undone.", checkbox "Remember this choice for this session", and Cancel/Delete buttons; z-index over other elements
6. Take a screenshot of the open modal
7. Click the remember checkbox, then click Delete button
8. **Verify** provider is removed from list, no errors, modal closes
9. Take a screenshot of updated list (no second modal if remembered)
10. Click delete on another provider – **Verify** no modal (direct delete/success)
11. Take screenshot of no-modal delete action
12. Reload page (Ctrl+R)
13. Click delete on a provider – **Verify** modal reappears (new session)
14. Take screenshot of modal in new session
15. Cancel the modal to close

## Success Criteria

- Delete icon click triggers modal on Providers page
- Modal contains correct provider message, checkbox, and buttons
- Checkbox remember skips future modals in session
- Reload resets session, modal reappears
- Deletions succeed without errors
- 5 screenshots: initial list, modal open, after delete (no modal), no-modal action, reload modal
- No console errors during interactions