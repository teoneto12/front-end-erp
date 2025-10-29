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
import { Plus, Search, ShoppingCart, Trash2, X, Minus, Calculator, Printer, Ban, FileDown, Banknote, CreditCard, Smartphone, FileText, ChevronDown, User, Repeat, ArrowUpCircle, ArrowDownCircle, DoorClosed, Loader2, Store } from 'lucide-react';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import '../App.css';

// Importações adicionais
import Dashboard from '../components/Dashboard'; 
import { exportToPDF } from '../lib/pdfGenerator.js';

// ==================================================================
// COMPONENTES DE MODAIS (Não precisam de alteração)
// ==================================================================
const ReceiptOptionsModal = ({ transaction, change, onPrint, onPDF, onClose }) => {
  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);
  return (
    <div className="space-y-4">
      <p className="text-center text-xl font-semibold">Venda #{transaction.sale_number} finalizada!</p>
      {change > 0 && <div className="text-center text-2xl font-bold text-green-600 bg-green-50 p-3 rounded-lg">Troco: {formatCurrency(change)}</div>}
      <p className="text-center text-gray-600 pt-2">Como você deseja gerar o comprovante?</p>
      <div className="flex justify-center gap-4 pt-2">
        <Button onClick={onPrint} className="bg-blue-600 hover:bg-blue-700"><Printer className="w-4 h-4 mr-2" />Imprimir Cupom</Button>
        <Button onClick={onPDF} variant="outline"><FileText className="w-4 h-4 mr-2" />Gerar PDF</Button>
      </div>
      <div className="text-center pt-2"><Button variant="ghost" onClick={onClose}>Fechar</Button></div>
    </div>
  );
};

const OpenCashierModal = ({ onOpen, openingBalance, setOpeningBalance, isOpening }) => (
  <form onSubmit={(e) => { e.preventDefault(); onOpen(); }} className="space-y-4">
    <h3 className="text-lg font-medium text-center">Abertura de Caixa</h3>
    <p className="text-sm text-gray-600 text-center">Informe o valor inicial do troco para começar o expediente.</p>
    <div>
      <label htmlFor="opening_balance" className="block text-sm font-medium text-gray-700 mb-1">Valor de Abertura (R$)</label>
      <Input id="opening_balance" type="number" step="0.01" value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)} placeholder="Ex: 100.00" required autoFocus />
    </div>
    <Button type="submit" className="w-full" disabled={isOpening}>{isOpening ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Abrindo...</> : 'Abrir Caixa'}</Button>
  </form>
);

const CashMovementModal = ({ type, onConfirm, onCancel }) => {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  return (
    <form onSubmit={(e) => { e.preventDefault(); onConfirm({ amount, reason }); }} className="space-y-4">
      <h3 className="text-lg font-medium">{type === 'SANGRIA' ? 'Registrar Sangria (Retirada)' : 'Registrar Suprimento (Entrada)'}</h3>
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
        <Input id="amount" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
      </div>
      <div>
        <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
        <Input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} required />
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">Confirmar</Button>
      </div>
    </form>
  );
};

