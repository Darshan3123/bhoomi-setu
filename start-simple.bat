@echo off
echo ========================================
echo    Bhoomi Setu Full Stack Startup
echo ========================================
echo.
echo Starting services in order:
echo 1. Hardhat Blockchain (Port 8545)
echo 2. Smart Contract Deployment
echo 3. Backend Server (Port 3003)
echo 4. Frontend Server (Port 3001)
echo.

echo [1/4] Starting Hardhat Blockchain...
start "Blockchain" cmd /k "cd contracts && npm run dev"

echo [2/4] Waiting 10 seconds for blockchain to start...
timeout /t 10 /nobreak >nul

echo [2/4] Deploying Smart Contracts...
start "Deploy" cmd /c "cd contracts && npm run deploy:local && pause"

echo [3/4] Waiting 5 seconds for deployment...
timeout /t 5 /nobreak >nul

echo [3/4] Starting Backend Server...
start "Backend" cmd /k "cd backend && npm run dev"

echo [4/4] Waiting 5 seconds for backend...
timeout /t 5 /nobreak >nul

echo [4/4] Starting Frontend Server...
start "Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo All services are starting!
echo Blockchain: http://localhost:8545
echo Backend:    http://localhost:3003
echo Frontend:   http://localhost:3000
echo ========================================
echo.
echo Press any key to close this window...
pause