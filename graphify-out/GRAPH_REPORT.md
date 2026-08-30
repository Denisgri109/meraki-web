# Graph Report - meraki-WEB  (2026-08-30)

## Corpus Check
- 306 files · ~241,236 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1482 nodes · 3100 edges · 123 communities (106 shown, 17 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `cfd15232`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- MainNavbar.tsx
- dashboard/shop/page.tsx
- dashboard/loyalty/page.tsx
- createClient
- locationApi.ts
- dashboard/booking/page.tsx
- dashboard/settings/page.tsx
- CustomizeDrawer.tsx
- dependencies
- devDependencies
- dashboard/finance/page.tsx
- compilerOptions
- dashboard/appointments/page.tsx
- dashboard/qr-payments/page.tsx
- dashboard/availability/page.tsx
- dashboard/earnings/page.tsx
- database.ts
- PilatesTimetableManager.tsx
- dashboard/inventory/page.tsx
- MASTER FEATURES
- useModal
- BusinessSettingsPanel.tsx
- useAuth
- test-panel.ts
- SectionContext.tsx
- dashboard/supplies/page.tsx
- LandingPageClient.tsx
- ErrorBoundary
- dashboard/checkout/page.tsx
- dashboard/academy/learn/[courseId]/page.tsx
- dashboard/clients/[id]/page.tsx
- dashboard/orders/page.tsx
- dashboard/passes/page.tsx
- useEditMode
- dashboard/consultations/page.tsx
- dashboard/notifications/page.tsx
- useSection
- dashboard/academy/[courseId]/page.tsx
- dashboard/support/page.tsx
- dashboard/discover/page.tsx
- safeStorage.ts
- CLIENT FEATURES
- dashboard/loyalty/cards/page.tsx
- dashboard/vouchers/page.tsx
- useToast
- dashboard/academy/homework/page.tsx
- dashboard/academy/page.tsx
- createClient
- dashboard/onboarding/page.tsx
- PaymentMethodsManager.tsx
- dashboard/academy/qa/page.tsx
- EditableText.tsx
- dashboard/class-packages/page.tsx
- dashboard/clients/page.tsx
- SectionPageWrapper.tsx
- stripe.ts
- SectionSettings.tsx
- dashboard/loyalty/scan/page.tsx
- proxy.test.ts
- benchmark_plimit.js
- jest.config.js
- patch.js
- eslint.config.mjs
- next.config.ts
- postcss.config.mjs
- OWNER (ADMIN) FEATURES
- dashboard/masters/page.tsx
- Manual Validation Checklist
- register/__tests__/page.test.tsx
- CartContext.tsx
- package.json
- Phase 14 — Payments, Notifications, Support (cross-cutting)
- dashboard/masters/[id]/page.tsx
- privacy-policy/page.tsx
- DeleteButton.tsx
- Owner customization (web)
- dashboard/shop/[id]/page.tsx
- CartCheckoutForm
- Push Notifications (All Roles)
- Payment Processing (All Roles)
- RootPortal.tsx
- CLAUDE.md
- Academy Management
- Merakí Web — Phased Implementation Plan
- SectionShop.tsx
- Merakí Web Platform - Development Stages
- CROSS-CUTTING FEATURES
- Appointments Management
- Shop (E-Commerce)
- Loyalty Program
- Phase 12 — Academy (full) ✅
- Phase 5 — Master Business Settings ✅
- Phase 11 — Owner Shop & Orders
- MainNavbar.test.tsx
- Payments & Financial
- Shop Management
- Phase 6 — Consultations & Chat polish ✅
- README.md
- sentinel.md
- Phase 7 — Loyalty Program (full)
- Phase 2 — Appointment lifecycle (client + master) ✅
- Phase 8 — Inventory & Supplies ✅
- Phase 10 — Owner Platform Management ✅
- Phase 13 — Service Catalog & Pilates (Owner) ✅
- AGENTS.md
- react
- tailwindcss
- @tailwindcss/postcss
- @testing-library/jest-dom
- ts-node
- @types/jest
- @types/node
- @types/testing-library__jest-dom
- typescript

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 145 edges
2. `createClient()` - 124 edges
3. `useToast()` - 102 edges
4. `SectionPageWrapper()` - 82 edges
5. `useSection()` - 74 edges
6. `useModal()` - 32 edges
7. `createClient()` - 32 edges
8. `useEditMode()` - 23 edges
9. `EditableText()` - 18 edges
10. `DeleteButton()` - 17 edges

## Surprising Connections (you probably didn't know these)
- `renderRegister()` --indirect_call--> `getAllCountries()`  [INFERRED]
  src/app/(auth)/register/__tests__/page.test.tsx → src/lib/locationApi.ts
- `ClientView()` --calls--> `useSection()`  [EXTRACTED]
  src/app/dashboard/loyalty/page.tsx → src/contexts/SectionContext.tsx
- `MasterView()` --calls--> `useSection()`  [EXTRACTED]
  src/app/dashboard/loyalty/page.tsx → src/contexts/SectionContext.tsx
- `DashboardPage()` --calls--> `useAuth()`  [EXTRACTED]
  src/app/dashboard/page.tsx → src/contexts/AuthContext.tsx
- `LandingPage()` --calls--> `createClient()`  [EXTRACTED]
  src/app/page.tsx → src/lib/supabase/server.ts

## Import Cycles
- None detected.

## Communities (123 total, 17 thin omitted)

### Community 0 - "MainNavbar.tsx"
Cohesion: 0.19
Nodes (12): MainNavbarProps, DashboardAppointment, SectionDashboardHome(), clientPrimaryNav, clientSecondaryNav, LucideIcon, masterPrimaryNav, masterSecondaryNav (+4 more)

### Community 1 - "dashboard/shop/page.tsx"
Cohesion: 0.29
Nodes (8): Product, ShopPage(), DEFAULT_PRODUCT_IMAGE, DEFAULT_PRODUCT_IMAGE_HERO, DEFAULT_PRODUCT_IMAGE_LARGE, DEFAULT_PRODUCT_IMAGE_MEDIUM, FALLBACK_PRODUCT_IMAGES, FALLBACK_PRODUCT_IMAGES_LARGE

### Community 2 - "dashboard/loyalty/page.tsx"
Cohesion: 0.17
Nodes (12): StampCardsList(), StampCardsListProps, UserRewards(), UserRewardsProps, ClientView(), formatRewardValue(), LoyaltyPage(), MasterView() (+4 more)

### Community 3 - "createClient"
Cohesion: 0.08
Nodes (34): GET(), PATCH(), POST(), requireOwner(), DELETE(), GET(), getCaller(), PATCH() (+26 more)

### Community 4 - "locationApi.ts"
Cohesion: 0.11
Nodes (32): LocationGateModal(), LocationGateModalProps, PickerSheetProps, supabase, DropdownItem, LocationPicker(), LocationPickerProps, SearchableDropdownProps (+24 more)

### Community 5 - "dashboard/booking/page.tsx"
Cohesion: 0.08
Nodes (35): BlockedSlot, BookingDraft, BookingError, BookingPage(), BookingUser, buildCalendarWeeks(), CheckoutForm(), CheckoutFormProps (+27 more)

### Community 6 - "dashboard/settings/page.tsx"
Cohesion: 0.16
Nodes (23): FieldErrors, RegisterPage(), baseNavItems, getErrorMessage(), masterNavItems, PILATES_DEFAULT_SETTINGS, PilatesSettingsForm, PilatesSettingsRow (+15 more)

### Community 7 - "CustomizeDrawer.tsx"
Cohesion: 0.07
Nodes (35): ALL_TEXT_FIELDS, ALL_TEXT_GROUPS, COLOR_FIELDS, ColorField, CustomizeDrawer(), CustomizeDrawerProps, IMAGE_FIELDS, ImageField (+27 more)

### Community 8 - "dependencies"
Cohesion: 0.07
Nodes (27): browser-image-compression, dotenv, emoji-picker-react, lucide-react, next, dependencies, browser-image-compression, dotenv (+19 more)

### Community 9 - "devDependencies"
Cohesion: 0.09
Nodes (23): eslint, eslint-config-next, jest-environment-jsdom, devDependencies, eslint, eslint-config-next, jest, jest-environment-jsdom (+15 more)

### Community 10 - "dashboard/finance/page.tsx"
Cohesion: 0.08
Nodes (27): AppointmentInfo, AppointmentItem, EnrollmentItem, FinancePage(), formatCurrency(), formatDate(), formatDateTime(), getPayoutStatusBadge() (+19 more)

### Community 11 - "compilerOptions"
Cohesion: 0.07
Nodes (29): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+21 more)

