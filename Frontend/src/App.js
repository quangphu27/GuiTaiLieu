import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DocumentManagement from './pages/DocumentManagement';
import UnitManagement from './pages/UnitManagement';
import UserManagement from './pages/UserManagement';
import DepartmentManagement from './pages/DepartmentManagement';
import DepartmentEmployeeManagement from './pages/DepartmentEmployeeManagement';
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
            path="/dashboard/users" 
            element={
              <PrivateRoute>
                <UserManagement />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/dashboard/departments" 
            element={
              <PrivateRoute>
                <DepartmentManagement />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/dashboard/department-employees" 
            element={
              <PrivateRoute>
                <DepartmentEmployeeManagement />
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

