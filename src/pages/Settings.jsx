import React, { useState, useEffect } from 'react';
// Importe a nova função 'updateApiBaseUrl' do seu arquivo api.js
import api, { updateApiBaseUrl } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Save, Wifi, WifiOff } from 'lucide-react'; // Ícones para feedback
import toast from 'react-hot-toast';

const Settings = () => {
  // --- Estados existentes ---
  const [exportPath, setExportPath] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // --- Novos estados para a configuração da API ---
  const [apiUrl, setApiUrl] = useState(() => localStorage.getItem('apiBaseUrl') || 'http://localhost:3000/api' );
  const [savingApiUrl, setSavingApiUrl] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const response = await api.get('/settings/PRE_SALE_EXPORT_PATH');
        setExportPath(response.data.value || '');
      } catch (error) {
        console.error("Erro ao buscar configurações:", error);
        // Se o erro for de conexão, a causa provável é a URL da API incorreta
        if (error.code === 'ERR_NETWORK') {
            toast.error("Falha na conexão com a API. Verifique o endereço e tente novamente.");
        } else {
            toast.error("Não foi possível carregar as configurações.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSaveExportPath = async () => {
    setSaving(true);
    const promise = api.put('/settings/PRE_SALE_EXPORT_PATH', { value: exportPath });

    toast.promise(promise, {
      loading: 'Salvando caminho de exportação...',
      success: 'Caminho de exportação salvo com sucesso!',
      error: (err) => `Erro ao salvar: ${err.response?.data?.error || err.message}`,
    });

    try {
      await promise;
    } catch (error) {
      // O toast já lida com a mensagem
    } finally {
      setSaving(false);
    }
  };
  
  // --- Nova função para salvar a URL da API ---
  const handleSaveApiUrl = async () => {
    setSavingApiUrl(true);
    
    // Validação simples da URL
    if (!apiUrl.startsWith('http://' ) && !apiUrl.startsWith('https://' )) {
        toast.error('URL inválida. Deve começar com http:// ou https://' );
        setSavingApiUrl(false);
        return;
    }

    // 1. Salva a nova URL no localStorage
    localStorage.setItem('apiBaseUrl', apiUrl);
    
    // 2. Atualiza a instância do Axios em tempo real
    updateApiBaseUrl(apiUrl);

    // 3. Faz um "ping" para testar a nova conexão
    try {
        // Usamos uma rota leve, como a própria de configurações, para testar
        await api.get('/setting-export/PRE_SALE_EXPORT_PATH');
        toast.success('Endereço da API salvo e conexão bem-sucedida!');
        // Recarrega a página para garantir que todos os componentes usem a nova API
        setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
        toast.error('Endereço salvo, mas não foi possível conectar. Verifique a URL e a rede.');
    } finally {
        setSavingApiUrl(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Configurações do Sistema</h1>
      
      {/* Card para Configurações da API */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Conexão com o Servidor (API)</CardTitle>
          <CardDescription>
            Defina o endereço de rede do servidor onde a API está rodando.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="space-y-4 max-w-xl">
              <div className="space-y-2">
                <Label htmlFor="api-url">Endereço do Servidor</Label>
                <Input
                  id="api-url"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="Ex: http://192.168.0.199:3000/api"
                />
                <p className="text-sm text-muted-foreground">
                  Altere este valor caso o frontend não consiga se conectar com o servidor.
                </p>
              </div>
              <Button onClick={handleSaveApiUrl} disabled={savingApiUrl}>
                {savingApiUrl ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Salvar e Testar Conexão
              </Button>
            </div>
        </CardContent>
      </Card>

      {/* Card Existente para Integração com PDV */}
      <Card>
        <CardHeader>
          <CardTitle>Integração com PDV</CardTitle>
          <CardDescription>
            Defina as configurações para a integração com o sistema de Ponto de Venda (PDV ).
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
                </p>
              </div>
              <Button onClick={handleSaveExportPath} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Salvar Configuração do PDV
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
