import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/router";
import Layout from "../../components/Layout";
import { toast } from "react-toastify";
import Link from "next/link";

export default function InspectorCases() {
  const { user, api, isAuthenticated } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState([]);
  const [filteredCases, setFilteredCases] = useState([]);
  const [filters, setFilters] = useState({
    status: "all", // all, pending, assigned, inspection_scheduled, inspected
    propertyType: "all", // all, Residential, Commercial, Agricultural, Industrial
    search: "",
  });

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

    fetchCases();
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    applyFilters();
  }, [cases, filters]);

  const fetchCases = async () => {
    try {
      setLoading(true);
      console.log("🔍 Inspector - Fetching assigned properties");

      const response = await api.get("/properties?limit=100");
      console.log("🔍 Inspector - Response:", response.data);

      if (response.data.success) {
        // Transform the properties data to match the expected case format
        const transformedCases = (response.data.properties || []).map(
          (property) => ({
            id: property._id,
            type: "verification",
            verificationId: property.verificationId || "N/A",
            propertyId: property.surveyId,
            status: property.verificationStatus || property.status || "active",
            assignedAt:
              property.verificationUpdatedAt ||
              property.verificationCreatedAt ||
              property.createdAt,
            propertyDetails: {
              surveyNumber: property.surveyId,
              location: property.location,
              area: property.area,
              areaUnit: property.areaUnit,
              propertyType: property.propertyType,
              ownerName: property.owner?.name || "Unknown",
            },
            documentsCount:
              property.verificationDocuments?.length ||
              property.documentHashes?.length ||
              0,
            hasInspectionReport: !!property.inspectionReport,
            owner: property.owner,
            ownerAddress: property.ownerAddress,
            createdAt: property.verificationCreatedAt || property.createdAt,
            updatedAt: property.verificationUpdatedAt || property.updatedAt,
            forSale: property.forSale,
            priceInWei: property.priceInWei,
          })
        );

        console.log("🔍 Inspector - Transformed cases:", transformedCases);

        // Debug: Log property types to see what values we have
        const propertyTypes = [
          ...new Set(
            transformedCases
              .map((c) => c.propertyDetails?.propertyType)
              .filter(Boolean)
          ),
        ];
        console.log("🔍 Available property types:", propertyTypes);

        setCases(transformedCases);
      } else {
        toast.error("Failed to load assigned properties");
      }
    } catch (error) {
      console.error("Cases fetch error:", error);
      toast.error("Failed to load assigned properties");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    console.log("🔍 Applying filters:", filters);
    console.log("🔍 Total cases before filtering:", cases.length);

    let filtered = [...cases];

    // Filter by property type
    if (filters.propertyType && filters.propertyType !== "all") {
      console.log("🔍 Filtering by property type:", filters.propertyType);
      const beforeCount = filtered.length;

      // Debug: Show all property types in current cases
      console.log(
        "🔍 All property types in cases:",
        filtered.map((c) => ({
          id: c.propertyId,
          type: c.propertyDetails?.propertyType,
          rawType: typeof c.propertyDetails?.propertyType,
        }))
      );

      filtered = filtered.filter((c) => {
        const propertyType = c.propertyDetails?.propertyType;
        const matches = propertyType === filters.propertyType;
        console.log(
          `🔍 Case ${c.propertyId}: "${propertyType}" === "${filters.propertyType}" = ${matches}`
        );
        return matches;
      });
      console.log(
        "🔍 After property type filter:",
        beforeCount,
        "->",
        filtered.length
      );
    }

    // Filter by status
    if (filters.status !== "all") {
      console.log("🔍 Filtering by status:", filters.status);
      const beforeCount = filtered.length;
      filtered = filtered.filter((c) => {
        const matches = c.status === filters.status;
        if (!matches) {
          console.log("🔍 Status mismatch:", c.status, "vs", filters.status);
        }
        return matches;
      });
      console.log(
        "🔍 After status filter:",
        beforeCount,
        "->",
        filtered.length
      );
    }

    // Filter by search
    if (filters.search) {
      console.log("🔍 Filtering by search:", filters.search);
      const searchLower = filters.search.toLowerCase();
      const beforeCount = filtered.length;
      filtered = filtered.filter(
        (c) =>
          c.verificationId.toString().includes(searchLower) ||
          c.propertyId.toLowerCase().includes(searchLower) ||
          c.propertyDetails?.location?.toLowerCase().includes(searchLower) ||
          c.propertyDetails?.ownerName?.toLowerCase().includes(searchLower)
      );
      console.log(
        "🔍 After search filter:",
        beforeCount,
        "->",
        filtered.length
      );
    }

    console.log("🔍 Final filtered cases:", filtered.length);
    setFilteredCases(filtered);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    console.log("🔍 Filter change:", name, "=", value);
    setFilters((prev) => {
      const newFilters = {
        ...prev,
        [name]: value,
      };
      console.log("🔍 New filters state:", newFilters);
      return newFilters;
    });
  };

  const clearFilters = () => {
    setFilters({
      status: "all",
      propertyType: "all",
      search: "",
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      assigned: "bg-blue-100 text-blue-800",
      inspected: "bg-green-100 text-green-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      completed: "bg-gray-100 text-gray-800",
      verified: "bg-green-100 text-green-800",
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
      rejected: "❌",
      completed: "🏁",
      verified: "✅",
      active: "📋",
    };
    return icons[status] || "📋";
  };

  const getTypeIcon = (type) => {
    return type === "transfer" ? "🔄" : "🏠";
  };

  const getPropertyTypeIcon = (propertyType) => {
    const icons = {
      Residential: "🏠",
      Commercial: "🏢",
      Agricultural: "🌾",
      Industrial: "🏭",
    };
    return icons[propertyType] || "🏠";
  };

  const getPriorityLevel = (caseItem) => {
    const daysSinceAssigned = Math.floor(
      (new Date() - new Date(caseItem.assignedAt)) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceAssigned > 7)
      return { level: "high", color: "text-red-600", text: "High Priority" };
    if (daysSinceAssigned > 3)
      return {
        level: "medium",
        color: "text-yellow-600",
        text: "Medium Priority",
      };
    return { level: "normal", color: "text-green-600", text: "Normal" };
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                All Property Cases
              </h1>
              <p className="mt-2 text-gray-600">
                View and manage all properties in the system for inspection and
                verification
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchCases}
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
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Refresh
              </button>
              <Link
                href="/inspector/dashboard"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
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
                <p className="text-sm font-medium text-gray-500">Total Cases</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {cases.length}
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
                  Pending Verification
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {
                    cases.filter((c) =>
                      ["pending", "assigned", "active"].includes(c.status)
                    ).length
                  }
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
                <p className="text-sm font-medium text-gray-500">
                  Verified/Completed
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {
                    cases.filter((c) =>
                      ["inspected", "verified", "approved"].includes(c.status)
                    ).length
                  }
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
                  {cases.filter((c) => c.status === "rejected").length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-semibold">🏠</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Property Verifications
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {cases.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Filters</h3>
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label
                htmlFor="search"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Search
              </label>
              <input
                type="text"
                id="search"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Case ID, Property ID, Location..."
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Property Type
              </label>
              <select
                id="propertyType"
                name="propertyType"
                value={filters.propertyType || "all"}
                onChange={handleFilterChange}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="all">All Property Types</option>
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
                <option value="Agricultural">Agricultural</option>
                <option value="Industrial">Industrial</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Status
              </label>
              <select
                id="status"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="assigned">Assigned</option>
                <option value="inspected">Inspected</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="flex items-end">
              <span className="text-sm text-gray-500">
                Showing {filteredCases.length} of {cases.length} cases
              </span>
            </div>
          </div>
        </div>

        {/* Cases List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Cases ({filteredCases.length})
            </h3>
          </div>

          {filteredCases.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredCases.map((caseItem, index) => {
                const priority = getPriorityLevel(caseItem);

                return (
                  <div
                    key={`${caseItem.type}-${caseItem.id}`}
                    className="p-6 hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-start space-x-4">
                        {/* Serial Number */}
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-gray-600">
                              {index + 1}
                            </span>
                          </div>
                        </div>

                        {/* Case Icon */}
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <span className="text-xl">
                              {caseItem.type === "verification"
                                ? getPropertyTypeIcon(
                                    caseItem.propertyDetails?.propertyType
                                  )
                                : getTypeIcon(caseItem.type)}
                            </span>
                          </div>
                        </div>

                        {/* Case Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="text-lg font-medium text-gray-900">
                              Property Verification V{caseItem.verificationId}
                            </h4>
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                                caseItem.status
                              )}`}
                            >
                              {getStatusIcon(caseItem.status)}{" "}
                              {caseItem.status.replace("_", " ")}
                            </span>
                            <span
                              className={`text-xs font-medium ${priority.color}`}
                            >
                              {priority.text}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-black-600">
                            <div>
                              <span className="font-medium">Sr No:</span>{" "}
                              {index + 1}
                            </div>

                            <div>
                              <span className="font-medium">Survey ID:</span>{" "}
                              {caseItem.propertyId}
                            </div>

                            <div>
                              <span className="font-medium">Type:</span>{" "}
                              {caseItem.propertyDetails?.propertyType}
                            </div>

                            <div>
                              <span className="font-medium">Area:</span>{" "}
                              {caseItem.propertyDetails?.area}{" "}
                              {caseItem.propertyDetails?.areaUnit}
                            </div>

                            <div>
                              <span className="font-medium">Owner:</span>{" "}
                              {caseItem.ownerAddress
                                ? `${caseItem.ownerAddress.slice(
                                    0,
                                    6
                                  )}...${caseItem.ownerAddress.slice(-4)}`
                                : caseItem.propertyDetails?.ownerName ||
                                  "Unknown"}
                            </div>

                            <div>
                              <span className="font-medium">Documents:</span>{" "}
                              {caseItem.documentsCount} files
                            </div>

                            <div>
                              <span className="font-medium">Created:</span>{" "}
                              {new Date(
                                caseItem.createdAt || caseItem.assignedAt
                              ).toLocaleDateString()}
                            </div>

                            <div className="md:col-span-2 lg:col-span-3">
                              <span className="font-medium">Location:</span>{" "}
                              <span>{caseItem.propertyDetails?.location}</span>
                            </div>

                            {caseItem.forSale && (
                              <div>
                                <span className="font-medium text-green-600">
                                  🏷️ For Sale
                                </span>
                              </div>
                            )}

                            {caseItem.hasInspectionReport && (
                              <div className="md:col-span-3">
                                <span className="font-medium text-green-600">
                                  ✅ Inspection Report Submitted
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-3">
                        <Link
                          href={`/property/${caseItem.propertyId}`}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <svg
                            className="w-4 h-4 mr-1"
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
                          View Property
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center">
              <h3 className="text-lg font-medium text-gray-900">
                No cases found
              </h3>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-blue-600 text-xl">💡</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Quick Actions
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                <Link
                  href="/inspector/history"
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
                >
                  View Inspection History
                </Link>
                <Link
                  href="/inspector/dashboard"
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
                >
                  Dashboard Overview
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
