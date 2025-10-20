import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useWeb3 } from '@/contexts/Web3Context';

export default function Layout({ children, title = 'Bhoomi Setu - Land Registry' }) {
  const { user, isAuthenticated, logout } = useAuth();
  const { account, isConnected, disconnectWallet } = useWeb3();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    disconnectWallet();
  };

  const navigation = [
    { name: 'Home', href: '/', current: false },
    { name: 'Marketplace', href: '/marketplace', current: false },
    ...(isAuthenticated ? [{ name: 'Add Property', href: '/add-property', current: false }] : []),
    { name: 'About', href: '/about', current: false },
    { name: 'Contact', href: '/contact', current: false },
  ];

  const userNavigation = [
    { name: 'Dashboard', href: user?.role === 'inspector' ? '/inspector/dashboard' : '/user/dashboard' },
    ...(user?.role === 'inspector' ? [
      { name: 'Assigned Cases', href: '/inspector/cases' },
      { name: 'Inspection History', href: '/inspector/history' },
    ] : [
      { name: 'My Properties', href: '/user/properties' },
    ]),
    { name: 'Profile', href: '/profile' },
    { name: 'Settings', href: '/settings' },
    ...(user?.role === 'admin' ? [{ name: 'Admin Dashboard', href: '/admin' }] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>{title}</title>
        <meta name="description" content="Blockchain-powered land registry system" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="text-2xl font-bold text-indigo-600">
                  Bhoomi Setu
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-gray-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 text-sm font-medium"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              {isConnected && account && (
                <div className="flex items-center space-x-4">
                  {/* Role-based Action Buttons */}
                  {isAuthenticated && user?.role === 'admin' && (
                    <Link
                      href="/admin"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Admin Panel
                    </Link>
                  )}
                  
                  {isAuthenticated && user?.role === 'inspector' && (
                    <Link
                      href="/inspector/dashboard"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m2-6h6m-6 0V9a2 2 0 012-2h4a2 2 0 012 2v6a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2z" />
                      </svg>
                      Inspector Panel
                    </Link>
                  )}
                  
                  <span className="text-sm text-gray-500">
                    {account.slice(0, 6)}...{account.slice(-4)}
                  </span>
                  
                  {isAuthenticated && user && (
                    <>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'admin' 
                          ? 'bg-red-100 text-red-800' 
                          : user.role === 'inspector'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {user.role}
                      </span>
                      
                      <div className="relative">
                        <button
                          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                          className="bg-white rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <span className="sr-only">Open user menu</span>
                          <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {user.profile?.name?.charAt(0) || account.charAt(2).toUpperCase()}
                            </span>
                          </div>
                        </button>

                        {isMobileMenuOpen && (
                          <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                            <div className="py-1">
                              {userNavigation.map((item) => (
                                <Link
                                  key={item.name}
                                  href={item.href}
                                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  onClick={() => setIsMobileMenuOpen(false)}
                                >
                                  {item.name}
                                </Link>
                              ))}
                              <button
                                onClick={handleLogout}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                Sign out
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="sm:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                <span className="sr-only">Open main menu</span>
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="sm:hidden">
            <div className="pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block pl-3 pr-4 py-2 text-base font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              
              {/* Role-based Buttons for Mobile */}
              {isAuthenticated && user?.role === 'admin' && (
                <Link
                  href="/admin"
                  className="block pl-3 pr-4 py-2 text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50 border-l-4 border-red-500"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  🛡️ Admin Panel
                </Link>
              )}
              
              {isAuthenticated && user?.role === 'inspector' && (
                <Link
                  href="/inspector/dashboard"
                  className="block pl-3 pr-4 py-2 text-base font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-l-4 border-blue-500"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  👨‍💼 Inspector Panel
                </Link>
              )}
            </div>
            
            {isAuthenticated && user && (
              <div className="pt-4 pb-3 border-t border-gray-200">
                <div className="flex items-center px-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {user.profile?.name?.charAt(0) || account.charAt(2).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800">
                      {user.profile?.name || 'User'}
                    </div>
                    <div className="text-sm font-medium text-gray-500">
                      {account.slice(0, 6)}...{account.slice(-4)}
                    </div>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  {userNavigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Main content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-500 text-sm">
              © 2024 Bhoomi Setu. Built with blockchain technology for secure land registry.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}