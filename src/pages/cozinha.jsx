// ARQUIVO: src/pages/KitchenScreen.jsx

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios'; // Lembre-se de instalar: npm install axios
import { Loader2, AlertCircle, Soup, List, LayoutGrid } from 'lucide-react';
import KitchenFilters from '../components/cozinha/cozinhaFiltros';
import OrderCard from '../components/cozinha/cozinhaOrder';
import { useAuth } from '../hooks/useAuth'; // Para pegar o token, se necessário

const KitchenScreen = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ status: 'PREPARANDO', setor: '', busca: '' });
  const [layout, setLayout] = useState('grid'); // 'grid' ou 'list'
  const { token } = useAuth(); // Supondo que seu hook de autenticação forneça o token

  // Função para buscar os pedidos da API
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(filters).toString();
      const response = await axios.get(`/api/kitchen/orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` } // Adiciona o token se sua API for protegida
      });
      setOrders(response.data);
      setError(null);
    } catch (err) {
      setError('Falha ao buscar os pedidos. Verifique a conexão com o servidor.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters, token]);

  // Busca os pedidos quando a tela carrega ou os filtros mudam
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Efeito para atualização automática a cada 15 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('Atualizando pedidos...');
      fetchOrders();
    }, 15000); // 15 segundos

    return () => clearInterval(interval); // Limpa o intervalo ao desmontar o componente
  }, [fetchOrders]);

  // Função para atualizar o status de um item (será passada para o OrderCard)
  const handleUpdateItemStatus = async (itemId, novoStatus) => {
    try {
      await axios.patch(`/api/kitchen/items/${itemId}`, 
        { novoStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Após atualizar, busca os pedidos novamente para refletir a mudança
      fetchOrders(); 
    } catch (err) {
      console.error('Falha ao atualizar status do item:', err);
      // Opcional: mostrar uma notificação de erro para o usuário
    }
  };

  return (
    <div className="p-4 md:p-6 bg-gray-100 min-h-screen">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div className="flex items-center mb-4 md:mb-0">
          <Soup className="h-8 w-8 text-gray-700 mr-3" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Painel da Cozinha</h1>
            <p className="text-sm text-gray-500">Pedidos em tempo real para preparação.</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={() => setLayout('list')} className={`p-2 rounded-md ${layout === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}><List className="h-5 w-5" /></button>
          <button onClick={() => setLayout('grid')} className={`p-2 rounded-md ${layout === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}><LayoutGrid className="h-5 w-5" /></button>
        </div>
      </div>

      {/* Filtros */}
      <KitchenFilters filters={filters} setFilters={setFilters} />

      {/* Conteúdo Principal */}
      {loading && <div className="flex justify-center items-center mt-16"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>}
      
      {error && !loading && (
        <div className="mt-16 text-center text-red-600 bg-red-100 p-4 rounded-lg flex items-center justify-center">
          <AlertCircle className="h-5 w-5 mr-2" /> {error}
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <div className="mt-16 text-center text-gray-500">
          <p>Nenhum pedido encontrado para os filtros selecionados.</p>
        </div>
      )}

      {!loading && !error && orders.length > 0 && (
        <div className={`mt-6 grid gap-4 ${layout === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
          {orders.map(order => (
            <OrderCard 
              key={order.id} 
              order={order} 
              onUpdateItemStatus={handleUpdateItemStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default KitchenScreen;
