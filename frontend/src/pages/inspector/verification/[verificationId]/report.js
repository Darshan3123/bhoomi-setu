import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../../contexts/AuthContext';
import Layout from '../../../../components/Layout';
import { toast } from 'react-toastify';
import Link from 'next/link';

export default function SubmitVerificationReport() {
  const router = useRouter();
  const { verificationId } = router.query;
  const { user, api, isAuthenticated } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [verificationData, setVerificationData] = useState(null);
  const [reportForm, setReportForm] = useState({
    recommendation: '',
    notes: '',
    visitDate: '',
    gpsLocation: '',
    reportFile: null
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

    if (verificationId) {
      fetchVerificationDetails();
    }
  }, [isAuthenticated, user, verificationId, router]);

  const fetchVerificationDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/property-verification/inspector/${verificationId}`);
      
      if (response.data.success) {
        const verification = response.data.verification;
        setVerificationData(verification);
        
        // Check if verification is in correct status
        if (!['pending'].includes(verification.verificationStatus)) {
          toast.error('Verification must be pending to submit report');
          router.push('/inspector/cases');
          return;
        }
        
        // Check if report already exists
        if (verification.inspectionReport) {
          toast.info('Inspection report already submitted for this verification');
          router.push('/inspector/cases');
          return;
        }
      } else {
        toast.error('Failed to load verification details');
        router.push('/inspector/cases');
      }
    } catch (error) {
      console.error('Verification details fetch error:', error);
      toast.error('Failed to load verification details');
      router.push('/inspector/cases');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/json'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Invalid file type. Please upload PDF, JPEG, PNG, or JSON files only.');
        e.target.value = '';
        return;
      }
      
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        e.target.value = '';
        return;
      }
      
      setReportForm({...reportForm, reportFile: file});
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const gpsLocation = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          setReportForm({...reportForm, gpsLocation});
          toast.success('GPS location captured successfully!');
        },
        (error) => {
          console.error('Geolocation error:', error);
          toast.error('Failed to get GPS location. Please enter manually if needed.');
        }
      );
    } else {
      toast.error('Geolocation is not supported by this browser.');
    }
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    
    if (!reportForm.recommendation) {
      toast.error('Please select a recommendation');
      return;
    }
    
    if (!reportForm.reportFile) {
      toast.error('Please upload an inspection report file');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('report', reportForm.reportFile);
      formData.append('recommendation', reportForm.recommendation);
      formData.append('notes', reportForm.notes);
      formData.append('visitDate', reportForm.visitDate);
      formData.append('gpsLocation', reportForm.gpsLocation);
      
      const response = await api.post(`/property-verification/inspector/${verificationId}/submit-report`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.success) {
        toast.success('Verification report submitted successfully!');
        router.push('/inspector/cases');
      } else {
        toast.error('Failed to submit verification report');
      }
    } catch (error) {
      console.error('Submit report error:', error);
      toast.error('Failed to submit verification report');
    } finally {
      setSubmitting(false);
    }
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

  if (!verificationData) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Verification Not Found</h1>
            <p className="mt-2 text-gray-600">The requested verification could not be found.</p>
            <Link href="/inspector/cases" className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              Back to Cases
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Submit Verification Report</h1>
              <p className="mt-2 text-gray-600">Verification #{verificationData.verificationId} - Property ID: {verificationData.surveyId}</p>
            </div>
            <Link 
              href="/inspector/cases"
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              Back to Cases
            </Link>
          </div>
        </div>

        {/* Property Summary */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Property Summary</h2>
          </div>
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Property Details</h3>
                <p className="text-sm text-gray-600">Survey ID: {verificationData.surveyId}</p>
                <p className="text-sm text-gray-600">Location: {verificationData.location}</p>
                <p className="text-sm text-gray-600">Area: {verificationData.area} {verificationData.areaUnit}</p>
                <p className="text-sm text-gray-600">Type: {verificationData.propertyType}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Owner</h3>
                <p className="text-sm text-gray-600">{verificationData.owner?.profile?.name || 'Unknown'}</p>
                <p className="text-xs text-gray-500 font-mono">{verificationData.ownerAddress}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Verification Report Form */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Verification Report</h2>
            <p className="mt-1 text-sm text-gray-500">
              Please provide your verification findings and recommendation
            </p>
          </div>
          
          <form onSubmit={handleSubmitReport} className="px-6 py-4 space-y-6">
            {/* Recommendation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recommendation <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="recommendation"
                    value="approve"
                    checked={reportForm.recommendation === 'approve'}
                    onChange={(e) => setReportForm({...reportForm, recommendation: e.target.value})}
                    className="mr-2"
                  />
                  <span className="text-green-600 font-medium">✅ Approve Verification</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="recommendation"
                    value="reject"
                    checked={reportForm.recommendation === 'reject'}
                    onChange={(e) => setReportForm({...reportForm, recommendation: e.target.value})}
                    className="mr-2"
                  />
                  <span className="text-red-600 font-medium">❌ Reject Verification</span>
                </label>
              </div>
            </div>

            {/* Visit Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Site Visit Date
              </label>
              <input
                type="date"
                value={reportForm.visitDate}
                onChange={(e) => setReportForm({...reportForm, visitDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* GPS Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GPS Location (Latitude, Longitude)
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={reportForm.gpsLocation}
                  onChange={(e) => setReportForm({...reportForm, gpsLocation: e.target.value})}
                  placeholder="e.g., 28.613939, 77.209021"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 whitespace-nowrap"
                >
                  📍 Get Current Location
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                GPS location helps verify that the site visit was conducted
              </p>
            </div>

            {/* Report File */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification Report File <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png,.json"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Upload your verification report (PDF, JPEG, PNG, or JSON). Max size: 10MB
              </p>
              {reportForm.reportFile && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800">
                    📄 Selected: {reportForm.reportFile.name} ({(reportForm.reportFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification Notes
              </label>
              <textarea
                value={reportForm.notes}
                onChange={(e) => setReportForm({...reportForm, notes: e.target.value})}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Provide detailed notes about your verification findings, property condition, any issues found, etc."
              />
              <p className="mt-1 text-xs text-gray-500">
                Include details about property condition, boundaries, any discrepancies, etc.
              </p>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <Link
                href="/inspector/cases"
                className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                    Submitting Report...
                  </>
                ) : (
                  '📝 Submit Verification Report'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Important Notes */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-yellow-800 mb-2">⚠️ Important Notes</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Ensure you have physically visited the property before submitting this report</li>
            <li>• Your recommendation will be used by administrators to make the final decision</li>
            <li>• GPS location helps verify the authenticity of your site visit</li>
            <li>• Include detailed notes about any issues or concerns found during verification</li>
            <li>• Once submitted, this report cannot be modified</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}