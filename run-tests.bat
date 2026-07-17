@echo off
title Meraki Web - Full Test Suite
color 0A
echo ============================================
echo   MERAKI WEB - FULL TEST SUITE
echo   48 suites - 649 tests
echo ============================================
echo.

echo [1/8] Running TypeScript type check...
echo --------------------------------------------
call npx tsc --noEmit 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [PASS] TypeScript - No errors found
) else (
    echo [WARN] TypeScript - Some errors found ^(may be pre-existing^)
)
echo.

echo [2/8] Running ALL Jest tests (full suite)...
echo --------------------------------------------
call npx jest --no-coverage 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [PASS] Jest - All tests passed
) else (
    echo [FAIL] Jest - Some tests failed
)
echo.

echo [3/8] Lib tests (verbose)...
echo --------------------------------------------
call npx jest src/lib/safeStorage.test.ts src/lib/nav-items.test.ts src/lib/qr-catalog.test.ts src/lib/siteContent.test.ts src/lib/constants/images.test.ts --verbose --no-coverage 2>&1
echo.

echo [4/8] Context + Hook tests (verbose)...
echo --------------------------------------------
call npx jest src/contexts/SectionContext.test.tsx src/contexts/EditContext.test.tsx src/hooks/usePilatesWaiver.test.ts --verbose --no-coverage 2>&1
echo.

echo [5/8] Component tests - batch 1 (verbose)...
echo --------------------------------------------
call npx jest src/components/__tests__/ErrorBoundary.test.tsx src/components/__tests__/SectionSwitcher.test.tsx src/components/__tests__/RootPortal.test.tsx src/components/__tests__/DashboardShell.test.tsx --verbose --no-coverage 2>&1
echo.

echo [6/8] Component tests - batch 2 (verbose)...
echo --------------------------------------------
call npx jest src/components/__tests__/PilatesWaiverGate.test.tsx src/components/__tests__/PilatesWaiverFormSheet.test.tsx src/components/__tests__/ImageUrlUpload.test.tsx src/components/__tests__/QrPayMethodsManager.test.tsx --verbose --no-coverage 2>&1
echo.

echo [7/8] Component tests - batch 3 + API routes (verbose)...
echo --------------------------------------------
call npx jest src/components/__tests__/editable.test.tsx src/components/__tests__/section-components.test.tsx src/app/api/__tests__/qr-pay-codes.test.ts src/app/api/__tests__/vouchers.test.ts --verbose --no-coverage 2>&1
echo.

echo [8/8] Pre-existing feature tests (verbose)...
echo --------------------------------------------
call npx jest src/components/__tests__/DeleteButton.test.tsx --verbose --no-coverage 2>&1
echo.

echo ============================================
echo   TEST SUITE COMPLETE
echo   Expected: 48 suites, 649 tests, 0 failures
echo ============================================
echo.
echo If any tests failed, check the output above.
echo To validate features in the browser:
echo   1. Run: npm run dev
echo   2. Log in as owner
echo   3. Follow: src/__tests__/MANUAL_VALIDATION_CHECKLIST.md
echo.
echo New test files added this session:
echo   Lib:          safeStorage, nav-items, qr-catalog, siteContent, images
echo   Contexts:     SectionContext, EditContext
echo   Hooks:        usePilatesWaiver
echo   Components:   ErrorBoundary, SectionSwitcher, RootPortal, DashboardShell,
echo                 PilatesWaiverGate, PilatesWaiverFormSheet, ImageUrlUpload,
echo                 QrPayMethodsManager, editable, section-components
echo   API routes:   qr-pay-codes, vouchers
echo.
pause
