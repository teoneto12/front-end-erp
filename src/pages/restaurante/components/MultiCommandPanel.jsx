import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Layers } from 'lucide-react';

const SERVICE_RATE = 0.1;

const MultiCommandPanel = ({ selectedTableIds }) => {
  const [commands, setCommands] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedTableIds.length) return;

    const fetchCommands = async () => {
      setLoading(true);
      try {
        const responses = await Promise.all(
          selectedTableIds.map(id =>
            api.get(`/restaurant/tables/${id}`)
          )
        );

        setCommands(responses.map(r => r.data));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCommands();
  }, [selectedTableIds]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        Carregando comandas...
      </div>
    );
  }

  const calculateSubtotal = (items = []) =>
    items.reduce(
      (sum, item) => sum + item.quantity * item.unit_price,
      0
    );

  const totalsByCommand = commands.map(command => {
    const subtotal = calculateSubtotal(command.items);
    const service = subtotal * SERVICE_RATE;
    const total = subtotal + service;

    return {
      ...command,
      subtotal,
      service,
      total,
    };
  });

  const totalGeral = totalsByCommand.reduce(
    (acc, c) => acc + c.total,
    0
  );

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm h-full overflow-y-auto">
      <header className="flex items-center gap-2 mb-4">
        <Layers className="w-5 h-5" />
        <h2 className="text-lg font-bold">
          Comandas Selecionadas ({commands.length})
        </h2>
      </header>

      <div className="space-y-4">
        {totalsByCommand.map(command => (
          <div
            key={command.id}
            className="border rounded-lg p-4"
          >
            <h3 className="font-semibold mb-2">
              {command.name} — {command.customer_name || 'Consumidor'}
            </h3>

            {command.items?.length ? (
              <ul className="space-y-1 text-sm">
                {command.items.map(item => (
                  <li
                    key={item.id}
                    className="flex justify-between"
                  >
                    <span>
                      {item.quantity}x {item.product_name}
                    </span>
                    <span>
                      R$ {(item.quantity * item.unit_price).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400">
                Nenhum item nesta comanda
              </p>
            )}

            <div className="mt-3 pt-2 border-t text-sm space-y-1">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>R$ {command.subtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between">
                <span>Taxa de Serviço (10%)</span>
                <span>R$ {command.service.toFixed(2)}</span>
              </div>

              <div className="flex justify-between font-bold text-base pt-1">
                <span>Total</span>
                <span>R$ {command.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t flex justify-between text-lg font-bold">
        <span>Total Geral</span>
        <span>R$ {totalGeral.toFixed(2)}</span>
      </div>
    </div>
  );
};

export default MultiCommandPanel;
