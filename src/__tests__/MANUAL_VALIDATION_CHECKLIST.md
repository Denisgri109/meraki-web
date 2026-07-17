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

## 9. Test Suite
- [ ] Run `npx tsc --noEmit` → no new errors (pre-existing errors in register/proxy tests may remain)
- [ ] Run `npx jest --passWithNoTests` → all new tests pass
- [ ] Run `npm run build` → build succeeds
