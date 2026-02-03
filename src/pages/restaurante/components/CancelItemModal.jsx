import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

const CancelItemModal = ({ item, isOpen, onClose, onConfirm }) => {
  const [quantity, setQuantity] = useState(1);

  // 🔥 Resetar a quantidade sempre que o item mudar ou o modal abrir
  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
    }
  }, [item, isOpen]);

  if (!item) return null;

  const handleConfirm = () => {
    if (quantity > 0 && quantity <= item.quantity) {
      onConfirm(item.id, quantity);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancelar Item</DialogTitle>
          <DialogDescription>
            Você está cancelando o item: <strong>{item.product_name}</strong>.<br />
            Quantidade atual: {item.quantity}.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
            Quantidade a cancelar
          </label>
          <Input
            id="quantity"
            type="number"
            min="1"
            max={item.quantity}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            autoFocus
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Fechar</Button>
          <Button onClick={handleConfirm}>Confirmar Cancelamento</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CancelItemModal;
