# Graph Report - meraki-WEB  (2026-08-30)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1277 nodes · 2907 edges · 74 communities (68 shown, 6 thin omitted)
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
- createClient
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
- DeleteButton.tsx
- StaffDashboard.tsx
- useModal
- BusinessSettingsPanel.tsx
- AuthContext.tsx
- test-panel.ts
- SectionContext.tsx
- dashboard/supplies/page.tsx
- dashboard/services/page.tsx
- ErrorBoundary
- dashboard/checkout/page.tsx
- dashboard/academy/learn/[courseId]/page.tsx
- SectionPageWrapper
- dashboard/orders/page.tsx
- dashboard/passes/page.tsx
- useAutoLocation.ts
- dashboard/consultations/page.tsx
- dashboard/notifications/page.tsx
- app/dashboard/page.tsx
- dashboard/academy/[courseId]/page.tsx
- dashboard/support/page.tsx
- dashboard/discover/page.tsx
- safeStorage.ts
- dashboard/chat/page.tsx
- dashboard/loyalty/cards/page.tsx
- dashboard/vouchers/page.tsx
- useToast
- dashboard/academy/homework/page.tsx
- useSection
- dashboard/academy/students/page.tsx
- dashboard/onboarding/page.tsx
- useAuth
- dashboard/academy/qa/page.tsx
- dashboard/analytics/page.tsx
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
- dashboard/services/pilates/[id]/page.tsx

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
- `ClientView()` --calls--> `useSection()`  [EXTRACTED]
  src/app/dashboard/loyalty/page.tsx → src/contexts/SectionContext.tsx
- `MasterView()` --calls--> `useSection()`  [EXTRACTED]
  src/app/dashboard/loyalty/page.tsx → src/contexts/SectionContext.tsx
- `DashboardPage()` --calls--> `useAuth()`  [EXTRACTED]
  src/app/dashboard/page.tsx → src/contexts/AuthContext.tsx
- `TestComponent()` --calls--> `useAuth()`  [EXTRACTED]
  src/contexts/AuthContext.test.tsx → src/contexts/AuthContext.tsx
- `renderRegister()` --indirect_call--> `getAllCountries()`  [INFERRED]
  src/app/(auth)/register/__tests__/page.test.tsx → src/lib/locationApi.ts

## Import Cycles
- None detected.

## Communities (74 total, 6 thin omitted)

### Community 0 - "MainNavbar.tsx"
Cohesion: 0.05
Nodes (48): BeautySection(), BeautySectionProps, EditableImage(), EditableImageProps, EditableLegalBody(), EditableLegalBodyProps, EditableText(), EditableTextProps (+40 more)

### Community 1 - "dashboard/shop/page.tsx"
Cohesion: 0.08
Nodes (23): CartPage(), CartCheckoutPage(), isUuid(), normalizeProduct(), Product, ShopProductPage(), Product, ShopPage() (+15 more)

### Community 2 - "dashboard/loyalty/page.tsx"
Cohesion: 0.17
Nodes (12): StampCardsList(), StampCardsListProps, UserRewards(), UserRewardsProps, ClientView(), formatRewardValue(), LoyaltyPage(), MasterView() (+4 more)

### Community 3 - "createClient"
Cohesion: 0.07
Nodes (37): GET(), PATCH(), POST(), requireOwner(), DELETE(), GET(), getCaller(), PATCH() (+29 more)

### Community 4 - "locationApi.ts"
Cohesion: 0.08
Nodes (40): fillValidForm(), mockCountries, mockPush, mockSearchParamsGet, mockSignUp, mockStates, renderRegister(), selectLocation() (+32 more)

### Community 5 - "dashboard/booking/page.tsx"
Cohesion: 0.07
Nodes (37): BlockedSlot, BookingDraft, BookingError, BookingPage(), BookingUser, buildCalendarWeeks(), CheckoutForm(), CheckoutFormProps (+29 more)

### Community 6 - "createClient"
Cohesion: 0.07
Nodes (39): ForgotPasswordPage(), FieldErrors, RegisterPage(), VerifyForm(), DisplayService, MasterProfile, MasterPublicProfilePage(), MasterServiceRow (+31 more)

### Community 7 - "CustomizeDrawer.tsx"
Cohesion: 0.07
Nodes (35): ALL_TEXT_FIELDS, ALL_TEXT_GROUPS, COLOR_FIELDS, ColorField, CustomizeDrawer(), CustomizeDrawerProps, IMAGE_FIELDS, ImageField (+27 more)

### Community 8 - "dependencies"
Cohesion: 0.05
Nodes (38): browser-image-compression, dotenv, emoji-picker-react, lucide-react, next, dependencies, browser-image-compression, dotenv (+30 more)

