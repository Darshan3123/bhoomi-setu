@echo off
title Blockchain Status Checker
color 0E

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                 BLOCKCHAIN STATUS CHECKER                    ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

echo [1/3] Checking if Hardhat node is running...
curl -s -X POST -H "Content-Type: application/json" --data "{\"jsonrpc\":\"2.0\",\"method\":\"eth_blockNumber\",\"params\":[],\"id\":1}" http://localhost:8545 > nul 2>&1

if %errorlevel% equ 0 (
    echo ✅ Hardhat node is running on port 8545
) else (
    echo ❌ Hardhat node is NOT running
    echo 💡 Run: start-full-stack.bat to start the blockchain
    goto :end
)

echo.
echo [2/3] Checking backend connection...
curl -s http://localhost:3003/health > nul 2>&1

if %errorlevel% equ 0 (
    echo ✅ Backend server is running on port 3003
) else (
    echo ❌ Backend server is NOT running
    echo 💡 Run: start-full-stack.bat to start all services
)

echo.
echo [3/3] Checking frontend...
curl -s http://localhost:3001 > nul 2>&1

if %errorlevel% equ 0 (
    echo ✅ Frontend is running on port 3001
) else (
    echo ❌ Frontend is NOT running
    echo 💡 Run: start-full-stack.bat to start all services
)

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                      STATUS SUMMARY                          ║
echo ╠══════════════════════════════════════════════════════════════╣
echo ║  Blockchain: http://localhost:8545                          ║
echo ║  Backend:    http://localhost:3003                          ║
echo ║  Frontend:   http://localhost:3001                          ║
echo ╚══════════════════════════════════════════════════════════════╝

:end
echo.
echo Press any key to close...
pause >nul