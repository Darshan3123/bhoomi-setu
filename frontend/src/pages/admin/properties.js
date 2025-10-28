import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/router";
import AdminLayout from "../../components/admin/AdminLayout";
import LoadingSpinner from "../../components/LoadingSpinner";
import { toast } from "react-toastify";
import { ethers } from "ethers";
import Link from "next/link";

export default function AdminProperties() {
  const { user, token } = useAuth();
  const router = useRouter();

  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    rejected: 0,
    sold: 0,
    totalValue: "0",
    verifications: 0,
    pending: 0,
  });
  const [verifyingProperty, setVerifyingProperty] = useState(null);

  // Filter states
  const [filters, setFilters] = useState({
    propertyType: "",
    status: "",
    forSale: "",
    search: "",
  });

  useEffect(() => {
    // Check if user is admin
    if (user && user.role !== "admin") {
      router.push("/");
      return;
    }

    if (user && token) {
      fetchProperties();
    }
  }, [user, token, router]);

  useEffect(() => {
    applyFilters();
  }, [properties, filters]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003/api"
        }/properties?limit=100`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProperties(data.properties || []);

          // Calculate all stats from actual properties data
          const properties = data.properties || [];

          // Calculate total value
          const totalValue = properties.reduce((sum, p) => {
            try {
              return sum + parseFloat(ethers.formatEther(p.priceInWei || "0"));
            } catch {
              return sum;
            }
          }, 0);

          // Calculate verification status counts
          const pendingVerifications = properties.filter(
            (p) => p.verificationStatus === "pending"
          ).length;

          const verifiedProperties = properties.filter(
            (p) => p.verificationStatus === "verified"
          ).length;

          const rejectedProperties = properties.filter(
            (p) => p.verificationStatus === "rejected"
          ).length;

          // Verified properties (automatically for sale and ready for sale)
          // This represents: Verified = For Sale = Ready for Sale

          // Sold properties
          const soldProperties = properties.filter(
            (p) => p.status === "sold"
          ).length;

          // Total verifications (properties that have gone through verification process)
          const totalVerifications = properties.filter(
            (p) => p.verificationStatus && p.verificationStatus !== "pending"
          ).length;

          setStats({
            total: properties.length,
            verified: verifiedProperties,
            rejected: rejectedProperties,
            sold: soldProperties,
            totalValue: totalValue.toFixed(3),
            verifications: totalVerifications,
            pending: pendingVerifications,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching properties:", error);
      toast.error("Failed to load properties");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...properties];

    // Filter by property type
    if (filters.propertyType) {
      filtered = filtered.filter(
        (p) => p.propertyType === filters.propertyType
      );
    }

    // Filter by status
    if (filters.status) {
      filtered = filtered.filter((p) => p.status === filters.status);
    }

    // Filter by for sale
    if (filters.forSale !== "") {
      filtered = filtered.filter(
        (p) => p.forSale === (filters.forSale === "true")
      );
    }

    // Filter by search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.surveyId.toLowerCase().includes(searchLower) ||
          p.location.toLowerCase().includes(searchLower) ||
          p.owner?.name?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredProperties(filtered);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      propertyType: "",
      status: "",
      forSale: "",
      search: "",
    });
  };

  const formatPrice = (priceInWei) => {
    try {
      if (!priceInWei || priceInWei === "0") {
        return "Not Set";
      }
      const formatted = ethers.formatEther(priceInWei);
      return parseFloat(formatted) === 0 ? "Not Set" : formatted;
    } catch {
      return "Not Set";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getVerificationBadge = (verificationStatus) => {
    const statusConfig = {
      pending: {
        color: "bg-yellow-100 text-yellow-800",
        text: "Pending",
        icon: "⏳",
      },

      inspected: {
        color: "bg-purple-100 text-purple-800",
        text: "Inspected",
        icon: "✅",
      },
      verified: {
        color: "bg-green-100 text-green-800",
        text: "Verified",
        icon: "✅",
      },
      rejected: {
        color: "bg-red-100 text-red-800",
        text: "Rejected",
        icon: "❌",
      },

    };

    const config = statusConfig[verificationStatus] || {
      color: "bg-gray-100 text-gray-800",
      text: "Unknown",
      icon: "❓",
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.icon} {config.text}
      </span>
    );
  };

  const getStatusBadge = (status, forSale, verificationStatus) => {
    if (status === "sold") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          🏁 Sold
        </span>
      );
    } else if (verificationStatus === "verified") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
          🏷️ Ready for Sale
        </span>
      );
    } else if (forSale) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          💰 For Sale
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          📋 Registered
        </span>
      );
    }
  };

  const getPropertyTypeIcon = (type) => {
    const icons = {
      Residential: { icon: "🏠", color: "bg-blue-100 text-blue-600" },
      Commercial: { icon: "🏢", color: "bg-purple-100 text-purple-600" },
      Agricultural: { icon: "🌾", color: "bg-green-100 text-green-600" },
      Industrial: { icon: "🏭", color: "bg-orange-100 text-orange-600" },
    };
    return icons[type] || { icon: "🏠", color: "bg-gray-100 text-gray-600" };
  };

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600">
            You need admin privileges to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout title="Property Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Property Management
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                View and manage all registered properties, view ownership
                history, and handle property transfers.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchProperties}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <dl>
                    <dt className="text-xs font-medium text-gray-500">
                      Total Properties
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {stats.total}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-emerald-500 rounded-md flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
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
                  </div>
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <dl>
                    <dt className="text-xs font-medium text-gray-500">
                      Verified / For Sale
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {stats.verified}
                    </dd>
                    <dd className="text-xs text-gray-400 mt-1">
                      Auto-listed in marketplace
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
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
                  </div>
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <dl>
                    <dt className="text-xs font-medium text-gray-500">
                      Rejected
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {stats.rejected}
                    </dd>
                    <dd className="text-xs text-gray-400 mt-1">
                      Verification failed
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
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
                  </div>
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <dl>
                    <dt className="text-xs font-medium text-gray-500">Sold</dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {stats.sold}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <dl>
                    <dt className="text-xs font-medium text-gray-500">
                      Total Value
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {stats.totalValue} ETH
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
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
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <dl>
                    <dt className="text-xs font-medium text-gray-500">
                      Verifications
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {stats.verifications}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
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
                  </div>
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <dl>
                    <dt className="text-xs font-medium text-gray-500">
                      Pending
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {stats.pending}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Filters</h3>
            <button
              onClick={clearFilters}
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
                placeholder="Survey ID, location, owner..."
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="propertyType"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Property Type
              </label>
              <select
                id="propertyType"
                name="propertyType"
                value={filters.propertyType}
                onChange={handleFilterChange}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">All Types</option>
                <option value="Agricultural">Agricultural</option>
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
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
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="sold">Sold</option>
                <option value="transferred">Transferred</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="forSale"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                For Sale
              </label>
              <select
                id="forSale"
                name="forSale"
                value={filters.forSale}
                onChange={handleFilterChange}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">All</option>
                <option value="true">For Sale</option>
                <option value="false">Not For Sale</option>
              </select>
            </div>

            <div className="flex items-end">
              <span className="text-sm text-gray-500">
                Showing {filteredProperties.length} of {properties.length}{" "}
                properties
              </span>
            </div>
          </div>
        </div>

        {/* Properties Table */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Properties ({filteredProperties.length})
            </h3>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <LoadingSpinner />
              <p className="mt-2 text-gray-600">Loading properties...</p>
            </div>
          ) : filteredProperties.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sr No
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Property
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Owner
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Verification
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Source
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProperties.map((property, index) => {
                      const typeInfo = getPropertyTypeIcon(
                        property.propertyType
                      );
                      return (
                        <tr
                          key={property.id || index}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {index + 1}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div
                                className={`w-10 h-10 ${typeInfo.color} rounded-lg flex items-center justify-center text-lg mr-3`}
                              >
                                {typeInfo.icon}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {property.surveyId}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {property.propertyType}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {property.owner?.name || "Unknown"}
                            </div>
                            <div className="text-sm text-gray-500 font-mono">
                              {property.ownerAddress?.substring(0, 6)}...
                              {property.ownerAddress?.substring(-4)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {property.area} {property.areaUnit}
                            </div>
                            <div className="text-sm text-gray-500 max-w-xs truncate">
                              {property.location}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {formatPrice(property.priceInWei) ===
                              "Not Set" ? (
                                <span className="text-gray-400 italic">
                                  Not Set
                                </span>
                              ) : (
                                `${formatPrice(property.priceInWei)} ETH`
                              )}
                            </div>
                            {property.priceInINR > 0 && (
                              <div className="text-sm text-gray-500">
                                ₹{property.priceInINR.toLocaleString()}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(
                              property.status,
                              property.forSale,
                              property.verificationStatus
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getVerificationBadge(property.verificationStatus)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                property.source === "verification"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {property.source === "verification"
                                ? "📋 Verification"
                                : "🔗 Registry"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <Link
                                href={`/property/${property.surveyId}`}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                View
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="p-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                No properties found
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                {Object.values(filters).some((f) => f)
                  ? "Try adjusting your filters to see more properties."
                  : "No properties have been registered yet."}
              </p>
              {Object.values(filters).some((f) => f) && (
                <button
                  onClick={clearFilters}
                  className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
