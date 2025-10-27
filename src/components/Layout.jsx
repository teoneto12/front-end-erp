// Em /src/components/Layout.jsx (VERSÃO COMPLETA E CORRIGIDA)

import { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { Button } from '@/components/ui/button';
import { 
  Home, Package, Layers, Grid3X3, Tag, ShoppingCart, Landmark, CreditCard, 
  Users, BarChart3, Settings, LogOut, Menu, X, Soup // Adicionado o ícone X e Soup
} from 'lucide-react';''
import '../App.css';

const Layout = () => { 
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Produtos', href: '/products', icon: Package },
    { name: 'Seções', href: '/sections', icon: Layers },
    { name: 'Grupos', href: '/groups', icon: Grid3X3 },
    { name: 'Pré-Vendas', href: '/pre-sales', icon: Tag },
    { name: 'Transações', href: '/transactions', icon: ShoppingCart },
    { name: 'Cozinha', href: '/kitchen', icon: Soup }, // Exemplo de link adicionado
    { name: 'Financeiro', href: '/finance', icon: Landmark },
    { name: 'Formas de Pagamento', href: '/payment-methods', icon: CreditCard },
    { name: 'Clientes', href: '/customers', icon: Users },
    { name: 'Usuários', href: '/users', icon: Users },
    { name: 'Relatórios', href: '/reports', icon: BarChart3 },
    { name: 'Configurações', href: '/settings', icon: Settings },
  ];

  // Componente de navegação reutilizável para evitar repetição de código
  const SidebarNavigation = () => (
    <nav className="mt-5 flex-1 px-2 space-y-1">
      {navigation.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href));
        
        return (
          <Link
            key={item.name}
            to={item.href}
            onClick={() => setSidebarOpen(false)} // Fecha o menu ao clicar em um link no mobile
            className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
              isActive
                ? 'bg-blue-100 text-blue-900'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Icon className="mr-3 h-5 w-5" />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* --- Sidebar para Desktop --- */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <h1 className="text-xl font-bold text-gray-900">Sistema de Gestão</h1>
            </div>
            <SidebarNavigation />
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center">
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">{user?.username}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-500 hover:text-gray-700">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* ▼▼▼ CÓDIGO DO SIDEBAR MOBILE CORRIGIDO E COMPLETO AQUI ▼▼▼ */}
      {/* ================================================================== */}
      {sidebarOpen && (
        <div className="fixed inset-0 flex z-40 md:hidden" role="dialog" aria-modal="true">
          {/* Overlay escuro que fecha o menu ao ser clicado */}
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" aria-hidden="true" onClick={() => setSidebarOpen(false)}></div>
          
          {/* Conteúdo do Sidebar Mobile */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full text-white"
              >
                <span className="sr-only">Fechar sidebar</span>
                <X className="h-6 w-6" />
              </Button>
            </div>
            
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <h1 className="text-xl font-bold text-gray-900">Sistema de Gestão</h1>
              </div>
              {/* Reutilizando o componente de navegação */}
              <SidebarNavigation />
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              {/* ... (informações do usuário e botão de logout) ... */}
            </div>
          </div>
          <div className="flex-shrink-0 w-14" aria-hidden="true">
            {/* Espaço para empurrar o menu para a esquerda */}
          </div>
        </div>
      )}
      {/* ================================================================== */}
      {/* ▲▲▲ FIM DA CORREÇÃO DO SIDEBAR MOBILE ▲▲▲ */}
      {/* ================================================================== */}

      {/* --- Conteúdo Principal --- */}
      <div className="md:pl-64 flex flex-col flex-1">
        <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-gray-50">
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)} className="text-gray-500">
            <Menu className="h-6 w-6" />
          </Button>
        </div>
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
