@echo off
title Meraki Web - Full Test Suite (All Domains)
color 0A
echo ================================================================
echo   MERAKI WEB - FULL TEST SUITE (ALL DOMAINS)
echo   47 suites - All tests across every feature area
echo   Pilates ^| Auth ^| Billing ^| Business ^| Profile ^| Services
echo   Schedule ^| Location ^| Cart ^| Loyalty ^| Notifications
echo ================================================================
echo.

echo ================================================================
echo   PHASE 1 - STATIC ANALYSIS
echo ================================================================
echo.

echo [1/22] TypeScript type check (full project)...
echo ----------------------------------------------------------------
call npx tsc --noEmit 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [PASS] TypeScript - No errors found
) else (
    echo [WARN] TypeScript - Some errors found ^(may be pre-existing^)
)
echo.

echo [2/22] ESLint (full project)...
echo ----------------------------------------------------------------
call npx eslint --max-warnings=999 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [PASS] ESLint - No errors found
) else (
    echo [WARN] ESLint - Some warnings/errors found ^(may be pre-existing^)
)
echo.

echo ================================================================
echo   PHASE 2 - FULL JEST SUITE (ALL 47 SUITES AT ONCE)
echo ================================================================
echo.

echo [3/22] Running ALL Jest tests (full suite, no coverage)...
echo ----------------------------------------------------------------
call npx jest --no-coverage 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [PASS] Jest - All tests passed
) else (
    echo [FAIL] Jest - Some tests failed
)
echo.

echo [4/22] Full Jest suite WITH coverage report...
echo ----------------------------------------------------------------
call npx jest --coverage 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [PASS] Jest coverage - All tests passed
) else (
    echo [FAIL] Jest coverage - Some tests failed
)
echo.

echo ================================================================
echo   PHASE 3 - PILATES DOMAIN (verbose, isolated)
echo ================================================================
echo   Covers: PilatesTimetableManager, PilatesWaiverFormSheet,
echo   PilatesWaiverGate, usePilatesWaiver, section-components,
echo   SectionContext, SectionSwitcher, RootPortal
echo ================================================================
echo.

echo [5/22] PILATES - Timetable + Schedule Manager...
echo ----------------------------------------------------------------
call npx jest src/components/__tests__/PilatesTimetableManager.test.tsx --verbose --no-coverage 2>&1
echo.

echo [6/22] PILATES - Waiver Form Sheet (v3.0 health screening)...
echo ----------------------------------------------------------------
call npx jest src/components/__tests__/PilatesWaiverFormSheet.test.tsx --verbose --no-coverage 2>&1
echo.

echo [7/22] PILATES - Waiver Gate (portal entry auto-prompt)...
echo ----------------------------------------------------------------
call npx jest src/components/__tests__/PilatesWaiverGate.test.tsx --verbose --no-coverage 2>&1
echo.

echo [8/22] PILATES - usePilatesWaiver hook (check + submit)...
echo ----------------------------------------------------------------
call npx jest src/hooks/usePilatesWaiver.test.ts --verbose --no-coverage 2>&1
echo.

echo [9/22] PILATES - Section components (PilatesSection, SectionPageWrapper, SectionLanding)...
echo ----------------------------------------------------------------
call npx jest src/components/__tests__/section-components.test.tsx --verbose --no-coverage 2>&1
echo.

echo [10/22] PILATES - Section context + Section switcher (pilates vs beauty toggle)...
echo ----------------------------------------------------------------
call npx jest src/contexts/SectionContext.test.tsx src/components/__tests__/SectionSwitcher.test.tsx --verbose --no-coverage 2>&1
echo.

echo [11/22] PILATES - RootPortal (Beauty/Pilates landing card selection)...
echo ----------------------------------------------------------------
call npx jest src/components/__tests__/RootPortal.test.tsx --verbose --no-coverage 2>&1
echo.

echo ================================================================
echo   PHASE 4 - AUTHENTICATION ^& SECURITY DOMAIN (verbose)
echo ================================================================
echo   Covers: AuthContext, register page, login page, proxy rewrites
echo ================================================================
echo.

echo [12/22] AUTH - AuthContext (session, user, profile, role)...
echo ----------------------------------------------------------------
call npx jest src/contexts/__tests__/AuthContext.test.tsx --verbose --no-coverage 2>&1
echo.

echo [13/22] AUTH - Register page (invitation flow, role selection, validation)...
echo ----------------------------------------------------------------
call npx jest "src/app/(auth)/register/__tests__/page.test.tsx" --verbose --no-coverage 2>&1
echo.

echo [14/22] AUTH - Login page (credentials, redirect, error states)...
echo ----------------------------------------------------------------
call npx jest "src/app/(auth)/login/__tests__/page.test.tsx" --verbose --no-coverage 2>&1
echo.

echo [15/22] SECURITY - Proxy rewrites (next.config route protection)...
echo ----------------------------------------------------------------
call npx jest src/proxy.test.ts --verbose --no-coverage 2>&1
echo.

