import AdminLayout from '../../components/admin/AdminLayout';
import KYCManagement from '../../components/KYCManagement';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function KYCDocuments() {
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
    <AdminLayout title="KYC Document Management">
      <KYCManagement />
    </AdminLayout>
  );
}