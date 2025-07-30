// src/components/PrivateRoute.js
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom'; // Navigate və Outlet React Router DOM v6 üçün

const PrivateRoute = () => {
  // localStorage-dan tokeni yoxlayın
  const authToken = localStorage.getItem('authToken');

  // Token mövcuddursa, daxil olan komponenti render edin (Outlet)
  // Əks halda, login səhifəsinə yönləndirin
  return authToken ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
