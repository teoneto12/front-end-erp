// frontend/src/components/PaymentModal.jsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from '@/components/ui/separator';
import { Trash2, Plus, Gift, Banknote, CreditCard, Smartphone, Calculator, User } from 'lucide-react';

const PaymentModal = ({
  totalAmount,
  payments,
  setPayments,
  customers,
  selectedCustomerId,
  customerCredit,
  setCustomerCredit,
  paymentMethods,
  onFinalize,
  submitting,
  onSelectInstallmentPayment
}) => {
  const [currentMethodId, setCurrentMethodId] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [customerName, setCustomerName] = useState('Nenhum (Consumidor Final)');

  useEffect(() => {
    if (selectedCustomerId && selectedCustomerId !== 'none') {
      const customer = customers.find(c => c.id.toString() === selectedCustomerId);
      setCustomerName(customer ? customer.name : 'Cliente não encontrado');
    } else {
      setCustomerName('Nenhum (Consumidor Final)');
    }
  }, [selectedCustomerId, customers]);

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val) || 0);

  const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);
  const remainingToPay = totalAmount - totalPaid;
  const changeDue = Math.max(0, totalPaid - totalAmount);

  const getPaymentMethodIcon = (methodName) => {
    const name = methodName?.toLowerCase() || '';
    if (name.includes('dinheiro')) return <Banknote className="w-4 h-4" />;
    if (name.includes('débito')) return <CreditCard className="w-4 h-4" />;
    if (name.includes('crédito') || name.includes('crediário')) return <CreditCard className="w-4 h-4" />;
    if (name.includes('pix')) return <Smartphone className="w-4 h-4" />;
    if (name.includes('voucher')) return <Gift className="w-4 h-4 text-blue-600" />;
    return <Banknote className="w-4 h-4" />;
  };

  const handleAddPayment = () => {
    const amount = parseFloat(currentAmount) || remainingToPay;
    if (!currentMethodId) return alert("Selecione uma forma de pagamento.");
    if (amount <= 0) return alert("Insira um valor válido.");

    const method = paymentMethods.find(m => m.id.toString() === currentMethodId);

    if (method.type === 'credito_loja') {
      if (!selectedCustomerId || selectedCustomerId === 'none') {
        alert("Para usar 'Crédito Loja', primeiro indique um cliente na tela principal da venda.");
        return;
      }
      onSelectInstallmentPayment({ method, amount });
      setCurrentAmount('');
      return;
    }

    setPayments(prev => [...prev, { payment_method_id: method.id, name: method.name, amount, type: method.type }]);
    setCurrentAmount('');
  };

  const handleUseCredit = () => {
    if (customerCredit <= 0 || remainingToPay <= 0) return;
    const voucherMethod = paymentMethods.find(m => m.type === 'voucher');
    if (!voucherMethod) return alert('Forma de pagamento "Voucher" não configurada.');
    
    const amountToUse = Math.min(customerCredit, remainingToPay);
    setPayments(prev => [...prev, { payment_method_id: voucherMethod.id, name: voucherMethod.name, amount: amountToUse, type: voucherMethod.type }]);
    setCustomerCredit(prev => prev - amountToUse);
  };

  const handleRemovePayment = (indexToRemove) => {
    const paymentToRemove = payments[indexToRemove];
    if (paymentToRemove.type === 'voucher') {
      setCustomerCredit(prev => prev + paymentToRemove.amount);
    }
    setPayments(payments.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="flex flex-col h-[85vh]">
      <div className="p-4 border-b">
        <h3 className="text-lg font-medium text-center">Pagamento</h3>
      </div>

      <div className="flex-grow p-4 space-y-4 overflow-y-auto">
        <div className="p-3 border rounded-lg bg-gray-50">
          <p className="text-sm font-medium text-gray-600 flex items-center"><User className="w-4 h-4 mr-2"/>Cliente</p>
          <p className="text-lg font-semibold">{customerName}</p>
        </div>

        {selectedCustomerId !== 'none' && customerCredit > 0 && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-blue-800">Crédito disponível:</p>
              <p className="text-xl font-bold text-blue-600">{formatCurrency(customerCredit)}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleUseCredit} disabled={remainingToPay <= 0} className="bg-white border-blue-500 text-blue-600 hover:bg-blue-50">
              <Gift className="w-4 h-4 mr-2" /> Usar Crédito
            </Button>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">Adicionar Pagamento</label>
          <div className="flex items-center space-x-2">
            <Select value={currentMethodId} onValueChange={setCurrentMethodId}>
              <SelectTrigger><SelectValue placeholder="Forma de Pagamento" /></SelectTrigger>
              <SelectContent>{paymentMethods.filter(m => m.show_in_pdv).map(m => (<SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>))}</SelectContent>
            </Select>
            <Input className="w-32 text-right" type="number" placeholder="Valor" value={currentAmount} onChange={(e) => setCurrentAmount(e.target.value)} />
            <Button onClick={handleAddPayment}><Plus className="w-4 h-4" /></Button>
          </div>
        </div>

        <div className="space-y-2">
          {payments.map((p, index) => (
            <div key={index} className="flex justify-between items-center p-2 bg-gray-100 rounded-md text-sm">
              <div className="flex items-center">{getPaymentMethodIcon(p.name)}<span className="ml-2 capitalize">{p.name}{p.installments && ` (${p.installments}x)`}</span></div>
              <div className="flex items-center">
                <span className="font-semibold">{formatCurrency(p.amount)}</span>
                <Button size="icon" variant="ghost" className="h-6 w-6 ml-2" onClick={() => handleRemovePayment(index)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 border-t mt-auto bg-gray-50">
        <div className="space-y-2 mb-4 p-3 bg-white rounded border">
          <div className="flex justify-between font-bold text-2xl"><span>Total a Pagar:</span><span>{formatCurrency(totalAmount)}</span></div>
          <Separator />
          <div className="flex justify-between text-md text-blue-600"><span>Total Pago:</span><span>{formatCurrency(totalPaid)}</span></div>
          {remainingToPay > 0 ? (
            <div className="flex justify-between text-md font-bold text-orange-600"><span>Restante:</span><span>{formatCurrency(remainingToPay)}</span></div>
          ) : (
            <div className="flex justify-between text-md font-bold text-green-600"><span>Troco:</span><span>{formatCurrency(changeDue)}</span></div>
          )}
        </div>
        <Button onClick={onFinalize} disabled={submitting || remainingToPay > 0.01} className="w-full bg-green-600 h-16 text-lg">
          <Calculator className="w-5 h-5 mr-2" />
          {submitting ? 'Finalizando...' : 'Finalizar Venda'}
        </Button>
      </div>
    </div>
  );
};

export default PaymentModal;
