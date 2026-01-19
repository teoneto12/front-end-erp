import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Layers } from 'lucide-react';

const MultiCommandPanel = ({ tables, selectedTableIds }) => {
  // Filtra apenas as comandas selecionadas
  const selectedTables = tables.filter((table) =>
    selectedTableIds.includes(table.id)
  );

  // Calcula o total de uma comanda
  const getTableTotal = (table) => {
    if (!table.items || table.items.length === 0) return 0;

    return table.items.reduce((sum, item) => {
      return sum + item.quantity * item.unitPrice;
    }, 0);
  };

  // Total geral (soma de todas as comandas)
  const grandTotal = selectedTables.reduce((sum, table) => {
    return sum + getTableTotal(table);
  }, 0);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center gap-2">
        <Layers className="h-5 w-5" />
        <CardTitle>
          Comandas Selecionadas ({selectedTables.length})
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 overflow-y-auto max-h-[80vh]">
        {selectedTables.map((table) => {
          const tableTotal = getTableTotal(table);

          return (
            <div
              key={table.id}
              className="border rounded-lg p-4 bg-white space-y-2"
            >
              {/* Cabeçalho da comanda */}
              <div className="font-semibold text-slate-800">
                {table.name}
                {table.customer_name && ` — ${table.customer_name}`}
              </div>

              {/* Itens */}
              {table.items && table.items.length > 0 ? (
                <div className="space-y-1 text-sm">
                  {table.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between text-slate-700"
                    >
                      <span>
                        {item.quantity}x {item.productName}
                      </span>
                      <span>
                        R$ {(item.quantity * item.unitPrice).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">
                  Nenhum item nesta comanda
                </p>
              )}

              {/* Total da comanda */}
              <div className="flex justify-between font-semibold border-t pt-2">
                <span>Total</span>
                <span>R$ {tableTotal.toFixed(2)}</span>
              </div>
            </div>
          );
        })}

        {/* TOTAL GERAL */}
        <div className="border-t pt-4 flex justify-between text-lg font-bold">
          <span>Total Geral</span>
          <span>R$ {grandTotal.toFixed(2)}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default MultiCommandPanel;
