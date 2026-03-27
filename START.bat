@echo off
cd /d "%~dp0"
echo.
echo  RX Skin - Starting server...
echo.

if not exist ".next" (
  echo  Building application...
  call npm run build
  if errorlevel 1 (
    echo  Build failed. Check errors above.
    pause
    exit /b 1
  )
)

echo  Starting production server on http://localhost:3001
call npx next start -p 3001
