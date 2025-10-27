import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2 } from 'lucide-react';
import ProductSearch from './ProductSearch';
import CustomerSearch from './CustomerSearch';
import { useAuth } from '../hooks/useAuth'; // 1. IMPORTAR O HOOK DE AUTENTICAÇÃO

const PreSaleForm = ({ onSave, preSaleData }) => {
  const { user } = useAuth(); // 2. PEGAR O USUÁRIO LOGADO DO CONTEXTO
  const [items, setItems] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [notes, setNotes] = useState('');
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // ... (o resto dos seus useEffects e handlers não mudam)

  useEffect(() => {
    if (preSaleData) {
      setItems(preSaleData.items || []);
      setCustomer(preSaleData.customer || null);
      setNotes(preSaleData.notes || '');
    } else {
      setItems([]);
      setCustomer(null);
      setNotes('');
    }
  }, [preSaleData]);

  useEffect(() => {
    const newTotal = items.reduce((sum, item) => {
      const itemTotal = (parseFloat(item.quantity) * parseFloat(item.unit_price)) - (parseFloat(item.discount_amount) || 0);
      return sum + itemTotal;
    }, 0);
    setTotal(newTotal);
  }, [items]);

  const handleAddProduct = (product) => {
    const existingItem = items.find(item => item.product_id === product.id);
    if (existingItem) {
      toast.error("Este produto já foi adicionado.");
      return;
    }
    setItems([...items, {
      product_id: product.id,
      name: product.name,
      code: product.code,
      quantity: 1,
      unit_price: product.price,
      discount_amount: 0,
    }]);
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...items];
    const val = parseFloat(value);
    if (val >= 0 || value === '') {
      updatedItems[index][field] = value;
      setItems(updatedItems);
    }
  };

  const handleRemoveItem = (index) => {
    const updatedItems = items.filter((_, i) => i !== index);
    setItems(updatedItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // 3. VERIFICAR SE O USUÁRIO ESTÁ DISPONÍVEL
    if (!user || !user.id) {
      toast.error("Usuário não encontrado. Por favor, faça login novamente.");
      setLoading(false);
      return;
    }

    if (items.length === 0) {
      toast.error("Adicione pelo menos um item à pré-venda.");
      setLoading(false);
      return;
    }

    const payload = {
      // 4. USAR O ID DO USUÁRIO DO CONTEXTO
      user_id: user.id,
      customer_id: customer ? customer.id : null,
      notes,
      items: items.map(item => ({
        product_id: item.product_id,
        quantity: parseFloat(item.quantity),
        unit_price: parseFloat(item.unit_price),
        discount_amount: parseFloat(item.discount_amount || 0),
      })),
    };

    try {
      let response;
      if (preSaleData && preSaleData.action === 'edit') {
        response = await api.put(`/pre-sales/${preSaleData.id}`, payload);
        toast.success("Pré-venda atualizada com sucesso!");
      } else {
        response = await api.post('/pre-sales', payload);
        toast.success("Pré-venda criada com sucesso!");
      }
      onSave(response.data);
    } catch (error) {
      console.error("Erro ao salvar pré-venda:", error);
      toast.error(error.response?.data?.error || "Não foi possível salvar a pré-venda.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* O RESTO DO SEU JSX NÃO MUDA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">Buscar Produto</h3>
              <ProductSearch onProductSelect={handleAddProduct} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Produto</TableHead>
                    <TableHead>Qtd.</TableHead>
                    <TableHead>Vl. Unit.</TableHead>
                    <TableHead>Desconto</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length > 0 ? items.map((item, index) => (
                    <TableRow key={item.product_id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>
                        <Input type="number" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} className="w-20" step="1" min="1" />
                      </TableCell>
                      <TableCell>
                        <Input type="number" value={item.unit_price} onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)} className="w-24" step="0.01" min="0" />
                      </TableCell>
                      <TableCell>
                        <Input type="number" value={item.discount_amount || 0} onChange={(e) => handleItemChange(index, 'discount_amount', e.target.value)} className="w-24" step="0.01" min="0" />
                      </TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                          (item.quantity * item.unit_price) - (item.discount_amount || 0)
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" type="button" onClick={() => handleRemoveItem(index)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-24">Nenhum item adicionado.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">Cliente</h3>
              <CustomerSearch onCustomerSelect={setCustomer} initialCustomer={customer} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">Observações</h3>
              <Textarea placeholder="Adicione observações à pré-venda..." value={notes} onChange={(e) => setNotes(e.target.value)} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-2xl font-bold text-blue-600">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar Pré-venda'}
        </Button>
      </div>
    </form>
  );
};

export default PreSaleForm;
