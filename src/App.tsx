import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Listings from './listed_items.tsx';
import Login from './auth/login';
import IncomingOffers from './incoming_offers.tsx';
import ListingOffers from './listingOffers.tsx';
import OutgoingOffers from './outgoing_offers.tsx';
import Register from './auth/register';
import Welcome_Page from './Welcome_Page.tsx';
import { AuthProvider } from './auth/auth.tsx';
import { ProtectedRoute } from './auth/ProtectedRoute.tsx';
import { PublicRoute } from './auth/PublicRoute.tsx';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
            <Route path="/" element={<Welcome_Page />} />
          {/* Guided Public Routes */}
            <Route path="/register" 
            element={<PublicRoute>
              <Register />
            </PublicRoute>}
            />
            <Route path="/login" 
            element={<PublicRoute>
              <Login />
            </PublicRoute>} 
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
            path="/incoming-offers"
            element={<ProtectedRoute>
              <IncomingOffers />
            </ProtectedRoute>}
            />
          {/* Catch-all route for undefined paths */}
            <Route path="*" element={<Navigate to="/" />} /> {/* Redirect unknown routes to home page */}
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App