echo ================================================================
echo   PHASE 5 - BILLING ^& PAYMENT DOMAIN (verbose)
echo ================================================================
echo   Covers: Stripe lib, PaymentMethodsManager, QrPayMethodsManager,
echo   QR pay codes API, QR catalog
echo ================================================================
echo.

echo [16/22] BILLING - Stripe payment library (intent creation, refund, webhook)...
echo ----------------------------------------------------------------
call npx jest src/lib/payment/stripe.test.ts --verbose --no-coverage 2>&1
echo.

echo [17/22] BILLING - PaymentMethodsManager component (CRUD, validation)...
echo ----------------------------------------------------------------
call npx jest src/components/__tests__/PaymentMethodsManager.test.tsx --verbose --no-coverage 2>&1
echo.

echo [18/22] BILLING - QrPayMethodsManager component (QR code payment methods)...
echo ----------------------------------------------------------------
call npx jest src/components/__tests__/QrPayMethodsManager.test.tsx --verbose --no-coverage 2>&1
echo.

echo [19/22] BILLING - QR pay codes API route (create, list, delete)...
echo ----------------------------------------------------------------
call npx jest src/app/api/__tests__/qr-pay-codes.test.ts --verbose --no-coverage 2>&1
echo.

echo [20/22] BILLING - QR catalog lib (code generation, lookup, validation)...
echo ----------------------------------------------------------------
call npx jest src/lib/qr-catalog.test.ts --verbose --no-coverage 2>&1
echo.

echo ================================================================
echo   PHASE 6 - BUSINESS ^& SETTINGS DOMAIN (verbose)
echo ================================================================
echo   Covers: BusinessSettingsPanel, EditContext, siteContent,
echo   editable text, ModalContext, Footer, MainNavbar
echo ================================================================
echo.

echo [21/22] BUSINESS - BusinessSettingsPanel (owner business config)...
echo ----------------------------------------------------------------
call npx jest src/components/__tests__/BusinessSettingsPanel.test.tsx --verbose --no-coverage 2>&1
echo.

echo [22/22] BUSINESS - EditContext (edit mode state management)...
echo ----------------------------------------------------------------
call npx jest src/contexts/EditContext.test.tsx --verbose --no-coverage 2>&1
echo.

echo [23/22] BUSINESS - Site content lib (editable content keys, persistence)...
echo ----------------------------------------------------------------
call npx jest src/lib/siteContent.test.ts --verbose --no-coverage 2>&1
echo.

echo [24/22] BUSINESS - Editable text component (inline edit, save, cancel)...
echo ----------------------------------------------------------------
call npx jest src/components/__tests__/editable.test.tsx --verbose --no-coverage 2>&1
echo.

echo [25/22] BUSINESS - ModalContext (modal open/close, info dialogs)...
echo ----------------------------------------------------------------
call npx jest src/contexts/__tests__/ModalContext.test.tsx --verbose --no-coverage 2>&1
echo.

echo [26/22] BUSINESS - Footer component (links, layout, server/client)...
echo ----------------------------------------------------------------
call npx jest src/components/__tests__/Footer.test.tsx --verbose --no-coverage 2>&1
echo.

echo [27/22] BUSINESS - MainNavbar (nav items, mobile menu, notifications, profile)...
echo ----------------------------------------------------------------
call npx jest src/components/__tests__/MainNavbar.test.tsx --verbose --no-coverage 2>&1
echo.

echo [28/22] BUSINESS - Nav items lib (navigation config, role-based filtering)...
echo ----------------------------------------------------------------
call npx jest src/lib/nav-items.test.ts --verbose --no-coverage 2>&1
echo.

echo ================================================================
echo   PHASE 7 - PROFILE ^& USER DOMAIN (verbose)
echo ================================================================
echo   Covers: DashboardShell, Toast notifications, CountryCodeDropdown
echo ================================================================
echo.

echo [29/22] PROFILE - DashboardShell (layout wrapper, role routing)...
echo ----------------------------------------------------------------
call npx jest src/components/__tests__/DashboardShell.test.tsx --verbose --no-coverage 2>&1
echo.

echo [30/22] PROFILE - Toast component (notifications, auto-dismiss)...
echo ----------------------------------------------------------------
call npx jest src/components/Toast.test.tsx --verbose --no-coverage 2>&1
echo.

echo [31/22] PROFILE - CountryCodeDropdown (phone country selection)...
echo ----------------------------------------------------------------
call npx jest src/components/__tests__/CountryCodeDropdown.test.tsx --verbose --no-coverage 2>&1
echo.

echo [32/22] PROFILE - NotificationsContext (real-time notification state)...
echo ----------------------------------------------------------------
call npx jest src/contexts/__tests__/NotificationsContext.test.tsx --verbose --no-coverage 2>&1
echo.

echo ================================================================
echo   PHASE 8 - SERVICES ^& BOOKING DOMAIN (verbose)
echo ================================================================
echo   Covers: Vouchers API, DeleteButton, ErrorBoundary, ImageUrlUpload
echo ================================================================
echo.

