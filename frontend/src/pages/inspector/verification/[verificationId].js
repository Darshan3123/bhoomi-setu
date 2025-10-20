import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../contexts/AuthContext';
import Layout from '../../../components/Layout';

export default function InspectorVerificationRedirect() {
  const router = useRouter();
  const { verificationId } = router.query;
  const { api, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !verificationId) {
      return;
    }

    // Redirect to the unified property page
    const redirectToProperty = async () => {
      try {
        // Try to find the property by verification ID
        const response = await api.get(`/properties/${verificationId}`);
        if (response.data.success) {
          const property = response.data.property;
          router.replace(`/property/${property.surveyId}`);
        } else {
          // If not found by verification ID, try to find in all properties
          const allPropertiesResponse = await api.get('/properties?limit=100');
          if (allPropertiesResponse.data.success) {
            const property = allPropertiesResponse.data.properties.find(
              p => p.verificationId === parseInt(verificationId) || p.verificationId === verificationId
            );
            if (property) {
              router.replace(`/property/${property.surveyId}`);
            } else {
              // If still not found, redirect to cases
              router.replace('/inspector/cases');
            }
          } else {
            router.replace('/inspector/cases');
          }
        }
      } catch (error) {
        console.error('Error redirecting:', error);
        router.replace('/inspector/cases');
      }
    };

    redirectToProperty();
  }, [isAuthenticated, verificationId, router, api]);

  return (
    <Layout>
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to property details...</p>
        </div>
      </div>
    </Layout>
  );
}