// src/pages/reports/TopSellingProductsReport.jsx

import React, { useState, useEffect, useCallback } from 'react';
import ReportDisplay from '@/components/reports/ReportDisplay';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';

const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const TopSellingProductsReport = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ startDate: '', endDate: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/reports/top-selling-products', { params: filters });
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
    { key: 'name', label: 'Produto' },
    { key: 'sku', label: 'SKU' },
    { key: 'total_quantity_sold', label: 'Quantidade Vendida' },
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
      title="Produtos Mais Vendidos"
      description="Ranking dos produtos com maior volume de vendas em um determinado período."
      headers={headers}
      data={data}
      loading={loading}
      filterBar={filterBar}
    />
  );
};

export default TopSellingProductsReport;