const CloseCashierModal = ({ onConfirm, summary, onClose, isClosing, paymentMethods }) => {
    const [informedTotals, setInformedTotals] = useState({});
    const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);

    const handleInputChange = (methodName, value) => {
        setInformedTotals(prev => ({ ...prev, [methodName]: value }));
    };

    if (summary) {
        const expectedCash = parseFloat(summary.opening_balance) + (summary.calculated_totals_by_method?.['Dinheiro'] || 0) + parseFloat(summary.calculated_supplies) - parseFloat(summary.calculated_withdrawals);
        const differenceColor = summary.difference > 0.01 ? 'text-green-600' : summary.difference < -0.01 ? 'text-red-600' : 'text-gray-800';
        
        return (
            <div className="space-y-4">
                <h3 className="text-lg font-medium text-center">Fechamento de Caixa</h3>
                <div className="p-4 border rounded-lg space-y-2 bg-gray-50">
                    <div className="flex justify-between font-bold"><span>Resumo do Caixa (Dinheiro)</span></div>
                    <div className="flex justify-between"><span>Saldo Inicial:</span><span>{formatCurrency(summary.opening_balance)}</span></div>
                    <div className="flex justify-between"><span>(+) Vendas em Dinheiro:</span><span>{formatCurrency(summary.calculated_totals_by_method?.['Dinheiro'] || 0)}</span></div>
                    <div className="flex justify-between"><span>(+) Suprimentos:</span><span>{formatCurrency(summary.calculated_supplies)}</span></div>
                    <div className="flex justify-between"><span>(-) Sangrias:</span><span>-{formatCurrency(summary.calculated_withdrawals)}</span></div>
                    <Separator />
                    <div className="flex justify-between font-bold"><span>Saldo Esperado (Sistema):</span><span>{formatCurrency(expectedCash)}</span></div>
                    <div className="flex justify-between font-bold"><span>Saldo Informado (Gaveta):</span><span>{formatCurrency(summary.informed_totals_by_method?.['Dinheiro'] || 0)}</span></div>
                    <Separator />
                    <div className={`flex justify-between text-lg font-bold ${differenceColor}`}>
                        <span>{summary.difference > 0.01 ? 'Sobra:' : summary.difference < -0.01 ? 'Quebra:' : 'Diferença:'}</span>
                        <span>{formatCurrency(summary.difference)}</span>
                    </div>
                </div>
                <details>
                    <summary className="cursor-pointer text-sm text-blue-600">Ver totais de outras formas de pagamento</summary>
                    <div className="p-2 border rounded-md mt-2 bg-gray-50 text-sm space-y-1">
                        {Object.keys(summary.calculated_totals_by_method || {})
                            .filter(method => method !== 'Dinheiro')
                            .map(method => (
                                <div key={method} className="flex justify-between">
                                    <span>{method}:</span>
                                    <span>{formatCurrency(summary.calculated_totals_by_method[method])}</span>
                                </div>
                            ))
                        }
                    </div>
                </details>
                <Button onClick={onClose} className="w-full">Finalizar e Sair</Button>
            </div>
        );
    }

    return (
        <form onSubmit={(e) => { e.preventDefault(); onConfirm(informedTotals); }} className="space-y-6">
            <div className="text-center">
                <h3 className="text-lg font-medium">Fechar Caixa</h3>
                <p className="text-sm text-gray-600">Informe os valores totais contados para cada forma de pagamento.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 max-h-64 overflow-y-auto p-1">
                {paymentMethods.map(method => (
                    <div key={method.id}>
                        <label htmlFor={`method-${method.id}`} className="block text-sm font-medium text-gray-700 mb-1">{method.name}</label>
                        <Input
                            id={`method-${method.id}`}
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            onChange={(e) => handleInputChange(method.name, e.target.value)}
                            className="text-right"
                        />
                    </div>
                ))}
            </div>
            <Button type="submit" className="w-full" disabled={isClosing}>{isClosing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Fechando...</> : 'Gerar Relatório de Fechamento'}</Button>
        </form>
    );
};

