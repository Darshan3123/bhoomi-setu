import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { useWeb3 } from '@/contexts/Web3Context';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function About() {
  const router = useRouter();
  const { user, isAuthenticated, loading, logout } = useAuth();
  const { account, disconnectWallet } = useWeb3();

  const handleLogout = () => {
    logout();
    disconnectWallet();
    router.push('/');
  };

  const handleGoToDashboard = () => {
    router.push('/user/dashboard');
  };

  if (loading) {
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header */}
        {isAuthenticated && (
          <div className="bg-white shadow">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-4">
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                    user?.role === 'buyer' ? 'bg-blue-100' : 'bg-green-100'
                  }`}>
                    {user?.role === 'buyer' ? (
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 capitalize">{user?.role}</p>
                    <p className="text-xs text-gray-500">{account?.slice(0, 6)}...{account?.slice(-4)}</p>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleGoToDashboard}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Go to Dashboard
                  </button>
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          {/* Welcome Section for Registered Users */}
          {isAuthenticated && (
            <div className="bg-white rounded-lg shadow-xl p-8 mb-8">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Welcome to Bhoomi Setu, {user?.profile?.name || 'User'}!
                </h2>
                <p className="text-gray-600 mb-6">
                  Your account has been successfully created as a <span className="font-medium capitalize text-indigo-600">{user?.role}</span>.
                  You can now start using our blockchain-powered land registry system.
                </p>
                <div className="bg-indigo-50 rounded-lg p-4">
                  <p className="text-sm text-indigo-800">
                    🎉 Registration Complete! You can now access your dashboard to manage your land records.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* About Bhoomi Setu */}
          <div className="bg-white rounded-lg shadow-xl overflow-hidden">
            <div className="px-8 py-12">
              <div className="text-center mb-12">
                <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
                  About Bhoomi Setu
                </h1>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  A revolutionary blockchain-powered land registry system that ensures secure, 
                  transparent, and tamper-proof land ownership records.
                </p>
              </div>

              {/* Mission Section */}
              <div className="mb-16">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Mission</h2>
                  <p className="text-lg text-gray-600 max-w-4xl mx-auto">
                    To revolutionize land registry management in India by leveraging blockchain technology 
                    to create a transparent, secure, and efficient system for land ownership verification 
                    and transfer processes.
                  </p>
                </div>
              </div>

              {/* Key Features */}
              <div className="mb-16">
                <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Key Features</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <div className="text-center">
                    <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.5-2a11.95 11.95 0 00-4.5 2M15 12a5 5 0 11-6 0 5 5 0 016 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Blockchain Security</h3>
                    <p className="text-gray-600">
                      All land records are stored on the Ethereum blockchain, ensuring immutability and transparency.
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Digital Certificates</h3>
                    <p className="text-gray-600">
                      Get verifiable digital ownership certificates linked to blockchain transactions.
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Multi-Role System</h3>
                    <p className="text-gray-600">
                      Buyers, Sellers, Inspectors, and Admins work together in a transparent verification process.
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">IPFS Storage</h3>
                    <p className="text-gray-600">
                      Documents are stored securely on IPFS network for decentralized and tamper-proof storage.
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart Transfers</h3>
                    <p className="text-gray-600">
                      Automated land transfer process with smart contracts ensuring secure ownership changes.
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Real-time Tracking</h3>
                    <p className="text-gray-600">
                      Track your land transfer requests in real-time with complete transparency and notifications.
                    </p>
                  </div>
                </div>
              </div>

              {/* How It Works */}
              <div className="mb-16">
                <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">How It Works</h2>
                <div className="space-y-8">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-4">
                      1
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Register & Verify</h3>
                      <p className="text-gray-600">
                        Create your account as a buyer or seller, complete your profile with KYC details, 
                        and get verified by our system.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-4">
                      2
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">List or Browse Properties</h3>
                      <p className="text-gray-600">
                        Sellers can list their properties with all necessary documents, while buyers can 
                        browse available properties and initiate purchase requests.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-4">
                      3
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Inspection & Verification</h3>
                      <p className="text-gray-600">
                        Qualified inspectors verify the property details, conduct site visits, and submit 
                        detailed inspection reports for admin review.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-4">
                      4
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Blockchain Transfer</h3>
                      <p className="text-gray-600">
                        Once approved, the ownership transfer is recorded on the blockchain, ensuring 
                        immutable and transparent record-keeping.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-4">
                      5
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Digital Certificate</h3>
                      <p className="text-gray-600">
                        Receive your digital ownership certificate with blockchain verification, 
                        QR codes, and complete transaction history.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Technology Stack */}
              <div className="mb-16">
                <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Technology Stack</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                  <div>
                    <div className="mx-auto w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                      <span className="text-lg font-bold text-gray-700">⟠</span>
                    </div>
                    <h4 className="font-semibold text-gray-900">Ethereum</h4>
                    <p className="text-sm text-gray-600">Blockchain Platform</p>
                  </div>
                  <div>
                    <div className="mx-auto w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                      <span className="text-lg font-bold text-gray-700">📁</span>
                    </div>
                    <h4 className="font-semibold text-gray-900">IPFS</h4>
                    <p className="text-sm text-gray-600">Document Storage</p>
                  </div>
                  <div>
                    <div className="mx-auto w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                      <span className="text-lg font-bold text-gray-700">⚛️</span>
                    </div>
                    <h4 className="font-semibold text-gray-900">React</h4>
                    <p className="text-sm text-gray-600">Frontend Framework</p>
                  </div>
                  <div>
                    <div className="mx-auto w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                      <span className="text-lg font-bold text-gray-700">🟢</span>
                    </div>
                    <h4 className="font-semibold text-gray-900">Node.js</h4>
                    <p className="text-sm text-gray-600">Backend Runtime</p>
                  </div>
                </div>
              </div>

              {/* Call to Action */}
              {!isAuthenticated && (
                <div className="text-center bg-indigo-50 rounded-lg p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Get Started?</h2>
                  <p className="text-gray-600 mb-6">
                    Join thousands of users who trust Bhoomi Setu for secure land registry management.
                  </p>
                  <div className="space-x-4">
                    <button
                      onClick={() => router.push('/signup')}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Sign Up Now
                    </button>
                    <button
                      onClick={() => router.push('/')}
                      className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Learn More
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}