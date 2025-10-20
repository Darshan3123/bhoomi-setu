import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";

export default function DocumentViewer({ userId, userName, onClose }) {
  const { token } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDoc, setSelectedDoc] = useState(null);

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api";

  useEffect(() => {
    if (userId) {
      fetchUserDocuments();
    }
  }, [userId]);

  const fetchUserDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/auth/admin/user-documents/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDocuments(data.documents);
        } else {
          setError(data.error || "Failed to fetch documents");
        }
      } else {
        setError("Failed to fetch documents");
      }
    } catch (err) {
      setError("Failed to fetch documents");
      console.error("Fetch documents error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = (doc) => {
    setSelectedDoc(doc);
  };

  const handleDownloadDocument = (doc) => {
    // In a real implementation, this would download from IPFS
    alert(
      `Download functionality for ${doc.name} will be implemented with IPFS gateway integration`
    );
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              KYC Documents - {userName}
            </h3>
            <p className="text-sm text-gray-500">
              Review uploaded documents stored on IPFS
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="mt-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="mt-2 text-gray-600">Loading documents...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">{error}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Document List */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">
                  Uploaded Documents
                </h4>
                <div className="space-y-3">
                  {documents.map((doc, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="text-sm font-medium text-gray-900">
                            {doc.name}
                          </h5>
                          <p className="text-xs text-gray-500">
                            IPFS Hash: {doc.hash.slice(0, 20)}...
                          </p>
                          <p className="text-xs text-gray-400">
                            Uploaded:{" "}
                            {new Date(doc.uploadedAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewDocument(doc)}
                            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleDownloadDocument(doc)}
                            className="text-green-600 hover:text-green-800 text-sm font-medium"
                          >
                            Download
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* IPFS Information */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-blue-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">
                        IPFS Storage
                      </h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>
                          Documents are stored securely on IPFS (InterPlanetary
                          File System) ensuring:
                        </p>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>Immutable and tamper-proof storage</li>
                          <li>Decentralized access and availability</li>
                          <li>Content-addressed verification</li>
                          <li>Permanent document preservation</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Document Preview */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">
                  Document Preview
                </h4>
                {selectedDoc ? (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="text-center">
                      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-4">
                        <svg
                          className="h-8 w-8 text-gray-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <h5 className="text-lg font-medium text-gray-900 mb-2">
                        {selectedDoc.name}
                      </h5>
                      <p className="text-sm text-gray-600 mb-4">
                        IPFS Hash:{" "}
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                          {selectedDoc.hash}
                        </code>
                      </p>

                      {/* Mock Document Preview */}
                      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 mb-4">
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400 mb-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                          />
                        </svg>
                        <p className="text-gray-500 text-sm">
                          Document Preview
                        </p>
                        <p className="text-gray-400 text-xs mt-1">
                          {selectedDoc.type === "aadhaar"
                            ? "Address Proof Document"
                            : "PAN Card Document"}
                        </p>
                        <div className="mt-4 text-xs text-gray-500">
                          <p>📄 File Type: PDF/Image</p>
                          <p>🔒 Stored on IPFS</p>
                          <p>✅ Content Verified</p>
                        </div>
                      </div>

                      <div className="flex justify-center space-x-3">
                        <button
                          onClick={() => handleDownloadDocument(selectedDoc)}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          Download
                        </button>
                        <button
                          onClick={() =>
                            window.open(
                              `https://gateway.pinata.cloud/ipfs/${selectedDoc.hash}`,
                              "_blank"
                            )
                          }
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                          Open in IPFS Gateway
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg p-8 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400 mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    <p className="text-gray-500">
                      Select a document to preview
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
