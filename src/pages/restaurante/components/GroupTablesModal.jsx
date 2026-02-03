import { useState } from "react";
import { Button } from "@/components/ui/button";

const GroupTablesModal = ({ isOpen, onClose, onConfirm }) => {
  const [value, setValue] = useState("");

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!value.trim()) {
      alert("Informe o nome, número ou código da mesa destino.");
      return;
    }
    onConfirm(value.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">

        <h2 className="text-xl font-bold mb-4">
          Agrupar Mesas
        </h2>

        <p className="text-sm text-slate-600 mb-3">
          Informe o <strong>nome, número ou código</strong> da mesa 
          onde deseja agrupar as comandas selecionadas.
        </p>

        <input
          value={value}
          onChange={e => setValue(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
          placeholder="Ex: Mesa 12, 12, M12..."
        />

        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancelar
          </Button>

          <Button
            className="bg-purple-600 text-white"
            onClick={handleConfirm}
          >
            Confirmar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GroupTablesModal;
