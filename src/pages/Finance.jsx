import React, { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

// --- COMPONENTES DE UI ---
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Modal from '@/components/Modal';
import { DollarSign, Edit } from 'lucide-react';

// --- FORMULÁRIO DE CRIAÇÃO/EDIÇÃO (AccountForm) ---
// Este componente não precisa de alterações.
const AccountForm = ({ account, activeTab, onSave, onCancel, customers }) => {
  const [formData, setFormData] = useState({
    description: '', amount: '', due_date: '', type: activeTab, status: 'pendente', customer_id: '',
    payment_term: 'a_vista', installments: 1, interest: 0, penalty: 0, discount: 0,
  });

  useEffect(() => {
    if (account) {
      setFormData({
        description: account.description || '', amount: account.amount || '',
        due_date: account.due_date ? new Date(account.due_date).toISOString().slice(0, 10) : '',
        type: account.type || activeTab, status: account.status || 'pendente',
        customer_id: account.customer_id?.toString() || '', payment_term: account.payment_term || 'a_vista',
        installments: account.installments || 1, interest: account.interest || 0,
        penalty: account.penalty || 0, discount: account.discount || 0,
      });
    } else {
      setFormData({
        description: '', amount: '', due_date: '', type: activeTab, status: 'pendente', customer_id: '',
        payment_term: 'a_vista', installments: 1, interest: 0, penalty: 0, discount: 0,
      });
    }
  }, [account, activeTab]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const parsedValue = ['amount', 'installments', 'interest', 'penalty', 'discount'].includes(name) ? parseFloat(value) || 0 : value;
    setFormData(prev => ({ ...prev, [name]: parsedValue }));
  };
  
  const handleSelectChange = (name, value) => setFormData(prev => ({ ...prev, [name]: value }));
  const handleSubmit = (e) => { e.preventDefault(); onSave(formData); };
  const finalAmount = (formData.amount || 0) + (formData.interest || 0) + (formData.penalty || 0) - (formData.discount || 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div><label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label><Input name="description" value={formData.description} onChange={handleChange} required /></div>
      <div><label className="block text-sm font-medium text-gray-700 mb-1">Cliente (Opcional)</label><Select name="customer_id" value={formData.customer_id} onValueChange={(v) => handleSelectChange('customer_id', v)}><SelectTrigger><SelectValue placeholder="Selecione um cliente" /></SelectTrigger><SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}</SelectContent></Select></div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Valor Principal</label><Input type="number" name="amount" value={formData.amount} onChange={handleChange} required step="0.01" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">1º Vencimento</label><Input type="date" name="due_date" value={formData.due_date} onChange={handleChange} required /></div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Desconto (-)</label><Input type="number" name="discount" value={formData.discount} onChange={handleChange} step="0.01" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Multa (+)</label><Input type="number" name="penalty" value={formData.penalty} onChange={handleChange} step="0.01" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Juros (+)</label><Input type="number" name="interest" value={formData.interest} onChange={handleChange} step="0.01" /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Condição</label><Select name="payment_term" value={formData.payment_term} onValueChange={(v) => handleSelectChange('payment_term', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="a_vista">À Vista</SelectItem><SelectItem value="a_prazo">A Prazo</SelectItem></SelectContent></Select></div>
        {formData.payment_term === 'a_prazo' && (<div><label className="block text-sm font-medium text-gray-700 mb-1">Nº de Parcelas</label><Input type="number" name="installments" value={formData.installments} onChange={handleChange} min="1" /></div>)}
      </div>
      <div className="p-3 bg-gray-100 rounded-md text-right"><span className="text-sm font-medium text-gray-600">Valor Total: </span><span className="text-lg font-bold text-gray-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(finalAmount)}</span></div>
      <div className="flex justify-end space-x-3 pt-4"><Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button><Button type="submit">Salvar</Button></div>
    </form>
  );
};