### Community 9 - "devDependencies"
Cohesion: 0.06
Nodes (37): eslint, eslint-config-next, jest-environment-jsdom, devDependencies, eslint, eslint-config-next, jest, jest-environment-jsdom (+29 more)

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
Cohesion: 0.11
Nodes (19): DAYS, defaultSettings, endDate(), HostProfile, isoPlusDays(), LEVELS, PilatesBooking, PilatesHost (+11 more)

### Community 18 - "DeleteButton.tsx"
Cohesion: 0.13
Nodes (12): EditDraft, formatMoney(), getStockCount(), InventoryPage(), Product, DeleteButton(), DeleteButtonProps, mockDelete (+4 more)

### Community 19 - "StaffDashboard.tsx"
Cohesion: 0.25
Nodes (8): ClientHome(), ApptRow, formatCurrency(), greeting(), StaffDashboard(), Stats, TestComponent(), useNotifications()

### Community 20 - "useModal"
Cohesion: 0.15
Nodes (14): dynamic, inter, metadata, playfair, revalidate, CONTENT_RESET_PREFIXES, EditToolbar(), ModalConfig (+6 more)

### Community 21 - "BusinessSettingsPanel.tsx"
Cohesion: 0.12
Nodes (13): BusinessSettings, BusinessSettingsPanel, BusinessSettingsPanelRef, CONFIRMATION_TIMING_OPTIONS, DEFAULT_SETTINGS, DEPOSIT_PERCENT_OPTIONS, getErrorMessage(), RESPONSE_TIMEOUT_OPTIONS (+5 more)

### Community 22 - "AuthContext.tsx"
Cohesion: 0.07
Nodes (25): LoginPage(), mockPush, mockRefresh, mockSignIn, AddToBookingModal(), ClientInfo, MasterOption, ServiceOption (+17 more)

### Community 23 - "test-panel.ts"
Cohesion: 0.15
Nodes (9): buildParams(), DEFAULT_SETTINGS, emailToId(), HighlightInfo, readSettings(), SeedResult, SeedSettings, TEST_ACCOUNTS (+1 more)

### Community 24 - "SectionContext.tsx"
Cohesion: 0.25
Nodes (7): DashboardShellProps, isValidSection(), Section, SectionContext, SectionContextValue, SectionProvider(), SECTIONS

### Community 25 - "dashboard/supplies/page.tsx"
Cohesion: 0.17
Nodes (11): COMMON_UNITS, ConsumptionLog, Draft, emptyDraft(), fmtDate(), fmtMoney(), getStockStatus(), ServiceLink (+3 more)

### Community 26 - "dashboard/services/page.tsx"
Cohesion: 0.17
Nodes (10): CATEGORIES, MasterServiceRow, Service, ServiceInsert, ServicesPage(), ServiceSupplyResponse, ServiceWithConfig, validatePrice() (+2 more)

### Community 27 - "ErrorBoundary"
Cohesion: 0.16
Nodes (5): ErrorBoundary, ErrorBoundaryProps, ErrorBoundaryState, hasStaleSupabaseSession(), isAuthRelatedError()

### Community 28 - "dashboard/checkout/page.tsx"
Cohesion: 0.08
Nodes (27): CartCheckoutForm(), CheckoutPage(), CreateSessionResponse, getErrorMessage(), QrCheckoutFlow(), resolveQrCheckoutError(), toCents(), CardBrandBadge() (+19 more)

### Community 29 - "dashboard/academy/learn/[courseId]/page.tsx"
Cohesion: 0.19
Nodes (9): Chapter, Course, formatDuration(), formatDurationShort(), HomeworkSubmission, LearnCoursePage(), Lesson, LessonProgress (+1 more)

### Community 31 - "dashboard/orders/page.tsx"
Cohesion: 0.18
Nodes (8): ChatMessage, formatDate(), Order, OrderItem, OrdersPage(), SHIPPING_STATUS_OPTIONS, STATUS_OPTIONS, statusConfig

### Community 32 - "dashboard/passes/page.tsx"
Cohesion: 0.19
Nodes (9): BuyPackageForm(), formatExpiry(), ledgerLabel(), LedgerRow, PassesPage(), PassWithPackage, ClassPackage, CreditLedger (+1 more)

### Community 33 - "useAutoLocation.ts"
Cohesion: 0.33
Nodes (7): supabase, detectUserLocation(), getCurrentPosition(), haversineDistanceKm(), isMasterWithinRange(), reverseGeocodeCountry(), UserLocation

### Community 34 - "dashboard/consultations/page.tsx"
Cohesion: 0.22
Nodes (8): BookingConsultation, ConsultationResponse, ConsultationsPage(), describeError(), formatDate(), PhotoConsultation, ServiceOption, statusBadge()

