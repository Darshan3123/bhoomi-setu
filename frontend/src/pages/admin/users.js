import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/admin/AdminLayout';

export default function UsersManagement() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKyc, setFilterKyc] = useState('all');

  useEffect(() => {
    // Check if user is admin
    if (user && user.role !== 'admin') {
      router.push('/');
      return;
    }

    if (user && token) {
      fetchUsers();
    }
  }, [user, token, router]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';
      const response = await fetch(`${API_BASE_URL}/auth/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setUsers(data.users);
      } else {
        setError(data.error || 'Failed to fetch users');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Fetch users error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = async (userId, documentType) => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';
      
      // Fetch the user's document IPFS hash
      const response = await fetch(`${API_BASE_URL}/auth/admin/user-documents/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          const document = data.documents.find(doc => doc.type === documentType);
          
          if (document) {
            // Fetch the document with authentication and display it
            const documentResponse = await fetch(`${API_BASE_URL}/auth/admin/ipfs/${document.hash}`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });

            if (documentResponse.ok) {
              const blob = await documentResponse.blob();
              const url = URL.createObjectURL(blob);
              window.open(url, '_blank');
              
              // Clean up the URL after a delay
              setTimeout(() => URL.revokeObjectURL(url), 10000);
            } else {
              alert(`Failed to load document: ${documentResponse.status}`);
            }
          } else {
            alert(`${documentType === 'aadhaar' ? 'Address Proof' : 'PAN Card'} document not found`);
          }
        } else {
          alert('Failed to fetch document info: ' + data.error);
        }
      } else {
        alert(`Failed to fetch document info: ${response.status}`);
      }
    } catch (error) {
      console.error('View document error:', error);
      alert('Error viewing document: ' + error.message);
    }
  };



  // Filter users based on search term and KYC status
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.walletAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone.includes(searchTerm);
    
    const matchesKyc = filterKyc === 'all' || 
      (filterKyc === 'verified' && user.kycVerified) ||
      (filterKyc === 'pending' && !user.kycVerified);
    
    return matchesSearch && matchesKyc;
  });

  if (!user || user.role !== 'admin') {
    return (
      <AdminLayout title="Access Denied">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="User Management">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold">👥</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Users
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {users.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold">✅</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      KYC Verified
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {users.filter(u => u.kycVerified).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold">⏳</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Pending KYC
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {users.filter(u => !u.kycVerified).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                Search Users
              </label>
              <input
                type="text"
                id="search"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Search by name, email, wallet address, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="kyc-filter" className="block text-sm font-medium text-gray-700">
                Filter by KYC Status
              </label>
              <select
                id="kyc-filter"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={filterKyc}
                onChange={(e) => setFilterKyc(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="verified">KYC Verified</option>
                <option value="pending">Pending Verification</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Grid - Clean View */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              All Users ({filteredUsers.length})
            </h3>
            <p className="text-sm text-gray-500">
              Complete overview of all registered users in the system
            </p>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="mt-2 text-gray-600">Loading users...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-red-600">{error}</p>
              <button
                onClick={fetchUsers}
                className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <div key={user.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start space-x-6">
                    {/* User Avatar */}
                    <div className="flex-shrink-0">
                      <div className="h-16 w-16 rounded-full flex items-center justify-center text-white font-bold text-xl bg-gradient-to-r from-indigo-400 to-indigo-600">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    </div>

                    {/* User Information Grid */}
                    <div className="flex-1 grid grid-cols-1 gap-6 lg:grid-cols-3">
                      {/* Basic Info */}
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{user.name}</h4>
                          <p className="text-sm text-gray-500 font-mono">
                            {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-6)}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.kycVerified 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {user.kycVerified ? '✅ KYC Verified' : '⏳ Pending KYC'}
                          </span>
                        </div>
                      </div>

                      {/* Contact Information */}
                      <div className="space-y-3">
                        <h5 className="text-sm font-medium text-gray-700 uppercase tracking-wide">Contact Details</h5>
                        <div className="space-y-2">
                          <div className="flex items-center text-sm">
                            <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span className="text-gray-900">{user.email}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span className="text-gray-900">{user.phone}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V6a2 2 0 012-2h4a2 2 0 012 2v1m-6 0h8m-8 0H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-2" />
                            </svg>
                            <span className="text-gray-500 text-xs">
                              Registered: {new Date(user.registeredAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* KYC Documents */}
                      <div className="space-y-3">
                        <h5 className="text-sm font-medium text-gray-700 uppercase tracking-wide">Identity Documents</h5>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                            <div className="flex items-center text-sm">
                              <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span className="text-gray-700">Aadhaar:</span>
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {user.aadhaarNumber !== 'N/A' ? user.aadhaarNumber : 'Not Provided'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                            <div className="flex items-center text-sm">
                              <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span className="text-gray-700">PAN:</span>
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {user.panNumber || 'Not Provided'}
                            </span>
                          </div>
                          
                          {/* Document Status Indicators - Only show positive indicators */}
                          <div className="flex space-x-2 mt-2">
                            {user.hasAadhaar && (
                              <div className="flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                                📄 Address Proof
                              </div>
                            )}
                            {user.hasPan && (
                              <div className="flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                                🆔 PAN Card
                              </div>
                            )}
                          </div>

                          {/* Document View Buttons */}
                          {(user.hasAadhaar || user.hasPan) && (
                            <div className="flex space-x-2 mt-3 pt-3 border-t border-gray-200">
                              {user.hasAadhaar && (
                                <button
                                  onClick={() => handleViewDocument(user.id, 'aadhaar')}
                                  className="inline-flex items-center px-3 py-1.5 border border-green-300 text-xs font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                >
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  View Address Proof
                                </button>
                              )}
                              {user.hasPan && (
                                <button
                                  onClick={() => handleViewDocument(user.id, 'pan')}
                                  className="inline-flex items-center px-3 py-1.5 border border-blue-300 text-xs font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  View PAN Card
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {filteredUsers.length === 0 && (
                <div className="p-12 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No users found</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    No users match your current search and filter criteria.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}