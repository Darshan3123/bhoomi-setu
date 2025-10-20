import AdminLayout from '../../components/admin/AdminLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function TransfersManagement() {
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
    <AdminLayout title="Transfer Management">
      <div className="space-y-6">
        {/* Coming Soon Card */}
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Transfer Management</h3>
          <p className="mt-1 text-sm text-gray-500">
            Monitor and manage all property transfers, including pending approvals and completed transactions.
          </p>
          <div className="mt-6">
            <span className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-green-700 bg-green-100">
              🚧 Coming Soon
            </span>
          </div>
        </div>

        {/* Feature Preview */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Planned Features</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Active Transfers</h4>
                <p className="text-sm text-gray-600">View all ongoing property transfers with current status and timeline.</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Pending Approvals</h4>
                <p className="text-sm text-gray-600">Review and approve transfer requests that require admin authorization.</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Transfer History</h4>
                <p className="text-sm text-gray-600">Complete history of all property transfers with blockchain transaction details.</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Document Verification</h4>
                <p className="text-sm text-gray-600">Verify transfer documents and ensure all requirements are met.</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Blockchain Integration</h4>
                <p className="text-sm text-gray-600">Monitor blockchain transactions and smart contract executions.</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Transfer Analytics</h4>
                <p className="text-sm text-gray-600">Analytics on transfer volumes, success rates, and processing times.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}