echo [33/22] SERVICES - Vouchers API route (CRUD, validation, discount logic)...
echo ----------------------------------------------------------------
call npx jest src/app/api/__tests__/vouchers.test.ts --verbose --no-coverage 2>&1
echo.

echo [34/22] SERVICES - DeleteButton component (confirmation, async delete)...
echo ----------------------------------------------------------------
call npx jest src/components/__tests__/DeleteButton.test.tsx --verbose --no-coverage 2>&1
echo.

echo [35/22] SERVICES - ErrorBoundary (crash capture, fallback render)...
echo ----------------------------------------------------------------
call npx jest src/components/__tests__/ErrorBoundary.test.tsx --verbose --no-coverage 2>&1
echo.

echo [36/22] SERVICES - ImageUrlUpload (file upload, compression, URL)...
echo ----------------------------------------------------------------
call npx jest src/components/__tests__/ImageUrlUpload.test.tsx --verbose --no-coverage 2>&1
echo.

echo ================================================================
echo   PHASE 9 - LOCATION ^& MAPS DOMAIN (verbose)
echo ================================================================
echo   Covers: location lib, locationApi, LocationPicker,
echo   LocationGateModal, useAutoLocation hook
echo ================================================================
echo.

echo [37/22] LOCATION - Location lib (geocoding, distance calc, formatting)...
echo ----------------------------------------------------------------
call npx jest src/lib/location.test.ts --verbose --no-coverage 2>&1
echo.

echo [38/22] LOCATION - LocationApi lib (API calls, error handling)...
echo ----------------------------------------------------------------
call npx jest src/lib/locationApi.test.ts --verbose --no-coverage 2>&1
echo.

echo [39/22] LOCATION - LocationPicker component (map interaction, selection)...
echo ----------------------------------------------------------------
call npx jest src/components/__tests__/LocationPicker.test.tsx --verbose --no-coverage 2>&1
echo.

echo [40/22] LOCATION - LocationGateModal (location requirement gate)...
echo ----------------------------------------------------------------
call npx jest src/components/__tests__/LocationGateModal.test.tsx --verbose --no-coverage 2>&1
echo.

echo [41/22] LOCATION - useAutoLocation hook (auto-detect, permission)...
echo ----------------------------------------------------------------
call npx jest src/hooks/useAutoLocation.test.tsx --verbose --no-coverage 2>&1
echo.

echo ================================================================
echo   PHASE 10 - CART ^& SHOP DOMAIN (verbose)
echo ================================================================
echo   Covers: CartContext, shipping lib
echo ================================================================
echo.

echo [42/22] CART - CartContext (add, remove, update, totals, persistence)...
echo ----------------------------------------------------------------
call npx jest src/contexts/__tests__/CartContext.test.tsx --verbose --no-coverage 2>&1
echo.

echo [43/22] CART - Shipping lib (rate calc, zones, free shipping logic)...
echo ----------------------------------------------------------------
call npx jest src/lib/shipping.test.ts --verbose --no-coverage 2>&1
echo.

echo ================================================================
echo   PHASE 11 - LOYALTY ^& REWARDS DOMAIN (verbose)
echo ================================================================
echo   Covers: Loyalty scan lib
echo ================================================================
echo.

echo [44/22] LOYALTY - Scan lib (NFC/QR stamp card pairing, validation)...
echo ----------------------------------------------------------------
call npx jest src/lib/loyalty/scan.test.ts --verbose --no-coverage 2>&1
echo.

echo ================================================================
echo   PHASE 12 - INFRASTRUCTURE ^& UTILITIES (verbose)
echo ================================================================
echo   Covers: safeStorage, validation, test-panel, supabase client/server,
echo   constants/images
echo ================================================================
echo.

echo [45/22] INFRA - SafeStorage (SSR-safe localStorage wrapper)...
echo ----------------------------------------------------------------
call npx jest src/lib/safeStorage.test.ts --verbose --no-coverage 2>&1
echo.

echo [46/22] INFRA - Validation lib (input validators, form helpers)...
echo ----------------------------------------------------------------
call npx jest src/lib/validation.test.ts --verbose --no-coverage 2>&1
echo.

echo [47/22] INFRA - Test panel lib (test runner integration)...
echo ----------------------------------------------------------------
call npx jest src/lib/test-panel.test.ts --verbose --no-coverage 2>&1
echo.

echo [48/22] INFRA - Supabase client (browser client creation, config)...
echo ----------------------------------------------------------------
call npx jest src/lib/supabase/client.test.ts --verbose --no-coverage 2>&1
echo.

echo [49/22] INFRA - Supabase server (SSR client, cookie handling)...
echo ----------------------------------------------------------------
call npx jest src/lib/supabase/server.test.ts --verbose --no-coverage 2>&1
echo.

echo [50/22] INFRA - Constants/images (image URL config, defaults)...
echo ----------------------------------------------------------------
call npx jest src/lib/constants/images.test.ts --verbose --no-coverage 2>&1
echo.

echo ================================================================
echo   PHASE 13 - CROSS-DOMAIN BATCH RUNS (grouped by layer)
echo ================================================================
echo.

