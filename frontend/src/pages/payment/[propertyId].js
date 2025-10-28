import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { useWeb3 } from '@/contexts/Web3Context';
import Layout from '@/components/Layout';
import { toast } from 'react-toastify';
import { ethers } from 'ethers';
import { updatePropertyStatusAfterPurchase } from '@/utils/propertyStatusUpdater';

export default function PaymentPage() {
  const router = useRouter();
  const { propertyId } = router.query;
  const { user, token } = useAuth();
  const { account, connectWallet, provider, signer } = useWeb3();

  const [property, setProperty] = useState(null);
  const [owner, setOwner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState('pending'); // pending, processing, success, failed
  const [transactionHash, setTransactionHash] = useState('');
  const [costBreakdown, setCostBreakdown] = useState(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  // Contract details
  const CONTRACT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  const CONTRACT_ABI = [
    "function purchaseProperty(uint256 landId) external payable",
    "function calculateTotalCost(uint256 landId) external view returns (uint256 basePrice, uint256 taxAmount, uint256 totalCost)",
    "function propertyTaxRate() external view returns (uint256)"
  ];

  useEffect(() => {
    if (propertyId) {
      fetchPropertyDetails();
    }
  }, [propertyId]);

  const fetchPropertyDetails = async () => {
    try {
      setLoading(true);
      
      // Try to fetch property details by surveyId first, then by MongoDB _id
      let response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003/api"}/properties/${propertyId}`
      );
      
      // If not found and propertyId looks like a MongoDB ObjectId, try the unified route
      if (!response.ok && propertyId.length === 24) {
        console.log('Trying to fetch by MongoDB ID...');
        // For now, we'll need to get all properties and find by _id
        // This is not optimal but works as a fallback
        const allPropsResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003/api"}/properties?forSale=true&limit=100`
        );
        
        if (allPropsResponse.ok) {
          const allPropsData = await allPropsResponse.json();
          if (allPropsData.success) {
            const foundProperty = allPropsData.properties.find(p => p.id === propertyId || p._id === propertyId);
            if (foundProperty) {
              // Create a mock response structure
              response = {
                ok: true,
                json: async () => ({ success: true, property: foundProperty })
              };
            }
          }
        }
      }
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProperty(data.property);
          
          // Fetch owner details
          await fetchOwnerDetails(data.property.ownerAddress);
          
          // Calculate costs if property has price data
          if (data.property.priceInWei && provider) {
            await calculateCosts(data.property);
          }
        } else {
          toast.error('Property not found');
          router.push('/marketplace');
        }
      } else {
        throw new Error('Failed to fetch property');
      }
    } catch (error) {
      console.error('Error fetching property:', error);
      toast.error('Failed to load property details');
      router.push('/marketplace');
    } finally {
      setLoading(false);
    }
  };

  const fetchOwnerDetails = async (ownerAddress) => {
    try {
      // Try to fetch actual owner details from the database
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003/api"}/auth/users/by-address/${ownerAddress}`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          setOwner({
            name: data.user.profile?.name || 'Property Owner',
            walletAddress: ownerAddress,
            email: data.user.profile?.email || 'Not provided',
            phone: data.user.profile?.phone || 'Not provided'
          });
        } else {
          // Fallback to placeholder if user not found
          setOwner({
            name: 'Property Owner',
            walletAddress: ownerAddress,
            email: 'Not provided',
            phone: 'Not provided'
          });
        }
      } else {
        // Fallback to placeholder if API call fails
        setOwner({
          name: 'Property Owner',
          walletAddress: ownerAddress,
          email: 'Not provided',
          phone: 'Not provided'
        });
      }
    } catch (error) {
      console.error('Error fetching owner details:', error);
      // Fallback to placeholder
      setOwner({
        name: 'Property Owner',
        walletAddress: ownerAddress,
        email: 'Not provided',
        phone: 'Not provided'
      });
    }
  };

  const calculateCosts = async (propertyData) => {
    try {
      if (!provider || !propertyData.priceInWei) return;

      // Use property price from database and calculate tax
      const basePrice = ethers.formatEther(propertyData.priceInWei);
      const basePriceFloat = parseFloat(basePrice);
      
      // Default tax rate of 2% (you can make this configurable)
      const taxRate = 2.0;
      const taxAmount = (basePriceFloat * taxRate / 100).toFixed(6);
      const totalCost = (basePriceFloat + parseFloat(taxAmount)).toFixed(6);

      const breakdown = {
        basePrice: basePrice,
        taxAmount: taxAmount,
        totalCost: totalCost,
        taxRate: taxRate.toFixed(1)
      };

      setCostBreakdown(breakdown);
    } catch (error) {
      console.error('Error calculating costs:', error);
      toast.error('Failed to calculate costs');
    }
  };



  const checkBlockchainConnection = async () => {
    try {
      if (!provider) {
        throw new Error('Provider not available');
      }
      
      // Test blockchain connection
      await provider.getBlockNumber();
      return true;
    } catch (error) {
      console.error('Blockchain connection check failed:', error);
      return false;
    }
  };

  const handlePayment = async () => {
    try {
      if (!user || !account) {
        toast.error('Please connect your wallet and login');
        return;
      }

      if (!property) {
        toast.error('Invalid property data');
        return;
      }

      if (!costBreakdown) {
        toast.error('Cost calculation not available');
        return;
      }

      // Check blockchain connection first
      toast.info('🔍 Checking blockchain connection...');
      const isConnected = await checkBlockchainConnection();
      if (!isConnected) {
        toast.error('🔗 Cannot connect to blockchain. Please check if Hardhat node is running.');
        toast.info('💡 Run: start-full-stack.bat to start the blockchain');
        return;
      }

      // Check if user is trying to buy their own property
      if (property.ownerAddress.toLowerCase() === account.toLowerCase()) {
        toast.error('You cannot purchase your own property');
        return;
      }

      // Check user's balance
      const balance = await provider.getBalance(account);
      const balanceEth = parseFloat(ethers.formatEther(balance));
      const totalCostFloat = parseFloat(costBreakdown.totalCost);

      if (balanceEth < totalCostFloat) {
        toast.error(`Insufficient balance! You need ${costBreakdown.totalCost} ETH but only have ${balanceEth.toFixed(4)} ETH`);
        return;
      }

      setPurchaseLoading(true);
      setPaymentStatus('processing');
      
      toast.info('🔄 Initiating purchase transaction...');

      // Execute real ETH transfer to seller
      try {
        // Get signer for transaction
        if (!signer) {
          throw new Error('Wallet not connected properly');
        }

        // Create transaction to send ETH directly to seller
        const transaction = {
          to: property.ownerAddress,
          value: ethers.parseEther(costBreakdown.totalCost),
          gasLimit: 21000, // Standard ETH transfer gas limit
        };

        toast.info('📝 Please confirm the transaction in your wallet...');
        
        // Send transaction
        const tx = await signer.sendTransaction(transaction);
        setTransactionHash(tx.hash);
        
        toast.info(`📝 Transaction submitted: ${tx.hash.substring(0, 10)}...`);
        toast.info('⏳ Waiting for confirmation...');

        // Wait for transaction confirmation
        const receipt = await tx.wait();

        if (receipt.status === 1) {
          setPaymentStatus('success');
          toast.success('🎉 Property purchased successfully!');
          toast.success(`💰 Payment of ${costBreakdown.totalCost} ETH transferred to seller!`);
          toast.success(`⛽ Gas used: ${receipt.gasUsed.toString()}`);
          
          // Update property ownership in database
          await updatePropertyOwnership(tx.hash, receipt);
          
          // Trigger real-time status updates across the application
          await updatePropertyStatusAfterPurchase(
            property._id || property.id,
            account,
            tx.hash
          );
          
          // Generate PDF certificate
          await generateCertificate(tx.hash, receipt.blockNumber, receipt.gasUsed);
        } else {
          throw new Error('Transaction failed');
        }
      } catch (txError) {
        console.error('Transaction error:', txError);
        setPaymentStatus('failed');
        
        if (txError.code === 'ACTION_REJECTED' || txError.code === 4001) {
          toast.error('❌ Transaction rejected by user');
        } else if (txError.message?.includes('insufficient funds')) {
          toast.error('❌ Insufficient funds for transaction + gas fees');
        } else if (txError.message?.includes('gas')) {
          toast.error('❌ Transaction failed due to gas issues');
        } else if (txError.message?.includes('circuit breaker') || txError.code === 'UNKNOWN_ERROR') {
          toast.error('🔄 MetaMask connection issue. Please reset MetaMask network and try again.');
          toast.info('💡 Try: Switch to Mainnet → Switch back to Localhost 8545');
        } else if (txError.message?.includes('could not coalesce error')) {
          toast.error('🔗 Blockchain connection lost. Please check if Hardhat node is running.');
          toast.info('💡 Restart the blockchain: start-full-stack.bat');
        } else {
          toast.error(`❌ Transaction failed: ${txError.message || 'Unknown error'}`);
        }
        throw txError;
      }

    } catch (error) {
      console.error('Payment error:', error);
      setPaymentStatus('failed');
      
      if (error.code === 4001) {
        toast.error('❌ Transaction rejected by user');
      } else if (error.message?.includes('insufficient funds')) {
        toast.error('❌ Insufficient funds for transaction');
      } else {
        toast.error('❌ Payment failed: ' + (error.message || 'Unknown error'));
      }
    } finally {
      setPurchaseLoading(false);
    }
  };

  const updatePropertyOwnership = async (txHash, receipt) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003/api"}/properties/transfer-ownership`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            surveyId: property.surveyId,
            newOwnerAddress: account,
            transactionHash: txHash,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success('📋 Property ownership updated in database');
        } else {
          toast.warning('⚠️ Payment successful but database update failed');
        }
      } else {
        toast.warning('⚠️ Payment successful but database update failed');
      }
    } catch (error) {
      console.error('Database update error:', error);
      toast.warning('⚠️ Payment successful but database update failed');
    }
  };

  const generateCertificate = async (txHash, blockNumber, gasUsed) => {
    try {
      const certificateData = {
        ...property,
        transactionHash: txHash,
        blockNumber: blockNumber,
        gasUsed: gasUsed.toString(),
        purchaseDate: new Date(),
        newOwner: account,
        basePrice: costBreakdown.basePrice,
        taxAmount: costBreakdown.taxAmount,
        totalCost: costBreakdown.totalCost,
        taxRate: costBreakdown.taxRate
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003/api"}/certificates/generate-purchase`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(certificateData),
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = `Property_Purchase_Certificate_${property.surveyId}_${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast.success("📄 Purchase certificate downloaded!");
      } else {
        toast.warning("Certificate generation failed, but purchase was successful");
      }
    } catch (error) {
      console.error('Certificate generation error:', error);
      toast.warning("Certificate download failed, but purchase was successful");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'success': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'processing': return '🔄';
      case 'success': return '✅';
      case 'failed': return '❌';
      default: return '❓';
    }
  };

  if (loading) {
    return (
      <Layout title="Loading Payment - Bhoomi Setu">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading payment details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!property) {
    return (
      <Layout title="Property Not Found - Bhoomi Setu">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Property Not Found</h1>
            <p className="mt-2 text-gray-600">The property you're looking for doesn't exist.</p>
            <button
              onClick={() => router.push('/marketplace')}
              className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Back to Marketplace
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`Payment - ${property.surveyId} - Bhoomi Setu`}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          
          {/* Header */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Property Purchase</h1>
                <p className="text-gray-600">Complete your property purchase securely on the blockchain</p>
              </div>
              <div className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(paymentStatus)}`}>
                {getStatusIcon(paymentStatus)} {paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)}
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Payment Progress</span>
                <span>{paymentStatus === 'success' ? '100%' : paymentStatus === 'processing' ? '50%' : '0%'}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    paymentStatus === 'success' ? 'bg-green-600 w-full' : 
                    paymentStatus === 'processing' ? 'bg-blue-600 w-1/2' : 
                    paymentStatus === 'failed' ? 'bg-red-600 w-1/4' : 'bg-gray-400 w-0'
                  }`}
                ></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Property Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Property Details</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Survey ID:</span>
                  <span className="font-medium">{property.surveyId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium">{property.propertyType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Area:</span>
                  <span className="font-medium">{property.area} {property.areaUnit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Location:</span>
                  <span className="font-medium text-sm">{property.location}</span>
                </div>
              </div>

              {/* Owner Details */}
              {owner && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Current Owner Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Name:
                        </span>
                        <span className="font-medium">{owner.name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                          Wallet:
                        </span>
                        <span className="font-mono text-sm bg-white px-2 py-1 rounded border">
                          {owner.walletAddress.substring(0, 6)}...{owner.walletAddress.substring(owner.walletAddress.length - 4)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          Email:
                        </span>
                        <span className="font-medium text-sm">{owner.email}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          Phone:
                        </span>
                        <span className="font-medium text-sm">{owner.phone}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Details</h2>
              
              {/* Buyer Information */}
              {user && account && (
                <div className="mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                  <h3 className="text-sm font-semibold text-indigo-900 mb-2">Buyer Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-indigo-700">Name:</span>
                      <span className="font-medium text-indigo-900">{user.profile?.name || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-indigo-700">Wallet:</span>
                      <span className="font-mono text-indigo-900">{account.substring(0, 6)}...{account.substring(account.length - 4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-indigo-700">Email:</span>
                      <span className="font-medium text-indigo-900">{user.profile?.email || 'Not provided'}</span>
                    </div>
                  </div>
                </div>
              )}
              
              {costBreakdown ? (
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Base Price:</span>
                    <span className="font-medium">{costBreakdown.basePrice} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Property Tax ({costBreakdown.taxRate}%):</span>
                    <span className="font-medium">{costBreakdown.taxAmount} ETH</span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total Cost:</span>
                      <span className="text-indigo-600">{costBreakdown.totalCost} ETH</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Calculating costs...</p>
                </div>
              )}

              {/* Transaction Hash */}
              {transactionHash && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Transaction</h3>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">Transaction Hash:</p>
                    <p className="font-mono text-sm break-all">{transactionHash}</p>
                  </div>
                </div>
              )}

              {/* Payment Button */}
              <div className="mt-6">
                {paymentStatus === 'pending' && costBreakdown && (
                  <button
                    onClick={handlePayment}
                    disabled={purchaseLoading || !user || !account}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                  >
                    {purchaseLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Processing Payment...
                      </div>
                    ) : !user || !account ? (
                      'Connect Wallet to Pay'
                    ) : (
                      `Pay ${costBreakdown.totalCost} ETH`
                    )}
                  </button>
                )}

                {paymentStatus === 'processing' && (
                  <div className="w-full bg-blue-600 text-white py-3 px-4 rounded-md text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Transaction Processing...
                    </div>
                  </div>
                )}

                {paymentStatus === 'success' && (
                  <div className="space-y-4">
                    <div className="w-full bg-green-600 text-white py-4 px-4 rounded-md text-center">
                      <div className="flex items-center justify-center mb-2">
                        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-lg font-semibold">Payment Successful!</span>
                      </div>
                      <p className="text-sm opacity-90">
                        Congratulations! You are now the owner of this property.
                      </p>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                      <div className="flex items-start">
                        <svg className="w-5 h-5 text-blue-400 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <h4 className="text-sm font-medium text-blue-800">What happens next?</h4>
                          <p className="text-sm text-blue-700 mt-1">
                            Your ownership has been recorded on the blockchain. Download your certificate as proof of purchase and ownership.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <button
                        onClick={() => generateCertificate(transactionHash, 'N/A', 'N/A')}
                        className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 flex items-center justify-center font-medium"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download Ownership Certificate
                      </button>
                      
                      <button
                        onClick={() => router.push('/user/dashboard')}
                        className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 flex items-center justify-center"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                        </svg>
                        View My Properties
                      </button>
                      
                      <button
                        onClick={() => router.push('/marketplace')}
                        className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 flex items-center justify-center"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        Continue Shopping
                      </button>
                    </div>
                  </div>
                )}

                {paymentStatus === 'failed' && (
                  <div className="space-y-3">
                    <div className="w-full bg-red-600 text-white py-3 px-4 rounded-md text-center font-medium">
                      ❌ Payment Failed
                    </div>
                    <button
                      onClick={handlePayment}
                      className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={() => router.push('/marketplace')}
                      className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
                    >
                      Back to Marketplace
                    </button>
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