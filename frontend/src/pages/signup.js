import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { useWeb3 } from '@/contexts/Web3Context';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { toast } from 'react-toastify';

export default function Signup() {
  const router = useRouter();
  const { isAuthenticated, loading, initializeAuth } = useAuth();
  const { account, isConnected, connectWallet, signMessage } = useWeb3();
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [step, setStep] = useState(1); // 1: Connect Wallet, 2: Profile Form, 3: Sign Message
  
  // Profile form data
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    aadhaarNumber: '',
    panNumber: ''
  });
  
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/user/dashboard');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (isConnected && account) {
      setStep(2);
    } else {
      setStep(1);
    }
  }, [isConnected, account]);

  const handleConnectWallet = async () => {
    const connected = await connectWallet();
    if (connected) {
      setStep(2);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!profileData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!profileData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!profileData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[+]?[\d\s\-()]{10,}$/.test(profileData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    if (!profileData.aadhaarNumber.trim()) {
      newErrors.aadhaarNumber = 'Aadhaar number is required';
    } else if (!/^\d{12}$/.test(profileData.aadhaarNumber.replace(/\s/g, ''))) {
      newErrors.aadhaarNumber = 'Aadhaar number must be 12 digits';
    }
    
    if (!profileData.panNumber.trim()) {
      newErrors.panNumber = 'PAN number is required';
    } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(profileData.panNumber.toUpperCase())) {
      newErrors.panNumber = 'Please enter a valid PAN number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileSubmit = () => {
    if (validateForm()) {
      setStep(3);
      handleSignup();
    }
  };

  const handleSignup = async () => {
    if (!account || !isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsSigningUp(true);

    try {
      // Generate message for signing
      const messageResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003/api'}/auth/generate-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: account,
        }),
      });

      if (!messageResponse.ok) {
        throw new Error('Failed to generate message');
      }

      const { message } = await messageResponse.json();

      // Sign the message
      console.log('🔍 Frontend debug - Message to sign:', JSON.stringify(message));
      const signature = await signMessage(message);
      if (!signature) {
        setStep(3);
        setIsSigningUp(false);
        return;
      }

      console.log('🔍 Frontend debug - Signature:', signature);
      console.log('🔍 Frontend debug - Wallet address:', account);

      // Register user with profile data
      const authResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003/api'}/auth/register-with-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: account,
          signature,
          message,
          name: profileData.name,
          email: profileData.email,
          phone: profileData.phone,
          aadhaarNumber: profileData.aadhaarNumber,
          panNumber: profileData.panNumber
        }),
      });

      if (!authResponse.ok) {
        const errorData = await authResponse.json();
        throw new Error(errorData.error || 'Registration failed');
      }

      const { token, user, isNewUser } = await authResponse.json();

      // Store auth data
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user_data', JSON.stringify(user));

      if (isNewUser) {
        toast.success(`Welcome! Your account has been created successfully.`);
      } else {
        toast.success(`Profile updated successfully!`);
      }

      // Initialize auth context with the new data
      await initializeAuth(token, user);

      // Redirect to user dashboard after successful registration
      router.push('/user/dashboard');
    } catch (error) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Signup failed. Please try again.');
      setStep(2);
    } finally {
      setIsSigningUp(false);
    }
  };

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-xl p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-extrabold text-gray-900">
                Join Bhoomi Setu
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Create your account to start managing land records
              </p>
            </div>

            {/* Progress Steps */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div className={`flex items-center ${step >= 1 ? 'text-indigo-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    step >= 1 ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-300'
                  }`}>
                    1
                  </div>
                  <span className="ml-2 text-sm font-medium">Connect</span>
                </div>
                <div className={`flex-1 h-1 mx-4 ${step >= 2 ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
                <div className={`flex items-center ${step >= 2 ? 'text-indigo-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    step >= 2 ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-300'
                  }`}>
                    2
                  </div>
                  <span className="ml-2 text-sm font-medium">Profile</span>
                </div>
                <div className={`flex-1 h-1 mx-4 ${step >= 3 ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
                <div className={`flex items-center ${step >= 3 ? 'text-indigo-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    step >= 3 ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-300'
                  }`}>
                    3
                  </div>
                  <span className="ml-2 text-sm font-medium">Sign</span>
                </div>
              </div>
            </div>

            {/* Step 1: Connect Wallet */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Connect Your Wallet</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Connect your MetaMask wallet to create your account
                  </p>
                </div>
                
                <button
                  onClick={handleConnectWallet}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  Connect MetaMask
                </button>
              </div>
            )}

            {/* Step 2: Profile Form */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Complete Your Profile</h3>
                  <p className="text-sm text-gray-600">
                    Please provide your details and upload required documents
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        errors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter your full name"
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter your email address"
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        errors.phone ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter your phone number"
                    />
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                  </div>

                  {/* Aadhaar Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Aadhaar Number *
                    </label>
                    <input
                      type="text"
                      value={profileData.aadhaarNumber}
                      onChange={(e) => handleInputChange('aadhaarNumber', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        errors.aadhaarNumber ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter your 12-digit Aadhaar number"
                      maxLength="12"
                    />
                    {errors.aadhaarNumber && <p className="text-red-500 text-xs mt-1">{errors.aadhaarNumber}</p>}
                  </div>

                  {/* PAN Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      PAN Number *
                    </label>
                    <input
                      type="text"
                      value={profileData.panNumber}
                      onChange={(e) => handleInputChange('panNumber', e.target.value.toUpperCase())}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        errors.panNumber ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter your PAN number (e.g., ABCDE1234F)"
                      maxLength="10"
                    />
                    {errors.panNumber && <p className="text-red-500 text-xs mt-1">{errors.panNumber}</p>}
                  </div>


                </div>

                <button
                  onClick={handleProfileSubmit}
                  disabled={isSigningUp}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSigningUp ? 'Creating Account...' : 'Create Account'}
                </button>
              </div>
            )}

            {/* Step 3: Sign Message */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-yellow-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Sign Message</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Please sign the message in your MetaMask wallet to complete registration
                  </p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <LoadingSpinner size="sm" />
                    <span className="ml-3 text-sm text-gray-600">
                      Processing your registration...
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-xs text-gray-500">
                Already have an account?{' '}
                <button
                  onClick={() => router.push('/')}
                  className="text-indigo-600 hover:text-indigo-500 font-medium"
                >
                  Sign in here
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}