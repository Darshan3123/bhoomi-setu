import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../contexts/AuthContext';
import Layout from '../../../components/Layout';
import { toast } from 'react-toastify';
import Link from 'next/link';

export default function InspectorCaseDetails() {
  const router = useRouter();
  const { requestId } = router.query;
  const { user, api, isAuthenticated } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [caseData, setCaseData] = useState(null);
  const [schedulingVisit, setSchedulingVisit] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    scheduledDate: '',
    notes: ''
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
      return;
    }

    if (user?.role !== 'inspector') {
      toast.error('Access denied. Inspector role required.');
      router.push('/');
      return;
    }

    if (requestId) {
      fetchCaseDetails();
    }
  }, [isAuthenticated, user, requestId, router]);

  const fetchCaseDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/inspector/case/${requestId}`);
      
      if (response.data.success) {
        setCaseData(response.data.case);
      } else {
        toast.error('Failed to load case details');
        router.push('/inspector/dashboard');
      }
    } catch (error) {
      console.error('Case details fetch error:', error);
      toast.error('Failed to load case details');
      router.push('/inspector/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleVisit = async (e) => {
    e.preventDefault();
    
    try {
      setSchedulingVisit(true);
      
      const response = await api.put(`/inspector/case/${requestId}/schedule-visit`, scheduleForm);
      
      if (response.data.success) {
        toast.success('Site visit scheduled successfully!');
        setShowScheduleForm(false);
        setScheduleForm({ scheduledDate: '', notes: '' });
        fetchCaseDetails(); // Refresh case data
      } else {
        toast.error('Failed to schedule visit');
      }
    } catch (error) {
      console.error('Schedule visit error:', error);
      toast.error('Failed to schedule visit');
    } finally {
      setSchedulingVisit(false);
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

  const getDocumentIcon = (type) => {
    const icons = {
      'property_deed': '📜',
      'survey_report': '📊',
      'tax_receipt': '🧾',
      'identity_proof': '🆔',
      'other': '📄'
    };
    return icons[type] || '📄';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  if (!caseData) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Case Not Found</h1>
            <p className="mt-2 text-gray-600">The requested case could not be found.</p>
            <Link href="/inspector/dashboard" className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Case #{caseData.requestId}</h1>
              <p className="mt-2 text-gray-600">Land ID: {caseData.landId}</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(caseData.status)}`}>
                {caseData.status.replace('_', ' ').toUpperCase()}
              </span>
              <Link 
                href="/inspector/dashboard"
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Case Information */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Case Information</h2>
              </div>
              <div className="px-6 py-4">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Request ID</dt>
                    <dd className="mt-1 text-sm text-gray-900">#{caseData.requestId}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Land ID</dt>
                    <dd className="mt-1 text-sm text-gray-900">{caseData.landId}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="mt-1">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(caseData.status)}`}>
                        {caseData.status.replace('_', ' ')}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Created Date</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(caseData.createdAt).toLocaleDateString()}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Parties Information */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Parties Involved</h2>
              </div>
              <div className="px-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Seller */}
                  <div className="border rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Seller (From)</h3>
                    <dl className="space-y-2">
                      <div>
                        <dt className="text-xs font-medium text-gray-500">Name</dt>
                        <dd className="text-sm text-gray-900">{caseData.seller?.name || 'Unknown'}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500">Wallet Address</dt>
                        <dd className="text-sm text-gray-900 font-mono break-all">
                          {caseData.fromAddress}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500">Email</dt>
                        <dd className="text-sm text-gray-900">{caseData.seller?.email || 'N/A'}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500">Phone</dt>
                        <dd className="text-sm text-gray-900">{caseData.seller?.phone || 'N/A'}</dd>
                      </div>
                    </dl>
                  </div>

                  {/* Buyer */}
                  <div className="border rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Buyer (To)</h3>
                    <dl className="space-y-2">
                      <div>
                        <dt className="text-xs font-medium text-gray-500">Name</dt>
                        <dd className="text-sm text-gray-900">{caseData.buyer?.name || 'Unknown'}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500">Wallet Address</dt>
                        <dd className="text-sm text-gray-900 font-mono break-all">
                          {caseData.toAddress}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500">Email</dt>
                        <dd className="text-sm text-gray-900">{caseData.buyer?.email || 'N/A'}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500">Phone</dt>
                        <dd className="text-sm text-gray-900">{caseData.buyer?.phone || 'N/A'}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Property Documents</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Documents uploaded for this property transfer
                </p>
              </div>
              <div className="px-6 py-4">
                {caseData.documents && caseData.documents.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {caseData.documents.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">{getDocumentIcon(doc.type)}</span>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {doc.type.replace('_', ' ').toUpperCase()}
                            </p>
                            <p className="text-xs text-gray-500">
                              Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                            </p>
                            {doc.filename && (
                              <p className="text-xs text-gray-500">File: {doc.filename}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <a
                            href={`${process.env.NEXT_PUBLIC_API_URL}/documents/view/${doc.ipfsHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            View Document
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No documents uploaded</p>
                )}
              </div>
            </div>

            {/* Inspection Report */}
            {caseData.inspectionReport && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Inspection Report</h2>
                </div>
                <div className="px-6 py-4">
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Recommendation</dt>
                      <dd className="mt-1">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          caseData.inspectionReport.recommendation === 'approve' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {caseData.inspectionReport.recommendation.toUpperCase()}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Submitted Date</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {new Date(caseData.inspectionReport.submittedAt).toLocaleDateString()}
                      </dd>
                    </div>
                    {caseData.inspectionReport.notes && (
                      <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-gray-500">Notes</dt>
                        <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                          {caseData.inspectionReport.notes}
                        </dd>
                      </div>
                    )}
                  </dl>
                  
                  {caseData.inspectionReport.ipfsHash && (
                    <div className="mt-4">
                      <a
                        href={`${process.env.NEXT_PUBLIC_API_URL}/documents/view/${caseData.inspectionReport.ipfsHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
                      >
                        📄 View Inspection Report
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Actions</h3>
              </div>
              <div className="px-6 py-4 space-y-3">
                {caseData.status === 'pending' && (
                  <button
                    onClick={() => setShowScheduleForm(true)}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    📅 Schedule Site Visit
                  </button>
                )}
                
                {caseData.status === 'pending' && !caseData.inspectionReport && (
                  <Link
                    href={`/inspector/case/${requestId}/report`}
                    className="block w-full bg-green-600 text-white text-center px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                  >
                    📝 Submit Inspection Report
                  </Link>
                )}

                <Link
                  href="/inspector/dashboard"
                  className="block w-full bg-gray-600 text-white text-center px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                >
                  ← Back to Dashboard
                </Link>
              </div>
            </div>

            {/* Case Timeline */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Case Timeline</h3>
              </div>
              <div className="px-6 py-4">
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">Case Created</p>
                      <p className="text-xs text-gray-500">
                        {new Date(caseData.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  {caseData.status !== 'pending' && (
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">Inspector Assigned</p>
                        <p className="text-xs text-gray-500">You were assigned to this case</p>
                      </div>
                    </div>
                  )}

                  {caseData.status === 'pending' && (
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-2 h-2 bg-yellow-600 rounded-full mt-2"></div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">Site Visit Scheduled</p>
                        <p className="text-xs text-gray-500">Awaiting inspection report</p>
                      </div>
                    </div>
                  )}

                  {caseData.inspectionReport && (
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">Inspection Completed</p>
                        <p className="text-xs text-gray-500">
                          {new Date(caseData.inspectionReport.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Schedule Visit Modal */}
        {showScheduleForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Schedule Site Visit</h3>
                <form onSubmit={handleScheduleVisit}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Scheduled Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={scheduleForm.scheduledDate}
                      onChange={(e) => setScheduleForm({...scheduleForm, scheduledDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={scheduleForm.notes}
                      onChange={(e) => setScheduleForm({...scheduleForm, notes: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Add any notes about the scheduled visit..."
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowScheduleForm(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={schedulingVisit}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {schedulingVisit ? 'Scheduling...' : 'Schedule Visit'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}