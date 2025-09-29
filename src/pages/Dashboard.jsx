import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Users, ShoppingCart, TrendingUp } from 'lucide-react';
import api from '../lib/api.js';
import '../App.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    products: 0,
    sections: 0,
    groups: 0,
    transactions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [productsRes, sectionsRes, groupsRes, transactionsRes] = await Promise.all([
          api.get('/products?limit=1'),
          api.get('/sections'),
          api.get('/groups'),
          api.get('/transactions?limit=1')
        ]);

        setStats({
          products: productsRes.data.pagination?.total || 0,
          sections: sectionsRes.data.sections?.length || 0,
          groups: groupsRes.data.groups?.length || 0,
          transactions: transactionsRes.data.pagination?.total || 0
        });
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Produtos',
      value: stats.products,
      description: 'Total de produtos cadastrados',
      icon: Package,
      color: 'text-blue-600'
    },
    {
      title: 'Seções',
      value: stats.sections,
      description: 'Seções organizacionais',
      icon: Users,
      color: 'text-green-600'
    },
    {
      title: 'Grupos',
      value: stats.groups,
      description: 'Grupos de produtos',
      icon: Users,
      color: 'text-purple-600'
    },
    {
      title: 'Transações',
      value: stats.transactions,
      description: 'Total de transações',
      icon: ShoppingCart,
      color: 'text-orange-600'
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Carregando...</CardTitle>
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded animate-pulse mb-1" />
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Visão geral do sistema de gestão</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Resumo do Sistema
            </CardTitle>
            <CardDescription>
              Informações gerais sobre o sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Status do Sistema</span>
              <span className="text-sm font-medium text-green-600">Online</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Última Atualização</span>
              <span className="text-sm font-medium">{new Date().toLocaleDateString('pt-BR')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Versão</span>
              <span className="text-sm font-medium">1.0.0</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>
              Acesso rápido às principais funcionalidades
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button className="p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="font-medium text-sm">Novo Produto</div>
                <div className="text-xs text-gray-500">Cadastrar produto</div>
              </button>
              <button className="p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="font-medium text-sm">Nova Transação</div>
                <div className="text-xs text-gray-500">Registrar venda</div>
              </button>
              <button className="p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="font-medium text-sm">Relatórios</div>
                <div className="text-xs text-gray-500">Ver relatórios</div>
              </button>
              <button className="p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="font-medium text-sm">Configurações</div>
                <div className="text-xs text-gray-500">Ajustar sistema</div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;

