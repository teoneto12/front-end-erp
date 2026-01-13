import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, FileText } from "lucide-react";

const ReceiptOptionsModal = ({ open, onClose, transaction, change, onPrint, onPDF }) => {
  
  const formatCurrency = (value) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(value) || 0);

  if (!transaction) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md space-y-4">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Venda #{transaction.sale_number} finalizada!
          </DialogTitle>
        </DialogHeader>

        {change > 0 && (
          <div className="text-center text-2xl font-bold text-green-600 bg-green-50 p-3 rounded-lg">
            Troco: {formatCurrency(change)}
          </div>
        )}

        <p className="text-center text-gray-600 pt-2">
          Como deseja gerar o comprovante?
        </p>

        <div className="flex justify-center gap-4 pt-2">
          <Button onClick={onPrint} className="bg-blue-600 hover:bg-blue-700">
            <Printer className="w-4 h-4 mr-2" />
            Imprimir Cupom
          </Button>

          <Button variant="outline" onClick={onPDF}>
            <FileText className="w-4 h-4 mr-2" />
            Gerar PDF
          </Button>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="w-full">
            Fechar (ESC)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReceiptOptionsModal;
