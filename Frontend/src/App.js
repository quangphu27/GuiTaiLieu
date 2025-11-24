import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import DocumentList from './pages/DocumentList';
import Dashboard from './pages/Dashboard';
import DocumentManagement from './pages/DocumentManagement';
import UnitManagement from './pages/UnitManagement';
import SendHistory from './pages/SendHistory';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route 
            path="/documents" 
            element={
              <PrivateRoute>
                <DocumentList />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/dashboard/documents" 
            element={
              <PrivateRoute>
                <DocumentManagement />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/dashboard/units" 
            element={
              <PrivateRoute>
                <UnitManagement />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/dashboard/history" 
            element={
              <PrivateRoute>
                <SendHistory />
              </PrivateRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
    </NotificationProvider>
  );
}

export default App;

