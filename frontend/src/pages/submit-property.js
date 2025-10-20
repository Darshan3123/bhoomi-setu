import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { toast } from 'react-toastify';

export default function SubmitProperty() {
  const { user, api, isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    surveyNumber: '',
    location: '',
    area: '',
    areaUnit: 'sq ft',
    propertyType: 'Residential'
  });
  const [documents, setDocuments] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      toast.error('Maximum 5 documents allowed');
      return;
    }

    // Validate file types and sizes
    const validFiles = [];
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    
    for (const file of files) {
      if (!validTypes.includes(file.type)) {
        toast.error(`Invalid file type: ${file.name}. Only PDF, JPEG, and PNG files are allowed.`);
        continue;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File too large: ${file.name}. Maximum size is 10MB.`);
        continue;
      }
      
      validFiles.push(file);
    }

    setDocuments(validFiles);
    setDocumentTypes(validFiles.map(() => 'property_deed')); // Default type
  };

  const handleDocumentTypeChange = (index, type) => {
    const newTypes = [...documentTypes];
    newTypes[index] = type;
    setDocumentTypes(newTypes);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error('Please connect your wallet and login first');
      return;
    }

    if (documents.length === 0) {
      toast.error('Please upload at least one document');
      return;
    }

    try {
      setLoading(true);
      
      const submitData = new FormData();
      submitData.append('surveyNumber', formData.surveyNumber);
      submitData.append('location', formData.location);
      submitData.append('area', formData.area);
      submitData.append('areaUnit', formData.areaUnit);
      submitData.append('propertyType', formData.propertyType);
      
      // Add documents
      documents.forEach((file, index) => {
        submitData.append('documents', file);
      });
      
      // Add document types
      submitData.append('documentTypes', JSON.stringify(documentTypes));
      
      const response = await api.post('/properties/submit-for-verification', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        toast.success('Property submitted for verification successfully!');
        router.push('/user/dashboard');
      } else {
        toast.error('Failed to submit property for verification');
      }
    } catch (error) {
      console.error('Property submission error:', error);
      if (error.response?.status === 409) {
        toast.error('Property verification already submitted for this survey number');
      } else {
        toast.error('Failed to submit property for verification');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Authentication Required</h1>
            <p className="mt-2 text-gray-600">Please connect your wallet and login to submit a property for verification.</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Submit Property for Verification</h1>
          <p className="mt-2 text-gray-600">
            Submit your property details and documents for official verification by our inspectors.
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="text-blue-600 text-xl">ℹ️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Verification Process</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>1. Submit property details and documents</p>
                <p>2. Admin assigns an inspector to your property</p>
                <p>3. Inspector conducts site visit and verification</p>
                <p>4. Inspector submits verification report</p>
                <p>5. Property gets verified and can be marked for sale</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Property Details</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
            {/* Survey Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Survey Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="surveyNumber"
                value={formData.surveyNumber}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter survey number (e.g., SUR-2024-001)"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Location <span className="text-red-500">*</span>
              </label>
              <textarea
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                required
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter complete property address with landmarks"
              />
            </div>

            {/* Area and Unit */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Area <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="area"
                  value={formData.area}
                  onChange={handleInputChange}
                  required
                  min="1"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter area"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Area Unit
                </label>
                <select
                  name="areaUnit"
                  value={formData.areaUnit}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="sq ft">Square Feet</option>
                  <option value="sq m">Square Meters</option>
                  <option value="acres">Acres</option>
                  <option value="hectares">Hectares</option>
                </select>
              </div>
            </div>

            {/* Property Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Type <span className="text-red-500">*</span>
              </label>
              <select
                name="propertyType"
                value={formData.propertyType}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
                <option value="Agricultural">Agricultural</option>
                <option value="Industrial">Industrial</option>
              </select>
            </div>

            {/* Documents Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Documents <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Upload up to 5 documents (PDF, JPEG, PNG). Max size: 10MB per file.
              </p>
            </div>

            {/* Document Types */}
            {documents.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Types
                </label>
                <div className="space-y-3">
                  {documents.map((file, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <span className="text-sm text-gray-600 flex-1">{file.name}</span>
                      <select
                        value={documentTypes[index]}
                        onChange={(e) => handleDocumentTypeChange(index, e.target.value)}
                        className="px-3 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="property_deed">Property Deed</option>
                        <option value="survey_report">Survey Report</option>
                        <option value="tax_receipt">Tax Receipt</option>
                        <option value="identity_proof">Identity Proof</option>
                        <option value="ownership_proof">Ownership Proof</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                    Submitting...
                  </>
                ) : (
                  'Submit for Verification'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Required Documents Info */}
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Required Documents</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-800">Essential Documents:</h4>
              <ul className="mt-2 space-y-1">
                <li>• Property Deed/Title Document</li>
                <li>• Survey Report</li>
                <li>• Property Tax Receipt</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-800">Additional Documents:</h4>
              <ul className="mt-2 space-y-1">
                <li>• Identity Proof (Aadhaar/PAN)</li>
                <li>• Previous Ownership Proof</li>
                <li>• Municipal Approvals (if any)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}