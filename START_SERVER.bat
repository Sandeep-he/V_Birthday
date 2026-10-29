@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Install Node.js LTS, then run this file again.
  pause
  exit /b 1
)
if not exist node_modules\nodemailer (
  echo Installing the email dependency for wish notifications...
  call npm install
  if errorlevel 1 (
    echo Dependency installation failed. Check your internet connection and try again.
    pause
    exit /b 1
  )
)
if not exist .env (
  copy .env.example .env >nul
  echo Created .env from .env.example.
  echo Open .env and replace PUT_YOUR_GOOGLE_APP_PASSWORD_HERE with your Google App Password for starevilgod@gmail.com.
  echo Then close this window and run START_SERVER.bat again.
  notepad .env
  pause
  exit /b 0
)
node server.js
pause
