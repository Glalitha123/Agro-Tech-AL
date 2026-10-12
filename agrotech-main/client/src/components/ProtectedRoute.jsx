import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-earth-950">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-solid border-farm-200 border-t-farm-600 animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center font-bold text-xs text-farm-700 dark:text-farm-300">
            Agro
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login but save the current location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && user.role !== 'admin') {
    // Authenticated but lacks admin permission, redirect to standard dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
