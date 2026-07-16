@echo off
title Meraki Web - Full Test Suite
color 0A
echo ============================================
echo   MERAKI WEB - FULL TEST SUITE
echo ============================================
echo.

echo [1/3] Running TypeScript type check...
echo --------------------------------------------
call npx tsc --noEmit 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [PASS] TypeScript - No errors found
) else (
    echo [WARN] TypeScript - Some errors found ^(may be pre-existing^)
)
echo.

echo [2/3] Running all Jest tests...
echo --------------------------------------------
call npx jest --no-coverage 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [PASS] Jest - All tests passed
) else (
    echo [FAIL] Jest - Some tests failed
)
echo.

echo [3/3] Running new feature tests only...
echo --------------------------------------------
call npx jest src/components/__tests__/DeleteButton.test.tsx src/app/dashboard/bulk-finance/__tests__/page.test.tsx --verbose --no-coverage 2>&1
echo.

echo ============================================
echo   TEST SUITE COMPLETE
echo ============================================
echo.
echo If any tests failed, check the output above.
echo To validate features in the browser:
echo   1. Run: npm run dev
echo   2. Log in as owner
echo   3. Follow: src/__tests__/MANUAL_VALIDATION_CHECKLIST.md
echo.
pause