// --- MODAL DE LIQUIDAÇÃO ---
// Este componente não precisa de alterações.
const SettleAccountModal = ({ account, paymentMethods, onSettle, onCancel }) => {
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethodId, setPaymentMethodId] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!paymentMethodId) { alert('Por favor, selecione uma forma de pagamento.'); return; }
    onSettle({ payment_date: paymentDate, payment_method_id: paymentMethodId, paid_amount: account.amount });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="text-sm text-gray-600">Lançamento: <span className="font-medium text-gray-900">{account.description}</span></p>
        <p className="text-lg font-bold text-blue-600">Valor: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(account.amount)}</p>
      </div>
      <hr/>
      <div>
        <label htmlFor="payment_date" className="block text-sm font-medium text-gray-700 mb-1">Data do Pagamento/Recebimento</label>
        <Input type="date" id="payment_date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} required />
      </div>
      <div>
        <label htmlFor="payment_method_id" className="block text-sm font-medium text-gray-700 mb-1">Forma de Pagamento</label>
        <Select value={paymentMethodId} onValueChange={setPaymentMethodId} required>
          <SelectTrigger><SelectValue placeholder="Selecione como foi pago/recebido" /></SelectTrigger>
          <SelectContent>
            {paymentMethods.map(method => <SelectItem key={method.id} value={method.id.toString()}>{method.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">Confirmar Liquidação</Button>
      </div>
    </form>
  );
};

// --- COMPONENTE PRINCIPAL (Finance) ---
const Finance = () => {
  // ==================================================================
  // CORREÇÃO APLICADA AQUI: Valores no singular para corresponder ao BD
  // ==================================================================
  const [activeTab, setActiveTab] = useState('receita');

  const [accounts, setAccounts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [settlingAccount, setSettlingAccount] = useState(null);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [customersRes, accountsRes, paymentMethodsRes] = await Promise.all([
        api.get('/customers'),
        api.get(`/accounts?type=${activeTab}`),
        api.get('/payment-methods', { params: { 
          show_in_accounts_receivable: activeTab === 'receita' ? true : undefined,
          show_in_accounts_payable: activeTab === 'despesa' ? true : undefined,
        }})
      ]);
      setCustomers(customersRes.data.customers || []);
      setAccounts(accountsRes.data.accounts || []);
      setPaymentMethods(paymentMethodsRes.data.paymentMethods || []);
    } catch (error) {
      console.error("Erro ao carregar dados financeiros:", error);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);

  const handleOpenCreateModal = (account = null) => { setEditingAccount(account); setIsCreateModalOpen(true); };
  const handleCloseCreateModal = () => { setEditingAccount(null); setIsCreateModalOpen(false); };
  const handleOpenSettleModal = (account) => { setSettlingAccount(account); setIsSettleModalOpen(true); };
  const handleCloseSettleModal = () => { setSettlingAccount(null); setIsSettleModalOpen(false); };

  const handleSaveAccount = async (formData) => {
    try {
      const method = editingAccount ? 'put' : 'post';
      const url = editingAccount ? `/accounts/${editingAccount.id}` : '/accounts';
      await api[method](url, formData);
      handleCloseCreateModal();
      fetchAllData();
    } catch (error) { console.error("Erro ao salvar lançamento:", error); }
  };

  const handleSettleAccount = async (settleData) => {
    if (!settlingAccount) return;
    try {
      await api.post(`/accounts/${settlingAccount.id}/settle`, settleData);
      handleCloseSettleModal();
      fetchAllData();
    } catch (error) { console.error("Erro ao liquidar lançamento:", error); }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 bg-gray-50 min-h-full">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">Financeiro</h2>
        <Button onClick={() => handleOpenCreateModal()}>Novo Lançamento</Button>
      </div>
      
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="px-4">
            {/* CORREÇÃO APLICADA AQUI: Valores no singular */}
            <TabsTrigger value="receita">Contas a Receber</TabsTrigger>
            <TabsTrigger value="despesa">Contas a Pagar</TabsTrigger>
          </TabsList>
        </Tabs>
        <CardContent className="p-0">
          {loading ? <p className="text-center py-8">Carregando...</p> : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vencimento</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {accounts.map((account) => (
                    <tr key={account.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{account.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(account.amount)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(account.due_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${account.status === 'pago' ? 'bg-green-100 text-green-800' : (account.status === 'atrasado' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800')}`}>{account.status}</span></td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {account.status !== 'pago' && (<Button variant="ghost" size="icon" title="Liquidar Conta" onClick={() => handleOpenSettleModal(account)}><DollarSign className="h-4 w-4 text-green-600" /></Button>)}
                        <Button variant="ghost" size="icon" title="Editar Lançamento" onClick={() => handleOpenCreateModal(account)}><Edit className="h-4 w-4" /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {isCreateModalOpen && (<Modal open={isCreateModalOpen} onClose={handleCloseCreateModal} title={editingAccount ? 'Editar Lançamento' : 'Novo Lançamento'}><AccountForm account={editingAccount} activeTab={activeTab} onSave={handleSaveAccount} onCancel={handleCloseCreateModal} customers={customers} /></Modal>)}
      {isSettleModalOpen && settlingAccount && (<Modal open={isSettleModalOpen} onClose={handleCloseSettleModal} title={`Liquidar ${activeTab === 'receita' ? 'Conta a Receber' : 'Conta a Pagar'}`}><SettleAccountModal account={settlingAccount} paymentMethods={paymentMethods} onSettle={handleSettleAccount} onCancel={handleCloseSettleModal} /></Modal>)}
    </div>
  );
};

export default Finance;
