import { useAuth } from '../contexts/AuthContext';
import { useWeb3 } from '../contexts/Web3Context';
import { useState, useEffect } from 'react';

export default function DebugAuth() {
  const { user, token, isAuthenticated, login } = useAuth();
  const { account, isConnected } = useWeb3();
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkUserRole = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const response = await fetch('/api/auth/user-role', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      setUserRole(data);
    } catch (error) {
      console.error('Error checking user role:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      checkUserRole();
    }
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Authentication Debug</h1>
          
          {/* Web3 Status */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">Web3 Status</h2>
            <div className="space-y-1 text-sm">
              <p><strong>Connected:</strong> {isConnected ? '✅ Yes' : '❌ No'}</p>
              <p><strong>Account:</strong> {account || 'Not connected'}</p>
            </div>
          </div>

          {/* Auth Status */}
          <div className="mb-6 p-4 bg-green-50 rounded-lg">
            <h2 className="text-lg font-semibold text-green-900 mb-2">Auth Status</h2>
            <div className="space-y-1 text-sm">
              <p><strong>Authenticated:</strong> {isAuthenticated ? '✅ Yes' : '❌ No'}</p>
              <p><strong>Has Token:</strong> {token ? '✅ Yes' : '❌ No'}</p>
              <p><strong>Token Preview:</strong> {token ? `${token.slice(0, 20)}...` : 'None'}</p>
            </div>
          </div>

          {/* User Data */}
          <div className="mb-6 p-4 bg-purple-50 rounded-lg">
            <h2 className="text-lg font-semibold text-purple-900 mb-2">User Data (Frontend)</h2>
            {user ? (
              <div className="space-y-1 text-sm">
                <p><strong>Wallet:</strong> {user.walletAddress}</p>
                <p><strong>Role:</strong> {user.role}</p>
                <p><strong>Name:</strong> {user.profile?.name || 'N/A'}</p>
                <p><strong>Email:</strong> {user.profile?.email || 'N/A'}</p>
                <p><strong>Is Admin:</strong> {user.role === 'admin' ? '✅ Yes' : '❌ No'}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-600">No user data</p>
            )}
          </div>

          {/* Backend User Data */}
          <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
            <h2 className="text-lg font-semibold text-yellow-900 mb-2">User Data (Backend)</h2>
            <button
              onClick={checkUserRole}
              disabled={!token || loading}
              className="mb-3 bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Check Backend User Role'}
            </button>
            
            {userRole ? (
              <div className="space-y-1 text-sm">
                <p><strong>Wallet:</strong> {userRole.walletAddress}</p>
                <p><strong>Role:</strong> {userRole.role}</p>
                <p><strong>Is Admin:</strong> {userRole.isAdmin ? '✅ Yes' : '❌ No'}</p>
                <p><strong>Registered:</strong> {userRole.isRegistered ? '✅ Yes' : '❌ No'}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-600">Click button to check backend data</p>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-4">
            {!isAuthenticated && isConnected && (
              <button
                onClick={login}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
              >
                Login with Wallet
              </button>
            )}

            {isAuthenticated && user?.role === 'admin' && (
              <div className="flex space-x-4">
                <a
                  href="/admin"
                  className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700"
                >
                  Go to Admin Panel
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}