@echo off
echo Starting Bhoomi Setu Development Environment...
echo.

echo 1. Starting Hardhat Network...
start "Hardhat Network" cmd /k "cd contracts && npm run dev"

echo 2. Waiting for Hardhat to start...
timeout /t 10 /nobreak > nul

echo 3. Deploying Contracts...
start "Deploy Contracts" cmd /k "cd contracts && npm run deploy:local"

echo 4. Starting Backend API...
start "Backend API" cmd /k "cd backend && npm run dev"

echo 5. Starting Frontend...
start "Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo All services are starting...
echo.
echo Access points:
echo - Frontend: http://localhost:3000
echo - Backend API: http://localhost:3002
echo - Hardhat Network: http://localhost:8545
echo.
echo Press any key to exit...
pause > nul