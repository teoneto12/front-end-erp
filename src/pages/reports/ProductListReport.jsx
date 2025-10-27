// src/pages/reports/ProductListReport.jsx

import React, { useState, useEffect, useCallback } from 'react';
import ReportDisplay from '@/components/reports/ReportDisplay';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import api from '@/lib/api';

const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const ProductListReport = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/reports/product-list', { params: { search: searchTerm } });
       const formattedData = response.data.map(item => ({
        ...item,
        price: formatCurrency(item.price),
      }));
      setData(formattedData);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    const handler = setTimeout(() => fetchData(), 500); // Debounce
    return () => clearTimeout(handler);
  }, [searchTerm, fetchData]);

  const headers = [
    { key: 'name', label: 'Produto' },
    { key: 'sku', label: 'SKU' },
    { key: 'section_name', label: 'Seção' },
    { key: 'price', label: 'Preço' },
    { key: 'stock_quantity', label: 'Estoque' },
  ];

  const filterBar = (
    <div className="relative w-full sm:w-64">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
      <Input
        placeholder="Buscar por nome ou SKU..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-10"
      />
    </div>
  );

  return (
    <ReportDisplay
      title="Listagem de Produtos"
      description="Gere uma lista completa de todos os produtos cadastrados."
      headers={headers}
      data={data}
      loading={loading}
      filterBar={filterBar}
    />
  );
};

export default ProductListReport;
