import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, Edit, Trash2, Package, X } from 'lucide-react';
import api from '../lib/api.js';
import '../App.css';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [sections, setSections] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    price: '',
    cost: '',
    stock_quantity: '',
    section_id: '',
    group_id: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchProducts(),
                fetchSections(),
                fetchGroups()
            ]);
        } catch (error) {
            console.error("Falha ao carregar dados iniciais:", error);
        } finally {
            setLoading(false);
        }
    };
    loadData();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      setProducts([]);
    }
  };

  const fetchSections = async () => {
    try {
      const response = await api.get('/sections');
      setSections(response.data.sections?.filter(s => s.id != null) || []);
    } catch (error) {
      console.error('Erro ao carregar seções:', error);
      setSections([]);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await api.get('/groups');
      setGroups(response.data.groups?.filter(g => g.id != null) || []);
    } catch (error) {
      console.error('Erro ao carregar grupos:', error);
      setGroups([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});
    setSubmitting(true);
    try {
      const submitData = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        cost: formData.cost ? parseFloat(formData.cost) : null,
        stock_quantity: parseInt(formData.stock_quantity, 10) || 0,
        section_id: formData.section_id || null,
        group_id: formData.group_id || null,
      };
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, submitData);
      } else {
        await api.post('/products', submitData);
      }
      await fetchProducts();
      resetForm();
    } catch (error) {
      if (error.response?.data?.errors) {
        setFormErrors(error.response.data.errors);
      } else {
        setFormErrors({ general: error.response?.data?.error || 'Erro ao salvar produto' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ▼▼▼ FUNÇÃO RESTAURADA ▼▼▼
  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      sku: product.sku,
      price: product.price.toString(),
      cost: product.cost ? product.cost.toString() : '',
      stock_quantity: product.stock_quantity.toString(),
      section_id: product.section_id ? String(product.section_id) : '',
      group_id: product.group_id ? String(product.group_id) : '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este produto?')) return;
    try {
      await api.delete(`/products/${id}`);
      await fetchProducts();
    } catch (error) {
      alert('Erro ao excluir produto: ' + (error.response?.data?.error || error.message));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '', description: '', sku: '', price: '', cost: '',
      stock_quantity: '', section_id: '', group_id: '',
    });
    setEditingProduct(null);
    setShowForm(false);
    setFormErrors({});
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getSectionName = (sectionId) => sections.find(s => String(s.id) === String(sectionId))?.name || '---';
  const getGroupName = (groupId) => groups.find(g => String(g.id) === String(groupId))?.name || '---';

  const getFilteredGroups = () => {
    if (!formData.section_id) return [];
    return groups.filter(group => String(group.section_id) === formData.section_id);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Produtos</h1>
          <p className="text-gray-600">Gerencie o catálogo de produtos</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-orange-600 hover:bg-orange-700">
          <Plus className="w-4 h-4 mr-2" />
          Novo Produto
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</CardTitle>
                <CardDescription>{editingProduct ? 'Atualize as informações do produto' : 'Preencha os dados do novo produto'}</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={resetForm}><X className="w-4 h-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {formErrors.general && <div className="bg-red-50 border border-red-200 text-sm text-red-700 px-4 py-3 rounded">{formErrors.general}</div>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nome do Produto *</label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Coca-Cola 350ml" className={formErrors.name ? 'border-red-500' : ''} />
                  {formErrors.name && <p className="text-sm text-red-600 mt-1">{formErrors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">SKU/Código *</label>
                  <Input value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} placeholder="Ex: COCA001" className={formErrors.sku ? 'border-red-500' : ''} />
                  {formErrors.sku && <p className="text-sm text-red-600 mt-1">{formErrors.sku}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Descrição</label>
                <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Descrição detalhada do produto" className={formErrors.description ? 'border-red-500' : ''} rows={3} />
                {formErrors.description && <p className="text-sm text-red-600 mt-1">{formErrors.description}</p>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Preço de Venda *</label>
                  <Input type="number" step="0.01" min="0" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} placeholder="0.00" className={formErrors.price ? 'border-red-500' : ''} />
                  {formErrors.price && <p className="text-sm text-red-600 mt-1">{formErrors.price}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Custo</label>
                  <Input type="number" step="0.01" min="0" value={formData.cost} onChange={(e) => setFormData({ ...formData, cost: e.target.value })} placeholder="0.00" className={formErrors.cost ? 'border-red-500' : ''} />
                  {formErrors.cost && <p className="text-sm text-red-600 mt-1">{formErrors.cost}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Estoque *</label>
                  <Input type="number" min="0" value={formData.stock_quantity} onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })} placeholder="0" className={formErrors.stock_quantity ? 'border-red-500' : ''} />
                  {formErrors.stock_quantity && <p className="text-sm text-red-600 mt-1">{formErrors.stock_quantity}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Seção</label>
                  <Select value={formData.section_id} onValueChange={(value) => setFormData({ ...formData, section_id: value, group_id: '' })}>
                    <SelectTrigger className={formErrors.section_id ? 'border-red-500' : ''}><SelectValue placeholder="Selecione uma seção" /></SelectTrigger>
                    <SelectContent>
                      {sections.map((section) => (<SelectItem key={section.id} value={String(section.id)}>{section.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  {formErrors.section_id && <p className="text-sm text-red-600 mt-1">{formErrors.section_id}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Grupo</label>
                  <Select value={formData.group_id} onValueChange={(value) => setFormData({ ...formData, group_id: value })} disabled={!formData.section_id}>
                    <SelectTrigger className={formErrors.group_id ? 'border-red-500' : ''}><SelectValue placeholder={!formData.section_id ? "Primeiro selecione uma seção" : "Selecione um grupo"} /></SelectTrigger>
                    <SelectContent>
                      {getFilteredGroups().map((group) => (<SelectItem key={group.id} value={String(group.id)}>{group.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  {formErrors.group_id && <p className="text-sm text-red-600 mt-1">{formErrors.group_id}</p>}
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>{submitting ? 'Salvando...' : (editingProduct ? 'Atualizar' : 'Salvar')}</Button>
                <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input placeholder="Buscar por nome ou SKU..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Produto</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Seção / Grupo</TableHead>
              <TableHead className="text-right">Preço</TableHead>
              <TableHead className="text-center">Estoque</TableHead>
              <TableHead className="w-[120px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="h-24 text-center"><div className="flex justify-center items-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mr-3"></div>Carregando produtos...</div></TableCell></TableRow>
            ) : filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-muted-foreground">{product.sku}</TableCell>
                  <TableCell><div className="flex flex-col"><span className="text-sm">{getSectionName(product.section_id)}</span><span className="text-xs text-muted-foreground">{getGroupName(product.group_id)}</span></div></TableCell>
                  <TableCell className="text-right font-mono">R$ {parseFloat(product.price).toFixed(2)}</TableCell>
                  <TableCell className="text-center"><Badge variant={product.stock_quantity > 0 ? "secondary" : "destructive"}>{product.stock_quantity}</Badge></TableCell>
                  <TableCell className="text-right"><div className="flex gap-2 justify-end"><Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleEdit(product)}><Edit className="h-4 w-4" /></Button><Button variant="outline" size="icon" className="h-8 w-8 hover:bg-red-50" onClick={() => handleDelete(product.id)}><Trash2 className="h-4 w-4 text-red-600" /></Button></div></TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={6} className="h-24 text-center">{searchTerm ? "Nenhum produto encontrado." : "Nenhum produto cadastrado."}{!searchTerm && (<Button variant="link" onClick={() => setShowForm(true)}>Adicionar o primeiro produto</Button>)}</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Products;
