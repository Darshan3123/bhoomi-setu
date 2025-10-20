import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { toast } from 'react-toastify';
import Link from 'next/link';

export default function KYCUpload() {
  const router = useRouter();
  const { user, isAuthenticated, loading, api } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    aadhaarNumber: '',
    panNumber: ''
  });

  // File state
  const [files, setFiles] = useState({
    aadhaar: null,
    pan: null
  });

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [kycStatus, setKycStatus] = useState(null);
  const [kycLoading, setKycLoading] = useState(true);
  const [errors, setErrors] = useState({});

  // Check KYC status on load
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/');
    } else if (isAuthenticated) {
      checkKYCStatus();
    }
  }, [isAuthenticated, loading, router]);

  const checkKYCStatus = async () => {
    try {
      setKycLoading(true);
      const response = await api.get('/kyc/status');
      setKycStatus(response.data.kycStatus);
    } catch (error) {
      console.error('Error checking KYC status:', error);
      toast.error('Failed to check KYC status');
    } finally {
      setKycLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileChange = (e, fileType) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

    if (file.size > maxSize) {
      toast.error('File size must be less than 5MB');
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      toast.error('Only PDF, JPG, and PNG files are allowed');
      return;
    }

    setFiles(prev => ({
      ...prev,
      [fileType]: file
    }));

    // Clear error when file is selected
    if (errors[fileType]) {
      setErrors(prev => ({
        ...prev,
        [fileType]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate Aadhaar number
    const cleanAadhaar = formData.aadhaarNumber.replace(/\s/g, '');
    if (!cleanAadhaar) {
      newErrors.aadhaarNumber = 'Aadhaar number is required';
    } else if (!/^\d{12}$/.test(cleanAadhaar)) {
      newErrors.aadhaarNumber = 'Aadhaar number must be 12 digits';
    }

    // Validate PAN number
    const cleanPAN = formData.panNumber.toUpperCase().trim();
    if (!cleanPAN) {
      newErrors.panNumber = 'PAN number is required';
    } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanPAN)) {
      newErrors.panNumber = 'Invalid PAN format (e.g., ABCDE1234F)';
    }

    // Validate files
    if (!files.aadhaar) {
      newErrors.aadhaar = 'Aadhaar document is required';
    }
    if (!files.pan) {
      newErrors.pan = 'PAN document is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('aadhaarNumber', formData.aadhaarNumber.replace(/\s/g, ''));
      uploadFormData.append('panNumber', formData.panNumber.toUpperCase().trim());
      uploadFormData.append('aadhaar', files.aadhaar);
      uploadFormData.append('pan', files.pan);

      const response = await api.post('/kyc/upload-documents', uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        toast.success('KYC documents uploaded successfully! Awaiting admin verification.');
        // Refresh KYC status
        await checkKYCStatus();
      } else {
        throw new Error(response.data.error || 'Upload failed');
      }

    } catch (error) {
      console.error('KYC upload error:', error);
      toast.error(error.response?.data?.error || error.message || 'Failed to upload KYC documents');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !isAuthenticated || kycLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="KYC Verification - Bhoomi Setu">
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">KYC Verification</h1>
            <p className="mt-2 text-gray-600">
              Upload your identity documents for verification to enable property registration
            </p>
          </div>

          {/* Current KYC Status */}
          {kycStatus && (
            <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Status</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Aadhaar Status */}
                <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                  <div className={`w-4 h-4 rounded-full mr-3 ${kycStatus.aadhaarUploaded ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <div>
                    <p className="font-medium text-gray-900">Address Proof</p>
                    <p className="text-sm text-gray-600">
                      {kycStatus.aadhaarUploaded ? 'Uploaded' : 'Not Uploaded'}
                    </p>
                  </div>
                </div>

                {/* PAN Status */}
                <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                  <div className={`w-4 h-4 rounded-full mr-3 ${kycStatus.panUploaded ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <div>
                    <p className="font-medium text-gray-900">PAN Card</p>
                    <p className="text-sm text-gray-600">
                      {kycStatus.panUploaded ? 'Uploaded' : 'Not Uploaded'}
                    </p>
                  </div>
                </div>

                {/* Verification Status */}
                <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                  <div className={`w-4 h-4 rounded-full mr-3 ${
                    kycStatus.verified ? 'bg-green-500' : 'bg-yellow-500'
                  }`}></div>
                  <div>
                    <p className="font-medium text-gray-900">Verification</p>
                    <p className="text-sm text-gray-600">
                      {kycStatus.verified ? 'Verified' : 'Pending'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Rejection Reason */}
              {kycStatus.rejectionReason && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-red-400 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h4 className="text-sm font-medium text-red-800">KYC Rejected</h4>
                      <p className="text-sm text-red-700 mt-1">{kycStatus.rejectionReason}</p>
                      <p className="text-sm text-red-700 mt-1">Please re-upload your documents with the correct information.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {kycStatus.verified && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h4 className="text-sm font-medium text-green-800">KYC Verified Successfully!</h4>
                      <p className="text-sm text-green-700 mt-1">You can now add properties to the blockchain registry.</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Link
                      href="/add-property"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      Add Property Now
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Upload Form */}
          {(!kycStatus?.verified) && (
            <div className="bg-white shadow-lg rounded-lg">
              <form onSubmit={handleSubmit}>
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    {kycStatus?.aadhaarUploaded && kycStatus?.panUploaded ? 'Re-upload' : 'Upload'} KYC Documents
                  </h2>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {/* Aadhaar Number */}
                    <div>
                      <label htmlFor="aadhaarNumber" className="block text-sm font-medium text-gray-700">
                        Aadhaar Number *
                      </label>
                      <input
                        type="text"
                        name="aadhaarNumber"
                        id="aadhaarNumber"
                        value={formData.aadhaarNumber}
                        onChange={handleInputChange}
                        className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                          errors.aadhaarNumber ? 'border-red-300' : ''
                        }`}
                        placeholder="1234 5678 9012"
                        maxLength="14"
                      />
                      {errors.aadhaarNumber && <p className="mt-1 text-sm text-red-600">{errors.aadhaarNumber}</p>}
                    </div>

                    {/* PAN Number */}
                    <div>
                      <label htmlFor="panNumber" className="block text-sm font-medium text-gray-700">
                        PAN Number *
                      </label>
                      <input
                        type="text"
                        name="panNumber"
                        id="panNumber"
                        value={formData.panNumber}
                        onChange={handleInputChange}
                        className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                          errors.panNumber ? 'border-red-300' : ''
                        }`}
                        placeholder="ABCDE1234F"
                        maxLength="10"
                        style={{ textTransform: 'uppercase' }}
                      />
                      {errors.panNumber && <p className="mt-1 text-sm text-red-600">{errors.panNumber}</p>}
                    </div>

                    {/* Aadhaar Document Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Aadhaar Card Document *
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-indigo-400 transition-colors">
                        <div className="text-center">
                          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <div className="mt-4">
                            <label htmlFor="aadhaar" className="cursor-pointer">
                              <span className="mt-2 block text-sm font-medium text-gray-900">
                                {files.aadhaar ? files.aadhaar.name : 'Upload Aadhaar Card'}
                              </span>
                              <span className="mt-1 block text-xs text-gray-500">
                                PDF, JPG, PNG up to 5MB
                              </span>
                            </label>
                            <input
                              id="aadhaar"
                              name="aadhaar"
                              type="file"
                              className="sr-only"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => handleFileChange(e, 'aadhaar')}
                            />
                          </div>
                        </div>
                        {files.aadhaar && (
                          <div className="mt-4 flex items-center text-green-600">
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm">File selected</span>
                          </div>
                        )}
                      </div>
                      {errors.aadhaar && <p className="mt-1 text-sm text-red-600">{errors.aadhaar}</p>}
                    </div>

                    {/* PAN Document Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        PAN Card Document *
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-indigo-400 transition-colors">
                        <div className="text-center">
                          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <div className="mt-4">
                            <label htmlFor="pan" className="cursor-pointer">
                              <span className="mt-2 block text-sm font-medium text-gray-900">
                                {files.pan ? files.pan.name : 'Upload PAN Card'}
                              </span>
                              <span className="mt-1 block text-xs text-gray-500">
                                PDF, JPG, PNG up to 5MB
                              </span>
                            </label>
                            <input
                              id="pan"
                              name="pan"
                              type="file"
                              className="sr-only"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => handleFileChange(e, 'pan')}
                            />
                          </div>
                        </div>
                        {files.pan && (
                          <div className="mt-4 flex items-center text-green-600">
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm">File selected</span>
                          </div>
                        )}
                      </div>
                      {errors.pan && <p className="mt-1 text-sm text-red-600">{errors.pan}</p>}
                    </div>
                  </div>

                  {/* Information Box */}
                  <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <h4 className="text-sm font-medium text-blue-900 mb-1">Important Information</h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                          <li>• Documents will be securely stored on IPFS</li>
                          <li>• Admin verification typically takes 24-48 hours</li>
                          <li>• Ensure documents are clear and readable</li>
                          <li>• Both documents are required to enable property registration</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="mt-6 flex justify-between">
                    <Link
                      href="/user/dashboard"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      Back to Dashboard
                    </Link>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          Upload Documents
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}