// ARQUIVO: src/pages/RestaurantTablesScreen.jsx
// CÓDIGO COMPLETO COM LAYOUT DE DOIS PAINÉIS

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, PlusCircle, Utensils, Clock, ShoppingCart, Percent, MessageSquare } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

//================================================
// COMPONENTE INTERNO: CommandDetailsPanel
//================================================
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const CommandDetailsPanel = ({ details, isLoading, onNavigate }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg shadow-inner">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!details) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 rounded-lg shadow-inner p-4 text-center">
        <ShoppingCart className="h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma Comanda Selecionada</h3>
        <p className="mt-1 text-sm text-gray-500">Clique em uma comanda à esquerda para ver os detalhes.</p>
      </div>
    );
  }

  const subtotal = details.items.reduce((acc, item) => acc + Number(item.quantity) * Number(item.unit_price), 0);
  const serviceFee = subtotal * 0.10;
  const total = subtotal + serviceFee;

  return (
    <div className="bg-white h-full rounded-lg shadow-lg flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold text-gray-800 truncate">Detalhes: {details.number}</h2>
        <p className="text-sm text-gray-500">Aberta por: {details.user_who_opened || 'Admin'}</p>
      </div>

      <div className="flex-grow p-4 overflow-y-auto">
        <h3 className="font-semibold mb-3 text-gray-700">Itens Consumidos</h3>
        {details.items.length > 0 ? (
          <ul className="space-y-3">
            {details.items.map(item => (
              <li key={item.id} className="text-sm">
                <div className="flex justify-between">
                  <span>{item.quantity}x {item.product_name}</span>
                  <span className="font-medium">{formatCurrency(item.quantity * item.unit_price)}</span>
                </div>
                {item.notes && (
                  <p className="text-xs text-gray-500 pl-4 flex items-center"><MessageSquare className="w-3 h-3 mr-1"/> {item.notes}</p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-400 mt-4">Nenhum item lançado ainda.</p>
        )}
      </div>

      <div className="p-4 border-t bg-gray-50 rounded-b-lg">
        <div className="space-y-2 text-sm mb-4">
          <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span className="font-medium">{formatCurrency(subtotal)}</span></div>
          <div className="flex justify-between items-center"><span className="text-gray-600 flex items-center"><Percent className="w-3 h-3 mr-1"/> Taxa de Serviço (10%)</span><span className="font-medium">{formatCurrency(serviceFee)}</span></div>
          <div className="flex justify-between text-lg font-bold text-gray-800 pt-2 border-t mt-2"><span>Total</span><span>{formatCurrency(total)}</span></div>
        </div>
        <Button className="w-full" onClick={() => onNavigate(details.id)} size="lg">
          Adicionar/Ver Itens
        </Button>
      </div>
    </div>
  );
};

//================================================
// COMPONENTE INTERNO: CommandCard
//================================================
const CommandCard = ({ table, onClick, isSelected }) => {
  const [elapsedTime, setElapsedTime] = useState('');

  useEffect(() => {
    const calculateElapsedTime = () => {
      if (!table.created_at) return;
      const now = new Date();
      const openedAt = new Date(table.created_at);
      const diffInSeconds = Math.floor((now - openedAt) / 1000);
      const hours = Math.floor(diffInSeconds / 3600);
      const minutes = Math.floor((diffInSeconds % 3600) / 60);
      setElapsedTime(hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`);
    };
    calculateElapsedTime();
    const interval = setInterval(calculateElapsedTime, 60000);
    return () => clearInterval(interval);
  }, [table.created_at]);

  const cardClasses = `flex flex-col justify-between p-5 rounded-xl shadow-md cursor-pointer transition-all duration-200 ease-in-out transform hover:-translate-y-1 min-h-[130px] ${isSelected ? 'bg-blue-500 shadow-blue-200 shadow-lg ring-4 ring-blue-300' : 'bg-white hover:shadow-lg'}`;
  const headerClasses = `font-bold text-2xl truncate ${isSelected ? 'text-white' : 'text-gray-800'}`;
  const iconClasses = `h-6 w-6 flex-shrink-0 ${isSelected ? 'text-blue-200' : 'text-gray-500'}`;
  const footerTextClasses = isSelected ? 'text-blue-100' : 'text-gray-600';

  return (
    <div onClick={() => onClick(table.id)} className={cardClasses}>
      <div className="flex justify-between items-start"><h3 className={headerClasses} title={table.number}>{table.number}</h3><Utensils className={iconClasses} /></div>
      <div className="flex justify-between items-end mt-3 text-sm">
        <span className={`font-semibold px-2 py-0.5 rounded-md text-xs ${isSelected ? 'bg-white text-blue-500' : 'bg-gray-100 text-gray-700'}`}>{table.status}</span>
        <div className={`flex items-center ${footerTextClasses}`}><Clock className="h-4 w-4 mr-1" /><span>{elapsedTime}</span></div>
      </div>
    </div>
  );
};

//================================================
// COMPONENTE PRINCIPAL: RestaurantTablesScreen
//================================================
const RestaurantTablesScreen = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [selectedTableDetails, setSelectedTableDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCommandName, setNewCommandName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();
  const { token } = useAuth();

  useEffect(() => {
    const fetchTables = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/api/restaurant/tables?status=OCUPADA', { headers: { Authorization: `Bearer ${token}` } });
        setTables(response.data);
        setError(null);
      } catch (err) {
        setError('Falha ao carregar as comandas ativas.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTables();
  }, [token]);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!selectedTableId) {
        setSelectedTableDetails(null);
        return;
      }
      setDetailsLoading(true);
      try {
        const response = await axios.get(`/api/restaurant/tables/${selectedTableId}`, { headers: { Authorization: `Bearer ${token}` } });
        setSelectedTableDetails(response.data);
      } catch (err) {
        console.error("Erro ao buscar detalhes da comanda", err);
        setSelectedTableDetails(null);
      } finally {
        setDetailsLoading(false);
      }
    };
    fetchDetails();
  }, [selectedTableId, token]);

  const handleTableClick = (tableId) => {
    setSelectedTableId(tableId);
  };

  const handleNavigateToOrder = (tableId) => {
    navigate(`/restaurant/tables/${tableId}`);
  };

  const handleCreateCommand = async () => {
    if (!newCommandName.trim()) return;
    setIsCreating(true);
    try {
      const response = await axios.post('/api/restaurant/tables', { name: newCommandName }, { headers: { Authorization: `Bearer ${token}` } });
      setIsModalOpen(false);
      setNewCommandName('');
      handleNavigateToOrder(response.data.id);
    } catch (err) {
      alert('Erro ao criar comanda: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;
  if (error) return <div className="text-center text-red-600 bg-red-100 p-4 rounded-lg flex items-center justify-center"><AlertCircle className="h-5 w-5 mr-2" /> {error}</div>;

  return (
    <div className="flex h-[calc(100vh-theme(space.24))] gap-6">
      <div className="w-2/3 flex flex-col">
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <h1 className="text-3xl font-bold text-gray-800">Comandas Ativas</h1>
          <Button onClick={() => setIsModalOpen(true)} size="lg"><PlusCircle className="mr-2 h-5 w-5" /> Nova Comanda</Button>
        </div>
        <div className="flex-grow overflow-y-auto pr-4 -mr-4">
          {tables.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {tables.map(table => (
                <CommandCard key={table.id} table={table} onClick={handleTableClick} isSelected={selectedTableId === table.id} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 border-2 border-dashed rounded-lg mt-8 flex flex-col items-center justify-center h-full">
              <Utensils className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma comanda ativa</h3>
              <p className="mt-1 text-sm text-gray-500">Clique em "Nova Comanda" para abrir a primeira.</p>
            </div>
          )}
        </div>
      </div>

      <div className="w-1/3">
        <CommandDetailsPanel details={selectedTableDetails} isLoading={detailsLoading} onNavigate={handleNavigateToOrder} />
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>Abrir Nova Comanda</DialogTitle><DialogDescription>Digite um nome ou número para identificar esta comanda (ex: "Mesa 10", "Balcão").</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="command-name" className="text-right">Nome</Label>
              <Input id="command-name" value={newCommandName} onChange={(e) => setNewCommandName(e.target.value)} className="col-span-3" maxLength={24} autoFocus onKeyPress={(e) => e.key === 'Enter' && handleCreateCommand()} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateCommand} disabled={isCreating || !newCommandName.trim()}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar e Abrir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RestaurantTablesScreen;
