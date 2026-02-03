// Em src/pages/restaurante/RestaurantTablesScreen.jsx (VERSÃO CORRIGIDA)

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// O ícone <Edit /> é o mesmo que <SquarePen />, o erro estava aqui
import { PlusCircle, Search, Edit } from 'lucide-react'; 

import CommandGrid from './components/CommandGrid';
import CommandDetailsPanel from './components/CommandDetailsPanel';
import MultiCommandPanel from './components/MultiCommandPanel';
import ItemEntryScreen from './components/ItemEntryScreen';
import TransferItemsModal from './components/TransferItemModal';

const RestaurantTablesScreen = () => {
  const [view, setView] = useState("list");
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedTableIds, setSelectedTableIds] = useState([]);
  const [selectedTableDetails, setSelectedTableDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [fullSelectedCommands, setFullSelectedCommands] = useState([]);

  const [initialEntryData, setInitialEntryData] = useState(null);

  // ... (toda a sua lógica de fetchTables, fetchDetails, etc. continua a mesma) ...
  // BUSCAR TODAS AS MESAS
  const fetchTables = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/restaurant/tables');
      setTables(response.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar comandas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (view === "list") {
      fetchTables();
    }
  }, [view, fetchTables]);

  // BUSCAR DETALHES DA MESA
  const fetchDetails = useCallback(async (tableId, shouldRefreshTables = false) => {
      if (!tableId) {
        setSelectedTableDetails(null);
        return;
      }

      try {
        setDetailsLoading(true);

        // SE FOR TRUE → ATUALIZA A LISTA TAMBÉM
        if (shouldRefreshTables) {
          fetchTables();
        }

        const response = await api.get(`/restaurant/tables/${tableId}`);
        setSelectedTableDetails(response.data);
      } catch (err) {
        console.error(err);
        toast.error("Erro ao carregar detalhes.");
      } finally {
        setDetailsLoading(false);
      }
}, [fetchTables]);


  useEffect(() => {
    if (selectedTableIds.length === 1) {
      fetchDetails(selectedTableIds[0]);
    } else {
      setSelectedTableDetails(null);
    }
  }, [selectedTableIds, fetchDetails]);

  // CLIQUE NA MESA
  const handleTableClick = (tableId) => {
    setSelectedTableIds(prev => {
      if (prev.includes(tableId)) {
        return prev.filter(id => id !== tableId);
      } else {
        return [...prev, tableId];
      }
    });
  };

  // ABRIR MODAL DE TRANSFERÊNCIA
  const handleOpenTransferModal = async (specificTableDetails = null) => {
    if (specificTableDetails) {
      setFullSelectedCommands([specificTableDetails]);
      setTransferModalOpen(true);
      return;
    }

    if (selectedTableIds.length === 0) {
      toast.error("Selecione ao menos uma comanda.");
      return;
    }
    
    try {
      setLoading(true);
      const responses = await Promise.all(
        selectedTableIds.map(id => api.get(`/restaurant/tables/${id}`))
      );
      setFullSelectedCommands(responses.map(r => r.data));
      setTransferModalOpen(true);
    } catch (err) {
      toast.error("Erro ao carregar itens para transferência.");
    } finally {
      setLoading(false);
    }
  };

  // ================================================
  // 🔥 CORREÇÃO: TRANSFERÊNCIA EM APENAS UM POST
  // ================================================
  const handleConfirmTransfer = async (destinationName, itemsToTransfer) => {
    try {
      let targetTableId = null;

      // Verificar se a mesa já existe
      const existingTable = tables.find(
        t => t.name.toLowerCase() === destinationName.toLowerCase()
      );

      if (existingTable) {
        targetTableId = existingTable.id;
      } else {
        try {
          const createRes = await api.post('/restaurant/tables', {
            name: destinationName,
            customer_name: 'Transferência'
          });
          targetTableId = createRes.data.id;
        } catch (err) {
          if (err.response?.status === 409) {
            const refreshRes = await api.get('/restaurant/tables');
            const foundTable = refreshRes.data.find(
              t => t.name.toLowerCase() === destinationName.toLowerCase()
            );
            if (foundTable) targetTableId = foundTable.id;
          } else {
            throw err;
          }
        }
      }

      if (!targetTableId) throw new Error("Mesa de destino não definida.");

      // 🔥 Agora enviamos APENAS 1 POST com todos os itens
      const payload = {
        sourceTableId: Number(itemsToTransfer[0].sourceTableId),
        destinationTableId: Number(targetTableId),
        items: itemsToTransfer.map(i => ({
          productId: Number(i.productId),
          quantity: Math.floor(Number(i.quantity))
        }))
      };

      await toast.promise(
        api.post(`/restaurant/tables/transfer-item`, payload),
        {
          loading: "Transferindo itens...",
          success: `Itens movidos para a mesa ${destinationName}!`,
          error: (err) => {
            const msg =
              err.response?.data?.error ||
              err.response?.data?.message ||
              "Erro no servidor (400)";
            return `Falha: ${msg}`;
          }
        }
      );

      setTransferModalOpen(false);
      setSelectedTableIds([targetTableId]);
      fetchTables();
    } catch (err) {
      console.error(err);
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Erro na transferência.";
      toast.error(errorMsg);
    }
  };

  // ================================================

  const handleMainButtonClick = () => {
    if (selectedTableIds.length === 0) {
      setInitialEntryData(null);
      setView("entry");
      return;
    }
    if (selectedTableIds.length > 1) {
      toast.error("Selecione apenas uma mesa para comandar.");
      return;
    }
    const table = selectedTableDetails;
    if (!table) return;
    if (table.status === "EM_PAGAMENTO") {
      toast.error("Esta comanda está em pagamento.");
      return;
    }
    setInitialEntryData({
      id: table.id,
      name: table.name,
      customer_name: table.customer_name
    });
    setView("entry");
  };

  const handleSaveNewCommand = async (data) => {
  try {
    // 1️⃣ Criar comanda
    const res = await api.post('/restaurant/tables', {
      name: data.name,
      customer_name: data.customerName
    });

    const newTableId = res.data.id;

    // 2️⃣ Se tiver itens no carrinho, enviar todos de uma vez
    if (data.items && data.items.length > 0) {
      const itemsPayload = data.items.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        unitPrice: item.price,
        notes: item.notes || null,
      }));

      // Idealmente POST em lote (se o seu backend tiver rota)
      await api.post(`/restaurant/tables/${newTableId}/items/batch`, {
        items: itemsPayload
      }).catch(async () => {
        // fallback caso não exista rota batch → mandar 1 por 1
        await Promise.all(itemsPayload.map(p =>
          api.post(`/restaurant/tables/${newTableId}/items`, p)
        ));
      });
    }

    toast.success("Comanda criada com itens!");

    // 3️⃣ Atualizar tela
    setSelectedTableIds([newTableId]);
    setView("list");
    fetchTables();
  } catch (err) {
    console.error(err);
    toast.error("Erro ao criar comanda.");
  }
};


  const handleUpdateCommand = async (data) => {
    try {
      const itemsPayload = data.items.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        unitPrice: item.price,
        notes: item.notes || null,
      }));
      await Promise.all(itemsPayload.map(p =>
        api.post(`/restaurant/tables/${data.id}/items`, p)
      ));
      toast.success("Itens adicionados!");
      setView("list");
      fetchDetails(data.id);
      fetchTables();
    } catch {
      toast.error("Erro ao adicionar itens.");
    }
  };

  const filteredTables = tables.filter((table) =>
    table.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (table.customer_name &&
      table.customer_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const isLocked =
    selectedTableDetails?.status === "EM_PAGAMENTO" &&
    selectedTableIds.length === 1;

  // ====================================================================
  // ▼▼▼ CORREÇÃO APLICADA AQUI ▼▼▼
  // ====================================================================
  // Vamos determinar o conteúdo do botão ANTES de renderizá-lo.
  let buttonIcon;
  let buttonText;

  if (selectedTableIds.length === 0) {
    buttonIcon = <PlusCircle className="mr-2 h-5 w-5" />;
    buttonText = "Nova Comanda";
  } else {
    buttonIcon = <Edit className="mr-2 h-5 w-5" />;
    buttonText = isLocked ? "Bloqueada" : "Comandar";
  }
  // ====================================================================
  // ▲▲▲ FIM DA CORREÇÃO ▲▲▲
  // ====================================================================

  return (
    <div className="bg-slate-100 p-4 sm:p-6 h-screen box-border">
      {view === "list" ? (
        <div className="flex flex-col md:flex-row h-full gap-6">
          <div className="w-full md:w-2/3 flex flex-col">
            <header className="mb-4">
              <div className="flex justify-between items-center mb-4">
                <h1 className="text-3xl font-bold text-slate-800">
                  Comandas Ativas
                </h1>
                
                {/* =============================================================== */}
                {/* ▼▼▼ CORREÇÃO APLICADA AQUI ▼▼▼                                  */}
                {/* =============================================================== */}
                {/* Se não houver mesas selecionadas, mostre o botão "Nova Comanda" */}
                {selectedTableIds.length === 0 && (
                  <Button size="lg" onClick={handleMainButtonClick}>
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Nova Comanda
                  </Button>
                )}

                {/* Se houver mesas selecionadas, mostre o botão "Comandar/Bloqueada" */}
                {selectedTableIds.length > 0 && (
                  <Button size="lg" onClick={handleMainButtonClick} disabled={isLocked}>
                    <Edit className="mr-2 h-5 w-5" />
                    {isLocked ? "Bloqueada" : "Comandar"}
                  </Button>
                )}
                {/* =============================================================== */}
                {/* ▲▲▲ FIM DA CORREÇÃO ▲▲▲                                         */}
                {/* =============================================================== */}

              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  placeholder="Buscar..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </header>
            <main className="flex-grow overflow-y-auto -mr-3 pr-3 mt-4">
              <CommandGrid
                tables={filteredTables}
                loading={loading}
                selectedTableIds={selectedTableIds}
                onTableClick={handleTableClick}
              />
            </main>
          </div>

          <div className="w-full md:w-1/3 h-full">
            {selectedTableIds.length === 0 && (
              <CommandDetailsPanel
                details={null}
                isLoading={false}
                selectedTableIds={[]}
              />
            )}

            {selectedTableIds.length === 1 && (
              <CommandDetailsPanel
                details={selectedTableDetails}
                isLoading={detailsLoading}
                onRefresh={fetchDetails}
                tableId={selectedTableIds[0]}
                selectedTableIds={selectedTableIds}
                onTransferAll={handleOpenTransferModal}
              />
            )}

            {selectedTableIds.length > 1 && (
              <MultiCommandPanel
                selectedTableIds={selectedTableIds}
                onTransferAll={handleOpenTransferModal}
              />
            )}
          </div>
        </div>
      ) : (
        <ItemEntryScreen
          onBack={() => setView("list")}
          onSave={handleSaveNewCommand}
          onUpdate={handleUpdateCommand}
          initialData={initialEntryData}
        />
      )}

      <TransferItemsModal
        isOpen={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        commands={fullSelectedCommands}
        onConfirm={handleConfirmTransfer}
      />
    </div>
  );
};

export default RestaurantTablesScreen;
