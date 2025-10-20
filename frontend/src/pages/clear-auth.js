import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import { clearAuthState, debugAuthState } from "../utils/clearAuth";

export default function ClearAuth() {
  const router = useRouter();
  const [authState, setAuthState] = useState(null);
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    // Debug current auth state
    const state = debugAuthState();
    setAuthState(state);
  }, []);

  const handleClearAuth = () => {
    const success = clearAuthState();
    if (success) {
      setCleared(true);
      toast.success("Authentication state cleared successfully!");

      // Redirect to home after 2 seconds
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } else {
      toast.error("Failed to clear authentication state");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Clear Authentication State
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Use this page to resolve "User not found" authentication errors
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Current Auth State */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Current Authentication State
            </h3>
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="text-sm">
                <p>
                  <strong>Token exists:</strong>{" "}
                  {authState?.token ? "Yes" : "No"}
                </p>
                <p>
                  <strong>User data exists:</strong>{" "}
                  {authState?.userData ? "Yes" : "No"}
                </p>
                {authState?.userData && (
                  <div className="mt-2">
                    <p>
                      <strong>Stored user info:</strong>
                    </p>
                    <pre className="text-xs bg-white p-2 rounded mt-1 overflow-auto">
                      {JSON.stringify(JSON.parse(authState.userData), null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Clear Button */}
          {!cleared ? (
            <div>
              <button
                onClick={handleClearAuth}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Clear Authentication State
              </button>

              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-yellow-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Warning
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        This will clear all stored authentication data including
                        tokens and user information. You will need to reconnect
                        your wallet and login again.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="mb-4">
                <svg
                  className="mx-auto h-12 w-12 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 48 48"
                >
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M20 24l4 4 8-8"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                Authentication Cleared!
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Redirecting to home page...
              </p>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="text-sm font-medium text-blue-800 mb-2">
              When to use this:
            </h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Getting "User not found. Please register first" errors</li>
              <li>• Authentication seems stuck or broken</li>
              <li>• Switched to a different wallet address</li>
              <li>• After database changes or user cleanup</li>
            </ul>
          </div>

          <div className="mt-4">
            <button
              onClick={() => router.push("/")}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