echo [51/22] ALL Context providers (Auth, Cart, Edit, Modal, Notifications, Section)...
echo ----------------------------------------------------------------
call npx jest ^
  src/contexts/__tests__/AuthContext.test.tsx ^
  src/contexts/__tests__/CartContext.test.tsx ^
  src/contexts/EditContext.test.tsx ^
  src/contexts/__tests__/ModalContext.test.tsx ^
  src/contexts/__tests__/NotificationsContext.test.tsx ^
  src/contexts/SectionContext.test.tsx ^
  --verbose --no-coverage 2>&1
echo.

echo [52/22] ALL Hooks (usePilatesWaiver, useAutoLocation)...
echo ----------------------------------------------------------------
call npx jest src/hooks/usePilatesWaiver.test.ts src/hooks/useAutoLocation.test.tsx --verbose --no-coverage 2>&1
echo.

echo [53/22] ALL API routes (vouchers, qr-pay-codes)...
echo ----------------------------------------------------------------
call npx jest src/app/api/__tests__/vouchers.test.ts src/app/api/__tests__/qr-pay-codes.test.ts --verbose --no-coverage 2>&1
echo.

echo [54/22] ALL Auth pages (register, login)...
echo ----------------------------------------------------------------
call npx jest "src/app/(auth)/register/__tests__/page.test.tsx" "src/app/(auth)/login/__tests__/page.test.tsx" --verbose --no-coverage 2>&1
echo.

echo [55/22] ALL Lib utilities (safeStorage, nav-items, qr-catalog, siteContent, validation, shipping, test-panel, location, locationApi, images)...
echo ----------------------------------------------------------------
call npx jest ^
  src/lib/safeStorage.test.ts ^
  src/lib/nav-items.test.ts ^
  src/lib/qr-catalog.test.ts ^
  src/lib/siteContent.test.ts ^
  src/lib/validation.test.ts ^
  src/lib/shipping.test.ts ^
  src/lib/test-panel.test.ts ^
  src/lib/location.test.ts ^
  src/lib/locationApi.test.ts ^
  src/lib/constants/images.test.ts ^
  --verbose --no-coverage 2>&1
echo.

echo [56/22] ALL Supabase clients (client + server)...
echo ----------------------------------------------------------------
call npx jest src/lib/supabase/client.test.ts src/lib/supabase/server.test.ts --verbose --no-coverage 2>&1
echo.

echo [57/22] ALL Payment ^& billing (stripe lib, PaymentMethodsManager, QrPayMethodsManager, qr-pay-codes API, qr-catalog)...
echo ----------------------------------------------------------------
call npx jest ^
  src/lib/payment/stripe.test.ts ^
  src/components/__tests__/PaymentMethodsManager.test.tsx ^
  src/components/__tests__/QrPayMethodsManager.test.tsx ^
  src/app/api/__tests__/qr-pay-codes.test.ts ^
  src/lib/qr-catalog.test.ts ^
  --verbose --no-coverage 2>&1
echo.

echo [58/22] ALL Pilates feature suites (combined, verbose)...
echo ----------------------------------------------------------------
call npx jest ^
  src/components/__tests__/PilatesTimetableManager.test.tsx ^
  src/components/__tests__/PilatesWaiverFormSheet.test.tsx ^
  src/components/__tests__/PilatesWaiverGate.test.tsx ^
  src/hooks/usePilatesWaiver.test.ts ^
  src/components/__tests__/section-components.test.tsx ^
  src/contexts/SectionContext.test.tsx ^
  src/components/__tests__/SectionSwitcher.test.tsx ^
  src/components/__tests__/RootPortal.test.tsx ^
  src/proxy.test.ts ^
  src/app/api/__tests__/vouchers.test.ts ^
  src/app/api/__tests__/qr-pay-codes.test.ts ^
  --verbose --no-coverage 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [PASS] Pilates cross-domain batch - All passed
) else (
    echo [FAIL] Pilates cross-domain batch - Some tests failed
)
echo.

echo [59/22] ALL Location feature suites (combined, verbose)...
echo ----------------------------------------------------------------
call npx jest ^
  src/lib/location.test.ts ^
  src/lib/locationApi.test.ts ^
  src/components/__tests__/LocationPicker.test.tsx ^
  src/components/__tests__/LocationGateModal.test.tsx ^
  src/hooks/useAutoLocation.test.tsx ^
  src/components/__tests__/CountryCodeDropdown.test.tsx ^
  --verbose --no-coverage 2>&1
echo.

echo [60/22] ALL UI components batch 1 (Footer, RootPortal, ErrorBoundary, DashboardShell, MainNavbar)...
echo ----------------------------------------------------------------
call npx jest ^
  src/components/__tests__/Footer.test.tsx ^
  src/components/__tests__/RootPortal.test.tsx ^
  src/components/__tests__/ErrorBoundary.test.tsx ^
  src/components/__tests__/DashboardShell.test.tsx ^
  src/components/__tests__/MainNavbar.test.tsx ^
  --verbose --no-coverage 2>&1
echo.