### Community 12 - "dashboard/appointments/page.tsx"
Cohesion: 0.12
Nodes (22): Appointment, AppointmentConfirmation, AppointmentsPage(), BlockedSlot, buildCalendarWeeks(), formatDateLabel(), generateTimeSlotsForRange(), getAppointmentDateTime() (+14 more)

### Community 13 - "dashboard/qr-payments/page.tsx"
Cohesion: 0.10
Nodes (15): EMPTY_NEW_PRODUCT, FeedTransaction, formatTime(), QrPayCode, QrPaymentsPage(), QrProduct, ImageUrlUpload(), ImageUrlUploadProps (+7 more)

### Community 14 - "dashboard/availability/page.tsx"
Cohesion: 0.12
Nodes (18): Appointment, AvailabilityPage(), BlockedSlot, buildDefault(), CAL_HEADERS, DAY_LABELS, DaySchedule, DISPLAY_ORDER (+10 more)

### Community 15 - "dashboard/earnings/page.tsx"
Cohesion: 0.13
Nodes (18): EarningsPage(), EarningsTransaction, formatCurrency(), formatDate(), formatDateTime(), getPayoutStatusBadge(), getPayoutStatusLabel(), getPeriodStart() (+10 more)

### Community 16 - "database.ts"
Cohesion: 0.09
Nodes (22): Appointment, BlockedSlot, BookingConsultation, CompositeTypes, Constants, DatabaseWithoutInternals, DefaultSchema, Enums (+14 more)

