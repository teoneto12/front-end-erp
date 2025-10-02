import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Edit, Trash2, ArrowDownCircle, ArrowUpCircle, Landmark, Loader2 } from 'lucide-react';
import api from '../lib/api.js';
import '../App.css';

/* ----- Modal customizado (sem alterações) ----- */
const Modal = ({ open, onClose, title, children }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} aria-hidden="true" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-card text-card-foreground rounded-lg shadow-lg w-full max-w-lg" role="dialog" aria-modal="true" aria-label={title || 'Modal'} onClick={(e) => e.stopPropagation()}>
          <div className="flex items-start justify-between p-6 border-b">
            <h3 className="text-lg font-medium">{title}</h3>
            <button onClick={onClose} aria-label="Fechar" className="ml-4 rounded px-2 py-1 text-muted-foreground hover:bg-accent">×</button>
          </div>
          <div className="p-6">{children}</div>
        </div>
      </div>
    </>,
    document.body
  );
};

/* ----- Formulário de Lançamento (simplificado) ----- */
const AccountForm = ({ account, activeTab, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    due_date: '',
    type: activeTab,
    status: 'pendente',
  });

  useEffect(() => {
    if (account) {
      setFormData({
        description: account.description || '',
        amount: account.amount || '',
        due_date: account.due_date ? new Date(account.due_date).toISOString().slice(0, 10) : '',
        type: account.type || activeTab,
        status: account.status || 'pendente',
      });
    } else {
      setFormData({
        description: '', amount: '', due_date: '', type: activeTab, status: 'pendente',
      });
    }
  }, [account, activeTab]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">Descrição</label>
        <Input id="description" name="description" value={formData.description} onChange={handleChange} required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium mb-1">Valor</label>
          <Input id="amount" name="amount" type="number" step="0.01" value={formData.amount} onChange={handleChange} required />
        </div>
        <div>
          <label htmlFor="due_date" className="block text-sm font-medium mb-1">Data de Vencimento</label>
          <Input id="due_date" name="due_date" type="date" value={formData.due_date} onChange={handleChange} required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="type" className="block text-sm font-medium mb-1">Tipo</label>
          <Select name="type" value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            {/* Não precisa mais de hacks aqui */}
            <SelectContent>
              <SelectItem value="receivable">A Receber</SelectItem>
              <SelectItem value="payable">A Pagar</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium mb-1">Status</label>
          <Select name="status" value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            {/* Não precisa mais de hacks aqui */}
            <SelectContent>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="pago">Pago</SelectItem>
              <SelectItem value="atrasado">Atrasado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="pt-4 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">Salvar Lançamento</Button>
      </div>
    </form>
  );
};

/* ----- Componente Principal da Página Financeira (sem alterações) ----- */
const Finance = ({...props}) => {
  // ... todo o resto do seu componente Finance permanece exatamente igual
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('receivable');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);

  useEffect(() => {
    fetchAccounts(activeTab);
  }, [activeTab]);

  const fetchAccounts = async (type) => {
    setLoading(true);
    try {
      const response = await api.get('/financial-accounts', { params: { type } });
      setAccounts(response.data.accounts || []);
    } catch (error) {
      console.error(`Erro ao carregar contas a ${type === 'receivable' ? 'receber' : 'pagar'}:`, error);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingAccount(null);
  };

  const handleSaveAccount = async (formData) => {
    try {
      if (editingAccount) {
        await api.put(`/financial-accounts/${editingAccount.id}`, formData);
      } else {
        await api.post('/financial-accounts', formData);
      }
      fetchAccounts(activeTab);
      handleModalClose();
    } catch (error) {
      console.error("Erro ao salvar lançamento:", error);
      alert("Não foi possível salvar o lançamento.");
    }
  };

  const handleDeleteAccount = async (accountId) => {
    if (window.confirm("Tem certeza que deseja excluir este lançamento?")) {
      try {
        await api.delete(`/financial-accounts/${accountId}`);
        fetchAccounts(activeTab);
      } catch (error) {
        console.error("Erro ao excluir lançamento:", error);
        alert("Não foi possível excluir o lançamento.");
      }
    }
  };

  const filteredAccounts = accounts.filter(acc =>
    acc.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Landmark className="mr-3 h-8 w-8" />
            Financeiro
          </h1>
          <p className="text-gray-600">Gerencie suas contas a pagar e a receber.</p>
        </div>
        <Button onClick={() => { setEditingAccount(null); setIsModalOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Lançamento
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="receivable">
            <ArrowUpCircle className="w-4 h-4 mr-2 text-green-600" />
            Contas a Receber
          </TabsTrigger>
          <TabsTrigger value="payable">
            <ArrowDownCircle className="w-4 h-4 mr-2 text-red-600" />
            Contas a Pagar
          </TabsTrigger>
        </TabsList>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                {activeTab === 'receivable' ? 'Lançamentos a Receber' : 'Lançamentos a Pagar'}
              </CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right w-[120px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        <Loader2 className="animate-spin w-6 h-6 mx-auto text-gray-400" />
                      </TableCell>
                    </TableRow>
                  ) : filteredAccounts.length > 0 ? filteredAccounts.map(acc => (
                    <TableRow key={acc.id}>
                      <TableCell className="font-medium">{acc.description}</TableCell>
                      <TableCell className={acc.type === 'receivable' ? 'text-green-600' : 'text-red-600'}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(acc.amount)}
                      </TableCell>
                      <TableCell>{new Date(acc.due_date).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>
                        <Badge className={
                          acc.status === 'pago' ? 'bg-green-500 text-white' :
                          acc.status === 'pendente' ? 'bg-yellow-500 text-black' :
                          'bg-red-500 text-white'
                        }>
                          {acc.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => { setEditingAccount(acc); setIsModalOpen(true); }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon" className="h-8 w-8 hover:bg-red-50" onClick={() => handleDeleteAccount(acc.id)}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">Nenhum lançamento encontrado.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </Tabs>

      <Modal
        open={isModalOpen}
        onClose={handleModalClose}
        title={editingAccount ? 'Editar Lançamento' : 'Novo Lançamento'}
      >
        <AccountForm
          account={editingAccount}
          activeTab={activeTab}
          onSave={handleSaveAccount}
          onCancel={handleModalClose}
        />
      </Modal>
    </div>
  );
};

export default Finance;
