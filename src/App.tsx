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
import Listings from './listed_items.tsx';
import Login from './auth/login';
import Messages from './messages.tsx';
import ListingOffers from './listingOffers.tsx';
import OutgoingOffers from './outgoing_offers.tsx';
import Register from './auth/register';
import Welcome_Page from './Welcome_Page.tsx';
import { AuthProvider } from './auth/AuthProvider.tsx';
import { ProtectedRoute } from './auth/ProtectedRoute.tsx';
import { PublicRoute } from './auth/PublicRoute.tsx';

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
            element={<ProtectedRoute>
              <Listings />
            </ProtectedRoute>}
            />
            <Route
            path="/my-listings/:listingId/offers"
            element={<ProtectedRoute> {/* Make sure only owner listings can be seen */}
              <ListingOffers />
            </ProtectedRoute>}
            />
            <Route
            path="/outgoing-offers"
            element={<ProtectedRoute>
              <OutgoingOffers />
            </ProtectedRoute>}
            />
            <Route
            path="/messages" // change to message component
            element={<ProtectedRoute>
              <Messages />
            </ProtectedRoute>}
            />
            <Route
            path="/messages/:chatId" // change to message component
            element={<ProtectedRoute>
              <Messages />
            </ProtectedRoute>}
            />
          {/* Catch-all route for undefined paths */}
            <Route path="*" element={<Navigate to="/" />} /> {/* Redirect unknown routes to home page */}
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
