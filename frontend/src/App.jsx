import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminLoginPage from './pages/AdminLoginPage';
import FacultiesPage from './pages/FacultiesPage';
import ChatPage from './pages/ChatPage';
import AdminDashboard from './pages/AdminDashboard';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) return <div className="spinner" />;
  
  return isAuthenticated ? children : <Navigate to="/" />;
};

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      
      <Route 
        path="/faculties" 
        element={
          <PrivateRoute>
            <FacultiesPage />
          </PrivateRoute>
        } 
      />
      
      <Route 
        path="/chat/:facultyId" 
        element={
          <PrivateRoute>
            <ChatPage />
          </PrivateRoute>
        } 
      />
      
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default App;
