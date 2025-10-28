// Utility to update property status across the application after purchase

export const updatePropertyStatusAfterPurchase = async (propertyId, newOwnerAddress, transactionHash) => {
  try {
    // This function can be called from the payment success page
    // to trigger updates across different parts of the application
    
    console.log('🔄 Updating property status after purchase:', {
      propertyId,
      newOwnerAddress,
      transactionHash
    });

    // Broadcast custom event for real-time updates
    const updateEvent = new CustomEvent('propertyStatusUpdated', {
      detail: {
        propertyId,
        newOwnerAddress,
        transactionHash,
        status: 'transferred',
        forSale: false,
        timestamp: new Date().toISOString()
      }
    });

    // Dispatch the event globally
    window.dispatchEvent(updateEvent);

    // Also store in localStorage for cross-tab updates
    const updateData = {
      propertyId,
      newOwnerAddress,
      transactionHash,
      status: 'transferred',
      forSale: false,
      timestamp: new Date().toISOString()
    };

    localStorage.setItem('lastPropertyUpdate', JSON.stringify(updateData));

    return true;
  } catch (error) {
    console.error('Error updating property status:', error);
    return false;
  }
};

// Hook to listen for property status updates
export const usePropertyStatusUpdates = (callback) => {
  const handleStatusUpdate = (event) => {
    if (callback && typeof callback === 'function') {
      callback(event.detail);
    }
  };

  // Listen for custom events
  if (typeof window !== 'undefined') {
    window.addEventListener('propertyStatusUpdated', handleStatusUpdate);
    
    // Also listen for localStorage changes (cross-tab updates)
    window.addEventListener('storage', (e) => {
      if (e.key === 'lastPropertyUpdate' && e.newValue) {
        try {
          const updateData = JSON.parse(e.newValue);
          callback(updateData);
        } catch (error) {
          console.error('Error parsing property update data:', error);
        }
      }
    });

    // Cleanup function
    return () => {
      window.removeEventListener('propertyStatusUpdated', handleStatusUpdate);
      window.removeEventListener('storage', handleStatusUpdate);
    };
  }
};

// Get property status badge component
export const getPropertyStatusBadge = (status, forSale) => {
  if (status === "transferred" || status === "sold") {
    return {
      className: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800",
      text: "Sold"
    };
  } else if (forSale && status === "active") {
    return {
      className: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800",
      text: "For Sale"
    };
  } else if (status === "active") {
    return {
      className: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800",
      text: "Owned"
    };
  } else {
    return {
      className: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800",
      text: status || "Unknown"
    };
  }
};