### Community 17 - "PilatesTimetableManager.tsx"
Cohesion: 0.06
Nodes (32): CATEGORIES, MasterServiceRow, Service, ServiceInsert, ServicesPage(), ServiceSupplyResponse, ServiceWithConfig, PilatesStudioPage() (+24 more)

### Community 18 - "dashboard/inventory/page.tsx"
Cohesion: 0.29
Nodes (5): EditDraft, formatMoney(), getStockCount(), InventoryPage(), Product

### Community 19 - "MASTER FEATURES"
Cohesion: 0.06
Nodes (34): Aftercare Campaigns, Appointment Actions, Appointment List, Appointment Management, Blocked Slots, Booking Consultation Review, Business Settings, Calendar View (+26 more)

### Community 20 - "useModal"
Cohesion: 0.15
Nodes (13): dynamic, inter, metadata, playfair, revalidate, CONTENT_RESET_PREFIXES, EditToolbar(), ModalConfig (+5 more)

### Community 21 - "BusinessSettingsPanel.tsx"
Cohesion: 0.12
Nodes (13): BusinessSettings, BusinessSettingsPanel, BusinessSettingsPanelRef, CONFIRMATION_TIMING_OPTIONS, DEFAULT_SETTINGS, DEPOSIT_PERCENT_OPTIONS, getErrorMessage(), RESPONSE_TIMEOUT_OPTIONS (+5 more)

### Community 22 - "useAuth"
Cohesion: 0.06
Nodes (50): LoginPage(), mockPush, mockRefresh, mockSignIn, ChatPage(), Conversation, ConversationData, Message (+42 more)

### Community 23 - "test-panel.ts"
Cohesion: 0.15
Nodes (9): buildParams(), DEFAULT_SETTINGS, emailToId(), HighlightInfo, readSettings(), SeedResult, SeedSettings, TEST_ACCOUNTS (+1 more)

### Community 24 - "SectionContext.tsx"
Cohesion: 0.25
Nodes (7): DashboardShellProps, isValidSection(), Section, SectionContext, SectionContextValue, SectionProvider(), SECTIONS

### Community 25 - "dashboard/supplies/page.tsx"
Cohesion: 0.17
Nodes (11): COMMON_UNITS, ConsumptionLog, Draft, emptyDraft(), fmtDate(), fmtMoney(), getStockStatus(), ServiceLink (+3 more)

### Community 26 - "LandingPageClient.tsx"
Cohesion: 0.20
Nodes (10): BeautySection(), BeautySectionProps, LandingPageClientProps, PilatesSection(), PilatesSectionProps, SectionLanding(), SectionLandingProps, SectionId (+2 more)

### Community 27 - "ErrorBoundary"
Cohesion: 0.16
Nodes (5): ErrorBoundary, ErrorBoundaryProps, ErrorBoundaryState, hasStaleSupabaseSession(), isAuthRelatedError()

### Community 28 - "dashboard/checkout/page.tsx"
Cohesion: 0.18
Nodes (7): CheckoutPage(), CreateSessionResponse, getErrorMessage(), QrCheckoutFlow(), resolveQrCheckoutError(), fetchQrProduct(), QrCatalogProduct

