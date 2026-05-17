# Merakí Web — Phased Implementation Plan

> Source: groups every unchecked item from `MOBILE_FEATURES_CHECKLIST.md` into related work phases.
> Order = work order. Each phase ships independently; dependencies flow downward.
> Tick the phase box `[x]` when **all** items inside are done.

---

## Phase 1 — Discovery & Browse polish

Closes the client-side browsing gaps. Touches home, discover, and shop browse screens.

- [ ] Featured Masters Carousel (home)
- [ ] Popular Services Grid (home)
- [ ] Pull-to-Refresh (home)
- [ ] Browse Masters (full list)
- [ ] City Filter (filter Masters by location)
- [ ] Service Detail View (description, duration, pricing, available specialists)
- [ ] Category Filtering (shop)
- [ ] Product Detail View — verify navigation + content completeness
- [ ] Role-Based Pricing (retail for clients, wholesale for Masters)

---

## Phase 2 — Appointment lifecycle (client + master)

All flows that touch the same `appointments` row.

### Client side
- [ ] Appointment Cards redesign (date, time, service, Master, price)
- [ ] Pull-to-Refresh (appointments list)
- [ ] Cancel Appointment — Late (<24h) with 50% penalty fee warning
- [ ] Price Breakdown (total, deposit due, balance at salon)
- [ ] Cancellation Policy display
- [ ] Confirmation Requests (push prompt to confirm attendance)
- [ ] YES Response (confirm)
- [ ] NO Response (cancel)
- [ ] Confirmation Deadline (respond within window)
- [ ] "Confirmed & Protected" badge

### Master side
- [ ] View Details
- [ ] Mark as Completed
- [ ] Direct Chat from appointment
- [ ] Reschedule (propose new date/time, client approval)
- [ ] No-Show Action Modal (Charge Now / Wait Grace / Client Late)
- [ ] Grace Period Logic (auto-charge after expiry)
- [ ] Configurable No-Show Fee %
- [ ] Late Arrival Tracking

---

## Phase 3 — Master Schedule & Calendar

Scheduling stack rebuilt as one unit.

- [ ] Toggle Days (enable/disable per weekday)
- [ ] Time Selection (start/end per day)
- [ ] Save Schedule
- [ ] Block Time Slots (manual block specific periods)
- [ ] Vacation Mode (block multiple days)
- [ ] Reason Field for blocks
- [ ] View Blocked Slots
- [ ] Visual Calendar View
- [ ] Time Slots (available vs booked)
- [ ] Calendar Navigation (weeks/months)

---

## Phase 4 — Master Service Management

- [x] Service Details (name, duration, price, description)
- [x] Toggle Availability (enable/disable services)
- [x] Custom Pricing (per-service override)
- [x] Custom Duration override
- [x] Edit Service
- [x] Delete Service
- [x] Per-Service Deposit Override

---

## Phase 5 — Master Business Settings

All settings tables, one cohesive form.

### Deposit
- [ ] Require Deposit Toggle
- [ ] Global Deposit — Percentage mode
- [ ] Global Deposit — Fixed amount mode
- [ ] Per-Service Deposit Override (cross-link with Phase 4)

### Confirmation
- [ ] Request Confirmation Timing (e.g., 48h before)
- [ ] Response Timeout (e.g., 24h)
- [ ] Auto-Cancel unconfirmed appointments

### No-Show Policy
- [ ] No-Show Charge Percentage
- [ ] Late Arrival Threshold
- [ ] Grace Period Multiplier
- [ ] Custom Terms & Conditions

### Notifications + Aftercare
- [ ] Push Notification Preferences
- [ ] Confirmation Reminders toggle
- [ ] Aftercare Campaign toggle
- [ ] Aftercare Schedule Timing
- [ ] Aftercare Message Content
- [ ] View Active Aftercare Campaigns
- [ ] Automated Aftercare Delivery

---

## Phase 6 — Consultations & Chat polish

Touches `messages` plus a new `consultations` flow.

