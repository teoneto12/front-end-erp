// src/pages/restaurant/RestaurantTablesScreen.jsx

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search, Edit } from 'lucide-react';

import CommandGrid from './components/CommandGrid';
import CommandDetailsPanel from './components/CommandDetailsPanel';
import ItemEntryScreen from './components/ItemEntryScreen';

const RestaurantTablesScreen = () => {
  const [view, setView] = useState('list');
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [selectedTableDetails, setSelectedTableDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [initialEntryData, setInitialEntryData] = useState(null);

  const navigate = useNavigate();

  const fetchTables = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/restaurant/tables');
      setTables(response.data || []);
    } catch (err) {
      toast.error("Falha ao carregar as comandas ativas.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (view === 'list') {
      fetchTables();
    }
  }, [view, fetchTables]);

  const fetchDetails = useCallback(async (tableId) => {
    if (!tableId) {
      setSelectedTableDetails(null);
      return;
    }
    setDetailsLoading(true);
    try {
        const response = await api.get(`/restaurant/tables/${tableId}`);
        setSelectedTableDetails(response.data);
    } catch (err) {
        console.error("Erro ao buscar detalhes da API", err);
        toast.error("Não foi possível carregar os detalhes da comanda.");
        setSelectedTableDetails(null);
    } finally {
        setDetailsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDetails(selectedTableId);
  }, [selectedTableId, fetchDetails]);

  const handleTableClick = (tableId) => {
    if (selectedTableId === tableId) {
      setSelectedTableId(null);
    } else {
      setSelectedTableId(tableId);
    }
  };

  const handleMainButtonClick = () => {
    if (selectedTableId && selectedTableDetails) {
      if (selectedTableDetails.status === 'EM_PAGAMENTO') return; // Segurança extra
      setInitialEntryData({
        id: selectedTableDetails.id,
        name: selectedTableDetails.name,
        customer_name: selectedTableDetails.customer_name,
      });
      setView('entry');
    } else {
      setInitialEntryData(null);
      setView('entry');
    }
  };

  const handleSaveNewCommand = async (commandData) => {
    try {
      const newTable = await api.post('/restaurant/tables', { name: commandData.name, customer_name: commandData.customerName });
      
      const itemPayloads = commandData.items.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        unitPrice: item.price,
        notes: item.notes || null,
      }));

      await Promise.all(
        itemPayloads.map(payload => api.post(`/restaurant/tables/${newTable.data.id}/items`, payload))
      );

      toast.success(`Comanda "${newTable.data.name}" criada com sucesso!`);
      setView('list');
      setSelectedTableId(newTable.data.id);
    } catch (err) {
      console.error("Erro completo ao salvar:", err);
      toast.error(`Erro ao criar comanda: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleUpdateCommand = async (commandData) => {
    try {
      const itemPayloads = commandData.items.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        unitPrice: item.price,
        notes: item.notes || null,
      }));

      await Promise.all(
        itemPayloads.map(payload => api.post(`/restaurant/tables/${commandData.id}/items`, payload))
      );

      toast.success(`Itens adicionados à comanda "${commandData.name}"!`);
      setView('list');
      fetchDetails(commandData.id);
    } catch (err) {
      console.error("Erro ao adicionar itens:", err);
      toast.error(`Erro ao adicionar itens: ${err.response?.data?.error || err.message}`);
    }
  };

  const filteredTables = tables.filter(table => 
    table.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (table.customer_name && table.customer_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const isSelectedTableLocked = selectedTableDetails?.status === 'EM_PAGAMENTO';

  return (
    <div className="bg-slate-100 p-4 sm:p-6 h-screen box-border">
      {view === 'list' ? (
        <div className="flex flex-col md:flex-row h-full gap-6">
          <div className="w-full md:w-2/3 flex flex-col">
            <header className="flex-shrink-0 mb-4">
              <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Comandas Ativas</h1>
                <Button 
                  onClick={handleMainButtonClick} 
                  size="lg" 
                  disabled={selectedTableId && (detailsLoading || isSelectedTableLocked)}
                >
                  {selectedTableId ? (
                    <>
                      <Edit className="mr-2 h-5 w-5" /> 
                      {isSelectedTableLocked ? 'Comanda Bloqueada' : 'Comandar na Mesa'}
                    </>
                  ) : (
                    <>
                      <PlusCircle className="mr-2 h-5 w-5" /> 
                      Nova Comanda
                    </>
                  )}
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input 
                  placeholder="Buscar por nome da comanda ou cliente..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="pl-10" 
                />
              </div>
            </header>
            <main className="flex-grow overflow-y-auto -mr-3 pr-3">
              <CommandGrid
                tables={filteredTables}
                loading={loading}
                selectedTableId={selectedTableId}
                onTableClick={handleTableClick}
              />
            </main>
          </div>
          <div className="w-full md:w-1/3 h-full">
            <CommandDetailsPanel 
                details={selectedTableDetails} 
                isLoading={detailsLoading} 
                onNavigate={handleMainButtonClick}
                onRefresh={fetchDetails}
            />
          </div>
        </div>
      ) : (
        <ItemEntryScreen 
          onBack={() => setView('list')} 
          onSave={handleSaveNewCommand}
          onUpdate={handleUpdateCommand}
          initialData={initialEntryData}
        />
      )}
    </div>
  );
};

export default RestaurantTablesScreen;