### Community 35 - "dashboard/notifications/page.tsx"
Cohesion: 0.19
Nodes (8): AudienceFilter, ClientProfile, formatDateTime(), HistoryFilter, NotificationLogEntry, NotificationsContent(), NotificationsPage(), TabValue

### Community 36 - "app/dashboard/page.tsx"
Cohesion: 0.22
Nodes (9): HeroBanner(), HeroBannerProps, QuickAction, QuickActions(), QuickActionsProps, StatsCards(), StatsCardsProps, DashboardAppointment (+1 more)

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

### Community 41 - "dashboard/chat/page.tsx"
Cohesion: 0.22
Nodes (6): ChatPage(), Conversation, ConversationData, Message, MessageData, ProfileData

### Community 42 - "dashboard/loyalty/cards/page.tsx"
Cohesion: 0.24
Nodes (6): describeReward(), LoyaltyCard, LoyaltyCardsPage(), REWARD_TYPES, RewardType, STAMP_PRESETS

### Community 43 - "dashboard/vouchers/page.tsx"
Cohesion: 0.25
Nodes (6): daysLeft(), DISCOUNT_TYPES, discountLabel(), EMPTY_FORM, VouchersPage(), Voucher

### Community 44 - "useToast"
Cohesion: 0.25
Nodes (8): WaiverRow, WaiversPage(), TestComponent(), ToastContext, ToastContextType, ToastMessage, ToastType, useToast()

### Community 45 - "dashboard/academy/homework/page.tsx"
Cohesion: 0.24
Nodes (5): FilterStatus, HomeworkInboxPage(), LessonData, RawSubmission, Submission

### Community 46 - "useSection"
Cohesion: 0.21
Nodes (8): AcademyPage(), ClientAcademyView(), Course, CourseRow, Enrollment, OwnerAcademyView(), RawCourseData, useSection()

### Community 47 - "dashboard/academy/students/page.tsx"
Cohesion: 0.28
Nodes (4): AcademyStudentsPage(), CompletedLessonProgress, Lesson, StudentEnrollment

### Community 48 - "dashboard/onboarding/page.tsx"
Cohesion: 0.28
Nodes (4): MasterOnboardingPage(), OnboardingStep, StepId, STEPS

### Community 49 - "useAuth"
Cohesion: 0.23
Nodes (12): DashboardLayout(), DashboardShell(), ToastProvider(), useAuth(), FALLBACK, NotificationItem, NotificationsContext, NotificationsContextValue (+4 more)

### Community 50 - "dashboard/academy/qa/page.tsx"
Cohesion: 0.32
Nodes (3): QAInboxPage(), Question, Reply

### Community 51 - "dashboard/analytics/page.tsx"
Cohesion: 0.36
Nodes (3): ActivityItem, AnalyticsPage(), formatRelative()

### Community 52 - "dashboard/class-packages/page.tsx"
Cohesion: 0.36
Nodes (3): ClassPackagesPage(), EMPTY_FORM, formatPrice()

### Community 53 - "dashboard/clients/page.tsx"
Cohesion: 0.32
Nodes (3): ClientsDirectoryPage(), DirectoryProfile, RoleTab

### Community 54 - "SectionPageWrapper.tsx"
Cohesion: 0.31
Nodes (3): DebugPage(), DebugResults, SectionPageWrapperProps

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

### Community 73 - "dashboard/services/pilates/[id]/page.tsx"
Cohesion: 0.32
Nodes (3): PilatesStudioPage(), Service, Tables

