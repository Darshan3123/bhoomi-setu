import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/admin/AdminLayout';
import { toast } from 'react-toastify';

export default function AdminCases() {
  const { user, api, isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState([]);
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
      
      // Fetch cases and inspectors in parallel
      const [casesResponse, inspectorsResponse] = await Promise.all([
        api.get('/cases/my-cases'), // Admin sees all cases
        api.get('/cases/available-inspectors')
      ]);

      if (casesResponse.data.success) {
        setCases(casesResponse.data.cases || []);
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

  const handleAssignInspector = async (caseId, requestId) => {
    if (!selectedInspector) {
      toast.error('Please select an inspector');
      return;
    }

    try {
      setAssigningInspector(requestId);
      
      const response = await api.post(`/cases/${requestId}/assign-inspector`, {
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
      'inspection_scheduled': 'bg-blue-100 text-blue-800',
      'inspected': 'bg-green-100 text-green-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'completed': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'pending': '⏳',
      'inspection_scheduled': '📅',
      'inspected': '✅',
      'approved': '✅',
      'rejected': '❌',
      'completed': '🏁'
    };
    return icons[status] || '📋';
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
          <h1 className="text-3xl font-bold text-gray-900">Case Management</h1>
          <p className="mt-2 text-gray-600">
            Manage property transfer cases and assign inspectors
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">📋</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Cases</p>
                <p className="text-2xl font-semibold text-gray-900">{cases.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 font-semibold">⏳</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {cases.filter(c => c.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">📅</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">In Progress</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {cases.filter(c => ['inspection_scheduled', 'inspected'].includes(c.status)).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-semibold">✅</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {cases.filter(c => ['approved', 'completed'].includes(c.status)).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Available Inspectors Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-blue-600 text-xl">👨‍💼</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Available Inspectors</h3>
              <p className="text-sm text-blue-700">
                {inspectors.length} verified inspectors available for case assignment
              </p>
            </div>
          </div>
        </div>

        {/* Cases Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Property Transfer Cases</h3>
            <p className="mt-1 text-sm text-gray-500">
              Manage and assign inspectors to property transfer cases
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Case Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Parties
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Inspector
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cases.length > 0 ? (
                  cases.map((caseItem) => (
                    <tr key={caseItem.requestId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-lg mr-2">{getStatusIcon(caseItem.status)}</span>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              Case #{caseItem.requestId}
                            </div>
                            <div className="text-sm text-gray-500">
                              Land ID: {caseItem.landId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <div className="mb-1">
                            <span className="font-medium">From:</span> {caseItem.fromAddress.slice(0, 8)}...
                          </div>
                          <div>
                            <span className="font-medium">To:</span> {caseItem.toAddress.slice(0, 8)}...
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(caseItem.status)}`}>
                          {caseItem.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {caseItem.inspectorAddress ? (
                          <div className="text-sm text-gray-900">
                            <div className="font-medium text-blue-600">Assigned</div>
                            <div className="text-xs text-gray-500 font-mono">
                              {caseItem.inspectorAddress.slice(0, 8)}...
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Not assigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(caseItem.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {caseItem.status === 'pending' && !caseItem.inspectorAddress && (
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
                              onClick={() => handleAssignInspector(caseItem._id, caseItem.requestId)}
                              disabled={assigningInspector === caseItem.requestId || !selectedInspector}
                              className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 disabled:opacity-50"
                            >
                              {assigningInspector === caseItem.requestId ? 'Assigning...' : 'Assign'}
                            </button>
                          </div>
                        )}
                        
                        {caseItem.inspectorAddress && (
                          <span className="text-green-600 text-xs">✅ Inspector Assigned</span>
                        )}
                        
                        {caseItem.status === 'inspected' && (
                          <div className="space-y-1">
                            <button className="block text-green-600 hover:text-green-900 text-xs">
                              View Report
                            </button>
                            <button className="block text-blue-600 hover:text-blue-900 text-xs">
                              Approve/Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                      No cases found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Inspector List */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Available Inspectors</h3>
            <p className="mt-1 text-sm text-gray-500">
              List of verified inspectors and their current workload
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Inspector
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Workload
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inspectors.map((inspector) => (
                  <tr key={inspector.walletAddress} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-sm">👨‍💼</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{inspector.name}</div>
                          <div className="text-sm text-gray-500 font-mono">
                            {inspector.walletAddress.slice(0, 8)}...{inspector.walletAddress.slice(-6)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{inspector.email}</div>
                      <div className="text-sm text-gray-500">{inspector.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div>Pending: {inspector.stats.pendingCases}</div>
                        <div>Total: {inspector.stats.totalAssigned}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        Completed: {inspector.stats.completedCases}
                      </div>
                      <div className={`text-xs ${
                        inspector.stats.workload <= 2 ? 'text-green-600' : 
                        inspector.stats.workload <= 5 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {inspector.stats.workload <= 2 ? '🟢 Available' : 
                         inspector.stats.workload <= 5 ? '🟡 Busy' : '🔴 Overloaded'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}