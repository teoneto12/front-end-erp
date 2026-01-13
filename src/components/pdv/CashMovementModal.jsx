import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const CashMovementModal = ({ open, onClose, onConfirm }) => {
  const [type, setType] = useState("in"); // in | out
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    onConfirm({
      type,
      amount: parseFloat(amount),
      reason,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Movimentação de Caixa</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex space-x-3">
            <Button
              variant={type === "in" ? "default" : "outline"}
              onClick={() => setType("in")}
              className="w-full"
            >
              Entrada
            </Button>

            <Button
              variant={type === "out" ? "default" : "outline"}
              onClick={() => setType("out")}
              className="w-full"
            >
              Saída
            </Button>
          </div>

          <Input
            type="number"
            placeholder="Valor"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <Textarea
            rows={3}
            placeholder="Motivo"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={!amount || !reason}>Confirmar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CashMovementModal;
