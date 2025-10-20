import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { useWeb3 } from "@/contexts/Web3Context";
import Layout from "@/components/Layout";
import LoadingSpinner from "@/components/LoadingSpinner";
import { toast } from "react-toastify";

export default function Profile() {
  const router = useRouter();
  const { user, isAuthenticated, loading, uploadKYC, getKYCStatus } = useAuth();
  const { account } = useWeb3();

  const [kycStatus, setKycStatus] = useState(null);
  const [kycLoading, setKycLoading] = useState(false);

  // KYC form state
  const [kycFiles, setKycFiles] = useState({
    aadhaar: null,
    pan: null,
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchKYCStatus();
    }
  }, [isAuthenticated]);

  const fetchKYCStatus = async () => {
    try {
      const status = await getKYCStatus();
      setKycStatus(status);
    } catch (error) {
      console.error("Error fetching KYC status:", error);
    }
  };

  const handleFileChange = (e, fileType) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size should be less than 5MB");
        return;
      }

      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "application/pdf",
      ];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Only JPG, PNG, and PDF files are allowed");
        return;
      }

      setKycFiles((prev) => ({
        ...prev,
        [fileType]: file,
      }));

      toast.success(
        `${
          fileType === "aadhaar" ? "Address Proof" : "PAN Card"
        } selected successfully`
      );
    }
  };

  const handleKYCSubmit = async () => {
    setKycLoading(true);
    try {
      // Check if both files are selected
      if (!kycFiles.aadhaar || !kycFiles.pan) {
        toast.error("Please select both documents before uploading");
        return;
      }

      const formData = new FormData();

      Object.keys(kycFiles).forEach((key) => {
        if (kycFiles[key]) {
          formData.append(key, kycFiles[key]);
        }
      });

      const success = await uploadKYC(formData);

      if (success) {
        await fetchKYCStatus();
        setKycFiles({
          aadhaar: null,
          pan: null,
        });
        toast.success("Documents uploaded successfully to IPFS!");
      } else {
        toast.error("Upload failed. Please try again.");
      }
    } catch (error) {
      console.error("Error uploading KYC:", error);
      toast.error("Upload error: " + error.message);
    } finally {
      setKycLoading(false);
    }
  };

  if (loading || !isAuthenticated) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Profile - Bhoomi Setu">
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
                <p className="text-sm text-gray-600">
                  Upload documents and confirm wallet
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Wallet Confirmation Card */}
            <div className="bg-white shadow rounded-lg mb-6">
              <div className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      Wallet Confirmation
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Connected Wallet: {account?.slice(0, 6)}...
                      {account?.slice(-4)}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      ✓ Wallet Connected
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Document Upload Card */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900">
                  Document Upload
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Upload your PAN Card and Address Proof for verification
                </p>
              </div>

              <div className="p-6">
                {/* Status Messages */}
                {kycStatus?.status === "verified" && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-green-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-green-800">
                          Documents Verified Successfully
                        </h3>
                        <div className="mt-2 text-sm text-green-700">
                          <p>Your documents have been verified and approved.</p>
                          <p className="text-xs mt-1">
                            📁 Documents securely stored on IPFS
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {kycStatus?.status === "pending" && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-yellow-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">
                          Documents Under Review
                        </h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <p>
                            Your documents are being reviewed. This process
                            usually takes 1-2 business days.
                          </p>
                          <p className="text-xs mt-1">
                            📁 Documents securely stored on IPFS
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Upload Section */}
                {kycStatus?.status !== "pending" && kycStatus?.status !== "verified" ? (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {/* Address Proof Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address Proof *
                      </label>
                      <p className="text-xs text-gray-500 mb-3">
                        Upload any address proof document (Aadhaar, Utility Bill,
                        Bank Statement, etc.)
                      </p>
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-indigo-400 transition-colors">
                        <div className="space-y-1 text-center">
                          <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            stroke="currentColor"
                            fill="none"
                            viewBox="0 0 48 48"
                          >
                            <path
                              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <div className="flex text-sm text-gray-600">
                            <label className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500">
                              <span>Upload a file</span>
                              <input
                                type="file"
                                className="sr-only"
                                accept="image/*,.pdf"
                                onChange={(e) => handleFileChange(e, "aadhaar")}
                              />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs text-gray-500">
                            PNG, JPG, PDF up to 5MB
                          </p>
                          {kycFiles.aadhaar && (
                            <p className="text-xs text-green-600 font-medium">
                              ✓ {kycFiles.aadhaar.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* PAN Card Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        PAN Card *
                      </label>
                      <p className="text-xs text-gray-500 mb-3">
                        Upload a clear image or PDF of your PAN Card
                      </p>
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-indigo-400 transition-colors">
                        <div className="space-y-1 text-center">
                          <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            stroke="currentColor"
                            fill="none"
                            viewBox="0 0 48 48"
                          >
                            <path
                              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <div className="flex text-sm text-gray-600">
                            <label className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500">
                              <span>Upload a file</span>
                              <input
                                type="file"
                                className="sr-only"
                                accept="image/*,.pdf"
                                onChange={(e) => handleFileChange(e, "pan")}
                              />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs text-gray-500">
                            PNG, JPG, PDF up to 5MB
                          </p>
                          {kycFiles.pan && (
                            <p className="text-xs text-green-600 font-medium">
                              ✓ {kycFiles.pan.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Disabled Upload Section */
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {/* Disabled Address Proof Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Address Proof *
                      </label>
                      <p className="text-xs text-gray-400 mb-3">
                        Document upload is disabled while your request is {kycStatus?.status === "pending" ? "under review" : "already verified"}
                      </p>
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-200 border-dashed rounded-md bg-gray-50">
                        <div className="space-y-1 text-center">
                          <svg
                            className="mx-auto h-12 w-12 text-gray-300"
                            stroke="currentColor"
                            fill="none"
                            viewBox="0 0 48 48"
                          >
                            <path
                              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <div className="text-sm text-gray-400">
                            <p>Upload disabled</p>
                          </div>
                          <p className="text-xs text-gray-400">
                            {kycStatus?.status === "pending" ? "Documents under review" : "Documents already verified"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Disabled PAN Card Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        PAN Card *
                      </label>
                      <p className="text-xs text-gray-400 mb-3">
                        Document upload is disabled while your request is {kycStatus?.status === "pending" ? "under review" : "already verified"}
                      </p>
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-200 border-dashed rounded-md bg-gray-50">
                        <div className="space-y-1 text-center">
                          <svg
                            className="mx-auto h-12 w-12 text-gray-300"
                            stroke="currentColor"
                            fill="none"
                            viewBox="0 0 48 48"
                          >
                            <path
                              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <div className="text-sm text-gray-400">
                            <p>Upload disabled</p>
                          </div>
                          <p className="text-xs text-gray-400">
                            {kycStatus?.status === "pending" ? "Documents under review" : "Documents already verified"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                {kycStatus?.status !== "verified" && kycStatus?.status !== "pending" && (
                  <div className="mt-8 flex justify-center">
                    <button
                      onClick={handleKYCSubmit}
                      disabled={
                        kycLoading || !kycFiles.aadhaar || !kycFiles.pan
                      }
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {kycLoading ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Uploading...
                        </>
                      ) : (
                        "Submit Documents"
                      )}
                    </button>
                  </div>
                )}

                {/* Status Message for Disabled Upload */}
                {(kycStatus?.status === "pending" || kycStatus?.status === "verified") && (
                  <div className="mt-8 flex justify-center">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-2">
                        {kycStatus?.status === "pending" 
                          ? "Your documents are currently under review by our admin team." 
                          : "Your documents have been verified and approved."}
                      </p>
                      <p className="text-xs text-gray-500">
                        {kycStatus?.status === "pending" 
                          ? "You cannot upload new documents while review is in progress." 
                          : "No further action is required."}
                      </p>
                    </div>
                  </div>
                )}

                {/* Instructions */}
                <div className="mt-8 bg-blue-50 border border-blue-200 rounded-md p-4">
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
                        Document Requirements
                      </h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <ul className="list-disc list-inside space-y-1">
                          <li>Documents should be clear and readable</li>
                          <li>File size should not exceed 5MB</li>
                          <li>Accepted formats: JPG, PNG, PDF</li>
                          <li>Both documents are required for verification</li>
                          <li>
                            📁 All documents are securely stored on IPFS
                            blockchain
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
