// Em /src/App.jsx (VERSÃO FINAL CORRIGIDA E FUNCIONAL)

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './hooks/useAuth.js';

// --- Componentes de Estrutura ---
import Layout from './components/Layout'; // Layout deve usar <Outlet />
import ProtectedRoute from './components/ProtectedRoute';

// --- Páginas (Importações completas) ---
import Login from './pages/Login';
import Settings from './pages/Settings.jsx';
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
import Workstations from './pages/Workstations.jsx';
import Returns from './pages/Returns.jsx';
import ReportsPage from './pages/Reports.jsx';
import SalesByPeriodPage from './pages/reports/SalesByPeriodPage.jsx';
import SalesByPaymentMethodPage from './pages/reports/SalesByPaymentMethodPage.jsx';
import TopSellingProductsReport from './pages/reports/TopSellingProductsReport.jsx';
import SalesByUserReport from './pages/reports/SalesByUserReport.jsx';
import ProductListReport from './pages/reports/ProductListReport.jsx';
import CustomerListReport from './pages/reports/CustomerListReport.jsx';
import VarejoFacil from './components/VarejoFacil.jsx';
import PedidoVendaVarejo from './pages/PedidoVendaVarejo.jsx';
import KitchenScreen from './pages/cozinha.jsx';
import RestaurantTablesScreen from './pages/restaurante/RestaurantTablesScreen.jsx';
import PrintPage from "@/pages/restaurante/prints/PrintPage.jsx";

// --- Estilos Globais ---
import './App.css';

// Componente principal que envolve a aplicação
function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#333',
              color: '#fff',
            },
          }}
        />
        <Routes>
          {/* ============================================================= */}
          {/* ▼▼▼ ROTAS QUE NÃO USAM O LAYOUT PRINCIPAL ▼▼▼                 */}
          {/* ============================================================= */}
          <Route path="/login" element={<Login />} />
          <Route path="/settings" element={<Settings />} />
          <Route 
            path="/print/table/:tableId" 
            element={
              <ProtectedRoute>
                <PrintPage />
              </ProtectedRoute>
            } 
          />

          {/* ============================================================= */}
          {/* ▼▼▼ ROTAS QUE USAM O LAYOUT PRINCIPAL (<Outlet />) ▼▼▼        */}
          {/* ============================================================= */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* O <Layout> renderiza estas rotas filhas através do <Outlet /> */}
            <Route index element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="products/new" element={<ProductForm />} />
            <Route path="products/edit/:id" element={<ProductForm />} />
            <Route path="invoices/import" element={<InvoiceImport />} />
            <Route path="sections" element={<Sections />} />
            <Route path="groups" element={<Groups />} />
            <Route path="customers" element={<Customers />} />
            <Route path="users" element={<Users />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="pre-sales" element={<PreSales />} />
            <Route path="finance" element={<Finance />} />
            <Route path="payment-methods" element={<PaymentMethods />} />
            <Route path="workstations" element={<Workstations />}/>
            <Route path="returns" element={<Returns />} /> 
            <Route path="reports" element={<ReportsPage />} />
            <Route path="reports/sales-by-period" element={<SalesByPeriodPage />} />
            <Route path="reports/sales-by-payment-method" element={<SalesByPaymentMethodPage />} />
            <Route path="reports/top-selling-products" element={<TopSellingProductsReport />} />
            <Route path="reports/sales-by-user" element={<SalesByUserReport />} />
            <Route path="reports/product-list" element={<ProductListReport />} />
            <Route path="reports/customer-list" element={<CustomerListReport />} />
            <Route path="integrations/varejo-facil" element={<VarejoFacil />} />
            <Route path="varejo-facil/pedido-venda" element={<PedidoVendaVarejo />} />
            <Route path="kitchen" element={<KitchenScreen />} />
            <Route path="restaurant/tables" element={<RestaurantTablesScreen />} />
            
            {/* Rota "catch-all" para redirecionar para a página inicial */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
