import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/admin/AdminLayout';
import { toast } from 'react-toastify';

export default function PropertyVerifications() {
  const { user, api, isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [verifications, setVerifications] = useState([]);
  const [inspectors, setInspectors] = useState([]);
  const [assigningInspector, setAssigningInspector] = useState(null);
  const [selectedInspector, setSelectedInspector] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
      return;
    }

    if (user?.role !== 'admin') {
      toast.error('Access denied. Admin role required.');
      router.push('/');
      return;
    }

    fetchData();
  }, [isAuthenticated, user, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch pending verifications and inspectors in parallel
      const [verificationsResponse, inspectorsResponse] = await Promise.all([
        api.get('/properties/admin/pending-verifications'),
        api.get('/cases/available-inspectors')
      ]);

      if (verificationsResponse.data.success) {
        setVerifications(verificationsResponse.data.verifications || []);
      }

      if (inspectorsResponse.data.success) {
        setInspectors(inspectorsResponse.data.inspectors || []);
      }

    } catch (error) {
      console.error('Fetch data error:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignInspector = async (verificationId) => {
    if (!selectedInspector) {
      toast.error('Please select an inspector');
      return;
    }

    try {
      setAssigningInspector(verificationId);
      
      const response = await api.post('/properties/admin/assign-inspector', {
        verificationId,
        inspectorAddress: selectedInspector
      });

      if (response.data.success) {
        toast.success('Inspector assigned successfully!');
        setSelectedInspector('');
        fetchData(); // Refresh data
      } else {
        toast.error('Failed to assign inspector');
      }
    } catch (error) {
      console.error('Assign inspector error:', error);
      toast.error('Failed to assign inspector');
    } finally {
      setAssigningInspector(null);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'assigned': 'bg-blue-100 text-blue-800',
      'inspection_scheduled': 'bg-blue-100 text-blue-800',
      'inspected': 'bg-green-100 text-green-800',
      'verified': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPropertyTypeIcon = (type) => {
    const icons = {
      'Residential': '🏠',
      'Commercial': '🏢',
      'Agricultural': '🌾',
      'Industrial': '🏭'
    };
    return icons[type] || '🏠';
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Property Verifications</h1>
          <p className="mt-2 text-gray-600">
            Manage property verification requests and assign inspectors
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 font-semibold">📋</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Verifications</p>
                <p className="text-2xl font-semibold text-gray-900">{verifications.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">👨‍💼</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Available Inspectors</p>
                <p className="text-2xl font-semibold text-gray-900">{inspectors.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-semibold">🏠</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Residential</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {verifications.filter(v => v.propertyDetails.propertyType === 'Residential').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-semibold">🏢</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Commercial</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {verifications.filter(v => v.propertyDetails.propertyType === 'Commercial').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Verifications Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Pending Property Verifications</h3>
            <p className="mt-1 text-sm text-gray-500">
              Assign inspectors to property verification requests
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location & Area
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Documents
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {verifications.length > 0 ? (
                  verifications.map((verification) => (
                    <tr key={verification.verificationId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">
                            {getPropertyTypeIcon(verification.propertyDetails.propertyType)}
                          </span>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {verification.propertyDetails.surveyNumber}
                            </div>
                            <div className="text-sm text-gray-500">
                              {verification.propertyDetails.propertyType}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <div className="font-medium">
                            {verification.owner?.name || 'Unknown'}
                          </div>
                          <div className="text-gray-500 font-mono text-xs">
                            {verification.ownerAddress.slice(0, 8)}...{verification.ownerAddress.slice(-6)}
                          </div>
                          <div className="text-gray-500 text-xs">
                            {verification.owner?.email || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <div className="font-medium">
                            {verification.propertyDetails.area} {verification.propertyDetails.areaUnit}
                          </div>
                          <div className="text-gray-500 text-xs max-w-xs truncate">
                            {verification.propertyDetails.location}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {verification.documents.length} files
                        </div>
                        <div className="text-xs text-gray-500">
                          {verification.documents.map(doc => doc.type).join(', ')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(verification.status)}`}>
                          {verification.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(verification.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {verification.status === 'pending' && (
                          <div className="flex items-center space-x-2">
                            <select
                              value={selectedInspector}
                              onChange={(e) => setSelectedInspector(e.target.value)}
                              className="text-xs border border-gray-300 rounded px-2 py-1"
                            >
                              <option value="">Select Inspector</option>
                              {inspectors.map((inspector) => (
                                <option key={inspector.walletAddress} value={inspector.walletAddress}>
                                  {inspector.name} ({inspector.stats.workload} pending)
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => handleAssignInspector(verification.verificationId)}
                              disabled={assigningInspector === verification.verificationId || !selectedInspector}
                              className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 disabled:opacity-50"
                            >
                              {assigningInspector === verification.verificationId ? 'Assigning...' : 'Assign'}
                            </button>
                          </div>
                        )}
                        
                        {verification.status !== 'pending' && (
                          <span className="text-green-600 text-xs">✅ Inspector Assigned</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                      No pending property verifications found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Inspector Workload */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Inspector Workload</h3>
            <p className="mt-1 text-sm text-gray-500">
              Current workload distribution among available inspectors
            </p>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inspectors.map((inspector) => (
                <div key={inspector.walletAddress} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{inspector.name}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      inspector.stats.workload <= 2 ? 'bg-green-100 text-green-800' : 
                      inspector.stats.workload <= 5 ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      {inspector.stats.workload} pending
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <div>Total: {inspector.stats.totalAssigned}</div>
                    <div>Completed: {inspector.stats.completedCases}</div>
                  </div>
                  <div className="text-xs text-gray-500 mt-2 font-mono">
                    {inspector.walletAddress.slice(0, 8)}...{inspector.walletAddress.slice(-6)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}