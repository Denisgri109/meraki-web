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

## Phase 2 — Appointment lifecycle (client + master) ✅

All flows that touch the same `appointments` row.

### Client side
- [x] Appointment Cards redesign (date, time, service, Master, price)
- [x] Cancel Appointment — Late (<24h) with 50% penalty fee warning (Dynamically warns client if within configured settings hours window)
- [x] Price Breakdown (total, deposit due, balance at salon)
- [x] Cancellation Policy display (Shows detailed late window limits and fees in drawer)
- [x] Confirmation Requests (push prompt to confirm attendance) *(Mobile-only push notification. Web equivalent: in-app active Alert/Action required banner on pending cards)*
- [x] YES Response (confirm) (Sets client_confirmed = true and status = 'confirmed')
- [x] NO Response (cancel) (Declines invitation and cancels appointment)
- [x] Confirmation Deadline (respond within window) (Dynamic deadline timing warning)
- [x] "Confirmed & Protected" badge (Glassmorphic emerald safety badge inside cards/drawer)

### Master side
- [x] View Details (Highly detailed, responsive glassmorphic side-drawer)
- [x] Mark as Completed (One-click state update for appointment session)
- [x] Direct Chat from appointment (Automatic lookup/creation of conversation and smooth localStorage-backed page routing)
- [x] Reschedule (propose new date/time, client approval) (Forms to propose times, client drawer displays prompt with Accept/Decline action)
- [x] No-Show Action Modal (Charge Now / Wait Grace / Client Late) (Interactive panels supporting three discrete operational pathways)
- [x] Grace Period Logic (auto-charge after expiry) (Wait Grace tracks grace period ends and shows countdown warning)
- [x] Configurable No-Show Fee % (Reads and implements custom fee calculation from settings)
- [x] Late Arrival Tracking (Logs actual late minutes and checks against business settings arrival thresholds)

---

## Phase 3 — Master Schedule & Calendar ✅

Scheduling stack rebuilt as one unit.

- [x] Toggle Days (enable/disable per weekday)
- [x] Time Selection (start/end per day)
- [x] Save Schedule
- [x] Block Time Slots (manual block specific periods)
- [x] Vacation Mode (block multiple days)
- [x] Reason Field for blocks
- [x] View Blocked Slots
- [x] Visual Calendar View
- [x] Time Slots (available vs booked)
- [x] Calendar Navigation (weeks/months)

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

## Phase 5 — Master Business Settings ✅

All settings tables, one cohesive form — implemented in `BusinessSettingsPanel.tsx`, accessible from `/dashboard/settings` → Business tab.

### Deposit
- [x] Require Deposit Toggle — toggle on/off with automatic percentage/fixed defaults
- [x] Global Deposit — Percentage mode — chip selector (10/20/30/50/100%)
- [x] Global Deposit — Fixed amount mode — EUR input with toggle between % and fixed
- [x] Per-Service Deposit Override (cross-link with Phase 4) — info banner linking to `/dashboard/services`

### Confirmation
- [x] Request Confirmation Timing (e.g., 48h before) — dropdown (12/24/48/72h)
- [x] Response Timeout (e.g., 24h) — dropdown (12/24/48h)
- [x] Auto-Cancel unconfirmed appointments — toggle with description

### No-Show Policy
- [x] No-Show Charge Percentage — dropdown (0/25/50/75/100%)
- [x] Late Arrival Threshold — dropdown (10/15/20/30 minutes)
- [x] Grace Period Multiplier — dropdown (25/50/75/100% of service duration)
- [x] Custom Terms & Conditions — modal editor with require-acceptance toggle

### Notifications + Aftercare
- [x] Push Notification Preferences — push enabled toggle + category toggles (bookings, messages, promotions)
- [x] Confirmation Reminders toggle — "Booking Reminders" toggle in notification preferences
- [x] Aftercare Campaign toggle — full campaign CRUD (create/edit/pause/delete)
- [x] Aftercare Schedule Timing — configurable days-after-appointment (7/14/21/30/45/60/90d)
- [x] Aftercare Message Content — rich text editor with `{name}` placeholder support
- [x] View Active Aftercare Campaigns — campaign list with status badges (Active/Paused), type emoji, and metadata
- [x] Automated Aftercare Delivery — recurring toggle for auto-send after every completed appointment

---

## Phase 6 — Consultations & Chat polish ✅

Touches `messages` plus a new `consultations` flow.

### Client
- [x] Photo Consultation request (send photos for pre-service) — `/dashboard/consultations` "New Request" tab with multi-photo upload, title, service type, description
- [x] Consultation Waiting Screen — `/dashboard/consultations` "My Requests" tab shows pending status with "Waiting for professional review..." indicator
- [x] Pre-Service Questionnaire — `/dashboard/consultations` "Pre-Service Forms" tab with dynamic questions from service config, had-before/time-since/notes flow

### Master
- [x] View Submitted Photos — `/dashboard/consultations` "Photo Reviews" tab with photo grid detail view
- [x] Review Requests (assess suitability) — is_doable toggle + professional notes + recommendations fields
- [x] Approve/Decline — "Approve & Send Feedback" / "Decline" buttons for photo consultations
- [x] Send Feedback to client — master_reply, professional_notes, recommendations, estimated price range, estimated duration
- [x] View Booking Consultations — `/dashboard/consultations` "Booking Reviews" tab with client details, service info, had-before data
- [x] Pre-Service Assessment — `/dashboard/consultations` "Assessments" tab shows all consultation_responses with client answers
- [x] Approve/Decline Bookings based on consultation — "Approve Booking" / "Decline" buttons with master notes for booking consultations

### Chat polish
- [x] Message Grouping (by sender) — messages within 2-min window from same sender are grouped with reduced spacing + adjusted bubble radii
- [x] Profile Photos in chat — avatars in sidebar list + message bubbles (last-in-group only for other user)
- [x] Message Status (sent/delivered) — single grey check for sent, double blue checks for read (`msg-status-sent`/`msg-status-read` CSS classes)
- [x] Conversation Types audit (Client↔Master, Client↔Owner, Master↔Owner) — chat header shows relationship type label based on other user's role

---

## Phase 7 — Loyalty Program (full)

Stamp / QR / NFC / rewards as a single program.

### Client
- [x] Scan QR Codes (camera scan to earn points) — `/dashboard/loyalty/scan`
- [x] +50 Points Per Scan (master-configurable, default 50)
- [x] Dynamic QR Codes (rotate after each scan) — server-side rotation in `process_qr_scan`
- [x] NFC Tag Scanning — Web NFC `NDEFReader` (Chromium Android)
- [x] Multiple Cards Per Master (different services) — see card picker
- [x] Card Selection (choose which to stamp) — modal on multi-card masters
- [x] Progress Tracking (visual stamp progress) — `/dashboard/loyalty`
- [x] Transaction / Points History — history modal on `/dashboard/loyalty`

### Master
- [x] Display QR Code (unique per Master) — `/dashboard/loyalty/qr`
- [x] Dynamic Codes (rotate after each scan) — realtime + manual rotate
- [x] QR Code Full-Screen — Fullscreen API
- [x] Loyalty Card Builder — `/dashboard/loyalty/cards`
- [x] Multiple Cards (different services)
- [x] Card Naming
- [x] Stamp Requirements (configurable, presets 3/5/6/8/10/12)
- [x] Reward Definition (free service / discount % / fixed amount)
- [x] Manage Rewards (view/edit) — `/dashboard/loyalty/manage`
- [x] Reward Catalog — `/dashboard/loyalty` master view
- [x] Points System configuration (+50 default) — settings modal on `/dashboard/loyalty/qr`

---

## Phase 8 — Inventory & Supplies ✅

### Master
- [x] Add Supplies (name, qty, unit, threshold, cost)
- [x] Update Stock (add/remove)
- [x] Low Stock Alerts
- [x] Supply History (usage over time)
- [x] Usage Tracking (auto-deduct on completion)
- [x] Cost Calculation (per-service)

### Owner
- [x] Owner Supplies Screen (platform-wide)
- [x] Add Owner Supply
- [x] Supply Tracking
- [x] Usage Reports

---

## Phase 9 — Portfolio & Master Profile

- [x] Photo Gallery — Portfolio tab in Settings (upload multiple, view grid, edit descriptions). Uses `portfolios` table + Supabase Storage `portfolios` bucket.
- [x] Delete Photos — Delete button on hover in portfolio grid + in photo detail modal, with confirmation dialog.
- [x] Public Portfolio Display (visible to clients) — `/dashboard/masters/[id]` page shows master bio, services, and full portfolio gallery with lightbox viewer.
- [x] View Public Profile (see what clients see) — "View Public Profile" button in Settings → Profile section links to `/dashboard/masters/[id]` with own-profile banner.
- [x] Edit Bio — Settings → Profile tab textarea field, persisted via `updateProfile({ bio })`.
- [x] Set Location (business address, city) — Settings → Profile tab city field. Profile table has `city` and `country` columns.
- [x] Profile Photo — Settings → Profile tab avatar upload to Supabase Storage `avatars` bucket.
- [x] Notification Preferences — (Mobile only; removed from Web settings)
- [x] Business Hours (cross-link with Phase 3) — Availability management at `/dashboard/availability` (Phase 3 complete). BusinessSettingsPanel also links to availability settings.
- [x] Account Settings (password, email) — Settings → Security tab: email change with dual-email verification flow, password reset via email link, account deletion with OTP verification.
- [x] Master Onboarding flow (web — verify completeness) — 6-step onboarding at `/dashboard/onboarding` (welcome → profile → services → availability → portfolio → business_settings). Redirects masters on first login; marks `onboarding_completed` on finish. Portfolio step now deep-links to Settings → Portfolio tab.

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
