// Em /src/App.jsx (VERSÃO CORRIGIDA E OTIMIZADA)

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
import Customers from './pages/Customers.jsx';
import PaymentMethods from './pages/PaymentMethods.jsx';
import PreSales from './pages/PreSales.jsx';
import Settings from './pages/Settings.jsx';
import './App.css';

// Componente que define a estrutura de rotas
function AppRoutes() {
  return (
    <Routes>
      {/* Rota de Login: Fica fora do grupo de rotas protegidas */}
      <Route path="/login" element={<Login />} />

      {/* Rota Pai Protegida: Todas as rotas aqui dentro exigem autenticação e usam o Layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* A rota 'index' é a página inicial (/) */}
        <Route index element={<Dashboard />} />
        
        {/* Todas as outras rotas são relativas ao pai ('/') */}
        <Route path="products" element={<Products />} />
        <Route path="products/new" element={<ProductForm />} />
        <Route path="products/edit/:id" element={<ProductForm />} />
        <Route path="invoices/import" element={<InvoiceImport />} />
        <Route path="finance" element={<Finance />} />
        <Route path="sections" element={<Sections />} />
        <Route path="customers" element={<Customers />} />
        <Route path="groups" element={<Groups />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="users" element={<Users />} />
        <Route path="payment-methods" element={<PaymentMethods />} />
        
        {/* ▼▼▼ ROTAS CORRIGIDAS ▼▼▼ */}
        <Route path="pre-sales" element={<PreSales />} />
        <Route path="settings" element={<Settings />} />
        
        <Route path="reports" element={<div>Relatórios - Em desenvolvimento</div>} />
        
        {/* Rota "catch-all" para redirecionar para a dashboard caso a URL não exista */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

// O componente App principal
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
