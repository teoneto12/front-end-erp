// Em /src/App.jsx (VERSÃO ATUALIZADA E CORRIGIDA)

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './hooks/useAuth.js'; // Removido 'useAuth' que não estava sendo usado aqui

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
// --- Renomeando para consistência ---
import ReportsPage from './pages/Reports.jsx';
import SalesByPeriodPage from './pages/reports/SalesByPeriodPage.jsx';
import SalesByPaymentMethodPage from './pages/reports/SalesByPaymentMethodPage.jsx';
import './App.css';

// Componente que define a estrutura de rotas
function AppRoutes() {
  return (
    <Routes>
      {/* Rota de Login: Fica fora do grupo de rotas protegidas */}
      <Route path="/login" element={<Login />} />

      {/* ================================================================= */}
      {/* ▼▼▼ ESTRUTURA DE ROTA PAI CORRIGIDA ▼▼▼ */}
      {/* ================================================================= */}
      {/* Esta rota pai aplica o Layout e a Proteção a TODAS as rotas filhas */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* A rota 'index' é a página inicial (/) renderizada dentro do Layout */}
        <Route index element={<Dashboard />} />
        
        {/* Todas as outras rotas são relativas ao pai ('/') e também renderizadas dentro do Layout */}
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
        <Route path="pre-sales" element={<PreSales />} />
        <Route path="settings" element={<Settings />} />
        
        {/* --- ROTAS DE RELATÓRIO (AGORA CORRETAMENTE ANINHADAS) --- */}
        <Route path="reports" element={<ReportsPage />} />
        <Route path="reports/sales-by-period" element={<SalesByPeriodPage />} />
        <Route path="reports/sales-by-payment-method" element={<SalesByPaymentMethodPage />} />
        
        {/* Rota "catch-all" para redirecionar para a dashboard caso a URL não exista */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
      {/* ================================================================= */}
      {/* ▲▲▲ FIM DA ESTRUTURA CORRIGIDA ▲▲▲ */}
      {/* ================================================================= */}
    </Routes>
  );
}

// O componente App principal (sem alterações)
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
