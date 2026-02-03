import React, { useState, useEffect } from 'react';
import { Clock, User, Receipt, ArrowRightLeft, Trash2, ChevronDown, Unlock, Lock, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import api from '@/lib/api';

import CancelItemModal from "./CancelItemModal";

const CommandDetailsPanel = ({ details, isLoading, onRefresh, tableId, onTransferAll }) => {

  const [canceling, setCanceling] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [locking, setLocking] = useState(false);

  const [serviceRate, setServiceRate] = useState(0);

  // Modal de cancelamento de item
  const [cancelItemModalOpen, setCancelItemModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // NOVO — Modal para imprimir conferência
  const [printModalOpen, setPrintModalOpen] = useState(false);

  // Buscar taxa de serviço
  useEffect(() => {
    const fetchServiceFee = async () => {
      try {
        const res = await api.get('/settings/SERVICE_FEE_PERCENT');
        const value = parseFloat(res.data?.value);
        if (!isNaN(value)) setServiceRate(value / 100);
      } catch {
        console.warn("Não foi possível carregar a taxa de serviço.");
      }
    };
    fetchServiceFee();
  }, []);

  // Cancelar item
  const handleCancelItem = async (itemId, cancelQuantity) => {
    try {
      await api.post(
        `/restaurant/tables/${tableId}/items/${itemId}/cancel`,
        { quantity: cancelQuantity }
      );

      await onRefresh(tableId, true);

      setCancelItemModalOpen(false);
      setSelectedItem(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao cancelar item.');
    }
  };

  // NOVO — Função para imprimir conferência
const handlePrint = () => {
  setPrintModalOpen(false);

  // 🔥 abrir página de impressão
  const printWindow = window.open(`/print/conferencia/${tableId}`, "_blank");

  // garantir que a impressão abra automaticamente
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
    };
  }
};


  // BLOQUEAR COMANDA — AGORA ABRE MODAL
  const handleLockCommand = async () => {
    try {
      setLocking(true);
      await api.put(`/restaurant/tables/${tableId}/lock`);
      await onRefresh(tableId, true);

      // ABRE A PERGUNTA PARA IMPRIMIR
      setPrintModalOpen(true);

    } catch {
      alert("Não foi possível bloquear a comanda para pagamento.");
    } finally {
      setLocking(false);
    }
  };

  // DESBLOQUEAR
  const handleUnlockCommand = async () => {
    try {
      setUnlocking(true);
      await api.patch(`/restaurant/tables/${tableId}/unlock`);
      onRefresh(tableId, true);
    } catch {
      alert("Não foi possível desbloquear a comanda.");
    } finally {
      setUnlocking(false);
    }
  };

  // CANCELAR COMANDA
  const handleCancelCommand = async () => {
    if (!window.confirm("Deseja realmente cancelar esta comanda?")) return;

    try {
      setCanceling(true);

      if (details.status === "EM_PAGAMENTO") {
        await api.patch(`/restaurant/tables/${tableId}/unlock-payment`);
      }

      await api.patch(`/restaurant/tables/${tableId}/cancel`);
      onRefresh(tableId, true);

    } catch (err) {
      alert(err.response?.data?.message || "Erro ao cancelar comanda.");
    } finally {
      setCanceling(false);
    }
  };

  // Loading
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm h-full flex flex-col items-center justify-center text-slate-400">
        <Receipt className="w-12 h-12 mb-4 opacity-20" />
        <p>Selecione uma comanda para ver os detalhes</p>
      </div>
    );
  }

  // Cálculos
  const subtotal = details.items?.reduce((sum, item) => {
    const validQty = item.quantity - (item.cancelled_quantity || 0);
    return sum + validQty * item.unit_price;
  }, 0) || 0;

  const serviceCharge = subtotal * serviceRate;
  const total = subtotal + serviceCharge;

  return (
    <div className="bg-white rounded-xl shadow-sm h-full flex flex-col overflow-hidden">

      {/* HEADER */}
      <header className="p-6 border-b">
        <h2 className="text-2xl font-bold text-slate-800">Detalhes: {details.name}</h2>
        <p className="text-sm text-slate-500">Aberta por: {details.opened_by || 'Admin'}</p>
        <p className="text-xs mt-2 px-2 py-1 inline-block rounded bg-slate-100 text-slate-700">
          Status: <strong>{details.status === "EM_PAGAMENTO" ? "BLOQUEADA" : details.status}</strong>
        </p>
      </header>

      {/* LISTA DE ITENS */}
      <div className="flex-1 overflow-y-auto p-6">
        <h3 className="font-bold text-slate-700 mb-4 uppercase text-xs tracking-wider">
          Itens Consumidos
        </h3>

        {details.items?.length > 0 ? (
          <div className="space-y-4">
            {details.items.map((item) => {
              const validQty = item.quantity - (item.cancelled_quantity || 0);
              const itemTotal = validQty * item.unit_price;

              const fullyCanceled = validQty <= 0;

              return (
                <div key={item.id}
                  className={`flex justify-between items-center group p-2 rounded-lg ${fullyCanceled ? "bg-red-50 border border-red-200" : ""}`}
                >
                  <div className="flex-1">

                    {fullyCanceled ? (
                      <p className="text-red-600 font-medium">
                        {item.product_name}
                        <span className="ml-2 text-xs">(ITEM CANCELADO — {item.cancelled_quantity})</span>
                      </p>
                    ) : (
                      <>
                        <p className="text-slate-800 font-medium">
                          {validQty.toFixed(3)}x {item.product_name}
                          {item.cancelled_quantity > 0 && (
                            <span className="ml-2 text-xs text-red-500">(Cancelados: {item.cancelled_quantity})</span>
                          )}
                        </p>

                        {item.notes && (
                          <p className="text-xs text-slate-500 italic">{item.notes}</p>
                        )}
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-4">

                    {!fullyCanceled && (
                      <span className="text-slate-600 font-semibold">
                        R$ {itemTotal.toFixed(2)}
                      </span>
                    )}

                    {!fullyCanceled && (
                      <>
                        <button
                          onClick={() => onTransferAll(item)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        >
                          <ArrowRightLeft className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            setSelectedItem(item);
                            setCancelItemModalOpen(true);
                          }}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 text-slate-400">Nenhum item lançado nesta comanda.</div>
        )}
      </div>

      {/* TOTAL */}
      <footer className="p-6 bg-slate-50 border-t">

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm text-slate-600">
            <span>Subtotal</span>
            <span>R$ {subtotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-sm text-slate-600">
            <span>Taxa de Serviço ({(serviceRate * 100).toFixed(2)}%)</span>
            <span>R$ {serviceCharge.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-lg font-bold text-slate-900 pt-2 border-t">
            <span>Total</span>
            <span>R$ {total.toFixed(2)}</span>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              Opções da Comanda
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-[240px]">

            <DropdownMenuItem onClick={() => onTransferAll(details)}>
              <ArrowRightLeft className="mr-2 h-4 w-4" />
              Transferência Parcial
            </DropdownMenuItem>

            {details.status !== "EM_PAGAMENTO" && (
              <DropdownMenuItem onClick={handleLockCommand} disabled={locking}>
                <Lock className="mr-2 h-4 w-4" />
                {locking ? "Bloqueando..." : "Bloquear (Pagamento)"}
              </DropdownMenuItem>
            )}

            {details.status === "EM_PAGAMENTO" && (
              <DropdownMenuItem onClick={handleUnlockCommand} disabled={unlocking}>
                <Unlock className="mr-2 h-4 w-4" />
                {unlocking ? "Desbloqueando..." : "Desbloquear Comanda"}
              </DropdownMenuItem>
            )}

            <DropdownMenuItem
              className="text-red-600"
              onClick={handleCancelCommand}
              disabled={canceling}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {canceling ? "Cancelando..." : "Cancelar Comanda"}
            </DropdownMenuItem>

          </DropdownMenuContent>
        </DropdownMenu>
      </footer>

      {/* MODAL DE CANCELAR ITEM */}
      <CancelItemModal
        item={selectedItem}
        isOpen={cancelItemModalOpen}
        onClose={() => setCancelItemModalOpen(false)}
        onConfirm={handleCancelItem}
      />

      {/* NOVO — MODAL DE IMPRESSÃO */}
      {printModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[360px]">

            <h3 className="text-lg font-bold mb-4 text-slate-800">
              Deseja imprimir a conferência da conta?
            </h3>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setPrintModalOpen(false)}
              >
                Não
              </Button>

              <Button
                onClick={handlePrint}
                className="flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Imprimir
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CommandDetailsPanel;
