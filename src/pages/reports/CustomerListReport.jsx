// src/pages/reports/CustomerListReport.jsx

import React, { useState, useEffect, useCallback } from 'react';
import ReportDisplay from '@/components/reports/ReportDisplay';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import api from '@/lib/api';

const formatDate = (dateString) => new Date(dateString).toLocaleDateString('pt-BR');

const CustomerListReport = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/reports/customer-list', { params: { search: searchTerm } });
      const formattedData = response.data.map(item => ({
        ...item,
        created_at: formatDate(item.created_at),
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
    { key: 'name', label: 'Nome' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Telefone' },
    { key: 'document', label: 'Documento' },
    { key: 'created_at', label: 'Cliente Desde' },
  ];
  
  const filterBar = (
    <div className="relative w-full sm:w-64">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
      <Input
        placeholder="Buscar por nome, email ou doc..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-10"
      />
    </div>
  );

  return (
    <ReportDisplay
      title="Listagem de Clientes"
      description="Visualize e exporte sua base de clientes."
      headers={headers}
      data={data}
      loading={loading}
      filterBar={filterBar}
    />
  );
};

export default CustomerListReport;
