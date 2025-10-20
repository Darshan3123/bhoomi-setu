import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import LoadingSpinner from "@/components/LoadingSpinner";
import { toast } from "react-toastify";
import { ethers } from "ethers";
import Link from "next/link";

export default function Marketplace() {
  const router = useRouter();

  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter states
  const [filters, setFilters] = useState({
    propertyType: "",
    minPrice: "",
    maxPrice: "",
    location: "",
    sortBy: "newest",
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const propertiesPerPage = 12;

  useEffect(() => {
    fetchProperties();
  }, [currentPage]);

  useEffect(() => {
    applyFilters();
  }, [properties, filters]);

  const fetchProperties = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api"
        }/properties?forSale=true&page=${currentPage}&limit=${propertiesPerPage}`
      );

      const data = await response.json();

      if (data.success) {
        setProperties(data.properties);
        setTotalPages(data.pagination.totalPages);
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

  const applyFilters = () => {
    let filtered = [...properties];

    // Filter by property type
    if (filters.propertyType) {
      filtered = filtered.filter(
        (p) => p.propertyType === filters.propertyType
      );
    }

    // Filter by location
    if (filters.location) {
      filtered = filtered.filter((p) =>
        p.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    // Filter by price range
    if (filters.minPrice || filters.maxPrice) {
      filtered = filtered.filter((p) => {
        const priceInETH = parseFloat(ethers.formatEther(p.priceInWei));
        const minPrice = filters.minPrice ? parseFloat(filters.minPrice) : 0;
        const maxPrice = filters.maxPrice
          ? parseFloat(filters.maxPrice)
          : Infinity;
        return priceInETH >= minPrice && priceInETH <= maxPrice;
      });
    }

    // Sort properties
    switch (filters.sortBy) {
      case "newest":
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case "oldest":
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case "price-low":
        filtered.sort(
          (a, b) => parseFloat(a.priceInWei) - parseFloat(b.priceInWei)
        );
        break;
      case "price-high":
        filtered.sort(
          (a, b) => parseFloat(b.priceInWei) - parseFloat(a.priceInWei)
        );
        break;
      case "area-small":
        filtered.sort((a, b) => a.area - b.area);
        break;
      case "area-large":
        filtered.sort((a, b) => b.area - a.area);
        break;
      default:
        break;
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
      minPrice: "",
      maxPrice: "",
      location: "",
      sortBy: "newest",
    });
  };

  const formatPrice = (priceInWei) => {
    try {
      const price = ethers.formatEther(priceInWei || "0");
      return parseFloat(price) === 0 ? "Price not set" : price;
    } catch {
      return "Price not set";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
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

  const truncateAddress = (address, startChars = 6, endChars = 4) => {
    if (!address) return "";
    if (address.length <= startChars + endChars) return address;
    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
  };

  const propertyTypes = [
    { value: "", label: "All Types" },
    { value: "Agricultural", label: "Agricultural" },
    { value: "Residential", label: "Residential" },
    { value: "Commercial", label: "Commercial" },
    { value: "Industrial", label: "Industrial" },
  ];

  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "price-low", label: "Price: Low to High" },
    { value: "price-high", label: "Price: High to Low" },
    { value: "area-small", label: "Area: Small to Large" },
    { value: "area-large", label: "Area: Large to Small" },
  ];

  return (
    <Layout title="Property Marketplace - Bhoomi Setu">
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Property Marketplace
                </h1>
                <p className="text-sm text-gray-600">
                  Discover and buy properties registered on the blockchain
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  {filteredProperties.length} properties available
                </span>
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
                  List Property
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Filters Sidebar */}
            <div className="lg:w-1/4">
              <div className="bg-white rounded-lg shadow p-6 sticky top-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Filters
                  </h2>
                  <button
                    onClick={clearFilters}
                    className="text-sm text-indigo-600 hover:text-indigo-500"
                  >
                    Clear All
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Property Type Filter */}
                  <div>
                    <label
                      htmlFor="propertyType"
                      className="block text-sm font-medium text-gray-700 mb-2"
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
                      {propertyTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Location Filter */}
                  <div>
                    <label
                      htmlFor="location"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Location
                    </label>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={filters.location}
                      onChange={handleFilterChange}
                      placeholder="Search by location..."
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  {/* Price Range Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price Range (ETH)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        name="minPrice"
                        value={filters.minPrice}
                        onChange={handleFilterChange}
                        placeholder="Min"
                        step="0.01"
                        className="border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                      <input
                        type="number"
                        name="maxPrice"
                        value={filters.maxPrice}
                        onChange={handleFilterChange}
                        placeholder="Max"
                        step="0.01"
                        className="border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  {/* Sort By */}
                  <div>
                    <label
                      htmlFor="sortBy"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Sort By
                    </label>
                    <select
                      id="sortBy"
                      name="sortBy"
                      value={filters.sortBy}
                      onChange={handleFilterChange}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      {sortOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Properties Grid */}
            <div className="lg:w-3/4">
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <LoadingSpinner />
                  <span className="ml-2 text-gray-600">
                    Loading properties...
                  </span>
                </div>
              ) : error ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-red-400"
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
                  <h3 className="mt-4 text-lg font-medium text-gray-900">
                    Error Loading Properties
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">{error}</p>
                  <button
                    onClick={fetchProperties}
                    className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                  >
                    Try Again
                  </button>
                </div>
              ) : filteredProperties.length > 0 ? (
                <>
                  {/* Properties Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredProperties.map((property) => (
                      <div
                        key={property.id}
                        className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
                      >
                        {/* Property Image Placeholder */}
                        <div className="h-48 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-t-lg flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-4xl mb-2">
                              {getPropertyTypeIcon(property.propertyType)}
                            </div>
                            <span className="text-sm text-gray-600">
                              {property.propertyType}
                            </span>
                          </div>
                        </div>

                        <div className="p-6">
                          {/* Property Header */}
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                {property.surveyId}
                              </h3>
                              <p className="text-sm text-gray-600 flex items-center">
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
                                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                </svg>
                                {property.location.length > 50
                                  ? `${property.location.substring(0, 50)}...`
                                  : property.location}
                              </p>
                            </div>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              For Sale
                            </span>
                          </div>

                          {/* Property Details */}
                          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                            <div>
                              <span className="text-gray-500">Area:</span>
                              <span className="ml-1 font-medium">
                                {property.area} {property.areaUnit}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Listed:</span>
                              <span className="ml-1 font-medium">
                                {formatDate(property.createdAt)}
                              </span>
                            </div>
                          </div>

                          {/* Price */}
                          <div className="mb-4">
                            <div className="text-2xl font-bold text-gray-900">
                              {formatPrice(property.priceInWei)} ETH
                            </div>
                            {property.priceInINR > 0 && (
                              <div className="text-sm text-gray-500">
                                ≈ ₹{property.priceInINR.toLocaleString()}
                              </div>
                            )}
                          </div>

                          {/* Owner Info */}
                          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                            <div className="text-xs text-gray-500 mb-1">
                              Owner
                            </div>
                            <div className="text-sm font-mono text-gray-700 break-all">
                              {truncateAddress(property.ownerAddress)}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex space-x-2">
                            <Link
                              href={`/property/${property.surveyId}`}
                              className="flex-1 bg-indigo-600 text-white text-center py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium"
                            >
                              View Details
                            </Link>
                            <button className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors text-sm font-medium">
                              Buy Now
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-8 flex justify-center">
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() =>
                            setCurrentPage((prev) => Math.max(prev - 1, 1))
                          }
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg
                            className="h-5 w-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>

                        {[...Array(totalPages)].map((_, index) => (
                          <button
                            key={index + 1}
                            onClick={() => setCurrentPage(index + 1)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === index + 1
                                ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                                : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                            }`}
                          >
                            {index + 1}
                          </button>
                        ))}

                        <button
                          onClick={() =>
                            setCurrentPage((prev) =>
                              Math.min(prev + 1, totalPages)
                            )
                          }
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg
                            className="h-5 w-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </nav>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-white rounded-lg shadow p-12 text-center">
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
                    No Properties Found
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    {Object.values(filters).some((f) => f)
                      ? "Try adjusting your filters to see more properties."
                      : "No properties are currently listed for sale."}
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
        </div>
      </div>
    </Layout>
  );
}
