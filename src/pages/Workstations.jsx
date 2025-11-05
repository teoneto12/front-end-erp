// frontend/src/pages/Workstations.jsx

import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import Modal from '../components/Modal';

const WorkstationForm = ({ workstation, onSave, onCancel }) => {
  const [name, setName] = useState(workstation?.name || '');
  const [ipAddress, setIpAddress] = useState(workstation?.ip_address || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...workstation, name, ip_address: ipAddress });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nome da Estação</label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Caixa 01" required />
      </div>
      <div>
        <label htmlFor="ip_address" className="block text-sm font-medium text-gray-700 mb-1">Endereço IP</label>
        <Input id="ip_address" value={ipAddress} onChange={(e) => setIpAddress(e.target.value)} placeholder="Ex: 192.168.0.101" required />
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">Salvar</Button>
      </div>
    </form>
  );
};

const Workstations = () => {
  const [workstations, setWorkstations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, workstation: null });

  const fetchWorkstations = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/workstations');
      setWorkstations(data);
    } catch (error) {
      console.error("Erro ao buscar estações de trabalho", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkstations();
  }, []);

  const handleSave = async (workstation) => {
    try {
      if (workstation.id) {
        await api.put(`/workstations/${workstation.id}`, workstation);
      } else {
        await api.post('/workstations', workstation);
      }
      setModal({ open: false, workstation: null });
      fetchWorkstations();
    } catch (error) {
      alert('Erro ao salvar estação de trabalho: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta estação de trabalho?')) {
      try {
        await api.delete(`/workstations/${id}`);
        fetchWorkstations();
      } catch (error) {
        alert('Erro ao excluir estação de trabalho.');
      }
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Estações de Trabalho</h1>
        <Button onClick={() => setModal({ open: true, workstation: null })}>
          <Plus className="mr-2 h-4 w-4" /> Nova Estação
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Estações</CardTitle>
          <CardDescription>Gerencie os caixas e pontos de impressão da sua loja.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Endereço IP</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={3} className="text-center h-24"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
              ) : workstations.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="text-center h-24">Nenhuma estação de trabalho cadastrada.</TableCell></TableRow>
              ) : (
                workstations.map(ws => (
                  <TableRow key={ws.id}>
                    <TableCell className="font-medium">{ws.name}</TableCell>
                    <TableCell>{ws.ip_address}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => setModal({ open: true, workstation: ws })}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(ws.id)} className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {modal.open && (
        <Modal
          open={modal.open}
          onClose={() => setModal({ open: false, workstation: null })}
          title={modal.workstation?.id ? 'Editar Estação' : 'Nova Estação'}
          maxWidth="max-w-md"
        >
          <WorkstationForm
            workstation={modal.workstation}
            onSave={handleSave}
            onCancel={() => setModal({ open: false, workstation: null })}
          />
        </Modal>
      )}
    </div>
  );
};

export default Workstations;
