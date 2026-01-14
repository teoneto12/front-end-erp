// src/pages/restaurant/components/NewCommandDialog.jsx

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const NewCommandDialog = ({ isOpen, onOpenChange, onCreate }) => {
  const [name, setName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setIsCreating(true);
    try {
      await onCreate(name);
      setName('');
      onOpenChange(false);
    } catch (err) {
      alert('Erro ao criar comanda: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Abrir Nova Comanda</DialogTitle>
          <DialogDescription>Digite um nome ou número para identificar esta comanda (ex: "Mesa 10", "Balcão").</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="command-name" className="text-right">Nome</Label>
            <Input
              id="command-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              maxLength={24}
              autoFocus
              onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleCreate} disabled={isCreating || !name.trim()}>
            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar e Abrir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewCommandDialog;
