# Merakí Mobile → Web Feature Tracker

> Track which mobile features have been implemented in the web version.
> Mark `[x]` when a feature is live in `meraki_web`.

---

## CLIENT FEATURES

### Authentication & Onboarding

- [ ] Email/Password Registration
- [ ] Email/Password Login
- [ ] Role Selection (Client / Master) during signup
- [ ] Profile Creation (name, photo, contact info) on signup
- [ ] Password Recovery (forgot password with email reset link)
- [ ] OTP Verification (email/phone code verification)
- [ ] Secure Session (automatic token refresh, persistent login)
- [ ] Terms of Service acceptance during registration

### Profile Management

- [ ] View Profile (personal info, avatar, contact details)
- [ ] Edit Profile (name, phone, bio, profile photo)
- [ ] Avatar Upload (upload/change profile picture)
- [ ] Profile Visibility (Masters can view client profiles)

---

### Home & Discovery

#### Home Screen

- [ ] Personalized Greeting (time-of-day aware welcome)
- [ ] Featured Masters Carousel
- [ ] Quick Action Buttons (Shop, Orders, Support, Promotions)
- [ ] Popular Services Grid
- [ ] Pull-to-Refresh

#### Discover & Search

- [ ] Browse Masters (all available service providers)
- [ ] City Filter (filter Masters by location)
- [ ] Master Profiles (bio, services, portfolio, availability)
- [ ] Service Discovery (browse services by category)
- [ ] Service Detail View (description, duration, pricing, available specialists)
- [ ] Search Masters (search by name/service)

---

### Service Booking Flow

