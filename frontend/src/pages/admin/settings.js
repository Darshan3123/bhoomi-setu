import AdminLayout from '../../components/admin/AdminLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function SystemSettings() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Check if user is admin
    if (user && user.role !== 'admin') {
      router.push('/');
      return;
    }
  }, [user, router]);

  if (!user || user.role !== 'admin') {
    return (
      <AdminLayout title="Access Denied">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="System Settings">
      <div className="space-y-6">
        {/* Coming Soon Card */}
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
            <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">System Settings</h3>
          <p className="mt-1 text-sm text-gray-500">
            Configure system-wide settings, manage platform parameters, and control application behavior.
          </p>
          <div className="mt-6">
            <span className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-700 bg-gray-100">
              🚧 Coming Soon
            </span>
          </div>
        </div>

        {/* Feature Preview */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Configuration Options</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Platform Settings</h4>
                <p className="text-sm text-gray-600">Configure general platform settings, maintenance mode, and feature flags.</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Blockchain Config</h4>
                <p className="text-sm text-gray-600">Manage blockchain network settings, smart contract addresses, and gas limits.</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">IPFS Settings</h4>
                <p className="text-sm text-gray-600">Configure IPFS nodes, storage settings, and document retention policies.</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Email Configuration</h4>
                <p className="text-sm text-gray-600">Set up email notifications, SMTP settings, and message templates.</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Security Settings</h4>
                <p className="text-sm text-gray-600">Manage authentication settings, session timeouts, and security policies.</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">API Configuration</h4>
                <p className="text-sm text-gray-600">Configure API rate limits, access controls, and integration settings.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}