// src/pages/reports/SalesByUserReport.jsx

import React, { useState, useEffect, useCallback } from 'react';
import ReportDisplay from '@/components/reports/ReportDisplay';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';

const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const SalesByUserReport = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ startDate: '', endDate: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/reports/sales-by-user', { params: filters });
      const formattedData = response.data.map(item => ({
        ...item,
        total_revenue: formatCurrency(item.total_revenue),
      }));
      setData(formattedData);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const headers = [
    { key: 'user_name', label: 'Vendedor' },
    { key: 'total_sales', label: 'Nº de Vendas' },
    { key: 'total_revenue', label: 'Receita Total' },
  ];

  const filterBar = (
    <div className="flex items-center gap-2">
      <Input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} />
      <span className="text-gray-500">até</span>
      <Input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} />
      <Button onClick={fetchData}>Filtrar</Button>
    </div>
  );

  return (
    <ReportDisplay
      title="Vendas por Vendedor"
      description="Desempenho de vendas de cada usuário do sistema."
      headers={headers}
      data={data}
      loading={loading}
      filterBar={filterBar}
    />
  );
};

export default SalesByUserReport;
