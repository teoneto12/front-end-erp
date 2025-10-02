import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, ShoppingCart, Trash2, X, Minus, Calculator, CreditCard, Banknote, Smartphone, Printer, ChevronDown, Ban } from 'lucide-react';
import api from '../lib/api.js';
import Dashboard from '../components/Dashboard'; // O novo dashboard integrado
import Pagination from '../components/Pagination';
import '../App.css';

const Transactions = () => {
  // Estados
  const [products, setProducts] = useState([]);
  const [productPagination, setProductPagination] = useState(null);
  const [currentProductPage, setCurrentProductPage] = useState(1);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [transactionPagination, setTransactionPagination] = useState(null);
  const [currentTransactionPage, setCurrentTransactionPage] = useState(1);
  const [transactionSearchTerm, setTransactionSearchTerm] = useState('');
  const [expandedTransactionId, setExpandedTransactionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNewSale, setShowNewSale] = useState(false);
  const [cart, setCart] = useState([]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [payments, setPayments] = useState([]);
  const [currentPaymentMethod, setCurrentPaymentMethod] = useState('dinheiro');
  const [currentPaymentAmount, setCurrentPaymentAmount] = useState('');
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });

  // Efeito para buscar transações na montagem e ao mudar filtros
  useEffect(() => {
    fetchTransactions(currentTransactionPage, transactionSearchTerm, dateFilter);
  }, [currentTransactionPage, transactionSearchTerm, dateFilter]);

  // Efeito para buscar produtos quando o modal de nova venda é aberto
  useEffect(() => {
    if (showNewSale) {
      fetchProducts(currentProductPage, productSearchTerm);
    }
  }, [showNewSale, currentProductPage, productSearchTerm]);

  const fetchProducts = async (page = 1, search = '') => {
    try {
      const response = await api.get('/products', { params: { page, limit: 5, search } });
      setProducts(response.data.products || []);
      setProductPagination(response.data.pagination || null);
    } catch (error) { console.error('Erro ao carregar produtos:', error); }
  };

  const fetchTransactions = async (page = 1, search = '', dates = {}) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 5,
        search,
        start_date: dates.start || undefined,
        end_date: dates.end || undefined,
      };
      const response = await api.get('/transactions', { params });
      setTransactions(response.data.transactions || []);
      setTransactionPagination(response.data.pagination || null);
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
      setTransactions([]);
    }
    finally { setLoading(false); }
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateFilter(prev => ({ ...prev, [name]: value }));
    setCurrentTransactionPage(1);
  };

  const formatCurrency = (value) => {
    const numberValue = Number(value);
    if (isNaN(numberValue)) return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(0);
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numberValue);
  };
  const formatDate = (dateString) => new Date(dateString).toLocaleString('pt-BR');

  const handlePrintReceipt = (transaction) => {
    const itemsHtml = (transaction.items || []).map(item => `
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
        <span>${item.quantity}x ${item.product_name}</span>
        <span>${formatCurrency(item.subtotal)}</span>
      </div>
    `).join('');

    const paymentsHtml = (transaction.payments || []).map(p => `
      <div style="display: flex; justify-content: space-between;">
        <span>${p.payment_method.replace(/_/g, ' ')}:</span>
        <span>${formatCurrency(p.amount)}</span>
      </div>
    `).join('');

    const subtotal = (transaction.items || []).reduce((acc, item) => acc + parseFloat(item.subtotal || 0), 0);
    const discountAmount = transaction.discount_percent > 0 ? (subtotal * (transaction.discount_percent / 100)) : 0;
    
    const receiptContent = `
      <div style="font-family: monospace; width: 300px; margin: auto; padding: 20px; border: 1px solid #ccc;">
        <h2 style="text-align: center;">Recibo de Venda</h2>
        <p><strong>Venda Nº:</strong> ${transaction.sale_number}</p>
        <p><strong>Data:</strong> ${formatDate(transaction.transaction_date)}</p>
        <p><strong>Operador:</strong> ${transaction.cashier_name}</p>
        <hr>
        <h3 style="margin-bottom: 10px;">Itens:</h3>
        ${itemsHtml}
        <hr>
        <div style="display: flex; justify-content: space-between;">
          <span>Subtotal:</span>
          <span>${formatCurrency(subtotal)}</span>
        </div>
        ${transaction.discount_percent > 0 ? `<div style="display: flex; justify-content: space-between; color: red;"><span>Desconto (${transaction.discount_percent}%):</span><span>-${formatCurrency(discountAmount)}</span></div>` : ''}
        <hr>
        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 1.1em;">
          <span>TOTAL:</span>
          <span>${formatCurrency(transaction.total_amount)}</span>
        </div>
        <hr>
        <h3 style="margin-bottom: 10px;">Pagamentos:</h3>
        ${paymentsHtml}
        <hr>
        <p style="text-align: center; margin-top: 20px;">Obrigado pela sua compra!</p>
      </div>
    `;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(receiptContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const toggleTransactionDetails = (id) => setExpandedTransactionId(expandedTransactionId === id ? null : id);

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.product_id === product.id);
    if (existingItem) {
      if (existingItem.quantity < product.stock_quantity) {
        setCart(cart.map(item => item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      } else { alert('Estoque insuficiente'); }
    } else {
      if (product.stock_quantity > 0) {
        setCart([...cart, { product_id: product.id, product_name: product.name, unit_price: parseFloat(product.price), quantity: 1, stock_available: product.stock_quantity, sku: product.sku }]);
      } else { alert('Produto sem estoque'); }
    }
  };

  const removeFromCart = (productId) => setCart(cart.filter(item => item.product_id !== productId));

  const updateCartQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) { removeFromCart(productId); return; }
    const item = cart.find(item => item.product_id === productId);
    if (item && newQuantity > item.stock_available) { alert('Quantidade maior que o estoque disponível'); return; }
    setCart(cart.map(item => item.product_id === productId ? { ...item, quantity: newQuantity } : item));
  };

  const calculateSubtotal = () => cart.reduce((total, item) => total + (item.unit_price * item.quantity), 0);
  const calculateDiscount = () => calculateSubtotal() * (discountPercent / 100);
  const calculateTotal = () => calculateSubtotal() - calculateDiscount();
  const totalPaid = payments.reduce((acc, p) => acc + parseFloat(p.amount || 0), 0);
  const remainingToPay = calculateTotal() - totalPaid;

  const handleAddPayment = () => {
    const amount = parseFloat(currentPaymentAmount);
    if (!amount || amount <= 0) return alert("Insira um valor de pagamento válido.");
    if (amount > remainingToPay + 0.01) return alert("O valor do pagamento não pode ser maior que o valor restante.");
    setPayments([...payments, { method: currentPaymentMethod, amount }]);
    setCurrentPaymentAmount('');
  };

  const handleRemovePayment = (indexToRemove) => setPayments(payments.filter((_, index) => index !== indexToRemove));

  const resetSaleState = () => {
    setCart([]);
    setDiscountPercent(0);
    setPayments([]);
    setCurrentPaymentAmount('');
    setCurrentPaymentMethod('dinheiro');
    setShowNewSale(false);
    setTransactionSearchTerm('');
    setDateFilter({ start: '', end: '' });
    fetchTransactions(1, '', {});
  };

  const handleFinalizeSale = async () => {
    if (cart.length === 0) return alert('Adicione produtos ao carrinho');
    if (Math.abs(remainingToPay) > 0.01) return alert("O valor pago não corresponde ao total da venda.");
    setSubmitting(true);
    try {
      const transactionData = {
        items: cart.map(item => ({ product_id: item.product_id, quantity: item.quantity, unit_price: item.unit_price })),
        payments: payments.map(p => ({ method: p.method, amount: p.amount })),
        discount_percent: discountPercent,
      };
      await api.post('/transactions', transactionData);
      alert('Venda realizada com sucesso!');
      resetSaleState();
    } catch (error) {
      alert('Erro ao finalizar venda: ' + (error.response?.data?.error || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelTransaction = async (transactionId) => {
    if (!window.confirm("Tem certeza que deseja cancelar esta venda?")) return;
    try {
      await api.delete(`/transactions/${transactionId}/cancel`);
      alert('Venda cancelada com sucesso!');
      setTransactions(prev => prev.map(t => t.id === transactionId ? { ...t, status: 'CANCELADO' } : t));
    } catch (error) {
      alert('Erro ao cancelar venda: ' + (error.response?.data?.error || error.message));
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'dinheiro': return <Banknote className="w-4 h-4" />;
      case 'cartao_debito': return <CreditCard className="w-4 h-4" />;
      case 'cartao_credito': return <CreditCard className="w-4 h-4" />;
      case 'pix': return <Smartphone className="w-4 h-4" />;
      default: return <Banknote className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vendas e Desempenho</h1>
          <p className="text-gray-600">Analise métricas, registre vendas e visualize o histórico.</p>
        </div>
        <Button onClick={() => setShowNewSale(true)} className="bg-green-600 hover:bg-green-700">
          <Plus className="w-4 h-4 mr-2" />
          Nova Venda
        </Button>
      </div>

      {showNewSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-[95vw] h-[90vh] overflow-hidden">
            <div className="flex h-full">
              <div className="flex-1 p-6 border-r flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Selecionar Produtos</h2>
                  <Button variant="ghost" size="sm" onClick={() => setShowNewSale(false)}><X className="w-4 h-4" /></Button>
                </div>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input placeholder="Buscar produtos por nome ou SKU..." value={productSearchTerm} onChange={(e) => { setProductSearchTerm(e.target.value); setCurrentProductPage(1); }} className="pl-10" />
                  </div>
                </div>
                <div className="flex-grow overflow-y-auto mb-4 border rounded-lg">
                  <Table>
                    <TableHeader className="sticky top-0 bg-gray-50"><TableRow><TableHead>Produto</TableHead><TableHead className="text-center">Estoque</TableHead><TableHead className="text-right">Preço</TableHead><TableHead className="text-center">Ação</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product.id} className="hover:bg-gray-50">
                          <TableCell><div className="font-medium">{product.name}</div><div className="text-xs text-gray-500">SKU: {product.sku}</div></TableCell>
                          <TableCell className="text-center"><Badge variant={product.stock_quantity > 0 ? "secondary" : "destructive"}>{product.stock_quantity}</Badge></TableCell>
                          <TableCell className="text-right font-semibold text-green-600">{formatCurrency(product.price)}</TableCell>
                          <TableCell className="text-center"><Button size="sm" variant="outline" onClick={() => addToCart(product)}><Plus className="w-4 h-4" /></Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <Pagination pagination={productPagination} onPageChange={setCurrentProductPage} />
              </div>
              <div className="w-[450px] p-6 bg-gray-50 flex flex-col">
                <h2 className="text-xl font-bold mb-4 flex items-center"><ShoppingCart className="w-5 h-5 mr-2" />Carrinho ({cart.reduce((acc, item) => acc + item.quantity, 0)})</h2>
                <div className="flex-grow space-y-3 mb-4 overflow-y-auto">
                  {cart.length === 0 ? (<div className="text-center text-gray-500 pt-10"><ShoppingCart className="w-10 h-10 mx-auto mb-2" /><p>Seu carrinho está vazio.</p></div>) : cart.map((item) => (
                    <Card key={item.product_id}>
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start mb-2"><div className="flex-1"><h4 className="font-medium text-sm">{item.product_name}</h4><p className="text-xs text-gray-600">{formatCurrency(item.unit_price)} cada</p></div><Button size="icon" variant="ghost" onClick={() => removeFromCart(item.product_id)} className="text-red-600 hover:text-red-700 h-7 w-7"><Trash2 className="w-4 h-4" /></Button></div>
                        <div className="flex items-center justify-between"><div className="flex items-center space-x-2"><Button size="icon" variant="outline" onClick={() => updateCartQuantity(item.product_id, item.quantity - 1)} className="h-7 w-7"><Minus className="w-3 h-3" /></Button><span className="w-8 text-center text-sm font-bold">{item.quantity}</span><Button size="icon" variant="outline" onClick={() => updateCartQuantity(item.product_id, item.quantity + 1)} className="h-7 w-7"><Plus className="w-3 h-3" /></Button></div><span className="font-semibold text-sm">{formatCurrency(item.unit_price * item.quantity)}</span></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="mt-auto">
                  <Separator className="my-4" />
                  <div className="mb-4"><label className="block text-sm font-medium mb-2">Desconto (%)</label><Input type="number" min="0" max="100" value={discountPercent} onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)} placeholder="0" /></div>
                  <div className="space-y-2 mb-4 p-3 bg-white rounded border">
                    <div className="flex justify-between text-sm"><span>Subtotal:</span><span>{formatCurrency(calculateSubtotal())}</span></div>
                    {discountPercent > 0 && (<div className="flex justify-between text-sm text-red-600"><span>Desconto ({discountPercent}%):</span><span>-{formatCurrency(calculateDiscount())}</span></div>)}
                    <Separator />
                    <div className="flex justify-between font-bold text-lg"><span>Total a Pagar:</span><span>{formatCurrency(calculateTotal())}</span></div>
                    <div className="flex justify-between text-sm text-blue-600"><span>Total Pago:</span><span>{formatCurrency(totalPaid)}</span></div>
                    <div className="flex justify-between text-sm font-bold text-orange-600"><span>Restante:</span><span>{formatCurrency(remainingToPay)}</span></div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Adicionar Pagamento</label>
                    <div className="flex items-center space-x-2">
                      <Select value={currentPaymentMethod} onValueChange={setCurrentPaymentMethod}>
                        <SelectTrigger><SelectValue placeholder="Método" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dinheiro">Dinheiro</SelectItem>
                          <SelectItem value="cartao_credito">Crédito</SelectItem>
                          <SelectItem value="cartao_debito">Débito</SelectItem>
                          <SelectItem value="pix">PIX</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input type="number" placeholder="Valor" value={currentPaymentAmount} onChange={(e) => setCurrentPaymentAmount(e.target.value)} />
                      <Button onClick={handleAddPayment}><Plus className="w-4 h-4" /></Button>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4 max-h-24 overflow-y-auto">
                    {payments.map((p, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-100 rounded-md text-sm">
                        <div className="flex items-center">{getPaymentMethodIcon(p.method)}<span className="ml-2 capitalize">{p.method.replace(/_/g, ' ')}</span></div>
                        <div className="flex items-center">
                          <span className="font-semibold">{formatCurrency(p.amount)}</span>
                          <Button size="icon" variant="ghost" className="h-6 w-6 ml-2" onClick={() => handleRemovePayment(index)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <Button onClick={handleFinalizeSale} disabled={submitting || cart.length === 0 || Math.abs(remainingToPay) > 0.01} className="w-full bg-green-600 hover:bg-green-700 h-12 text-base">
                      <Calculator className="w-5 h-5 mr-2" />
                      {submitting ? 'Finalizando...' : 'Finalizar Venda'}
                    </Button>
                    <Button variant="outline" onClick={resetSaleState} className="w-full h-12 text-base">Cancelar</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard integrado aqui. Ele só renderiza se houver dados. */}
      <Dashboard transactions={transactions} />

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Histórico de Vendas</CardTitle>
              <CardDescription>Visualize ou filtre as vendas realizadas</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <Input type="date" name="start" value={dateFilter.start} onChange={handleDateChange} className="w-full sm:w-auto" />
                <span className="text-gray-500">até</span>
                <Input type="date" name="end" value={dateFilter.end} onChange={handleDateChange} className="w-full sm:w-auto" />
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por Nº, operador, item..."
                  value={transactionSearchTerm}
                  onChange={(e) => { setTransactionSearchTerm(e.target.value); setCurrentTransactionPage(1); }}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div><p className="mt-2 text-gray-600">Carregando transações...</p></div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma venda encontrada</h3>
              <p className="text-gray-600">Tente um termo de busca ou período diferente.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((transaction) => {
                const status = transaction.status || '';
                const isCancelled = status === 'CANCELADO';
                const isCompleted = status === 'FINALIZADO';
                const statusVariant = isCancelled ? 'destructive' : (isCompleted ? 'secondary' : 'default');

                return (
                  <Card key={transaction.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => toggleTransactionDetails(transaction.id)}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge variant="outline">Venda #{transaction.sale_number}</Badge>
                            <Badge variant={statusVariant}>{status}</Badge>
                          </div>
                          <p className="text-sm text-gray-600">{formatDate(transaction.transaction_date)} • {transaction.cashier_name}</p>
                        </div>
                        <div className="flex items-center">
                          <div className="text-right mr-4">
                            <div className={`font-bold text-lg ${isCancelled ? 'text-gray-500 line-through' : 'text-green-600'}`}>{formatCurrency(transaction.total_amount)}</div>
                            <div className="flex items-center justify-end text-sm text-gray-600 space-x-2">
                              {(transaction.payments || []).map((p, index) => <div key={index}>{getPaymentMethodIcon(p.payment_method)}</div>)}
                            </div>
                          </div>
                          <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${expandedTransactionId === transaction.id ? 'rotate-180' : ''}`} />
                        </div>
                      </div>

                      {expandedTransactionId === transaction.id && (
                        <div className="border-t mt-4 pt-4">
                          <div className="flex justify-between items-center mb-3">
                            <p className="text-sm font-medium">Itens da Venda:</p>
                            <div className="flex items-center space-x-2">
                              <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handlePrintReceipt(transaction); }}>
                                <Printer className="w-4 h-4 mr-2" />
                                Imprimir Recibo
                              </Button>
                              {isCompleted && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="bg-red-600 text-white hover:bg-red-700"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCancelTransaction(transaction.id);
                                  }}
                                >
                                  <Ban className="w-4 h-4 mr-2" />
                                  Cancelar Venda
                                </Button>
                              )}
                            </div>
                          </div>
                          <div className="space-y-1 text-sm text-gray-700 mb-4">
                            {(transaction.items || []).map((item, index) => (
                              <div key={index} className="flex justify-between">
                                <span>{item.quantity}x {item.product_name}</span>
                                <span>{formatCurrency(item.subtotal)}</span>
                              </div>
                            ))}
                          </div>
                          <p className="text-sm font-medium mb-2">Pagamentos:</p>
                          <div className="space-y-1 text-sm text-gray-700">
                            {(transaction.payments || []).map((p, index) => (
                              <div key={index} className="flex justify-between">
                                <span className="capitalize">{p.payment_method.replace(/_/g, ' ')}</span>
                                <span>{formatCurrency(p.amount)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
          {transactions.length > 0 && (
            <Pagination pagination={transactionPagination} onPageChange={setCurrentTransactionPage} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Transactions;
