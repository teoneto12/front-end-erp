// src/pages/restaurant/components/TransferItemModal.jsx

import { useState, useEffect } from 'react';
// ATUALIZADO: Importa os componentes do Dialog do shadcn/ui
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowRightLeft } from 'lucide-react';

const TransferItemModal = ({ item, allTables, isOpen, onClose, onConfirm }) => {
  const [quantity, setQuantity] = useState(1);
  const [destinationTableId, setDestinationTableId] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setDestinationTableId('');
    }
  }, [isOpen]);

  if (!item) return null;

  const handleConfirm = async () => {
    if (!destinationTableId) {
      alert('Por favor, selecione uma comanda de destino.');
      return;
    }
    setIsTransferring(true);
    // Passa o sourceItemId, que é o ID do item da tabela (table_items.id)
    await onConfirm(item.id, destinationTableId, quantity);
    setIsTransferring(false);
  };

  const destinationOptions = allTables.filter(table => table.id !== item.table_id && table.status === 'OCUPADA');

  // ATUALIZADO: Usa a estrutura do Dialog do shadcn/ui
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Transferir Item</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="p-3 bg-slate-100 rounded-md border">
            <p className="font-semibold">{item.product_name}</p>
            <p className="text-sm text-slate-600">Quantidade disponível: {item.quantity}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantidade a Transferir</Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Math.min(item.quantity, Number(e.target.value))))}
              min="1"
              max={item.quantity}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="destination">Transferir Para a Comanda</Label>
            <Select value={destinationTableId} onValueChange={setDestinationTableId}>
              <SelectTrigger id="destination">
                <SelectValue placeholder="Selecione a comanda de destino..." />
              </SelectTrigger>
              <SelectContent>
                {destinationOptions.length > 0 ? (
                  destinationOptions.map(table => (
                    <SelectItem key={table.id} value={table.id.toString()}>
                      {table.name}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-slate-500">Nenhuma outra comanda ativa encontrada.</div>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isTransferring}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isTransferring || !destinationTableId}>
            {isTransferring ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ArrowRightLeft className="w-4 h-4 mr-2" />}
            Confirmar Transferência
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TransferItemModal;
