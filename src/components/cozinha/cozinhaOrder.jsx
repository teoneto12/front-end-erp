// ARQUIVO: src/components/kitchen/OrderCard.jsx

import { useState, useEffect } from 'react';
import { Clock, CheckCircle, PlayCircle } from 'lucide-react';

const OrderCard = ({ order, onUpdateItemStatus }) => {
  const [timeElapsed, setTimeElapsed] = useState('');

  // Efeito para calcular e atualizar o tempo decorrido
  useEffect(() => {
    const calculateTime = () => {
      const startTime = new Date(order.data);
      const now = new Date();
      const diffMs = now - startTime;
      const diffMins = Math.floor(diffMs / 60000);
      const diffSecs = Math.floor((diffMs % 60000) / 1000);
      setTimeElapsed(`${String(diffMins).padStart(2, '0')}:${String(diffSecs).padStart(2, '0')}`);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [order.data]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'PREPARANDO': return 'bg-yellow-500';
      case 'PRONTO': return 'bg-green-500';
      case 'AGUARDANDO_ENTREGA': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-[1.02]">
      {/* Cabeçalho do Card */}
      <div className={`p-3 text-white flex justify-between items-center ${getStatusColor(order.status)}`}>
        <h3 className="font-bold text-lg">Pedido #{order.numero}</h3>
        <div className="flex items-center space-x-2">
          <Clock className="h-5 w-5" />
          <span className="font-mono text-lg">{timeElapsed}</span>
        </div>
      </div>

      {/* Lista de Itens */}
      <ul className="divide-y divide-gray-200 p-3">
        {order.itens.map(item => (
          <li key={item.id} className="py-3 flex justify-between items-center">
            <div>
              <p className="font-semibold text-gray-800">
                <span className="font-bold text-lg mr-2">{item.quantidade}x</span>
                {item.nome}
              </p>
              {item.setor && <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{item.setor}</span>}
            </div>
            
            {/* Botões de Ação */}
            <div className="flex space-x-2">
              {order.status === 'PREPARANDO' && (
                <button 
                  onClick={() => onUpdateItemStatus(item.id, 'PRONTO')}
                  className="p-2 bg-green-100 text-green-700 rounded-full hover:bg-green-200"
                  title="Marcar como Pronto"
                >
                  <CheckCircle className="h-5 w-5" />
                </button>
              )}
               {order.status === 'PRONTO' && (
                <button 
                  onClick={() => onUpdateItemStatus(item.id, 'PREPARANDO')}
                  className="p-2 bg-yellow-100 text-yellow-700 rounded-full hover:bg-yellow-200"
                  title="Voltar para Preparando"
                >
                  <PlayCircle className="h-5 w-5" />
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default OrderCard;
