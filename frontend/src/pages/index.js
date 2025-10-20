import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { useWeb3 } from '@/contexts/Web3Context';
import Layout from '@/components/Layout';
import ConnectWallet from '@/components/ConnectWallet';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated, loading, login } = useAuth();
  const { account, isConnected, connectWallet } = useWeb3();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (isAuthenticated && user && !isRedirecting) {
      setIsRedirecting(true);
      // Redirect based on user role
      switch (user.role) {
        case 'admin':
          router.push('/admin');
          break;
        case 'inspector':
          router.push('/inspector/dashboard');
          break;
        case 'user':
        default:
          router.push('/user/dashboard');
      }
    }
  }, [isAuthenticated, user, router, isRedirecting]);

  const handleLogin = async () => {
    if (!isConnected) {
      const connected = await connectWallet();
      if (!connected) return;
    }
    
    // Try to login with existing account
    const success = await login();
    if (!success) {
      // If login fails, user might not be registered
      setAuthMode('register');
    }
  };

  const handleRegister = () => {
    router.push('/signup');
  };

  if (loading || isRedirecting) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto h-20 w-20 bg-indigo-600 rounded-full flex items-center justify-center mb-6">
              <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900">
              Welcome to Bhoomi Setu
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Blockchain-powered land registry system
            </p>
          </div>

          {/* Login/Register Card */}
          <div className="bg-white rounded-lg shadow-xl p-8">
            {/* Tab Navigation */}
            <div className="flex mb-6">
              <button
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-2 px-4 text-center font-medium rounded-l-md transition-colors ${
                  authMode === 'login'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setAuthMode('register')}
                className={`flex-1 py-2 px-4 text-center font-medium rounded-r-md transition-colors ${
                  authMode === 'register'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Register
              </button>
            </div>

            {/* Login Mode */}
            {authMode === 'login' && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Login to Your Account
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Connect your MetaMask wallet to access your dashboard
                  </p>
                </div>

                {!isConnected ? (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-blue-700">
                            First, connect your MetaMask wallet to continue
                          </p>
                        </div>
                      </div>
                    </div>
                    <ConnectWallet />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-md p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-green-700">
                            Wallet Connected: {account?.slice(0, 6)}...{account?.slice(-4)}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={handleLogin}
                      className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2m-2-2a2 2 0 00-2 2m2-2a2 2 0 00-2-2M9 5a2 2 0 012 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h2z" />
                      </svg>
                      Sign Message to Login
                    </button>
                    
                    <p className="text-xs text-gray-500 text-center">
                      This will not cost any gas fees
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Register Mode */}
            {authMode === 'register' && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Create New Account
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    New to Bhoomi Setu? Create your account to get started
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        Registration requires completing your profile and uploading KYC documents
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleRegister}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Start Registration Process
                </button>
              </div>
            )}

            {/* Features Preview */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Why Choose Bhoomi Setu?</h4>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Blockchain-secured land records
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Digital ownership certificates
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Transparent transfer process
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}