import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, Users, Loader2, DollarSign } from 'lucide-react';
import Modal from '../components/Modal';
import api from '../lib/api.js';

// ==================================================================
// Formulário para o modal (agora com campo de TIPO)
// ==================================================================
const CustomerForm = ({ customer, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    document: '',
    type: 'cliente',
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        document: customer.document || '',
        type: customer.type || 'cliente',
      });
    } else {
      setFormData({ name: '', email: '', phone: '', document: '', type: 'cliente' });
    }
  }, [customer]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTypeChange = (value) => {
    setFormData(prev => ({ ...prev, type: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nome Completo / Razão Social *</label>
        <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
      </div>

      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Tipo de Cadastro *</label>
        <Select value={formData.type} onValueChange={handleTypeChange}>
          <SelectTrigger id="type">
            <SelectValue placeholder="Selecione o tipo..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cliente">Cliente</SelectItem>
            <SelectItem value="fornecedor">Fornecedor</SelectItem>
            <SelectItem value="ambos">Cliente e Fornecedor</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
          <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} />
        </div>
      </div>
      <div>
        <label htmlFor="document" className="block text-sm font-medium text-gray-700 mb-1">CPF/CNPJ</label>
        <Input id="document" name="document" value={formData.document} onChange={handleChange} />
      </div>
      <div className="pt-4 flex justify-end gap-2 border-t mt-6">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">Salvar Cadastro</Button>
      </div>
    </form>
  );
};

// ==================================================================
// Página Principal (Cadastros)
// ==================================================================
const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/customers');
      setCustomers(response.data.customers || []);
    } catch (error) {
      console.error("Erro ao carregar cadastros:", error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
  };

  const handleSaveCustomer = async (formData) => {
    try {
      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer.id}`, formData);
      } else {
        await api.post('/customers', formData);
      }
      fetchCustomers();
      handleModalClose();
    } catch (error) {
      console.error("Erro ao salvar cadastro:", error);
      alert(`Não foi possível salvar o cadastro: ${error.response?.data?.error || 'Erro desconhecido'}`);
    }
  };

  const handleDeleteCustomer = async (customerId) => {
    if (window.confirm("Tem certeza que deseja excluir este cadastro?")) {
      try {
        await api.delete(`/customers/${customerId}`);
        fetchCustomers();
      } catch (error) {
        console.error("Erro ao excluir cadastro:", error);
        alert(`Não foi possível excluir: ${error.response?.data?.error || 'Verifique as dependências.'}`);
      }
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getTypeBadge = (type) => {
    switch (type) {
      case 'cliente':
        return <Badge variant="default" className="bg-blue-600">Cliente</Badge>;
      case 'fornecedor':
        return <Badge variant="secondary" className="bg-orange-500 text-white">Fornecedor</Badge>;
      case 'ambos':
        return <Badge variant="outline" className="bg-purple-600 text-white">Ambos</Badge>;
      default:
        return <Badge variant="outline">Indefinido</Badge>;
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Users className="mr-3 h-8 w-8" />
            Cadastros
          </h1>
          <p className="text-gray-600">Gerencie sua base de clientes e fornecedores.</p>
        </div>
        <Button onClick={() => { setEditingCustomer(null); setIsModalOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Cadastro
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Todos os Cadastros</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por nome ou email..."
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
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Saldo de Crédito</TableHead>
                  <TableHead className="text-right w-[120px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="h-24 text-center"><Loader2 className="animate-spin w-6 h-6 mx-auto text-gray-400" /></TableCell></TableRow>
                ) : filteredCustomers.length > 0 ? filteredCustomers.map(customer => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.email || '---'}</TableCell>
                    <TableCell>{customer.phone || '---'}</TableCell>
                    <TableCell>{getTypeBadge(customer.type)}</TableCell>
                    <TableCell className="text-right">
                      {customer.credit_balance > 0 ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                          <DollarSign className="h-3 w-3 mr-1" />
                          {formatCurrency(customer.credit_balance)}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">{formatCurrency(0)}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => { setEditingCustomer(customer); setIsModalOpen(true); }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-8 w-8 hover:bg-red-50" onClick={() => handleDeleteCustomer(customer.id)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={6} className="h-24 text-center">Nenhum cadastro encontrado.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Modal
        open={isModalOpen}
        onClose={handleModalClose}
        title={editingCustomer ? 'Editar Cadastro' : 'Novo Cadastro'}
      >
        <CustomerForm
          customer={editingCustomer}
          onSave={handleSaveCustomer}
          onCancel={handleModalClose}
        />
      </Modal>
    </div>
  );
};

export default Customers;
