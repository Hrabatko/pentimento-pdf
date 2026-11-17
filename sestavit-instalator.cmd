@echo off
rem Builds the Pentimento PDF installer (spec 014):
rem release\Pentimento PDF X.Y.Z.msi (MSI). Running the installer installs the
rem program for the current user only (no administrator rights), a new version
rem over the old one; signatures and settings stay.
rem Builds whatever is currently checked out (in a branch, the work in progress).
rem Details: docs\vyvoj.md, section "Instalator".
setlocal
cd /d "%~dp0"

echo Sestavuji instalator (muze trvat par minut)...
call npm.cmd run installer
if errorlevel 1 goto failed

echo.
echo Hotovo. Instalator je ve slozce release:
dir /b "release\*.msi"
start "" explorer "%~dp0release"
pause
exit /b 0

:failed
echo.
echo Sestaveni instalatoru selhalo - podivejte se na chybu vyse.
pause
exit /b 1
