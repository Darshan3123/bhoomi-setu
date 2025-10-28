import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { useWeb3 } from "@/contexts/Web3Context";
import Layout from "@/components/Layout";
import LoadingSpinner from "@/components/LoadingSpinner";
import { toast } from "react-toastify";
import { ethers } from "ethers";
import Link from "next/link";

export default function UserDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, loading, logout, token } = useAuth();
  const { account, disconnectWallet } = useWeb3();

  // State for properties data
  const [properties, setProperties] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    forSale: 0,
    sold: 0,
    totalValue: "0",
  });
  const [isLoadingProperties, setIsLoadingProperties] = useState(true);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/");
    } else if (isAuthenticated) {
      fetchProperties();
    }
  }, [isAuthenticated, loading, router]);

  const fetchProperties = async () => {
    try {
      setIsLoadingProperties(true);
      console.log(
        "🔍 Dashboard - Fetching properties with token:",
        token ? "Present" : "Missing"
      );

      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003/api"
        }/properties/my-properties`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("🔍 Dashboard - Response status:", response.status);
      console.log("🔍 Dashboard - Response ok:", response.ok);

      const data = await response.json();
      console.log("🔍 Dashboard - Response data:", data);

      if (data.success) {
        // Debug: Check if verification notifications are present
        console.log('🔍 Dashboard - Properties received:', data.properties.length);
        if (data.properties.length > 0) {
          console.log('🔍 Dashboard - First property notifications:', data.properties[0].verificationNotifications);
        }
        
        // Get recent properties (last 3)
        const recentProperties = data.properties.slice(0, 3);
        setProperties(recentProperties);

        // Calculate stats
        const total = data.properties.length;
        const forSale = data.properties.filter((p) => p.forSale).length;
        const sold = data.properties.filter((p) => p.status === "sold").length;

        // Calculate total value
        const totalValue = data.properties.reduce((sum, p) => {
          try {
            return sum + parseFloat(ethers.formatEther(p.priceInWei || "0"));
          } catch {
            return sum;
          }
        }, 0);

        setStats({ total, forSale, sold, totalValue: totalValue.toFixed(3) });
      } else {
        console.error("🔍 Dashboard - API returned error:", data.error);
      }
    } catch (err) {
      console.error("🔍 Dashboard - Network error:", err);
    } finally {
      setIsLoadingProperties(false);
    }
  };

  const handleLogout = () => {
    logout();
    disconnectWallet();
    router.push("/");
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
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  User Dashboard
                </h1>
                <p className="text-sm text-gray-600">
                  Welcome back,{" "}
                  {user?.profile?.name ||
                    `${account?.slice(0, 6)}...${account?.slice(-4)}`}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                {/* Admin Button - Only visible to admin users */}
                {user?.role === "admin" && (
                  <button
                    onClick={() => router.push("/admin")}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
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
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                    Admin Panel
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Welcome Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-indigo-100">
                      <svg
                        className="w-6 h-6 text-indigo-600"
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
                  <div className="ml-5">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Welcome to Bhoomi Setu!
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      You can register land properties, manage transfers, and
                      access all land registry features.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-6">
              {/* My Properties */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-6 w-6 text-gray-400"
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
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          My Properties
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stats.total}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Transfers */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-6 w-6 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                        />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          For Sale
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stats.forSale}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              {/* Certificates */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-6 w-6 text-gray-400"
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
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Value
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stats.totalValue} ETH
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Quick Actions
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {user?.role === "admin" ? (
                    <>
                      <button
                        onClick={() => router.push("/admin")}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
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
                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                          />
                        </svg>
                        Admin Panel
                      </button>
                      <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                        User Management
                      </button>
                      <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                        System Reports
                      </button>
                    </>
                  ) : user?.role === "buyer" ? (
                    <>
                      <button
                        onClick={() => router.push("/marketplace")}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
                        Browse Properties
                      </button>
                      <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        My Purchases
                      </button>
                      <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        Transfer History
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => router.push("/add-property")}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
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
                        Add Property
                      </button>
                      <button
                        onClick={() => router.push("/user/properties")}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
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
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                        My Properties
                      </button>
                      <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-one focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                        Sales History
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Properties */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Recent Properties
                  </h3>
                  <Link
                    href="/user/properties"
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    View all →
                  </Link>
                </div>

                {isLoadingProperties ? (
                  <div className="flex justify-center items-center py-8">
                    <LoadingSpinner />
                    <span className="ml-2 text-gray-600">
                      Loading properties...
                    </span>
                  </div>
                ) : properties.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {properties.map((property, index) => {
                      const getPropertyTypeIcon = (type) => {
                        const icons = {
                          Residential: {
                            icon: "🏠",
                            color: "bg-blue-100 text-blue-600",
                          },
                          Commercial: {
                            icon: "🏢",
                            color: "bg-purple-100 text-purple-600",
                          },
                          Agricultural: {
                            icon: "🌾",
                            color: "bg-green-100 text-green-600",
                          },
                          Industrial: {
                            icon: "🏭",
                            color: "bg-orange-100 text-orange-600",
                          },
                        };
                        return (
                          icons[type] || {
                            icon: "🏠",
                            color: "bg-gray-100 text-gray-600",
                          }
                        );
                      };

                      const getStatusBadge = (status, forSale) => {
                        if (status === "transferred" || status === "sold") {
                          return (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Sold
                            </span>
                          );
                        } else if (forSale && status === "active") {
                          return (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              For Sale
                            </span>
                          );
                        } else if (status === "active") {
                          return (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Owned
                            </span>
                          );
                        } else {
                          return (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {status || "Unknown"}
                            </span>
                          );
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

                      const typeInfo = getPropertyTypeIcon(
                        property.propertyType
                      );

                      return (
                        <div
                          key={property.id || index}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div
                                className={`w-10 h-10 ${typeInfo.color} rounded-lg flex items-center justify-center text-lg`}
                              >
                                {typeInfo.icon}
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-gray-900">
                                  {property.surveyId}
                                </h4>
                                <p className="text-xs text-gray-500">
                                  {property.propertyType}
                                </p>
                              </div>
                            </div>
                            {getStatusBadge(property.status, property.forSale)}
                          </div>

                          <div className="mb-3">
                            <p className="text-sm text-gray-600 flex items-center">
                              <svg
                                className="w-3 h-3 mr-1 text-gray-400"
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
                                {property.location.length > 30
                                  ? `${property.location.substring(0, 30)}...`
                                  : property.location}
                              </span>
                            </p>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <div>
                              <span className="text-gray-500">Area:</span>
                              <span className="ml-1 font-medium text-gray-900">
                                {property.area} {property.areaUnit}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Price:</span>
                              <span className="ml-1 font-medium text-gray-900">
                                {formatPrice(property.priceInWei) === "Not set" ? (
                                  <span className="text-orange-600">Not set</span>
                                ) : (
                                  `${formatPrice(property.priceInWei)} ETH`
                                )}
                              </span>
                            </div>
                          </div>

                          {/* Latest Verification Message */}
                          {property.verificationNotifications && property.verificationNotifications.length > 0 && (() => {
                            const latestNotification = property.verificationNotifications
                              .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))[0];
                            
                            const formatDateTime = (dateString) => {
                              const date = new Date(dateString);
                              const now = new Date();
                              const diffInHours = (now - date) / (1000 * 60 * 60);
                              
                              if (diffInHours < 1) {
                                return 'Just now';
                              } else if (diffInHours < 24) {
                                return date.toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true
                                });
                              } else if (diffInHours < 48) {
                                return 'Yesterday';
                              } else {
                                return date.toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric'
                                });
                              }
                            };

                            return (
                              <div className="mt-3 p-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg text-xs">
                                <div className="flex items-start space-x-2">
                                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                                    latestNotification.type === 'success' ? 'bg-green-500' :
                                    latestNotification.type === 'warning' ? 'bg-yellow-500' :
                                    latestNotification.type === 'error' ? 'bg-red-500' :
                                    'bg-blue-500'
                                  }`}></div>
                                  <div className="flex-1">
                                    <p className="text-blue-900 leading-relaxed font-medium">
                                      {latestNotification.message}
                                    </p>
                                    <div className="flex items-center justify-between mt-1">
                                      <p className="text-blue-600 font-medium">
                                        {formatDateTime(latestNotification.sentAt)}
                                      </p>
                                      <span className="text-blue-500 text-xs">
                                        Latest update
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <svg
                        className="w-8 h-8 text-gray-400"
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
                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                      No properties yet
                    </h4>
                    <p className="text-sm text-gray-500 mb-4">
                      Start by registering your first property on the
                      blockchain.
                    </p>
                    <Link
                      href="/add-property"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
                      Add Property
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
