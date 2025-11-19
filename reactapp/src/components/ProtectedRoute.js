// components/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, userType }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  // Check if user type matches the required type for the route
  if (userType && user.user_type !== userType) {
    // Redirect to appropriate dashboard based on user type
    if (user.user_type === 'employer') {
      return <Navigate to="/employer-dashboard" replace />;
    } else if (user.user_type === 'applicant') {
      return <Navigate to="/applicant-dashboard" replace />;
    }
    // If neither, redirect to login
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

export default ProtectedRoute;