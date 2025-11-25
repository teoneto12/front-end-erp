import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import api from '../lib/api';

// --- COMPONENTES DE UI ---
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, Edit, Loader2, Search, Undo2, Ban, FileText } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import Pagination from '../components/Pagination';
import Modal from '@/components/Modal';
import { generateCarnetPDF } from '../lib/carnetGenerator';

// ==================================================================
// FORMULÁRIO E MODAL (código colapsado para brevidade, sem alterações)
// ==================================================================
const AccountForm = ({ account, activeTab, onSave, onCancel, customerList, supplierList }) => {
  const [launchType, setLaunchType] = useState('unico');
  const [formData, setFormData] = useState({ description: account?.description || '', amount: account?.amount || '', due_date: account?.due_date ? new Date(account.due_date).toISOString().split('T')[0] : '', customer_id: account?.customer_id ? String(account.customer_id) : '', supplier_id: account?.supplier_id ? String(account.supplier_id) : '', document_number: account?.document_number || '', type: activeTab, installments: 2 });
  const handleSubmit = (e) => { e.preventDefault(); onSave({ ...formData, launch_type: launchType }); };
  const isEditing = !!account;
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!isEditing && ( <div> <Label>Tipo de Lançamento</Label> <Select value={launchType} onValueChange={setLaunchType}> <SelectTrigger><SelectValue /></SelectTrigger> <SelectContent> <SelectItem value="unico">Lançamento Único</SelectItem> <SelectItem value="parcelado">Lançamento Parcelado</SelectItem> </SelectContent> </Select> </div> )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> <div> <Label>Descrição</Label> <Input name="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required /> </div> <div> <Label>Nº do Documento</Label> <Input name="document_number" value={formData.document_number} onChange={(e) => setFormData({ ...formData, document_number: e.target.value })} /> </div> </div>
      {activeTab === 'receita' && ( <div> <Label>Cliente</Label> <Select value={formData.customer_id} onValueChange={(value) => setFormData({ ...formData, customer_id: value })}> <SelectTrigger><SelectValue placeholder="Selecione um cliente (opcional)" /></SelectTrigger> <SelectContent> {customerList.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)} </SelectContent> </Select> </div> )}
      {activeTab === 'despesa' && ( <div> <Label>Fornecedor</Label> <Select value={formData.supplier_id} onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}> <SelectTrigger><SelectValue placeholder="Selecione um fornecedor (opcional)" /></SelectTrigger> <SelectContent> {supplierList.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)} </SelectContent> </Select> </div> )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> <div> <Label>Valor {launchType === 'parcelado' ? 'Total' : ''}</Label> <Input type="number" name="amount" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required /> </div> <div> <Label>Data de Vencimento {launchType === 'parcelado' ? '(1ª Parcela)' : ''}</Label> <Input type="date" name="due_date" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} required /> </div> </div>
      {launchType === 'parcelado' && !isEditing && ( <div> <Label>Nº de Parcelas</Label> <Input type="number" min="2" value={formData.installments} onChange={(e) => setFormData({ ...formData, installments: parseInt(e.target.value, 10) || 2 })} /> </div> )}
      <div className="flex justify-end gap-2 pt-4"> <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button> <Button type="submit">{isEditing ? 'Atualizar' : 'Salvar'}</Button> </div>
    </form>
  );
};
const SettleAccountModal = ({ account, paymentMethods, onSettle, onCancel }) => {
  const [settleData, setSettleData] = useState({ payment_method_id: paymentMethods[0]?.id ? String(paymentMethods[0].id) : '', paid_amount: account?.amount || '', payment_date: new Date().toISOString().split('T')[0] });
  const handleSubmit = (e) => { e.preventDefault(); onSettle(settleData); };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p>Liquidando conta: <strong>{account.description}</strong></p> <p>Valor: <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(account.amount)}</strong></p>
      <div> <Label>Forma de Pagamento</Label> <Select value={settleData.payment_method_id} onValueChange={(value) => setSettleData({ ...settleData, payment_method_id: value })} required> <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger> <SelectContent> {paymentMethods.map(pm => <SelectItem key={pm.id} value={String(pm.id)}>{pm.name}</SelectItem>)} </SelectContent> </Select> </div>
      <div> <Label>Data do Pagamento</Label> <Input type="date" value={settleData.payment_date} onChange={(e) => setSettleData({ ...settleData, payment_date: e.target.value })} required /> </div>
      <div className="flex justify-end gap-2 pt-4"> <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button> <Button type="submit">Liquidar Conta</Button> </div>
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
  const [selectedAccounts, setSelectedAccounts] = useState(new Set());
  const [filters, setFilters] = useState({ search: '', status: 'all', due_start_date: '', due_end_date: '', emission_start_date: '', emission_end_date: '', partner_id: '' });

  const customerList = useMemo(() => allPartners.filter(p => p.type === 'cliente' || p.type === 'ambos'), [allPartners]);
  const supplierList = useMemo(() => allPartners.filter(p => p.type === 'fornecedor' || p.type === 'ambos'), [allPartners]);

  // Carrega dados essenciais (parceiros e métodos de pagamento) uma única vez
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [partnersRes, paymentMethodsRes] = await Promise.all([
          api.get('/customers', { params: { limit: 2000 } }), // Aumenta o limite para garantir que todos sejam carregados
          api.get('/payment-methods')
        ]);
        setAllPartners(partnersRes.data.customers || []);
        setPaymentMethods(paymentMethodsRes.data.paymentMethods || []);
      } catch (err) {
        console.error("Erro ao carregar dados iniciais:", err);
      }
    };
    loadInitialData();
  }, []);

  // Busca as contas financeiras com base nos filtros
  const fetchAccounts = useCallback(async (page = 1) => {
    setLoading(true);
    setSelectedAccounts(new Set());
    try {
      const params = { page, limit: 10, type: activeTab, ...filters };
      if (params.status === 'all') delete params.status;
      if (params.partner_id) {
        if (activeTab === 'receita') params.customer_id = params.partner_id;
        if (activeTab === 'despesa') params.supplier_id = params.partner_id;
        delete params.partner_id;
      } else {
        // Garante que o ID do parceiro não seja enviado se não estiver selecionado
        delete params.customer_id;
        delete params.supplier_id;
      }

      const accountsRes = await api.get('/accounts', { params });
      setAccounts(accountsRes.data.accounts || []);
      setPagination(accountsRes.data.pagination || null);
    } catch (error) {
      console.error("Erro ao carregar contas:", error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, filters]);

  useEffect(() => { fetchAccounts(1); }, [fetchAccounts]);

  const handleFilterChange = (e) => { const { name, value } = e.target; setFilters(prev => ({ ...prev, [name]: value })); };
  const handleSelectFilterChange = (name, value) => { setFilters(prev => ({ ...prev, [name]: value })); };
  const handleTabChange = (tab) => { setActiveTab(tab); setFilters(prev => ({ ...prev, partner_id: '', search: '', status: 'all' })); setSelectedAccounts(new Set()); };
  const handlePageChange = (newPage) => { fetchAccounts(newPage); };
  const handleOpenCreateModal = (account = null) => { setEditingAccount(account); setIsCreateModalOpen(true); };
  const handleCloseCreateModal = () => { setEditingAccount(null); setIsCreateModalOpen(false); };
  const handleOpenSettleModal = (account) => { setSettlingAccount(account); setIsSettleModalOpen(true); };
  const handleCloseSettleModal = () => { setSettlingAccount(null); setIsSettleModalOpen(false); };
  const handleSaveAccount = async (formData) => { try { const method = editingAccount ? 'put' : 'post'; const url = editingAccount ? `/accounts/${editingAccount.id}` : '/accounts'; await api[method](url, formData); handleCloseCreateModal(); fetchAccounts(pagination?.page || 1); } catch (error) { console.error("Erro ao salvar lançamento:", error); alert(`Erro ao salvar: ${error.response?.data?.error || error.message}`); } };
  const handleSettleAccount = async (settleData) => { if (!settlingAccount) return; try { await api.post(`/accounts/${settlingAccount.id}/settle`, settleData); handleCloseSettleModal(); fetchAccounts(pagination?.page || 1); } catch (error) { console.error("Erro ao liquidar lançamento:", error); alert(`Erro ao liquidar: ${error.response?.data?.error || error.message}`); } };
  const handleReverseSettlement = async (accountId) => { if (!window.confirm("Tem certeza que deseja estornar este lançamento?")) return; try { await api.post(`/accounts/${accountId}/reverse`); fetchAccounts(pagination?.page || 1); } catch (error) { console.error("Erro ao estornar lançamento:", error); alert(`Erro ao estornar: ${error.response?.data?.error || error.message}`); } };
  const handleCancelAccount = async (accountId) => { if (!window.confirm("Tem certeza que deseja cancelar este lançamento?")) return; try { await api.post(`/accounts/${accountId}/cancel`); fetchAccounts(pagination?.page || 1); } catch (error) { console.error("Erro ao cancelar lançamento:", error); alert(`Erro ao cancelar: ${error.response?.data?.error || error.message}`); } };
  const handleAccountSelect = (accountId) => { const newSelection = new Set(selectedAccounts); if (newSelection.has(accountId)) { newSelection.delete(accountId); } else { newSelection.add(accountId); } setSelectedAccounts(newSelection); };

  // ==================================================================
  // FUNÇÃO DE GERAR CARNÊ (CORRIGIDA E ROBUSTA)
  // ==================================================================
  const handleGenerateCarnet = async () => {
    if (selectedAccounts.size === 0) {
      alert("Selecione pelo menos uma conta para gerar o carnê.");
      return;
    }

    const accountsToPrint = accounts.filter(acc => selectedAccounts.has(acc.id));
    
    // Encontra a primeira conta que tenha um customer_id
    const firstValidAccount = accountsToPrint.find(acc => acc.customer_id);

    if (!firstValidAccount) {
        alert("Erro: Nenhuma das contas selecionadas possui um cliente associado.");
        return;
    }
    
    const firstCustomerId = firstValidAccount.customer_id;

    const allSameCustomer = accountsToPrint.every(acc => acc.customer_id === firstCustomerId);
    if (!allSameCustomer) {
      alert("Erro: Todas as contas selecionadas para o carnê devem pertencer ao mesmo cliente.");
      return;
    }

    try {
      // Busca os dados do cliente diretamente na API para garantir que estão corretos
      const customerRes = await api.get(`/customers/${firstCustomerId}`);
      const selectedCustomer = customerRes.data.customer;

      if (!selectedCustomer) {
        alert("Cliente não encontrado na base de dados. Não é possível gerar o carnê.");
        return;
      }

      const companyInfo = {
        name: 'Sua Loja LTDA',
        cnpj: '12.345.678/0001-99',
        address: 'Rua Principal, 123, Centro, Sua Cidade - UF, 12345-678',
      };

      generateCarnetPDF(selectedCustomer, accountsToPrint, companyInfo);

    } catch (error) {
      console.error("Falha ao buscar dados do cliente para o carnê:", error);
      alert(`Erro ao buscar informações do cliente: ${error.response?.data?.error || error.message}`);
    }
  };


  const partnerListForFilter = activeTab === 'receita' ? customerList : supplierList;

  return (
    <div className="p-4 md:p-6 space-y-6 bg-gray-50 min-h-full">
      <div className="flex justify-between items-center">
        <div><h2 className="text-3xl font-bold text-gray-800">Financeiro</h2><p className="text-gray-600">Gerencie suas contas a pagar e a receber.</p></div>
        <div className="flex gap-2">
          {activeTab === 'receita' && ( <Button variant="outline" onClick={handleGenerateCarnet} disabled={selectedAccounts.size === 0}> <FileText className="w-4 h-4 mr-2" /> Gerar Carnê ({selectedAccounts.size}) </Button> )}
          <Button onClick={() => handleOpenCreateModal()}>Novo Lançamento</Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <div className="flex flex-col gap-4 pt-4">
            <div className="flex flex-wrap items-center gap-2">
              <Tabs value={activeTab} onValueChange={handleTabChange}> <TabsList> <TabsTrigger value="receita">Contas a Receber</TabsTrigger> <TabsTrigger value="despesa">Contas a Pagar</TabsTrigger> </TabsList> </Tabs>
              <div className="relative flex-grow sm:flex-grow-0"> <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" /> <Input placeholder="Buscar..." name="search" value={filters.search} onChange={handleFilterChange} className="pl-10" /> </div>
              <Select value={filters.partner_id} onValueChange={(value) => handleSelectFilterChange('partner_id', value)}> <SelectTrigger className="w-full sm:w-[180px]"> <SelectValue placeholder={activeTab === 'receita' ? 'Filtrar por Cliente' : 'Filtrar por Fornecedor'} /> </SelectTrigger> <SelectContent> {partnerListForFilter.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)} </SelectContent> </Select>
              <Select value={filters.status} onValueChange={(value) => handleSelectFilterChange('status', value)}> <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger> <SelectContent> <SelectItem value="all">Todos os Status</SelectItem> <SelectItem value="pendente">Pendente</SelectItem> <SelectItem value="pago">Pago</SelectItem> <SelectItem value="cancelado">Cancelado</SelectItem> <SelectItem value="atrasado">Atrasado</SelectItem> </SelectContent> </Select>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2"> <Label className="text-sm font-medium whitespace-nowrap">Vencimento:</Label> <Input type="date" name="due_start_date" value={filters.due_start_date} onChange={handleFilterChange} /> <span className="text-gray-500">até</span> <Input type="date" name="due_end_date" value={filters.due_end_date} onChange={handleFilterChange} /> </div>
              <div className="flex items-center gap-2"> <Label className="text-sm font-medium whitespace-nowrap">Emissão:</Label> <Input type="date" name="emission_start_date" value={filters.emission_start_date} onChange={handleFilterChange} /> <span className="text-gray-500">até</span> <Input type="date" name="emission_end_date" value={filters.emission_end_date} onChange={handleFilterChange} /> </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? ( <div className="text-center py-8"><Loader2 className="w-8 h-8 mx-auto animate-spin text-gray-400" /></div> ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-12"> <Checkbox checked={selectedAccounts.size > 0 && selectedAccounts.size === accounts.filter(a => activeTab === 'receita' && (a.status === 'pendente' || a.status === 'atrasado')).length} onCheckedChange={(checked) => { if (checked) { const pendingIds = accounts.filter(a => activeTab === 'receita' && (a.status === 'pendente' || a.status === 'atrasado')).map(a => a.id); setSelectedAccounts(new Set(pendingIds)); } else { setSelectedAccounts(new Set()); } }} disabled={activeTab !== 'receita'} /> </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição / Cliente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Emissão / Vencimento</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {accounts.length === 0 ? ( <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">Nenhum lançamento encontrado.</td></tr> ) : (
                    accounts.map((account) => {
                      const isSelectable = activeTab === 'receita' && (account.status === 'pendente' || account.status === 'atrasado');
                      return (
                        <tr key={account.id} className={`hover:bg-gray-50 ${selectedAccounts.has(account.id) ? 'bg-blue-50' : ''}`}>
                          <td className="px-6 py-4"> {isSelectable && ( <Checkbox checked={selectedAccounts.has(account.id)} onCheckedChange={() => handleAccountSelect(account.id)} /> )} </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium"> <div>{account.description}</div> {account.document_number && <div className="text-xs text-gray-500 font-mono">Doc: {account.document_number}</div>} {(account.customer_name || account.supplier_name) && <div className="text-xs text-gray-500">{account.customer_name || account.supplier_name}</div>} </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(account.amount)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm"> <div><span className="font-medium">E:</span> {new Date(account.created_at).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</div> <div><span className="font-medium">V:</span> {new Date(account.due_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</div> </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm"> <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${ account.status === 'pago' ? 'bg-green-100 text-green-800' : account.status === 'atrasado' ? 'bg-red-100 text-red-800' : account.status === 'cancelado' ? 'bg-gray-100 text-gray-800 line-through' : 'bg-yellow-100 text-yellow-800'}` }>{account.status}</span> </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {account.status === 'pago' && ( <Button variant="ghost" size="icon" title="Estornar Liquidação" onClick={() => handleReverseSettlement(account.id)}> <Undo2 className="h-4 w-4 text-orange-600" /> </Button> )}
                            {(account.status === 'pendente' || account.status === 'atrasado') && ( <> <Button variant="ghost" size="icon" title="Liquidar Conta" onClick={() => handleOpenSettleModal(account)}> <DollarSign className="h-4 w-4 text-green-600" /> </Button> <Button variant="ghost" size="icon" title="Editar Lançamento" onClick={() => handleOpenCreateModal(account)}> <Edit className="h-4 w-4" /> </Button> <Button variant="ghost" size="icon" title="Cancelar Lançamento" onClick={() => handleCancelAccount(account.id)}> <Ban className="h-4 w-4 text-red-600" /> </Button> </> )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
        {pagination && pagination.pages > 1 && ( <div className="p-4 border-t"> <Pagination pagination={pagination} onPageChange={handlePageChange} itemName="lançamentos" /> </div> )}
      </Card>
      {isCreateModalOpen && ( <Modal open={isCreateModalOpen} onClose={handleCloseCreateModal} title={editingAccount ? 'Editar Lançamento' : 'Novo Lançamento'}> <AccountForm account={editingAccount} activeTab={activeTab} onSave={handleSaveAccount} onCancel={handleCloseCreateModal} customerList={customerList} supplierList={supplierList} /> </Modal> )}
      {isSettleModalOpen && settlingAccount && (<Modal open={isSettleModalOpen} onClose={handleCloseSettleModal} title={`Liquidar ${activeTab === 'receita' ? 'Conta a Receber' : 'Conta a Pagar'}`}><SettleAccountModal account={settlingAccount} paymentMethods={paymentMethods} onSettle={handleSettleAccount} onCancel={handleCloseSettleModal} /></Modal>)}
    </div>
  );
};

export default Finance;
