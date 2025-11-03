// frontend/src/components/DiscountModal.jsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Percent, DollarSign } from 'lucide-react';

const DiscountModal = ({ subtotal, currentDiscount, onApply, onClose }) => {
  const [type, setType] = useState(currentDiscount.type || 'percent');
  const [value, setValue] = useState(currentDiscount.value || 0);

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val) || 0);

  const calculatedDiscount = type === 'percent'
    ? (subtotal * (value / 100))
    : Math.min(value, subtotal);

  const handleApply = () => {
    onApply({ type, value: parseFloat(value) || 0 });
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-medium">Aplicar Desconto</h3>
        <p className="text-sm text-gray-500">Subtotal da Venda: {formatCurrency(subtotal)}</p>
      </div>
      <Separator />
      <div className="flex justify-center gap-2">
        <Button variant={type === 'percent' ? 'default' : 'outline'} onClick={() => setType('percent')}><Percent className="w-4 h-4 mr-2" />Porcentagem (%)</Button>
        <Button variant={type === 'value' ? 'default' : 'outline'} onClick={() => setType('value')}><DollarSign className="w-4 h-4 mr-2" />Valor Fixo (R$)</Button>
      </div>
      <div>
        <Label htmlFor="discount-value">{type === 'percent' ? 'Porcentagem de Desconto' : 'Valor do Desconto'}</Label>
        <Input
          id="discount-value"
          type="number"
          step="0.01"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
        />
      </div>
      <div className="p-3 bg-gray-100 rounded-md text-center">
        <p className="text-sm">Valor do Desconto a ser Aplicado:</p>
        <p className="text-xl font-bold text-red-600">-{formatCurrency(calculatedDiscount)}</p>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button onClick={handleApply}>Aplicar Desconto</Button>
      </div>
    </div>
  );
};

export default DiscountModal;
