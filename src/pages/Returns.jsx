import React, { useState, useEffect, useCallback } from 'react';
import api from '../lib/api.js';

// --- COMPONENTES DE UI ---
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2, User, ArrowLeft, RefreshCw, Undo, Gift, Repeat, ShoppingCart, Plus, Minus, Trash2, Calculator, ChevronDown, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

// Componente de Paginação (adicionado para evitar erros de componente faltando)
const Pagination = ({ pagination, onPageChange, itemName = "itens" }) => {
  if (!pagination || pagination.totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-4">
      <span className="text-sm text-gray-700">
        Mostrando {pagination.currentPage} de {pagination.totalPages} páginas
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.currentPage - 1)}
          disabled={!pagination.hasPreviousPage}
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.currentPage + 1)}
          disabled={!pagination.hasNextPage}
        >
          Próximo
        </Button>
      </div>
    </div>
  );
};


// ==================================================================
// COMPONENTE PRINCIPAL DE TROCAS E DEVOLUÇÕES
// ==================================================================
const Returns = () => {
  // --- ESTADOS DE CONTROLE DE FLUXO ---
  const [view, setView] = useState('list'); // 'list', 'form', 'exchange_pdv'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedReturnId, setExpandedReturnId] = useState(null);

  // --- ESTADOS DOS DADOS ---
  const [returnsList, setReturnsList] = useState([]);
  const [saleNumber, setSaleNumber] = useState('');
  const [originalTransaction, setOriginalTransaction] = useState(null);
  const [itemsToReturn, setItemsToReturn] = useState([]);
  const [reason, setReason] = useState('');
  const [resolutionType, setResolutionType] = useState('VOUCHER');
  
  // --- ESTADOS DA TROCA ---
  const [products, setProducts] = useState([]);
  const [productPagination, setProductPagination] = useState(null);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [currentProductPage, setCurrentProductPage] = useState(1);
  const [exchangeCart, setExchangeCart] = useState([]);

  // --- ESTADOS DO CLIENTE ---
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);
  const formatDate = (dateString) => new Date(dateString).toLocaleString('pt-BR');

  // --- FUNÇÕES DE API ---
  const fetchReturns = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/returns');
      setReturnsList(data || []);
    } catch (err) { 
      console.error("Erro ao carregar devoluções:", err); 
      setReturnsList([]);
    } 
    finally { setLoading(false); }
  }, []);

  const fetchCustomers = useCallback(async () => {
    try {
      const response = await api.get('/customers', { params: { limit: 1000 } });
      setCustomers(response.data.customers || []);
    } catch (error) { console.error('Erro ao carregar clientes:', error); }
  }, []);

  const fetchProducts = useCallback(async (page = 1, search = '') => {
    try {
      const response = await api.get('/products', { params: { page, limit: 5, search } });
      setProducts(response.data.products || []);
      setProductPagination(response.data.pagination || null);
    } catch (error) { console.error('Erro ao carregar produtos:', error); }
  }, []);

  useEffect(() => {
    if (view === 'list') {
      fetchReturns();
    }
    fetchCustomers();
  }, [view, fetchReturns, fetchCustomers]);

  useEffect(() => {
    if (view === 'exchange_pdv') {
      fetchProducts(currentProductPage, productSearchTerm);
    }
  }, [view, currentProductPage, productSearchTerm, fetchProducts]);

  // --- LÓGICA DO FLUXO ---
  const handleSearchTransaction = async (e) => {
    if (e) e.preventDefault();
    if (!saleNumber) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/returns/original-sale/${saleNumber}`);
      setOriginalTransaction(data);
      // Pré-define o cliente se a venda já tiver um
      if (data.customer_id) {
        setSelectedCustomerId(data.customer_id);
      }
      const preparedItems = data.items.map(item => ({ ...item, selected: true, return_quantity: item.quantity, restock: true }));
      setItemsToReturn(preparedItems);
      setView('form');
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Venda não encontrada ou erro desconhecido.';
      alert(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleItemSelectionChange = (transactionItemId, checked) => {
    setItemsToReturn(itemsToReturn.map(item => 
      item.transaction_item_id === transactionItemId ? { ...item, selected: checked } : item
    ));
  };

  const handleQuantityChange = (transactionItemId, newQuantity) => {
    const originalItem = originalTransaction.items.find(i => i.transaction_item_id === transactionItemId);
    const parsedQuantity = parseInt(newQuantity, 10);
    if (isNaN(parsedQuantity) || parsedQuantity < 1 || parsedQuantity > originalItem.quantity) return;
    setItemsToReturn(itemsToReturn.map(item =>
      item.transaction_item_id === transactionItemId ? { ...item, return_quantity: parsedQuantity } : item
    ));
  };

  const totalReturnedAmount = itemsToReturn
    .filter(item => item.selected)
    .reduce((sum, item) => sum + (item.return_quantity * item.unit_price), 0);

  const handleProcessDevolution = async () => {
    const selectedItems = itemsToReturn.filter(item => item.selected);
    if (selectedItems.length === 0) return alert("Selecione pelo menos um item.");
    
    const customerForPayload = originalTransaction.customer_id || selectedCustomerId;
    if (resolutionType === 'VOUCHER' && !customerForPayload) return alert("Selecione um cliente para gerar o voucher.");

    setLoading(true);
    setError('');
    try {
      const payload = {
        original_transaction_id: originalTransaction.id,
        customer_id: customerForPayload,
        items_to_return: selectedItems.map(item => ({
          product_id: item.product_id,
          quantity: item.return_quantity,
          unit_price_returned: item.unit_price,
          restock: item.restock,
        })),
        reason,
        resolution_type: resolutionType,
      };
      
      await api.post('/returns/process', payload);
      alert(`Devolução processada! ${resolutionType === 'VOUCHER' ? 'Voucher gerado.' : 'Valor retirado do caixa.'}`);
      handleReset();
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao processar devolução.');
      setError(err.response?.data?.error || 'Erro ao processar devolução.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartExchange = () => {
    const selectedItems = itemsToReturn.filter(item => item.selected);
    if (selectedItems.length === 0) return alert("Selecione pelo menos um item para iniciar a troca.");
    
    const customerForPayload = originalTransaction.customer_id || selectedCustomerId;
    if (!customerForPayload) return alert("Por favor, selecione um cliente para prosseguir com a troca.");
    
    setView('exchange_pdv');
  };
  
  const handleReset = () => {
    setView('list');
    setSaleNumber('');
    setOriginalTransaction(null);
    setItemsToReturn([]);
    setReason('');
    setResolutionType('VOUCHER');
    setError('');
    setExchangeCart([]);
    setSelectedCustomerId(null);
    setExpandedReturnId(null);
  };

  // --- LÓGICA DO PDV DE TROCA ---
  const addToExchangeCart = (product) => {
    const existing = exchangeCart.find(i => i.product_id === product.id);
    if (existing) {
        setExchangeCart(exchangeCart.map(i => i.product_id === product.id ? {...i, quantity: i.quantity + 1} : i));
    } else {
        setExchangeCart([...exchangeCart, { product_id: product.id, name: product.name, unit_price: product.price, quantity: 1 }]);
    }
  };

  const totalExchangeAmount = exchangeCart.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const finalDifference = totalExchangeAmount - totalReturnedAmount;

  const handleFinalizeExchange = async () => {
    setLoading(true);
    try {
        const payload = {
            original_transaction_id: originalTransaction.id,
            customer_id: originalTransaction.customer_id || selectedCustomerId,
            reason,
            items_to_return: itemsToReturn.filter(i => i.selected).map(item => ({
                product_id: item.product_id,
                quantity: item.return_quantity,
                unit_price_returned: item.unit_price,
                restock: item.restock,
            })),
            new_items: exchangeCart.map(item => ({
                product_id: item.product_id,
                quantity: item.quantity,
                unit_price: item.unit_price,
            })),
        };
        await api.post('/returns/exchange', payload);
        alert('Troca finalizada com sucesso!');
        handleReset();
    } catch(err) {
        alert('Erro ao finalizar troca: ' + (err.response?.data?.error || 'Erro desconhecido'));
    } finally {
        setLoading(false);
    }
  };
  
  const toggleReturnDetails = (returnId) => {
    setExpandedReturnId(prevId => (prevId === returnId ? null : returnId));
  };


  // --- RENDERIZAÇÃO ---

  if (view === 'exchange_pdv') {
    return (
        <div className="fixed inset-0 bg-white z-50 p-4 flex flex-col">
            <header className="flex justify-between items-center pb-4 border-b">
                <h1 className="text-2xl font-bold">Realizar Troca</h1>
                <Button variant="ghost" onClick={() => setView('form')}><X className="w-5 h-5 mr-2" /> Voltar para Seleção</Button>
            </header>
            <main className="flex-grow flex gap-4 pt-4 overflow-hidden">
                <div className="flex-1 flex flex-col">
                    <div className="mb-4"><Input placeholder="Buscar novos produtos..." value={productSearchTerm} onChange={(e) => setProductSearchTerm(e.target.value)} /></div>
                    <div className="flex-grow overflow-y-auto border rounded-lg">
                        <Table>
                            <TableHeader><TableRow><TableHead>Produto</TableHead><TableHead className="text-right">Preço</TableHead><TableHead className="text-center">Ação</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {products.map(p => <TableRow key={p.id}><TableCell>{p.name}</TableCell><TableCell className="text-right">{formatCurrency(p.price)}</TableCell><TableCell className="text-center"><Button size="sm" onClick={() => addToExchangeCart(p)}><Plus className="w-4 h-4" /></Button></TableCell></TableRow>)}
                            </TableBody>
                        </Table>
                    </div>
                    <Pagination pagination={productPagination} onPageChange={setCurrentProductPage} itemName="produtos" />
                </div>
                <div className="w-[450px] bg-gray-50 p-4 rounded-lg flex flex-col">
                    <h2 className="text-xl font-bold mb-4">Resumo da Troca</h2>
                    <div className="flex-grow space-y-2 overflow-y-auto">
                        <h3 className="font-semibold">Itens Devolvidos:</h3>
                        {itemsToReturn.filter(i => i.selected).map(item => (
                            <div key={item.product_id} className="text-sm flex justify-between text-red-600"><span>{item.return_quantity}x {item.product_name}</span><span>- {formatCurrency(item.return_quantity * item.unit_price)}</span></div>
                        ))}
                         <Separator className="my-2" />
                        <h3 className="font-semibold">Novos Itens:</h3>
                        {exchangeCart.map(item => (
                            <div key={item.product_id} className="text-sm flex justify-between text-green-600"><span>{item.quantity}x {item.name}</span><span>+ {formatCurrency(item.quantity * item.unit_price)}</span></div>
                        ))}
                    </div>
                    <div className="mt-auto space-y-3">
                        <Separator />
                        <div className="flex justify-between text-md"><span>Crédito da Devolução:</span><span className="font-semibold">{formatCurrency(totalReturnedAmount)}</span></div>
                        <div className="flex justify-between text-md"><span>Valor dos Novos Itens:</span><span className="font-semibold">{formatCurrency(totalExchangeAmount)}</span></div>
                        <Separator />
                        <div className={`flex justify-between text-xl font-bold ${finalDifference >= 0 ? 'text-orange-600' : 'text-blue-600'}`}>
                            <span>{finalDifference >= 0 ? 'Valor a Pagar:' : 'Crédito a Gerar:'}</span>
                            <span>{formatCurrency(Math.abs(finalDifference))}</span>
                        </div>
                        <Button className="w-full h-12" onClick={handleFinalizeExchange} disabled={loading}>
                            {loading ? <Loader2 className="animate-spin" /> : <RefreshCw className="mr-2" />}
                            Finalizar Troca
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    );
  }

  if (view === 'form' && originalTransaction) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex items-center gap-4 mb-6">
            <Button variant="outline" size="icon" onClick={handleReset}><ArrowLeft className="w-4 h-4" /></Button>
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Processar Troca/Devolução</h1>
                <p className="text-gray-600">Selecione os itens e a resolução desejada.</p>
            </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Venda #{originalTransaction.sale_number}</CardTitle>
                <CardDescription>Cliente: {originalTransaction.customer_name || 'Consumidor Final'}</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead className="w-[50px]"></TableHead><TableHead>Produto</TableHead><TableHead className="text-center">Qtd. Devolvida</TableHead><TableHead className="text-right">Valor Unit.</TableHead><TableHead className="text-center">Retornar ao Estoque?</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {itemsToReturn.map(item => (
                      <TableRow key={item.transaction_item_id}>
                        <TableCell><Checkbox checked={item.selected} onCheckedChange={(checked) => handleItemSelectionChange(item.transaction_item_id, checked)} /></TableCell>
                        <TableCell>{item.product_name}</TableCell>
                        <TableCell className="text-center"><Input type="number" className="w-16 text-center mx-auto" value={item.return_quantity} onChange={(e) => handleQuantityChange(item.transaction_item_id, e.target.value)} max={item.quantity} min={1} disabled={!item.selected} /></TableCell>
                        <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                        <TableCell className="text-center"><Checkbox checked={item.restock} onCheckedChange={(checked) => setItemsToReturn(itemsToReturn.map(i => i.transaction_item_id === item.transaction_item_id ? {...i, restock: checked} : i))} disabled={!item.selected} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Resumo da Devolução</CardTitle></CardHeader>
              <CardContent><div className="flex justify-between items-center font-bold text-xl"><span>Total do Crédito:</span><span>{formatCurrency(totalReturnedAmount)}</span></div></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Próximo Passo</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {/* Lógica para mostrar seletor de cliente apenas se a venda não tiver um */}
                {!originalTransaction.customer_id && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <Label htmlFor="customer-select">Associar a um cliente:</Label>
                        <Select onValueChange={setSelectedCustomerId}><SelectTrigger id="customer-select"><SelectValue placeholder="Selecione um cliente..." /></SelectTrigger>
                            <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                        </Select>
                        <p className="text-xs text-yellow-700 mt-1">Obrigatório para gerar crédito ou realizar troca.</p>
                    </div>
                )}
                <div><Label>Motivo da Troca/Devolução</Label><Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex: Tamanho incorreto" /></div>
                
                {/* BOTÃO DE TROCA CORRIGIDO */}
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700" 
                  onClick={handleStartExchange} 
                  disabled={totalReturnedAmount <= 0 || !(originalTransaction.customer_id || selectedCustomerId)}
                >
                  <Repeat className="mr-2 h-4 w-4" />Trocar por Outro(s) Produto(s)
                </Button>
                
                <Separator />
                <div className="text-center text-sm text-gray-500">Ou, se for apenas devolução:</div>
                <div className="space-y-2">
                    <div onClick={() => setResolutionType('VOUCHER')} className={`p-3 border rounded-lg cursor-pointer ${resolutionType === 'VOUCHER' ? 'border-blue-500 bg-blue-50' : ''}`}>
                        <h4 className="font-semibold flex items-center"><Gift className="w-4 h-4 mr-2" />Gerar Crédito / Voucher</h4>
                        <p className="text-xs text-gray-600 pl-6">Converte o valor total em um crédito para o cliente.</p>
                    </div>
                    <div onClick={() => setResolutionType('CASH_BACK')} className={`p-3 border rounded-lg cursor-pointer ${resolutionType === 'CASH_BACK' ? 'border-red-500 bg-red-50' : ''}`}>
                        <h4 className="font-semibold flex items-center"><Undo className="w-4 h-4 mr-2" />Devolver Dinheiro</h4>
                        <p className="text-xs text-gray-600 pl-6">Retira o valor do caixa atual (registrado como sangria).</p>
                    </div>
                </div>

                {/* BOTÃO DE DEVOLUÇÃO CORRIGIDO */}
                <Button 
                  className="w-full" 
                  variant="secondary" 
                  onClick={handleProcessDevolution} 
                  disabled={
                    loading || 
                    totalReturnedAmount <= 0 ||
                    (resolutionType === 'VOUCHER' && !(originalTransaction.customer_id || selectedCustomerId))
                  }
                >
                  {loading ? <Loader2 className="mr-2 animate-spin" /> : <Undo className="mr-2" />}
                  Confirmar Apenas Devolução
                </Button>

                {error && <p className="text-sm text-red-600 text-center pt-2">{error}</p>}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // TELA PRINCIPAL (LISTA DE DEVOLUÇÕES)
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Trocas e Devoluções</h1>
        <form onSubmit={handleSearchTransaction} className="flex items-center gap-2">
            <Input 
              placeholder="Nº da Venda Original" 
              value={saleNumber} 
              onChange={(e) => setSaleNumber(e.target.value)}
            />
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : <Plus className="mr-2" />}
              Nova Troca/Devolução
            </Button>
        </form>
      </div>
      {error && <p className="text-red-500 mb-4 text-center">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Devoluções</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Venda Original</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Valor Devolvido</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center h-24"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
              ) : returnsList.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center h-24">Nenhuma devolução encontrada.</TableCell></TableRow>
              ) : (
                returnsList.map(ret => (
                  <React.Fragment key={ret.id}>
                    <TableRow onClick={() => toggleReturnDetails(ret.id)} className="cursor-pointer hover:bg-gray-100">
                      <TableCell>#{ret.sale_number}</TableCell>
                      <TableCell>{ret.customer_name || 'N/A'}</TableCell>
                      <TableCell>{formatCurrency(ret.total_returned_amount)}</TableCell>
                      <TableCell><Badge variant={ret.status === 'EXCHANGED' ? 'default' : 'secondary'}>{ret.status}</Badge></TableCell>
                      <TableCell>{formatDate(ret.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <ChevronDown className={`transition-transform ${expandedReturnId === ret.id ? 'rotate-180' : ''}`} />
                      </TableCell>
                    </TableRow>
                    {expandedReturnId === ret.id && (
                      <TableRow>
                        <TableCell colSpan={6} className="p-0">
                          <div className="p-4 bg-gray-100">
                            <h4 className="font-semibold mb-2">Detalhes da Devolução #{ret.id}</h4>
                            <p><strong>Resolução:</strong> {ret.resolution_type}</p>
                            <p><strong>Motivo:</strong> {ret.reason || 'Não informado'}</p>
                            <div className="mt-2 flex gap-2">
                                <Button size="sm" variant="outline" disabled>Estornar</Button>
                                <Button size="sm" variant="outline" disabled>Imprimir</Button>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Returns;
