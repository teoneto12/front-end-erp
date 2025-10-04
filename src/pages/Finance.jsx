import React, { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

// --- COMPONENTES DE UI (assumindo que existem) ---
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Modal from '@/components/Modal';

// --- FORMULÁRIO DE LANÇAMENTO ATUALIZADO (AccountForm) ---
const AccountForm = ({ account, activeTab, onSave, onCancel, customers }) => {
  // Estado inicial com os novos campos
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    due_date: '',
    type: activeTab,
    status: 'pendente',
    customer_id: '',
    payment_term: 'a_vista',
    installments: 1, // Novo: Número de parcelas
    interest: 0,     // Novo: Juros
    penalty: 0,      // Novo: Multa
    discount: 0,     // Novo: Desconto
  });

  // Efeito para preencher o formulário ao editar um lançamento existente
  useEffect(() => {
    if (account) {
      setFormData({
        description: account.description || '',
        amount: account.amount || '',
        due_date: account.due_date ? new Date(account.due_date).toISOString().slice(0, 10) : '',
        type: account.type || activeTab,
        status: account.status || 'pendente',
        customer_id: account.customer_id?.toString() || '',
        payment_term: account.payment_term || 'a_vista',
        installments: account.installments || 1,
        interest: account.interest || 0,
        penalty: account.penalty || 0,
        discount: account.discount || 0,
      });
    } else {
      // Reseta para um novo formulário
      setFormData({
        description: '', amount: '', due_date: '', type: activeTab, status: 'pendente', customer_id: '',
        payment_term: 'a_vista', installments: 1, interest: 0, penalty: 0, discount: 0,
      });
    }
  }, [account, activeTab]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Converte para número se for um campo numérico
    const parsedValue = ['amount', 'installments', 'interest', 'penalty', 'discount'].includes(name)
      ? parseFloat(value) || 0
      : value;
    setFormData(prev => ({ ...prev, [name]: parsedValue }));
  };
  
  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Envia o formData completo para o backend, que cuidará da lógica de criar as parcelas
    onSave(formData);
  };

  // Calcula o valor final dinamicamente
  const finalAmount = (formData.amount || 0) + (formData.interest || 0) + (formData.penalty || 0) - (formData.discount || 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Campos de Descrição e Cliente (sem alteração) */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
        <Input type="text" name="description" id="description" value={formData.description} onChange={handleChange} required />
      </div>
      <div>
        <label htmlFor="customer_id" className="block text-sm font-medium text-gray-700 mb-1">Cliente (Opcional)</label>
        <Select name="customer_id" value={formData.customer_id} onValueChange={(value) => handleSelectChange('customer_id', value)}>
          <SelectTrigger><SelectValue placeholder="Selecione um cliente" /></SelectTrigger>
          <SelectContent>
            {customers.map(customer => <SelectItem key={customer.id} value={customer.id.toString()}>{customer.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Campos de Valor e Vencimento (sem alteração) */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">Valor Principal</label>
          <Input type="number" name="amount" id="amount" value={formData.amount} onChange={handleChange} required step="0.01" />
        </div>
        <div>
          <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-1">1º Vencimento</label>
          <Input type="date" name="due_date" id="due_date" value={formData.due_date} onChange={handleChange} required />
        </div>
      </div>

      {/* --- NOVOS CAMPOS FINANCEIROS --- */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="discount" className="block text-sm font-medium text-gray-700 mb-1">Desconto (-)</label>
          <Input type="number" name="discount" id="discount" value={formData.discount} onChange={handleChange} step="0.01" />
        </div>
        <div>
          <label htmlFor="penalty" className="block text-sm font-medium text-gray-700 mb-1">Multa (+)</label>
          <Input type="number" name="penalty" id="penalty" value={formData.penalty} onChange={handleChange} step="0.01" />
        </div>
        <div>
          <label htmlFor="interest" className="block text-sm font-medium text-gray-700 mb-1">Juros (+)</label>
          <Input type="number" name="interest" id="interest" value={formData.interest} onChange={handleChange} step="0.01" />
        </div>
      </div>
      
      {/* --- CONDIÇÃO DE PAGAMENTO E PARCELAMENTO --- */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="payment_term" className="block text-sm font-medium text-gray-700 mb-1">Condição</label>
          <Select name="payment_term" value={formData.payment_term} onValueChange={(value) => handleSelectChange('payment_term', value)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="a_vista">À Vista</SelectItem>
              <SelectItem value="a_prazo">A Prazo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {/* O campo de parcelas só aparece se a condição for "A Prazo" */}
        {formData.payment_term === 'a_prazo' && (
          <div>
            <label htmlFor="installments" className="block text-sm font-medium text-gray-700 mb-1">Nº de Parcelas</label>
            <Input type="number" name="installments" id="installments" value={formData.installments} onChange={handleChange} min="1" />
          </div>
        )}
      </div>

      {/* Exibição do valor final calculado */}
      <div className="p-3 bg-gray-100 rounded-md text-right">
        <span className="text-sm font-medium text-gray-600">Valor Total: </span>
        <span className="text-lg font-bold text-gray-900">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(finalAmount)}
        </span>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">Salvar Lançamento</Button>
      </div>
    </form>
  );
};


// --- COMPONENTE PRINCIPAL (Finance) ---
// Nenhuma grande alteração aqui, ele continua orquestrando os dados.
const Finance = () => {
  const [activeTab, setActiveTab] = useState('receitas');
  const [accounts, setAccounts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);

  const fetchAccounts = useCallback(async (type) => {
    setLoading(true);
    try {
      const response = await api.get(`/accounts?type=${type}`);
      setAccounts(response.data.accounts || []);
    } catch (error) {
      console.error("Erro ao carregar lançamentos:", error);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCustomers = useCallback(async () => {
    try {
      const response = await api.get('/customers');
      setCustomers(response.data.customers || []);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
    fetchAccounts(activeTab);
  }, [activeTab, fetchCustomers, fetchAccounts]);

  const handleOpenModal = (account = null) => {
    setEditingAccount(account);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingAccount(null);
  };

  // A função de salvar agora envia os dados mais complexos para o backend
  const handleSaveAccount = async (formData) => {
    try {
      // O backend receberá o formData com { ... , installments: X, interest: Y, ... }
      // e será responsável por criar as N parcelas se installments > 1.
      const method = editingAccount ? 'put' : 'post';
      const url = editingAccount ? `/accounts/${editingAccount.id}` : '/accounts';
      await api[method](url, formData);
      
      handleModalClose();
      fetchAccounts(activeTab);
    } catch (error) {
      console.error("Erro ao salvar lançamento:", error);
      // Adicionar feedback de erro para o usuário aqui (ex: toast)
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 bg-gray-50 min-h-full">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <h2 className="text-3xl font-bold text-gray-800">Financeiro</h2>
        <Button onClick={() => handleOpenModal()}>Novo Lançamento</Button>
      </div>
      
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="px-4">
            <TabsTrigger value="receitas">Contas a Receber</TabsTrigger>
            <TabsTrigger value="despesas">Contas a Pagar</TabsTrigger>
          </TabsList>
        </Tabs>
        <CardContent className="p-0">
          {loading ? (
            <p className="text-center text-gray-500 py-8">Carregando...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimento</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {accounts.length > 0 ? (
                    accounts.map((account) => (
                      <tr key={account.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{account.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(account.amount)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(account.due_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${account.status === 'pago' ? 'bg-green-100 text-green-800' : (account.status === 'atrasado' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800')}`}>
                            {account.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button variant="ghost" onClick={() => handleOpenModal(account)}>Editar</Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-sm text-gray-500">
                        Nenhum lançamento encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {isModalOpen && (
        <Modal open={isModalOpen} onClose={handleModalClose} title={editingAccount ? 'Editar Lançamento' : 'Novo Lançamento'}>
          <AccountForm
            account={editingAccount}
            activeTab={activeTab}
            onSave={handleSaveAccount}
            onCancel={handleModalClose}
            customers={customers}
          />
        </Modal>
      )}
    </div>
  );
};

export default Finance;
