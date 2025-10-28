@echo off
echo ========================================
echo    Bhoomi Setu Development Server
echo ========================================
echo.
echo Starting Backend Server (Port 3003)...
echo Starting Frontend Server (Port 3001)...
echo.

REM Start backend in a new window
start "Backend Server" cmd /k "cd /d backend && npm run dev"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend in a new window
start "Frontend Server" cmd /k "cd /d frontend && npm run dev"

echo.
echo ========================================
echo Servers are starting...
echo Backend:  http://localhost:3003
echo Frontend: http://localhost:3001
echo ========================================
echo.
echo Press any key to close this window...
pause >nul