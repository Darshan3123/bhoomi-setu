import { useState } from 'react';
import DocumentViewer from '../DocumentViewer';

export default function DocumentViewerButton({ 
  userId, 
  documentType, 
  documentHash,
  buttonText,
  buttonClass = "inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50",
  icon = true
}) {
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const getDocumentTypeLabel = () => {
    switch (documentType) {
      case 'aadhaar':
        return 'Address Proof';
      case 'pan':
        return 'PAN Card';
      default:
        return 'Document';
    }
  };

  return (
    <>
      <button
        onClick={() => setIsViewerOpen(true)}
        className={buttonClass}
      >
        {icon && (
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        )}
        {buttonText || `View ${getDocumentTypeLabel()}`}
      </button>

      <DocumentViewer
        userId={userId}
        documentType={documentType}
        documentHash={documentHash}
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
      />
    </>
  );
}