### Client
- [ ] Photo Consultation request (send photos for pre-service)
- [ ] Consultation Waiting Screen
- [ ] Pre-Service Questionnaire

### Master
- [ ] View Submitted Photos
- [ ] Review Requests (assess suitability)
- [ ] Approve/Decline
- [ ] Send Feedback to client
- [ ] View Booking Consultations
- [ ] Pre-Service Assessment
- [ ] Approve/Decline Bookings based on consultation

### Chat polish
- [ ] Message Grouping (by sender)
- [ ] Profile Photos in chat
- [ ] Message Status (sent/delivered)
- [ ] Conversation Types audit (Client↔Master, Client↔Owner, Master↔Owner)

---

## Phase 7 — Loyalty Program (full)

Stamp / QR / NFC / rewards as a single program.

### Client
- [ ] Scan QR Codes (camera scan to earn points)
- [ ] +50 Points Per Scan
- [ ] Dynamic QR Codes (rotate after each scan)
- [ ] NFC Tag Scanning
- [ ] Multiple Cards Per Master (different services)
- [ ] Card Selection (choose which to stamp)
- [ ] Progress Tracking (visual stamp progress)
- [ ] Transaction / Points History

### Master
- [ ] Display QR Code (unique per Master)
- [ ] Dynamic Codes (rotate after each scan)
- [ ] QR Code Full-Screen
- [ ] Loyalty Card Builder — create cards
- [ ] Multiple Cards (different services)
- [ ] Card Naming
- [ ] Stamp Requirements
- [ ] Reward Definition (discount / free service / etc.)
- [ ] Manage Rewards (view/edit)
- [ ] Reward Catalog
- [ ] Points System configuration (+50 default)

---

## Phase 8 — Inventory & Supplies

### Master
- [ ] Add Supplies (name, qty, unit, threshold, cost)
- [ ] Update Stock (add/remove)
- [ ] Low Stock Alerts
- [ ] Supply History (usage over time)
- [ ] Usage Tracking (auto-deduct on completion)
- [ ] Cost Calculation (per-service)

### Owner
- [ ] Owner Supplies Screen (platform-wide)
- [ ] Add Owner Supply
- [ ] Supply Tracking
- [ ] Usage Reports

---

## Phase 9 — Portfolio & Master Profile

- [ ] Photo Gallery
- [ ] Delete Photos
- [ ] Public Portfolio Display (visible to clients)
- [ ] View Public Profile (see what clients see)
- [ ] Edit Bio
- [ ] Set Location (business address, city)
- [ ] Profile Photo
- [ ] Notification Preferences
- [ ] Business Hours (cross-link with Phase 3)
- [ ] Account Settings (password, email)
- [ ] Master Onboarding flow (web — verify completeness)

---

## Phase 10 — Owner Platform Management

### Master Management
- [ ] Master Invitations (send invites)
- [ ] Pending Approvals
- [ ] Master Profiles (view/edit)
- [ ] Deactivate Masters
- [ ] Application Review Screen

### Platform Analytics
- [ ] Platform Statistics (high-level metrics)
- [ ] Revenue Tracking (total platform earnings)
- [ ] Booking Analytics (platform-wide)
- [ ] User Statistics (clients, Masters, Owners)

---

## Phase 11 — Owner Shop & Orders

### Products
- [ ] Edit Products
- [ ] Delete Products
- [ ] Stock Management

### Inventory Dashboard
- [ ] View All Inventory
- [ ] Low Stock Alerts
- [ ] Stock History
- [ ] Supplier Management

### Pricing
- [ ] Wholesale Pricing (~30% off)
- [ ] Dual Pricing Display (auto per role)

### Orders
- [ ] View All Orders (platform-wide)
- [ ] Order Detail Screen
- [ ] Order Status Updates
- [ ] Client-side Order Status tracking

---

## Phase 12 — Academy (full)

Largest single subsystem.

