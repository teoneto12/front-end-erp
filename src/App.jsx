// Em /src/App.js (ou onde suas rotas estão)

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
import PaymentMethods from './pages/PaymentMethods.jsx'; // Importa a nova tela
import './App.css';

// Este componente define a estrutura de rotas
function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Rota de Login (fora do layout principal) */}
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} 
      />

      {/* Rota Pai que renderiza o Layout e protege as rotas filhas */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Rotas Filhas: Elas serão renderizadas DENTRO do <Outlet /> do Layout */}
        <Route index element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="products/new" element={<ProductForm />} />
        <Route path="products/edit/:id" element={<ProductForm />} />
        <Route path="invoices/import" element={<InvoiceImport />}/>
        <Route path="finance" element={<Finance />}/>
        <Route path="sections" element={<Sections />} />
        <Route path="customers" element={<Customers/>}/>
        <Route path="groups" element={<Groups />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="users" element={<Users />} />
        
        {/* ROTA CORRIGIDA: O path corresponde ao link no menu */}
        <Route path="payment-methods" element={<PaymentMethods/>}/> 
        
        <Route path="reports" element={<div>Relatórios - Em desenvolvimento</div>} />
        
        {/* Rota "catch-all" para páginas não encontradas */}
        <Route path="*" element={<div>Página não encontrada</div>} />
      </Route>
    </Routes>
  );
}

// O componente App principal que envolve tudo
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