### Community 29 - "dashboard/academy/learn/[courseId]/page.tsx"
Cohesion: 0.19
Nodes (9): Chapter, Course, formatDuration(), formatDurationShort(), HomeworkSubmission, LearnCoursePage(), Lesson, LessonProgress (+1 more)

### Community 30 - "dashboard/clients/[id]/page.tsx"
Cohesion: 0.14
Nodes (11): AddToBookingModal(), ClientInfo, MasterOption, ServiceOption, SessionOption, SlotOption, Tab, ClientDetailPage() (+3 more)

### Community 31 - "dashboard/orders/page.tsx"
Cohesion: 0.18
Nodes (8): ChatMessage, formatDate(), Order, OrderItem, OrdersPage(), SHIPPING_STATUS_OPTIONS, STATUS_OPTIONS, statusConfig

### Community 32 - "dashboard/passes/page.tsx"
Cohesion: 0.19
Nodes (9): BuyPackageForm(), formatExpiry(), ledgerLabel(), LedgerRow, PassesPage(), PassWithPackage, ClassPackage, CreditLedger (+1 more)

### Community 33 - "useEditMode"
Cohesion: 0.22
Nodes (10): EditableImage(), EditableImageProps, EditModeToggle(), Logo(), LogoProps, EditContext, EditContextType, EditProvider() (+2 more)

### Community 34 - "dashboard/consultations/page.tsx"
Cohesion: 0.22
Nodes (8): BookingConsultation, ConsultationResponse, ConsultationsPage(), describeError(), formatDate(), PhotoConsultation, ServiceOption, statusBadge()

### Community 35 - "dashboard/notifications/page.tsx"
Cohesion: 0.19
Nodes (8): AudienceFilter, ClientProfile, formatDateTime(), HistoryFilter, NotificationLogEntry, NotificationsContent(), NotificationsPage(), TabValue

### Community 36 - "useSection"
Cohesion: 0.23
Nodes (11): HeroBanner(), HeroBannerProps, QuickAction, QuickActions(), QuickActionsProps, StatsCards(), StatsCardsProps, ClientHome() (+3 more)

### Community 37 - "dashboard/academy/[courseId]/page.tsx"
Cohesion: 0.21
Nodes (7): Chapter, Course, CourseEditorPage(), formatDuration(), Lesson, OwnerTab, StudentRow

### Community 38 - "dashboard/support/page.tsx"
Cohesion: 0.20
Nodes (7): DEFAULT_FAQS, DEFAULT_SUPPORT, FAQ_CATEGORIES, FaqItem, SupportPage(), SupportSettings, TabValue

### Community 39 - "dashboard/discover/page.tsx"
Cohesion: 0.18
Nodes (8): ProfessionalCardProps, ProfessionalsGrid(), ProfessionalsGridProps, tagGradients, TrendingTags, TrendingTagsProps, DiscoverPage(), Master

### Community 40 - "safeStorage.ts"
Cohesion: 0.32
Nodes (10): safeGetItem(), safeGetJSON(), safeRemoveItem(), safeSessionGetItem(), safeSessionGetJSON(), safeSessionRemoveItem(), safeSessionSetItem(), safeSessionSetJSON() (+2 more)

### Community 41 - "CLIENT FEATURES"
Cohesion: 0.13
Nodes (15): Academy (Learning Platform), Authentication & Onboarding, CLIENT FEATURES, Communication, Consultation System, Course Discovery, Discover & Search, Home & Discovery (+7 more)

### Community 42 - "dashboard/loyalty/cards/page.tsx"
Cohesion: 0.24
Nodes (6): describeReward(), LoyaltyCard, LoyaltyCardsPage(), REWARD_TYPES, RewardType, STAMP_PRESETS

### Community 43 - "dashboard/vouchers/page.tsx"
Cohesion: 0.25
Nodes (6): daysLeft(), DISCOUNT_TYPES, discountLabel(), EMPTY_FORM, VouchersPage(), Voucher

### Community 44 - "useToast"
Cohesion: 0.16
Nodes (11): ActivityItem, AnalyticsPage(), formatRelative(), PilatesWaiverFormSheet(), PilatesWaiverFormSheetProps, TestComponent(), ToastContext, ToastContextType (+3 more)

