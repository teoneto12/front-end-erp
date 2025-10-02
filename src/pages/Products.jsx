import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Edit, Trash2, Copy, Upload } from 'lucide-react';
import api from '../lib/api.js';
import Pagination from '../components/Pagination'; // Importa o novo componente

const Products = () => {
  const [products, setProducts] = useState([]);
  const [sections, setSections] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para controlar a paginação
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const navigate = useNavigate();
  const location = useLocation();

  // Função de busca agora aceita a página como parâmetro
  const fetchProducts = async (page) => {
    try {
      const response = await api.get('/products', {
        params: {
          page,
          limit: 10, // O backend já usa 10 como padrão, mas é bom ser explícito
          search: searchTerm,
        }
      });
      setProducts(response.data.products || []);
      setPagination(response.data.pagination || null); // Armazena os dados da paginação
    } catch (error) {
      console.error("Falha ao buscar produtos:", error);
      toast.error("Não foi possível carregar os produtos.");
    }
  };

  const fetchSections = async () => {
    try {
      const response = await api.get('/sections');
      setSections(response.data.sections?.filter(s => s.id != null) || []);
    } catch (error) {
      console.error("Falha ao buscar seções:", error);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await api.get('/groups');
      setGroups(response.data.groups?.filter(g => g.id != null) || []);
    } catch (error) {
      console.error("Falha ao buscar grupos:", error);
    }
  };

  // useEffect agora depende da página atual, do termo de busca e do sinal de atualização
  useEffect(() => {
    const loadData = async () => {
        setLoading(true);
        // Busca os produtos da página corrente
        await fetchProducts(currentPage);
        // Seções e grupos podem ser carregados apenas uma vez para otimizar
        if (sections.length === 0) await fetchSections();
        if (groups.length === 0) await fetchGroups();
        setLoading(false);
    };
    
    loadData();

    if (location.state?.needsUpdate) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [currentPage, searchTerm, location.state]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Volta para a primeira página ao iniciar uma nova busca
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
    
    const promise = api.delete(`/products/${id}`).then(() => {
      // Recarrega os dados da página atual para refletir a exclusão
      fetchProducts(currentPage);
    });

    await toast.promise(promise, {
      loading: 'Excluindo produto...',
      success: 'Produto excluído com sucesso!',
      error: (err) => `Erro ao excluir: ${err.response?.data?.error || err.message}`,
    });
  };

  const getSectionName = (sectionId) => sections.find(s => String(s.id) === String(sectionId))?.name || '---';
  const getGroupName = (groupId) => groups.find(g => String(g.id) === String(groupId))?.name || '---';

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Produtos</h1>
          <p className="text-gray-600">Gerencie o catálogo de produtos</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button onClick={() => navigate('/invoices/import')} variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Importar XML
          </Button>
          <Button onClick={() => navigate('/products/new')} className="bg-orange-600 hover:bg-orange-700">
            <Plus className="w-4 h-4 mr-2" />
            Novo Produto
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input placeholder="Buscar por nome ou SKU..." value={searchTerm} onChange={handleSearchChange} className="pl-10" />
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
              <TableHead className="w-[140px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="h-24 text-center">Carregando produtos...</TableCell></TableRow>
            ) : products.length > 0 ? (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-muted-foreground">{product.sku}</TableCell>
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
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleDuplicate(product)}><Copy className="w-4 w-4" /></Button>
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
      
      {/* Renderiza o componente de paginação no final */}
      <Pagination pagination={pagination} onPageChange={handlePageChange} />
    </div>
  );
};

export default Products;
