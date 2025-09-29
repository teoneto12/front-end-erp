import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, ShoppingCart, Trash2, X, Minus, Calculator, CreditCard, Banknote, Smartphone } from 'lucide-react';
import api from '../lib/api.js';
import '../App.css';

const Transactions = () => {
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewSale, setShowNewSale] = useState(false);
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('dinheiro');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [receivedAmount, setReceivedAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchTransactions();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/transactions');
      setTransactions(response.data.transactions || []);
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.product_id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity < product.stock_quantity) {
        setCart(cart.map(item =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      } else {
        alert('Estoque insuficiente');
      }
    } else {
      if (product.stock_quantity > 0) {
        setCart([...cart, {
          product_id: product.id,
          product_name: product.name,
          unit_price: parseFloat(product.price),
          quantity: 1,
          stock_available: product.stock_quantity,
          sku: product.sku
        }]);
      } else {
        alert('Produto sem estoque');
      }
    }
  };

  const updateCartQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const item = cart.find(item => item.product_id === productId);
    if (newQuantity > item.stock_available) {
      alert('Quantidade maior que o estoque disponível');
      return;
    }

    setCart(cart.map(item =>
      item.product_id === productId
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => total + (item.unit_price * item.quantity), 0);
  };

  const calculateDiscount = () => {
    return calculateSubtotal() * (discountPercent / 100);
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount();
  };

  const calculateChange = () => {
    if (paymentMethod !== 'dinheiro' || !receivedAmount) return 0;
    return parseFloat(receivedAmount) - calculateTotal();
  };

  const handleFinalizeSale = async () => {
    if (cart.length === 0) {
      alert('Adicione produtos ao carrinho');
      return;
    }

    if (paymentMethod === 'dinheiro' && (!receivedAmount || parseFloat(receivedAmount) < calculateTotal())) {
      alert('Valor recebido insuficiente');
      return;
    }

    setSubmitting(true);

    try {
      const transactionData = {
        items: cart.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price
        })),
        payment_method: paymentMethod,
        discount_percent: discountPercent,
        total_amount: calculateTotal()
      };

      await api.post('/transactions', transactionData);
      
      setCart([]);
      setPaymentMethod('dinheiro');
      setDiscountPercent(0);
      setReceivedAmount('');
      setShowNewSale(false);
      
      await fetchTransactions();
      await fetchProducts();
      
      alert('Venda realizada com sucesso!');
    } catch (error) {
      alert('Erro ao finalizar venda: ' + (error.response?.data?.error || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR');
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

  const paymentOptions = [
    { value: 'dinheiro', label: 'Dinheiro', icon: <Banknote className="w-5 h-5 mr-2" /> },
    { value: 'cartao_credito', label: 'Crédito', icon: <CreditCard className="w-5 h-5 mr-2" /> },
    { value: 'cartao_debito', label: 'Débito', icon: <CreditCard className="w-5 h-5 mr-2" /> },
    { value: 'pix', label: 'PIX', icon: <Smartphone className="w-5 h-5 mr-2" /> },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transações</h1>
          <p className="text-gray-600">Registre vendas e visualize o histórico</p>
        </div>
        <Button 
          onClick={() => setShowNewSale(true)}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Venda
        </Button>
      </div>

      {showNewSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-[95vw] h-[90vh] overflow-hidden">
            <div className="flex h-full">
              {/* Produtos e Pagamento */}
              <div className="flex-1 p-6 border-r flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Selecionar Produtos</h2>
                  <Button variant="ghost" size="sm" onClick={() => setShowNewSale(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Buscar produtos por nome ou SKU..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="flex-grow overflow-y-auto mb-4 border rounded-lg">
                  <Table>
                    <TableHeader className="sticky top-0 bg-gray-50">
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead className="text-center">Estoque</TableHead>
                        <TableHead className="text-right">Preço</TableHead>
                        <TableHead className="text-center">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((product) => (
                        <TableRow key={product.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-xs text-gray-500">SKU: {product.sku}</div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={product.stock_quantity > 0 ? "secondary" : "destructive"}>
                              {product.stock_quantity}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-green-600">
                            {formatCurrency(product.price)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button size="sm" variant="outline" onClick={() => addToCart(product)}>
                              <Plus className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                {/* NOVA ÁREA DE PAGAMENTO */}
                <div className="mt-auto pt-4 border-t">
                    <h3 className="text-lg font-semibold mb-3">Forma de Pagamento</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {paymentOptions.map((option) => (
                            <Button
                                key={option.value}
                                variant={paymentMethod === option.value ? 'default' : 'outline'}
                                onClick={() => setPaymentMethod(option.value)}
                                className="justify-start h-12 text-base"
                            >
                                {option.icon}
                                {option.label}
                            </Button>
                        ))}
                    </div>
                </div>
              </div>

              {/* Carrinho e Resumo */}
              <div className="w-96 p-6 bg-gray-50 flex flex-col">
                <h2 className="text-xl font-bold mb-4 flex items-center">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Carrinho ({cart.reduce((acc, item) => acc + item.quantity, 0)})
                </h2>

                <div className="flex-grow space-y-3 mb-4 overflow-y-auto">
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
                            <p className="text-xs text-gray-600">
                              {formatCurrency(item.unit_price)} cada
                            </p>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeFromCart(item.product_id)}
                            className="text-red-600 hover:text-red-700 h-7 w-7"
                          >
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
                          <span className="font-semibold text-sm">
                            {formatCurrency(item.unit_price * item.quantity)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="mt-auto">
                  <Separator className="my-4" />

                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Desconto (%)</label>
                    <Input
                      type="number" min="0" max="100"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>

                  {paymentMethod === 'dinheiro' && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">Valor Recebido</label>
                      <Input
                        type="number" step="0.01"
                        value={receivedAmount}
                        onChange={(e) => setReceivedAmount(e.target.value)}
                        placeholder="0,00"
                      />
                    </div>
                  )}

                  <div className="space-y-2 mb-4 p-3 bg-white rounded border">
                    <div className="flex justify-between text-sm"><span>Subtotal:</span><span>{formatCurrency(calculateSubtotal())}</span></div>
                    {discountPercent > 0 && (<div className="flex justify-between text-sm text-red-600"><span>Desconto ({discountPercent}%):</span><span>-{formatCurrency(calculateDiscount())}</span></div>)}
                    <Separator />
                    <div className="flex justify-between font-bold text-lg"><span>Total:</span><span>{formatCurrency(calculateTotal())}</span></div>
                    {paymentMethod === 'dinheiro' && receivedAmount && (<div className="flex justify-between text-sm"><span>Troco:</span><span className={calculateChange() >= 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>{formatCurrency(calculateChange())}</span></div>)}
                  </div>

                  <div className="space-y-2">
                    <Button onClick={handleFinalizeSale} disabled={submitting || cart.length === 0} className="w-full bg-green-600 hover:bg-green-700 h-12 text-base">
                      <Calculator className="w-5 h-5 mr-2" />
                      {submitting ? 'Finalizando...' : 'Finalizar Venda'}
                    </Button>
                    <Button variant="outline" onClick={() => setShowNewSale(false)} className="w-full h-12 text-base">
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Vendas</CardTitle>
          <CardDescription>Últimas transações realizadas</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Carregando transações...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma venda registrada</h3>
              <p className="text-gray-600 mb-4">Comece registrando sua primeira venda</p>
              <Button onClick={() => setShowNewSale(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Venda
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <Card key={transaction.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge variant="outline">#{transaction.id.slice(-8)}</Badge>
                          <Badge variant="secondary">{transaction.status}</Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {formatDate(transaction.transaction_date)} • {transaction.cashier_name}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg text-green-600">
                          {formatCurrency(transaction.total_amount)}
                        </div>
                        <div className="flex items-center justify-end text-sm text-gray-600">
                          {getPaymentMethodIcon(transaction.payment_method)}
                          <span className="ml-1 capitalize">
                            {transaction.payment_method.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {transaction.items && transaction.items.length > 0 && (
                      <div className="border-t pt-3">
                        <p className="text-sm font-medium mb-2">Itens:</p>
                        <div className="space-y-1">
                          {transaction.items.map((item, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span>
                                {item.quantity}x {item.product_name}
                              </span>
                              <span>{formatCurrency(item.subtotal)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Transactions;
