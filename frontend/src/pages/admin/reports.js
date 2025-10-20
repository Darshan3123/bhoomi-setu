import AdminLayout from '../../components/admin/AdminLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function ReportsManagement() {
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
    <AdminLayout title="Reports & Analytics">
      <div className="space-y-6">
        {/* Coming Soon Card */}
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-purple-100">
            <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Reports & Analytics</h3>
          <p className="mt-1 text-sm text-gray-500">
            Generate comprehensive reports and analytics for platform usage, transactions, and performance metrics.
          </p>
          <div className="mt-6">
            <span className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-purple-700 bg-purple-100">
              🚧 Coming Soon
            </span>
          </div>
        </div>

        {/* Feature Preview */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Available Reports</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">User Analytics</h4>
                <p className="text-sm text-gray-600">Registration trends, user activity, and demographic insights.</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">KYC Reports</h4>
                <p className="text-sm text-gray-600">KYC completion rates, verification times, and document status.</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Property Reports</h4>
                <p className="text-sm text-gray-600">Property registration statistics and ownership distribution.</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Transaction Reports</h4>
                <p className="text-sm text-gray-600">Transfer volumes, success rates, and blockchain activity.</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Financial Reports</h4>
                <p className="text-sm text-gray-600">Revenue tracking, fee collection, and financial summaries.</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">System Performance</h4>
                <p className="text-sm text-gray-600">Platform uptime, response times, and technical metrics.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}