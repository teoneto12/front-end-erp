import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2, ArrowRightLeft } from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function TransferAllItemsModal({ open, onOpenChange, sourceCommandId }) {
  const [items, setItems] = useState([]);
  const [tables, setTables] = useState([]);
  const [targetTableId, setTargetTableId] = useState("");
  const [loading, setLoading] = useState(false);

  // Carregar itens da mesa atual
  useEffect(() => {
    if (!sourceCommandId) return;

    const load = async () => {
      try {
        const { data } = await api.get(`/restaurant/tables/${sourceCommandId}`);
        setItems(data.items || []);
      } catch {
        toast.error("Erro ao carregar itens da comanda.");
      }
    };

    load();
  }, [sourceCommandId]);

  // Listar mesas ocupadas (NÃO bloqueadas)
  useEffect(() => {
    const loadTables = async () => {
      try {
        const { data } = await api.get("/restaurant/tables");

        const filtered = data.filter(
          (t) =>
            t.id !== sourceCommandId &&         // não mostrar a mesa atual
            t.status === "OCUPADA" &&           // somente mesas ativas
            !t.isBlocked                         // não bloqueadas
        );

        setTables(filtered);
      } catch {
        toast.error("Erro ao carregar mesas.");
      }
    };

    loadTables();
  }, [sourceCommandId]);

  const handleTransfer = async () => {
    if (!targetTableId) {
      toast.error("Selecione uma mesa de destino.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/restaurant/tables/transfer-all-items", {
        sourceTableId: sourceCommandId,
        targetTableId,
      });

      toast.success("Itens transferidos com sucesso!");
      onOpenChange(false);
    } catch {
      toast.error("Erro ao transferir itens.");
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Transferir Todos os Itens</DialogTitle>
          <DialogDescription>
            Selecione a mesa de destino para mover todos os itens desta comanda.
          </DialogDescription>
        </DialogHeader>

        <Separator className="my-3" />

        {/* Listagem dos itens */}
        <div className="max-h-[250px] overflow-auto space-y-3">
          {items.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum item encontrado.</p>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="border rounded-md p-3 bg-slate-100 flex flex-col"
              >
                <span className="font-medium">{item.product_name}</span>
                <span className="text-sm text-slate-600">
                  Quantidade: {item.quantity}
                </span>
                {item.note && (
                  <span className="text-xs text-slate-500">Obs: {item.note}</span>
                )}
              </div>
            ))
          )}
        </div>

        {/* Seleção da mesa destino */}
        <div className="mt-4">
          <label className="text-sm font-medium">Mesa de Destino</label>
          <Select value={targetTableId} onValueChange={setTargetTableId}>
            <SelectTrigger className="w-full mt-1">
              <SelectValue placeholder="Selecione a mesa..." />
            </SelectTrigger>
            <SelectContent>
              {tables.length > 0 ? (
                tables.map((table) => (
                  <SelectItem key={table.id} value={table.id.toString()}>
                    {table.name || `Mesa ${table.id}`}
                  </SelectItem>
                ))
              ) : (
                <div className="p-4 text-center text-sm text-slate-500">
                  Nenhuma mesa disponível.
                </div>
              )}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>

          <Button onClick={handleTransfer} disabled={loading || !targetTableId}>
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <ArrowRightLeft className="w-4 h-4 mr-2" />
            )}
            Transferir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
