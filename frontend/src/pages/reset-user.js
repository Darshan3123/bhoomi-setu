import { useState } from 'react';
import { useRouter } from 'next/router';
import { useWeb3 } from '@/contexts/Web3Context';
import Layout from '@/components/Layout';
import { toast } from 'react-toastify';

export default function ResetUser() {
  const router = useRouter();
  const { account, isConnected } = useWeb3();
  const [isResetting, setIsResetting] = useState(false);

  const handleResetUser = async () => {
    if (!account || !isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!confirm('Are you sure you want to delete your user account? This action cannot be undone.')) {
      return;
    }

    setIsResetting(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api'}/auth/reset-user/${account}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reset user');
      }

      const data = await response.json();
      toast.success(data.message);
      
      // Clear local storage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      
      // Redirect to home
      router.push('/');
    } catch (error) {
      console.error('Reset user error:', error);
      toast.error(error.message || 'Failed to reset user');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900">
                Reset User Account
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                This will permanently delete your user account from the system
              </p>
            </div>

            {isConnected && account ? (
              <div className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Warning
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>
                          This action will permanently delete your account for wallet address: 
                          <br />
                          <code className="bg-yellow-100 px-1 rounded">{account}</code>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleResetUser}
                  disabled={isResetting}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isResetting ? 'Deleting Account...' : 'Delete My Account'}
                </button>

                <button
                  onClick={() => router.push('/')}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-gray-600 mb-4">Please connect your wallet to reset your account</p>
                <button
                  onClick={() => router.push('/')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Go Home
                </button>
              </div>
            )}

            <div className="mt-8 text-center">
              <p className="text-xs text-gray-500">
                This feature is only available in development mode
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}