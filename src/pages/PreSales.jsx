// frontend/src/pages/PreSales.jsx

import React, { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Loader2, Download, CheckCircle, XCircle, MoreHorizontal, Edit, Copy } from 'lucide-react';
import Pagination from '../components/Pagination';
import PreSaleForm from '../components/PreSaleForm';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

const PreSales = () => {
  const [preSales, setPreSales] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPreSale, setEditingPreSale] = useState(null);

  const fetchPreSales = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const response = await api.get('/pre-sales', { params: { page, limit: 10 } });
      setPreSales(response.data.preSales || []);
      setPagination(response.data.pagination || null);
    } catch (error) {
      console.error("Erro ao carregar pré-vendas:", error);
      toast.error("Não foi possível carregar o histórico de pré-vendas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPreSales(1);
  }, [fetchPreSales]);

  const handleOpenModalForNew = () => {
    setEditingPreSale(null);
    setIsModalOpen(true);
  };

  const handleEdit = (preSale) => {
    setEditingPreSale({ ...preSale, action: 'edit' });
    setIsModalOpen(true);
  };

  const handleDuplicate = (preSale) => {
    const { id, ...preSaleToDuplicate } = preSale;
    setEditingPreSale({ ...preSaleToDuplicate, action: 'duplicate' });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    setIsModalOpen(false);
    setEditingPreSale(null);
    fetchPreSales(pagination?.page || 1);
  };

  // ▼▼▼ ALTERAÇÃO NA FUNÇÃO DE EXPORTAÇÃO ▼▼▼
  const handleExport = async (preSaleNumber) => {
    // A URL agora usa o número sequencial da pré-venda
    const promise = api.post(`/pre-sales/export/${preSaleNumber}`);

    toast.promise(promise, {
      loading: 'Exportando para o PDV...',
      success: (res) => res.data.message || 'Pré-venda exportada com sucesso!',
      error: (err) => `Erro ao exportar: ${err.response?.data?.error || err.message}`,
    });

    try {
      await promise;
      fetchPreSales(pagination?.page || 1);
    } catch (error) {
      // O toast já trata o erro
    }
  };
  // ▲▲▲ ALTERAÇÃO NA FUNÇÃO DE EXPORTAÇÃO ▲▲▲

  const getStatusBadge = (status) => {
    switch (status) {
      case 'gerada':
        return <span className="bg-blue-100 text-blue-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded">Gerada</span>;
      case 'exportada':
        return <span className="bg-yellow-100 text-yellow-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded">Exportada</span>;
      case 'finalizada':
        return <span className="bg-green-100 text-green-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded flex items-center"><CheckCircle className="w-3 h-3 mr-1" /> Finalizada</span>;
      case 'cancelada':
        return <span className="bg-red-100 text-red-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded flex items-center"><XCircle className="w-3 h-3 mr-1" /> Cancelada</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded">{status}</span>;
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pré-vendas</h1>
          <p className="text-gray-600">Crie e gerencie pré-vendas para integração com o PDV.</p>
        </div>
        <Button onClick={handleOpenModalForNew}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Pré-venda
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Histórico de Pré-vendas</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº Pré-venda</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="h-24 text-center"><Loader2 className="animate-spin w-6 h-6 mx-auto" /></TableCell></TableRow>
                ) : preSales.length > 0 ? preSales.map(ps => (
                  <TableRow key={ps.id}>
                    <TableCell className="font-mono">{ps.pre_sale_number}</TableCell>
                    <TableCell>{ps.customer_name || 'Consumidor Final'}</TableCell>
                    <TableCell>{new Date(ps.created_at).toLocaleString('pt-BR')}</TableCell>
                    <TableCell>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ps.total_amount)}</TableCell>
                    <TableCell>{getStatusBadge(ps.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {ps.status === 'gerada' && (
                            // ▼▼▼ ALTERAÇÃO NA CHAMADA DA FUNÇÃO ▼▼▼
                            <DropdownMenuItem onClick={() => handleExport(ps.pre_sale_number)}>
                              <Download className="mr-2 h-4 w-4" />
                              <span>Exportar para PDV</span>
                            </DropdownMenuItem>
                            // ▲▲▲ ALTERAÇÃO NA CHAMADA DA FUNÇÃO ▲▲▲
                          )}
                          {ps.status === 'gerada' && (
                            <DropdownMenuItem onClick={() => handleEdit(ps)}>
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Editar</span>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleDuplicate(ps)}>
                            <Copy className="mr-2 h-4 w-4" />
                            <span>Refazer (Duplicar)</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={6} className="h-24 text-center">Nenhuma pré-venda encontrada.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {pagination && pagination.pages > 1 && (
            <Pagination pagination={pagination} onPageChange={fetchPreSales} itemName="pré-vendas" />
          )}
        </CardContent>
      </Card>

      <Modal 
        open={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setEditingPreSale(null);
        }} 
        title={editingPreSale?.action === 'edit' ? 'Editar Pré-venda' : editingPreSale?.action === 'duplicate' ? 'Refazer Pré-venda' : 'Criar Nova Pré-venda'}
        className="max-w-6xl"
      >
        <PreSaleForm onSave={handleSave} preSaleData={editingPreSale} />
      </Modal>
    </div>
  );
};

export default PreSales;
