import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { toast } from 'react-toastify';

export default function DebugVerification() {
  const { user, api, isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState({});
  const [apiResponse, setApiResponse] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setDebugInfo(prev => ({...prev, auth: 'Not authenticated'}));
      return;
    }

    if (user?.role !== 'inspector') {
      setDebugInfo(prev => ({...prev, role: `User role: ${user?.role}, expected: inspector`}));
      return;
    }

    setDebugInfo(prev => ({
      ...prev, 
      auth: 'Authenticated',
      role: 'Inspector role confirmed',
      user: user
    }));
  }, [isAuthenticated, user]);

  const testAPI = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Testing API call...');
      console.log('API base URL:', process.env.NEXT_PUBLIC_API_URL);
      console.log('User:', user);
      
      // Test assigned cases first
      const casesResponse = await api.get('/inspector/cases');
      console.log('Cases response:', casesResponse.data);
      
      setDebugInfo(prev => ({
        ...prev,
        casesAPI: casesResponse.data
      }));
      
      // Test property verification API
      const verificationResponse = await api.get('/properties/inspector/assigned');
      console.log('Verification response:', verificationResponse.data);
      
      setApiResponse(verificationResponse.data);
      setDebugInfo(prev => ({
        ...prev,
        verificationAPI: verificationResponse.data
      }));
      
    } catch (error) {
      console.error('API Error:', error);
      setError({
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
      
      setDebugInfo(prev => ({
        ...prev,
        error: error.response?.data || error.message
      }));
    } finally {
      setLoading(false);
    }
  };

  const testPropertyVerificationList = async () => {
    try {
      setLoading(true);
      
      const response = await api.get('/properties/inspector/pending');
      console.log('Pending verifications:', response.data);
      
      setDebugInfo(prev => ({
        ...prev,
        pendingVerifications: response.data
      }));
      
    } catch (error) {
      console.error('Pending verifications error:', error);
      setError(error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center min-h-screen">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">API Debug Page</h1>
        
        {/* Debug Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Debug Information</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>

        {/* Test Buttons */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">API Tests</h2>
          <div className="space-x-4">
            <button
              onClick={testAPI}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Verification API'}
            </button>
            
            <button
              onClick={testPropertyVerificationList}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Pending Verifications'}
            </button>
          </div>
        </div>

        {/* API Response */}
        {apiResponse && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">API Response</h2>
            <pre className="bg-green-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(apiResponse, null, 2)}
            </pre>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-medium text-red-900 mb-4">Error Details</h2>
            <pre className="bg-red-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(error, null, 2)}
            </pre>
          </div>
        )}

        {/* Environment Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Environment</h2>
          <div className="text-sm text-gray-600">
            <p><strong>API URL:</strong> {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003/api'}</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}