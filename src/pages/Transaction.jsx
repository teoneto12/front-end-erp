import React, { useState, useEffect, useCallback } from 'react';
import api from '../lib/api.js';

// --- COMPONENTES DE UI ---
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, ShoppingCart, Trash2, X, Minus, Calculator, Printer, Ban, FileDown, Banknote, CreditCard, Smartphone, FileText, ChevronDown } from 'lucide-react';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import '../App.css';

// Importações adicionais
import Dashboard from '../components/Dashboard'; 
import { exportToPDF } from '../lib/pdfGenerator.js';

// ==================================================================
// COMPONENTE PARA O MODAL DE OPÇÕES DE RECIBO
// ==================================================================
const ReceiptOptionsModal = ({ transaction, onPrint, onPDF, onClose }) => {
  return (
    <div className="space-y-4">
      <p className="text-center text-lg">Venda #{transaction.sale_number} finalizada com sucesso!</p>
      <p className="text-center text-gray-600">Como você deseja gerar o comprovante?</p>
      <div className="flex justify-center gap-4 pt-4">
        <Button onClick={onPrint} className="bg-blue-600 hover:bg-blue-700">
          <Printer className="w-4 h-4 mr-2" />
          Imprimir Cupom
        </Button>
        <Button onClick={onPDF} variant="outline">
          <FileText className="w-4 h-4 mr-2" />
          Gerar PDF
        </Button>
      </div>
      <div className="text-center pt-2">
        <Button variant="ghost" onClick={onClose}>Fechar</Button>
      </div>
    </div>
  );
};

