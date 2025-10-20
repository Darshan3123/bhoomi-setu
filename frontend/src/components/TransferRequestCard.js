import { useState } from 'react';
import { toast } from 'react-toastify';

export default function TransferRequestCard({ case: transferCase }) {
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'inspection_scheduled':
        return '📅';
      case 'inspected':
        return '🔍';
      case 'approved':
      case 'completed':
        return '✅';
      case 'rejected':
        return '❌';
      default:
        return '📄';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusDescription = (status) => {
    switch (status) {
      case 'pending':
        return 'Waiting for admin to assign an inspector';
      case 'inspection_scheduled':
        return 'Inspector has been assigned and will visit the site';
      case 'inspected':
        return 'Site inspection completed, waiting for admin approval';
      case 'approved':
        return 'Transfer approved and ownership updated';
      case 'completed':
        return 'Transfer completed successfully';
      case 'rejected':
        return 'Transfer request has been rejected';
      default:
        return 'Status unknown';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-lg">{getStatusIcon(transferCase.status)}</span>
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-sm font-medium text-gray-900">
                Transfer Request #{transferCase.requestId}
              </h3>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transferCase.status)}`}>
                {transferCase.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            
            <p className="text-sm text-gray-600 mb-2">
              Land ID: {transferCase.landId}
            </p>
            
            <p className="text-xs text-gray-500">
              {getStatusDescription(transferCase.status)}
            </p>
          </div>
        </div>

        <div className="flex-shrink-0 text-right">
          <p className="text-xs text-gray-500">
            {formatDate(transferCase.createdAt)}
          </p>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="mt-1 text-xs text-indigo-600 hover:text-indigo-500"
          >
            {showDetails ? 'Hide' : 'Details'}
          </button>
        </div>
      </div>

      {showDetails && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
          {/* Transfer Details */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-gray-500">From:</span>
              <p className="font-mono text-gray-900">
                {transferCase.fromAddress.slice(0, 6)}...{transferCase.fromAddress.slice(-4)}
              </p>
            </div>
            <div>
              <span className="text-gray-500">To:</span>
              <p className="font-mono text-gray-900">
                {transferCase.toAddress.slice(0, 6)}...{transferCase.toAddress.slice(-4)}
              </p>
            </div>
          </div>

          {/* Inspector Info */}
          {transferCase.inspectorAddress && (
            <div>
              <span className="text-xs text-gray-500">Inspector:</span>
              <p className="text-xs font-mono text-gray-900">
                {transferCase.inspectorAddress.slice(0, 6)}...{transferCase.inspectorAddress.slice(-4)}
              </p>
            </div>
          )}

          {/* Rejection Reason */}
          {transferCase.status === 'rejected' && transferCase.rejectionReason && (
            <div className="bg-red-50 p-3 rounded-md">
              <span className="text-xs font-medium text-red-800">Rejection Reason:</span>
              <p className="text-xs text-red-700 mt-1">{transferCase.rejectionReason}</p>
            </div>
          )}

          {/* Documents */}
          {transferCase.documents && transferCase.documents.length > 0 && (
            <div>
              <span className="text-xs font-medium text-gray-900">Documents:</span>
              <div className="mt-1 space-y-1">
                {transferCase.documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">
                      {doc.type.replace('_', ' ')} ({doc.filename || 'Unknown'})
                    </span>
                    <button
                      onClick={() => toast.info('Document viewing feature coming soon')}
                      className="text-xs text-indigo-600 hover:text-indigo-500"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inspection Report */}
          {transferCase.inspectionReport && (
            <div className="bg-blue-50 p-3 rounded-md">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-blue-800">Inspection Report</span>
                <button
                  onClick={() => toast.info('Report viewing feature coming soon')}
                  className="text-xs text-blue-600 hover:text-blue-500"
                >
                  View Report
                </button>
              </div>
              <p className="text-xs text-blue-700">
                Recommendation: {transferCase.inspectionReport.recommendation}
              </p>
              {transferCase.inspectionReport.notes && (
                <p className="text-xs text-blue-600 mt-1">
                  Notes: {transferCase.inspectionReport.notes}
                </p>
              )}
            </div>
          )}

          {/* Recent Notifications */}
          {transferCase.notifications && transferCase.notifications.length > 0 && (
            <div>
              <span className="text-xs font-medium text-gray-900">Recent Updates:</span>
              <div className="mt-1 space-y-1">
                {transferCase.notifications.slice(-2).map((notification, index) => (
                  <div key={index} className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                    <p>{notification.message}</p>
                    <p className="text-gray-500 mt-1">
                      {formatDate(notification.sentAt)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-2">
            <button
              onClick={() => toast.info('Case details page coming soon')}
              className="flex-1 text-xs bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-3 py-2 rounded-md transition-colors"
            >
              View Full Details
            </button>
            
            {(transferCase.status === 'approved' || transferCase.status === 'completed') && (
              <button
                onClick={() => toast.info('Certificate download coming soon')}
                className="flex-1 text-xs bg-green-100 text-green-700 hover:bg-green-200 px-3 py-2 rounded-md transition-colors"
              >
                Download Certificate
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}