## Knowledge Gaps
- **438 isolated node(s):** `BeautySectionProps`, `EditableImageProps`, `EditableLegalBodyProps`, `EditableTextProps`, `LandingPageClientProps` (+433 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `useAuth` to `MainNavbar.tsx`, `dashboard/shop/page.tsx`, `dashboard/loyalty/page.tsx`, `locationApi.ts`, `dashboard/booking/page.tsx`, `createClient`, `CustomizeDrawer.tsx`, `dashboard/finance/page.tsx`, `dashboard/appointments/page.tsx`, `dashboard/qr-payments/page.tsx`, `dashboard/availability/page.tsx`, `dashboard/earnings/page.tsx`, `PilatesTimetableManager.tsx`, `DeleteButton.tsx`, `StaffDashboard.tsx`, `BusinessSettingsPanel.tsx`, `AuthContext.tsx`, `dashboard/supplies/page.tsx`, `dashboard/services/page.tsx`, `dashboard/checkout/page.tsx`, `dashboard/academy/learn/[courseId]/page.tsx`, `SectionPageWrapper`, `dashboard/orders/page.tsx`, `dashboard/passes/page.tsx`, `useAutoLocation.ts`, `dashboard/consultations/page.tsx`, `dashboard/notifications/page.tsx`, `app/dashboard/page.tsx`, `dashboard/academy/[courseId]/page.tsx`, `dashboard/support/page.tsx`, `dashboard/discover/page.tsx`, `dashboard/chat/page.tsx`, `dashboard/loyalty/cards/page.tsx`, `dashboard/vouchers/page.tsx`, `useToast`, `dashboard/academy/homework/page.tsx`, `useSection`, `dashboard/academy/students/page.tsx`, `dashboard/onboarding/page.tsx`, `dashboard/academy/qa/page.tsx`, `dashboard/analytics/page.tsx`, `dashboard/class-packages/page.tsx`, `dashboard/clients/page.tsx`, `dashboard/loyalty/scan/page.tsx`, `dashboard/services/pilates/[id]/page.tsx`?**
  _High betweenness centrality (0.136) - this node is a cross-community bridge._
- **Why does `createClient()` connect `createClient` to `MainNavbar.tsx`, `dashboard/shop/page.tsx`, `dashboard/loyalty/page.tsx`, `locationApi.ts`, `dashboard/booking/page.tsx`, `CustomizeDrawer.tsx`, `dashboard/finance/page.tsx`, `dashboard/appointments/page.tsx`, `dashboard/qr-payments/page.tsx`, `dashboard/availability/page.tsx`, `dashboard/earnings/page.tsx`, `PilatesTimetableManager.tsx`, `DeleteButton.tsx`, `StaffDashboard.tsx`, `BusinessSettingsPanel.tsx`, `AuthContext.tsx`, `dashboard/supplies/page.tsx`, `dashboard/services/page.tsx`, `dashboard/checkout/page.tsx`, `dashboard/academy/learn/[courseId]/page.tsx`, `dashboard/orders/page.tsx`, `dashboard/passes/page.tsx`, `useAutoLocation.ts`, `dashboard/consultations/page.tsx`, `dashboard/notifications/page.tsx`, `app/dashboard/page.tsx`, `dashboard/academy/[courseId]/page.tsx`, `dashboard/support/page.tsx`, `dashboard/discover/page.tsx`, `dashboard/chat/page.tsx`, `dashboard/loyalty/cards/page.tsx`, `dashboard/vouchers/page.tsx`, `useToast`, `dashboard/academy/homework/page.tsx`, `useSection`, `dashboard/academy/students/page.tsx`, `dashboard/onboarding/page.tsx`, `useAuth`, `dashboard/academy/qa/page.tsx`, `dashboard/analytics/page.tsx`, `dashboard/clients/page.tsx`, `SectionPageWrapper.tsx`, `dashboard/loyalty/scan/page.tsx`, `dashboard/services/pilates/[id]/page.tsx`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **Why does `useToast()` connect `useToast` to `dashboard/shop/page.tsx`, `dashboard/loyalty/page.tsx`, `dashboard/booking/page.tsx`, `createClient`, `CustomizeDrawer.tsx`, `dashboard/finance/page.tsx`, `dashboard/qr-payments/page.tsx`, `dashboard/availability/page.tsx`, `dashboard/earnings/page.tsx`, `PilatesTimetableManager.tsx`, `DeleteButton.tsx`, `useModal`, `BusinessSettingsPanel.tsx`, `AuthContext.tsx`, `dashboard/supplies/page.tsx`, `dashboard/services/page.tsx`, `dashboard/checkout/page.tsx`, `dashboard/academy/learn/[courseId]/page.tsx`, `dashboard/orders/page.tsx`, `dashboard/passes/page.tsx`, `dashboard/consultations/page.tsx`, `dashboard/notifications/page.tsx`, `dashboard/academy/[courseId]/page.tsx`, `dashboard/support/page.tsx`, `dashboard/discover/page.tsx`, `dashboard/chat/page.tsx`, `dashboard/loyalty/cards/page.tsx`, `dashboard/vouchers/page.tsx`, `dashboard/academy/homework/page.tsx`, `useSection`, `dashboard/academy/students/page.tsx`, `dashboard/onboarding/page.tsx`, `dashboard/academy/qa/page.tsx`, `dashboard/analytics/page.tsx`, `dashboard/class-packages/page.tsx`, `dashboard/clients/page.tsx`, `dashboard/loyalty/scan/page.tsx`, `dashboard/services/pilates/[id]/page.tsx`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **What connects `BeautySectionProps`, `EditableImageProps`, `EditableLegalBodyProps` to the rest of the system?**
  _438 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `MainNavbar.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.052507836990595615 - nodes in this community are weakly interconnected._
- **Should `dashboard/shop/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07822410147991543 - nodes in this community are weakly interconnected._
- **Should `createClient` be split into smaller, more focused modules?**
  _Cohesion score 0.07077922077922078 - nodes in this community are weakly interconnected._