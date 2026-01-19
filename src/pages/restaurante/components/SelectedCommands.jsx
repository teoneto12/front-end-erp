import { Layers } from 'lucide-react';

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);

const SelectedCommands = ({ selectedTables = [] }) => {
  if (!selectedTables.length) return null;

  // 🔥 calcula total geral
  const totalGeral = selectedTables.reduce((acc, table) => {
    const activeItems = (table.items || []).filter(
      (i) => i.status !== 'CANCELADO'
    );

    const subtotal = activeItems.reduce(
      (sum, item) =>
        sum + Number(item.quantity) * Number(item.unit_price),
      0
    );

    return acc + subtotal;
  }, 0);

  return (
    <div className="bg-white rounded-xl border shadow-sm p-4 mt-4">
      {/* HEADER */}
      <header className="flex items-center gap-2 mb-4">
        <Layers className="w-5 h-5 text-blue-500" />
        <h3 className="font-semibold text-slate-800">
          Comandas Selecionadas ({selectedTables.length})
        </h3>
      </header>

      {/* LISTA DE COMANDAS */}
      <div className="space-y-4">
        {selectedTables.map((table) => {
          const activeItems = (table.items || []).filter(
            (i) => i.status !== 'CANCELADO'
          );

          const subtotal = activeItems.reduce(
            (sum, item) =>
              sum + Number(item.quantity) * Number(item.unit_price),
            0
          );

          return (
            <div
              key={table.id}
              className="border rounded-lg p-3 bg-slate-50"
            >
              {/* TÍTULO DA MESA */}
              <h4 className="font-semibold text-slate-700 mb-2">
                {table.name}
                {table.customer_name
                  ? ` — ${table.customer_name}`
                  : ''}
              </h4>

              {/* ITENS */}
              {activeItems.length ? (
                <ul className="text-sm space-y-1 mb-2">
                  {activeItems.map((item) => (
                    <li
                      key={item.id}
                      className="flex justify-between text-slate-600"
                    >
                      <span>
                        {item.quantity}x {item.product_name}
                      </span>
                      <span>
                        {formatCurrency(
                          item.quantity * item.unit_price
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-400">
                  Nenhum item lançado
                </p>
              )}

              {/* TOTAL DA COMANDA */}
              <div className="flex justify-between font-semibold text-slate-800 border-t pt-2 mt-2">
                <span>Total</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* TOTAL GERAL */}
      <div className="mt-4 pt-4 border-t flex justify-between text-lg font-bold text-slate-900">
        <span>Total Geral</span>
        <span>{formatCurrency(totalGeral)}</span>
      </div>
    </div>
  );
};

export default SelectedCommands;
