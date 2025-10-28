import { useState, useEffect } from "react";
import Layout from "@/components/Layout";

// Transaction Details Component (same as in properties.js)
function TransactionDetails({ transactionHash, isOpen, onClose }) {
  const [transactionData, setTransactionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && transactionHash) {
      fetchTransactionDetails();
    }
  }, [isOpen, transactionHash]);

  const fetchTransactionDetails = async () => {
    if (!transactionHash) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Initialize provider
      const { ethers } = await import("ethers");
      const provider = new ethers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_RPC_URL || "http://localhost:8545"
      );

      // Fetch transaction receipt
      const receipt = await provider.getTransactionReceipt(transactionHash);
      if (!receipt) {
        throw new Error("Transaction not found");
      }

      // Fetch transaction details
      const transaction = await provider.getTransaction(transactionHash);
      
      // Fetch block details
      const block = await provider.getBlock(receipt.blockNumber);
      
      // Get current block number
      const currentBlockNumber = await provider.getBlockNumber();
      
      // Calculate confirmations
      const confirmations = currentBlockNumber - receipt.blockNumber;

      // Get gas price
      const gasPrice = await provider.getFeeData();

      // Get balance of from address
      const fromBalance = await provider.getBalance(transaction.from);
      
      // Get balance of to address (if exists)
      let toBalance = "0";
      if (transaction.to) {
        toBalance = await provider.getBalance(transaction.to);
      }

      // Get owner information
      const ownerInfo = {
        currentOwner: transaction.to || "Contract",
        previousOwner: transaction.from,
        ownershipTransferred: transaction.value !== "0",
      };

      setTransactionData({
        hash: transactionHash,
        from: transaction.from,
        to: transaction.to,
        value: ethers.formatEther(transaction.value),
        blockNumber: receipt.blockNumber,
        blockHash: receipt.blockHash,
        transactionIndex: receipt.transactionIndex,
        confirmations,
        status: receipt.status === 1 ? "Success" : "Failed",
        timestamp: new Date(block.timestamp * 1000).toISOString(),
        fromBalance: ethers.formatEther(fromBalance),
        toBalance: ethers.formatEther(toBalance),
        nonce: transaction.nonce,
        data: transaction.data,
        logs: receipt.logs,
        ownerInfo,
      });
    } catch (err) {
      console.error("Error fetching transaction details:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Transaction Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-3 text-gray-600">Fetching transaction details...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Transaction</h3>
              <p className="text-sm text-gray-500 mb-4">{error}</p>
              <button
                onClick={fetchTransactionDetails}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Try Again
              </button>
            </div>
          ) : transactionData ? (
            <div className="space-y-6">
              {/* Transaction Status */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Transaction Status</h3>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    transactionData.status === "Success" 
                      ? "bg-green-100 text-green-800" 
                      : "bg-red-100 text-red-800"
                  }`}>
                    {transactionData.status === "Success" ? "✅" : "❌"} {transactionData.status}
                  </span>
                </div>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Transaction Info</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hash</label>
                    <div className="bg-gray-50 p-3 rounded-lg font-mono text-sm break-all">
                      {transactionData.hash}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Block Number</label>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      #{transactionData.blockNumber} ({transactionData.confirmations} confirmations)
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Timestamp</label>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      {new Date(transactionData.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Owner Information</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Previous Owner</label>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="font-mono text-sm break-all mb-2">
                        {transactionData.ownerInfo.previousOwner}
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Balance: {parseFloat(transactionData.fromBalance).toFixed(4)} ETH
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Owner</label>
                    <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                      <div className="font-mono text-sm break-all mb-2">
                        {transactionData.ownerInfo.currentOwner}
                      </div>
                      {transactionData.to && (
                        <div className="flex items-center text-xs text-green-700">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          Balance: {parseFloat(transactionData.toBalance).toFixed(4)} ETH
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Transfer Value</label>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <span className="text-lg font-semibold">{transactionData.value} ETH</span>
                      {transactionData.ownerInfo.ownershipTransferred && (
                        <div className="text-xs text-green-600 mt-1 flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Ownership transferred with payment
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Ownership Transfer Status */}
              <div className="bg-indigo-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Ownership Transfer Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Transfer Type</label>
                    <div className="bg-white p-3 rounded-lg">
                      {transactionData.ownerInfo.ownershipTransferred ? (
                        <span className="inline-flex items-center text-green-700">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                          Paid Transfer
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-blue-700">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Contract Interaction
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirmations</label>
                    <div className="bg-white p-3 rounded-lg">
                      <span className="font-semibold">{transactionData.confirmations}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        {transactionData.confirmations >= 12 ? "✅ Confirmed" : "⏳ Pending"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function TestTransaction() {
  const [showModal, setShowModal] = useState(false);
  const [selectedHash, setSelectedHash] = useState("");

  // Sample transaction hashes for testing
  const sampleTransactions = [
    "0x9cb9c21bf4db551b1545334ad018ab69da19fe9abaff290be7af0ad13bfa02cb",
    "0x89d6ba0b0e109e142e8afdc93490aebec6a2b58747f23d9179e0584c2ea53794",
  ];

  const handleViewTransaction = (hash) => {
    setSelectedHash(hash);
    setShowModal(true);
  };

  return (
    <Layout title="Test Transaction Details">
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Transaction Details Test Page
            </h1>
            <p className="text-lg text-gray-600">
              Test the transaction details functionality with sample transaction hashes
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Sample Transactions
            </h2>
            
            <div className="space-y-4">
              {sampleTransactions.map((hash, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900 mb-2">
                        Transaction #{index + 1}
                      </h3>
                      <code className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded break-all">
                        {hash}
                      </code>
                    </div>
                    <button
                      onClick={() => handleViewTransaction(hash)}
                      className="ml-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex">
                <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm">
                  <p className="font-medium text-yellow-900 mb-1">Note:</p>
                  <p className="text-yellow-800">
                    Make sure your local blockchain node is running on port 8545 to fetch real transaction data.
                    The transaction details will show comprehensive information including gas usage, block details, and balances.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <TransactionDetails
        transactionHash={selectedHash}
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedHash("");
        }}
      />
    </Layout>
  );
}