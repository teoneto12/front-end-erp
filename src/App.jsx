// Em /src/App.jsx (VERSÃO FINAL COMPLETA E REESCRITA)

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './hooks/useAuth.js';

// --- Componentes de Estrutura ---
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// --- Páginas Principais ---
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

// --- Páginas de Relatórios ---
import ReportsPage from './pages/Reports.jsx'; // A página de menu dos relatórios
import SalesByPeriodPage from './pages/reports/SalesByPeriodPage.jsx';
import SalesByPaymentMethodPage from './pages/reports/SalesByPaymentMethodPage.jsx';
import TopSellingProductsReport from './pages/reports/TopSellingProductsReport.jsx';
import SalesByUserReport from './pages/reports/SalesByUserReport.jsx';
import ProductListReport from './pages/reports/ProductListReport.jsx';
import CustomerListReport from './pages/reports/CustomerListReport.jsx';

// --- Estilos Globais ---
import './App.css';

// Componente que define a estrutura de rotas da aplicação
function AppRoutes() {
  return (
    <Routes>
      {/* Rota pública de Login */}
      <Route path="/login" element={<Login />} />

      {/* Rota "Pai" que aplica o Layout e a proteção a todas as rotas aninhadas */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Página Inicial (Dashboard) */}
        <Route index element={<Dashboard />} />
        
        {/* Rotas de Gestão */}
        <Route path="products" element={<Products />} />
        <Route path="products/new" element={<ProductForm />} />
        <Route path="products/edit/:id" element={<ProductForm />} />
        <Route path="invoices/import" element={<InvoiceImport />} />
        <Route path="sections" element={<Sections />} />
        <Route path="groups" element={<Groups />} />
        <Route path="customers" element={<Customers />} />
        <Route path="users" element={<Users />} />
        
        {/* Rotas de Vendas e Financeiro */}
        <Route path="transactions" element={<Transactions />} />
        <Route path="pre-sales" element={<PreSales />} />
        <Route path="finance" element={<Finance />} />
        <Route path="payment-methods" element={<PaymentMethods />} />
        
        {/* Rotas de Relatórios */}
        <Route path="reports" element={<ReportsPage />} />
        <Route path="reports/sales-by-period" element={<SalesByPeriodPage />} />
        <Route path="reports/sales-by-payment-method" element={<SalesByPaymentMethodPage />} />
        <Route path="reports/top-selling-products" element={<TopSellingProductsReport />} />
        <Route path="reports/sales-by-user" element={<SalesByUserReport />} />
        <Route path="reports/product-list" element={<ProductListReport />} />
        <Route path="reports/customer-list" element={<CustomerListReport />} />

        {/* Rota de Configurações */}
        <Route path="settings" element={<Settings />} />
        
        {/* Rota "catch-all": Se nenhuma rota acima for encontrada, redireciona para a página inicial */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

// Componente principal que envolve a aplicação com provedores de contexto
function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#333', // Cor ligeiramente ajustada para melhor contraste
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
