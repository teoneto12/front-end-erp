import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Edit, Trash2, Layers, X } from 'lucide-react';
import api from '../lib/api.js';
import '../App.css';

const Sections = () => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      setLoading(true);
      const response = await api.get('/sections');
      setSections(response.data.sections || []);
    } catch (error) {
      console.error('Erro ao carregar seções:', error);
      setSections([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});
    setSubmitting(true);
    try {
      if (editingSection) {
        await api.put(`/sections/${editingSection.id}`, formData);
      } else {
        await api.post('/sections', formData);
      }
      await fetchSections();
      resetForm();
    } catch (error) {
      if (error.response?.data?.errors) {
        setFormErrors(error.response.data.errors);
      } else {
        setFormErrors({ general: error.response?.data?.error || 'Erro ao salvar seção' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (section) => {
    setEditingSection(section);
    setFormData({
      name: section.name,
      description: section.description || ''
    });
    setShowForm(true);
  };

  // ▼▼▼ CORREÇÃO APLICADA AQUI ▼▼▼
  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta seção?')) {
      return;
    }
    try {
      // O parâmetro 'id' agora é usado para construir a URL correta.
      await api.delete(`/sections/${id}`);
      await fetchSections();
    } catch (error) {
      alert('Erro ao excluir seção: ' + (error.response?.data?.error || error.message));
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '' });
    setEditingSection(null);
    setShowForm(false);
    setFormErrors({});
  };

  const filteredSections = sections.filter(section =>
    section.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Seções</h1>
          <p className="text-gray-600">Organize produtos por seções</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Nova Seção
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>{editingSection ? 'Editar Seção' : 'Nova Seção'}</CardTitle>
                <CardDescription>{editingSection ? 'Atualize as informações da seção' : 'Preencha os dados da nova seção'}</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={resetForm}><X className="w-4 h-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {formErrors.general && <div className="bg-red-50 border border-red-200 text-sm text-red-700 px-4 py-3 rounded">{formErrors.general}</div>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nome da Seção *</label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Bebidas, Lanches" className={formErrors.name ? 'border-red-500' : ''} />
                  {formErrors.name && <p className="text-sm text-red-600 mt-1">{formErrors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Descrição</label>
                  <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Descrição opcional da seção" className={formErrors.description ? 'border-red-500' : ''} />
                  {formErrors.description && <p className="text-sm text-red-600 mt-1">{formErrors.description}</p>}
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>{submitting ? 'Salvando...' : (editingSection ? 'Atualizar' : 'Salvar')}</Button>
                <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input placeholder="Buscar seções..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Seção</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="w-[120px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={3} className="h-24 text-center">Carregando seções...</TableCell></TableRow>
            ) : filteredSections.length > 0 ? (
              filteredSections.map((section) => (
                <TableRow key={section.id}>
                  <TableCell className="font-medium">{section.name}</TableCell>
                  <TableCell className="text-muted-foreground">{section.description || '---'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleEdit(section)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="outline" size="icon" className="h-8 w-8 hover:bg-red-50" onClick={() => handleDelete(section.id)}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={3} className="h-24 text-center">{searchTerm ? "Nenhuma seção encontrada." : "Nenhuma seção cadastrada."}{!searchTerm && (<Button variant="link" onClick={() => setShowForm(true)}>Criar a primeira seção</Button>)}</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Sections;
