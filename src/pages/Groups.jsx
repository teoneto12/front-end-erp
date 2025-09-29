import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Edit, Trash2, Grid3X3, X } from 'lucide-react';
import api from '../lib/api.js';
import '../App.css';

const Groups = () => {
  const [groups, setGroups] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', section_id: '' });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchGroups(), fetchSections()]);
      } catch (error) {
        console.error("Erro ao carregar dados iniciais:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // ▼▼▼ CORREÇÃO APLICADA AQUI ▼▼▼
  const fetchGroups = async () => {
    try {
      const response = await api.get('/groups');
      // A função 'setGroups' agora é usada para atualizar o estado.
      setGroups(response.data.groups || []);
    } catch (error) {
      console.error('Erro ao carregar grupos:', error);
      setGroups([]);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});
    setSubmitting(true);
    try {
      const submitData = { ...formData, section_id: formData.section_id || null };
      if (editingGroup) {
        await api.put(`/groups/${editingGroup.id}`, submitData);
      } else {
        await api.post('/groups', submitData);
      }
      await fetchGroups();
      resetForm();
    } catch (error) {
      if (error.response?.data?.errors) {
        setFormErrors(error.response.data.errors);
      } else {
        setFormErrors({ general: error.response?.data?.error || 'Erro ao salvar grupo' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (group) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      description: group.description || '',
      section_id: group.section_id ? String(group.section_id) : ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este grupo?')) return;
    try {
      await api.delete(`/groups/${id}`);
      await fetchGroups();
    } catch (error) {
      alert('Erro ao excluir grupo: ' + (error.response?.data?.error || error.message));
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', section_id: '' });
    setEditingGroup(null);
    setShowForm(false);
    setFormErrors({});
  };

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSectionName = (sectionId) => {
    if (!sectionId) return '---';
    const section = sections.find(s => String(s.id) === String(sectionId));
    return section ? section.name : 'Seção inválida';
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Grupos</h1>
          <p className="text-gray-600">Organize produtos em grupos dentro das seções</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="w-4 h-4 mr-2" />
          Novo Grupo
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>{editingGroup ? 'Editar Grupo' : 'Novo Grupo'}</CardTitle>
                <CardDescription>{editingGroup ? 'Atualize as informações do grupo' : 'Preencha os dados do novo grupo'}</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={resetForm}><X className="w-4 h-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {formErrors.general && <div className="bg-red-50 border border-red-200 text-sm text-red-700 px-4 py-3 rounded">{formErrors.general}</div>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nome do Grupo *</label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Refrigerantes, Sucos" className={formErrors.name ? 'border-red-500' : ''} />
                  {formErrors.name && <p className="text-sm text-red-600 mt-1">{formErrors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Seção</label>
                  <Select value={formData.section_id} onValueChange={(value) => setFormData({ ...formData, section_id: value })}>
                    <SelectTrigger className={formErrors.section_id ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Selecione uma seção (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {sections.map((section) => (<SelectItem key={section.id} value={String(section.id)}>{section.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  {formErrors.section_id && <p className="text-sm text-red-600 mt-1">{formErrors.section_id}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Descrição</label>
                <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Descrição opcional do grupo" className={formErrors.description ? 'border-red-500' : ''} />
                {formErrors.description && <p className="text-sm text-red-600 mt-1">{formErrors.description}</p>}
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>{submitting ? 'Salvando...' : (editingGroup ? 'Atualizar' : 'Salvar')}</Button>
                <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input placeholder="Buscar grupos..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Grupo</TableHead>
              <TableHead>Seção</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="w-[120px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="h-24 text-center">Carregando grupos...</TableCell></TableRow>
            ) : filteredGroups.length > 0 ? (
              filteredGroups.map((group) => (
                <TableRow key={group.id}>
                  <TableCell className="font-medium">{group.name}</TableCell>
                  <TableCell><Badge variant="outline">{getSectionName(group.section_id)}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{group.description || '---'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleEdit(group)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="outline" size="icon" className="h-8 w-8 hover:bg-red-50" onClick={() => handleDelete(group.id)}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={4} className="h-24 text-center">{searchTerm ? "Nenhum grupo encontrado." : "Nenhum grupo cadastrado."}{!searchTerm && (<Button variant="link" onClick={() => setShowForm(true)}>Criar o primeiro grupo</Button>)}</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Groups;
