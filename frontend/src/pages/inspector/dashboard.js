import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/router";
import Layout from "../../components/Layout";
import { toast } from "react-toastify";
import Link from "next/link";

export default function InspectorDashboard() {
  const { user, api, isAuthenticated } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAssigned: 0,
    pendingInspections: 0,
    completedInspections: 0,
    approvedProperties: 0,
    rejectedProperties: 0,
    approvalRate: 0,
  });
  const [recentCases, setRecentCases] = useState([]);
  const [assignedCases, setAssignedCases] = useState([]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/");
      return;
    }

    if (user?.role !== "inspector") {
      toast.error("Access denied. Inspector role required.");
      router.push("/");
      return;
    }

    fetchDashboardData();
  }, [isAuthenticated, user, router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all properties for inspector to see (for development/testing)
      // In production, this should be limited to assigned properties only
      const casesResponse = await api.get("/properties?limit=100");

      if (casesResponse.data.success) {
        console.log(
          "🔍 Inspector Dashboard - Raw properties data:",
          casesResponse.data
        );

        const assignedProperties = casesResponse.data.properties || [];

        // Transform the properties data to match the expected format
        const transformedCases = assignedProperties.map((property) => ({
          verificationId: property.verificationId || "N/A",
          propertyId: property.surveyId,
          status: property.verificationStatus || property.status || "active",
          propertyDetails: {
            propertyType: property.propertyType,
            area: property.area,
            areaUnit: property.areaUnit,
            location: property.location,
          },
          documents:
            property.documents ||
            property.verificationDocuments ||
            property.documentHashes ||
            [],
          hasDocuments: property.hasDocuments,
          createdAt: property.verificationCreatedAt || property.createdAt,
          inspectionReport: property.inspectionReport,
          owner: property.owner,
          ownerAddress: property.ownerAddress,
          priceInWei: property.priceInWei,
          forSale: property.forSale,
        }));

        console.log(
          "🔍 Inspector Dashboard - Transformed cases:",
          transformedCases
        );

        // Debug document fields
        assignedProperties.forEach((property, index) => {
          console.log(
            `🔍 Property ${index + 1} (${property.surveyId}) documents:`,
            {
              documents: property.documents?.length || 0,
              verificationDocuments:
                property.verificationDocuments?.length || 0,
              documentHashes: property.documentHashes?.length || 0,
              hasDocuments: property.hasDocuments,
              hasDocumentsCount: property.hasDocuments
                ? Object.values(property.hasDocuments).filter(Boolean).length
                : 0,
              rawDocuments: property.documents,
              rawVerificationDocuments: property.verificationDocuments,
              rawDocumentHashes: property.documentHashes,
            }
          );
        });
        setAssignedCases(transformedCases);

        // Calculate stats dynamically from the actual properties data
        const totalAssigned = assignedProperties.length;
        const pendingInspections = assignedProperties.filter(
          (p) =>
            p.verificationStatus === "pending" ||
            (!p.verificationStatus && p.status === "active")
        ).length;
        const completedInspections = assignedProperties.filter(
          (p) =>
            p.verificationStatus === "inspected" ||
            p.verificationStatus === "verified"
        ).length;
        const approvedProperties = assignedProperties.filter(
          (p) => p.verificationStatus === "verified"
        ).length;
        const rejectedProperties = assignedProperties.filter(
          (p) => p.verificationStatus === "rejected"
        ).length;

        // Calculate approval rate
        const totalCompleted = approvedProperties + rejectedProperties;
        const approvalRate =
          totalCompleted > 0
            ? Math.round((approvedProperties / totalCompleted) * 100)
            : 0;

        // Calculate total documents across all properties
        const totalDocuments = assignedProperties.reduce((total, property) => {
          // Check for array-based documents first
          const documents =
            property.documents ||
            property.verificationDocuments ||
            property.documentHashes ||
            [];
          if (Array.isArray(documents) && documents.length > 0) {
            return total + documents.length;
          }

          // Check for hasDocuments object structure
          if (
            property.hasDocuments &&
            typeof property.hasDocuments === "object"
          ) {
            const documentCount = Object.values(property.hasDocuments).filter(
              Boolean
            ).length;
            return total + documentCount;
          }

          return total;
        }, 0);

        const calculatedStats = {
          totalAssigned,
          pendingInspections,
          completedInspections,
          approvedProperties,
          rejectedProperties,
          approvalRate,
          totalDocuments,
        };

        console.log(
          "🔍 Inspector Dashboard - Calculated stats:",
          calculatedStats
        );
        setStats(calculatedStats);

        // Set recent cases (last 5 properties, sorted by update date)
        const recentCases = assignedProperties
          .sort(
            (a, b) =>
              new Date(b.verificationUpdatedAt || b.updatedAt || b.createdAt) -
              new Date(a.verificationUpdatedAt || a.updatedAt || a.createdAt)
          )
          .slice(0, 5)
          .map((property) => ({
            verificationId: property.verificationId || "N/A",
            propertyId: property.surveyId,
            status: property.verificationStatus || property.status || "active",
            updatedAt:
              property.verificationUpdatedAt ||
              property.updatedAt ||
              property.createdAt,
          }));

        setRecentCases(recentCases);
      } else {
        console.error(
          "🔍 Inspector Dashboard - Cases response failed:",
          casesResponse.data
        );
        // Set empty data if request fails
        setAssignedCases([]);
        setStats({
          totalAssigned: 0,
          pendingInspections: 0,
          completedInspections: 0,
          approvedProperties: 0,
          rejectedProperties: 0,
          approvalRate: 0,
        });
        setRecentCases([]);
      }
    } catch (error) {
      console.error("Dashboard data fetch error:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      assigned: "bg-blue-100 text-blue-800",
      inspected: "bg-green-100 text-green-800",
      approved: "bg-green-100 text-green-800",
      verified: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      completed: "bg-gray-100 text-gray-800",
      active: "bg-blue-100 text-blue-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: "⏳",
      assigned: "📋",
      inspected: "✅",
      approved: "✅",
      verified: "✅",
      rejected: "❌",
      completed: "🏁",
      active: "📋",
    };
    return icons[status] || "📋";
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

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Inspector Dashboard
          </h1>
          <p className="mt-2 text-gray-600">
            Welcome back, {user?.profile?.name || "Inspector"}! Manage your
            assigned property inspections.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">📋</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Total Assigned
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.totalAssigned}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 font-semibold">⏳</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Pending Inspections
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.pendingInspections}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-semibold">✅</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Approved Properties
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.approvedProperties}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 font-semibold">❌</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Total Rejected
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.rejectedProperties}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-semibold">✅</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.completedInspections}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Approval Rate
            </h3>
            <div className="flex items-center">
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${stats.approvalRate}%` }}
                  ></div>
                </div>
              </div>
              <span className="ml-4 text-2xl font-semibold text-gray-900">
                {stats.approvalRate}%
              </span>
            </div>
            <div className="mt-2 flex justify-between text-sm text-gray-500">
              <span>Approved: {stats.approvedProperties}</span>
              <span>Rejected: {stats.rejectedProperties}</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <Link
                href="/inspector/cases"
                className="block w-full bg-blue-600 text-white text-center py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                View All Verifications
              </Link>
              <Link
                href="/inspector/history"
                className="block w-full bg-gray-600 text-white text-center py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
              >
                Verification History
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Recent Activity
            </h3>
            <div className="space-y-3">
              {recentCases.length > 0 ? (
                recentCases.slice(0, 3).map((verification) => (
                  <div
                    key={verification.verificationId}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900">
                          V{verification.verificationId}
                        </p>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                            verification.status
                          )}`}
                        >
                          {verification.status.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Survey ID: {verification.propertyId}
                      </p>
                      <p className="text-xs text-gray-400">
                        Updated:{" "}
                        {new Date(verification.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <Link
                        href={`/property/${verification.propertyId}`}
                        className="text-xs text-indigo-600 hover:text-indigo-500"
                      >
                        View →
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">No recent activity</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Properties will appear here once assigned
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Assigned Property Verifications Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              All Properties in System
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              All properties in the database (for inspection and verification)
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sr No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Verification ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Documents
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assignedCases.length > 0 ? (
                  assignedCases.map((verification, index) => (
                    <tr
                      key={verification.verificationId}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {index + 1}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-lg mr-2">
                            {getStatusIcon(verification.status)}
                          </span>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              V{verification.verificationId}
                            </div>
                            <div className="text-xs text-gray-500">
                              Property Verification
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          Survey ID: {verification.propertyId}
                        </div>
                        <div className="text-xs text-gray-500 mb-1">
                          {verification.propertyDetails?.propertyType} •{" "}
                          {verification.propertyDetails?.area}{" "}
                          {verification.propertyDetails?.areaUnit}
                        </div>
                        <div
                          className="text-xs text-gray-500 mb-1"
                          style={{ maxWidth: "300px", wordWrap: "break-word" }}
                        >
                          📍 {verification.propertyDetails?.location}
                        </div>
                        <div className="text-xs text-gray-400">
                          Owner:{" "}
                          {verification.ownerAddress
                            ? `${verification.ownerAddress.slice(
                                0,
                                6
                              )}...${verification.ownerAddress.slice(-4)}`
                            : "Unknown"}
                        </div>
                        {verification.forSale && (
                          <div className="text-xs text-green-600 font-medium">
                            🏷️ For Sale
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            verification.status
                          )}`}
                        >
                          {verification.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {(() => {
                            // Check for array-based documents first
                            const documents =
                              verification.documents ||
                              verification.verificationDocuments ||
                              verification.documentHashes ||
                              [];
                            if (
                              Array.isArray(documents) &&
                              documents.length > 0
                            ) {
                              return documents.length;
                            }

                            // Check for hasDocuments object structure
                            if (
                              verification.hasDocuments &&
                              typeof verification.hasDocuments === "object"
                            ) {
                              return Object.values(
                                verification.hasDocuments
                              ).filter(Boolean).length;
                            }

                            return 0;
                          })()}{" "}
                          files
                        </div>
                        <div className="text-xs text-gray-500">
                          {(() => {
                            // Check for array-based documents first
                            const documents =
                              verification.documents ||
                              verification.verificationDocuments ||
                              verification.documentHashes ||
                              [];
                            if (
                              Array.isArray(documents) &&
                              documents.length > 0
                            ) {
                              return "📄 Available";
                            }

                            // Check for hasDocuments object structure
                            if (
                              verification.hasDocuments &&
                              typeof verification.hasDocuments === "object"
                            ) {
                              const hasAnyDocs = Object.values(
                                verification.hasDocuments
                              ).some(Boolean);
                              return hasAnyDocs ? "📄 Available" : "📄 None";
                            }

                            return "📄 None";
                          })()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(verification.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          href={`/property/${verification.propertyId}`}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No property verifications assigned yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
