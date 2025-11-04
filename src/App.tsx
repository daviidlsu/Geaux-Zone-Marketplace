import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Register from './auth/register';
import Login from './auth/login';
import Welcome_Page from './Welcome_Page.tsx';
import Listings from './listed_items.tsx';
import { AuthProvider } from './auth/auth.tsx';
import { ProtectedRoute } from './auth/ProtectedRoute.tsx';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Welcome_Page />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route
            path="/my-listings"
            element={<ProtectedRoute
              ><Listings />
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