### Community 45 - "dashboard/academy/homework/page.tsx"
Cohesion: 0.24
Nodes (5): FilterStatus, HomeworkInboxPage(), LessonData, RawSubmission, Submission

### Community 46 - "dashboard/academy/page.tsx"
Cohesion: 0.21
Nodes (7): AcademyPage(), ClientAcademyView(), Course, CourseRow, Enrollment, OwnerAcademyView(), RawCourseData

### Community 47 - "createClient"
Cohesion: 0.18
Nodes (7): ForgotPasswordPage(), VerifyForm(), AcademyStudentsPage(), CompletedLessonProgress, Lesson, StudentEnrollment, createClient()

### Community 48 - "dashboard/onboarding/page.tsx"
Cohesion: 0.28
Nodes (4): MasterOnboardingPage(), OnboardingStep, StepId, STEPS

### Community 49 - "PaymentMethodsManager.tsx"
Cohesion: 0.16
Nodes (13): CardBrandBadge(), getBrandDisplay(), PaymentMethodsManager(), PaymentMethodsManagerInner(), SavedCard, stripePromise, currentProfile, mockElements (+5 more)

### Community 50 - "dashboard/academy/qa/page.tsx"
Cohesion: 0.32
Nodes (3): QAInboxPage(), Question, Reply

### Community 51 - "EditableText.tsx"
Cohesion: 0.29
Nodes (5): EditableText(), EditableTextProps, Footer(), formatRelative(), MainNavbar()

### Community 52 - "dashboard/class-packages/page.tsx"
Cohesion: 0.36
Nodes (3): ClassPackagesPage(), EMPTY_FORM, formatPrice()

### Community 53 - "dashboard/clients/page.tsx"
Cohesion: 0.32
Nodes (3): ClientsDirectoryPage(), DirectoryProfile, RoleTab

### Community 54 - "SectionPageWrapper.tsx"
Cohesion: 0.14
Nodes (6): CartPage(), DebugPage(), DebugResults, LoyaltyQrPage(), SectionPageWrapper(), SectionPageWrapperProps

### Community 55 - "stripe.ts"
Cohesion: 0.38
Nodes (5): createAndConfirmPaymentIntent(), createSetupIntent(), PaymentIntentOptions, PaymentIntentResult, SetupIntentResult

### Community 57 - "dashboard/loyalty/scan/page.tsx"
Cohesion: 0.28
Nodes (6): Html5QrcodeModule, LoyaltyScanPage(), ScanResult, isUuid(), parseScanCode(), shouldDebounceScan()

### Community 58 - "proxy.test.ts"
Cohesion: 0.60
Nodes (3): config, proxy(), mockGetUser

### Community 59 - "benchmark_plimit.js"
Cohesion: 0.83
Nodes (3): performLimitedParallel(), performParallel(), run()

### Community 60 - "jest.config.js"
Cohesion: 0.50
Nodes (3): createJestConfig, customJestConfig, nextJest

### Community 73 - "OWNER (ADMIN) FEATURES"
Cohesion: 0.15
Nodes (13): Financial Management, Global Oversight / Platform Analytics, Master Management, OWNER (ADMIN) FEATURES, Owner Orders Management, Owner Supplies, Pilates Management, Platform Management (+5 more)

### Community 74 - "dashboard/masters/page.tsx"
Cohesion: 0.24
Nodes (7): Application, Master, MastersPage(), InstructorProfile, InstructorsPage(), validateEmail(), validateFullName()

### Community 75 - "Manual Validation Checklist"
Cohesion: 0.17
Nodes (11): 1. DeleteButton — Inventory, 2. DeleteButton — Vouchers, 3. DeleteButton — Orders, 4. DeleteButton — Appointments, 5. DeleteButton — Academy, 6. DeleteButton — Services, 7. DeleteButton — Supplies, 8. DeleteButton — Masters (+3 more)

### Community 76 - "register/__tests__/page.test.tsx"
Cohesion: 0.20
Nodes (8): fillValidForm(), mockCountries, mockPush, mockSearchParamsGet, mockSignUp, mockStates, renderRegister(), selectLocation()

### Community 77 - "CartContext.tsx"
Cohesion: 0.25
Nodes (9): CartCheckoutPage(), AddToCartProduct, CartContext, CartContextType, CartItem, CartProvider(), loadStoredItems(), TestComponent() (+1 more)

### Community 78 - "package.json"
Cohesion: 0.20
Nodes (9): name, private, scripts, build, dev, lint, start, test (+1 more)