// ==================================================================
// COMPONENTE PRINCIPAL (Transactions) - O GERENCIADOR DE CAIXA
// ==================================================================
const Transactions = () => {
  // --- ESTADOS DE CONTROLE DE CAIXA ---
  const [activeSession, setActiveSession] = useState(null);
  const [isCashierOpen, setIsCashierOpen] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [openingBalance, setOpeningBalance] = useState('');
  const [isOpening, setIsOpening] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(null);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeSummary, setCloseSummary] = useState(null);
  const [isClosing, setIsClosing] = useState(false);

  // --- ESTADOS DO DASHBOARD E HISTÓRICO ---
  const [transactions, setTransactions] = useState([]);
  const [transactionPagination, setTransactionPagination] = useState(null);
  const [transactionSearchTerm, setTransactionSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [expandedTransactionId, setExpandedTransactionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTransactionPage, setCurrentTransactionPage] = useState(1);

  // --- ESTADOS DO PDV (MODAL DE VENDA) ---
  const [showPDV, setShowPDV] = useState(false);
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
  
  // --- ESTADOS DO MODAL DE RECIBO ---
  const [showReceiptOptions, setShowReceiptOptions] = useState(false);
  const [lastTransaction, setLastTransaction] = useState(null);
  const [lastChange, setLastChange] = useState(0);

  // --- FUNÇÕES DE CONTROLE DE CAIXA ---
  const checkSessionStatus = useCallback(async () => {
    setCheckingSession(true);
    try {
      const { data } = await api.get('/cashier-sessions/status');
      setIsCashierOpen(data.isOpen);
      setActiveSession(data.session);
    } catch (error) {
      console.error("Erro ao verificar sessão do caixa:", error);
      setIsCashierOpen(false);
    } finally {
      setCheckingSession(false);
    }
  }, []);

  const handleOpenCashier = async () => {
    setIsOpening(true);
    try {
      const { data } = await api.post('/cashier-sessions/open', { opening_balance: openingBalance });
      setActiveSession(data.session);
      setIsCashierOpen(true);
      setShowOpenModal(false); // Fecha o modal de abertura
      setShowPDV(true); // Abre o PDV automaticamente
    } catch (error) {
      alert(`Erro ao abrir caixa: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsOpening(false);
    }
  };

  const handleCreateMovement = async ({ amount, reason }) => {
    try {
      await api.post('/cash-movements', {
        session_id: activeSession.id,
        type: showMovementModal,
        amount,
        reason
      });
      alert(`Movimentação (${showMovementModal}) registrada com sucesso!`);
      setShowMovementModal(null);
    } catch (error) {
      alert(`Erro ao registrar movimentação: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleCloseCashier = async (informedTotals) => {
    setIsClosing(true);
    try {
      const numericTotals = Object.entries(informedTotals).reduce((acc, [key, value]) => {
        acc[key] = parseFloat(value) || 0;
        return acc;
      }, {});
      const { data } = await api.put('/cashier-sessions/close', { informed_totals: numericTotals });
      setCloseSummary(data.summary);
    } catch (error) {
      alert(`Erro ao fechar caixa: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsClosing(false);
    }
  };

  const handleFrenteDeLojaClick = () => {
    if (isCashierOpen) {
      setShowPDV(true);
    } else {
      setShowOpenModal(true);
    }
  };
  
  const logoutAndReset = () => {
    window.location.reload();
  };

  // --- FUNÇÕES DE BUSCA (API) ---
  const fetchTransactions = useCallback(async (page = 1, search = '', dates = {}) => {
    setLoading(true);
    try {
      const params = { page, limit: 5, search, start_date: dates.start || undefined, end_date: dates.end || undefined };
      const response = await api.get('/transactions', { params });
      setTransactions(response.data.transactions || []);
      setTransactionPagination(response.data.pagination || null);
    } catch (error) { console.error('Erro ao carregar transações:', error); setTransactions([]); } finally { setLoading(false); }
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
      const response = await api.get('/payment-methods', { params: { is_active: true } });
      setPaymentMethods(response.data.paymentMethods || []);
    } catch (error) { console.error('Erro ao carregar formas de pagamento:', error); }
  }, []);

  const fetchCustomers = useCallback(async () => {
    try {
      const response = await api.get('/customers', { params: { limit: 1000 } });
      setCustomers(response.data.customers || []);
    } catch (error) { console.error('Erro ao carregar clientes:', error); }
  }, []);

  // --- EFEITOS ---
  useEffect(() => {
    checkSessionStatus();
    fetchTransactions(currentTransactionPage, transactionSearchTerm, dateFilter);
    fetchPaymentMethods();
  }, [currentTransactionPage, transactionSearchTerm, dateFilter, checkSessionStatus, fetchTransactions, fetchPaymentMethods]);

  useEffect(() => {
    if (showPDV) {
      fetchProducts(currentProductPage, productSearchTerm);
      fetchCustomers();
    }
  }, [showPDV, currentProductPage, productSearchTerm, fetchProducts, fetchCustomers]);

  // --- FUNÇÕES DE LÓGICA DO PDV ---
  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);
  const formatDate = (dateString) => new Date(dateString).toLocaleString('pt-BR');
  const toggleTransactionDetails = (id) => setExpandedTransactionId(prevId => (prevId === id ? null : id));

  const handlePrintReceipt = (transaction, change = 0) => {
    // ... (código da função de impressão permanece o mesmo)
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

  const subtotal = cart.reduce((total, item) => total + (item.unit_price * item.quantity), 0);
  const discountAmount = subtotal * (discountPercent / 100);
  const totalAmount = subtotal - discountAmount;
  const totalPaid = payments.reduce((acc, p) => acc + parseFloat(p.amount || 0), 0);
  const remainingToPay = totalAmount - totalPaid;
  const changeDue = Math.max(0, totalPaid - totalAmount);

  const handleAddPayment = () => {
    const amount = parseFloat(currentPaymentAmount);
    if (!currentPaymentMethodId) return alert("Selecione uma forma de pagamento.");
    if (!amount || amount <= 0) return alert("Insira um valor de pagamento válido.");
    const selectedMethod = paymentMethods.find(m => m.id.toString() === currentPaymentMethodId);
    if (!selectedMethod) return alert("Forma de pagamento inválida.");
    if (selectedMethod.type === 'credito_loja') {
      if (!selectedCustomerId || selectedCustomerId === 'none') return alert("Por favor, selecione um cliente para vendas em Crédito Loja.");
      if (amount > remainingToPay + 0.01) return alert("O valor do pagamento em Crédito Loja não pode ser maior que o valor restante.");
      setCurrentPaymentForInstallments({ payment_method_id: selectedMethod.id, name: selectedMethod.name, amount, type: selectedMethod.type });
      setShowInstallmentModal(true);
    } else {
      setPayments([...payments, { payment_method_id: selectedMethod.id, name: selectedMethod.name, amount, type: selectedMethod.type }]);
      setCurrentPaymentAmount('');
    }
  };

  const handleConfirmInstallments = () => {
    if (!currentPaymentForInstallments || !installments || installments < 1) return alert("Número de parcelas inválido.");
    setPayments([...payments, { ...currentPaymentForInstallments, installments }]);
    setShowInstallmentModal(false);
    setCurrentPaymentForInstallments(null);
    setInstallments(1);
    setCurrentPaymentAmount('');
  };

  const handleRemovePayment = (indexToRemove) => setPayments(payments.filter((_, index) => index !== indexToRemove));

  const resetPDVFields = () => {
    setCart([]); setDiscountPercent(0); setPayments([]); setCurrentPaymentAmount('');
    setSelectedCustomerId('none');
    const pdvMethods = paymentMethods.filter(m => m.show_in_pdv);
    if (pdvMethods.length > 0) setCurrentPaymentMethodId(pdvMethods[0].id.toString());
    setProductSearchTerm(''); setCurrentProductPage(1); setLastChange(0);
  };

  const handleFinalizeSale = async () => {
    if (cart.length === 0) return alert('Adicione produtos ao carrinho');
    if (remainingToPay > 0.01) return alert("Ainda falta pagar " + formatCurrency(remainingToPay));
    const hasReceivablePayment = payments.some(p => {
        const method = paymentMethods.find(m => m.id === p.payment_method_id);
        return method && method.type === 'credito_loja';
    });
    if (hasReceivablePayment && (!selectedCustomerId || selectedCustomerId === 'none')) return alert("Uma forma de pagamento em Crédito Loja foi usada, mas nenhum cliente foi selecionado.");
    setSubmitting(true);
    try {
      const transactionData = {
        customer_id: selectedCustomerId === 'none' ? null : parseInt(selectedCustomerId, 10),
        items: cart.map(item => ({ product_id: item.product_id, quantity: item.quantity, unit_price: item.unit_price })),
        payments: payments.map(p => ({ payment_method_id: p.payment_method_id, amount: p.amount, installments: p.installments || 1 })),
        discount_percent: discountPercent,
      };
      const response = await api.post('/transactions', transactionData);
      const finalChange = Math.max(0, totalPaid - totalAmount);
      setLastChange(finalChange);
      setLastTransaction(response.data.transaction);
      setShowReceiptOptions(true);
      resetPDVFields();
      fetchTransactions(1);
    } catch (error) {
      alert('Erro ao finalizar venda: ' + (error.response?.data?.error || error.message));
    } finally {
      setSubmitting(false);
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

  // --- RENDERIZAÇÃO ---
  if (checkingSession) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="w-10 h-10 animate-spin text-gray-400" /></div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* CABEÇALHO PRINCIPAL COM AÇÕES E BOTÃO PARA ABRIR O PDV */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Caixa</h1>
          {isCashierOpen ? (
            <p className="text-gray-600">Sessão iniciada por <strong>{activeSession?.user_name || 'Usuário'}</strong>. Saldo de abertura: {formatCurrency(activeSession?.opening_balance)}</p>
          ) : (
            <p className="text-gray-600">O caixa está fechado. Clique em "Frente de Loja" para iniciar uma nova sessão.</p>
          )}
        </div>
        <Button onClick={handleFrenteDeLojaClick} className="bg-green-600 hover:bg-green-700 py-6 text-lg">
          <Store className="w-6 h-6 mr-3" />
          Frente de Loja
        </Button>
      </div>

      {/* MODAL DO PDV (FRENTE DE LOJA) */}
      {showPDV && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-[95vw] h-[90vh] overflow-hidden flex flex-col">
            <header className="flex justify-between items-center p-3 border-b">
                <h2 className="text-xl font-bold">Frente de Loja</h2>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setShowMovementModal('SUPRIMENTO')}><ArrowUpCircle className="w-4 h-4 mr-2" />Suprimento</Button>
                    <Button variant="outline" onClick={() => setShowMovementModal('SANGRIA')} className="text-orange-600 border-orange-300 hover:bg-orange-50 hover:text-orange-700"><ArrowDownCircle className="w-4 h-4 mr-2" />Sangria</Button>
                    <Button variant="destructive" onClick={() => setShowCloseModal(true)}><DoorClosed className="w-4 h-4 mr-2" />Fechar Caixa</Button>
                    <Button variant="ghost" size="icon" onClick={() => setShowPDV(false)}><X className="w-5 h-5" /></Button>
                </div>
            </header>
            
            <main className="flex-grow flex overflow-hidden">
              <div className="flex-1 p-4 border-r flex flex-col">
                <div className="mb-4"><div className="relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" /><Input placeholder="Buscar produtos..." value={productSearchTerm} onChange={(e) => setProductSearchTerm(e.target.value)} className="pl-10" /></div></div>
                <div className="flex-grow overflow-y-auto mb-4 border rounded-lg">
                  <Table><TableHeader className="sticky top-0 bg-gray-50 z-10"><TableRow><TableHead>Produto</TableHead><TableHead className="text-center">Estoque</TableHead><TableHead className="text-right">Preço</TableHead><TableHead className="text-center">Ação</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product.id}><TableCell><div>{product.name}</div><div className="text-xs text-gray-500">SKU: {product.sku}</div></TableCell><TableCell className="text-center"><Badge variant={product.stock_quantity > 0 ? "secondary" : "destructive"}>{product.stock_quantity}</Badge></TableCell><TableCell className="text-right font-semibold">{formatCurrency(product.price)}</TableCell><TableCell className="text-center"><Button size="sm" variant="outline" onClick={() => addToCart(product)} disabled={product.stock_quantity <= 0}><Plus className="w-4 h-4" /></Button></TableCell></TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <Pagination pagination={productPagination} onPageChange={setCurrentProductPage} itemName="produtos" />
              </div>

              <div className="w-[450px] bg-gray-50 p-4 flex flex-col">
                <h2 className="text-xl font-bold mb-4 flex items-center"><ShoppingCart className="w-5 h-5 mr-2" />Carrinho ({cart.reduce((acc, item) => acc + item.quantity, 0)})</h2>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1 text-gray-700">Cliente</label>
                  <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}><SelectTrigger><SelectValue placeholder="Selecione um cliente (opcional)" /></SelectTrigger><SelectContent><SelectItem value="none">Nenhum (Consumidor Final)</SelectItem>{customers.map(customer => (<SelectItem key={customer.id} value={customer.id.toString()}>{customer.name}</SelectItem>))}</SelectContent></Select>
                </div>
                <Separator />
                <div className="flex-grow space-y-3 my-4 overflow-y-auto">
                  {cart.length === 0 ? (
                    <div className="text-center text-gray-500 pt-10">
                      <ShoppingCart className="w-10 h-10 mx-auto mb-2" />
                      <p>Seu carrinho está vazio.</p>
                    </div>
                  ) : cart.map((item) => (
                    <Card key={item.product_id}>
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{item.product_name}</h4>
                            <p className="text-xs text-gray-600">{formatCurrency(item.unit_price)} cada</p>
                          </div>
                          <Button size="icon" variant="ghost" onClick={() => removeFromCart(item.product_id)} className="text-red-600 hover:text-red-700 h-7 w-7">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Button size="icon" variant="outline" onClick={() => updateCartQuantity(item.product_id, item.quantity - 1)} className="h-7 w-7">
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                            <Button size="icon" variant="outline" onClick={() => updateCartQuantity(item.product_id, item.quantity + 1)} className="h-7 w-7">
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                          <span className="font-semibold text-sm">{formatCurrency(item.unit_price * item.quantity)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="mt-auto">
                  <Separator className="my-4" />
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Desconto (%)</label>
                    <Input type="number" min="0" max="100" value={discountPercent} onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="space-y-2 mb-4 p-3 bg-gray-100 rounded border">
                    <div className="flex justify-between text-sm"><span>Subtotal:</span><span>{formatCurrency(subtotal)}</span></div>
                    {discountPercent > 0 && (<div className="flex justify-between text-sm text-red-600"><span>Desconto:</span><span>-{formatCurrency(discountAmount)}</span></div>)}
                    <Separator />
                    <div className="flex justify-between font-bold text-lg"><span>Total a Pagar:</span><span>{formatCurrency(totalAmount)}</span></div>
                    <div className="flex justify-between text-sm text-blue-600"><span>Total Pago:</span><span>{formatCurrency(totalPaid)}</span></div>
                    {remainingToPay > 0 ? (
                      <div className="flex justify-between text-sm font-bold text-orange-600"><span>Restante:</span><span>{formatCurrency(remainingToPay)}</span></div>
                    ) : (
                      <div className="flex justify-between text-sm font-bold text-green-600"><span>Troco:</span><span>{formatCurrency(changeDue)}</span></div>
                    )}
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Adicionar Pagamento</label>
                    <div className="flex items-center space-x-2">
                      <Select value={currentPaymentMethodId} onValueChange={setCurrentPaymentMethodId}>
                        <SelectTrigger className="flex-1 w-full"><SelectValue placeholder="Método" /></SelectTrigger>
                        <SelectContent>{paymentMethods.filter(m => m.show_in_pdv).map(method => (<SelectItem key={method.id} value={method.id.toString()}>{method.name}</SelectItem>))}</SelectContent>
                      </Select>
                      <Input className="w-28 text-right" type="number" placeholder="Valor" value={currentPaymentAmount} onChange={(e) => setCurrentPaymentAmount(e.target.value)} />
                      <Button onClick={handleAddPayment}><Plus className="w-4 h-4" /></Button>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4 max-h-24 overflow-y-auto">
                    {payments.map((p, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-100 rounded-md text-sm">
                        <div className="flex items-center">
                          {getPaymentMethodIcon(p.name)}
                          <span className="ml-2 capitalize">{p.name}{p.installments > 1 && ` (${p.installments}x)`}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="font-semibold">{formatCurrency(p.amount)}</span>
                          <Button size="icon" variant="ghost" className="h-6 w-6 ml-2" onClick={() => handleRemovePayment(index)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <Button onClick={handleFinalizeSale} disabled={submitting || cart.length === 0 || remainingToPay > 0.01} className="w-full bg-green-600 h-12 text-base">
                      <Calculator className="w-5 h-5 mr-2" />
                      {submitting ? 'Finalizando...' : 'Finalizar Venda'}
                    </Button>
                    <Button variant="outline" onClick={resetPDVFields} className="w-full h-12 text-base">Cancelar</Button>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      )}

      {/* MODAIS GLOBAIS */}
      {showOpenModal && (
        <Modal open={showOpenModal} onClose={() => setShowOpenModal(false)} title="Abrir Caixa" maxWidth="max-w-md">
          <OpenCashierModal onOpen={handleOpenCashier} openingBalance={openingBalance} setOpeningBalance={setOpeningBalance} isOpening={isOpening} />
        </Modal>
      )}

      {showInstallmentModal && (
        <Modal open={showInstallmentModal} onClose={() => setShowInstallmentModal(false)} title={`Definir Parcelas para ${currentPaymentForInstallments?.name}`} maxWidth="max-w-md">
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
        <Modal open={showReceiptOptions} onClose={() => { setShowReceiptOptions(false); setLastTransaction(null); }} title="Venda Concluída" maxWidth="max-w-md">
          <ReceiptOptionsModal
            transaction={lastTransaction}
            change={lastChange}
            onPrint={() => { handlePrintReceipt(lastTransaction, lastChange); setShowReceiptOptions(false); setLastTransaction(null); }}
            onPDF={() => { exportToPDF([lastTransaction]); setShowReceiptOptions(false); setLastTransaction(null); }}
            onClose={() => { setShowReceiptOptions(false); setLastTransaction(null); }}
          />
        </Modal>
      )}

      {/* DEPOIS (Correto) */}
      {showMovementModal && (
        <Modal open={!!showMovementModal} onClose={() => setShowMovementModal(null)} title={`Registrar ${showMovementModal === 'SANGRIA' ? 'Sangria' : 'Suprimento'}`} maxWidth="max-w-md">
          <CashMovementModal type={showMovementModal} onConfirm={handleCreateMovement} onCancel={() => setShowMovementModal(null)} />
        </Modal>
      )}


      {/* DEPOIS (Correto) */}
      {showCloseModal && (
        <Modal open={showCloseModal} onClose={() => {
          if (closeSummary) { logoutAndReset(); }
          else { setShowCloseModal(false); }
        }}
        maxWidth="max-w-lg" 
        >
          <CloseCashierModal 
            summary={closeSummary} 
            onConfirm={handleCloseCashier} 
            onClose={logoutAndReset}
            isClosing={isClosing}
            paymentMethods={paymentMethods}
          />
        </Modal>
      )}


      {/* Conteúdo Principal: Dashboard e Histórico de Vendas */}
      <div className="flex-grow flex flex-col gap-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            <Dashboard transactions={transactions} />
            
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div><CardTitle>Histórico de Vendas</CardTitle><CardDescription>Visualize todas as vendas realizadas</CardDescription></div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                    <Button variant="outline" onClick={() => exportToPDF(transactions, dateFilter)} disabled={transactions.length === 0}><FileDown className="w-4 h-4 mr-2" />Exportar PDF</Button>
                    <div className="flex items-center gap-2">
                        <Input type="date" name="start" value={dateFilter.start} onChange={(e) => setDateFilter(prev => ({...prev, start: e.target.value}))} />
                        <span className="text-gray-500">até</span>
                        <Input type="date" name="end" value={dateFilter.end} onChange={(e) => setDateFilter(prev => ({...prev, end: e.target.value}))} />
                    </div>
                    <div className="relative w-full sm:w-64"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" /><Input placeholder="Buscar..." value={transactionSearchTerm} onChange={(e) => setTransactionSearchTerm(e.target.value)} className="pl-10" /></div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {transactions.map((transaction) => {
                    const isCancelled = transaction.status === 'CANCELADO';
                    const totalPaid = (transaction.payments || []).reduce((acc, p) => acc + parseFloat(p.amount), 0);
                    const changeGiven = Math.max(0, totalPaid - transaction.total_amount);
                    const isInstallment = (transaction.payments || []).some(p => p.installments > 1);

                    return (
                      <Card key={transaction.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-0">
                          <div className="p-4 cursor-pointer" onClick={() => toggleTransactionDetails(transaction.id)}>
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center space-x-2 mb-1">
                                  <Badge variant="outline">Venda #{transaction.sale_number}</Badge>
                                  <Badge variant={isCancelled ? 'destructive' : 'secondary'}>{transaction.status}</Badge>
                                </div>
                                <p className="text-sm text-gray-600">{formatDate(transaction.transaction_date)} • {transaction.cashier_name}</p>
                                <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                                  {transaction.customer_name && (<div className="flex items-center"><User className="w-3 h-3 mr-1" /><span>{transaction.customer_name}</span></div>)}
                                  {isInstallment && (<Badge variant="outline" className="border-orange-400 text-orange-600"><Repeat className="w-3 h-3 mr-1" />Parcelado</Badge>)}
                                  {changeGiven > 0.01 && (<Badge variant="outline" className="border-green-400 text-green-600"><Banknote className="w-3 h-3 mr-1" />Troco: {formatCurrency(changeGiven)}</Badge>)}
                                </div>
                              </div>
                              <div className="flex items-center">
                                <div className="text-right mr-4">
                                  <div className={`font-bold text-lg ${isCancelled ? 'text-gray-500 line-through' : 'text-green-600'}`}>{formatCurrency(transaction.total_amount)}</div>
                                  <div className="flex items-center justify-end text-sm text-gray-600 space-x-2">
                                    {(transaction.payments || []).map((p, index) => <div key={index}>{getPaymentMethodIcon(p.payment_method_name)}</div>)}
                                  </div>
                                </div>
                                <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${expandedTransactionId === transaction.id ? 'rotate-180' : ''}`} />
                              </div>
                            </div>
                          </div>
                          {expandedTransactionId === transaction.id && (
                            <div className="border-t mt-0 pt-4 px-4 pb-4 bg-gray-50">
                              <p className="text-sm font-medium">Itens da Venda:</p>
                              <div className="space-y-1 text-sm text-gray-700 mb-4">
                                {(transaction.items || []).map((item, index) => (<div key={index} className="flex justify-between"><span>{item.quantity}x {item.product_name}</span><span>{formatCurrency(item.subtotal)}</span></div>))}
                              </div>
                              <p className="text-sm font-medium mb-2">Pagamentos:</p>
                              <div className="space-y-1 text-sm text-gray-700 mb-3">
                                {(transaction.payments || []).map((p, index) => (<div key={index} className="flex justify-between"><span className="capitalize">{p.payment_method_name}{p.installments > 1 ? ` (${p.installments}x)`: ''}</span><span>{formatCurrency(p.amount)}</span></div>))}
                              </div>
                              <Separator className="mb-3" />
                              <div className="flex items-center justify-end space-x-2">
                                <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handlePrintReceipt(transaction, changeGiven); }}><Printer className="w-4 h-4 mr-2" />Imprimir Recibo</Button>
                                {!isCancelled && (
                                  <Button variant="destructive" size="sm" onClick={(e) => { e.stopPropagation(); /* Adicionar handleCancelTransaction aqui */ }}>
                                    <Ban className="w-4 h-4 mr-2" />Cancelar Venda
                                  </Button>
                                )}
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
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default Transactions;
