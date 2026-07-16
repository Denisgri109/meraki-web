# Manual Validation Checklist

## Prerequisites
- Run `npm run dev`
- Log in as owner account
- Open each page below and verify each checkbox

## 1. DeleteButton — Inventory
- [ ] Navigate to /dashboard/inventory (or /beauty/inventory or /pilates/inventory)
- [ ] Each product row has a trash icon next to the active toggle
- [ ] Click trash icon → confirmation modal appears with "Delete product" title
- [ ] Click Cancel → modal closes, product remains
- [ ] Click trash icon again → modal → click Delete → product removed from list
- [ ] Toast "Deleted" appears

## 2. DeleteButton — Vouchers
- [ ] Navigate to /dashboard/vouchers
- [ ] Each voucher has a trash icon next to the Activate/Deactivate button
- [ ] Click → confirm → Delete → voucher removed from list
- [ ] Toast "Deleted" appears

## 3. DeleteButton — Orders
- [ ] Navigate to /dashboard/orders
- [ ] Each order has a trash icon next to the View button
- [ ] Delivered/shipped orders have DISABLED trash icon (greyed out, no click)
- [ ] Pending orders: trash enabled → click → confirm → Delete → order removed
- [ ] Toast "Deleted" appears

## 4. DeleteButton — Appointments
- [ ] Navigate to /dashboard/appointments
- [ ] Each appointment card has a trash icon next to the status badge
- [ ] Completed/no_show appointments have DISABLED trash icon
- [ ] Upcoming appointments: trash enabled → click → confirm → Delete
- [ ] Note: delete may fail if appointment has linked payments (FK constraint) — error toast will show

## 5. DeleteButton — Academy
- [ ] Navigate to /dashboard/academy
- [ ] Each course card has a trash icon next to the existing delete button
- [ ] Click DeleteButton → confirm → Delete → course removed
- [ ] Toast "Deleted" appears

## 6. DeleteButton — Services
- [ ] Navigate to /dashboard/services
- [ ] Each service has a trash icon next to the existing delete button
- [ ] Click DeleteButton → confirm → Delete → service removed
- [ ] Toast "Deleted" appears

## 7. DeleteButton — Supplies
- [ ] Navigate to /dashboard/supplies
- [ ] Each supply has a trash icon next to the existing delete button
- [ ] Click DeleteButton → confirm → Delete → supply removed
- [ ] Toast "Deleted" appears

## 8. DeleteButton — Masters
- [ ] Navigate to /dashboard/masters
- [ ] Open the dropdown menu for a master
- [ ] See "Delete (disabled — use Deactivate)" with a greyed-out trash icon
- [ ] Click trash icon → nothing happens (disabled)

## 9. Bulk Finance — Page Access
- [ ] Navigate to /dashboard/bulk-finance
- [ ] As owner: see 4 operation cards (Issue Vouchers, Grant Credits, Grant Passes, Pay Vouchers)
- [ ] See profile count banner ("N accounts will be affected")
- [ ] Log in as client → navigate to /dashboard/bulk-finance → "Owner Only" message

## 10. Bulk Finance — Issue Vouchers
- [ ] Select a voucher code from the dropdown
- [ ] Select scope: All Accounts
- [ ] Click "Issue to N accounts" → confirmation modal appears
- [ ] Click Cancel → modal closes, nothing happens
- [ ] Click "Issue to N accounts" again → confirm → progress spinner → summary appears
- [ ] Summary shows Total, Success, Failed counts
- [ ] Toast with success count appears
- [ ] Verify in Supabase: user_vouchers table has N new rows

## 11. Bulk Finance — Grant Credits
- [ ] Enter amount (e.g., 10)
- [ ] Enter credit type (e.g., "bonus")
- [ ] Enter reason (e.g., "Holiday bonus")
- [ ] Select scope: All Accounts
- [ ] Click "Grant to N accounts" → confirm → progress → summary
- [ ] Verify in Supabase: user_credits table has N new rows with amount=10, is_used=false

## 12. Bulk Finance — Grant Passes
- [ ] Select a class package from the dropdown
- [ ] Select scope: All Accounts
- [ ] Click "Grant to N accounts" → confirm → progress → summary
- [ ] Verify in Supabase: user_passes table has N new rows, credit_ledger has N new entries

## 13. Bulk Finance — Pay Vouchers
- [ ] Enter amount in EUR (e.g., 15.00)
- [ ] Enter description (e.g., "Monthly pay voucher")
- [ ] Select scope: All Accounts
- [ ] Click "Distribute to N accounts" → confirm → progress → summary
- [ ] Summary shows the created voucher code
- [ ] Verify in Supabase: vouchers table has 1 new row, user_vouchers has N new rows

## 14. Nav Item — Bulk Finance
- [ ] Owner navbar shows "Bulk Finance" in secondary nav (Quick Access on dashboard)
- [ ] Click "Bulk Finance" → navigates to /dashboard/bulk-finance
- [ ] Navigate to /beauty/bulk-finance → page loads with section wrapper
- [ ] Navigate to /pilates/bulk-finance → page loads with section wrapper
- [ ] Client navbar does NOT show "Bulk Finance"

## 15. Non-Owner Access
- [ ] Log in as client → navigate to /dashboard/bulk-finance → "Owner Only" message
- [ ] Log in as master → navigate to /dashboard/bulk-finance → "Owner Only" message
- [ ] DeleteButton does NOT render on any page when logged in as client or master

## 16. Test Suite
- [ ] Run `npx tsc --noEmit` → no new errors (pre-existing errors in register/proxy tests may remain)
- [ ] Run `npx jest --passWithNoTests` → all new tests pass
- [ ] Run `npm run build` → build succeeds
