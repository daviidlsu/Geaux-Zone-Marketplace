import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Register from './auth/register';
import Login from './auth/login';
import Welcome_Page from './Welcome_Page.tsx'; // old welcome page
import UpdatedWelcomePage from './UpdatedWelcomePage';// new welcome page 
import Listings from './listed_items.tsx';
import { AuthProvider } from './auth/auth.tsx';
import { ProtectedRoute } from './auth/ProtectedRoute.tsx';
import { PublicRoute } from './auth/PublicRoute.tsx';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Make new page the default route */}
          <Route path="/" element={<UpdatedWelcomePage />} />

          {/*  keep old page at /welcome-old */}
          <Route path="/welcome-old" element={<Welcome_Page />} />

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

          {/* Catch-all route for undefined paths */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
