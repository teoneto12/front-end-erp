// src/pages/restaurant/components/ItemEntryScreen.jsx

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShoppingCart, Plus, Minus, Save, Loader2, Edit, User } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useDebounce } from 'react-use';

const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

// ATUALIZADO: Recebe a nova prop 'initialData'
const ItemEntryScreen = ({ onBack, onSave, onUpdate, initialData }) => {
  const [commandName, setCommandName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [cart, setCart] = useState([]);
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [existingTable, setExistingTable] = useState(null);
  const [isCheckingTable, setIsCheckingTable] = useState(false);

  const [sections, setSections] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingSections, setLoadingSections] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // NOVO useEffect para preencher os dados iniciais
  useEffect(() => {
    if (initialData) {
      setCommandName(initialData.name);
      setCustomerName(initialData.customer_name || '');
      // Define a comanda existente imediatamente, sem precisar do debounce
      setExistingTable({
        id: initialData.id,
        name: initialData.name,
        customer_name: initialData.customer_name,
      });
    }
  }, [initialData]);

  useDebounce(() => {
    // Só verifica se não houver dados iniciais (modo de criação pura)
    if (initialData) return;

    const checkForExistingTable = async () => {
      if (!commandName.trim()) {
        setExistingTable(null);
        return;
      }
      setIsCheckingTable(true);
      try {
        const response = await api.get(`/restaurant/tables/find-by-name`, { params: { name: commandName.trim() } });
        if (response.data.table) {
          setExistingTable(response.data.table);
        } else {
          setExistingTable(null);
        }
      } catch (error) {
        setExistingTable(null);
      } finally {
        setIsCheckingTable(false);
      }
    };
    checkForExistingTable();
  }, 500, [commandName, initialData]);

 useEffect(() => {
  const fetchSections = async () => {
    setLoadingSections(true);
    try {
      const response = await api.get('/sections');

      // FILTRA SOMENTE SEÇÕES VISÍVEIS NO RESTAURANTE
      setSections(
        (response.data.sections || [])
          .filter(s => s.id != null && s.show_in_restaurant === true)
      );

    } catch (error) {
      console.error("Falha ao buscar seções:", error);
      toast.error(`Falha ao buscar seções: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoadingSections(false);
    }
  };

  fetchSections();
}, []);


  useEffect(() => {
    const fetchProductsBySection = async () => {
      if (!selectedSectionId) {
        setProducts([]);
        return;
      }
      setLoadingProducts(true);
      try {
        const response = await api.get('/products', {
          params: { section_id: selectedSectionId, limit: 200 }
        });
        setProducts(response.data.products || []);
      } catch (error) {
        console.error("Falha ao buscar produtos:", error);
        toast.error(`Falha ao buscar produtos: ${error.response?.data?.error || error.message}`);
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProductsBySection();
  }, [selectedSectionId]);

  const handleAddToCart = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1, price: product.price }];
    });
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      setCart(cart.filter(item => item.id !== productId));
    } else {
      setCart(cart.map(item => item.id === productId ? { ...item, quantity: newQuantity } : item));
    }
  };

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleSave = async () => {
    if (cart.length === 0) {
      toast.error('Adicione pelo menos um item à comanda.');
      return;
    }
    setIsSaving(true);

    if (existingTable) {
      const commandData = {
        id: existingTable.id,
        name: existingTable.name,
        items: cart
      };
      await onUpdate(commandData);
    } else {
      if (!commandName.trim()) {
        toast.error('Por favor, informe o nome da comanda.');
        setIsSaving(false);
        return;
      }
      const commandData = {
        name: commandName,
        customerName: customerName,
        items: cart
      };
      await onSave(commandData);
    }
    setIsSaving(false);
  };

  return (
    <div className="flex h-full gap-6">
      <div className="w-2/3 flex flex-col bg-white rounded-xl shadow-sm border">
        <header className="p-4 border-b flex-shrink-0">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Comandas
          </Button>
          <h2 className="text-xl font-bold text-slate-800">Seções do Cardápio</h2>
        </header>
        <main className="flex-grow flex overflow-hidden">
          <div className="w-1/3 border-r overflow-y-auto p-2">
            {loadingSections ? <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div> : (
              <ul className="space-y-1">
                {sections.map(section => (
                  <li key={section.id}>
                    <button
                      onClick={() => setSelectedSectionId(section.id)}
                      className={`w-full text-left p-3 rounded-md transition-colors text-sm font-medium ${selectedSectionId === section.id ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-100'}`}
                    >
                      {section.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="w-2/3 overflow-y-auto p-2">
            {loadingProducts && <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>}
            {!loadingProducts && !selectedSectionId && <div className="text-center text-slate-500 p-8">Selecione uma seção para ver os produtos.</div>}
            {!loadingProducts && products.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {products.map(product => (
                  <div key={product.id} onClick={() => handleAddToCart(product)} className="border rounded-lg p-3 cursor-pointer hover:bg-slate-50 flex flex-col justify-between">
                    <p className="font-semibold text-sm text-slate-800">{product.name}</p>
                    <p className="text-sm font-medium text-green-600 mt-2">{formatCurrency(product.price)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
      <div className="w-full md:w-1/3 flex flex-col bg-white rounded-xl shadow-sm border">
        <header className="p-4 border-b space-y-3">
          <h2 className="text-xl font-bold text-slate-800">
            {existingTable ? 'Adicionar Itens à Comanda' : 'Nova Comanda'}
          </h2>
          
          <div className="relative">
            <Input
              placeholder="Nome da Comanda (Ex: Mesa 12)"
              value={commandName}
              onChange={(e) => setCommandName(e.target.value)}
              // Desabilita a edição do nome se estiver no modo de atualização
              disabled={!!initialData}
            />
            {isCheckingTable && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-slate-400" />}
          </div>

          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Nome do Cliente (Opcional)"
              className="pl-10"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              // Desabilita a edição do nome do cliente se estiver no modo de atualização
              disabled={!!initialData}
            />
          </div>

          {existingTable && (
            <div className="p-2 bg-blue-50 text-blue-700 text-sm rounded-md border border-blue-200">
              Comanda <strong>{existingTable.number || existingTable.name}</strong> encontrada. Novos itens serão adicionados a ela.
            </div>
          )}
        </header>
        <main className="flex-grow p-4 overflow-y-auto space-y-2">
          {cart.length === 0 ? (
            <div className="text-center text-slate-500 pt-10">
              <ShoppingCart className="w-12 h-12 mx-auto text-slate-300" />
              <p className="mt-2">O carrinho está vazio.</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex items-center justify-between p-2 rounded-md bg-slate-50">
                <div>
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-slate-600">{formatCurrency(item.price)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus className="w-3 h-3" /></Button>
                  <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                  <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus className="w-3 h-3" /></Button>
                </div>
              </div>
            ))
          )}
        </main>
        <footer className="p-4 border-t bg-slate-50/50 rounded-b-xl">
          <div className="flex justify-between text-lg font-bold text-slate-800 mb-4">
            <span>Total</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <Button className="w-full" size="lg" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : (existingTable ? <Edit className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />)}
            {existingTable ? 'Adicionar Itens' : 'Salvar Comanda'}
          </Button>
        </footer>
      </div>
    </div>
  );
};

export default ItemEntryScreen;
