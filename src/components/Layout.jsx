// ARQUIVO: src/components/Layout.jsx
// CÓDIGO COMPLETO E CORRIGIDO

import { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { Button } from '@/components/ui/button';
import { 
  Home, Package, Layers, Grid3X3, Tag, ShoppingCart, Landmark, CreditCard, 
  Users, BarChart3, Settings, LogOut, Menu, X, Soup, Repeat, ChevronDown, 
  ChevronRight, Wallet, Monitor, Share2, Search,
  // --- Ícones que faltavam foram importados aqui ---
  UtensilsCrossed, Square 
} from 'lucide-react';
import Notifications from './Notifications'; 
import '../App.css';

const Layout = () => { 
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState({});
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // --- Estrutura de navegação limpa e corrigida ---
  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Produtos', icon: Package, subItems: [ { name: 'Listar Produtos', href: '/products', icon: Package }, { name: 'Seções', href: '/sections', icon: Layers }, { name: 'Grupos', href: '/groups', icon: Grid3X3 }, ] },
    { name: 'Restaurante', icon: UtensilsCrossed, subItems: [ { name: 'Visão de Mesas', href: '/restaurant/tables', icon: Square }, { name: 'Cozinha', href: '/kitchen', icon: Soup }, ] },
    { name: 'Caixa', icon: Wallet, subItems: [ { name: 'Frente de Caixa', href: '/transactions', icon: ShoppingCart }, { name: 'Pré-Vendas', href: '/pre-sales', icon: Tag }, { name: 'Trocas e Devoluções', href: '/returns', icon: Repeat }, { name: 'Formas de Pagamento', href: '/payment-methods', icon: CreditCard }, ] },
    { name: 'Financeiro', href: '/finance', icon: Landmark },
    { name: 'Pessoas', icon: Users, subItems:[ {name: 'Usuários', href: '/users', icon: Users}, {name: 'Clientes/Fornecedores', href: '/customers', icon: Users }, ] },
    { name: 'Relatórios', href: '/reports', icon: BarChart3 },
    { name: 'Configurações', icon: Settings, subItems: [ { name: 'Geral', href: '/settings', icon: Settings }, { name: 'Estações de Trabalho', href: '/workstations', icon: Monitor }, ] },
    { name: 'Vendas', icon: ShoppingCart, subItems: [ { name: 'Pedido de Venda (VF)', href: '/varejo-facil/pedido-venda', icon: ShoppingCart } ] },
    { name: 'Integrações', icon: Share2, subItems: [ { name: 'Configuração (VF)', href: '/integrations/varejo-facil', icon: Settings }, { name: 'Consultar Produtos (VF)', href: '/integrations/varejo-facil/search-products', icon: Search }, ] },
  ];

  const toggleMenu = (menuName) => {
    setOpenMenus(prev => ({ ...prev, [menuName]: !prev[menuName] }));
  };

  const SidebarNavigation = () => (
    <nav className="mt-5 flex-1 px-2 space-y-1">
      {navigation.map((item) => {
        const Icon = item.icon;
        const isParentActive = item.subItems && item.subItems.some(sub => location.pathname.startsWith(sub.href));
        const isOpen = openMenus[item.name];

        if (item.subItems) {
          return (
            <div key={item.name}>
              <button onClick={() => toggleMenu(item.name)} className={`group w-full flex items-center justify-between px-2 py-2 text-sm font-medium rounded-md transition-colors ${ isParentActive ? 'bg-blue-50 text-blue-800' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900' }`} >
                <div className="flex items-center"> <Icon className="mr-3 h-5 w-5" /> {item.name} </div>
                {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
              {isOpen && (
                <div className="pl-4 mt-1 space-y-1">
                  {/* --- CORREÇÃO DO ERRO "subItem is not defined" --- */}
                  {/* Trocado "subItem.subItems.map" por "item.subItems.map" */}
                  {item.subItems.map(subItem => {
                    const SubIcon = subItem.icon;
                    const isSubActive = location.pathname === subItem.href || (subItem.href !== '/' && location.pathname.startsWith(subItem.href));
                    return (
                      <Link key={subItem.name} to={subItem.href} onClick={() => setSidebarOpen(false)} className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${ isSubActive ? 'bg-blue-100 text-blue-900' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900' }`} >
                        <SubIcon className="mr-3 h-5 w-5" /> {subItem.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }
        const isActive = location.pathname === item.href;
        return (
          <Link key={item.name} to={item.href} onClick={() => setSidebarOpen(false)} className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${ isActive ? 'bg-blue-100 text-blue-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900' }`} >
            <Icon className="mr-3 h-5 w-5" /> {item.name}
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

      {/* --- Sidebar para Mobile --- */}
      {sidebarOpen && (
        <div className="fixed inset-0 flex z-40 md:hidden" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" aria-hidden="true" onClick={() => setSidebarOpen(false)}></div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)} className="ml-1 flex items-center justify-center h-10 w-10 rounded-full text-white" >
                <span className="sr-only">Fechar sidebar</span> <X className="h-6 w-6" />
              </Button>
            </div>
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4"> <h1 className="text-xl font-bold text-gray-900">Sistema de Gestão</h1> </div>
              <SidebarNavigation />
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center">
                  <div className="ml-3"> <p className="text-sm font-medium text-gray-700">{user?.username}</p> <p className="text-xs text-gray-500 capitalize">{user?.role}</p> </div>
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-500 hover:text-gray-700"> <LogOut className="h-4 w-4" /> </Button>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 w-14" aria-hidden="true"></div>
        </div>
      )}

      {/* --- Conteúdo Principal --- */}
      <div className="md:pl-64 flex flex-col flex-1">
        <div className="absolute top-5 right-8 z-20">
          <Notifications />
        </div>

        <div className="absolute top-4 left-4 z-20 md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="text-gray-500 bg-gray-100/50">
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
