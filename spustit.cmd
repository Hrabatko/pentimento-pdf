@echo off
rem Starts Pentimento PDF as a program directly from the project folder, without
rem installing (spec 014): builds the current version - while working in a
rem branch, the work-in-progress one, marked "(rozpracovana)" in the toolbar -
rem and opens the program window. Neither a server nor Chrome is needed.
rem Details: docs\vyvoj.md, section "Bezne spusteni".
setlocal
cd /d "%~dp0"

echo Sestavuji aplikaci...
call npm.cmd run build >nul
if errorlevel 1 goto failed
call npm.cmd run build:electron >nul
if errorlevel 1 goto failed

start "" "%~dp0node_modules\electron\dist\electron.exe" "%~dp0."
exit /b 0

:failed
echo Sestaveni selhalo. Spustte "npm.cmd run build" a "npm.cmd run build:electron" a podivejte se na chybu.
pause
exit /b 1
