// src/pages/restaurant/components/CommandDetailsPanel.jsx

import { useState } from 'react';
import {
  Loader2, ShoppingCart, MessageSquare, Percent, User,
  Trash2, Printer, ArrowRightLeft, Layers, ChevronDown, ChevronUp
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import api from '@/lib/api';
import toast from 'react-hot-toast';

import CancelItemModal from './CancelItemModal';
import TransferItemModal from './TransferItemModal';
import TransferAllItemsModal from './TransferAllItemsModal';

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
    .format(value || 0);

const CommandDetailsPanel = ({ details, isLoading, onRefresh, allTables }) => {
  const [itemToCancel, setItemToCancel] = useState(null);
  const [itemToTransfer, setItemToTransfer] = useState(null);
  const [transferAllOpen, setTransferAllOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-white rounded-xl shadow-sm border">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!details) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white rounded-xl shadow-sm border p-4 text-center">
        <ShoppingCart className="h-12 w-12 text-slate-300" />
        <h3 className="mt-4 text-sm font-medium text-slate-800">
          Nenhuma Comanda Selecionada
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Clique em uma comanda à esquerda para ver os detalhes.
        </p>
      </div>
    );
  }

  const isLocked = details.status === 'EM_PAGAMENTO';

  // CANCELAR ITEM
  const handleConfirmCancel = async (itemId, quantityToCancel) => {
    await toast.promise(
      api.post(`/restaurant/tables/${details.id}/items/${itemId}/cancel`, { quantityToCancel }),
      {
        loading: 'Cancelando item...',
        success: () => {
          onRefresh?.(details.id);
          setItemToCancel(null);
          return 'Item cancelado!';
        },
        error: (err) => err.response?.data?.error || err.message,
      }
    );
  };

  // TRANSFERIR ITEM ÚNICO
  const handleConfirmTransfer = async (sourceItemId, targetTableId, quantityToTransfer) => {
    await toast.promise(
      api.post(`/restaurant/tables/transfer-item`, {
        sourceItemId,
        targetTableId,
        quantityToTransfer
      }),
      {
        loading: 'Transferindo item...',
        success: () => {
          onRefresh?.(details.id);
          onRefresh?.(targetTableId);
          setItemToTransfer(null);
          return 'Item transferido!';
        },
        error: (err) => err.response?.data?.error || err.message,
      }
    );
  };

  // TRANSFERIR TODOS OS ITENS
  const handleTransferAll = async (targetTableId) => {
    setTransferAllOpen(false);

    await toast.promise(
      api.post('/restaurant/tables/transfer-all-items', {
        sourceTableId: details.id,
        targetTableId
      }),
      {
        loading: 'Transferindo itens...',
        success: () => {
          onRefresh?.(details.id);
          onRefresh?.(targetTableId);
          return 'Todos os itens foram transferidos!';
        },
        error: (err) => err.response?.data?.error || err.message,
      }
    );
  };

  const activeItems = (details.items || []).filter(i => i.status !== 'CANCELADO');

  const subtotal = activeItems.reduce((acc, item) =>
    acc + Number(item.quantity) * Number(item.unit_price), 0);

  const serviceFee = subtotal * 0.10;
  const total = subtotal + serviceFee;

  return (
    <>
      <div className="bg-white h-full rounded-xl shadow-sm border flex flex-col">

        {/* HEADER */}
        <header className="p-4 border-b">
          <h2 className="text-xl font-bold text-slate-800 truncate">
            Detalhes: {details.number}
          </h2>

          {details.customer_name ? (
            <div className="flex items-center text-sm text-slate-500 mt-1">
              <User className="w-4 h-4 mr-2" />
              {details.customer_name}
            </div>
          ) : (
            <p className="text-sm text-slate-500 mt-1">
              Aberta por: {details.user_who_opened || 'Admin'}
            </p>
          )}
        </header>

        {/* LISTA DE ITENS */}
        <main className="flex-grow p-4 overflow-y-auto">
          <h3 className="font-semibold mb-3 text-slate-700">Itens Consumidos</h3>

          {details.items?.length ? (
            <ul className="space-y-3">
              {details.items.map(item => {
                const cancelled = item.status === 'CANCELADO';

                return (
                  <li key={item.id} className={`${cancelled ? 'opacity-50' : ''}`}>
                    <div className="flex justify-between items-center">
                      <div className="flex-grow text-sm">
                        <span className={cancelled ? 'line-through' : ''}>
                          {item.quantity}x {item.product_name}
                        </span>

                        {item.notes && (
                          <p className="text-xs text-slate-500 pl-4 flex items-center">
                            <MessageSquare className="w-3 h-3 mr-1" />
                            {item.notes}
                          </p>
                        )}
                      </div>

                      {!cancelled && (
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="ghost"
                            disabled={isLocked}
                            onClick={() => setItemToTransfer(item)}
                          >
                            <ArrowRightLeft className="w-4 h-4 text-blue-500" />
                          </Button>

                          <Button size="icon" variant="ghost"
                            disabled={isLocked}
                            onClick={() => setItemToCancel(item)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-slate-400 mt-4">Nenhum item lançado.</p>
          )}
        </main>

        {/* FOOTER */}
        <footer className="p-4 border-t bg-slate-50 rounded-b-xl">
          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>

            <div className="flex justify-between">
              <span className="flex items-center">
                <Percent className="w-3 h-3 mr-1" /> Taxa de Serviço (10%)
              </span>
              <span className="font-medium">{formatCurrency(serviceFee)}</span>
            </div>

            <Separator className="my-2" />

            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => setActionsOpen(!actionsOpen)}
          >
            Opções da Comanda
            {actionsOpen ? (
              <ChevronUp className="w-4 h-4 ml-2" />
            ) : (
              <ChevronDown className="w-4 h-4 ml-2" />
            )}
          </Button>

          {actionsOpen && (
            <div className="mt-2 flex flex-col gap-2 animate-fade-in">

              {!isLocked && activeItems.length > 0 && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setTransferAllOpen(true)}
                >
                  <Layers className="w-4 h-4 mr-2" />
                  Transferir Todos os Itens
                </Button>
              )}

              {!isLocked && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    api.put(`/restaurant/tables/${details.id}/lock`)
                      .then(() => {
                        toast.success("Comanda bloqueada!");
                        onRefresh(details.id);
                      })
                      .catch(err =>
                        toast.error(err.response?.data?.error || err.message)
                      )
                  }
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Gerar Conferência
                </Button>
              )}

            </div>
          )}
        </footer>
      </div>

      {/* MODAIS */}
      <CancelItemModal
        item={itemToCancel}
        isOpen={!!itemToCancel}
        onClose={() => setItemToCancel(null)}
        onConfirm={handleConfirmCancel}
      />

      <TransferItemModal
        item={itemToTransfer}
        allTables={allTables}
        isOpen={!!itemToTransfer}
        onClose={() => setItemToTransfer(null)}
        onConfirm={handleConfirmTransfer}
      />

      {/* MODAL DE TRANSFERIR TODOS */}
      <TransferAllItemsModal
        open={transferAllOpen}
        onOpenChange={setTransferAllOpen}
        sourceCommandId={details.id}
      />
    </>
  );
};

export default CommandDetailsPanel;
