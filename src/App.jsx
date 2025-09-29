// src/App.js (ou onde suas rotas estão)

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast'; // 1. Importe o Toaster
import { AuthProvider, useAuth } from './hooks/useAuth.js';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products.jsx';
import ProductForm from './pages/ProductForm.jsx';
import Sections from './pages/Sections.jsx';
import Groups from './pages/Groups.jsx';
import Transactions from './pages/Transaction.jsx';
import Users from './pages/Users.jsx';
import './App.css';

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} 
      />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/products" element={<Products />} />
                <Route path="/products/new" element={<ProductForm />} />
                <Route path="/products/edit/:id" element={<ProductForm />} />
                <Route path="/sections" element={<Sections />} />
                <Route path="/groups" element={<Groups />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/users" element={<Users />} />
                <Route path="/reports" element={<div>Relatórios - Em desenvolvimento</div>} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        {/* 2. Adicione o Toaster aqui */}
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
