// frontend/src/components/PreSaleForm.jsx

import React, { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Trash2, Loader2, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { Label } from '@/components/ui/label';

const PreSaleForm = ({ onSave }) => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState(null);

  const fetchProducts = useCallback(async (search = '') => {
    try {
      const response = await api.get('/products', { params: { limit: 10, search } });
      setProducts(response.data.products || []);
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    const fetchCustomers = async () => {
      try {
        const response = await api.get('/customers', { params: { limit: 1000 } });
        setCustomers(response.data.customers || []);
      } catch (error) {
        console.error("Erro ao buscar clientes:", error);
      }
    };
    fetchCustomers();
  }, [fetchProducts]);

  const handleProductSearch = (e) => {
    const searchValue = e.target.value;
    setProductSearch(searchValue);
    if (debounceTimer) clearTimeout(debounceTimer);
    const newTimer = setTimeout(() => fetchProducts(searchValue), 300);
    setDebounceTimer(newTimer);
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.product_id === product.id);
    if (existingItem) {
      setCart(cart.map(item => item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, {
        product_id: product.id,
        name: product.name,
        quantity: 1,
        unit_price: product.price,
        discount_amount: 0
      }]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  const totalAmount = cart.reduce((total, item) => total + (item.quantity * item.unit_price), 0);

  const handleSubmit = async () => {
    if (cart.length === 0) {
      toast.error("Adicione pelo menos um produto à pré-venda.");
      return;
    }
    setSubmitting(true);
    const preSaleData = {
      customer_id: selectedCustomerId || null,
      user_id: user.id,
      total_amount: totalAmount,
      notes: notes,
      items: cart.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_amount: item.discount_amount,
      })),
    };
    const promise = api.post('/pre-sales', preSaleData);
    toast.promise(promise, {
      loading: 'Salvando pré-venda...',
      success: 'Pré-venda salva com sucesso!',
      error: (err) => `Erro ao salvar: ${err.response?.data?.error || err.message}`,
    });
    try {
      await promise;
      onSave();
    } catch (error) {
      // O toast já trata o erro
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 max-w-6xl mx-auto">
      {/* Lado Esquerdo: Busca de Produtos */}
      <div>
        <h3 className="font-semibold mb-2">Buscar Produtos</h3>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input placeholder="Buscar por nome ou SKU..." value={productSearch} onChange={handleProductSearch} className="pl-10" />
        </div>
        <div className="border rounded-md h-[500px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Preço</TableHead>
                <TableHead className="text-center">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map(p => (
                <TableRow key={p.id}>
                  <TableCell>{p.name}</TableCell>
                  <TableCell className="text-right">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.price)}</TableCell>
                  <TableCell className="text-center">
                    <Button size="sm" variant="outline" onClick={() => addToCart(p)}><Plus className="w-4 h-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Lado Direito: Carrinho e Detalhes */}
      <div>
        <h3 className="font-semibold mb-2">Detalhes da Pré-venda</h3>
        <div className="space-y-4">
          <div>
            <Label>Cliente</Label>
            {/* ▼▼▼ CORREÇÃO DEFINITIVA APLICADA AQUI ▼▼▼ */}
            <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
              <SelectTrigger>
                <SelectValue placeholder="Consumidor Final" />
              </SelectTrigger>
              <SelectContent>
                {customers
                  .filter(c => c.id != null) // Filtra para garantir que o ID não seja nulo/undefined
                  .map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Observações</Label>
            <Input placeholder="Informações adicionais..." value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="border rounded-md h-80 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-center">Remover</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cart.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center h-24">Carrinho vazio</TableCell></TableRow>
                ) : cart.map(item => (
                  <TableRow key={item.product_id}>
                    <TableCell>{item.quantity}x {item.name}</TableCell>
                    <TableCell className="text-right">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.quantity * item.unit_price)}</TableCell>
                    <TableCell className="text-center">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => removeFromCart(item.product_id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="text-right font-bold text-lg">
            Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalAmount)}
          </div>
          <Button onClick={handleSubmit} disabled={submitting || cart.length === 0} className="w-full">
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar Pré-venda
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PreSaleForm;