### Owner
- [ ] Create Courses (title, description, cover, price, publish)
- [ ] Edit Courses
- [ ] Delete Courses
- [ ] Curriculum Builder (chapters + lessons)
- [ ] Create Lessons (video URL, upload, resources, homework toggle)
- [ ] Edit Lessons
- [ ] Lesson Ordering
- [ ] View Students (enrolled list)
- [ ] Student Analytics (revenue, enrollments, completion)
- [ ] Student Progress (individual)
- [ ] Student Detail Screen
- [ ] Homework Inbox (pending submissions)
- [ ] Review Submissions
- [ ] Pending Badge
- [ ] Send Feedback to students
- [ ] Lesson Q&A Inbox
- [ ] Q&A Detail / Response

### Client
- [ ] Course Purchase (via checkout)
- [ ] Lesson Progress (track completion)
- [ ] Lesson Navigation
- [ ] Homework Feedback (view instructor reply)

---

## Phase 13 — Service Catalog & Pilates (Owner)

### Service Catalog
- [ ] Create Global Services
- [ ] Edit Services
- [ ] Delete Services
- [ ] Service Categories (organize)
- [ ] Service Form Screen (full CRUD)

### Pilates
- [ ] Pilates Hub Screen (overview)
- [ ] Operating Days configuration (verify on web)
- [ ] Session creation / auto-generation from templates
- [ ] Session overrides (manual edits)
- [ ] Booked session protection

---

## Phase 14 — Payments, Notifications, Support (cross-cutting)

Final polish across multiple subsystems.

### Saved Payment Methods
- [ ] Add Payment Method (verify)
- [ ] View Saved Cards (verify)
- [ ] Set Default Card
- [ ] Delete Cards
- [ ] Multiple Payment Methods support
- [ ] 3D Secure authentication

### Booking Payments
- [ ] Pre-Authorization (hold + later capture)
- [ ] Balance Due (remaining at salon)
- [ ] Mandate Deposit
- [ ] No-Show Fee Capture (auto-charge)
- [ ] Service Completion Charge

### Master Earnings + Stripe Connect
- [ ] Transaction History
- [ ] Earnings Breakdown (filter by period)
- [ ] Payout Status
- [ ] Connect Bank Account (Stripe)
- [ ] Stripe Dashboard Access
- [ ] Payout Settings

### Owner Finance
- [ ] Shop Sales revenue tracking (→ Owner Stripe)
- [ ] Academy Sales revenue tracking
- [ ] Commission Tracking (Master services)
- [ ] Payout Management
- [ ] Owner Stripe Dashboard
- [ ] Financial Reports
- [ ] Refund Processing (admin)
- [ ] Customer Portal (Stripe billing)

### Refunds
- [ ] Partial Refunds
- [ ] No-Show Fee Refunds

### Payouts
- [ ] Automatic Payouts (scheduled)
- [ ] Payout Tracking (pending/completed)
- [ ] Earnings Reports

### Push Notifications (full)
- [ ] New Booking (Master)
- [ ] Booking Confirmed (Client)
- [ ] Reschedule Request / Approved / Declined
- [ ] Cancellation
- [ ] 24-Hour Reminder
- [ ] 1-Hour Reminder
- [ ] Confirmation Request prompt
- [ ] No-Show Marked
- [ ] Grace Period Expiring
- [ ] Late Arrival
- [ ] New Message
- [ ] Order Confirmed / Shipped / Low Stock
- [ ] Course Purchase / Homework Feedback
- [ ] Promotional Offers / New Features / Events
- [ ] Owner: Send Promotional Push
- [ ] Owner: Targeted Campaigns
- [ ] Owner: Notification History

### Support
- [ ] FAQ Section
- [ ] Support Contact
- [ ] Manage FAQ/Support content (Owner)
- [ ] Support Settings Screen (Owner)

### Misc
- [ ] Session Persistence across app restarts

---

*Generated: 2026-05-17 — keep in sync with `MOBILE_FEATURES_CHECKLIST.md`.*
