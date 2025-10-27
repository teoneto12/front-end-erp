// src/pages/ReportsPage.jsx (ou Reports.jsx)

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { List, DollarSign, ShoppingCart, BarChart } from 'lucide-react';
import { Link } from 'react-router-dom';

// Array com todos os relatórios e seus caminhos corretos
const reportList = [
  {
    category: 'Relatórios Financeiros',
    icon: <DollarSign className="w-6 h-6 text-green-500" />,
    reports: [
      { name: 'Vendas por Período', description: 'Analise o faturamento total em um intervalo de datas.', path: '/reports/sales-by-period' },
      { name: 'Vendas por Forma de Pagamento', description: 'Veja quais métodos de pagamento são mais utilizados.', path: '/reports/sales-by-payment-method' },
    ],
  },
  {
    category: 'Relatórios Operacionais',
    icon: <ShoppingCart className="w-6 h-6 text-blue-500" />,
    reports: [
      { name: 'Produtos Mais Vendidos', description: 'Ranking dos produtos com maior volume de vendas.', path: '/reports/top-selling-products' },
      { name: 'Vendas por Vendedor', description: 'Desempenho de vendas de cada usuário do sistema.', path: '/reports/sales-by-user' },
    ],
  },
  {
    category: 'Relatórios Cadastrais',
    icon: <List className="w-6 h-6 text-gray-500" />,
    reports: [
      { name: 'Listagem de Produtos', description: 'Gere uma lista completa de todos os produtos cadastrados.', path: '/reports/product-list' },
      { name: 'Listagem de Clientes', description: 'Visualize e exporte sua base de clientes.', path: '/reports/customer-list' },
    ],
  },
];

const ReportsPage = () => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Central de Relatórios</h1>
      <p className="text-gray-600 mb-6">Selecione um relatório para visualizar e exportar os dados.</p>

      <div className="space-y-8">
        {reportList.map((group) => (
          <Card key={group.category}>
            <CardHeader className="flex flex-row items-center space-x-4">
              {group.icon}
              <div>
                <CardTitle>{group.category}</CardTitle>
                <CardDescription>Análises relacionadas à gestão {group.category.split(' ')[1].toLowerCase()}.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.reports.map((report) => (
                  <Link to={report.path} key={report.name} className="block">
                    <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors h-full">
                      <div className="flex items-center mb-2">
                        <BarChart className="w-5 h-5 mr-3 text-gray-400" />
                        <h3 className="font-semibold text-gray-800">{report.name}</h3>
                      </div>
                      <p className="text-sm text-gray-600">{report.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ReportsPage;
