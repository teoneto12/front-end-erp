import React, { useState, useEffect } from 'react';
import { X, CheckSquare, Square, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from "@/lib/api";

const TransferItemsModal = ({ isOpen, onClose, commands = [], onConfirm }) => {
  const [selectedItems, setSelectedItems] = useState({});
  const [destinationTable, setDestinationTable] = useState('');
  const [loadingTransfer, setLoadingTransfer] = useState(false);

  // Resetar estado ao abrir
  useEffect(() => {
    if (isOpen) {
      setSelectedItems({});
      setDestinationTable('');
      setLoadingTransfer(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Consolidar todos os itens de todas as comandas selecionadas
  const allItems = (commands || []).flatMap(cmd =>
    (cmd?.items || []).map(item => ({
      ...item,
      sourceTableId: cmd.id,
      sourceTableName: cmd.name
    }))
  );

  // Alternar seleção (clique no card ou checkbox)
  const toggleItem = (itemId, maxQty) => {
    setSelectedItems(prev => {
      const newItems = { ...prev };
      if (newItems[itemId] !== undefined) {
        delete newItems[itemId];
      } else {
        newItems[itemId] = maxQty;
      }
      return newItems;
    });
  };

  // Lida com alteração direta da quantidade
  const handleQuantityChange = (e, itemId, maxQty) => {
    e.stopPropagation();
    const value = e.target.value;
    
    if (value === '') {
      setSelectedItems(prev => {
        const newItems = { ...prev };
        delete newItems[itemId];
        return newItems;
      });
      return;
    }

    let newQty = parseFloat(value);
    if (isNaN(newQty) || newQty <= 0) {
      setSelectedItems(prev => {
        const newItems = { ...prev };
        delete newItems[itemId];
        return newItems;
      });
    } else {
      if (newQty > maxQty) newQty = maxQty;
      setSelectedItems(prev => ({
        ...prev,
        [itemId]: newQty
      }));
    }
  };

  const handleSelectAll = () => {
    if (Object.keys(selectedItems).length === allItems.length && allItems.length > 0) {
      setSelectedItems({});
    } else {
      const all = {};
      allItems.forEach(item => {
        all[item.id] = item.quantity;
      });
      setSelectedItems(all);
    }
  };

  const handleConfirm = async () => {
    try {
      if (!destinationTable.trim()) {
        alert("Informe a mesa de destino.");
        return;
      }

      if (Object.keys(selectedItems).length === 0) {
        alert("Selecione ao menos um item.");
        return;
      }

      setLoadingTransfer(true);

      // 1️⃣ Buscar mesas existentes
      const tablesResponse = await api.get('/restaurant/tables');
      let destinationTableId;

      const found = tablesResponse.data.find(t => t.name === destinationTable.trim());

      if (!found) {
        // 2️⃣ Criar mesa automaticamente se não existir
        const createResponse = await api.post('/restaurant/tables', { name: destinationTable.trim() });
        destinationTableId = createResponse.data.id;
      } else {
        destinationTableId = found.id;
      }

      // 3️⃣ Montar lista de itens selecionados
      const itemsPayload = allItems
        .filter(item => selectedItems[item.id] !== undefined)
        .map(item => ({
          sourceItemId: item.id,
          sourceTableId: item.sourceTableId,
          productId: item.product_id,
          quantityToTransfer: Number(selectedItems[item.id])
        }));

      // Validar que todos os itens vêm da mesma mesa origem
      const uniqueSources = [...new Set(itemsPayload.map(i => i.sourceTableId))];
      if (uniqueSources.length !== 1) {
        alert("Só é possível transferir itens de uma mesa origem por vez.");
        setLoadingTransfer(false);
        return;
      }

      // Payload final
      const payload = {
        sourceTableId: uniqueSources[0],
        destinationTableId,
        items: itemsPayload
      };

      console.log("Payload enviado:", payload);

      await api.post("/restaurant/tables/transfer-item", payload);

      // ✅ Atualiza instantaneamente a lista de mesas no frontend
      if (onConfirm) {
        onConfirm({
          id: destinationTableId,
          name: destinationTable.trim(),
          items: itemsPayload.map(i => ({
            ...i,
            product_name: allItems.find(ai => ai.id === i.sourceItemId).product_name,
            quantity: i.quantityToTransfer
          }))
        });
      }

      alert("Itens transferidos com sucesso!");
      onClose();
    } catch (err) {
      console.error("Erro ao transferir:", err);
      const message = err.response?.data?.error || err.message;
      alert("Erro ao transferir: " + message);
    } finally {
      setLoadingTransfer(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center bg-slate-50 rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Transferir Itens</h2>
            <p className="text-sm text-slate-500">Selecione os itens e a mesa de destino</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {allItems.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              Nenhum item disponível para transferência.
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-slate-700">Itens Disponíveis</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleSelectAll}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  {Object.keys(selectedItems).length === allItems.length ? 'Desmarcar Todos' : 'Marcar Todos'}
                </Button>
              </div>

              <div className="space-y-3">
                {allItems.map((item) => {
                  const isSelected = selectedItems[item.id] !== undefined;
                  const currentQty = selectedItems[item.id] || '';

                  return (
                    <div 
                      key={item.id}
                      onClick={() => toggleItem(item.id, item.quantity)}
                      className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <div className="mr-4">
                        {isSelected ? (
                          <CheckSquare className="w-6 h-6 text-blue-600" />
                        ) : (
                          <Square className="w-6 h-6 text-slate-300" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 truncate">{item.product_name}</p>
                        <p className="text-xs text-slate-500 font-medium">Origem: {item.sourceTableName}</p>
                      </div>

                      <div className="flex items-center gap-3 ml-4">
                        <div className="flex flex-col items-end">
                          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">Qtd. Transferir</label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={currentQty}
                              onChange={(e) => handleQuantityChange(e, item.id, item.quantity)}
                              onClick={(e) => e.stopPropagation()}
                              className={`w-20 h-10 text-center font-bold text-base border-2 ${
                                isSelected ? 'border-blue-500 bg-white text-blue-700' : 'border-slate-200 bg-slate-50'
                              }`}
                              placeholder="0"
                              min="0"
                              max={item.quantity}
                              step="any"
                            />
                            <span className="text-xs text-slate-400 font-bold w-12">
                              de {Number(item.quantity).toFixed(0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-slate-50 rounded-b-2xl space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Mesa de Destino (Criação Automática)</label>
            <Input 
              placeholder="Ex: 15 ou Mesa VIP" 
              value={destinationTable}
              onChange={(e) => setDestinationTable(e.target.value)}
              className="bg-white border-2 focus:ring-blue-500 h-12 text-lg"
            />
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1 border-2 font-bold h-12">
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirm} 
              className="flex-1 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 font-bold text-lg h-12"
              disabled={!destinationTable.trim() || Object.keys(selectedItems).length === 0 || loadingTransfer}
            >
              {loadingTransfer ? <Loader2 className="animate-spin w-5 h-5 mx-auto" /> : `Confirmar (${Object.keys(selectedItems).length})`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransferItemsModal;
