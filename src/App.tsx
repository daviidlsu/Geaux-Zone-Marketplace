import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css'
import Register from './auth/register';
import Login from './auth/login';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<div>Home Page</div>} /> {/* Default route (change to home page once created*/}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/" />} /> {/* Redirect unknown routes to home page */}
      </Routes>
    </Router>
  )
}

export default App
