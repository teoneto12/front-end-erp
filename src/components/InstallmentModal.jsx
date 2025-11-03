// frontend/src/components/InstallmentModal.jsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Repeat } from 'lucide-react';

const InstallmentModal = ({
  customers,
  selectedCustomerId,
  onConfirm,
  onClose,
  paymentAmount
}) => {
  const [installments, setInstallments] = useState(1);
  const [customerName, setCustomerName] = useState('Carregando...');

  useEffect(() => {
    const customer = customers.find(c => c.id.toString() === selectedCustomerId);
    if (customer) {
      setCustomerName(customer.name);
    } else {
      setCustomerName('Cliente não encontrado');
    }
  }, [customers, selectedCustomerId]);

  const handleConfirm = () => {
    if (!selectedCustomerId || selectedCustomerId === 'none') {
      alert('Ocorreu um erro. Nenhum cliente foi selecionado para o crediário.');
      return;
    }
    onConfirm({ installments });
  };

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val) || 0);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium">Pagamento em Crediário</h3>
        <p className="text-sm text-gray-500">Valor a ser parcelado: <span className="font-bold">{formatCurrency(paymentAmount)}</span></p>
      </div>

      <div>
        <Label className="flex items-center mb-2">
          <User className="w-4 h-4 mr-2" />
          Cliente
        </Label>
        <div className="p-2 border rounded-md bg-gray-100 text-gray-700 font-medium">
          {customerName}
        </div>
        <p className="text-xs text-gray-500 mt-1">O cliente é definido na tela principal da venda.</p>
      </div>

      <div>
        <Label htmlFor="installments-input" className="flex items-center mb-2">
          <Repeat className="w-4 h-4 mr-2" />
          Número de Parcelas
        </Label>
        <Input
          id="installments-input"
          type="number"
          min="1"
          value={installments}
          onChange={(e) => setInstallments(Math.max(1, parseInt(e.target.value, 10) || 1))}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button onClick={handleConfirm}>Confirmar Crediário</Button>
      </div>
    </div>
  );
};

export default InstallmentModal;
