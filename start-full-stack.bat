@echo off
title Bhoomi Setu Full Stack Startup
color 0A

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                 BHOOMI SETU FULL STACK STARTUP               ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo Starting complete blockchain land registry system...
echo.

echo [STEP 1/4] Starting Hardhat Local Blockchain...
echo ├─ Port: 8545
echo ├─ Network: localhost
echo └─ Starting in new window...
start "🔗 Blockchain Node" cmd /k "title Blockchain Node && cd contracts && echo Starting Hardhat Node... && npm run dev"

echo.
echo [STEP 2/4] Waiting for blockchain to initialize...
echo ├─ Waiting 12 seconds for Hardhat node...
timeout /t 12 /nobreak >nul

echo ├─ Deploying smart contracts...
echo └─ LandRegistry contract deployment...
cd contracts
call npm run deploy:local
cd ..

echo.
echo [STEP 3/4] Starting Backend API Server...
echo ├─ Port: 3003
echo ├─ Database: MongoDB (localhost:27017)
echo └─ Starting in new window...
start "🚀 Backend API" cmd /k "title Backend API Server && cd backend && echo Starting Backend Server... && npm run dev"

echo.
echo [STEP 4/4] Waiting for backend to start...
timeout /t 8 /nobreak >nul

echo ├─ Starting Frontend Application...
echo ├─ Port: 3001
echo └─ Starting in new window...
start "🌐 Frontend App" cmd /k "title Frontend Application && cd frontend && echo Starting Frontend... && npm run dev"

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    🎉 STARTUP COMPLETE! 🎉                   ║
echo ╠══════════════════════════════════════════════════════════════╣
echo ║  Blockchain:  http://localhost:8545                         ║
echo ║  Backend API: http://localhost:3003                         ║
echo ║  Frontend:    http://localhost:3000                         ║
echo ║  Health:      http://localhost:3003/health                  ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo ✅ All services are starting up!
echo ✅ Check the individual windows for detailed logs
echo ✅ Wait 30-60 seconds for all services to be fully ready
echo.
echo 📋 Next Steps:
echo    1. Open http://localhost:3000 in your browser
echo    2. Connect MetaMask to localhost:8545
echo    3. Import test accounts from Hardhat
echo    4. Start using the application!
echo.
echo Press any key to close this startup window...
pause >nul