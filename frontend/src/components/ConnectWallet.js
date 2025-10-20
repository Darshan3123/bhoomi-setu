import { useState } from 'react';
import { useWeb3 } from '@/contexts/Web3Context';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

export default function ConnectWallet() {
  const { connectWallet, isConnecting, isMetaMaskInstalled } = useWeb3();
  const { login, loading: authLoading } = useAuth();
  const [step, setStep] = useState('connect'); // 'connect', 'authenticate'

  const handleConnect = async () => {
    const connected = await connectWallet();
    if (connected) {
      setStep('authenticate');
    }
  };

  const handleAuthenticate = async () => {
    await login();
  };

  if (!isMetaMaskInstalled()) {
    return (
      <div className="text-center">
        <div className="rounded-md bg-yellow-50 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                MetaMask Required
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  You need MetaMask to use this application. Please install MetaMask browser extension.
                </p>
              </div>
              <div className="mt-4">
                <a
                  href="https://metamask.io/download/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-yellow-800 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                >
                  Install MetaMask
                  <svg
                    className="ml-2 -mr-0.5 h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'connect') {
    return (
      <div className="text-center">
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isConnecting ? (
            <>
              <LoadingSpinner size="sm" />
              <span className="ml-2">Connecting...</span>
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"
                  clipRule="evenodd"
                />
              </svg>
              Connect Wallet
            </>
          )}
        </button>
        <p className="mt-2 text-sm text-gray-500">
          Connect your MetaMask wallet to get started
        </p>
      </div>
    );
  }

  if (step === 'authenticate') {
    return (
      <div className="text-center">
        <div className="rounded-md bg-green-50 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                Wallet Connected
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p>Now sign a message to authenticate and access the platform.</p>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleAuthenticate}
          disabled={authLoading}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {authLoading ? (
            <>
              <LoadingSpinner size="sm" />
              <span className="ml-2">Authenticating...</span>
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2m-2-2a2 2 0 00-2 2m2-2a2 2 0 00-2-2M9 5a2 2 0 012 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h2z"
                />
              </svg>
              Sign Message
            </>
          )}
        </button>
        <p className="mt-2 text-sm text-gray-500">
          This will not cost any gas fees
        </p>
      </div>
    );
  }

  return null;
}