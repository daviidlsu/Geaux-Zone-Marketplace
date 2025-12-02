// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Register from './auth/register';
import Login from './auth/login';
import Welcome_Page from './Welcome_Page';      // old page (optional)
import LandingPage from './LandingPage';        // TigerTrade landing page
import Listings from './listed_items';
import { AuthProvider } from './auth/auth';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { PublicRoute } from './auth/PublicRoute';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Home -> new TigerTrade landing */}
          <Route path="/" element={<LandingPage />} />

          {/* Old welcome page (kept just in case you still want it) */}
          <Route path="/welcome-old" element={<Welcome_Page />} />

          {/* /welcome also shows the new landing */}
          <Route path="/welcome" element={<LandingPage />} />

          {/* Public Routes */}
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />

          {/* Protected Routes */}
          <Route
            path="/my-listings"
            element={
              <ProtectedRoute>
                <Listings />
              </ProtectedRoute>
            }
          />

          {/* Catch-all: go back home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