### Community 79 - "Phase 14 — Payments, Notifications, Support (cross-cutting)"
Cohesion: 0.20
Nodes (10): Booking Payments ✅, Master Earnings + Stripe Connect ✅, Misc ✅, Owner Finance ✅, Payouts ✅, Phase 14 — Payments, Notifications, Support (cross-cutting), Push Notifications (full) ✅, Refunds ✅ (+2 more)

### Community 80 - "dashboard/masters/[id]/page.tsx"
Cohesion: 0.24
Nodes (5): DisplayService, MasterProfile, MasterPublicProfilePage(), MasterServiceRow, Portfolio

### Community 81 - "privacy-policy/page.tsx"
Cohesion: 0.31
Nodes (6): PrivacyPolicyPage(), TermsOfServicePage(), EditableLegalBody(), EditableLegalBodyProps, DEFAULT_PRIVACY_BODY, DEFAULT_TOS_BODY

### Community 82 - "DeleteButton.tsx"
Cohesion: 0.22
Nodes (7): DeleteButton(), DeleteButtonProps, mockDelete, mockDeleteEq, mockFrom, mockShowConfirm, mockShowToast

### Community 83 - "Owner customization (web)"
Cohesion: 0.22
Nodes (8): Adding a new editable string, Components, Guarantees under test, How an owner edits, Key namespaces, Owner customization (web), Semantics worth knowing, Where content lives

### Community 84 - "dashboard/shop/[id]/page.tsx"
Cohesion: 0.33
Nodes (4): isUuid(), normalizeProduct(), Product, ShopProductPage()

### Community 85 - "CartCheckoutForm"
Cohesion: 0.33
Nodes (7): CartCheckoutForm(), toCents(), EUROPEAN_COUNTRIES, EUROPEAN_COUNTRIES_SORTED, EuropeanCountry, getCountryName(), getShippingCost()

### Community 86 - "Push Notifications (All Roles)"
Cohesion: 0.29
Nodes (7): Appointment Reminders, Booking Notifications, Marketing, Messaging, No-Show & Late, Push Notifications (All Roles), Shop & Academy

### Community 87 - "Payment Processing (All Roles)"
Cohesion: 0.29
Nodes (7): Booking Payments, Payment Processing (All Roles), Payouts (Master/Owner), Refunds, Saved Payment Methods, Shop Payments, Stripe Integration

### Community 88 - "RootPortal.tsx"
Cohesion: 0.38
Nodes (4): LandingPage(), RootPortal(), RootPortalProps, SECTION_CARDS

### Community 89 - "CLAUDE.md"
Cohesion: 0.33
Nodes (4): 1. Think Before Coding, 2. Simplicity First, 3. Surgical Changes, 4. Goal-Driven Execution

### Community 90 - "Academy Management"
Cohesion: 0.33
Nodes (6): Academy Management, Course Management, Homework Review, Lesson Management, Lesson Q&A, Student Management

### Community 91 - "Merakí Web — Phased Implementation Plan"
Cohesion: 0.33
Nodes (5): Merakí Web — Phased Implementation Plan, Phase 1 — Discovery & Browse polish, Phase 3 — Master Schedule & Calendar ✅, Phase 4 — Master Service Management, Phase 9 — Portfolio & Master Profile

### Community 93 - "Merakí Web Platform - Development Stages"
Cohesion: 0.33
Nodes (5): Merakí Web Platform - Development Stages, Stage 1: Critical UI & Layout Fixes ✅, Stage 2: Page Redesigns & Polish (Current) 🟠, Stage 3: Core Functional Features 🟡, Stage 4: Advanced Integration & Security 🟢

### Community 94 - "CROSS-CUTTING FEATURES"
Cohesion: 0.40
Nodes (4): Account Management, Chat System (All Roles), CROSS-CUTTING FEATURES, Merakí Mobile → Web Feature Tracker

### Community 95 - "Appointments Management"
Cohesion: 0.40
Nodes (5): Appointment Actions, Appointment Confirmation System, Appointment List, Appointments Management, Financial Clarity

### Community 96 - "Shop (E-Commerce)"
Cohesion: 0.40
Nodes (5): Checkout, Order History, Product Browsing, Shop (E-Commerce), Shopping Cart

### Community 97 - "Loyalty Program"
Cohesion: 0.40
Nodes (5): Loyalty Program, NFC Scanning, QR Code Scanning, Rewards, Stamp Cards

