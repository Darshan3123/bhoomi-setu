@echo off
REM 🚀 Bhoomi Setu Quick Setup Script for Windows
REM This script sets up the entire development environment

echo 🚀 Bhoomi Setu Quick Development Setup
echo ======================================

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if MongoDB is running (basic check)
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I /N "mongod.exe" >NUL
if errorlevel 1 (
    echo ⚠️  MongoDB might not be running. Please ensure MongoDB is started.
    echo    On Windows: net start MongoDB
    pause
)

echo.
echo 📦 Installing backend dependencies...
cd backend
if not exist "node_modules" (
    npm install
) else (
    echo ✅ Backend dependencies already installed
)

echo.
echo 📦 Installing frontend dependencies...
cd ..\frontend
if not exist "node_modules" (
    npm install
) else (
    echo ✅ Frontend dependencies already installed
)

echo.
echo 🗄️  Setting up database with sample data...
cd ..
node backend\scripts\setup-database.js

echo.
echo 🎉 Setup Complete!
echo.
echo 🚀 To start development:
echo    1. Backend:  cd backend ^&^& npm run dev
echo    2. Frontend: cd frontend ^&^& npm run dev
echo.
echo 🌐 URLs:
echo    Frontend: http://localhost:3000
echo    Backend:  http://localhost:3003
echo    Test Transactions: http://localhost:3000/test-transaction
echo.
echo 👤 Sample Login Wallets:
echo    Admin:     0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
echo    Inspector: 0x70997970c51812dc3a010c7d01b50e0d17dc79c8
echo    User:      0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc
echo.
echo Happy coding! 🎯
pause