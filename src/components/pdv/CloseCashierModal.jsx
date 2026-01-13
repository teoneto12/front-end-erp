import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const CloseCashierModal = ({ open, onClose, onConfirm, totals }) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Fechar Caixa</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <p><strong>Total em vendas:</strong> {totals?.sales || "R$ 0,00"}</p>
          <p><strong>Entradas:</strong> {totals?.entries || "R$ 0,00"}</p>
          <p><strong>Saídas:</strong> {totals?.exits || "R$ 0,00"}</p>
          <p><strong>Saldo final:</strong> {totals?.balance || "R$ 0,00"}</p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="destructive" onClick={onConfirm}>Confirmar Fechamento</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CloseCashierModal;
