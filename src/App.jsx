// src/App.js (ou onde suas rotas estão)

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './hooks/useAuth.js';

// Componentes de Layout e Proteção
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Páginas
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products.jsx';
import ProductForm from './pages/ProductForm.jsx';
import Sections from './pages/Sections.jsx';
import Groups from './pages/Groups.jsx';
import Transactions from './pages/Transaction.jsx';
import Users from './pages/Users.jsx';
import InvoiceImport from './pages/InvoiceImports.jsx';
import Finance from './pages/Finance.jsx';
import './App.css';

// Este componente agora define a estrutura de rotas correta
function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* 1. Rota de Login (fora do layout principal) */}
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} 
      />

      {/* 2. Rota Pai que renderiza o Layout e protege as rotas filhas */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* 3. Rotas Filhas: Elas serão renderizadas DENTRO do <Outlet /> do Layout */}
        <Route index element={<Dashboard />} /> {/* 'index' é a rota padrão para o path="/" */}
        <Route path="products" element={<Products />} />
        <Route path="products/new" element={<ProductForm />} />
        <Route path="products/edit/:id" element={<ProductForm />} />
        <Route path="invoices/import" element={<InvoiceImport />}/>
        <Route path="finance" element={<Finance />}/>
        <Route path="sections" element={<Sections />} />
        <Route path="groups" element={<Groups />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="users" element={<Users />} />
        <Route path="reports" element={<div>Relatórios - Em desenvolvimento</div>} />
        
        {/* Rota "catch-all" para páginas não encontradas DENTRO do layout */}
        <Route path="*" element={<div>Página não encontrada</div>} />
      </Route>
    </Routes>
  );
}

// O componente App principal permanece o mesmo
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