const Transactions = () => {
  // --- ESTADOS GERAIS ---
  const [transactions, setTransactions] = useState([]);
  const [transactionPagination, setTransactionPagination] = useState(null);
  const [transactionSearchTerm, setTransactionSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [expandedTransactionId, setExpandedTransactionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTransactionPage, setCurrentTransactionPage] = useState(1);

  // --- ESTADOS DO PDV (Ponto de Venda) ---
  const [showNewSale, setShowNewSale] = useState(false);
  const [products, setProducts] = useState([]);
  const [productPagination, setProductPagination] = useState(null);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [currentProductPage, setCurrentProductPage] = useState(1);
  const [cart, setCart] = useState([]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [payments, setPayments] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [currentPaymentMethodId, setCurrentPaymentMethodId] = useState('');
  const [currentPaymentAmount, setCurrentPaymentAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('none');
  const [showInstallmentModal, setShowInstallmentModal] = useState(false);
  const [currentPaymentForInstallments, setCurrentPaymentForInstallments] = useState(null);
  const [installments, setInstallments] = useState(1);
  
  // --- ESTADOS DO MODAL DE OPÇÕES DE RECIBO ---
  const [showReceiptOptions, setShowReceiptOptions] = useState(false);
  const [lastTransaction, setLastTransaction] = useState(null);

  // --- FUNÇÕES DE BUSCA (API) ---
  const fetchTransactions = useCallback(async (page = 1, search = '', dates = {}) => {
    setLoading(true);
    try {
      const params = { page, limit: 5, search, start_date: dates.start || undefined, end_date: dates.end || undefined };
      const response = await api.get('/transactions', { params });
      setTransactions(response.data.transactions || []);
      setTransactionPagination(response.data.pagination || null);
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProducts = useCallback(async (page = 1, search = '') => {
    try {
      const response = await api.get('/products', { params: { page, limit: 5, search } });
      setProducts(response.data.products || []);
      setProductPagination(response.data.pagination || null);
    } catch (error) { console.error('Erro ao carregar produtos:', error); }
  }, []);

  const fetchPaymentMethods = useCallback(async () => {
    try {
      const response = await api.get('/payment-methods', { params: { show_in_pdv: true, is_active: true } });
      const methods = response.data.paymentMethods || [];
      setPaymentMethods(methods);
      if (methods.length > 0 && !currentPaymentMethodId) { 
        setCurrentPaymentMethodId(methods[0].id.toString()); 
      }
    } catch (error) { console.error('Erro ao carregar formas de pagamento:', error); }
  }, [currentPaymentMethodId]);

  const fetchCustomers = useCallback(async () => {
    try {
      const response = await api.get('/customers', { params: { limit: 1000 } });
      setCustomers(response.data.customers || []);
    } catch (error) { console.error('Erro ao carregar clientes:', error); }
  }, []);

  // --- EFEITOS ---
  useEffect(() => {
    fetchTransactions(currentTransactionPage, transactionSearchTerm, dateFilter);
  }, [currentTransactionPage, transactionSearchTerm, dateFilter, fetchTransactions]);

  useEffect(() => {
    if (showNewSale) {
      fetchProducts(currentProductPage, productSearchTerm);
      fetchPaymentMethods();
      fetchCustomers();
    }
  }, [showNewSale, currentProductPage, productSearchTerm, fetchProducts, fetchPaymentMethods, fetchCustomers]);

  // --- FUNÇÕES DE LÓGICA E FORMATAÇÃO ---
  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);
  const formatDate = (dateString) => new Date(dateString).toLocaleString('pt-BR');
  const toggleTransactionDetails = (id) => setExpandedTransactionId(prevId => (prevId === id ? null : id));

  const handlePrintReceipt = (transaction) => {
    const itemsHtml = (transaction.items || []).map(item => `<div style="display: flex; justify-content: space-between;"><span>${item.quantity}x ${item.product_name}</span><span>${formatCurrency(item.subtotal)}</span></div>`).join('');
    const paymentsHtml = (transaction.payments || []).map(p => `<div style="display: flex; justify-content: space-between;"><span>${p.payment_method_name}:</span><span>${formatCurrency(p.amount)}</span></div>`).join('');
    const subtotal = (transaction.items || []).reduce((acc, item) => acc + parseFloat(item.subtotal || 0), 0);
    const discountAmount = transaction.discount_percent > 0 ? (subtotal * (transaction.discount_percent / 100)) : 0;
    const receiptContent = `<div style="font-family: monospace; width: 300px; margin: auto; padding: 15px; font-size: 12px;"><h2 style="text-align: center;">Recibo</h2><p><strong>Venda:</strong> ${transaction.sale_number}</p><p><strong>Data:</strong> ${formatDate(transaction.transaction_date)}</p><p><strong>Operador:</strong> ${transaction.cashier_name}</p><hr><h3 style="margin-bottom: 5px;">Itens:</h3>${itemsHtml}<hr><div style="display: flex; justify-content: space-between;"><span>Subtotal:</span><span>${formatCurrency(subtotal)}</span></div>${discountAmount > 0 ? `<div style="display: flex; justify-content: space-between; color: red;"><span>Desconto:</span><span>-${formatCurrency(discountAmount)}</span></div>` : ''}<hr><div style="display: flex; justify-content: space-between; font-weight: bold;"><span>TOTAL:</span><span>${formatCurrency(transaction.total_amount)}</span></div><hr><h3 style="margin-bottom: 5px;">Pagamentos:</h3>${paymentsHtml}<hr><p style="text-align: center; margin-top: 10px;">Obrigado!</p></div>`;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(receiptContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

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
    if (!currentPaymentMethodId) return alert("Selecione uma forma de pagamento.");
    if (!amount || amount <= 0) return alert("Insira um valor de pagamento válido.");
    if (amount > remainingToPay + 0.01) return alert("O valor do pagamento não pode ser maior que o valor restante.");

    const selectedMethod = paymentMethods.find(m => m.id.toString() === currentPaymentMethodId);
    if (!selectedMethod) return alert("Forma de pagamento inválida.");

    if (selectedMethod.generates_accounts_receivable) {
      if (!selectedCustomerId || selectedCustomerId === 'none') {
        return alert("Por favor, selecione um cliente para vendas a prazo.");
      }
      setCurrentPaymentForInstallments({ payment_method_id: selectedMethod.id, name: selectedMethod.name, amount, type: selectedMethod.type });
      setShowInstallmentModal(true);
    } else {
      setPayments([...payments, { payment_method_id: selectedMethod.id, name: selectedMethod.name, amount, type: selectedMethod.type }]);
      setCurrentPaymentAmount('');
    }
  };

  const handleConfirmInstallments = () => {
    if (!currentPaymentForInstallments || !installments || installments < 1) {
      return alert("Número de parcelas inválido.");
    }
    setPayments([...payments, { ...currentPaymentForInstallments, installments }]);
    setShowInstallmentModal(false);
    setCurrentPaymentForInstallments(null);
    setInstallments(1);
    setCurrentPaymentAmount('');
  };

  const handleRemovePayment = (indexToRemove) => setPayments(payments.filter((_, index) => index !== indexToRemove));

  const resetSaleState = () => {
    setCart([]);
    setDiscountPercent(0);
    setPayments([]);
    setCurrentPaymentAmount('');
    setSelectedCustomerId('none');
    if (paymentMethods.length > 0) setCurrentPaymentMethodId(paymentMethods[0].id.toString());
    setShowNewSale(false);
    setProductSearchTerm('');
    setCurrentProductPage(1);
    fetchTransactions(1);
  };

  const handleFinalizeSale = async () => {
    if (cart.length === 0) return alert('Adicione produtos ao carrinho');
    if (Math.abs(remainingToPay) > 0.01) return alert("O valor pago não corresponde ao total da venda.");

    const hasReceivablePayment = payments.some(p => {
        const method = paymentMethods.find(m => m.id === p.payment_method_id);
        return method && method.generates_accounts_receivable;
    });

    if (hasReceivablePayment && (!selectedCustomerId || selectedCustomerId === 'none')) {
      return alert("Uma forma de pagamento a prazo foi usada, mas nenhum cliente foi selecionado.");
    }

    setSubmitting(true);
    try {
      const transactionData = {
        customer_id: selectedCustomerId === 'none' ? null : parseInt(selectedCustomerId, 10),
        items: cart.map(item => ({ product_id: item.product_id, quantity: item.quantity, unit_price: item.unit_price })),
        payments: payments.map(p => ({
          payment_method_id: p.payment_method_id,
          amount: p.amount,
          installments: p.installments
        })),
        discount_percent: discountPercent,
      };
      
      const response = await api.post('/transactions', transactionData);
      
      if (response.data && response.data.transaction) {
        setLastTransaction(response.data.transaction);
        setShowReceiptOptions(true);
      } else {
        alert("Venda realizada com sucesso!");
      }
      
      resetSaleState();

    } catch (error) {
      alert('Erro ao finalizar venda: ' + (error.response?.data?.error || error.message));
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleCancelTransaction = async (transactionId) => {
    if (!window.confirm("Tem certeza que deseja cancelar esta venda? O estoque dos produtos NÃO será revertido automaticamente.")) return;
    try {
      await api.delete(`/transactions/${transactionId}/cancel`);
      alert('Venda cancelada com sucesso!');
      fetchTransactions(currentTransactionPage, transactionSearchTerm, dateFilter);
    } catch (error) {
      alert('Erro ao cancelar venda: ' + (error.response?.data?.error || error.message));
    }
  };

  const getPaymentMethodIcon = (methodName) => {
    const name = methodName?.toLowerCase() || '';
    if (name.includes('dinheiro')) return <Banknote className="w-4 h-4" />;
    if (name.includes('débito')) return <CreditCard className="w-4 h-4" />;
    if (name.includes('crédito') || name.includes('crediário')) return <CreditCard className="w-4 h-4" />;
    if (name.includes('pix')) return <Smartphone className="w-4 h-4" />;
    return <Banknote className="w-4 h-4" />;
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div><h1 className="text-3xl font-bold text-gray-900">Vendas e Desempenho</h1><p className="text-gray-600">Analise métricas, registre vendas e visualize o histórico.</p></div>
        <Button onClick={() => setShowNewSale(true)} className="bg-green-600 hover:bg-green-700"><Plus className="w-4 h-4 mr-2" /> Nova Venda</Button>
      </div>

      {showNewSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-[95vw] h-[90vh] overflow-hidden">
            <div className="flex h-full">
              <div className="flex-1 p-6 border-r flex flex-col">
                <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold">Selecionar Produtos</h2><Button variant="ghost" size="sm" onClick={resetSaleState}><X className="w-4 h-4" /></Button></div>
                <div className="mb-4"><div className="relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" /><Input placeholder="Buscar produtos..." value={productSearchTerm} onChange={(e) => setProductSearchTerm(e.target.value)} className="pl-10" /></div></div>
                <div className="flex-grow overflow-y-auto mb-4 border rounded-lg">
                  <Table><TableHeader className="sticky top-0 bg-gray-50"><TableRow><TableHead>Produto</TableHead><TableHead className="text-center">Estoque</TableHead><TableHead className="text-right">Preço</TableHead><TableHead className="text-center">Ação</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product.id}><TableCell><div>{product.name}</div><div className="text-xs text-gray-500">SKU: {product.sku}</div></TableCell><TableCell className="text-center"><Badge variant={product.stock_quantity > 0 ? "secondary" : "destructive"}>{product.stock_quantity}</Badge></TableCell><TableCell className="text-right font-semibold">{formatCurrency(product.price)}</TableCell><TableCell className="text-center"><Button size="sm" variant="outline" onClick={() => addToCart(product)} disabled={product.stock_quantity <= 0}><Plus className="w-4 h-4" /></Button></TableCell></TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <Pagination pagination={productPagination} onPageChange={setCurrentProductPage} itemName="produtos" />
              </div>
              <div className="w-[450px] p-6 bg-gray-50 flex flex-col">
                <h2 className="text-xl font-bold mb-4 flex items-center"><ShoppingCart className="w-5 h-5 mr-2" />Carrinho ({cart.reduce((acc, item) => acc + item.quantity, 0)})</h2>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1 text-gray-700">Cliente</label>
                  <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}><SelectTrigger><SelectValue placeholder="Selecione um cliente (opcional)" /></SelectTrigger><SelectContent><SelectItem value="none">Nenhum (Consumidor Final)</SelectItem>{customers.map(customer => (<SelectItem key={customer.id} value={customer.id.toString()}>{customer.name}</SelectItem>))}</SelectContent></Select>
                </div>
                <Separator />
                <div className="flex-grow space-y-3 my-4 overflow-y-auto">{cart.length === 0 ? (<div className="text-center text-gray-500 pt-10"><ShoppingCart className="w-10 h-10 mx-auto mb-2" /><p>Seu carrinho está vazio.</p></div>) : cart.map((item) => (<Card key={item.product_id}><CardContent className="p-3"><div className="flex justify-between items-start mb-2"><div className="flex-1"><h4 className="font-medium text-sm">{item.product_name}</h4><p className="text-xs text-gray-600">{formatCurrency(item.unit_price)} cada</p></div><Button size="icon" variant="ghost" onClick={() => removeFromCart(item.product_id)} className="text-red-600 hover:text-red-700 h-7 w-7"><Trash2 className="w-4 h-4" /></Button></div><div className="flex items-center justify-between"><div className="flex items-center space-x-2"><Button size="icon" variant="outline" onClick={() => updateCartQuantity(item.product_id, item.quantity - 1)} className="h-7 w-7"><Minus className="w-3 h-3" /></Button><span className="w-8 text-center text-sm font-bold">{item.quantity}</span><Button size="icon" variant="outline" onClick={() => updateCartQuantity(item.product_id, item.quantity + 1)} className="h-7 w-7"><Plus className="w-3 h-3" /></Button></div><span className="font-semibold text-sm">{formatCurrency(item.unit_price * item.quantity)}</span></div></CardContent></Card>))}</div>
                <div className="mt-auto">
                  <Separator className="my-4" /><div className="mb-4"><label className="block text-sm font-medium mb-2">Desconto (%)</label><Input type="number" min="0" max="100" value={discountPercent} onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)} /></div>
                  <div className="space-y-2 mb-4 p-3 bg-white rounded border"><div className="flex justify-between text-sm"><span>Subtotal:</span><span>{formatCurrency(calculateSubtotal())}</span></div>{discountPercent > 0 && (<div className="flex justify-between text-sm text-red-600"><span>Desconto:</span><span>-{formatCurrency(calculateDiscount())}</span></div>)}<Separator /><div className="flex justify-between font-bold text-lg"><span>Total a Pagar:</span><span>{formatCurrency(calculateTotal())}</span></div><div className="flex justify-between text-sm text-blue-600"><span>Total Pago:</span><span>{formatCurrency(totalPaid)}</span></div><div className="flex justify-between text-sm font-bold text-orange-600"><span>Restante:</span><span>{formatCurrency(remainingToPay)}</span></div></div>
                  <div className="mb-4"><label className="block text-sm font-medium mb-2">Adicionar Pagamento</label><div className="flex items-center space-x-2"><Select value={currentPaymentMethodId} onValueChange={setCurrentPaymentMethodId}><SelectTrigger><SelectValue placeholder="Método" /></SelectTrigger><SelectContent>{paymentMethods.map(method => (<SelectItem key={method.id} value={method.id.toString()}>{method.name}</SelectItem>))}</SelectContent></Select><Input type="number" placeholder="Valor" value={currentPaymentAmount} onChange={(e) => setCurrentPaymentAmount(e.target.value)} /><Button onClick={handleAddPayment}><Plus className="w-4 h-4" /></Button></div></div>
                  <div className="space-y-2 mb-4 max-h-24 overflow-y-auto">{payments.map((p, index) => (<div key={index} className="flex justify-between items-center p-2 bg-gray-100 rounded-md text-sm"><div className="flex items-center">{getPaymentMethodIcon(p.name)}<span className="ml-2 capitalize">{p.name}{p.installments > 1 && ` (${p.installments}x)`}</span></div><div className="flex items-center"><span className="font-semibold">{formatCurrency(p.amount)}</span><Button size="icon" variant="ghost" className="h-6 w-6 ml-2" onClick={() => handleRemovePayment(index)}><Trash2 className="w-4 h-4 text-red-500" /></Button></div></div>))}</div>
                  <div className="space-y-2"><Button onClick={handleFinalizeSale} disabled={submitting || cart.length === 0 || Math.abs(remainingToPay) > 0.01} className="w-full bg-green-600 h-12 text-base"><Calculator className="w-5 h-5 mr-2" />{submitting ? 'Finalizando...' : 'Finalizar Venda'}</Button><Button variant="outline" onClick={resetSaleState} className="w-full h-12 text-base">Cancelar</Button></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {showInstallmentModal && (
        <Modal 
          open={showInstallmentModal} 
          onClose={() => setShowInstallmentModal(false)} 
          title={`Definir Parcelas para ${currentPaymentForInstallments?.name}`}
        >
          <div className="space-y-4 p-2">
            <p>Valor a parcelar: <strong>{formatCurrency(currentPaymentForInstallments?.amount)}</strong></p>
            <div>
              <label htmlFor="installments" className="block text-sm font-medium text-gray-700 mb-1">Número de Parcelas</label>
              <Input id="installments" type="number" min="1" value={installments} onChange={(e) => setInstallments(Math.max(1, parseInt(e.target.value, 10) || 1))} className="w-full" />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="ghost" onClick={() => setShowInstallmentModal(false)}>Cancelar</Button>
              <Button onClick={handleConfirmInstallments}>Confirmar Parcelas</Button>
            </div>
          </div>
        </Modal>
      )}

      {showReceiptOptions && lastTransaction && (
        <Modal open={showReceiptOptions} onClose={() => { setShowReceiptOptions(false); setLastTransaction(null); }} title="Gerar Comprovante">
          <ReceiptOptionsModal
            transaction={lastTransaction}
            onPrint={() => { handlePrintReceipt(lastTransaction); setShowReceiptOptions(false); setLastTransaction(null); }}
            onPDF={() => { exportToPDF([lastTransaction], dateFilter); setShowReceiptOptions(false); setLastTransaction(null); }}
            onClose={() => { setShowReceiptOptions(false); setLastTransaction(null); }}
          />
        </Modal>
      )}

      <Dashboard transactions={transactions} />

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div><CardTitle>Histórico de Vendas</CardTitle><CardDescription>Visualize ou filtre as vendas realizadas</CardDescription></div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={() => exportToPDF(transactions, dateFilter)} disabled={transactions.length === 0}><FileDown className="w-4 h-4 mr-2" />Exportar PDF</Button>
              <div className="flex items-center gap-2"><Input type="date" name="start" value={dateFilter.start} onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))} /><span className="text-gray-500">até</span><Input type="date" name="end" value={dateFilter.end} onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))} /></div>
              <div className="relative w-full sm:w-64"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" /><Input placeholder="Buscar..." value={transactionSearchTerm} onChange={(e) => setTransactionSearchTerm(e.target.value)} className="pl-10" /></div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (<div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div><p className="mt-2 text-gray-600">Carregando transações...</p></div>) : transactions.length === 0 ? (<div className="text-center py-8"><ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" /><h3 className="text-lg font-medium">Nenhuma venda encontrada</h3><p className="text-gray-600">Tente um termo de busca ou período diferente.</p></div>) : (
            <>
              <div className="space-y-2">
                {transactions.map((transaction) => {
                  const isCancelled = transaction.status === 'CANCELADO';
                  return (
                    <Card key={transaction.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-0">
                        <div className="p-4 cursor-pointer" onClick={() => toggleTransactionDetails(transaction.id)}>
                          <div className="flex justify-between items-start">
                            <div><div className="flex items-center space-x-2 mb-1"><Badge variant="outline">Venda #{transaction.sale_number}</Badge><Badge variant={isCancelled ? 'destructive' : 'secondary'}>{transaction.status}</Badge></div><p className="text-sm text-gray-600">{formatDate(transaction.transaction_date)} • {transaction.cashier_name}</p></div>
                            <div className="flex items-center"><div className="text-right mr-4"><div className={`font-bold text-lg ${isCancelled ? 'text-gray-500 line-through' : 'text-green-600'}`}>{formatCurrency(transaction.total_amount)}</div><div className="flex items-center justify-end text-sm text-gray-600 space-x-2">{(transaction.payments || []).map((p, index) => <div key={index}>{getPaymentMethodIcon(p.payment_method_name)}</div>)}</div></div><ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${expandedTransactionId === transaction.id ? 'rotate-180' : ''}`} /></div>
                          </div>
                        </div>
                        {expandedTransactionId === transaction.id && (
                          <div className="border-t mt-0 pt-4 px-4 pb-4">
                            {transaction.customer_name && <p className="text-sm text-gray-700 mb-2"><b>Cliente:</b> {transaction.customer_name}</p>}
                            <p className="text-sm font-medium">Itens da Venda:</p>
                            <div className="space-y-1 text-sm text-gray-700 mb-4">{(transaction.items || []).map((item, index) => (<div key={index} className="flex justify-between"><span>{item.quantity}x {item.product_name}</span><span>{formatCurrency(item.subtotal)}</span></div>))}</div>
                            <p className="text-sm font-medium mb-2">Pagamentos:</p>
                            <div className="space-y-1 text-sm text-gray-700 mb-3">{(transaction.payments || []).map((p, index) => (<div key={index} className="flex justify-between"><span className="capitalize">{p.payment_method_name}</span><span>{formatCurrency(p.amount)}</span></div>))}</div>
                            <Separator className="mb-3" />
                            <div className="flex items-center justify-end space-x-2">
                              <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handlePrintReceipt(transaction); }}><Printer className="w-4 h-4 mr-2" />Imprimir Recibo</Button>
                              {!isCancelled && (<Button variant="destructive" size="sm" onClick={(e) => { e.stopPropagation(); handleCancelTransaction(transaction.id); }}><Ban className="w-4 h-4 mr-2" />Cancelar Venda</Button>)}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              {transactionPagination && transactionPagination.pages > 1 && (
                <Pagination pagination={transactionPagination} onPageChange={setCurrentTransactionPage} itemName='vendas' />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Transactions;
