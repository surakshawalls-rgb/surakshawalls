@echo off
echo ============================================
echo DNS Status Check
echo ============================================
echo.

echo Checking DNS Configuration...
echo.
powershell -Command "Get-DnsClientServerAddress | Where-Object {$_.ServerAddresses -ne $null} | Format-Table InterfaceAlias, ServerAddresses -AutoSize"

echo.
echo Testing Supabase Connectivity...
echo.
ping lcwjtwidxihclizliksd.supabase.co -n 2

echo.
echo ============================================
echo DNS Status Check Complete
echo ============================================
echo.
pause
