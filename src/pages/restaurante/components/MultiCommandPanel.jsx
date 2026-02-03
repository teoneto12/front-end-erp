import { useEffect, useState } from 'react';
import api from '@/lib/api';

import { Layers, Lock, Unlock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

import TransferItemsModal from './TransferItemModal';
import GroupTablesModal from './GroupTablesModal';

const MultiCommandPanel = ({ selectedTableIds, }) => {
  const [commands, setCommands] = useState([]);
  const [loading, setLoading] = useState(true);

  const [serviceRate, setServiceRate] = useState(0); // 🔥 taxa carregada do banco

  const [modalOpen, setModalOpen] = useState(false);
  const [modalCommands, setModalCommands] = useState([]);

  const [groupModalOpen, setGroupModalOpen] = useState(false);

  // ============================================================================
  // BUSCAR TAXA DE SERVIÇO
  // ============================================================================
  useEffect(() => {
    const fetchFee = async () => {
      try {
        const res = await api.get('/settings/SERVICE_FEE_PERCENT');
        const value = parseFloat(res.data?.value);

        if (!isNaN(value)) setServiceRate(value / 100);
      } catch (err) {
        console.warn("Não foi possível carregar a taxa de serviço.");
        setServiceRate(0); // fallback
      }
    };

    fetchFee();
  }, []);

  // ============================================================================
  // BUSCAR COMANDAS SELECIONADAS
  // ============================================================================
  useEffect(() => {
    if (!selectedTableIds.length) return;

    const fetchCommands = async () => {
      setLoading(true);
      try {
        const responses = await Promise.all(
          selectedTableIds.map(id => api.get(`/restaurant/tables/${id}`))
        );
        setCommands(responses.map(r => r.data));
      } finally {
        setLoading(false);
      }
    };

    fetchCommands();
  }, [selectedTableIds]);

  const refreshCommand = async (id) => {
  try {
    const res = await api.get(`/restaurant/tables/${id}`);
    setCommands(prev =>
      prev.map(c => (c.id === id ? res.data : c))
    );
  } catch (err) {
    console.error("Erro ao atualizar comanda:", err);
  }
};

  // ============================================================================
  // CANCELAR COMANDA
  // ============================================================================
  const handleCancel = async (id) => {
    const cmd = commands.find(c => c.id === id);
    if (!cmd) return;

    if (!window.confirm("Tem certeza que deseja cancelar essa comanda?")) return;

    try {
      if (cmd.status === "EM_PAGAMENTO") {
        await api.patch(`/restaurant/tables/${id}/unlock-payment`);
      }

      await api.patch(`/restaurant/tables/${id}/cancel`);

      setCommands(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error(err);
      alert("Erro ao cancelar comanda.");
    }
  };

  // ============================================================================
  // BLOQUEAR
  // ============================================================================
const handleLock = async (id) => {
  try {
    await api.put(`/restaurant/tables/${id}/lock`);
    await refreshCommand(id);
  } catch (err) {
    console.error(err);
    alert("Erro ao bloquear comanda.");
  }
};



  // ============================================================================
  // DESBLOQUEAR
  // ============================================================================
const handleUnlock = async (id) => {
  try {
    await api.patch(`/restaurant/tables/${id}/unlock`);
    await refreshCommand(id);
  } catch (err) {
    console.error(err);
    alert("Erro ao desbloquear comanda.");
  }
};



  // ============================================================================
  // AGRUPAR MESAS
  // ============================================================================
  const handleGroupTablesConfirm = async (targetIdentifier) => {
    try {
      await api.post("/restaurant/tables/merge", {
        target: targetIdentifier,
        tables: commands.map(c => c.id)
      });

      alert("Mesas agrupadas!");
      window.location.reload();

    } catch (err) {
      console.error(err);
      alert("Erro ao agrupar mesas.");
    }
  };


  // ============================================================================
  // CÁLCULOS
  // ============================================================================
  const totalByCommand = commands.map(c => {
    const subtotal =
      c.items?.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0) || 0;

    const service = subtotal * serviceRate;
    const total = subtotal + service;

    return { ...c, subtotal, service, total };
  });

  const totalGeral = totalByCommand.reduce((sum, c) => sum + c.total, 0);

  // ============================================================================
  // RENDER
  // ============================================================================
  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm flex justify-center items-center">
        <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full"></div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl p-6 shadow-sm h-full flex flex-col">

        {/* HEADER */}
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-5 h-5" />
          <h2 className="text-xl font-bold text-slate-800">
            {commands.length} Comandas Selecionadas
          </h2>
        </div>

        {/* LISTA */}
        <div className="flex-1 overflow-y-auto space-y-5">

          {totalByCommand.map(cmd => {
            const inPayment = cmd.status === "EM_PAGAMENTO";

            return (
              <div
                key={cmd.id}
                className={`border rounded-lg p-4 ${
                  inPayment ? "border-yellow-500 bg-yellow-50" : "border-slate-200"
                }`}
              >
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-800">
                      {cmd.name} — {cmd.customer_name || "Consumidor"}
                    </h3>

                    <p className="text-xs text-slate-500 mt-1">
                      Status: {inPayment ? "BLOQUEADA (Pagamento)" : cmd.status}
                    </p>
                  </div>

                  {/* AÇÕES */}
                  <div className="flex gap-2">

                    {!inPayment && (
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => handleLock(cmd.id)}
                      >
                        <Lock className="w-4 h-4 mr-1" />
                        Bloquear
                      </Button>
                    )}

                    {inPayment && (
                      <Button
                        size="sm"
                        className="bg-yellow-500 hover:bg-yellow-600 text-white"
                        onClick={() => handleUnlock(cmd.id)}
                      >
                        <Unlock className="w-4 h-4 mr-1" />
                        Desbloquear
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-300 hover:bg-red-50"
                      onClick={() => handleCancel(cmd.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Cancelar
                    </Button>
                  </div>
                </div>

                <div className="mt-4 space-y-1 text-sm">

                  {/* SUBTOTAL */}
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>R$ {cmd.subtotal.toFixed(2)}</span>
                  </div>

                  {/* TAXA */}
                  <div className="flex justify-between">
                    <span>Taxa de Serviço ({(serviceRate * 100).toFixed(2)}%)</span>
                    <span>R$ {cmd.service.toFixed(2)}</span>
                  </div>

                  {/* TOTAL */}
                  <div className="flex justify-between font-bold text-base pt-2 border-t">
                    <span>Total</span>
                    <span>R$ {cmd.total.toFixed(2)}</span>
                  </div>

                </div>
              </div>
            );
          })}

        </div>

        {/* TOTAL GERAL */}
        <div className="mt-6 pt-4 border-t flex justify-between text-lg font-bold text-slate-900">
          <span>Total Geral</span>
          <span>R$ {totalGeral.toFixed(2)}</span>
        </div>

        {/* BOTÕES FINAIS */}
        {selectedTableIds.length >= 2 && (
          <div className="mt-6 space-y-3">
            <Button
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => setGroupModalOpen(true)}
            >
              Agrupar Mesas
            </Button>

            <Button
              className="w-full"
              onClick={() => {
                setModalCommands(commands);
                setModalOpen(true);
              }}
            >
              Transferir Tudo
            </Button>
          </div>
        )}

      </div>

      {/* MODAIS */}
      <TransferItemsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        commands={modalCommands}
        onConfirm={() => setModalOpen(false)}
      />

      <GroupTablesModal
        isOpen={groupModalOpen}
        onClose={() => setGroupModalOpen(false)}
        onConfirm={handleGroupTablesConfirm}
      />
    </>
  );
};

export default MultiCommandPanel;
