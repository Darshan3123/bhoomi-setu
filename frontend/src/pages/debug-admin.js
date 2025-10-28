import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWeb3 } from '@/contexts/Web3Context';
import Layout from '@/components/Layout';
import { toast } from 'react-toastify';
import { useRouter } from 'next/router';

export default function DebugAdmin() {
  const router = useRouter();
  const { user, isAuthenticated, loading, login } = useAuth();
  const { account, isConnected, connectWallet } = useWeb3();
  const [debugInfo, setDebugInfo] = useState([]);

  const addDebug = (message, type = 'info') => {
    setDebugInfo(prev => [...prev, { 
      message, 
      type, 
      timestamp: new Date().toLocaleTimeString() 
    }]);
  };

  useEffect(() => {
    addDebug('Page loaded');
    if (isAuthenticated && user) {
      addDebug(`User authenticated: ${user.walletAddress} (Role: ${user.role})`);
      
      // Check if admin should redirect
      if (user.role === 'admin') {
        addDebug('Admin detected - should redirect to /admin', 'success');
        setTimeout(() => {
          addDebug('Redirecting to admin panel...', 'info');
          router.push('/admin');
        }, 2000);
      }
    }
  }, [isAuthenticated, user, router]);

  const testAdminFlow = async () => {
    try {
      addDebug('=== STARTING ADMIN TEST ===', 'info');
      
      // Step 1: Check wallet connection
      if (!isConnected || !account) {
        addDebug('Step 1: Connecting MetaMask...', 'info');
        const connected = await connectWallet();
        if (!connected) {
          addDebug('❌ MetaMask connection failed', 'error');
          return;
        }
        addDebug(`✅ MetaMask connected: ${account}`, 'success');
      } else {
        addDebug(`✅ Already connected: ${account}`, 'success');
      }

      // Step 2: Check if admin wallet
      const adminWallet = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
      if (account.toLowerCase() !== adminWallet.toLowerCase()) {
        addDebug(`❌ Wrong wallet! Expected: ${adminWallet}`, 'error');
        addDebug(`   Current: ${account}`, 'error');
        addDebug('Please switch to admin wallet in MetaMask', 'warning');
        return;
      }
      addDebug('✅ Admin wallet confirmed', 'success');

      // Step 3: Attempt login
      addDebug('Step 3: Attempting login...', 'info');
      const success = await login();
      
      if (success) {
        addDebug('✅ Login successful!', 'success');
        
        // Step 4: Check user data
        if (user) {
          addDebug(`User data received:`, 'info');
          addDebug(`  - Wallet: ${user.walletAddress}`, 'info');
          addDebug(`  - Role: ${user.role}`, user.role === 'admin' ? 'success' : 'error');
          
          if (user.role === 'admin') {
            addDebug('🎉 SUCCESS! Admin login complete', 'success');
            addDebug('Redirecting to admin panel in 3 seconds...', 'info');
            setTimeout(() => {
              router.push('/admin');
            }, 3000);
          } else {
            addDebug(`❌ Wrong role! Expected: admin, Got: ${user.role}`, 'error');
          }
        } else {
          addDebug('❌ No user data received', 'error');
        }
      } else {
        addDebug('❌ Login failed', 'error');
      }

    } catch (error) {
      addDebug(`❌ Error: ${error.message}`, 'error');
      console.error('Admin test error:', error);
    }
  };

  const clearDebug = () => {
    setDebugInfo([]);
  };

  const goToAdmin = () => {
    router.push('/admin');
  };

  return (
    <Layout title="Debug Admin - Bhoomi Setu">
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              🔧 Admin Debug Tool
            </h1>

            {/* Current Status */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h2 className="text-lg font-semibold mb-3">Current Status:</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Wallet Connected:</span>
                  <span className={`ml-2 ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                    {isConnected ? '✅ Yes' : '❌ No'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Account:</span>
                  <span className="ml-2 font-mono text-xs">
                    {account || 'Not connected'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Authenticated:</span>
                  <span className={`ml-2 ${isAuthenticated ? 'text-green-600' : 'text-red-600'}`}>
                    {isAuthenticated ? '✅ Yes' : '❌ No'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">User Role:</span>
                  <span className={`ml-2 ${user?.role === 'admin' ? 'text-green-600' : 'text-gray-600'}`}>
                    {user?.role || 'Not set'}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4 mb-6">
              <button
                onClick={testAdminFlow}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                🧪 Test Admin Login
              </button>
              <button
                onClick={goToAdmin}
                className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
              >
                🚀 Go to Admin Panel
              </button>
              <button
                onClick={clearDebug}
                className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700"
              >
                🗑️ Clear Debug
              </button>
            </div>

            {/* Debug Output */}
            <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm">
              <h3 className="text-white font-bold mb-2">Debug Output:</h3>
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {debugInfo.length === 0 ? (
                  <p className="text-gray-500">No debug output yet...</p>
                ) : (
                  debugInfo.map((info, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <span className="text-gray-400">[{info.timestamp}]</span>
                      <span className={`
                        ${info.type === 'success' ? 'text-green-400' : ''}
                        ${info.type === 'error' ? 'text-red-400' : ''}
                        ${info.type === 'warning' ? 'text-yellow-400' : ''}
                        ${info.type === 'info' ? 'text-blue-400' : ''}
                      `}>
                        {info.message}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Instructions */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Instructions:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                <li>Make sure MetaMask is installed and unlocked</li>
                <li>Switch to admin wallet: <code className="bg-blue-100 px-1 rounded">0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266</code></li>
                <li>Click "Test Admin Login" to run the full test</li>
                <li>Watch the debug output for any issues</li>
                <li>If successful, you'll be redirected to admin panel</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}