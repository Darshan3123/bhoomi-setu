import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import LoadingSpinner from "@/components/LoadingSpinner";
import { toast } from "react-toastify";
import { ethers } from "ethers";
import Link from "next/link";

export default function AddProperty() {
  const router = useRouter();
  const { user, isAuthenticated, loading, token, api } = useAuth();

  // KYC Status state
  const [kycStatus, setKycStatus] = useState(null);
  const [kycLoading, setKycLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    surveyId: "",
    location: "",
    propertyType: "Residential",
    area: "",
    areaUnit: "sq ft",
    priceInETH: "",
    ownerAddress: "",
    forSale: false,
  });

  // File upload state
  const [documents, setDocuments] = useState({
    saleDeed: null,
    taxReceipt: null,
    noc: null,
    propertyPhoto: null,
  });

  // Upload progress state
  const [uploadProgress, setUploadProgress] = useState({
    saleDeed: 0,
    taxReceipt: 0,
    noc: 0,
    propertyPhoto: 0,
  });

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1); // Multi-step form

  // Check KYC status
  const checkKYCStatus = async () => {
    try {
      setKycLoading(true);
      const response = await api.get("/kyc/status");
      setKycStatus(response.data.kycStatus);
    } catch (error) {
      console.error("Error checking KYC status:", error);
      toast.error("Failed to check KYC status");
    } finally {
      setKycLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/");
    } else if (isAuthenticated && user?.walletAddress) {
      setFormData((prev) => ({
        ...prev,
        ownerAddress: user.walletAddress,
      }));
      // Check KYC status when user is authenticated
      checkKYCStatus();
    }
  }, [isAuthenticated, loading, router, user]);

  const propertyTypes = [
    { value: "Agricultural", label: "Agricultural", icon: "🌾" },
    { value: "Residential", label: "Residential", icon: "🏠" },
    { value: "Commercial", label: "Commercial", icon: "🏢" },
    { value: "Industrial", label: "Industrial", icon: "🏭" },
  ];

  const areaUnits = [
    { value: "sq ft", label: "Square Feet (sq ft)" },
    { value: "sq yard", label: "Square Yard (sq yard)" },
    { value: "acre", label: "Acre" },
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleFileChange = async (e, documentType) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
    ];

    if (file.size > maxSize) {
      toast.error("File size must be less than 10MB");
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      toast.error("Only PDF, JPG, and PNG files are allowed");
      return;
    }

    setDocuments((prev) => ({
      ...prev,
      [documentType]: file,
    }));

    // Simulate upload progress
    setUploadProgress((prev) => ({ ...prev, [documentType]: 0 }));
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        const newProgress = prev[documentType] + 10;
        if (newProgress >= 100) {
          clearInterval(interval);
          return { ...prev, [documentType]: 100 };
        }
        return { ...prev, [documentType]: newProgress };
      });
    }, 100);
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!formData.surveyId.trim()) {
      newErrors.surveyId = "Survey ID is required";
    }
    if (!formData.location.trim()) {
      newErrors.location = "Property location is required";
    }
    if (!formData.area || parseFloat(formData.area) <= 0) {
      newErrors.area = "Valid area is required";
    }
    // Price is optional for verification submissions
    if (formData.priceInETH && parseFloat(formData.priceInETH) <= 0) {
      newErrors.priceInETH = "Valid ETH price is required";
    }
    if (!formData.ownerAddress || !ethers.isAddress(formData.ownerAddress)) {
      newErrors.ownerAddress = "Valid wallet address is required";
    }

    // Required documents validation
    if (!documents.saleDeed) {
      newErrors.saleDeed = "Sale Deed is required";
    }
    if (!documents.taxReceipt) {
      newErrors.taxReceipt = "Tax Receipt is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };



  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Submit property for verification
      toast.info("Submitting property for verification...");

      // Prepare verification data
      const verificationData = {
        surveyNumber: formData.surveyId,
        location: formData.location,
        area: parseInt(formData.area),
        areaUnit: formData.areaUnit,
        propertyType: formData.propertyType,
        documentTypes: [],
      };

      // Create FormData for file upload
      const formDataForUpload = new FormData();
      formDataForUpload.append("surveyNumber", verificationData.surveyNumber);
      formDataForUpload.append("location", verificationData.location);
      formDataForUpload.append("area", verificationData.area);
      formDataForUpload.append("areaUnit", verificationData.areaUnit);
      formDataForUpload.append("propertyType", verificationData.propertyType);
      formDataForUpload.append("priceInETH", formData.priceInETH || "0");

      // Add documents to FormData
      if (documents.saleDeed) {
        formDataForUpload.append("documents", documents.saleDeed);
        verificationData.documentTypes.push("property_deed");
      }
      if (documents.taxReceipt) {
        formDataForUpload.append("documents", documents.taxReceipt);
        verificationData.documentTypes.push("tax_receipt");
      }
      if (documents.noc) {
        formDataForUpload.append("documents", documents.noc);
        verificationData.documentTypes.push("ownership_proof");
      }
      if (documents.propertyPhoto) {
        formDataForUpload.append("documents", documents.propertyPhoto);
        verificationData.documentTypes.push("other");
      }

      // Add document types
      verificationData.documentTypes.forEach((type, index) => {
        formDataForUpload.append(`documentTypes[${index}]`, type);
      });

      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api"
        }/properties/submit-for-verification`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formDataForUpload,
        }
      );

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        console.error("Failed to parse response as JSON:", parseError);
        const textResponse = await response.text();
        console.error("Response text:", textResponse);
        throw new Error(`Server returned ${response.status}: ${textResponse}`);
      }

      console.log("API Response:", result);

      if (result.success) {
        toast.success("Property submitted for verification successfully!");
        toast.info(
          "Your property will be reviewed by an inspector before being added to the marketplace."
        );
        router.push("/user/dashboard");
      } else {
        throw new Error(result.error || "Submission failed");
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error(
        error.message || "Failed to submit property for verification"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (step === 1) {
      // Validate basic info before proceeding
      const basicErrors = {};
      if (!formData.surveyId.trim())
        basicErrors.surveyId = "Survey ID is required";
      if (!formData.location.trim())
        basicErrors.location = "Location is required";
      if (!formData.area || parseFloat(formData.area) <= 0)
        basicErrors.area = "Valid area is required";

      if (Object.keys(basicErrors).length > 0) {
        setErrors(basicErrors);
        toast.error("Please complete all required fields");
        return;
      }
    }
    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
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

  // KYC Validation - Block access if KYC is not complete
  if (kycStatus && !kycStatus.canAddProperty) {
    return (
      <Layout title="KYC Verification Required - Bhoomi Setu">
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white shadow-lg rounded-lg p-8">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-6">
                  <svg
                    className="h-8 w-8 text-yellow-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  KYC Verification Required
                </h1>

                <p className="text-lg text-gray-600 mb-8">
                  To add properties to the blockchain registry, you must
                  complete KYC verification by uploading your address proof and
                  PAN card documents.
                </p>

                {/* KYC Status Display */}
                <div className="bg-gray-50 rounded-lg p-6 mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Your KYC Status
                  </h3>

                  <div className="space-y-4">
                    {/* Address Proof Status */}
                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                      <div className="flex items-center">
                        <div
                          className={`w-4 h-4 rounded-full mr-3 ${
                            kycStatus.aadhaarUploaded
                              ? "bg-green-500"
                              : "bg-red-500"
                          }`}
                        ></div>
                        <span className="font-medium">
                          Address Proof (Aadhaar Card)
                        </span>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          kycStatus.aadhaarUploaded
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {kycStatus.aadhaarUploaded
                          ? "Uploaded"
                          : "Not Uploaded"}
                      </span>
                    </div>

                    {/* PAN Card Status */}
                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                      <div className="flex items-center">
                        <div
                          className={`w-4 h-4 rounded-full mr-3 ${
                            kycStatus.panUploaded
                              ? "bg-green-500"
                              : "bg-red-500"
                          }`}
                        ></div>
                        <span className="font-medium">PAN Card</span>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          kycStatus.panUploaded
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {kycStatus.panUploaded ? "Uploaded" : "Not Uploaded"}
                      </span>
                    </div>

                    {/* Admin Verification Status */}
                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                      <div className="flex items-center">
                        <div
                          className={`w-4 h-4 rounded-full mr-3 ${
                            kycStatus.verified
                              ? "bg-green-500"
                              : "bg-yellow-500"
                          }`}
                        ></div>
                        <span className="font-medium">Admin Verification</span>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          kycStatus.verified
                            ? "bg-green-100 text-green-800"
                            : kycStatus.aadhaarUploaded && kycStatus.panUploaded
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {kycStatus.verified
                          ? "Verified"
                          : kycStatus.aadhaarUploaded && kycStatus.panUploaded
                          ? "Pending Review"
                          : "Waiting for Documents"}
                      </span>
                    </div>
                  </div>

                  {/* Rejection Reason */}
                  {kycStatus.rejectionReason && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start">
                        <svg
                          className="w-5 h-5 text-red-400 mt-0.5 mr-2"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <div>
                          <h4 className="text-sm font-medium text-red-800">
                            KYC Rejected
                          </h4>
                          <p className="text-sm text-red-700 mt-1">
                            {kycStatus.rejectionReason}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {!kycStatus.aadhaarUploaded || !kycStatus.panUploaded ? (
                    <Link
                      href="/profile"
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      Upload KYC Documents
                    </Link>
                  ) : (
                    <div className="text-center">
                      <div className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-gray-100 cursor-not-allowed">
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Waiting for Admin Approval
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        Your documents are under review. You'll be notified once
                        approved.
                      </p>
                    </div>
                  )}

                  <Link
                    href="/user/dashboard"
                    className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 19l-7-7m0 0l7-7m-7 7h18"
                      />
                    </svg>
                    Back to Dashboard
                  </Link>
                </div>

                {/* Information Box */}
                <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-start">
                    <svg
                      className="w-6 h-6 text-blue-600 mt-0.5 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div className="text-left">
                      <h4 className="text-sm font-medium text-blue-900 mb-2">
                        Why KYC is Required?
                      </h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Ensures property ownership authenticity</li>
                        <li>
                          • Complies with legal requirements for land registry
                        </li>
                        <li>• Prevents fraudulent property listings</li>
                        <li>• Builds trust in the blockchain ecosystem</li>
                      </ul>
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

  return (
    <Layout title="Add Property - Bhoomi Setu">
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Submit Property for Verification
            </h1>
            <p className="mt-2 text-gray-600">
              Submit your property for inspector verification before adding to
              the marketplace
            </p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-8">
              <div
                className={`flex items-center ${
                  step >= 1 ? "text-indigo-600" : "text-gray-400"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= 1
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  1
                </div>
                <span className="ml-2 text-sm font-medium">
                  Property Details
                </span>
              </div>

              <div
                className={`w-16 h-1 ${
                  step >= 2 ? "bg-indigo-600" : "bg-gray-200"
                }`}
              ></div>

              <div
                className={`flex items-center ${
                  step >= 2 ? "text-indigo-600" : "text-gray-400"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= 2
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  2
                </div>
                <span className="ml-2 text-sm font-medium">Documents</span>
              </div>

              <div
                className={`w-16 h-1 ${
                  step >= 3 ? "bg-indigo-600" : "bg-gray-200"
                }`}
              ></div>

              <div
                className={`flex items-center ${
                  step >= 3 ? "text-indigo-600" : "text-gray-400"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= 3
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  3
                </div>
                <span className="ml-2 text-sm font-medium">
                  Review & Submit for Verification
                </span>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white shadow-lg rounded-lg">
            <form onSubmit={handleSubmit}>
              {/* Step 1: Property Details */}
              {step === 1 && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Property Details
                  </h2>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {/* Survey ID */}
                    <div className="sm:col-span-2">
                      <label
                        htmlFor="surveyId"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Survey ID / Plot Number *
                      </label>
                      <input
                        type="text"
                        name="surveyId"
                        id="surveyId"
                        value={formData.surveyId}
                        onChange={handleInputChange}
                        className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                          errors.surveyId ? "border-red-300" : ""
                        }`}
                        placeholder="e.g., SUR-2024-001"
                      />
                      {errors.surveyId && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.surveyId}
                        </p>
                      )}
                    </div>

                    {/* Location */}
                    <div className="sm:col-span-2">
                      <label
                        htmlFor="location"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Property Location / Address *
                      </label>
                      <textarea
                        name="location"
                        id="location"
                        rows={3}
                        value={formData.location}
                        onChange={handleInputChange}
                        className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                          errors.location ? "border-red-300" : ""
                        }`}
                        placeholder="Enter complete address with landmarks"
                      />
                      {errors.location && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.location}
                        </p>
                      )}
                    </div>

                    {/* Property Type */}
                    <div>
                      <label
                        htmlFor="propertyType"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Type of Property *
                      </label>
                      <select
                        name="propertyType"
                        id="propertyType"
                        value={formData.propertyType}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      >
                        {propertyTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.icon} {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Area */}
                    <div>
                      <label
                        htmlFor="area"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Area of Land / Plot Size *
                      </label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <input
                          type="number"
                          name="area"
                          id="area"
                          value={formData.area}
                          onChange={handleInputChange}
                          className={`flex-1 border-gray-300 rounded-l-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                            errors.area ? "border-red-300" : ""
                          }`}
                          placeholder="1000"
                          min="1"
                          step="0.01"
                        />
                        <select
                          name="areaUnit"
                          value={formData.areaUnit}
                          onChange={handleInputChange}
                          className="border-gray-300 rounded-r-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                          {areaUnits.map((unit) => (
                            <option key={unit.value} value={unit.value}>
                              {unit.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      {errors.area && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.area}
                        </p>
                      )}
                    </div>

                    {/* Price in ETH */}
                    <div>
                      <label
                        htmlFor="priceInETH"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Price in ETH (Blockchain Transaction) *
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <input
                          type="number"
                          name="priceInETH"
                          id="priceInETH"
                          value={formData.priceInETH}
                          onChange={handleInputChange}
                          className={`block w-full pr-12 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                            errors.priceInETH ? "border-red-300" : ""
                          }`}
                          placeholder="0.5"
                          min="0"
                          step="0.001"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">ETH</span>
                        </div>
                      </div>
                      {errors.priceInETH && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.priceInETH}
                        </p>
                      )}
                    </div>

                    {/* Owner Address */}
                    <div className="sm:col-span-2">
                      <label
                        htmlFor="ownerAddress"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Owner Wallet Address *
                      </label>
                      <input
                        type="text"
                        name="ownerAddress"
                        id="ownerAddress"
                        value={formData.ownerAddress}
                        onChange={handleInputChange}
                        className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                          errors.ownerAddress ? "border-red-300" : ""
                        }`}
                        placeholder="0x..."
                        readOnly={!!user?.walletAddress}
                      />
                      {errors.ownerAddress && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.ownerAddress}
                        </p>
                      )}
                      {user?.walletAddress && (
                        <p className="mt-1 text-sm text-gray-500">
                          Using your connected wallet address
                        </p>
                      )}
                    </div>

                    {/* For Sale Flag */}
                    <div className="sm:col-span-2">
                      <div className="flex items-center">
                        <input
                          id="forSale"
                          name="forSale"
                          type="checkbox"
                          checked={formData.forSale}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label
                          htmlFor="forSale"
                          className="ml-2 block text-sm text-gray-900"
                        >
                          List this property for sale immediately
                        </label>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        You can always list it for sale later from your
                        properties dashboard
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      onClick={nextStep}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Next: Upload Documents
                      <svg
                        className="ml-2 w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
              {/* Step 2: Documents Upload */}
              {step === 2 && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Supporting Documents (IPFS Storage)
                  </h2>
                  <p className="text-sm text-gray-600 mb-6">
                    Documents will be stored securely on IPFS, with hashes
                    recorded on the blockchain
                  </p>

                  <div className="space-y-6">
                    {/* Sale Deed */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sale Deed *{" "}
                        <span className="text-red-500">(Required)</span>
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-indigo-400 transition-colors">
                        <div className="text-center">
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
                          <div className="mt-4">
                            <label
                              htmlFor="saleDeed"
                              className="cursor-pointer"
                            >
                              <span className="mt-2 block text-sm font-medium text-gray-900">
                                {documents.saleDeed
                                  ? documents.saleDeed.name
                                  : "Upload Sale Deed"}
                              </span>
                              <span className="mt-1 block text-xs text-gray-500">
                                PDF, JPG, PNG up to 10MB
                              </span>
                            </label>
                            <input
                              id="saleDeed"
                              name="saleDeed"
                              type="file"
                              className="sr-only"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => handleFileChange(e, "saleDeed")}
                            />
                          </div>
                        </div>
                        {uploadProgress.saleDeed > 0 &&
                          uploadProgress.saleDeed < 100 && (
                            <div className="mt-4">
                              <div className="bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                  style={{
                                    width: `${uploadProgress.saleDeed}%`,
                                  }}
                                ></div>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                Uploading... {uploadProgress.saleDeed}%
                              </p>
                            </div>
                          )}
                        {documents.saleDeed &&
                          uploadProgress.saleDeed === 100 && (
                            <div className="mt-4 flex items-center text-green-600">
                              <svg
                                className="w-4 h-4 mr-2"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span className="text-sm">
                                File uploaded successfully
                              </span>
                            </div>
                          )}
                      </div>
                      {errors.saleDeed && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.saleDeed}
                        </p>
                      )}
                    </div>

                    {/* Tax Receipt */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tax Receipt *{" "}
                        <span className="text-red-500">(Required)</span>
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-indigo-400 transition-colors">
                        <div className="text-center">
                          <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            stroke="currentColor"
                            fill="none"
                            viewBox="0 0 48 48"
                          >
                            <path
                              d="M9 12h6m6 0h6m-6 4h6m2 5H7a2 2 0 01-2-2V8a2 2 0 012-2h10a2 2 0 012 2v1.586a1 1 0 00.293.707l3.414 3.414a1 1 0 00.707.293H39a2 2 0 012 2v10a2 2 0 01-2 2zM9 16h6m-6 4h6m6 0h6"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <div className="mt-4">
                            <label
                              htmlFor="taxReceipt"
                              className="cursor-pointer"
                            >
                              <span className="mt-2 block text-sm font-medium text-gray-900">
                                {documents.taxReceipt
                                  ? documents.taxReceipt.name
                                  : "Upload Tax Receipt"}
                              </span>
                              <span className="mt-1 block text-xs text-gray-500">
                                PDF, JPG, PNG up to 10MB
                              </span>
                            </label>
                            <input
                              id="taxReceipt"
                              name="taxReceipt"
                              type="file"
                              className="sr-only"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) =>
                                handleFileChange(e, "taxReceipt")
                              }
                            />
                          </div>
                        </div>
                        {uploadProgress.taxReceipt > 0 &&
                          uploadProgress.taxReceipt < 100 && (
                            <div className="mt-4">
                              <div className="bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                  style={{
                                    width: `${uploadProgress.taxReceipt}%`,
                                  }}
                                ></div>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                Uploading... {uploadProgress.taxReceipt}%
                              </p>
                            </div>
                          )}
                        {documents.taxReceipt &&
                          uploadProgress.taxReceipt === 100 && (
                            <div className="mt-4 flex items-center text-green-600">
                              <svg
                                className="w-4 h-4 mr-2"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span className="text-sm">
                                File uploaded successfully
                              </span>
                            </div>
                          )}
                      </div>
                      {errors.taxReceipt && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.taxReceipt}
                        </p>
                      )}
                    </div>

                    {/* NOC (Optional) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        No Objection Certificate (NOC){" "}
                        <span className="text-gray-500">(Optional)</span>
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-indigo-400 transition-colors">
                        <div className="text-center">
                          <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            stroke="currentColor"
                            fill="none"
                            viewBox="0 0 48 48"
                          >
                            <path
                              d="M9 12h6m6 0h6m-6 4h6m2 5H7a2 2 0 01-2-2V8a2 2 0 012-2h10a2 2 0 012 2v1.586a1 1 0 00.293.707l3.414 3.414a1 1 0 00.707.293H39a2 2 0 012 2v10a2 2 0 01-2 2zM9 16h6m-6 4h6m6 0h6"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <div className="mt-4">
                            <label htmlFor="noc" className="cursor-pointer">
                              <span className="mt-2 block text-sm font-medium text-gray-900">
                                {documents.noc
                                  ? documents.noc.name
                                  : "Upload NOC"}
                              </span>
                              <span className="mt-1 block text-xs text-gray-500">
                                PDF, JPG, PNG up to 10MB
                              </span>
                            </label>
                            <input
                              id="noc"
                              name="noc"
                              type="file"
                              className="sr-only"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => handleFileChange(e, "noc")}
                            />
                          </div>
                        </div>
                        {uploadProgress.noc > 0 && uploadProgress.noc < 100 && (
                          <div className="mt-4">
                            <div className="bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress.noc}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Uploading... {uploadProgress.noc}%
                            </p>
                          </div>
                        )}
                        {documents.noc && uploadProgress.noc === 100 && (
                          <div className="mt-4 flex items-center text-green-600">
                            <svg
                              className="w-4 h-4 mr-2"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span className="text-sm">
                              File uploaded successfully
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Property Photo */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Property Photo / Site Image{" "}
                        <span className="text-gray-500">(Optional)</span>
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-indigo-400 transition-colors">
                        <div className="text-center">
                          <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            stroke="currentColor"
                            fill="none"
                            viewBox="0 0 48 48"
                          >
                            <path
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6 6h.01M6 20h36a2 2 0 012 2v16a2 2 0 01-2 2H6a2 2 0 01-2-2V22a2 2 0 012-2zM18 12a4 4 0 11-8 0 4 4 0 018 0z"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <div className="mt-4">
                            <label
                              htmlFor="propertyPhoto"
                              className="cursor-pointer"
                            >
                              <span className="mt-2 block text-sm font-medium text-gray-900">
                                {documents.propertyPhoto
                                  ? documents.propertyPhoto.name
                                  : "Upload Property Photo"}
                              </span>
                              <span className="mt-1 block text-xs text-gray-500">
                                JPG, PNG up to 10MB
                              </span>
                            </label>
                            <input
                              id="propertyPhoto"
                              name="propertyPhoto"
                              type="file"
                              className="sr-only"
                              accept=".jpg,.jpeg,.png"
                              onChange={(e) =>
                                handleFileChange(e, "propertyPhoto")
                              }
                            />
                          </div>
                        </div>
                        {uploadProgress.propertyPhoto > 0 &&
                          uploadProgress.propertyPhoto < 100 && (
                            <div className="mt-4">
                              <div className="bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                  style={{
                                    width: `${uploadProgress.propertyPhoto}%`,
                                  }}
                                ></div>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                Uploading... {uploadProgress.propertyPhoto}%
                              </p>
                            </div>
                          )}
                        {documents.propertyPhoto &&
                          uploadProgress.propertyPhoto === 100 && (
                            <div className="mt-4 flex items-center text-green-600">
                              <svg
                                className="w-4 h-4 mr-2"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span className="text-sm">
                                File uploaded successfully
                              </span>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-between">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <svg
                        className="mr-2 w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={nextStep}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Next: Review & Submit
                      <svg
                        className="ml-2 w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Review & Submit */}
              {step === 3 && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Review & Submit
                  </h2>
                  <p className="text-sm text-gray-600 mb-6">
                    Please review all information before submitting to the
                    blockchain
                  </p>

                  <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Property Summary
                    </h3>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">
                          Survey ID
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {formData.surveyId}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">
                          Property Type
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {
                            propertyTypes.find(
                              (t) => t.value === formData.propertyType
                            )?.icon
                          }{" "}
                          {formData.propertyType}
                        </dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-gray-500">
                          Location
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {formData.location}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">
                          Area
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {formData.area} {formData.areaUnit}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">
                          Price
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {formData.priceInETH} ETH
                          {formData.priceInINR && (
                            <span className="text-gray-500">
                              {" "}
                              (₹{parseInt(formData.priceInINR).toLocaleString()}
                              )
                            </span>
                          )}
                        </dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-gray-500">
                          Owner Address
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 font-mono">
                          {formData.ownerAddress}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">
                          For Sale
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {formData.forSale ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Yes - Listed for Sale
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              No - Not for Sale
                            </span>
                          )}
                        </dd>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Documents Status
                    </h3>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                          Sale Deed
                        </span>
                        {documents.saleDeed ? (
                          <span className="inline-flex items-center text-green-600">
                            <svg
                              className="w-4 h-4 mr-1"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span className="text-sm">Uploaded</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-red-600">
                            <svg
                              className="w-4 h-4 mr-1"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span className="text-sm">Required</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                          Tax Receipt
                        </span>
                        {documents.taxReceipt ? (
                          <span className="inline-flex items-center text-green-600">
                            <svg
                              className="w-4 h-4 mr-1"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span className="text-sm">Uploaded</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-red-600">
                            <svg
                              className="w-4 h-4 mr-1"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span className="text-sm">Required</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                          NOC
                        </span>
                        {documents.noc ? (
                          <span className="inline-flex items-center text-green-600">
                            <svg
                              className="w-4 h-4 mr-1"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span className="text-sm">Uploaded</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-gray-500">
                            <span className="text-sm">Optional</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                          Property Photo
                        </span>
                        {documents.propertyPhoto ? (
                          <span className="inline-flex items-center text-green-600">
                            <svg
                              className="w-4 h-4 mr-1"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span className="text-sm">Uploaded</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-gray-500">
                            <span className="text-sm">Optional</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Blockchain Transaction Info */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
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
                          Blockchain Transaction
                        </h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <p>This will create a blockchain transaction that:</p>
                          <ul className="list-disc list-inside mt-1 space-y-1">
                            <li>
                              Registers your property permanently on the
                              blockchain
                            </li>
                            <li>Stores document hashes securely on IPFS</li>
                            <li>Requires a small gas fee (paid in ETH)</li>
                            <li>Cannot be reversed once confirmed</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-between">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <svg
                        className="mr-2 w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
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
                          Submitting for Verification...
                        </>
                      ) : (
                        <>
                          <svg
                            className="mr-2 w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          Submit for Verification
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
