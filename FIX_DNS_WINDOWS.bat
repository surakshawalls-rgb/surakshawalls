@echo off
echo ============================================
echo Fixing DNS for Supabase Connectivity
echo ============================================
echo.

REM Get the active network adapter name
for /f "tokens=1,2,3*" %%i in ('netsh interface show interface ^| findstr /C:"Connected"') do set adapter=%%l

echo Detected Network Adapter: %adapter%
echo.
echo Setting DNS to Cloudflare (1.1.1.1)...
echo.

REM Set primary DNS
netsh interface ip set dns "%adapter%" static 1.1.1.1

REM Set secondary DNS
netsh interface ip add dns "%adapter%" 1.0.0.1 index=2

REM Flush DNS cache
ipconfig /flushdns

echo.
echo ============================================
echo DNS Configuration Complete!
echo ============================================
echo Primary DNS: 1.1.1.1
echo Secondary DNS: 1.0.0.1
echo.
echo Your Supabase app should now work.
echo.
pause