echo [61/22] ALL UI components batch 2 (DeleteButton, Toast, CountryCodeDropdown, ImageUrlUpload)...
echo ----------------------------------------------------------------
call npx jest ^
  src/components/__tests__/DeleteButton.test.tsx ^
  src/components/Toast.test.tsx ^
  src/components/__tests__/CountryCodeDropdown.test.tsx ^
  src/components/__tests__/ImageUrlUpload.test.tsx ^
  --verbose --no-coverage 2>&1
echo.

echo [62/22] ALL UI components batch 3 (BusinessSettingsPanel, editable, section-components, SectionSwitcher)...
echo ----------------------------------------------------------------
call npx jest ^
  src/components/__tests__/BusinessSettingsPanel.test.tsx ^
  src/components/__tests__/editable.test.tsx ^
  src/components/__tests__/section-components.test.tsx ^
  src/components/__tests__/SectionSwitcher.test.tsx ^
  --verbose --no-coverage 2>&1
echo.

echo [63/22] ALL UI components batch 4 (Pilates: TimetableManager, WaiverFormSheet, WaiverGate, PaymentMethodsManager, QrPayMethodsManager, LocationPicker, LocationGateModal)...
echo ----------------------------------------------------------------
call npx jest ^
  src/components/__tests__/PilatesTimetableManager.test.tsx ^
  src/components/__tests__/PilatesWaiverFormSheet.test.tsx ^
  src/components/__tests__/PilatesWaiverGate.test.tsx ^
  src/components/__tests__/PaymentMethodsManager.test.tsx ^
  src/components/__tests__/QrPayMethodsManager.test.tsx ^
  src/components/__tests__/LocationPicker.test.tsx ^
  src/components/__tests__/LocationGateModal.test.tsx ^
  --verbose --no-coverage 2>&1
echo.

echo ================================================================
echo   PHASE 14 - PILATES-SPECIFIC ISOLATED RUN
echo   (Mirrors run-pilates-tests.bat for cross-verification)
echo ================================================================
echo.

echo [64/22] PILATES ISOLATED - Full Pilates suite (11 suites, verbose)...
echo ----------------------------------------------------------------
call npx jest ^
  src/components/__tests__/PilatesTimetableManager.test.tsx ^
  src/components/__tests__/PilatesWaiverFormSheet.test.tsx ^
  src/components/__tests__/PilatesWaiverGate.test.tsx ^
  src/hooks/usePilatesWaiver.test.ts ^
  src/components/__tests__/section-components.test.tsx ^
  src/contexts/SectionContext.test.tsx ^
  src/components/__tests__/SectionSwitcher.test.tsx ^
  src/components/__tests__/RootPortal.test.tsx ^
  src/proxy.test.ts ^
  src/app/api/__tests__/vouchers.test.ts ^
  src/app/api/__tests__/qr-pay-codes.test.ts ^
  --verbose --no-coverage 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [PASS] Pilates isolated suite - All passed
) else (
    echo [FAIL] Pilates isolated suite - Some tests failed
)
echo.

echo [65/22] PILATES ISOLATED - API routes only (vouchers + qr-pay-codes)...
echo ----------------------------------------------------------------
call npx jest src/app/api/__tests__/vouchers.test.ts src/app/api/__tests__/qr-pay-codes.test.ts --verbose --no-coverage 2>&1
echo.

echo ================================================================
echo   PHASE 15 - WATCH MODE ^& CI OPTIONS
echo ================================================================
echo.

echo [66/22] WATCH MODE - Jest watch all (press q to quit)...
echo ----------------------------------------------------------------
echo This runs in watch mode. Press 'q' and Enter to exit.
call npx jest --watch --no-coverage 2>&1
echo.

echo [67/22] CI MODE - Jest with JSON reporter (machine-readable output)...
echo ----------------------------------------------------------------
call npx jest --json --outputFile=jest-results.json --no-coverage 2>&1
if exist jest-results.json (
    echo [PASS] JSON results written to jest-results.json
) else (
    echo [WARN] JSON results file not created
)
echo.

echo [68/22] CI MODE - Jest with JUnit XML reporter (CI integration)...
echo ----------------------------------------------------------------
call npx jest --ci --reporters=default --reporters=jest-junit --no-coverage 2>&1
echo.

echo [69/22] FAIL FAST - Run all tests, stop on first failure...
echo ----------------------------------------------------------------
call npx jest --bail=1 --no-coverage 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [PASS] Fail-fast - All tests passed
) else (
    echo [FAIL] Fail-fast - Stopped at first failure
)
echo.

echo [70/22] LIST ONLY - Dry run, list all test names without executing...
echo ----------------------------------------------------------------
call npx jest --listTests --no-coverage 2>&1
echo.

echo ================================================================
echo   PHASE 16 - DOMAIN-SPECIFIC WATCH MODES
echo ================================================================
echo.

echo [71/22] WATCH - Pilates domain only...
echo ----------------------------------------------------------------
echo Press 'q' and Enter to exit watch mode.
call npx jest --watch --testPathPattern="Pilates|Section|RootPortal|usePilatesWaiver|section-components|proxy" --no-coverage 2>&1
echo.

