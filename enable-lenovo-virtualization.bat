@echo off
setlocal
cd /d "%~dp0"

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Requesting Administrator privileges...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process cmd.exe -ArgumentList '/c \"\"%~f0\"\"' -Verb RunAs"
    exit /b
)

echo ==========================================================
echo   Lenovo ThinkPad BIOS Virtualization Enabler
echo ==========================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$settings = (Get-WmiObject -Class Lenovo_BiosSetting -Namespace root\wmi).CurrentSetting; " ^
    "$virt = $settings | Where-Object { $_ -like '*Virtualization*' -or $_ -like '*VT*' }; " ^
    "Write-Host 'Current BIOS setting:' -ForegroundColor Cyan; " ^
    "$virt | ForEach-Object { Write-Host '  -' $_ }; " ^
    "Write-Host ''; " ^
    "Write-Host 'Enabling Virtualization settings...' -ForegroundColor Cyan; " ^
    "$setter = Get-WmiObject -Class Lenovo_SetBiosSetting -Namespace root\wmi; " ^
    "$saver = Get-WmiObject -Class Lenovo_SaveBiosSettings -Namespace root\wmi; " ^
    "$r1 = $setter.SetBiosSetting('VirtualizationTechnology,Enable'); " ^
    "Write-Host ('  VirtualizationTechnology: ' + $r1.return); " ^
    "$r2 = $setter.SetBiosSetting('VTdFeature,Enable'); " ^
    "Write-Host ('  VTdFeature: ' + $r2.return); " ^
    "$saveRes = $saver.SaveBiosSettings(); " ^
    "Write-Host ('  SaveBiosSettings: ' + $saveRes.return); " ^
    "Write-Host ''; " ^
    "if ($saveRes.return -eq 'Success' -or $saveRes.return -eq 0) { " ^
    "    Write-Host '==========================================================' -ForegroundColor Green; " ^
    "    Write-Host 'SUCCESS! Intel Virtualization has been enabled in BIOS!' -ForegroundColor Green; " ^
    "    Write-Host 'Please restart your laptop now for it to take effect.' -ForegroundColor Green; " ^
    "    Write-Host '==========================================================' -ForegroundColor Green; " ^
    "} else { " ^
    "    Write-Host ('Save status: ' + $saveRes.return) -ForegroundColor Yellow; " ^
    "}"

echo.
echo Press any key to exit...
pause >nul