### Community 98 - "Phase 12 — Academy (full) ✅"
Cohesion: 0.40
Nodes (5): Client — `/dashboard/academy` (browse + my courses) + `/dashboard/academy/learn/[courseId]`, Excluded (mobile-only features), Owner — `/dashboard/academy` (role-aware main page + sub-pages), Phase 12 — Academy (full) ✅, Web-only additions (not in mobile checklist)

### Community 99 - "Phase 5 — Master Business Settings ✅"
Cohesion: 0.40
Nodes (5): Confirmation, Deposit, No-Show Policy, Notifications + Aftercare, Phase 5 — Master Business Settings ✅

### Community 100 - "Phase 11 — Owner Shop & Orders"
Cohesion: 0.40
Nodes (5): Inventory Dashboard, Orders, Phase 11 — Owner Shop & Orders, Pricing, Products

### Community 101 - "MainNavbar.test.tsx"
Cohesion: 0.40
Nodes (4): mockMarkNotificationsSeen, mockPush, mockRefresh, mockSignOut

### Community 102 - "Payments & Financial"
Cohesion: 0.50
Nodes (4): Booking Payments, Payment History, Payment Methods, Payments & Financial

### Community 103 - "Shop Management"
Cohesion: 0.50
Nodes (4): Inventory Dashboard, Pricing, Product Management, Shop Management

### Community 104 - "Phase 6 — Consultations & Chat polish ✅"
Cohesion: 0.50
Nodes (4): Chat polish, Client, Master, Phase 6 — Consultations & Chat polish ✅

### Community 105 - "README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

### Community 107 - "Phase 7 — Loyalty Program (full)"
Cohesion: 0.67
Nodes (3): Client, Master, Phase 7 — Loyalty Program (full)

### Community 108 - "Phase 2 — Appointment lifecycle (client + master) ✅"
Cohesion: 0.67
Nodes (3): Client side, Master side, Phase 2 — Appointment lifecycle (client + master) ✅

### Community 109 - "Phase 8 — Inventory & Supplies ✅"
Cohesion: 0.67
Nodes (3): Master, Owner, Phase 8 — Inventory & Supplies ✅

### Community 110 - "Phase 10 — Owner Platform Management ✅"
Cohesion: 0.67
Nodes (3): Master Management, Phase 10 — Owner Platform Management ✅, Platform Analytics

### Community 111 - "Phase 13 — Service Catalog & Pilates (Owner) ✅"
Cohesion: 0.67
Nodes (3): Phase 13 — Service Catalog & Pilates (Owner) ✅, Pilates, Service Catalog

