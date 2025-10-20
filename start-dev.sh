#!/bin/bash

echo "Starting Bhoomi Setu Development Environment..."
echo

echo "1. Starting Hardhat Network..."
cd contracts && npm run dev &
HARDHAT_PID=$!

echo "2. Waiting for Hardhat to start..."
sleep 10

echo "3. Deploying Contracts..."
cd contracts && npm run deploy:local &
DEPLOY_PID=$!

echo "4. Starting Backend API..."
cd ../backend && npm run dev &
BACKEND_PID=$!

echo "5. Starting Frontend..."
cd ../frontend && npm run dev &
FRONTEND_PID=$!

echo
echo "All services are starting..."
echo
echo "Access points:"
echo "- Frontend: http://localhost:3000"
echo "- Backend API: http://localhost:3002"
echo "- Hardhat Network: http://localhost:8545"
echo
echo "Press Ctrl+C to stop all services..."

# Wait for user to stop
trap "kill $HARDHAT_PID $DEPLOY_PID $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait