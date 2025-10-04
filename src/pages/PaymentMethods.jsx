import React, { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

// Importe seus componentes de UI
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Modal from '@/components/Modal';
import { PlusCircle, Edit, Trash2, Check, X } from 'lucide-react';

// --- COMPONENTE DO FORMULÁRIO (DENTRO DO MODAL) ---
const PaymentMethodForm = ({ method, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    allow_discount: false,
    show_in_sales_order: false,
    show_in_pdv: false,
    show_in_accounts_receivable: false,
    show_in_accounts_payable: false,
    is_active: true,
  });

  useEffect(() => {
    if (method) {
      setFormData(method);
    } else {
      // Reset para valores padrão
      setFormData({ name: '', type: '', allow_discount: false, show_in_sales_order: false, show_in_pdv: false, show_in_accounts_receivable: false, show_in_accounts_payable: false, is_active: true });
    }
  }, [method]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name, checked) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nome da Forma de Pagamento</label>
          <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
        </div>
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Tipo/Grupo</label>
          <Select name="type" value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))} required>
            <SelectTrigger><SelectValue placeholder="Selecione um tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="dinheiro">Dinheiro</SelectItem>
              <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
              <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
              <SelectItem value="pix">PIX</SelectItem>
              <SelectItem value="boleto">Boleto</SelectItem>
              <SelectItem value="transferencia">Transferência</SelectItem>
              <SelectItem value="credito_loja">Crédito Loja</SelectItem>
              <SelectItem value="outro">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4 rounded-md border p-4">
        <h4 className="text-md font-semibold text-gray-800">Configurações e Regras</h4>
        <div className="flex items-center justify-between">
          <label htmlFor="allow_discount" className="text-sm font-medium">Permitir Desconto?</label>
          <Switch id="allow_discount" checked={formData.allow_discount} onCheckedChange={(checked) => handleSwitchChange('allow_discount', checked)} />
        </div>
        <div className="flex items-center justify-between">
          <label htmlFor="is_active" className="text-sm font-medium">Manter Ativo?</label>
          <Switch id="is_active" checked={formData.is_active} onCheckedChange={(checked) => handleSwitchChange('is_active', checked)} />
        </div>
      </div>

      <div className="space-y-4 rounded-md border p-4">
        <h4 className="text-md font-semibold text-gray-800">Visibilidade nas Rotinas</h4>
        <div className="flex items-center justify-between">
          <label htmlFor="show_in_pdv" className="text-sm font-medium">PDV / Transações de Venda</label>
          <Switch id="show_in_pdv" checked={formData.show_in_pdv} onCheckedChange={(checked) => handleSwitchChange('show_in_pdv', checked)} />
        </div>
        <div className="flex items-center justify-between">
          <label htmlFor="show_in_sales_order" className="text-sm font-medium">Pedido de Venda</label>
          <Switch id="show_in_sales_order" checked={formData.show_in_sales_order} onCheckedChange={(checked) => handleSwitchChange('show_in_sales_order', checked)} />
        </div>
        <div className="flex items-center justify-between">
          <label htmlFor="show_in_accounts_receivable" className="text-sm font-medium">Contas a Receber</label>
          <Switch id="show_in_accounts_receivable" checked={formData.show_in_accounts_receivable} onCheckedChange={(checked) => handleSwitchChange('show_in_accounts_receivable', checked)} />
        </div>
        <div className="flex items-center justify-between">
          <label htmlFor="show_in_accounts_payable" className="text-sm font-medium">Contas a Pagar</label>
          <Switch id="show_in_accounts_payable" checked={formData.show_in_accounts_payable} onCheckedChange={(checked) => handleSwitchChange('show_in_accounts_payable', checked)} />
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">Salvar</Button>
      </div>
    </form>
  );
};

// --- COMPONENTE PRINCIPAL DA TELA ---
const PaymentMethods = () => {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);

  const fetchMethods = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/payment-methods');
      setMethods(response.data.paymentMethods || []);
    } catch (error) {
      console.error("Erro ao buscar formas de pagamento:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMethods(); }, [fetchMethods]);

  const handleOpenModal = (method = null) => { setEditingMethod(method); setIsModalOpen(true); };
  const handleCloseModal = () => { setEditingMethod(null); setIsModalOpen(false); };

  const handleSave = async (formData) => {
    try {
      const method = editingMethod ? 'put' : 'post';
      const url = editingMethod ? `/payment-methods/${editingMethod.id}` : '/payment-methods';
      await api[method](url, formData);
      handleCloseModal();
      fetchMethods();
    } catch (error) {
      console.error("Erro ao salvar forma de pagamento:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir?')) {
      try {
        await api.delete(`/payment-methods/${id}`);
        fetchMethods();
      } catch (error) {
        console.error("Erro ao excluir forma de pagamento:", error);
      }
    }
  };

  const BooleanIcon = ({ value }) => value ? <Check className="h-5 w-5 text-green-500" /> : <X className="h-5 w-5 text-red-500" />;

  return (
    <div className="p-4 md:p-6 space-y-6 bg-gray-50 min-h-full">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">Formas de Pagamento</h2>
        <Button onClick={() => handleOpenModal()}><PlusCircle className="mr-2 h-4 w-4" /> Nova Forma de Pagamento</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Formas de Pagamento Cadastradas</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p>Carregando...</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Permite Desconto</TableHead>
                  <TableHead>Visível no PDV</TableHead>
                  <TableHead>Visível no C. a Receber</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {methods.map(method => (
                  <TableRow key={method.id}>
                    <TableCell className="font-medium">{method.name}</TableCell>
                    <TableCell><BooleanIcon value={method.allow_discount} /></TableCell>
                    <TableCell><BooleanIcon value={method.show_in_pdv} /></TableCell>
                    <TableCell><BooleanIcon value={method.show_in_accounts_receivable} /></TableCell>
                    <TableCell>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${method.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {method.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenModal(method)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(method.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {isModalOpen && (
        <Modal open={isModalOpen} onClose={handleCloseModal} title={editingMethod ? 'Editar Forma de Pagamento' : 'Nova Forma de Pagamento'}>
          <PaymentMethodForm method={editingMethod} onSave={handleSave} onCancel={handleCloseModal} />
        </Modal>
      )}
    </div>
  );
};

export default PaymentMethods;
