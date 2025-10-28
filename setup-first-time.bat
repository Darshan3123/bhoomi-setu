@echo off
title Bhoomi Setu - First Time Setup
color 0B

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║              BHOOMI SETU - FIRST TIME SETUP                  ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo This script will install all dependencies for the full stack.
echo.

echo [1/4] Installing root dependencies...
call npm install

echo.
echo [2/4] Installing backend dependencies...
cd backend
call npm install
cd ..

echo.
echo [3/4] Installing frontend dependencies...
cd frontend
call npm install
cd ..

echo.
echo [4/4] Installing smart contract dependencies...
cd contracts
call npm install
cd ..

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                   ✅ SETUP COMPLETE! ✅                      ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo 🎉 All dependencies installed successfully!
echo.
echo 📋 Next Steps:
echo    1. Make sure MongoDB is running
echo    2. Run: start-full-stack.bat
echo    3. Open http://localhost:3001
echo.
echo Press any key to continue...
pause >nul