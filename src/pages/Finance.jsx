// frontend/src/pages/Finance.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../lib/api';

// --- COMPONENTES DE UI ---
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, Edit, Loader2, Search, Undo2, Ban } from 'lucide-react';
import { Label } from '@/components/ui/label';
import Pagination from '../components/Pagination';
import Modal from '@/components/Modal';

// ==================================================================
// FORMULÁRIO DE CRIAÇÃO/EDIÇÃO DE CONTA
// ==================================================================
const AccountForm = ({ account, activeTab, onSave, onCancel, customerList, supplierList }) => {
  const [launchType, setLaunchType] = useState('unico');
  
  const [formData, setFormData] = useState({
    description: account?.description || '',
    amount: account?.amount || '',
    due_date: account?.due_date ? new Date(account.due_date).toISOString().split('T')[0] : '',
    customer_id: account?.customer_id ? String(account.customer_id) : '',
    supplier_id: account?.supplier_id ? String(account.supplier_id) : '',
    type: activeTab,
    installments: 2,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...formData, launch_type: launchType });
  };

  const isEditing = !!account;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!isEditing && (
        <div>
          <Label>Tipo de Lançamento</Label>
          <Select value={launchType} onValueChange={setLaunchType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="unico">Lançamento Único</SelectItem>
              <SelectItem value="parcelado">Lançamento Parcelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Descrição</Label>
          <Input name="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required />
        </div>
        {launchType === 'parcelado' && !isEditing && (
          <div>
            <Label>Nº de Parcelas</Label>
            <Input type="number" min="2" value={formData.installments} onChange={(e) => setFormData({ ...formData, installments: parseInt(e.target.value, 10) || 2 })} />
          </div>
        )}
      </div>

      {activeTab === 'receita' && (
        <div>
          <Label>Cliente</Label>
          <Select value={formData.customer_id} onValueChange={(value) => setFormData({ ...formData, customer_id: value })}>
            <SelectTrigger><SelectValue placeholder="Selecione um cliente (opcional)" /></SelectTrigger>
            <SelectContent>
              {customerList.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
      
      {activeTab === 'despesa' && (
        <div>
          <Label>Fornecedor</Label>
          <Select value={formData.supplier_id} onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}>
            <SelectTrigger><SelectValue placeholder="Selecione um fornecedor (opcional)" /></SelectTrigger>
            <SelectContent>
              {supplierList.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Valor {launchType === 'parcelado' ? 'Total' : ''}</Label>
          <Input type="number" name="amount" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
        </div>
        <div>
          <Label>Data de Vencimento {launchType === 'parcelado' ? '(1ª Parcela)' : ''}</Label>
          <Input type="date" name="due_date" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} required />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">{isEditing ? 'Atualizar' : 'Salvar'}</Button>
      </div>
    </form>
  );
};

// ==================================================================
// MODAL DE LIQUIDAÇÃO DE CONTA
// ==================================================================
const SettleAccountModal = ({ account, paymentMethods, onSettle, onCancel }) => {
  const [settleData, setSettleData] = useState({
    payment_method_id: paymentMethods[0]?.id ? String(paymentMethods[0].id) : '',
    paid_amount: account?.amount || '',
    payment_date: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSettle(settleData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p>Liquidando conta: <strong>{account.description}</strong></p>
      <p>Valor: <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(account.amount)}</strong></p>
      
      <div>
        <Label>Forma de Pagamento</Label>
        <Select value={settleData.payment_method_id} onValueChange={(value) => setSettleData({ ...settleData, payment_method_id: value })} required>
          <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
          <SelectContent>
            {paymentMethods.map(pm => <SelectItem key={pm.id} value={String(pm.id)}>{pm.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Data do Pagamento</Label>
        <Input type="date" value={settleData.payment_date} onChange={(e) => setSettleData({ ...settleData, payment_date: e.target.value })} required />
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">Liquidar Conta</Button>
      </div>
    </form>
  );
};

// ==================================================================
// COMPONENTE PRINCIPAL (Finance)
// ==================================================================
const Finance = () => {
  const [activeTab, setActiveTab] = useState('receita');
  const [accounts, setAccounts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [allPartners, setAllPartners] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [settlingAccount, setSettlingAccount] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    due_start_date: '',
    due_end_date: '',
    emission_start_date: '',
    emission_end_date: '',
    partner_id: '',
  });

  const customerList = useMemo(() => 
    allPartners.filter(p => p.type === 'cliente' || p.type === 'ambos'), 
    [allPartners]
  );
  const supplierList = useMemo(() => 
    allPartners.filter(p => p.type === 'fornecedor' || p.type === 'ambos'), 
    [allPartners]
  );

  // ▼▼▼ CORREÇÃO APLICADA AQUI ▼▼▼
  // A função de busca agora está envolvida em useCallback com as dependências corretas.
  const fetchAllData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 10, type: activeTab };
      
      // Construção dos parâmetros de forma segura
      if (filters.search) params.search = filters.search;
      if (filters.status && filters.status !== 'all') params.status = filters.status;
      if (filters.due_start_date) params.due_start_date = filters.due_start_date;
      if (filters.due_end_date) params.due_end_date = filters.due_end_date;
      if (filters.emission_start_date) params.emission_start_date = filters.emission_start_date;
      if (filters.emission_end_date) params.emission_end_date = filters.emission_end_date;
      
      const partnerId = parseInt(filters.partner_id, 10);
      if (!isNaN(partnerId) && partnerId > 0) {
        if (activeTab === 'receita') params.customer_id = partnerId;
        if (activeTab === 'despesa') params.supplier_id = partnerId;
      }

      const accountsRes = await api.get('/accounts', { params });
      setAccounts(accountsRes.data.accounts || []);
      setPagination(accountsRes.data.pagination || null);

      // Otimização: busca parceiros e métodos de pagamento apenas uma vez.
      if (allPartners.length === 0) {
        const partnersRes = await api.get('/customers');
        setAllPartners(partnersRes.data.customers || []);
      }
      if (paymentMethods.length === 0) {
        const paymentMethodsRes = await api.get('/payment-methods');
        setPaymentMethods(paymentMethodsRes.data.paymentMethods || []);
      }

    } catch (error) {
      console.error("Erro ao carregar dados financeiros:", error);
    } finally {
      setLoading(false);
    }
    // A dependência do objeto 'filters' garante que a função seja recriada com os valores mais recentes.
  }, [activeTab, filters, allPartners.length, paymentMethods.length]);

  // Este useEffect agora dispara a busca sempre que os filtros ou a aba mudam.
  useEffect(() => {
    fetchAllData(1);
  }, [fetchAllData]); // A dependência é a própria função 'fetchAllData'

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectFilterChange = (name, value) => {
    // Se o valor for vazio, remove a propriedade do filtro para limpar a seleção
    if (value === "") {
        const { [name]: _, ...rest } = filters;
        setFilters({ ...rest, partner_id: '' });
    } else {
        setFilters(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Limpa o filtro de parceiro ao trocar de aba para evitar inconsistências
    setFilters(prev => ({ ...prev, partner_id: '' }));
  };

  // A paginação agora chama a função de busca diretamente.
  const handlePageChange = (newPage) => {
    fetchAllData(newPage);
  };

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
      fetchAllData(pagination?.page || 1);
    } catch (error) { 
      console.error("Erro ao salvar lançamento:", error);
      alert(`Erro ao salvar: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleSettleAccount = async (settleData) => {
    if (!settlingAccount) return;
    try {
      await api.post(`/accounts/${settlingAccount.id}/settle`, settleData);
      handleCloseSettleModal();
      fetchAllData(pagination?.page || 1);
    } catch (error) {
      console.error("Erro ao liquidar lançamento:", error);
      alert(`Erro ao liquidar: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleReverseSettlement = async (accountId) => {
    if (!window.confirm("Tem certeza que deseja estornar este lançamento?")) return;
    try {
      await api.post(`/accounts/${accountId}/reverse`);
      fetchAllData(pagination?.page || 1);
    } catch (error) {
      console.error("Erro ao estornar lançamento:", error);
      alert(`Erro ao estornar: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleCancelAccount = async (accountId) => {
    if (!window.confirm("Tem certeza que deseja cancelar este lançamento?")) return;
    try {
      await api.post(`/accounts/${accountId}/cancel`);
      fetchAllData(pagination?.page || 1);
    } catch (error) {
      console.error("Erro ao cancelar lançamento:", error);
      alert(`Erro ao cancelar: ${error.response?.data?.error || error.message}`);
    }
  };

  const partnerListForFilter = activeTab === 'receita' ? customerList : supplierList;

  return (
    <div className="p-4 md:p-6 space-y-6 bg-gray-50 min-h-full">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Financeiro</h2>
          <p className="text-gray-600">Gerencie suas contas a pagar e a receber.</p>
        </div>
        <Button onClick={() => handleOpenCreateModal()}>Novo Lançamento</Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <div className="flex flex-col gap-4 pt-4">
            <div className="flex flex-wrap items-center gap-2">
              <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList>
                  <TabsTrigger value="receita">Contas a Receber</TabsTrigger>
                  <TabsTrigger value="despesa">Contas a Pagar</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="relative flex-grow sm:flex-grow-0">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input placeholder="Buscar..." name="search" value={filters.search} onChange={handleFilterChange} className="pl-10" />
              </div>
              
              <Select value={filters.partner_id} onValueChange={(value) => handleSelectFilterChange('partner_id', value)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder={activeTab === 'receita' ? 'Filtrar por Cliente' : 'Filtrar por Fornecedor'} />
                </SelectTrigger>
                <SelectContent>
                  {partnerListForFilter.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={filters.status} onValueChange={(value) => handleSelectFilterChange('status', value)}>
                <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                  <SelectItem value="atrasado">Atrasado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium whitespace-nowrap">Vencimento:</Label>
                <Input type="date" name="due_start_date" value={filters.due_start_date} onChange={handleFilterChange} />
                <span className="text-gray-500">até</span>
                <Input type="date" name="due_end_date" value={filters.due_end_date} onChange={handleFilterChange} />
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium whitespace-nowrap">Emissão:</Label>
                <Input type="date" name="emission_start_date" value={filters.emission_start_date} onChange={handleFilterChange} />
                <span className="text-gray-500">até</span>
                <Input type="date" name="emission_end_date" value={filters.emission_end_date} onChange={handleFilterChange} />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-8"><Loader2 className="w-8 h-8 mx-auto animate-spin text-gray-400" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição / {activeTab === 'receita' ? 'Cliente' : 'Fornecedor'}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Emissão / Vencimento</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {accounts.length === 0 ? (
                    <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">Nenhum lançamento encontrado.</td></tr>
                  ) : (
                    accounts.map((account) => (
                      <tr key={account.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div>{account.description}</div>
                          {(account.customer_name || account.supplier_name) && <div className="text-xs text-gray-500">{account.customer_name || account.supplier_name}</div>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(account.amount)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div><span className="font-medium">E:</span> {new Date(account.created_at).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</div>
                          <div><span className="font-medium">V:</span> {new Date(account.due_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${
                            account.status === 'pago' ? 'bg-green-100 text-green-800' : 
                            account.status === 'atrasado' ? 'bg-red-100 text-red-800' : 
                            account.status === 'cancelado' ? 'bg-gray-100 text-gray-800 line-through' : 
                            'bg-yellow-100 text-yellow-800'}`
                          }>{account.status}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {account.status === 'pago' && (
                            <Button variant="ghost" size="icon" title="Estornar Liquidação" onClick={() => handleReverseSettlement(account.id)}>
                              <Undo2 className="h-4 w-4 text-orange-600" />
                            </Button>
                          )}
                          {(account.status === 'pendente' || account.status === 'atrasado') && (
                            <>
                              <Button variant="ghost" size="icon" title="Liquidar Conta" onClick={() => handleOpenSettleModal(account)}>
                                <DollarSign className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button variant="ghost" size="icon" title="Editar Lançamento" onClick={() => handleOpenCreateModal(account)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" title="Cancelar Lançamento" onClick={() => handleCancelAccount(account.id)}>
                                <Ban className="h-4 w-4 text-red-600" />
                              </Button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
        
        {pagination && pagination.pages > 1 && (
          <div className="p-4 border-t">
            <Pagination pagination={pagination} onPageChange={handlePageChange} itemName="lançamentos" />
          </div>
        )}
      </Card>

      {isCreateModalOpen && (
        <Modal open={isCreateModalOpen} onClose={handleCloseCreateModal} title={editingAccount ? 'Editar Lançamento' : 'Novo Lançamento'}>
          <AccountForm 
            account={editingAccount} 
            activeTab={activeTab} 
            onSave={handleSaveAccount} 
            onCancel={handleCloseCreateModal} 
            customerList={customerList}
            supplierList={supplierList}
          />
        </Modal>
      )}
      {isSettleModalOpen && settlingAccount && (<Modal open={isSettleModalOpen} onClose={handleCloseSettleModal} title={`Liquidar ${activeTab === 'receita' ? 'Conta a Receber' : 'Conta a Pagar'}`}><SettleAccountModal account={settlingAccount} paymentMethods={paymentMethods} onSettle={handleSettleAccount} onCancel={handleCloseSettleModal} /></Modal>)}
    </div>
  );
};

export default Finance;