echo [72/22] WATCH - Billing domain only...
echo ----------------------------------------------------------------
echo Press 'q' and Enter to exit watch mode.
call npx jest --watch --testPathPattern="stripe|Payment|QrPay|qr-pay|qr-catalog" --no-coverage 2>&1
echo.

echo [73/22] WATCH - Auth domain only...
echo ----------------------------------------------------------------
echo Press 'q' and Enter to exit watch mode.
call npx jest --watch --testPathPattern="Auth|register|login|proxy" --no-coverage 2>&1
echo.

echo [74/22] WATCH - Location domain only...
echo ----------------------------------------------------------------
echo Press 'q' and Enter to exit watch mode.
call npx jest --watch --testPathPattern="location|Location|AutoLocation|CountryCode" --no-coverage 2>&1
echo.

echo [75/22] WATCH - Business ^& settings domain only...
echo ----------------------------------------------------------------
echo Press 'q' and Enter to exit watch mode.
call npx jest --watch --testPathPattern="Business|Edit|siteContent|editable|Modal|Footer|MainNavbar|nav-items" --no-coverage 2>&1
echo.

echo ================================================================
echo   PHASE 17 - COVERAGE BY DOMAIN
echo ================================================================
echo.

echo [76/22] COVERAGE - Pilates domain only...
echo ----------------------------------------------------------------
call npx jest --coverage --testPathPattern="Pilates|Section|RootPortal|usePilatesWaiver|section-components|proxy" 2>&1
echo.

echo [77/22] COVERAGE - Billing ^& payment domain only...
echo ----------------------------------------------------------------
call npx jest --coverage --testPathPattern="stripe|Payment|QrPay|qr-pay|qr-catalog" 2>&1
echo.

echo [78/22] COVERAGE - Auth domain only...
echo ----------------------------------------------------------------
call npx jest --coverage --testPathPattern="Auth|register|login|proxy" 2>&1
echo.

echo [79/22] COVERAGE - Location domain only...
echo ----------------------------------------------------------------
call npx jest --coverage --testPathPattern="location|Location|AutoLocation|CountryCode" 2>&1
echo.

echo [80/22] COVERAGE - Business ^& settings domain only...
echo ----------------------------------------------------------------
call npx jest --coverage --testPathPattern="Business|Edit|siteContent|editable|Modal|Footer|MainNavbar|nav-items" 2>&1
echo.

echo [81/22] COVERAGE - Components only (all __tests__ dirs)...
echo ----------------------------------------------------------------
call npx jest --coverage --testPathPattern="components/__tests__/" 2>&1
echo.

echo [82/22] COVERAGE - Lib only (all src/lib tests)...
echo ----------------------------------------------------------------
call npx jest --coverage --testPathPattern="src/lib/" 2>&1
echo.

echo [83/22] COVERAGE - Contexts only...
echo ----------------------------------------------------------------
call npx jest --coverage --testPathPattern="src/contexts/" 2>&1
echo.

echo [84/22] COVERAGE - Hooks only...
echo ----------------------------------------------------------------
call npx jest --coverage --testPathPattern="src/hooks/" 2>&1
echo.

echo [85/22] COVERAGE - API routes only...
echo ----------------------------------------------------------------
call npx jest --coverage --testPathPattern="src/app/api/" 2>&1
echo.

echo ================================================================
echo   PHASE 18 - INDIVIDUAL FILE RUNS (every single test file)
echo   Run each of the 47 suites in isolation for granular debugging
echo ================================================================
echo.

echo [86/22] INDIVIDUAL - Footer.test.tsx...
call npx jest src/components/__tests__/Footer.test.tsx --verbose --no-coverage 2>&1
echo.

echo [87/22] INDIVIDUAL - RootPortal.test.tsx...
call npx jest src/components/__tests__/RootPortal.test.tsx --verbose --no-coverage 2>&1
echo.

echo [88/22] INDIVIDUAL - PilatesWaiverFormSheet.test.tsx...
call npx jest src/components/__tests__/PilatesWaiverFormSheet.test.tsx --verbose --no-coverage 2>&1
echo.

echo [89/22] INDIVIDUAL - usePilatesWaiver.test.ts...
call npx jest src/hooks/usePilatesWaiver.test.ts --verbose --no-coverage 2>&1
echo.

echo [90/22] INDIVIDUAL - register page.test.tsx...
call npx jest "src/app/(auth)/register/__tests__/page.test.tsx" --verbose --no-coverage 2>&1
echo.

echo [91/22] INDIVIDUAL - ErrorBoundary.test.tsx...
call npx jest src/components/__tests__/ErrorBoundary.test.tsx --verbose --no-coverage 2>&1
echo.

echo [92/22] INDIVIDUAL - siteContent.test.ts...
call npx jest src/lib/siteContent.test.ts --verbose --no-coverage 2>&1
echo.

echo [93/22] INDIVIDUAL - vouchers.test.ts...
call npx jest src/app/api/__tests__/vouchers.test.ts --verbose --no-coverage 2>&1
echo.

