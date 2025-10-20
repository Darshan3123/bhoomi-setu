import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import LoadingSpinner from "@/components/LoadingSpinner";
import { toast } from "react-toastify";
import { ethers } from "ethers";
import Link from "next/link";

// Verification Timeline Component
function VerificationTimeline({ notifications }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Sort notifications by date (newest first)
  const sortedNotifications = notifications.sort(
    (a, b) => new Date(b.sentAt) - new Date(a.sentAt)
  );

  const visibleNotifications = isExpanded
    ? sortedNotifications
    : sortedNotifications.slice(0, 2);

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return (
        date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }) + " today"
      );
    } else if (diffInHours < 48) {
      return (
        date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }) + " yesterday"
      );
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    }
  };

  return (
    <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
      <div className="flex items-start">
        <svg
          className="w-5 h-5 text-blue-600 mt-0.5 mr-2"
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
        <div className="text-sm flex-1">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-blue-900">Verification Timeline</p>
            {notifications.length > 2 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center"
              >
                {isExpanded ? (
                  <>
                    Show Less
                    <svg
                      className="w-3 h-3 ml-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 15l7-7 7 7"
                      />
                    </svg>
                  </>
                ) : (
                  <>
                    Show All ({notifications.length})
                    <svg
                      className="w-3 h-3 ml-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="space-y-3">
            {visibleNotifications.map((notification, index) => (
              <div
                key={notification._id || index}
                className="flex items-start space-x-3"
              >
                <div
                  className={`w-2.5 h-2.5 rounded-full mt-2 flex-shrink-0 ${
                    notification.type === "success"
                      ? "bg-green-500"
                      : notification.type === "warning"
                      ? "bg-yellow-500"
                      : notification.type === "error"
                      ? "bg-red-500"
                      : "bg-blue-500"
                  }`}
                ></div>
                <div className="flex-1 min-w-0">
                  <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                    <p className="text-gray-800 text-sm leading-relaxed mb-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-blue-600 text-xs font-medium">
                        {formatDateTime(notification.sentAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {isExpanded && notifications.length > 2 && (
            <div className="mt-3 pt-2 border-t border-blue-200">
              <p className="text-xs text-blue-700 text-center">
                Showing all {notifications.length} verification updates
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function UserProperties() {
  const router = useRouter();
  const { user, isAuthenticated, loading, token } = useAuth();

  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    forSale: 0,
    sold: 0,
    totalValue: "0",
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/");
    } else if (isAuthenticated) {
      fetchProperties();
    }
  }, [isAuthenticated, loading, router]);

  const fetchProperties = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api"
        }/properties/my-properties`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        // Debug: Check if verification notifications are present
        console.log(
          "🔍 Properties - Properties received:",
          data.properties.length
        );
        if (data.properties.length > 0) {
          console.log(
            "🔍 Properties - First property notifications:",
            data.properties[0].verificationNotifications
          );
        }

        setProperties(data.properties);

        // Calculate stats
        const total = data.properties.length;
        const approvedProperties = data.properties.filter(
          (p) => p.source === "approved"
        );
        const pendingProperties = data.properties.filter(
          (p) => p.source === "verification"
        );
        const forSale = approvedProperties.filter((p) => p.forSale).length;
        const sold = approvedProperties.filter(
          (p) => p.status === "sold"
        ).length;

        // Calculate total value (only for approved properties)
        const totalValue = approvedProperties.reduce((sum, p) => {
          try {
            return sum + parseFloat(ethers.formatEther(p.priceInWei || "0"));
          } catch {
            return sum;
          }
        }, 0);

        setStats({
          total,
          approved: approvedProperties.length,
          pending: pendingProperties.length,
          forSale,
          sold,
          totalValue: totalValue.toFixed(3),
        });
      } else {
        setError(data.error || "Failed to fetch properties");
      }
    } catch (err) {
      setError("Network error occurred");
      console.error("Fetch properties error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (priceInWei) => {
    try {
      const price = ethers.formatEther(priceInWei || "0");
      return parseFloat(price) === 0 ? "Not set" : price;
    } catch {
      return "Not set";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status, forSale, source) => {
    // Handle verification statuses (from PropertyVerification table)
    if (source === "verification") {
      switch (status) {
        case "pending":
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-1.5"></div>
              Pending Verification
            </span>
          );

        case "inspected":
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-1.5"></div>
              Inspected
            </span>
          );
        case "rejected":
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5"></div>
              Rejected
            </span>
          );
        default:
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              <div className="w-1.5 h-1.5 bg-gray-500 rounded-full mr-1.5"></div>
              {status}
            </span>
          );
      }
    }

    // Handle approved property statuses (from Property table)
    if (status === "sold") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <div className="w-1.5 h-1.5 bg-gray-500 rounded-full mr-1.5"></div>
          Sold
        </span>
      );
    } else if (forSale) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></div>
          For Sale
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></div>
          Approved
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
    <Layout title="My Properties - Bhoomi Setu">
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  My Properties
                </h1>
                <p className="mt-2 text-sm text-gray-600">
                  Manage and track your registered properties on the blockchain
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Link
                  href="/marketplace"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
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
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  Browse Marketplace
                </Link>
                <Link
                  href="/add-property"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-lg hover:shadow-xl"
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add New Property
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                      <svg
                        className="w-6 h-6 text-white"
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
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Properties
                      </dt>
                      <dd className="text-2xl font-bold text-gray-900">
                        {stats.total}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        For Sale
                      </dt>
                      <dd className="text-2xl font-bold text-gray-900">
                        {stats.forSale}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                      <svg
                        className="w-6 h-6 text-white"
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
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Pending Verification
                      </dt>
                      <dd className="text-2xl font-bold text-gray-900">
                        {stats.pending || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                      <svg
                        className="w-6 h-6 text-white"
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
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Value
                      </dt>
                      <dd className="text-2xl font-bold text-gray-900">
                        {stats.totalValue} ETH
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Properties List */}
          <div className="bg-white shadow-lg rounded-xl border border-gray-100">
            <div className="px-6 py-5 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  Properties ({properties.length})
                </h2>
                <div className="flex items-center space-x-2">
                  <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    <svg
                      className="w-3 h-3 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z"
                      />
                    </svg>
                    Filter
                  </button>
                  <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    <svg
                      className="w-3 h-3 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                      />
                    </svg>
                    Sort
                  </button>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="p-12 text-center">
                <LoadingSpinner />
                <p className="mt-4 text-gray-600">Loading your properties...</p>
              </div>
            ) : error ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <svg
                    className="w-8 h-8 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Error Loading Properties
                </h3>
                <p className="text-sm text-gray-500 mb-4">{error}</p>
                <button
                  onClick={fetchProperties}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Try Again
                </button>
              </div>
            ) : properties.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {properties.map((property, index) => {
                  const typeInfo = getPropertyTypeIcon(property.propertyType);
                  return (
                    <div
                      key={property.id || index}
                      className="p-6 hover:bg-gray-50 transition-colors duration-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          {/* Property Icon */}
                          <div className="flex-shrink-0">
                            <div
                              className={`w-16 h-16 ${typeInfo.color} rounded-xl flex items-center justify-center text-2xl shadow-sm`}
                            >
                              {typeInfo.icon}
                            </div>
                          </div>

                          {/* Property Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3 mb-3">
                              <h3 className="text-lg font-semibold text-gray-900">
                                Survey ID: {property.surveyId}
                              </h3>
                              {getStatusBadge(
                                property.status,
                                property.forSale,
                                property.source
                              )}
                            </div>

                            <div className="flex items-center text-sm text-gray-600 mb-3">
                              <svg
                                className="w-4 h-4 mr-1.5 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                              <span className="truncate">
                                {property.location}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div className="flex items-center">
                                <span className="font-medium text-gray-700 mr-2">
                                  Type:
                                </span>
                                <span className="text-gray-600">
                                  {property.propertyType}
                                </span>
                              </div>
                              <div className="flex items-center">
                                <span className="font-medium text-gray-700 mr-2">
                                  Area:
                                </span>
                                <span className="text-gray-600">
                                  {property.area} {property.areaUnit}
                                </span>
                              </div>
                              <div className="flex items-center">
                                <span className="font-medium text-gray-700 mr-2">
                                  Price:
                                </span>
                                <span className="text-gray-900 font-semibold">
                                  {formatPrice(property.priceInWei)} ETH
                                </span>
                                {property.priceInINR > 0 && (
                                  <span className="text-gray-500 ml-1">
                                    (₹{property.priceInINR.toLocaleString()})
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center">
                                <span className="font-medium text-gray-700 mr-2">
                                  Registered:
                                </span>
                                <span className="text-gray-600">
                                  {formatDate(property.createdAt)}
                                </span>
                              </div>
                            </div>

                            {/* Documents Status */}
                            <div className="mt-4 flex flex-wrap gap-2">
                              {property.hasDocuments?.saleDeed && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                  <svg
                                    className="w-3 h-3 mr-1"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  Sale Deed
                                </span>
                              )}
                              {property.hasDocuments?.taxReceipt && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                  <svg
                                    className="w-3 h-3 mr-1"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  Tax Receipt
                                </span>
                              )}
                              {property.hasDocuments?.noc && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                  <svg
                                    className="w-3 h-3 mr-1"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  NOC
                                </span>
                              )}
                              {property.hasDocuments?.propertyPhoto && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                  <svg
                                    className="w-3 h-3 mr-1"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  Photo
                                </span>
                              )}
                            </div>

                            {/* Additional info for pending properties */}
                            {property.source === "verification" && (
                              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-start">
                                  <svg
                                    className="w-5 h-5 text-blue-600 mt-0.5 mr-2"
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
                                  <div className="text-sm">
                                    <p className="font-medium text-blue-900 mb-1">
                                      Verification Status
                                    </p>
                                    {property.verificationId && (
                                      <p className="text-blue-800 mb-1">
                                        Verification ID: #
                                        {property.verificationId}
                                      </p>
                                    )}
                                    {property.inspectorAddress && (
                                      <p className="text-blue-700 mb-1">
                                        Inspector:{" "}
                                        {property.inspectorAddress.slice(0, 6)}
                                        ...{property.inspectorAddress.slice(-4)}
                                      </p>
                                    )}
                                    {property.rejectionReason && (
                                      <p className="text-red-700 font-medium">
                                        Rejection Reason:{" "}
                                        {property.rejectionReason}
                                      </p>
                                    )}
                                    {property.status === "pending" && (
                                      <p className="text-blue-700">
                                        Your property is waiting for inspector
                                        assignment.
                                      </p>
                                    )}


                                    {property.status === "inspected" && (
                                      <p className="text-blue-700">
                                        Property has been inspected. Awaiting
                                        final approval.
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Verification Messages Timeline */}
                            {property.verificationNotifications &&
                              property.verificationNotifications.length > 0 && (
                                <VerificationTimeline
                                  notifications={
                                    property.verificationNotifications
                                  }
                                />
                              )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex-shrink-0 flex flex-col space-y-2 ml-4">
                          {/* Only show "List for Sale" for approved properties */}
                          {property.source === "approved" &&
                            !property.forSale &&
                            property.status !== "sold" && (
                              <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200">
                                <svg
                                  className="w-4 h-4 mr-1.5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                                  />
                                </svg>
                                List for Sale
                              </button>
                            )}

                          {/* Direct Verification Status Display */}
                          {property.source === "verification" &&
                            property.verificationStatus && (
                              <div
                                className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg ${
                                  property.verificationStatus === "verified"
                                    ? "text-green-700 bg-green-50 border border-green-200"
                                    : property.verificationStatus === "rejected"
                                    ? "text-red-700 bg-red-50 border border-red-200"
                                    : property.verificationStatus ===
                                      "inspected"
                                    ? "text-purple-700 bg-purple-50 border border-purple-200"

                                    : "text-yellow-700 bg-yellow-50 border border-yellow-200"
                                }`}
                              >
                                <div
                                  className={`w-2 h-2 rounded-full mr-2 ${
                                    property.verificationStatus === "verified"
                                      ? "bg-green-500"
                                      : property.verificationStatus ===
                                        "rejected"
                                      ? "bg-red-500"
                                      : property.verificationStatus ===
                                        "inspected"
                                      ? "bg-purple-500"
                                      : "bg-yellow-500"
                                  }`}
                                ></div>
                                {property.verificationStatus === "verified" &&
                                  "✅ Verified"}
                                {property.verificationStatus === "rejected" &&
                                  "❌ Rejected"}
                                {property.verificationStatus === "inspected" &&
                                  "🔍 Inspected"}
                                {property.verificationStatus === "pending" &&
                                  "⏳ Pending"}
                                {![
                                  "verified",
                                  "rejected",
                                  "inspected",
                                  "pending",
                                ].includes(property.verificationStatus) &&
                                  `📋 ${property.verificationStatus
                                    .replace("_", " ")
                                    .toUpperCase()}`}
                              </div>
                            )}

                          {property.forSale && (
                            <button className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200">
                              <svg
                                className="w-4 h-4 mr-1.5"
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
                              Remove from Sale
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-16 text-center">
                <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-6">
                  <svg
                    className="w-10 h-10 text-gray-400"
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
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  No properties registered yet
                </h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  You haven't registered any properties yet. Start by adding
                  your first property to the blockchain registry.
                </p>
                <Link
                  href="/add-property"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-lg hover:shadow-xl"
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add Your First Property
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
