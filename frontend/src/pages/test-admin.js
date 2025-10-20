import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useWeb3 } from '../contexts/Web3Context';

export default function TestAdmin() {
  const { user, token, isAuthenticated, login } = useAuth();
  const { account, isConnected } = useWeb3();
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setTestResult('Attempting to login...');
    
    try {
      const success = await login();
      if (success) {
        setTestResult('✅ Login successful!');
      } else {
        setTestResult('❌ Login failed');
      }
    } catch (error) {
      setTestResult(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testAdminAccess = async () => {
    if (!token) {
      setTestResult('❌ No token available');
      return;
    }

    try {
      setLoading(true);
      setTestResult('Testing admin access...');

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';
      const response = await fetch(`${API_BASE_URL}/auth/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        setTestResult(`✅ Admin access successful! Found ${data.users?.length || 0} users`);
      } else {
        setTestResult(`❌ Admin access failed: ${data.error}`);
      }
    } catch (error) {
      setTestResult(`❌ Network error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-6">Admin Access Test</h1>
          
          {/* Connection Status */}
          <div className="mb-6 p-4 bg-blue-50 rounded">
            <h2 className="font-semibold mb-2">Connection Status</h2>
            <p>Wallet Connected: {isConnected ? '✅' : '❌'}</p>
            <p>Account: {account || 'None'}</p>
            <p>Authenticated: {isAuthenticated ? '✅' : '❌'}</p>
            <p>User Role: {user?.role || 'None'}</p>
            <p>Is Admin: {user?.role === 'admin' ? '✅' : '❌'}</p>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            {!isAuthenticated && (
              <button
                onClick={handleLogin}
                disabled={!isConnected || loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Signing...' : 'Sign Message & Login'}
              </button>
            )}

            {isAuthenticated && (
              <button
                onClick={testAdminAccess}
                disabled={loading}
                className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Testing...' : 'Test Admin Access'}
              </button>
            )}

            {isAuthenticated && user?.role === 'admin' && (
              <a
                href="/admin"
                className="block w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 text-center"
              >
                Go to Admin Panel
              </a>
            )}
          </div>

          {/* Test Results */}
          {testResult && (
            <div className="mt-6 p-4 bg-gray-50 rounded">
              <h3 className="font-semibold mb-2">Test Result:</h3>
              <p className="text-sm">{testResult}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}