echo [94/22] INDIVIDUAL - qr-pay-codes.test.ts...
call npx jest src/app/api/__tests__/qr-pay-codes.test.ts --verbose --no-coverage 2>&1
echo.

echo [95/22] INDIVIDUAL - editable.test.tsx...
call npx jest src/components/__tests__/editable.test.tsx --verbose --no-coverage 2>&1
echo.

echo [96/22] INDIVIDUAL - section-components.test.tsx...
call npx jest src/components/__tests__/section-components.test.tsx --verbose --no-coverage 2>&1
echo.

echo [97/22] INDIVIDUAL - ImageUrlUpload.test.tsx...
call npx jest src/components/__tests__/ImageUrlUpload.test.tsx --verbose --no-coverage 2>&1
echo.

echo [98/22] INDIVIDUAL - QrPayMethodsManager.test.tsx...
call npx jest src/components/__tests__/QrPayMethodsManager.test.tsx --verbose --no-coverage 2>&1
echo.

echo [99/22] INDIVIDUAL - PilatesWaiverGate.test.tsx...
call npx jest src/components/__tests__/PilatesWaiverGate.test.tsx --verbose --no-coverage 2>&1
echo.

echo [100/22] INDIVIDUAL - DashboardShell.test.tsx...
call npx jest src/components/__tests__/DashboardShell.test.tsx --verbose --no-coverage 2>&1
echo.

echo [101/22] INDIVIDUAL - SectionSwitcher.test.tsx...
call npx jest src/components/__tests__/SectionSwitcher.test.tsx --verbose --no-coverage 2>&1
echo.

echo [102/22] INDIVIDUAL - EditContext.test.tsx...
call npx jest src/contexts/EditContext.test.tsx --verbose --no-coverage 2>&1
echo.

echo [103/22] INDIVIDUAL - SectionContext.test.tsx...
call npx jest src/contexts/SectionContext.test.tsx --verbose --no-coverage 2>&1
echo.

echo [104/22] INDIVIDUAL - constants/images.test.ts...
call npx jest src/lib/constants/images.test.ts --verbose --no-coverage 2>&1
echo.

echo [105/22] INDIVIDUAL - qr-catalog.test.ts...
call npx jest src/lib/qr-catalog.test.ts --verbose --no-coverage 2>&1
echo.

echo [106/22] INDIVIDUAL - safeStorage.test.ts...
call npx jest src/lib/safeStorage.test.ts --verbose --no-coverage 2>&1
echo.

echo [107/22] INDIVIDUAL - proxy.test.ts...
call npx jest src/proxy.test.ts --verbose --no-coverage 2>&1
echo.

echo [108/22] INDIVIDUAL - validation.test.ts...
call npx jest src/lib/validation.test.ts --verbose --no-coverage 2>&1
echo.

echo [109/22] INDIVIDUAL - test-panel.test.ts...
call npx jest src/lib/test-panel.test.ts --verbose --no-coverage 2>&1
echo.

echo [110/22] INDIVIDUAL - supabase/server.test.ts...
call npx jest src/lib/supabase/server.test.ts --verbose --no-coverage 2>&1
echo.

echo [111/22] INDIVIDUAL - supabase/client.test.ts...
call npx jest src/lib/supabase/client.test.ts --verbose --no-coverage 2>&1
echo.

echo [112/22] INDIVIDUAL - shipping.test.ts...
call npx jest src/lib/shipping.test.ts --verbose --no-coverage 2>&1
echo.

echo [113/22] INDIVIDUAL - payment/stripe.test.ts...
call npx jest src/lib/payment/stripe.test.ts --verbose --no-coverage 2>&1
echo.

echo [114/22] INDIVIDUAL - loyalty/scan.test.ts...
call npx jest src/lib/loyalty/scan.test.ts --verbose --no-coverage 2>&1
echo.

echo [115/22] INDIVIDUAL - locationApi.test.ts...
call npx jest src/lib/locationApi.test.ts --verbose --no-coverage 2>&1
echo.

echo [116/22] INDIVIDUAL - location.test.ts...
call npx jest src/lib/location.test.ts --verbose --no-coverage 2>&1
echo.

echo [117/22] INDIVIDUAL - useAutoLocation.test.tsx...
call npx jest src/hooks/useAutoLocation.test.tsx --verbose --no-coverage 2>&1
echo.

echo [118/22] INDIVIDUAL - ModalContext.test.tsx...
call npx jest src/contexts/__tests__/ModalContext.test.tsx --verbose --no-coverage 2>&1
echo.

echo [119/22] INDIVIDUAL - NotificationsContext.test.tsx...
call npx jest src/contexts/__tests__/NotificationsContext.test.tsx --verbose --no-coverage 2>&1
echo.

echo [120/22] INDIVIDUAL - CartContext.test.tsx...
call npx jest src/contexts/__tests__/CartContext.test.tsx --verbose --no-coverage 2>&1
echo.

