#!/bin/bash

# 🚀 Bhoomi Setu Quick Setup Script
# This script sets up the entire development environment

echo "🚀 Bhoomi Setu Quick Development Setup"
echo "======================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running. Please start MongoDB first."
    echo "   On macOS: brew services start mongodb-community"
    echo "   On Ubuntu: sudo systemctl start mongod"
    echo "   On Windows: net start MongoDB"
    read -p "Press Enter after starting MongoDB..."
fi

echo ""
echo "📦 Installing backend dependencies..."
cd backend
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "✅ Backend dependencies already installed"
fi

echo ""
echo "📦 Installing frontend dependencies..."
cd ../frontend
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "✅ Frontend dependencies already installed"
fi

echo ""
echo "🗄️  Setting up database with sample data..."
cd ..
node backend/scripts/setup-database.js

echo ""
echo "🎉 Setup Complete!"
echo ""
echo "🚀 To start development:"
echo "   1. Backend:  cd backend && npm run dev"
echo "   2. Frontend: cd frontend && npm run dev"
echo ""
echo "🌐 URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:3003"
echo "   Test Transactions: http://localhost:3000/test-transaction"
echo ""
echo "👤 Sample Login Wallets:"
echo "   Admin:     0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"
echo "   Inspector: 0x70997970c51812dc3a010c7d01b50e0d17dc79c8"
echo "   User:      0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc"
echo ""
echo "Happy coding! 🎯"