- [ ] Select Service (choose from available services)
- [ ] Choose Master (pick from specialists offering service)
- [ ] View Master Detail (full profile with bio, services, portfolio)
- [ ] Select Date (30-day lookahead calendar)
- [ ] Select Time (real-time availability based on Master's schedule)
- [ ] Add Notes (special requests or requirements)
- [ ] Confirm Booking (review and confirm appointment details)
- [ ] Self-booking prevention (owners/masters can't book own services)

---

### Appointments Management

#### Appointment List

- [ ] Unified History (all appointments in one place)
- [ ] Tabbed View (Upcoming, Past, Cancelled)
- [ ] Status Badges (Confirmed, Completed, Cancelled, Reschedule Pending, No-Show)
- [ ] Appointment Cards (date, time, service, Master, price)
- [ ] Pull-to-Refresh

#### Appointment Actions

- [ ] View Details (full appointment information)
- [ ] Direct Chat (message Master from appointment)
- [ ] Reschedule — Early (>24h before) instant
- [ ] Reschedule — Late (<24h before) requires Master approval
- [ ] Cancel Appointment — Early (>24h) free and automatic
- [ ] Cancel Appointment — Late (<24h) warning with 50% penalty fee
- [ ] Cancellation Reasons (provide reason for cancellation)

#### Appointment Confirmation System

- [ ] Confirmation Requests (push notification to confirm attendance)
- [ ] YES Response (confirm attendance)
- [ ] NO Response (cancel appointment)
- [ ] Confirmation Deadline (respond within specified time)
- [ ] "Confirmed & Protected" badge display

#### Financial Clarity

- [ ] Price Breakdown (total cost, deposit due, balance at salon)
- [ ] Cancellation Policy display (fee warning for late cancellations)

---

### Communication

#### In-App Messaging

- [ ] Conversation List (all active conversations)
- [ ] Real-Time Chat (instant messaging)
- [ ] Text Messages (send/receive)
- [ ] Image Sharing (upload/send photos)
- [ ] Video Sharing (upload/send videos)
- [ ] Photo Consultation (send photos for pre-service assessment)
- [ ] Message Grouping (grouped by sender)
- [ ] Timestamps
- [ ] Unread Count Badge
- [ ] Mark Conversation as Read (RPC-based)

#### Consultation System

- [ ] Request Photo Consultation
- [ ] Consultation Waiting Screen
- [ ] Pre-Service Questionnaire

---

### Loyalty Program

#### QR Code Scanning

- [ ] Scan QR Codes (scan Master's QR to earn points)
- [ ] Camera Integration (in-app QR scanner)
- [ ] +50 Points Per Scan
- [ ] Dynamic QR Codes (rotate after each scan)

#### NFC Scanning

- [ ] NFC Tag Scanning (tap phone on NFC tag to earn points)

#### Stamp Cards

- [ ] View Stamp Cards (loyalty cards from different Masters)
- [ ] Multiple Cards Per Master (different services)
- [ ] Card Selection (choose which card to stamp)
- [ ] Progress Tracking (visual stamp progress)

#### Rewards

- [ ] Rewards Catalog (browse available rewards)
- [ ] Redeem Points (exchange for discounts/free services)
- [ ] Transaction/Points History

---

### Shop (E-Commerce)

#### Product Browsing

- [ ] Product Grid (browse all products)
- [ ] Category Filtering
- [ ] Search Products by name
- [ ] Product Detail View (images, description, pricing, stock)
- [ ] Role-Based Pricing (retail for clients, wholesale for Masters)

#### Shopping Cart

- [ ] Add to Cart
- [ ] Cart Management (view, adjust quantities, remove items, total)

#### Checkout

- [ ] Shipping Address entry
- [ ] Europe-Only Shipping restriction
- [ ] Stripe Payment Processing
- [ ] Secure Order Finalization (Edge Function)
- [ ] Order Placement

#### Order History

- [ ] View Orders (list of all purchases)
- [ ] Order Details (products, quantities, prices, status)
- [ ] Order Status tracking

---

### Academy (Learning Platform)

#### Course Discovery

- [ ] Course Catalog (browse all courses)
- [ ] Course Detail View (description, lesson list, price, instructor)
- [ ] Course Purchase (buy through checkout)

#### Learning Experience

- [ ] Video Player (watch course videos)
- [ ] Lesson Progress (track completion)
- [ ] Lesson Navigation (move between lessons)
- [ ] Homework Submission (upload photos, submit assignments)
- [ ] Homework Feedback (view instructor feedback)

---

### Payments & Financial

#### Payment Methods

- [ ] Add Payment Method (save cards)
- [ ] View Saved Cards
- [ ] Set Default Card
- [ ] Delete Cards
- [ ] Secure Storage (PCI-compliant via Stripe)

#### Payment History

- [ ] Transaction List (all payments)
- [ ] Transaction Details (date, amount, service/product, status, refund)

#### Booking Payments

- [ ] Pre-Authorization (hold funds, charge after service)
- [ ] Deposit Payment (pay deposit to secure booking)
- [ ] Balance Due (remaining at salon)
- [ ] Mandate Deposit (some services require deposit)

---

### Support & Legal

- [ ] FAQ Section
- [ ] Support Contact
- [ ] Terms of Service page
- [ ] Privacy Policy page

### Notifications

- [ ] Notification Center (view all notifications)
- [ ] Push Notifications (booking, reminders, reschedule, messages, marketing)

---

## MASTER FEATURES

### Dashboard & Overview

- [ ] Today's Appointments overview
- [ ] Real-Time Statistics (bookings count, earnings, completion rate)
- [ ] Quick Stats Cards
- [ ] Recent Messages Preview
- [ ] Pull-to-Refresh

---

### Appointment Management

#### Appointment List

- [ ] Tabbed View (Pending, Upcoming, Completed)
- [ ] Appointment Cards (client details, service, time, status)
- [ ] Status Badges

#### Appointment Actions

- [ ] View Details
- [ ] Confirm Appointment (approve pending bookings)
- [ ] Decline Appointment (reject booking requests)
- [ ] Mark as Completed
- [ ] Mark as No-Show
- [ ] Direct Chat (message client from appointment)
- [ ] Reschedule (propose new date/time, client approval required)

#### No-Show Management

- [ ] No-Show Action Modal (3 options):
  - [ ] Charge No-Show Fee Now
  - [ ] Wait Grace Period (auto-charge after timeout)
  - [ ] Client Arrived Late (no charge)
- [ ] Grace Period Logic (auto-charge after expiry)
- [ ] Configurable No-Show Fee %
- [ ] Late Arrival Tracking

---

### Schedule & Availability

#### Weekly Availability

- [ ] Weekly Schedule View (set per day)
- [ ] Toggle Days (enable/disable per day)
- [ ] Time Selection (start/end per day)
- [ ] Save Schedule

#### Blocked Slots

- [ ] Block Time Slots (manually block specific periods)
- [ ] Vacation Mode (block multiple days)
- [ ] Reason Field (notes: "Vacation", "Lunch", etc.)
- [ ] View Blocked Slots

#### Calendar View

- [ ] Visual Calendar (appointments in calendar format)
- [ ] Time Slots (available vs booked)
- [ ] Navigation (weeks/months)

---

### Service Management

#### My Services

- [ ] View All Services
- [ ] Service Details (name, duration, price, description)
- [ ] Toggle Availability (enable/disable services)
- [ ] Custom Pricing (override default price per service)
- [ ] Custom Duration (override default duration)

#### Create & Edit Services

- [ ] Add New Service (name, description, price, duration, category, image)
- [ ] Edit Service
- [ ] Deposit Override (per-service deposit requirements)
- [ ] Delete Service

---

### Business Settings

#### Deposit Configuration

- [ ] Require Deposit Toggle (ON/OFF)
- [ ] Global Deposit Settings — Percentage mode (e.g., 20%)
- [ ] Global Deposit Settings — Fixed amount mode (e.g., €20)
- [ ] Per-Service Deposit Override

#### Confirmation Settings

- [ ] Request Confirmation Timing (e.g., 48h before)
- [ ] Response Timeout (e.g., 24h to respond)
- [ ] Auto-Cancel unconfirmed appointments after deadline

#### No-Show Policy

- [ ] No-Show Charge Percentage
- [ ] Late Arrival Threshold (e.g., 15 minutes)
- [ ] Grace Period Multiplier (e.g., 50% of service duration)
- [ ] Custom Terms & Conditions

#### Notification Settings

- [ ] Push Notification Preferences
- [ ] Confirmation Reminders (automated)
- [ ] Aftercare Campaign toggle

---

### Aftercare Campaigns

- [ ] Create Aftercare Messages (post-service care instructions)
- [ ] Schedule Timing (e.g., 2h after appointment)
- [ ] Message Content (custom text)
- [ ] View Active Campaigns
- [ ] Automated Delivery after appointment completion

---

### Earnings & Financial

#### Earnings Tracking

- [ ] Earnings Summary (today, this week, this month)
- [ ] Transaction History
- [ ] Earnings Breakdown (filter by period)
- [ ] Payout Status

#### Stripe Connect

- [ ] Connect Bank Account (link Stripe)
- [ ] Stripe Dashboard Access
- [ ] Payout Settings (configure schedule)

---

### Loyalty Program (Master Side)

#### QR Code Generation

- [ ] Display QR Code (unique per Master)
- [ ] Dynamic Codes (rotate after each scan)
- [ ] QR Code Full-Screen display

#### Loyalty Card Builder

- [ ] Create Loyalty Cards (custom stamp cards)
- [ ] Multiple Cards (different services)
- [ ] Card Naming
- [ ] Stamp Requirements (how many for reward)
- [ ] Reward Definition (discount, free service, etc.)

#### Reward Management

- [ ] Manage Rewards (view/edit)
- [ ] Reward Catalog
- [ ] Points System configuration (+50 default)

---

### Inventory & Supplies

#### Supply Management

- [ ] Add Supplies (name, quantity, unit, low stock threshold, cost)
- [ ] Update Stock (add/remove)
- [ ] Low Stock Alerts
- [ ] Supply History (usage over time)

#### Service-Supply Linking

- [ ] Link Supplies to Services
- [ ] Usage Tracking (auto-deduct on completion)
- [ ] Cost Calculation (per-service cost from supplies)

---

### Portfolio

- [ ] Upload Photos (work samples)
- [ ] Photo Gallery
- [ ] Delete Photos
- [ ] Public Portfolio Display (visible to clients)

---

### Consultation Reviews

#### Photo Consultation Review

- [ ] View Submitted Photos
- [ ] Review Requests (assess suitability)
- [ ] Approve/Decline
- [ ] Send Feedback to client

#### Booking Consultation Review

- [ ] View Booking Consultations
- [ ] Pre-Service Assessment
- [ ] Approve/Decline Bookings based on consultation

---

### Master Profile & Settings

- [ ] View Public Profile (see what clients see)
- [ ] Edit Bio
- [ ] Set Location (business address, city)
- [ ] Profile Photo
- [ ] Notification Preferences
- [ ] Business Hours
- [ ] Account Settings (password, email)
- [ ] Master Onboarding flow

---

## OWNER (ADMIN) FEATURES

> Owners have access to **all Master features** plus the following:

### Platform Management

#### Master Management

- [ ] View All Masters
- [ ] Master Invitations (send invites)
- [ ] Pending Approvals (review/approve new applications)
- [ ] Master Profiles (view/edit)
- [ ] Deactivate Masters
- [ ] Application Review Screen

#### Global Oversight / Platform Analytics

- [ ] Platform Statistics (high-level metrics)
- [ ] Revenue Tracking (total platform earnings)
- [ ] Booking Analytics (platform-wide)
- [ ] User Statistics (total clients, Masters, Owners)

---

### Shop Management

#### Product Management

- [ ] Add Products (name, description, price, category, images, stock)
- [ ] Edit Products
- [ ] Delete Products
- [ ] Stock Management (update levels)

#### Inventory Dashboard

- [ ] View All Inventory (platform-wide stock)
- [ ] Low Stock Alerts
- [ ] Stock History
- [ ] Supplier Management

#### Pricing

- [ ] Retail Pricing (for clients)
- [ ] Wholesale Pricing (for Masters, ~30% discount)
- [ ] Dual Pricing Display (auto per user role)

---

### Academy Management

#### Course Management

- [ ] Create Courses (title, description, cover image, price, publish/unpublish)
- [ ] Edit Courses
- [ ] Delete Courses
- [ ] Curriculum Builder (chapters + lessons, organize structure)

#### Lesson Management

- [ ] Create Lessons (video URL, direct upload, resources, homework toggle)
- [ ] Edit Lessons
- [ ] Lesson Ordering

#### Student Management

- [ ] View Students (enrolled list)
- [ ] Student Analytics (revenue, enrollments, completion rates)
- [ ] Student Progress (individual tracking)
- [ ] Student Detail Screen

#### Homework Review

- [ ] Homework Inbox (pending submissions)
- [ ] Review Submissions (view photos, feedback, approve/reject)
- [ ] Pending Badge (unreviewed indicator)
- [ ] Send Feedback to students

#### Lesson Q&A

- [ ] Lesson Q&A Inbox
- [ ] Q&A Detail / Response

---

### Service Catalog Management

- [ ] Create Global Services (available to all Masters)
- [ ] Edit Services
- [ ] Delete Services
- [ ] Service Categories (organize by category)
- [ ] Service Form Screen (full CRUD)

---

### Owner Supplies

- [ ] Owner Supplies Screen (platform-wide)
- [ ] Add Owner Supply
- [ ] Supply Tracking (monitor levels)
- [ ] Usage Reports

---

### Pilates Management

- [ ] Pilates Hub Screen (overview)
- [ ] Pilates Timetable Management (full weekly timetable)
- [ ] Operating Days configuration (on/off per weekday)
- [ ] Session creation / auto-generation from templates
- [ ] Session overrides (manual edits)
- [ ] Booked session protection (prevent deletion of booked classes)

---

### Platform Notifications (Marketing)

- [ ] Send Promotional Push Notifications to all users
- [ ] Targeted Campaigns (specific segments)
- [ ] Notification History

---

### Owner Orders Management

- [ ] View All Orders (platform-wide)
- [ ] Order Detail Screen
- [ ] Order Status Updates

---

### Support Settings

- [ ] Manage FAQ/Support content
- [ ] Support Settings Screen

---

### Financial Management

#### Platform Revenue

- [ ] Shop Sales revenue (→ Owner Stripe)
- [ ] Academy Sales revenue (→ Owner Stripe)
- [ ] Commission Tracking (from Master services)
- [ ] Payout Management (manage Master payouts)

#### Stripe Integration

- [ ] Owner Stripe Dashboard access
- [ ] Financial Reports
- [ ] Refund Processing
- [ ] Customer Portal (Stripe billing portal)

---

## CROSS-CUTTING FEATURES

### Chat System (All Roles)

- [ ] Conversation List with unread indicators
- [ ] Recent message preview
- [ ] Real-Time Messaging (instant delivery)
- [ ] Text Messages
- [ ] Image Sharing
- [ ] Video Sharing
- [ ] Message Status (sent/delivered)
- [ ] Timestamps
- [ ] Profile Photos in chat
- [ ] Conversation Types: Client↔Master, Client↔Owner, Master↔Owner

---

### Push Notifications (All Roles)

#### Booking Notifications

- [ ] New Booking (Master receives)
- [ ] Booking Confirmed (Client receives)
- [ ] Reschedule Request (both parties)
- [ ] Reschedule Approved/Declined
- [ ] Cancellation notification
- [ ] Confirmation Reminder (24h, 1h before)

#### Appointment Reminders

- [ ] 24-Hour Reminder
- [ ] 1-Hour Reminder
- [ ] Confirmation Request prompt

#### No-Show & Late

- [ ] No-Show Marked notification
- [ ] Grace Period Expiring warning
- [ ] Late Arrival notification

#### Messaging

- [ ] New Message notification

#### Shop & Academy

- [ ] Order Confirmed
- [ ] Order Shipped
- [ ] Low Stock Alert
- [ ] Course Purchase confirmation
- [ ] Homework Feedback notification

#### Marketing

- [ ] Promotional Offers
- [ ] New Features announcements
- [ ] Event Announcements

---

### Payment Processing (All Roles)

#### Stripe Integration

- [ ] Secure Payments (PCI-compliant)
- [ ] Multiple Payment Methods (various card types)
- [ ] 3D Secure authentication

#### Saved Payment Methods

- [ ] Add Cards
- [ ] View Saved Cards (brand, last 4, expiry)
- [ ] Set Default
- [ ] Delete Cards

#### Booking Payments

- [ ] Pre-Authorization (hold, charge after service)
- [ ] Deposit Collection
- [ ] Balance Collection (at salon or charged later)
- [ ] No-Show Fee Capture (auto-charge)
- [ ] Service Completion Charge (capture held funds)

#### Shop Payments

- [ ] Immediate Charge at checkout
- [ ] Order Processing (payment before shipping)
- [ ] Secure Finalization via Edge Function

#### Refunds

- [ ] Full Refunds (cancelled services)
- [ ] Partial Refunds (disputes/adjustments)
- [ ] No-Show Fee Refunds

#### Payouts (Master/Owner)

- [ ] Stripe Connect (link bank)
- [ ] Automatic Payouts (scheduled transfers)
- [ ] Payout Tracking (pending/completed)
- [ ] Earnings Reports

---

### Account Management

- [ ] Delete Account (Edge Function: full data removal)
- [ ] Logout
- [ ] Session Persistence across app restarts

---

*Last updated: 2026-05-15*