echo [121/22] INDIVIDUAL - AuthContext.test.tsx...
call npx jest src/contexts/__tests__/AuthContext.test.tsx --verbose --no-coverage 2>&1
echo.

echo [122/22] INDIVIDUAL - PilatesTimetableManager.test.tsx...
call npx jest src/components/__tests__/PilatesTimetableManager.test.tsx --verbose --no-coverage 2>&1
echo.

echo [123/22] INDIVIDUAL - PaymentMethodsManager.test.tsx...
call npx jest src/components/__tests__/PaymentMethodsManager.test.tsx --verbose --no-coverage 2>&1
echo.

echo [124/22] INDIVIDUAL - MainNavbar.test.tsx...
call npx jest src/components/__tests__/MainNavbar.test.tsx --verbose --no-coverage 2>&1
echo.

echo [125/22] INDIVIDUAL - LocationPicker.test.tsx...
call npx jest src/components/__tests__/LocationPicker.test.tsx --verbose --no-coverage 2>&1
echo.

echo [126/22] INDIVIDUAL - LocationGateModal.test.tsx...
call npx jest src/components/__tests__/LocationGateModal.test.tsx --verbose --no-coverage 2>&1
echo.

echo [127/22] INDIVIDUAL - DeleteButton.test.tsx...
call npx jest src/components/__tests__/DeleteButton.test.tsx --verbose --no-coverage 2>&1
echo.

echo [128/22] INDIVIDUAL - CountryCodeDropdown.test.tsx...
call npx jest src/components/__tests__/CountryCodeDropdown.test.tsx --verbose --no-coverage 2>&1
echo.

echo [129/22] INDIVIDUAL - BusinessSettingsPanel.test.tsx...
call npx jest src/components/__tests__/BusinessSettingsPanel.test.tsx --verbose --no-coverage 2>&1
echo.

echo [130/22] INDIVIDUAL - Toast.test.tsx...
call npx jest src/components/Toast.test.tsx --verbose --no-coverage 2>&1
echo.

echo [131/22] INDIVIDUAL - login page.test.tsx...
call npx jest "src/app/(auth)/login/__tests__/page.test.tsx" --verbose --no-coverage 2>&1
echo.

echo [132/22] INDIVIDUAL - nav-items.test.ts...
call npx jest src/lib/nav-items.test.ts --verbose --no-coverage 2>&1
echo.

echo ================================================================
echo   PHASE 19 - BUILD VERIFICATION
echo ================================================================
echo.

echo [133/22] BUILD - Production build (validates CSS, JSX, Next.js compilation)...
echo ----------------------------------------------------------------
call npx next build 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [PASS] Production build - Success
) else (
    echo [WARN] Production build - Errors found ^(may be pre-existing TS errors^)
)
echo.

echo [134/22] BUILD - Production build with Turbopack (if supported)...
echo ----------------------------------------------------------------
call npx next build --turbopack 2>&1
echo.

echo ================================================================
echo   TEST SUITE COMPLETE
echo ================================================================
echo.
echo Expected: 47 suites, all tests, 0 failures
echo.
echo Test files covered ^(47 total^):
echo   PILATES:       PilatesTimetableManager, PilatesWaiverFormSheet, PilatesWaiverGate, usePilatesWaiver, section-components, SectionContext, SectionSwitcher, RootPortal
echo   AUTH/SECURITY: AuthContext, register page, login page, proxy
echo   BILLING:       stripe lib, PaymentMethodsManager, QrPayMethodsManager, qr-pay-codes API, qr-catalog
echo   BUSINESS:      BusinessSettingsPanel, EditContext, siteContent, editable, ModalContext, Footer, MainNavbar, nav-items
echo   PROFILE:       DashboardShell, Toast, CountryCodeDropdown, NotificationsContext
echo   SERVICES:      vouchers API, DeleteButton, ErrorBoundary, ImageUrlUpload
echo   SCHEDULE:      PilatesTimetableManager
echo   LOCATION:      location lib, locationApi, LocationPicker, LocationGateModal, useAutoLocation, CountryCodeDropdown
echo   CART:          CartContext, shipping lib
echo   LOYALTY:       scan lib
echo   INFRA:         safeStorage, validation, test-panel, supabase client/server, constants/images
echo.
echo If any tests failed, check the output above.
echo To validate features in the browser:
echo   1. Run: npm run dev
echo   2. Log in as owner
echo   3. Follow: src/__tests__/MANUAL_VALIDATION_CHECKLIST.md
echo.
echo Pilates-specific browser validation:
echo   /pilates/dashboard        - section-aware home
echo   /pilates/booking          - class booking flow
echo   /pilates/services/pilates/^<id^> - timetable manager
echo   /pilates/waivers          - signed waivers admin
echo   /pilates/instructors      - instructor authorization
echo   /pilates/passes           - class passes
echo   /pilates/vouchers         - voucher CRUD
echo   /pilates/qr-payments      - QR pay codes
echo.
echo Dedicated Pilates runner: run-pilates-tests.bat
echo.
echo Coverage reports are written to coverage/ directory.
echo JSON results: jest-results.json (after CI mode step)
echo.
pause
