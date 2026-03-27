@echo off
cd /d "%~dp0"
echo.
echo  RX Skin - Starting dev server (hot reload)...
echo  NOTE: CSS changes require restarting this server.
echo.
call npx next dev -p 3001
