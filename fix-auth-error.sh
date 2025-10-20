#!/bin/bash

echo "========================================"
echo "  Bhoomi Setu Authentication Fix Script"
echo "========================================"
echo
echo "This script will help resolve the 'User not found. Please register first.' error."
echo
echo "What this script does:"
echo "1. Checks if backend and frontend are running"
echo "2. Lists current users in the database"
echo "3. Provides instructions to clear browser authentication"
echo
read -p "Press Enter to continue..."

echo
echo "[1/3] Checking Backend Status..."
echo
if curl -X POST http://localhost:3002/api/auth/generate-message \
   -H "Content-Type: application/json" \
   -d '{"walletAddress":"0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"}' \
   -s > /dev/null; then
    echo "✅ Backend is running and responding"
else
    echo "❌ Backend is not running or not responding"
    echo "Please start the backend with: cd backend && npm run dev"
    exit 1
fi

echo
echo "[2/3] Checking Database Users..."
echo
cd backend
node scripts/list-users.js
cd ..

echo
echo "[3/3] Browser Authentication Fix Instructions:"
echo
echo "To fix the 'User not found' error, you have 3 options:"
echo
echo "OPTION 1 (Recommended): Use the Clear Auth Page"
echo "  1. Open your browser and go to: http://localhost:3000/clear-auth"
echo "  2. Click 'Clear Authentication State'"
echo "  3. Return to home page and reconnect your wallet"
echo
echo "OPTION 2: Manual Browser Cleanup"
echo "  1. Open Developer Tools (F12) in your browser"
echo "  2. Go to Application/Storage tab"
echo "  3. Find Local Storage for localhost:3000"
echo "  4. Delete 'auth_token' and 'user_data' keys"
echo "  5. Refresh page and reconnect wallet"
echo
echo "OPTION 3: Use Incognito/Private Mode"
echo "  1. Open an incognito/private browser window"
echo "  2. Go to http://localhost:3000"
echo "  3. Connect your wallet and register/login"
echo
echo "========================================"
echo "If you're still having issues:"
echo "1. Make sure you're using the same wallet address you registered with"
echo "2. Check if your user exists in the database list above"
echo "3. Try registering with your current wallet address"
echo "========================================"
echo