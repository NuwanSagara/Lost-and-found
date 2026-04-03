You are a senior full-stack engineer. Fix only one specific issue in my existing Lost & Found system.

ISSUE
In the User Dashboard, the Browse Items page is not showing all users’ uploaded lost and found items.
I want the Browse Items page to show all lost and found items uploaded by all users.

IMPORTANT
- Do NOT change other features
- Do NOT redesign the system
- Do NOT modify unrelated pages, modules, or business logic
- Preserve all existing working functionality
- Keep owner-only features like edit/delete/recover unchanged
- Keep admin features unchanged
- Only fix the Browse Items page data flow so it correctly shows all users’ lost and found items

REQUIREMENT
- In Browse Items page:
  - show all lost items uploaded by all users
  - show all found items uploaded by all users
- Keep “My Items”, “My Lost Items”, “My Found Items”, or similar owner-specific pages unchanged if they already exist
- Do not expose private/sensitive data
- Only show safe public item/report data already intended for browsing

WHAT TO CHECK
Inspect the current code and find why Browse Items is not showing all users’ items. Check:
- frontend fetch logic
- API endpoint used by Browse Items
- backend query filters
- whether current user ID is incorrectly applied
- whether only owner-specific endpoints are being called
- whether lost and found data need to be combined from separate endpoints
- whether visibility/status filters are blocking items incorrectly

IMPLEMENT ONLY THE MINIMUM REQUIRED FIX
- Update the Browse Items page so it fetches and displays all browseable lost and found items from all users
- If needed, create or fix only the specific API/query used by Browse Items
- Do not change unrelated routes/components/services
- Do not change UI except what is necessary to make the data appear correctly
- Preserve existing filters/search/sort if already present

PERMISSIONS
- Browsing all items must NOT allow editing/deleting/recovering others’ items
- Non-owners must still be blocked from owner-only actions
- Admin permissions must remain unchanged

QA CHECKLIST
Before finishing, verify:
1. Browse Items page now shows all users’ lost items
2. Browse Items page now shows all users’ found items
3. Current user can still see their own items there too
4. My Items / owner-only pages remain unchanged
5. Edit/delete/recover permissions are still owner-only
6. No private data is exposed
7. No build errors
8. No runtime errors
9. No broken imports
10. No unrelated features were modified

OUTPUT REQUIRED
When finished, provide:
1. Root cause of the Browse Items issue
2. Exact minimal changes made
3. Changed files
4. Confirmation that only the Browse Items functionality was updated
5. Confirmation that all users’ lost and found items are now shown there