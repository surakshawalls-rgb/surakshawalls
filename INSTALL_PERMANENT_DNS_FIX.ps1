# Permanent DNS Fix - Auto-Run on Startup
# Run this ONCE as Administrator to create a startup task

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Creating Permanent DNS Fix Startup Task" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

try {
    # Check if running as administrator
    $isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    
    if (-not $isAdmin) {
        Write-Host "❌ ERROR: This script must run as Administrator" -ForegroundColor Red
        Write-Host ""
        Write-Host "Right-click and select 'Run as Administrator'" -ForegroundColor Yellow
        pause
        exit 1
    }

    # Create the DNS fix script
    $scriptContent = @'
# Auto-fix DNS on startup
$adapters = Get-NetAdapter | Where-Object {$_.Status -eq "Up"}
foreach ($adapter in $adapters) {
    try {
        Set-DnsClientServerAddress -InterfaceAlias $adapter.Name -ServerAddresses ("1.1.1.1","1.0.0.1") -ErrorAction SilentlyContinue
    } catch {
        # Ignore errors for adapters that can't have custom DNS
    }
}
Clear-DnsClientCache
'@

    $scriptPath = "C:\ProgramData\FixSupabaseDNS.ps1"
    $scriptContent | Out-File -FilePath $scriptPath -Encoding UTF8 -Force

    # Create scheduled task
    $action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$scriptPath`""
    $trigger = New-ScheduledTaskTrigger -AtStartup
    $principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -RunLevel Highest
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
    
    # Remove existing task if it exists
    try {
        Unregister-ScheduledTask -TaskName "FixSupabaseDNS" -Confirm:$false -ErrorAction SilentlyContinue
    } catch {}

    Register-ScheduledTask -TaskName "FixSupabaseDNS" -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description "Automatically fixes DNS to use Cloudflare (1.1.1.1) for Supabase connectivity" | Out-Null

    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Startup task created successfully!" -ForegroundColor Green
    Write-Host "DNS will be automatically fixed on every boot." -ForegroundColor Green
    Write-Host ""
    Write-Host "Task Details:" -ForegroundColor Yellow
    Write-Host "  - Task Name: FixSupabaseDNS" -ForegroundColor Gray
    Write-Host "  - Runs at: System startup" -ForegroundColor Gray
    Write-Host "  - Action: Sets DNS to Cloudflare (1.1.1.1, 1.0.0.1)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "To remove this task later, run:" -ForegroundColor Cyan
    Write-Host "  Unregister-ScheduledTask -TaskName 'FixSupabaseDNS' -Confirm:`$false" -ForegroundColor Gray
    Write-Host ""

} catch {
    Write-Host "❌ ERROR: Failed to create startup task" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    exit 1
}

Write-Host "Press any key to exit..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
