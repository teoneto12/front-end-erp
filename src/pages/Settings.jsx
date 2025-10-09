// frontend/src/pages/Settings.jsx

import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const Settings = () => {
  const [exportPath, setExportPath] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // Usando a rota que você definiu: /api/setting-export
        const response = await api.get('/setting-export/PRE_SALE_EXPORT_PATH');
        setExportPath(response.data.value || '');
      } catch (error) {
        console.error("Erro ao buscar configuração de exportação:", error);
        toast.error("Não foi possível carregar as configurações.");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const promise = api.put('/setting-export/PRE_SALE_EXPORT_PATH', { value: exportPath });

    toast.promise(promise, {
      loading: 'Salvando configuração...',
      success: 'Caminho de exportação salvo com sucesso!',
      error: (err) => `Erro ao salvar: ${err.response?.data?.error || err.message}`,
    });

    try {
      await promise;
    } catch (error) {
      // O toast já lida com a mensagem de erro
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Configurações do Sistema</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Integração com PDV</CardTitle>
          <CardDescription>
            Defina as configurações para a integração com o sistema de Ponto de Venda (PDV).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Carregando configurações...</span>
            </div>
          ) : (
            <div className="space-y-4 max-w-xl">
              <div className="space-y-2">
                <Label htmlFor="export-path">Caminho de Exportação da Pré-venda</Label>
                <Input
                  id="export-path"
                  value={exportPath}
                  onChange={(e) => setExportPath(e.target.value)}
                  placeholder="Ex: C:\PDV\importa ou /var/pdv/import"
                />
                <p className="text-sm text-muted-foreground">
                  Pasta no servidor onde os arquivos de pré-venda (.ECF) serão salvos.
                  Certifique-se que o diretório existe e que o sistema tem permissão de escrita.
                </p>
              </div>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Salvar Configuração
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
