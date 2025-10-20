import { useState } from 'react';
import { toast } from 'react-toastify';

export default function LandCard({ case: landCase }) {
  const [showDetails, setShowDetails] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'inspection_scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'inspected':
        return 'bg-purple-100 text-purple-800';
      case 'approved':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleViewCertificate = () => {
    // This would typically download or view the certificate
    toast.info('Certificate viewing feature coming soon');
  };

  const handleViewDocuments = () => {
    // This would show the documents
    setShowDetails(!showDetails);
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-gray-900">
            Land ID: {landCase.landId}
          </h3>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(landCase.status)}`}>
            {landCase.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>

        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Request ID:</span>
            <span className="font-mono">#{landCase.requestId}</span>
          </div>
          <div className="flex justify-between">
            <span>Created:</span>
            <span>{formatDate(landCase.createdAt)}</span>
          </div>
          {landCase.toAddress && (
            <div className="flex justify-between">
              <span>Transfer To:</span>
              <span className="font-mono text-xs">
                {landCase.toAddress.slice(0, 6)}...{landCase.toAddress.slice(-4)}
              </span>
            </div>
          )}
        </div>

        {showDetails && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Documents</h4>
            <div className="space-y-2">
              {landCase.documents && landCase.documents.length > 0 ? (
                landCase.documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">{doc.type.replace('_', ' ')}</span>
                    <button
                      onClick={() => toast.info('Document viewing feature coming soon')}
                      className="text-indigo-600 hover:text-indigo-500"
                    >
                      View
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500">No documents uploaded</p>
              )}
            </div>

            {landCase.inspectionReport && (
              <div className="mt-3">
                <h4 className="text-sm font-medium text-gray-900 mb-1">Inspection Report</h4>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">
                    Recommendation: {landCase.inspectionReport.recommendation}
                  </span>
                  <button
                    onClick={() => toast.info('Report viewing feature coming soon')}
                    className="text-indigo-600 hover:text-indigo-500"
                  >
                    View Report
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 flex space-x-2">
          <button
            onClick={handleViewDocuments}
            className="flex-1 text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 px-3 py-2 rounded-md transition-colors"
          >
            {showDetails ? 'Hide Details' : 'View Details'}
          </button>
          
          {(landCase.status === 'approved' || landCase.status === 'completed') && (
            <button
              onClick={handleViewCertificate}
              className="flex-1 text-xs bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-3 py-2 rounded-md transition-colors"
            >
              View Certificate
            </button>
          )}
        </div>
      </div>
    </div>
  );
}