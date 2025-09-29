// src/components/Products.js (Versão Corrigida e Limpa)

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Edit, Trash2, Copy } from 'lucide-react';
import api from '../lib/api.js';
import '../App.css';

const Products = () => {
  const [products, setProducts] = useState([]);
  // ▼▼▼ ESTAS VARIÁVEIS SÃO NECESSÁRIAS PARA EXIBIR OS NOMES NA TABELA ▼▼▼
  const [sections, setSections] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
        setLoading(true);
        try {
            // Continuamos buscando tudo para ter os dados de referência
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

  const handleDuplicate = (product) => {
    navigate('/products/new', { 
      state: {
        name: `${product.name} (Cópia)`,
        description: product.description || '',
        sku: `${product.sku}-COPY`,
        price: product.price.toString(),
        cost: product.cost ? product.cost.toString() : '',
        stock_quantity: '0',
        section_id: product.section_id ? String(product.section_id) : '',
        group_id: product.group_id ? String(product.group_id) : '',
      }
    });
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

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // ▼▼▼ ESTAS FUNÇÕES USAM 'sections' E 'groups', RESOLVENDO O AVISO ▼▼▼
  const getSectionName = (sectionId) => sections.find(s => String(s.id) === String(sectionId))?.name || '---';
  const getGroupName = (groupId) => groups.find(g => String(g.id) === String(groupId))?.name || '---';

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Produtos</h1>
          <p className="text-gray-600">Gerencie o catálogo de produtos</p>
        </div>
        <Button onClick={() => navigate('/products/new')} className="bg-orange-600 hover:bg-orange-700">
          <Plus className="w-4 h-4 mr-2" />
          Novo Produto
        </Button>
      </div>

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
              <TableRow><TableCell colSpan={6} className="h-24 text-center">Carregando...</TableCell></TableRow>
            ) : filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-muted-foreground">{product.sku}</TableCell>
                  {/* ▼▼▼ AQUI AS FUNÇÕES SÃO CHAMADAS, USANDO AS VARIÁVEIS ▼▼▼ */}
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">{getSectionName(product.section_id)}</span>
                      <span className="text-xs text-muted-foreground">{getGroupName(product.group_id)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">R$ {parseFloat(product.price).toFixed(2)}</TableCell>
                  <TableCell className="text-center"><Badge variant={product.stock_quantity > 0 ? "secondary" : "destructive"}>{product.stock_quantity}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleDuplicate(product)}><Copy className="h-4 w-4" /></Button>
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate(`/products/edit/${product.id}`)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="outline" size="icon" className="h-8 w-8 hover:bg-red-50" onClick={() => handleDelete(product.id)}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={6} className="h-24 text-center">Nenhum produto encontrado.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Products;
