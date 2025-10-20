/**
 * Utility to clear authentication state
 * This can help resolve "User not found" errors caused by stale tokens
 */

export const clearAuthState = () => {
  try {
    // Clear localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    
    // Clear sessionStorage as well (just in case)
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('user_data');
    
    console.log('✅ Authentication state cleared successfully');
    return true;
  } catch (error) {
    console.error('❌ Error clearing authentication state:', error);
    return false;
  }
};

export const debugAuthState = () => {
  try {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');
    
    console.log('🔍 Current authentication state:');
    console.log('Token exists:', !!token);
    console.log('Token length:', token ? token.length : 0);
    console.log('User data exists:', !!userData);
    
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        console.log('User wallet:', parsedUser.walletAddress);
        console.log('User role:', parsedUser.role);
      } catch (parseError) {
        console.log('❌ Error parsing user data:', parseError);
      }
    }
    
    return { token, userData };
  } catch (error) {
    console.error('❌ Error debugging authentication state:', error);
    return null;
  }
};

// Auto-clear function that can be called when "User not found" error occurs
export const handleUserNotFoundError = () => {
  console.log('🔧 Handling "User not found" error - clearing authentication state');
  clearAuthState();
  
  // Reload the page to reset the authentication context
  if (typeof window !== 'undefined') {
    window.location.reload();
  }
};