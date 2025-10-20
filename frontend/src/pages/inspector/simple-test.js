import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../../components/Layout';

export default function SimpleTest() {
  const { user, api, isAuthenticated } = useAuth();
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testAPI = async () => {
    setLoading(true);
    setResult('Testing...');
    
    try {
      // Test basic inspector cases first
      const response = await api.get('/inspector/cases');
      setResult(`SUCCESS: ${JSON.stringify(response.data, null, 2)}`);
    } catch (error) {
      setResult(`ERROR: ${error.message}\nStatus: ${error.response?.status}\nData: ${JSON.stringify(error.response?.data, null, 2)}`);
    } finally {
      setLoading(false);
    }
  };

  const testVerificationAPI = async () => {
    setLoading(true);
    setResult('Testing verification API...');
    
    try {
      const response = await api.get('/properties/inspector/pending');
      setResult(`SUCCESS: ${JSON.stringify(response.data, null, 2)}`);
    } catch (error) {
      setResult(`ERROR: ${error.message}\nStatus: ${error.response?.status}\nData: ${JSON.stringify(error.response?.data, null, 2)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Simple API Test</h1>
        
        <div className="mb-4">
          <p><strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
          <p><strong>User Role:</strong> {user?.role || 'None'}</p>
          <p><strong>API Base:</strong> {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api'}</p>
        </div>

        <div className="space-x-4 mb-4">
          <button
            onClick={testAPI}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Test Inspector Cases API
          </button>
          
          <button
            onClick={testVerificationAPI}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Test Verification API
          </button>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-bold mb-2">Result:</h3>
          <pre className="whitespace-pre-wrap text-sm">{result || 'Click a button to test'}</pre>
        </div>
      </div>
    </Layout>
  );
}