## Knowledge Gaps
- **593 isolated node(s):** `eslintConfig`, `nextJest`, `createJestConfig`, `customJestConfig`, `nextConfig` (+588 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `useAuth` to `MainNavbar.tsx`, `dashboard/shop/page.tsx`, `dashboard/loyalty/page.tsx`, `locationApi.ts`, `dashboard/booking/page.tsx`, `dashboard/settings/page.tsx`, `CustomizeDrawer.tsx`, `dashboard/finance/page.tsx`, `dashboard/appointments/page.tsx`, `dashboard/qr-payments/page.tsx`, `dashboard/availability/page.tsx`, `dashboard/earnings/page.tsx`, `PilatesTimetableManager.tsx`, `dashboard/inventory/page.tsx`, `BusinessSettingsPanel.tsx`, `dashboard/supplies/page.tsx`, `dashboard/checkout/page.tsx`, `dashboard/academy/learn/[courseId]/page.tsx`, `dashboard/clients/[id]/page.tsx`, `dashboard/orders/page.tsx`, `dashboard/passes/page.tsx`, `useEditMode`, `dashboard/consultations/page.tsx`, `dashboard/notifications/page.tsx`, `useSection`, `dashboard/academy/[courseId]/page.tsx`, `dashboard/support/page.tsx`, `dashboard/discover/page.tsx`, `dashboard/loyalty/cards/page.tsx`, `dashboard/vouchers/page.tsx`, `useToast`, `dashboard/academy/homework/page.tsx`, `dashboard/academy/page.tsx`, `createClient`, `dashboard/onboarding/page.tsx`, `PaymentMethodsManager.tsx`, `dashboard/academy/qa/page.tsx`, `EditableText.tsx`, `dashboard/class-packages/page.tsx`, `dashboard/clients/page.tsx`, `SectionPageWrapper.tsx`, `dashboard/loyalty/scan/page.tsx`, `dashboard/masters/page.tsx`, `register/__tests__/page.test.tsx`, `CartContext.tsx`, `dashboard/masters/[id]/page.tsx`, `DeleteButton.tsx`, `dashboard/shop/[id]/page.tsx`, `CartCheckoutForm`, `MainNavbar.test.tsx`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **Why does `createClient()` connect `createClient` to `MainNavbar.tsx`, `dashboard/shop/page.tsx`, `dashboard/loyalty/page.tsx`, `locationApi.ts`, `dashboard/booking/page.tsx`, `dashboard/settings/page.tsx`, `CustomizeDrawer.tsx`, `dashboard/finance/page.tsx`, `dashboard/appointments/page.tsx`, `dashboard/qr-payments/page.tsx`, `dashboard/availability/page.tsx`, `dashboard/earnings/page.tsx`, `PilatesTimetableManager.tsx`, `dashboard/inventory/page.tsx`, `BusinessSettingsPanel.tsx`, `useAuth`, `dashboard/supplies/page.tsx`, `dashboard/checkout/page.tsx`, `dashboard/academy/learn/[courseId]/page.tsx`, `dashboard/clients/[id]/page.tsx`, `dashboard/orders/page.tsx`, `dashboard/passes/page.tsx`, `useEditMode`, `dashboard/consultations/page.tsx`, `dashboard/notifications/page.tsx`, `useSection`, `dashboard/academy/[courseId]/page.tsx`, `dashboard/support/page.tsx`, `dashboard/discover/page.tsx`, `dashboard/loyalty/cards/page.tsx`, `dashboard/vouchers/page.tsx`, `useToast`, `dashboard/academy/homework/page.tsx`, `dashboard/academy/page.tsx`, `dashboard/onboarding/page.tsx`, `PaymentMethodsManager.tsx`, `dashboard/academy/qa/page.tsx`, `dashboard/clients/page.tsx`, `SectionPageWrapper.tsx`, `dashboard/loyalty/scan/page.tsx`, `dashboard/masters/page.tsx`, `register/__tests__/page.test.tsx`, `dashboard/masters/[id]/page.tsx`, `DeleteButton.tsx`, `dashboard/shop/[id]/page.tsx`, `CartCheckoutForm`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **Why does `useToast()` connect `useToast` to `dashboard/shop/page.tsx`, `dashboard/loyalty/page.tsx`, `dashboard/settings/page.tsx`, `CustomizeDrawer.tsx`, `dashboard/finance/page.tsx`, `dashboard/qr-payments/page.tsx`, `dashboard/availability/page.tsx`, `dashboard/earnings/page.tsx`, `PilatesTimetableManager.tsx`, `dashboard/inventory/page.tsx`, `useModal`, `BusinessSettingsPanel.tsx`, `useAuth`, `dashboard/supplies/page.tsx`, `dashboard/checkout/page.tsx`, `dashboard/academy/learn/[courseId]/page.tsx`, `dashboard/clients/[id]/page.tsx`, `dashboard/orders/page.tsx`, `dashboard/passes/page.tsx`, `dashboard/consultations/page.tsx`, `dashboard/notifications/page.tsx`, `dashboard/academy/[courseId]/page.tsx`, `dashboard/support/page.tsx`, `dashboard/discover/page.tsx`, `dashboard/loyalty/cards/page.tsx`, `dashboard/vouchers/page.tsx`, `dashboard/academy/homework/page.tsx`, `dashboard/academy/page.tsx`, `createClient`, `dashboard/onboarding/page.tsx`, `PaymentMethodsManager.tsx`, `dashboard/academy/qa/page.tsx`, `dashboard/class-packages/page.tsx`, `dashboard/clients/page.tsx`, `dashboard/loyalty/scan/page.tsx`, `dashboard/masters/page.tsx`, `dashboard/masters/[id]/page.tsx`, `DeleteButton.tsx`, `dashboard/shop/[id]/page.tsx`, `CartCheckoutForm`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextJest`, `createJestConfig` to the rest of the system?**
  _593 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `createClient` be split into smaller, more focused modules?**
  _Cohesion score 0.07767722473604827 - nodes in this community are weakly interconnected._
- **Should `locationApi.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1076923076923077 - nodes in this community are weakly interconnected._
- **Should `dashboard/booking/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07641196013289037 - nodes in this community are weakly interconnected._