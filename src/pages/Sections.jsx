import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Plus, Search, Edit, Trash2, X } from 'lucide-react';
import api from '../lib/api.js';
import '../App.css';

const Sections = () => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    show_in_restaurant: true
  });

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

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      show_in_restaurant: true
    });
    setEditingSection(null);
    setShowForm(false);
    setFormErrors({});
  };

  const handleEdit = (section) => {
    setEditingSection(section);
    setFormData({
      name: section.name,
      description: section.description || '',
      show_in_restaurant: section.show_in_restaurant
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta seção?')) return;
    try {
      await api.delete(`/sections/${id}`);
      fetchSections();
    } catch (error) {
      alert(error.response?.data?.error || 'Erro ao excluir seção');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormErrors({});

    try {
      if (editingSection) {
        await api.put(`/sections/${editingSection.id}`, formData);
      } else {
        await api.post('/sections', formData);
      }
      await fetchSections();
      resetForm();
    } catch (error) {
      setFormErrors({
        general: error.response?.data?.error || 'Erro ao salvar seção'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSections = sections.filter(section =>
    section.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Seções</h1>
          <p className="text-muted-foreground">Organize produtos por seções</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Seção
        </Button>
      </div>

      {/* FORM */}
      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>
                  {editingSection ? 'Editar Seção' : 'Nova Seção'}
                </CardTitle>
                <CardDescription>
                  {editingSection
                    ? 'Atualize as informações da seção'
                    : 'Preencha os dados da nova seção'}
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={resetForm}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {formErrors.general && (
                <div className="bg-red-50 border border-red-200 text-sm text-red-700 px-4 py-3 rounded">
                  {formErrors.general}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Nome da Seção *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Ex: Bebidas, Lanches"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Descrição
                  </label>
                  <Input
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Descrição opcional"
                  />
                </div>
              </div>

              {/* CHECKBOX MODERNO */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="show_in_restaurant"
                    checked={formData.show_in_restaurant}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        show_in_restaurant: Boolean(checked)
                      })
                    }
                  />
                  <label
                    htmlFor="show_in_restaurant"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Exibir no restaurante
                  </label>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting
                    ? 'Salvando...'
                    : editingSection
                    ? 'Atualizar'
                    : 'Salvar'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* SEARCH */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Buscar seções..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Seção</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Visível</TableHead>
              <TableHead className="w-[120px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : filteredSections.length ? (
              filteredSections.map((section) => (
                <TableRow key={section.id}>
                  <TableCell className="font-medium">{section.name}</TableCell>
                  <TableCell>{section.description || '—'}</TableCell>
                  <TableCell>
                    <span
                      className={
                        section.show_in_restaurant
                          ? 'text-green-600 font-semibold'
                          : 'text-red-600 font-semibold'
                      }
                    >
                      {section.show_in_restaurant ? 'SIM' : 'NÃO'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(section)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(section.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  Nenhuma seção encontrada
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Sections;
