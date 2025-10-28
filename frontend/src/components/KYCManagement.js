import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import DocumentViewerButton from './admin/DocumentViewerButton';

export default function KYCManagement() {
  const { token } = useAuth();
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    verified: 0,
    rejected: 0
  });


  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003/api';

  useEffect(() => {
    fetchKYCData();
  }, []);

  const fetchKYCData = async () => {
    setLoading(true);
    try {
      // Fetch all users (not just pending)
      const usersResponse = await fetch(`${API_BASE_URL}/auth/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        if (usersData.success) {
          const users = usersData.users;
          setAllUsers(users);
          
          // Calculate stats from all users
          setStats({
            total: users.length,
            pending: users.filter(u => !u.kycVerified && (u.hasAadhaar || u.hasPan)).length,
            verified: users.filter(u => u.kycVerified).length,
            rejected: users.filter(u => u.kycRejected).length || 0
          });
        }
      }

    } catch (err) {
      setError('Failed to fetch KYC data');
      console.error('Fetch KYC data error:', err);
    } finally {
      setLoading(false);
    }
  };



  const handleVerifyKYC = async (userId, verified, rejectionReason = '') => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/admin/verify-kyc/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ verified, rejectionReason })
      });

      const data = await response.json();
      if (data.success) {
        // Update the user in local state instead of refetching all data
        setAllUsers(users => users.map(user => 
          user.id === userId 
            ? { ...user, kycVerified: verified, kycRejected: !verified }
            : user
        ));
        
        // Update stats
        const updatedUsers = allUsers.map(user => 
          user.id === userId 
            ? { ...user, kycVerified: verified, kycRejected: !verified }
            : user
        );
        setStats({
          total: updatedUsers.length,
          pending: updatedUsers.filter(u => !u.kycVerified && !u.kycRejected && (u.hasAadhaar || u.hasPan)).length,
          verified: updatedUsers.filter(u => u.kycVerified).length,
          rejected: updatedUsers.filter(u => u.kycRejected).length
        });
        
        alert(`KYC ${verified ? 'approved' : 'rejected'} successfully!`);
      } else {
        alert(data.error || 'Failed to update KYC status');
      }
    } catch (err) {
      alert('Network error occurred');
      console.error('Verify KYC error:', err);
    }
  };

  // Filter users based on status
  const filteredUsers = allUsers.filter(user => {
    // Only show users who have submitted documents
    if (!user.hasAadhaar && !user.hasPan) return false;
    
    switch (filterStatus) {
      case 'pending':
        return !user.kycVerified && !user.kycRejected;
      case 'verified':
        return user.kycVerified;
      case 'rejected':
        return user.kycRejected;
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <p className="mt-2 text-gray-600">Loading KYC data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchKYCData}
          className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KYC Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.total}</dd>
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
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Review</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.pending}</dd>
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
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Verified</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.verified}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Rejected</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.rejected}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">KYC Document Review Process</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>Review user-submitted documents carefully. All documents are stored securely on IPFS blockchain. Approve only if documents are clear, valid, and match the user information.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">KYC Document Management</h3>
          <div className="flex items-center space-x-4">
            <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">
              Filter by Status:
            </label>
            <select
              id="status-filter"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="all">All Documents</option>
              <option value="pending">Pending Review</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* All KYC Documents */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            KYC Documents ({filteredUsers.length})
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {filterStatus === 'all' ? 'All submitted documents' : 
             filterStatus === 'pending' ? 'Documents awaiting review' :
             filterStatus === 'verified' ? 'Approved documents' : 'Rejected documents'}
          </p>
        </div>

        {filteredUsers.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <div key={user.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* User Info */}
                    <div className="flex items-center mb-4">
                      <div className="h-12 w-12 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-lg">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-lg font-medium text-gray-900">{user.name}</h4>
                            <p className="text-sm text-gray-500">{user.walletAddress}</p>
                            <p className="text-xs text-gray-400">
                              Registered: {new Date(user.registeredAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              user.kycVerified 
                                ? 'bg-green-100 text-green-800' 
                                : user.kycRejected 
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {user.kycVerified ? '✅ Verified' : user.kycRejected ? '❌ Rejected' : '⏳ Pending'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* User Details Grid */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-6">
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Contact Information</h5>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><span className="font-medium">Email:</span> {user.email}</p>
                          <p><span className="font-medium">Phone:</span> {user.phone}</p>
                        </div>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Identity Information</h5>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><span className="font-medium">Aadhaar:</span> {user.aadhaarNumber !== 'N/A' ? user.aadhaarNumber : 'N/A'}</p>
                          <p><span className="font-medium">PAN:</span> {user.panNumber}</p>
                        </div>
                      </div>
                    </div>

                    {/* Documents Status */}
                    <div className="mb-6">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Documents Submitted</h5>
                      <div className="flex space-x-4">
                        <div className={`flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          user.hasAadhaar ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.hasAadhaar ? '✅' : '❌'} Address Proof
                        </div>
                        <div className={`flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          user.hasPan ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.hasPan ? '✅' : '❌'} PAN Card
                        </div>
                      </div>
                    </div>

                    {/* Document Access */}
                    <div className="mb-6">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Document Access</h5>
                      <div className="text-sm text-gray-600 mb-3">
                        <p>📁 Documents are stored securely on IPFS blockchain</p>
                        <p>🔒 Click buttons below to view uploaded documents</p>
                      </div>
                      <div className="flex space-x-3">
                        {user.hasAadhaar && (
                          <DocumentViewerButton
                            userId={user.id}
                            documentType="aadhaar"
                            buttonText="View Address Proof"
                            buttonClass="inline-flex items-center px-3 py-2 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100"
                          />
                        )}
                        {user.hasPan && (
                          <DocumentViewerButton
                            userId={user.id}
                            documentType="pan"
                            buttonText="View PAN Card"
                            buttonClass="inline-flex items-center px-3 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  {user.kycVerified ? (
                    // Verified user - show revoke option
                    <button
                      onClick={() => {
                        const reason = prompt('Please provide a reason for revoking KYC verification:');
                        if (reason && reason.trim()) {
                          handleVerifyKYC(user.id, false, reason.trim());
                        }
                      }}
                      className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Revoke Verification
                    </button>
                  ) : user.kycRejected ? (
                    // Rejected user - show approve option
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to approve KYC for ${user.name}?`)) {
                          handleVerifyKYC(user.id, true);
                        }
                      }}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Approve KYC
                    </button>
                  ) : (
                    // Pending user - show both options
                    <>
                      <button
                        onClick={() => {
                          const reason = prompt('Please provide a reason for rejection:');
                          if (reason && reason.trim()) {
                            handleVerifyKYC(user.id, false, reason.trim());
                          }
                        }}
                        className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Reject KYC
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to approve KYC for ${user.name}?`)) {
                            handleVerifyKYC(user.id, true);
                          }
                        }}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Approve KYC
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Documents Found</h3>
            <p className="text-sm text-gray-600">
              {filterStatus === 'all' ? 'No users have submitted KYC documents yet.' :
               filterStatus === 'pending' ? 'No pending KYC documents to review at this time.' :
               filterStatus === 'verified' ? 'No verified KYC documents found.' : 'No rejected KYC documents found.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}