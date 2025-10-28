import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "../../components/Layout";
import LoadingSpinner from "../../components/LoadingSpinner";
import { toast } from "react-toastify";
import Link from "next/link";
import { useAuth } from "../../contexts/AuthContext";

// Admin Actions Component
function AdminActions({ property, verification, onInspectorAssigned }) {
  const { user, api } = useAuth();
  const [inspectors, setInspectors] = useState([]);
  const [selectedInspector, setSelectedInspector] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [loadingInspectors, setLoadingInspectors] = useState(false);

  // Only show for admin users
  if (!user || user.role !== "admin") {
    return null;
  }

  // Only show for verifications that are pending
  if (!verification || verification.status !== "pending") {
    return null;
  }

  const fetchInspectors = async () => {
    try {
      setLoadingInspectors(true);
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003/api"
        }/properties/inspectors`
      );
      const data = await response.json();
      if (data.success) {
        setInspectors(data.inspectors || []);
      } else {
        toast.error("Failed to load inspectors");
      }
    } catch (error) {
      console.error("Error fetching inspectors:", error);
      toast.error("Failed to load inspectors");
    } finally {
      setLoadingInspectors(false);
    }
  };

  const handleAssignInspector = async () => {
    if (!selectedInspector) {
      toast.error("Please select an inspector");
      return;
    }

    try {
      setAssigning(true);
      const response = await api.post("/properties/admin/assign-inspector", {
        surveyId: verification.propertyId || verification.surveyId,
        inspectorAddress: selectedInspector,
      });

      if (response.data.success) {
        toast.success("Inspector assigned successfully!");
        setSelectedInspector("");
        onInspectorAssigned(); // Refresh property details
      } else {
        toast.error("Failed to assign inspector");
      }
    } catch (error) {
      console.error("Assign inspector error:", error);
      toast.error("Failed to assign inspector");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg shadow">
      <div className="px-6 py-4 border-b border-red-200">
        <div className="flex items-center">
          <span className="text-red-600 text-xl mr-3">🔧</span>
          <h3 className="text-lg font-medium text-red-800">Admin Actions</h3>
        </div>
      </div>
      <div className="px-6 py-4">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-red-700 mb-3">
              This property verification is pending inspector assignment.
            </p>

            {!loadingInspectors && inspectors.length === 0 && (
              <button
                onClick={fetchInspectors}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
              >
                Load Available Inspectors
              </button>
            )}

            {loadingInspectors && (
              <div className="text-center py-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
              </div>
            )}

            {inspectors.length > 0 && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Inspector
                  </label>
                  <select
                    value={selectedInspector}
                    onChange={(e) => setSelectedInspector(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="">Choose an inspector...</option>
                    {inspectors.map((inspector) => (
                      <option
                        key={inspector.walletAddress}
                        value={inspector.walletAddress}
                      >
                        {inspector.name} ({inspector.stats.workload} pending
                        cases)
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleAssignInspector}
                  disabled={assigning || !selectedInspector}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {assigning ? "Assigning Inspector..." : "Assign Inspector"}
                </button>

                {selectedInspector && (
                  <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                    <strong>Selected:</strong>{" "}
                    {
                      inspectors.find(
                        (i) => i.walletAddress === selectedInspector
                      )?.name
                    }
                    <br />
                    <strong>Wallet:</strong> {selectedInspector.slice(0, 8)}...
                    {selectedInspector.slice(-6)}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-red-200">
            <Link
              href="/admin/properties"
              className="block w-full bg-red-600 text-white text-center px-4 py-2 rounded-md hover:bg-red-700 text-sm"
            >
              Manage All Verifications
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PropertyDetails() {
  const router = useRouter();
  const { surveyId } = router.query;
  const { user, api } = useAuth();

  const [loading, setLoading] = useState(true);
  const [property, setProperty] = useState(null);
  const [verification, setVerification] = useState(null);

  // Verification Status Management State
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [statusRemarks, setStatusRemarks] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (surveyId) {
      fetchPropertyDetails();
    }
  }, [surveyId]);

  const handleSubmitInspectionReport = async (e) => {
    e.preventDefault();

    if (!reportForm.recommendation) {
      toast.error("Please select a recommendation");
      return;
    }

    if (!reportForm.visitDate) {
      toast.error("Please select visit date");
      return;
    }

    // Prepare report data outside try block so it's available in catch block
    const combinedNotes = [
      reportForm.notes,
      reportForm.additionalObservations &&
        `Additional Observations: ${reportForm.additionalObservations}`,
      reportForm.propertyCondition &&
        `Property Condition: ${reportForm.propertyCondition}`,
      reportForm.boundaryVerification &&
        `Boundary Verification: ${reportForm.boundaryVerification}`,
      reportForm.documentVerification &&
        `Document Verification: ${reportForm.documentVerification}`,
      reportForm.ownerVerification &&
        `Owner Verification: ${reportForm.ownerVerification}`,
      reportForm.gpsLocation && `GPS Location: ${reportForm.gpsLocation}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    const reportData = {
      recommendation: reportForm.recommendation,
      visitDate: reportForm.visitDate,
      notes: combinedNotes,
      propertyVisited: true,
      documentsVerified: reportForm.documentVerification === "complete",
      boundariesChecked: reportForm.boundaryVerification === "verified",
      ownershipConfirmed: reportForm.ownerVerification === "verified",
    };

    try {
      setSubmittingReport(true);

      // Submit to actual API for permanent database update
      const verificationId = property.verificationId || surveyId;
      console.log("📋 Submitting to API for permanent update:", {
        verificationId,
        surveyId,
        propertyVerificationId: property.verificationId,
        reportData,
      });
      // Try to submit to actual MongoDB via API
      console.log("📋 Submitting to MongoDB via API:", {
        surveyId,
        propertyVerificationId: property.verificationId,
        reportData,
      });

      let response;
      let successfulEndpoint = null;

      try {
        // Try the existing inspection report endpoint
        const verificationId = property.verificationId || surveyId;
        console.log(
          `🔍 Trying endpoint: /properties/inspector/${verificationId}/submit-report`
        );
        console.log("🔍 Report data being sent:", reportData);
        console.log("🔍 Property info:", {
          surveyId: property.surveyId,
          verificationId: property.verificationId,
          verificationStatus: property.verificationStatus,
        });

        response = await api.post(
          `/properties/inspector/${verificationId}/submit-report`,
          reportData
        );
        console.log("✅ Success with inspection report endpoint");
        successfulEndpoint = `/properties/inspector/${verificationId}/submit-report`;
      } catch (error) {
        console.log("❌ Inspection report endpoint failed:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
        });

        // Try the new inspection report endpoint as fallback
        console.log(
          "🔄 Trying new inspection report endpoint for direct MongoDB update..."
        );

        try {
          const inspectionData = {
            surveyId: surveyId,
            recommendation: reportData.recommendation,
            notes: reportData.notes,
            visitDate: reportData.visitDate,
            propertyVisited: reportData.propertyVisited,
            documentsVerified: reportData.documentsVerified,
            boundariesChecked: reportData.boundariesChecked,
            ownershipConfirmed: reportData.ownershipConfirmed,
          };

          console.log("🔍 Inspection data being sent:", inspectionData);
          console.log("🔍 POST URL:", `/properties/submit-inspection-report`);

          response = await api.post(
            `/properties/submit-inspection-report`,
            inspectionData
          );
          console.log(
            "✅ Success with inspection report endpoint - MongoDB updated!"
          );
          console.log("✅ Response:", response.data);
          successfulEndpoint = `POST /properties/submit-inspection-report`;
        } catch (inspectionError) {
          console.error("❌ Inspection report endpoint also failed:", {
            status: inspectionError.response?.status,
            statusText: inspectionError.response?.statusText,
            data: inspectionError.response?.data,
            message: inspectionError.message,
            url: inspectionError.config?.url,
          });
          throw new Error(
            `All endpoints failed. Primary: ${
              error.response?.data?.error || error.message
            }. Fallback: ${
              inspectionError.response?.data?.error || inspectionError.message
            }`
          );
        }
      }

      if (response.data.success) {
        // Update property status and add inspection report locally
        const updatedProperty = {
          ...property,
          verificationStatus:
            reportData.recommendation === "approve" ? "verified" : "rejected",
          inspectionReport: {
            recommendation: reportData.recommendation,
            notes: reportData.notes,
            visitDate: reportData.visitDate,
            submittedAt: new Date().toISOString(),
            propertyVisited: reportData.propertyVisited,
            documentsVerified: reportData.documentsVerified,
            boundariesChecked: reportData.boundariesChecked,
            ownershipConfirmed: reportData.ownershipConfirmed,
            gpsLocation: reportForm.gpsLocation,
            propertyCondition: reportForm.propertyCondition,
            boundaryVerification: reportForm.boundaryVerification,
            documentVerification: reportForm.documentVerification,
            ownerVerification: reportForm.ownerVerification,
          },
        };

        // Update the property state
        setProperty(updatedProperty);

        // Update verification status if verification exists
        if (verification) {
          setVerification({
            ...verification,
            status:
              reportData.recommendation === "approve" ? "verified" : "rejected",
            inspectionReport: updatedProperty.inspectionReport,
          });
        }

        toast.success(
          `Inspection report submitted successfully! Property ${
            reportData.recommendation === "approve" ? "approved" : "rejected"
          }.`
        );
        setShowInspectionModal(false);

        // Reset form
        setReportForm({
          recommendation: "",
          visitDate: "",
          gpsLocation: "",
          notes: "",
          propertyCondition: "",
          boundaryVerification: "",
          documentVerification: "",
          ownerVerification: "",
          additionalObservations: "",
        });

        console.log(
          "✅ Property updated with inspection report:",
          updatedProperty
        );
        console.log("✅ Database updated via endpoint:", successfulEndpoint);
      } else {
        toast.error(
          response.data.message || "Failed to submit inspection report"
        );
      }
    } catch (error) {
      console.error("Error submitting report:", error);

      // Show specific error message
      if (error.response?.data?.error) {
        toast.error(`Database Error: ${error.response.data.error}`);
      } else if (error.message.includes("API Error:")) {
        toast.error(error.message);
      } else {
        toast.error("Failed to submit inspection report to database");
      }

      // Log the full error for debugging
      console.error("Full error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        reportData: reportData,
      });
    } finally {
      setSubmittingReport(false);
    }
  };

  const fetchPropertyDetails = async () => {
    try {
      setLoading(true);
      console.log("🔍 Fetching property details for:", surveyId);

      // Try to fetch from unified properties API first
      const propertyResponse = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003/api"
        }/properties/${surveyId}`
      );

      if (propertyResponse.ok) {
        const propertyData = await propertyResponse.json();
        console.log("✅ Property data found:", propertyData);

        if (propertyData.success) {
          const property = propertyData.property;

          // Set both property and verification data from unified response
          setProperty(property);

          // Create verification object if verification data exists
          if (property.verificationId) {
            const verificationData = {
              verificationId: property.verificationId,
              propertyId: property.surveyId,
              ownerAddress: property.ownerAddress,
              inspectorAddress: property.inspectorAddress,
              status: property.verificationStatus,
              propertyDetails: {
                surveyNumber: property.surveyId,
                location: property.location,
                area: property.area,
                areaUnit: property.areaUnit,
                propertyType: property.propertyType,
                ownerName: property.owner?.name,
              },
              documents: property.verificationDocuments || [],
              inspectionReport: property.inspectionReport,
              notifications: property.verificationNotifications || [],
              createdAt: property.verificationCreatedAt || property.createdAt,
              updatedAt: property.verificationUpdatedAt || property.updatedAt,
              owner: property.owner,
            };
            setVerification(verificationData);
          }

          console.log("📋 Property details:", property);
          console.log("📄 Property documents field:", property.documents);
          console.log(
            "📄 Property verificationDocuments field:",
            property.verificationDocuments
          );
          console.log(
            "📄 Property documentHashes field:",
            property.documentHashes
          );
          console.log("📄 All property fields:", Object.keys(property));
          console.log(
            "📄 Verification data:",
            property.verificationId ? "Available" : "None"
          );

          return;
        }
      }

      // This fallback is no longer needed since we use unified properties
      console.log("Property not found in unified endpoint");

      if (verificationResponse.ok) {
        const verificationData = await verificationResponse.json();
        console.log("✅ Legacy verification data found:", verificationData);

        if (verificationData.success) {
          setVerification(verificationData.verification);

          // Backend now provides complete user details
          const ownerDetails = verificationData.verification.owner;

          // Enhanced property object with all details
          const propertyDetails = {
            surveyId: verificationData.verification.propertyId,
            surveyNumber:
              verificationData.verification.propertyDetails.surveyNumber,
            location: verificationData.verification.propertyDetails.location,
            area: verificationData.verification.propertyDetails.area,
            areaUnit: verificationData.verification.propertyDetails.areaUnit,
            propertyType:
              verificationData.verification.propertyDetails.propertyType,
            ownerName: verificationData.verification.propertyDetails.ownerName,
            ownerAddress: verificationData.verification.ownerAddress,
            owner: ownerDetails,
            documents: verificationData.verification.documents || [],
            verificationStatus: verificationData.verification.status,
            verificationId: verificationData.verification.verificationId,
            inspectionReport: verificationData.verification.inspectionReport,
            createdAt: verificationData.verification.createdAt,
            updatedAt: verificationData.verification.updatedAt,
          };

          console.log("📋 Property details:", propertyDetails);
          console.log("📄 Documents found:", propertyDetails.documents.length);

          setProperty(propertyDetails);
          return;
        }
      }

      // If not found in verification, try regular properties endpoint
      console.log("🔍 Trying regular properties endpoint...");
      const fallbackPropertyResponse = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003/api"
        }/properties/${surveyId}`
      );

      if (fallbackPropertyResponse.ok) {
        const propertyData = await fallbackPropertyResponse.json();
        console.log("✅ Property data found:", propertyData);

        if (propertyData.success) {
          setProperty(propertyData.property);
          return;
        }
      }

      // Property not found
      console.log("❌ Property not found");
      toast.error("Property not found");
      router.push("/");
    } catch (error) {
      console.error("❌ Error fetching property details:", error);
      toast.error("Failed to load property details");
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedStatus) {
      toast.error("Please select a verification status");
      return;
    }

    if (!statusRemarks.trim()) {
      toast.error("Please provide remarks for the status change");
      return;
    }

    try {
      setUpdatingStatus(true);

      const updateData = {
        surveyId: property.surveyId,
        status: selectedStatus,
        remarks: statusRemarks.trim(),
        updatedBy: user?.walletAddress,
        updatedAt: new Date().toISOString(),
      };

      console.log("🔄 Updating verification status:", updateData);

      const response = await api.post(
        `/properties/update-verification-status`,
        updateData
      );

      if (response.data.success) {
        // Update local state with response data
        const updatedProperty = {
          ...property,
          verificationStatus: selectedStatus,
          forSale: response.data.property?.forSale || property.forSale,
        };
        setProperty(updatedProperty);

        if (verification) {
          setVerification({
            ...verification,
            status: selectedStatus,
          });
        }

        // Show appropriate success message
        if (selectedStatus === "verified") {
          toast.success(
            `Property verified and automatically listed for sale in marketplace! 🏷️`
          );
        } else {
          toast.success(
            `Verification status updated to ${selectedStatus
              .replace("_", " ")
              .toUpperCase()}`
          );
        }

        setShowStatusModal(false);
        setSelectedStatus("");
        setStatusRemarks("");

        // Refresh property details to get latest data
        fetchPropertyDetails();
      } else {
        toast.error(
          response.data.message || "Failed to update verification status"
        );
      }
    } catch (error) {
      console.error("Error updating verification status:", error);
      toast.error(
        error.response?.data?.error || "Failed to update verification status"
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  const openStatusModal = () => {
    setSelectedStatus(property.verificationStatus || "");
    setStatusRemarks("");
    setShowStatusModal(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      inspected: "bg-green-100 text-green-800",
      verified: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getDocumentIcon = (type) => {
    const icons = {
      property_deed: "📜",
      survey_report: "📊",
      tax_receipt: "🧾",
      identity_proof: "🆔",
      ownership_proof: "📋",
      other: "📄",
    };
    return icons[type] || "📄";
  };

  const getPropertyTypeIcon = (type) => {
    const icons = {
      Residential: "🏠",
      Commercial: "🏢",
      Agricultural: "🌾",
      Industrial: "🏭",
    };
    return icons[type] || "🏠";
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  if (!property) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Property Not Found
            </h1>
            <p className="mt-2 text-gray-600">
              The requested property could not be found.
            </p>
            <Link
              href="/"
              className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`Property ${property.surveyId} - Bhoomi Setu`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Property {property.surveyId}
              </h1>
              <p className="mt-2 text-gray-600">
                Complete property information and verification details
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {property.verificationStatus && (
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    property.verificationStatus
                  )}`}
                >
                  {String(property.verificationStatus)
                    .replace("_", " ")
                    .toUpperCase()}
                </span>
              )}
              <Link
                href="/"
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Property Information */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">
                    {getPropertyTypeIcon(property.propertyType)}
                  </span>
                  <h2 className="text-lg font-medium text-gray-900">
                    Property Information
                  </h2>
                </div>
              </div>
              <div className="px-6 py-4">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Survey Number
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 font-mono bg-gray-50 px-2 py-1 rounded">
                      {property.surveyNumber || property.surveyId}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Property Type
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getPropertyTypeIcon(property.propertyType)}{" "}
                        {property.propertyType}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Total Area
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 font-semibold">
                      {property.area} {property.areaUnit}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Verification Status
                    </dt>
                    <dd className="mt-1">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          property.verificationStatus
                        )}`}
                      >
                        {property.verificationStatus
                          ? String(property.verificationStatus)
                              .replace("_", " ")
                              .toUpperCase()
                          : "UNKNOWN"}
                      </span>
                    </dd>
                  </div>
                  {property.verificationId && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Verification ID
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 font-mono">
                        V{property.verificationId}
                      </dd>
                    </div>
                  )}
                  {property.ownerAddress && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Current Owner
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 font-mono bg-gray-50 px-2 py-1 rounded">
                        {property.ownerAddress.substring(0, 6)}...{property.ownerAddress.substring(property.ownerAddress.length - 4)}
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Property Status
                    </dt>
                    <dd className="mt-1">
                      {property.status === "transferred" || !property.forSale ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Sold
                        </span>
                      ) : property.forSale ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          For Sale
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Owned
                        </span>
                      )}
                    </dd>
                  </div>
                  {property.priceInWei && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        {property.forSale && property.status !== "transferred" ? "Listed Price" : "Last Sale Price"}
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 font-semibold">
                        {(parseFloat(property.priceInWei) / 1e18).toFixed(4)}{" "}
                        ETH
                      </dd>
                    </div>
                  )}
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">
                      Property Location
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded">
                      📍 {property.location}
                    </dd>
                  </div>
                  {property.documents && property.documents.length > 0 && (
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-gray-500">
                        Document Summary
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        <div className="flex flex-wrap gap-2">
                          {property.documents.map((doc, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800"
                            >
                              {getDocumentIcon(doc.type)}{" "}
                              {doc.type?.replace("_", " ") || "Document"}
                            </span>
                          ))}
                        </div>
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>

            {/* Owner Information */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">👤</span>
                  <h2 className="text-lg font-medium text-gray-900">
                    Property Owner
                  </h2>
                </div>
              </div>
              <div className="px-6 py-4">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Owner Name
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {property.owner?.name || property.ownerName || "Unknown"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Email Address
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {property.owner?.email || "Not provided"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Phone Number
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {property.owner?.phone || "Not provided"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      KYC Verification Status
                    </dt>
                    <dd className="mt-1">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          property.owner?.isKYCVerified
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {property.owner?.isKYCVerified
                          ? "✅ KYC Verified"
                          : "⏳ KYC Pending"}
                      </span>
                    </dd>
                  </div>
                  {property.owner?.role && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        User Role
                      </dt>
                      <dd className="mt-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {String(property.owner.role).toUpperCase()}
                        </span>
                      </dd>
                    </div>
                  )}
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">
                      Blockchain Wallet Address
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 font-mono break-all bg-gray-50 p-2 rounded">
                      {property.owner?.walletAddress ||
                        property.ownerAddress ||
                        "Not available"}
                    </dd>
                  </div>
                  {property.owner?.memberSince && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Member Since
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {new Date(
                          property.owner.memberSince
                        ).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </dd>
                    </div>
                  )}
                  {property.createdAt && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Property Submitted
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {new Date(property.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>

            {/* Documents */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  Property Documents
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Documents uploaded for property verification (
                  {
                    (
                      property.documents ||
                      property.verificationDocuments ||
                      property.documentHashes ||
                      []
                    ).length
                  }{" "}
                  files)
                </p>
              </div>
              <div className="px-6 py-4">
                {(() => {
                  // Check multiple possible document fields
                  const documents =
                    property.documents ||
                    property.verificationDocuments ||
                    property.documentHashes ||
                    [];
                  console.log("📄 Documents to display:", documents);

                  if (documents && documents.length > 0) {
                    return (
                      <div className="grid grid-cols-1 gap-4">
                        {documents.map((doc, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                          >
                            <div className="flex items-center">
                              <span className="text-2xl mr-3">
                                {getDocumentIcon(doc.type)}
                              </span>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {doc.type
                                    ? doc.type.replace("_", " ").toUpperCase()
                                    : "DOCUMENT"}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Uploaded:{" "}
                                  {doc.uploadedAt
                                    ? new Date(
                                        doc.uploadedAt
                                      ).toLocaleDateString()
                                    : "Unknown date"}
                                </p>
                                {doc.filename && (
                                  <p className="text-xs text-gray-500">
                                    File: {doc.filename}
                                  </p>
                                )}
                                <p className="text-xs text-gray-400 font-mono">
                                  IPFS:{" "}
                                  {doc.ipfsHash
                                    ? `${doc.ipfsHash.substring(0, 10)}...`
                                    : "N/A"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {doc.ipfsHash ? (
                                <>
                                  <a
                                    href={`https://gateway.pinata.cloud/ipfs/${doc.ipfsHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 text-sm px-3 py-1 border border-blue-300 rounded hover:bg-blue-50"
                                  >
                                    📄 View
                                  </a>
                                </>
                              ) : (
                                <span className="text-gray-400 text-sm">
                                  No file available
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  } else {
                    return (
                      <div className="text-center py-8">
                        <div className="text-gray-400 text-4xl mb-4">📄</div>
                        <p className="text-gray-500">
                          No documents uploaded yet
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          Documents will appear here once the property owner
                          uploads them
                        </p>
                      </div>
                    );
                  }
                })()}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Property Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-blue-600 text-xl">
                    {getPropertyTypeIcon(property.propertyType)}
                  </span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Property Summary
                  </h3>
                  <p className="text-sm text-blue-700">
                    {property.propertyType} property of {property.area}{" "}
                    {property.areaUnit}
                  </p>
                  {property.documents && (
                    <p className="text-xs text-blue-600 mt-1">
                      {property.documents.length} documents available
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Verification Timeline */}
            {verification && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">
                    Verification Timeline
                  </h3>
                </div>
                <div className="px-6 py-4">
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">
                          Property Submitted
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(
                            verification.createdAt
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {verification.status !== "pending" && (
                      <div className="flex items-start">
                        <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">
                            Inspector Assigned
                          </p>
                          <p className="text-xs text-gray-500">
                            Verification process started
                          </p>
                        </div>
                      </div>
                    )}

                    {verification.inspectionReport && (
                      <div className="flex items-start">
                        <div className="flex-shrink-0 w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">
                            Inspection Completed
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(
                              verification.inspectionReport.submittedAt
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Verification Status Management */}
            {(user?.role === "admin" || user?.role === "inspector") && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center">
                    <span className="text-orange-600 text-xl mr-3">⚙️</span>
                    <h3 className="text-lg font-medium text-gray-900">
                      Verification Status Management
                    </h3>
                  </div>
                </div>
                <div className="px-6 py-4">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-3">
                        Current Status:{" "}
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            property.verificationStatus
                          )}`}
                        >
                          {property.verificationStatus
                            ? String(property.verificationStatus)
                                .replace("_", " ")
                                .toUpperCase()
                            : "UNKNOWN"}
                        </span>
                      </p>
                      <button
                        onClick={openStatusModal}
                        className="w-full bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors"
                      >
                        🔄 Update Verification Status
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Quick Actions
                </h3>
              </div>
              <div className="px-6 py-4 space-y-3">
                <Link
                  href="/marketplace"
                  className="block w-full bg-blue-600 text-white text-center px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Browse Marketplace
                </Link>
                <Link
                  href="/add-property"
                  className="block w-full bg-green-600 text-white text-center px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                >
                  Add Your Property
                </Link>
                <Link
                  href="/"
                  className="block w-full bg-gray-600 text-white text-center px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                >
                  Back to Home
                </Link>
              </div>
            </div>

            {/* Admin Actions */}
            <AdminActions
              property={property}
              verification={verification}
              onInspectorAssigned={fetchPropertyDetails}
            />
          </div>
        </div>

        {/* Verification Status Update Modal */}
        {showStatusModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                {/* Modal Header */}
                <div className="flex items-center justify-between pb-4 border-b">
                  <h3 className="text-lg font-medium text-gray-900">
                    Update Verification Status
                  </h3>
                  <button
                    onClick={() => setShowStatusModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Close</span>
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
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

                {/* Property Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 my-4">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">
                      {getPropertyTypeIcon(property.propertyType)}
                    </span>
                    <div>
                      <h4 className="text-lg font-medium text-blue-800">
                        Property {property.surveyId}
                      </h4>
                      <p className="text-sm text-blue-700">
                        {property.propertyType} | {property.area}{" "}
                        {property.areaUnit} | 📍 {property.location}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Current Status:{" "}
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            property.verificationStatus
                          )}`}
                        >
                          {property.verificationStatus
                            ? String(property.verificationStatus)
                                .replace("_", " ")
                                .toUpperCase()
                            : "UNKNOWN"}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status Update Form */}
                <div className="space-y-6">
                  <div>
                    <label
                      htmlFor="verificationStatus"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      New Verification Status{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="verificationStatus"
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="">Select new status</option>
                      {user?.role === "inspector" ? (
                        // Land Inspector options: Pending, Inspected, Rejected
                        <>
                          <option value="pending">🟡 Pending</option>
                          <option value="inspected">🔍 Inspected</option>
                          <option value="rejected">❌ Rejected</option>
                        </>
                      ) : user?.role === "admin" ? (
                        // Admin options: Pending, Verified, Rejected
                        <>
                          <option value="pending">🟡 Pending</option>
                          <option value="verified">✅ Verified</option>
                          <option value="rejected">❌ Rejected</option>
                        </>
                      ) : (
                        // Fallback for other roles (shouldn't happen due to role check above)
                        <>
                          <option value="pending">🟡 Pending</option>
                          <option value="verified">✅ Verified</option>
                          <option value="rejected">❌ Rejected</option>
                        </>
                      )}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {user?.role === "inspector"
                        ? "As an inspector, you can mark properties as Pending, Inspected, or Rejected"
                        : "As an admin, you can mark properties as Pending, Verified, or Rejected"}
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="statusRemarks"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Remarks <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="statusRemarks"
                      value={statusRemarks}
                      onChange={(e) => setStatusRemarks(e.target.value)}
                      rows={4}
                      placeholder="Please provide detailed remarks for this status change..."
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Explain the reason for this status change and any relevant
                      details.
                    </p>
                  </div>

                  {/* Status Change Preview */}
                  {selectedStatus && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <span className="text-yellow-600 text-lg mr-2">⚠️</span>
                        <div>
                          <h4 className="text-sm font-medium text-yellow-800">
                            Status Change Preview
                          </h4>
                          <p className="text-sm text-yellow-700">
                            {property.verificationStatus
                              ? String(property.verificationStatus)
                                  .replace("_", " ")
                                  .toUpperCase()
                              : "UNKNOWN"}
                            <span className="mx-2">→</span>
                            {selectedStatus.replace("_", " ").toUpperCase()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end space-x-3 pt-6 border-t mt-6">
                  <button
                    type="button"
                    onClick={() => setShowStatusModal(false)}
                    className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleStatusUpdate}
                    disabled={
                      updatingStatus || !selectedStatus || !statusRemarks.trim()
                    }
                    className="bg-orange-600 text-white px-6 py-2 rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {updatingStatus ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                        Updating...
                      </>
                    ) : (
                      "💾 Save Status Change"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
