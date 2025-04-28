import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import Dashboard from './pages/Dashboard';
import CropRecommendation from './pages/CropRecommendation';
import FertilizerRecommendation from './pages/FertilizerRecommendation';
import DiseaseDetection from './pages/DiseaseDetection';
// import AdminLogin from './components/auth/AdminLogin';
// import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/routes/ProtectedRoute';
// import AdminRoute from './components/routes/AdminRoute';
import { AuthProvider } from './context/AuthContext';
import AuthCallback from './pages/AuthCallback';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          {/* <Route path="/admin-login" element={<AdminLogin />} /> */}
          <Route path="/auth/callback" element={<AuthCallback />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/crop" element={<CropRecommendation />} />
            <Route path="/fertilizer" element={<FertilizerRecommendation />} />
            <Route path="/disease" element={<DiseaseDetection />} />
          </Route>
          
          {/* <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route> */}
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;