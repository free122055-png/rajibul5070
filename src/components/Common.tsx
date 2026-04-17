import React, { ReactNode, useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

export const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({ children }) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setHasError(true);
      setError(event.error);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
          <p className="text-gray-600 mb-6 font-mono text-sm break-all">
            {error?.message || "An unexpected error occurred."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#0a0502]">
    <div className="text-center">
      <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
      <p className="text-gray-400 font-medium">Loading InvestGrow...</p>
    </div>
  </div>
);
