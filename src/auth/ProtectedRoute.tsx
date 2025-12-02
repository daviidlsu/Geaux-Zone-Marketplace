import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './/AuthContext';

// Define the component props
interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-t-purple-900 border-gray-200 rounded-full mr-2"></div>
        <p className="text-lg font-medium text-gray-700">Checking authentication...</p>
      </div>
    );
  }
  if (!currentUser) {
    console.log("invalid user")
    return <Navigate to="/" replace />;
  }
  //Continue to render children if authenticated
  return <>{children}</>;
};