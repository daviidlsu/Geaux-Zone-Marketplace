import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Register from './auth/register';
import Login from './auth/login';
import Welcome_Page from './Welcome_Page.tsx';

function App() {
  return (
    <Router>
      <Routes>
       <Route path="/" element={<Welcome_Page />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/" />} /> {/* Redirect unknown routes to home page */}
      </Routes>
    </Router>
  )
}

export default App
