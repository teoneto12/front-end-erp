import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
// NOVO: Importando o componente Switch e Label
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Ban, CheckCircle } from 'lucide-react'; // NOVO: Ícones para o botão
import api from '../lib/api.js';

const ProductForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    // NOVO: Adicionando os novos campos ao estado inicial
    supplier_code: '',
    is_active: true,
    price: '',
    cost: '',
    stock_quantity: '',
    section_id: '',
    group_id: '',
  });
  const [sections, setSections] = useState([]);
  const [groups, setGroups] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const isEditing = Boolean(id);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const [sectionsRes, groupsRes] = await Promise.all([
          api.get('/sections'),
          api.get('/groups')
        ]);
        setSections(sectionsRes.data.sections?.filter(s => s.id != null) || []);
        setGroups(groupsRes.data.groups?.filter(g => g.id != null) || []);

        if (isEditing) {
          const productRes = await api.get(`/products/${id}`);
          const product = productRes.data.product;
          setFormData({
            name: product.name,
            description: product.description || '',
            sku: product.sku,
            // NOVO: Preenchendo os novos campos com dados do produto
            supplier_code: product.supplier_code || '',
            is_active: product.is_active,
            price: product.price.toString(),
            cost: product.cost ? product.cost.toString() : '',
            stock_quantity: product.stock_quantity.toString(),
            section_id: product.section_id ? String(product.section_id) : '',
            group_id: product.group_id ? String(product.group_id) : '',
          });
        } else if (location.state) {
          setFormData(location.state);
        }
      } catch (error) {
        console.error("Falha ao carregar dados:", error);
        toast.error("Falha ao carregar dados do formulário.");
        navigate('/products');
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, [id, isEditing, navigate, location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});
    setSubmitting(true);

    const promise = new Promise((resolve, reject) => {
      const runSubmit = async () => {
        try {
          // O 'submitData' já incluirá 'supplier_code' e 'is_active'
          const submitData = {
            ...formData,
            price: parseFloat(formData.price) || 0,
            cost: formData.cost ? parseFloat(formData.cost) : null,
            stock_quantity: parseInt(formData.stock_quantity, 10) || 0,
            section_id: formData.section_id || null,
            group_id: formData.group_id || null,
          };

          if (isEditing) {
            await api.put(`/products/${id}`, submitData);
          } else {
            await api.post('/products', submitData);
          }
          
          resolve(`Produto ${isEditing ? 'atualizado' : 'salvo'} com sucesso!`);
          
          setTimeout(() => navigate('/products'), 500);
        } catch (error) {
          const apiErrors = error.response?.data?.errors;
          if (apiErrors) {
            setFormErrors(apiErrors);
          }
          const errorMessage = error.response?.data?.error || 'Verifique os campos do formulário.';
          reject(errorMessage);
        }
      };

      runSubmit();
    });

    await toast.promise(promise, {
      loading: 'Salvando produto...',
      success: (message) => message,
      error: (err) => `Erro ao salvar: ${err.toString()}`,
    });

    setSubmitting(false);
  };

  const getFilteredGroups = () => {
    if (!formData.section_id) return [];
    return groups.filter(group => String(group.section_id) === formData.section_id);
  };

  if (loading) {
    return <div className="p-6 text-center">Carregando formulário...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Button variant="ghost" onClick={() => navigate('/products')} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar para a lista de produtos
      </Button>
      
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Editar Produto' : 'Novo Produto'}</CardTitle>
          <CardDescription>{isEditing ? 'Atualize as informações do produto' : 'Preencha os dados do novo produto'}</CardDescription>
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

            {/* NOVO: Campo para Código do Fornecedor */}
            <div>
              <label className="block text-sm font-medium mb-2">Código Interno do Fornecedor</label>
              <Input 
                value={formData.supplier_code} 
                onChange={(e) => setFormData({ ...formData, supplier_code: e.target.value })} 
                placeholder="Ex: 98765-FORNEC" 
                className={formErrors.supplier_code ? 'border-red-500' : ''} 
              />
              {formErrors.supplier_code && <p className="text-sm text-red-600 mt-1">{formErrors.supplier_code}</p>}
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

            {/* NOVO: Switch para Ativar/Inativar o produto */}
            <div className="flex items-center space-x-2 pt-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active" className={formData.is_active ? 'text-green-600' : 'text-red-600'}>
                {formData.is_active ? 'Produto Ativo' : 'Produto Inativo'}
              </Label>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={submitting}>{submitting ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Salvar')}</Button>
              <Button type="button" variant="outline" onClick={() => navigate('/products')}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductForm;
