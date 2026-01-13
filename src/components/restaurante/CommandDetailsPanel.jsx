// ARQUIVO: src/components/restaurant/CommandDetailsPanel.jsx

import { Loader2, ShoppingCart, Percent, User, MessageSquare } from 'lucide-react';

// Função para formatar moeda
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const CommandDetailsPanel = ({ details, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!details) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 rounded-lg p-4 text-center">
        <ShoppingCart className="h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma Comanda Selecionada</h3>
        <p className="mt-1 text-sm text-gray-500">Clique em uma comanda à esquerda para ver os detalhes.</p>
      </div>
    );
  }

  // Cálculos
  const subtotal = details.items.reduce((acc, item) => acc + item.quantity * item.unit_price, 0);
  const serviceFee = subtotal * 0.10; // Exemplo de taxa de 10%
  const total = subtotal + serviceFee;

  return (
    <div className="bg-white h-full rounded-lg shadow-md flex flex-col">
      {/* Cabeçalho */}
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold text-gray-800">Detalhes da Comanda: {details.number}</h2>
        <p className="text-sm text-gray-500">Aberta por: {details.user_who_opened || 'Admin'}</p>
      </div>

      {/* Lista de Itens */}
      <div className="flex-grow p-4 overflow-y-auto">
        <h3 className="font-semibold mb-2">Itens Consumidos</h3>
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
          <p className="text-sm text-gray-400">Nenhum item lançado ainda.</p>
        )}
      </div>

      {/* Rodapé com Totais */}
      <div className="p-4 border-t bg-gray-50 rounded-b-lg">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 flex items-center"><Percent className="w-3 h-3 mr-1"/> Taxa de Serviço (10%)</span>
            <span className="font-medium">{formatCurrency(serviceFee)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-gray-800 pt-2 border-t mt-2">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandDetailsPanel;
