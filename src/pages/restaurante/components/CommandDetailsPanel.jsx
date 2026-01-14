// src/pages/restaurant/components/CommandDetailsPanel.jsx

import { useState } from 'react';
import { Loader2, ShoppingCart, MessageSquare, Percent, User, Trash2, Printer, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import CancelItemModal from './CancelItemModal';

const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

const CommandDetailsPanel = ({ details, isLoading, onNavigate, onRefresh }) => {
  const [itemToCancel, setItemToCancel] = useState(null);

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
        <h3 className="mt-4 text-sm font-medium text-slate-800">Nenhuma Comanda Selecionada</h3>
        <p className="mt-1 text-sm text-slate-500">Clique em uma comanda à esquerda para ver os detalhes.</p>
      </div>
    );
  }

  const handleConfirmCancel = async (itemId, quantityToCancel) => {
    await toast.promise(
        api.post(`/restaurant/tables/${details.id}/items/${itemId}/cancel`, { quantityToCancel }),
        {
            loading: 'Processando cancelamento...',
            success: () => {
                if (onRefresh) { onRefresh(details.id); }
                setItemToCancel(null);
                return 'Operação de cancelamento realizada com sucesso!';
            },
            error: (err) => {
                setItemToCancel(null);
                return `Erro ao cancelar: ${err.response?.data?.error || err.message}`;
            },
        }
    );
  };
  
  const handleLockTable = async () => {
    if (!window.confirm('Gerar a conferência e bloquear a comanda? Novos itens não poderão ser adicionados.')) {
        return;
    }
    await toast.promise(
        api.put(`/restaurant/tables/${details.id}/lock`),
        {
            loading: 'Bloqueando comanda...',
            success: () => {
                if (onRefresh) { onRefresh(details.id); }
                return 'Comanda bloqueada para pagamento!';
            },
            error: (err) => `Erro: ${err.response?.data?.error || err.message}`,
        }
    );
  };

  const isLocked = details.status === 'EM_PAGAMENTO';
  const activeItems = (details.items || []).filter(item => item.status !== 'CANCELADO');
  const subtotal = activeItems.reduce((acc, item) => acc + Number(item.quantity) * Number(item.unit_price), 0);
  const serviceFee = subtotal * 0.10;
  const total = subtotal + serviceFee;

  return (
    <>
      <div className="bg-white h-full rounded-xl shadow-sm border flex flex-col">
        <header className="p-4 border-b">
          <h2 className="text-xl font-bold text-slate-800 truncate">Detalhes: {details.number}</h2>
          
          {details.customer_name ? (
            <div className="flex items-center text-sm text-slate-500 mt-1">
              <User className="w-4 h-4 mr-2" />
              <span>{details.customer_name}</span>
            </div>
          ) : (
            <p className="text-sm text-slate-500 mt-1">Aberta por: {details.user_who_opened || 'Admin'}</p>
          )}

          {isLocked && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 text-red-800 rounded-md text-sm flex items-center">
              <Lock className="w-4 h-4 mr-2 flex-shrink-0" />
              Comanda bloqueada para pagamento.
            </div>
          )}
        </header>

        <main className="flex-grow p-4 overflow-y-auto">
          <h3 className="font-semibold mb-3 text-slate-700">Itens Consumidos</h3>
          {(details.items && details.items.length > 0) ? (
            <ul className="space-y-3">
              {details.items.map(item => {
                const isCancelled = item.status === 'CANCELADO';
                return (
                  <li key={item.id} className={`transition-opacity ${isCancelled ? 'opacity-50' : ''}`}>
                    <div className="flex justify-between items-center">
                      <div className="flex-grow text-sm">
                        <span className={`text-slate-700 ${isCancelled ? 'line-through' : ''}`}>
                          {item.quantity}x {item.product_name}
                        </span>
                        {item.notes && (
                          <p className="text-xs text-slate-500 pl-4 flex items-center"><MessageSquare className="w-3 h-3 mr-1"/> {item.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center">
                        <span className={`font-medium text-slate-800 mr-4 text-sm ${isCancelled ? 'line-through' : ''}`}>
                          {formatCurrency(item.quantity * item.unit_price)}
                        </span>
                        {!isCancelled && (
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 hover:bg-red-100 hover:text-red-600" onClick={() => setItemToCancel(item)} disabled={isLocked}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-slate-400 mt-4">Nenhum item lançado ainda.</p>
          )}
        </main>

        <footer className="p-4 border-t bg-slate-50/50 rounded-b-xl">
          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between"><span className="text-slate-600">Subtotal</span><span className="font-medium">{formatCurrency(subtotal)}</span></div>
            <div className="flex justify-between items-center"><span className="text-slate-600 flex items-center"><Percent className="w-3 h-3 mr-1"/> Taxa de Serviço (10%)</span><span className="font-medium">{formatCurrency(serviceFee)}</span></div>
            <Separator className="my-2" />
            <div className="flex justify-between text-lg font-bold text-slate-800"><span>Total</span><span>{formatCurrency(total)}</span></div>
          </div>
          <div className="flex flex-col gap-2">
            {!isLocked && (
              <Button variant="outline" onClick={handleLockTable}>
                <Printer className="w-4 h-4 mr-2" />
                Gerar Conferência
              </Button>
            )}
            <Button className="w-full" onClick={() => onNavigate(details.id)} size="lg" disabled={isLocked}>
              {isLocked ? 'Comanda Bloqueada' : 'Ver/Gerenciar Comanda'}
            </Button>
          </div>
        </footer>
      </div>
      
      <CancelItemModal
        item={itemToCancel}
        isOpen={!!itemToCancel}
        onClose={() => setItemToCancel(null)}
        onConfirm={handleConfirmCancel}
      />
    </>
  );
};

export default CommandDetailsPanel;
