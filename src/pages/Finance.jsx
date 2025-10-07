// frontend/src/pages/Finance.jsx

import React, { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

// --- COMPONENTES DE UI ---
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Modal from '@/components/Modal';
import { DollarSign, Edit, Loader2, Search } from 'lucide-react';
import Pagination from '../components/Pagination';

// --- COMPONENTES INTERNOS (AccountForm, SettleAccountModal) ---
const AccountForm = ({ account, activeTab, onSave, onCancel, customers }) => { /* ...código existente... */ };
const SettleAccountModal = ({ account, paymentMethods, onSettle, onCancel }) => { /* ...código existente... */ };

// --- COMPONENTE PRINCIPAL (Finance) ---
const Finance = () => {
  const [activeTab, setActiveTab] = useState('receita');
  const [accounts, setAccounts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [customers, setCustomers] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [settlingAccount, setSettlingAccount] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    start_date: '',
    end_date: '',
  });

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 10,
        type: activeTab,
        search: filters.search || undefined,
        status: filters.status === 'all' ? undefined : filters.status,
        start_date: filters.start_date || undefined,
        end_date: filters.end_date || undefined,
      };

      const accountsRes = await api.get('/accounts', { params });
      setAccounts(accountsRes.data.accounts || []);
      setPagination(accountsRes.data.pagination || null);

      const [customersRes, paymentMethodsRes] = await Promise.all([
        api.get('/customers'),
        api.get('/payment-methods', { params: { 
          show_in_accounts_receivable: activeTab === 'receita' ? true : undefined,
          show_in_accounts_payable: activeTab === 'despesa' ? true : undefined,
        }})
      ]);
      setCustomers(customersRes.data.customers || []);
      setPaymentMethods(paymentMethodsRes.data.paymentMethods || []);

    } catch (error) {
      console.error("Erro ao carregar dados financeiros:", error);
      // ▼▼▼ MUDANÇA IMPORTANTE PARA DEPURAÇÃO ▼▼▼
      const dbErrorMessage = error.response?.data?.db_error;
      if (dbErrorMessage) {
        alert(`Erro no Banco de Dados: ${dbErrorMessage}`);
      } else {
        alert(`Não foi possível carregar os dados financeiros: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  }, [activeTab, currentPage, filters]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  useEffect(() => {
    const handleAccountsUpdate = () => fetchAllData();
    window.addEventListener('accountsUpdated', handleAccountsUpdate);
    return () => window.removeEventListener('accountsUpdated', handleAccountsUpdate);
  }, [fetchAllData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, activeTab]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = (value) => {
    setFilters(prev => ({ ...prev, status: value }));
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
      fetchAllData();
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
      fetchAllData();
    } catch (error) { 
      console.error("Erro ao liquidar lançamento:", error);
      alert(`Erro ao liquidar: ${error.response?.data?.error || error.message}`);
    }
  };

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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="receita">Contas a Receber</TabsTrigger>
                <TabsTrigger value="despesa">Contas a Pagar</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-48">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input 
                  placeholder="Buscar..." 
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  className="pl-10" 
                />
              </div>
              <Select value={filters.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="atrasado">Atrasado</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Input type="date" name="start_date" value={filters.start_date} onChange={handleFilterChange} />
                <span className="text-gray-500">até</span>
                <Input type="date" name="end_date" value={filters.end_date} onChange={handleFilterChange} />
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição / Cliente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vencimento</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {accounts.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-gray-500">Nenhum lançamento encontrado para os filtros aplicados.</td>
                    </tr>
                  ) : (
                    accounts.map((account) => (
                      <tr key={account.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div>{account.description}</div>
                          {account.customer_name && <div className="text-xs text-gray-500">{account.customer_name}</div>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(account.amount)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(account.due_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${account.status === 'pago' ? 'bg-green-100 text-green-800' : (account.status === 'atrasado' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800')}`}>{account.status}</span></td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {account.status !== 'pago' && (<Button variant="ghost" size="icon" title="Liquidar Conta" onClick={() => handleOpenSettleModal(account)}><DollarSign className="h-4 w-4 text-green-600" /></Button>)}
                          <Button variant="ghost" size="icon" title="Editar Lançamento" onClick={() => handleOpenCreateModal(account)}><Edit className="h-4 w-4" /></Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
        {pagination && pagination.totalPages > 1 && (
          <div className="p-4 border-t">
            <Pagination pagination={pagination} onPageChange={setCurrentPage} itemName="lançamentos" />
          </div>
        )}
      </Card>

      {isCreateModalOpen && (<Modal open={isCreateModalOpen} onClose={handleCloseCreateModal} title={editingAccount ? 'Editar Lançamento' : 'Novo Lançamento'}><AccountForm account={editingAccount} activeTab={activeTab} onSave={handleSaveAccount} onCancel={handleCloseCreateModal} customers={customers} /></Modal>)}
      {isSettleModalOpen && settlingAccount && (<Modal open={isSettleModalOpen} onClose={handleCloseSettleModal} title={`Liquidar ${activeTab === 'receita' ? 'Conta a Receber' : 'Conta a Pagar'}`}><SettleAccountModal account={settlingAccount} paymentMethods={paymentMethods} onSettle={handleSettleAccount} onCancel={handleCloseSettleModal} /></Modal>)}
    </div>
  );
};

export default Finance;
