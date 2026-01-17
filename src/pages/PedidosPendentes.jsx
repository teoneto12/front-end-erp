// frontend/src/pages/PedidosPendentes.jsx

import React, { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { RefreshCw, Trash2, AlertTriangle, Loader2, Eye } from 'lucide-react';
import { toast } from 'react-hot-toast';
import DetalhesPedidoModal from '../components/DetalhesPedidoModal';

const PedidosPendentes = () => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchPedidosPendentes = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('varejo-facil/pending-orders');
      setPedidos(data || []);
    } catch (error) {
      toast.error('Falha ao carregar pedidos pendentes.');
      console.error("Erro ao buscar pedidos pendentes:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPedidosPendentes();
  }, [fetchPedidosPendentes]);

  // ==================================================================
  // FUNÇÃO 'handleRetry' CORRIGIDA
  // ==================================================================
  const handleRetry = async (pedidoId) => {
    setActionLoading(pedidoId); // <-- CORREÇÃO: Ativa o loading para este botão
    try {
      await api.post(`varejo-facil/retry-order/${pedidoId}`);
      toast.success(`Pedido ${pedidoId} reenviado para sincronização!`);
      fetchPedidosPendentes();
    } catch (error) {
      toast.error(error.response?.data?.message || `Falha ao reenviar o pedido ${pedidoId}.`);
      fetchPedidosPendentes();
    } finally {
      setActionLoading(null); // <-- CORREÇÃO: Desativa o loading
    }
  };

  // ==================================================================
  // FUNÇÃO 'handleDelete' CORRIGIDA
  // ==================================================================
  const handleDelete = async (pedidoId) => {
    // A confirmação do window.confirm foi movida para o Dialog para melhor UX
    setActionLoading(pedidoId); // <-- CORREÇÃO: Ativa o loading para este botão
    try {
      await api.delete(`varejo-facil/pending-order/${pedidoId}`);
      toast.success(`Pedido ${pedidoId} excluído da fila.`);
      setPedidos(prev => prev.filter(p => p.id !== pedidoId));
    } catch (error) {
      toast.error(error.response?.data?.message || `Falha ao excluir o pedido ${pedidoId}.`);
    } finally {
      setActionLoading(null); // <-- CORREÇÃO: Desativa o loading
    }
  };

  const handleViewDetails = (pedido) => {
    setSelectedPedido(pedido);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Pedidos Pendentes de Sincronização</h1>
          <Button onClick={() => !loading && fetchPedidosPendentes()} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Atualizar Lista
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Fila de Sincronização</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID Local</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Erro</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="text-center h-24">Carregando...</TableCell></TableRow>
                ) : pedidos.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center h-24">Nenhum pedido pendente encontrado.</TableCell></TableRow>
                ) : (
                  pedidos.map(pedido => (
                    <TableRow key={pedido.id}>
                      <TableCell className="font-medium">{pedido.id}</TableCell>
                      <TableCell>{new Date(pedido.created_at).toLocaleString('pt-BR')}</TableCell>
                      <TableCell>{pedido.payload.cliente.nome}</TableCell>
                      <TableCell>R$ {pedido.payload.valorTotal.toFixed(2)}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          pedido.status === 'ERRO' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {pedido.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-red-600 max-w-xs truncate" title={pedido.sync_error_message}>
                        {pedido.sync_error_message}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleViewDetails(pedido)}
                            disabled={actionLoading === pedido.id}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleRetry(pedido.id)}
                            disabled={actionLoading === pedido.id}
                          >
                            {actionLoading === pedido.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                          </Button>
                          
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="destructive" size="sm" disabled={actionLoading === pedido.id}>
                                {actionLoading === pedido.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle className="flex items-center">
                                  <AlertTriangle className="mr-2 text-red-500" />
                                  Confirmar Exclusão
                                </DialogTitle>
                              </DialogHeader>
                              <p>
                                Você tem certeza que deseja excluir permanentemente o pedido local <strong>Nº {pedido.id}</strong>?
                                  

                                Esta ação é irreversível e o pedido não será sincronizado.
                              </p>
                              <DialogFooter>
                                <DialogClose asChild>
                                  <Button variant="secondary">Cancelar</Button>
                                </DialogClose>
                                <DialogClose asChild>
                                  <Button variant="destructive" onClick={() => handleDelete(pedido.id)}>
                                    Sim, Excluir
                                  </Button>
                                </DialogClose>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <DetalhesPedidoModal 
        pedido={selectedPedido} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
};

export default PedidosPendentes;
