// src/App.js (ou onde suas rotas estão)

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './hooks/useAuth.js';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products.jsx'; // A lista
import ProductForm from './pages/ProductForm.jsx'; // O formulário
import Sections from './pages/Sections.jsx';
import Groups from './pages/Groups.jsx';
import Transactions from './pages/Transaction.jsx';
import Users from './pages/Users.jsx';
import InvoiceImport from './pages/InvoiceImports.jsx';
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

                {/* ▼▼▼ ROTAS DE PRODUTOS NA ORDEM CORRETA ▼▼▼ */}
                {/* A rota mais geral (/products) deve renderizar a lista */}
                <Route path="/products" element={<Products />} />
                {/* Rotas mais específicas vêm depois */}
                <Route path="/products/new" element={<ProductForm />} />
                <Route path="/products/edit/:id" element={<ProductForm />} />
                <Route path="/invoices/import" element={<InvoiceImport />}/>

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
