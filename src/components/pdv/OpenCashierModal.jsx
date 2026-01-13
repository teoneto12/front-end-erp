import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const OpenCashierModal = ({ open, onClose, onConfirm }) => {
  const [initialAmount, setInitialAmount] = useState("");

  const handleConfirm = () => {
    onConfirm({
      initialAmount: Number(initialAmount),
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Abrir Caixa</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Input
            type="number"
            placeholder="Valor inicial em caixa"
            value={initialAmount}
            onChange={(e) => setInitialAmount(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={!initialAmount}>
            Confirmar Abertura
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OpenCashierModal;
