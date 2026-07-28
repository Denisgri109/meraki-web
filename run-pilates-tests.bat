@echo off
title Meraki Web - Pilates Feature Test Suite
color 0B
echo ============================================
echo   MERAKI WEB - PILATES FEATURE TEST SUITE
echo   11 suites - 176 tests
echo ============================================
echo.
echo This runner exercises every Pilates-scoped
echo test in the codebase:
echo   - PilatesTimetableManager (schedule/sessions/instructors/settings)
echo   - PilatesWaiverFormSheet (v3.0 health screening form)
echo   - PilatesWaiverGate (portal entry auto-prompt)
echo   - usePilatesWaiver hook (check + submit)
echo   - section-components (PilatesSection, SectionPageWrapper, SectionLanding)
echo   - SectionContext (pilates vs beauty switching)
echo   - SectionSwitcher (toggle UI)
echo   - RootPortal (Beauty/Pilates landing card selection)
echo   - proxy (next.config rewrites for pilates routes)
echo   - API: vouchers + qr-pay-codes (consumed by pilates pages)
echo.

echo [1/3] TypeScript type check (pilates files)...
echo --------------------------------------------
call npx tsc --noEmit 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [PASS] TypeScript - No errors found
) else (
    echo [FAIL] TypeScript - Errors found
)
echo.

echo [2/3] Pilates feature suites (verbose)...
echo --------------------------------------------
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
    echo [PASS] Pilates suites - All 176 tests passed
) else (
    echo [FAIL] Pilates suites - Some tests failed
)
echo.

echo [3/3] Pilates API routes (isolated, verbose)...
echo --------------------------------------------
call npx jest src/app/api/__tests__/vouchers.test.ts src/app/api/__tests__/qr-pay-codes.test.ts --verbose --no-coverage 2>&1
echo.

echo ============================================
echo   PILATES TEST SUITE COMPLETE
echo   Expected: 11 suites, 176 tests, 0 failures
echo ============================================
echo.
echo To validate Pilates features in the browser:
echo   1. Run: npm run dev
echo   2. Log in as owner
echo   3. Visit /pilates/dashboard
echo   4. Test timetable: /pilates/services/pilates/^<service-id^>
echo   5. Test waivers: /pilates/waivers
echo   6. Test instructors: /pilates/instructors
echo   7. Test booking: /pilates/booking
echo   8. Test passes: /pilates/passes
echo   9. Test vouchers: /pilates/vouchers
echo  10. Test QR payments: /pilates/qr-payments
echo.
pause
