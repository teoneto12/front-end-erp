// frontend/src/pages/VarejoFacil.jsx

import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, RefreshCw, ShieldCheck, ShieldAlert } from 'lucide-react';
import { toast } from 'react-hot-toast';

const VarejoFacil = () => {
  const [apiToken, setApiToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);

  useEffect(() => {
    const fetchTokenAndTest = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/settings/varejo_facil_api_token');
        setApiToken(data.value || '');
        if (data.value) {
          await api.post('/varejo-facil/test-connection');
          setConnectionStatus('success');
        } else {
          setConnectionStatus('error');
        }
      } catch (error) {
        console.log(error.response?.data?.error || "Falha ao verificar token.");
        setConnectionStatus('error');
      } finally {
        setLoading(false);
      }
    };
    fetchTokenAndTest();
  }, []);

  const handleSaveAndTestToken = async (e) => {
    e.preventDefault();
    setLoading(true);
    setConnectionStatus(null);
    try {
      await api.post('/settings/varejo_facil_api_token', { value: apiToken });
      toast.success('Token salvo com sucesso!');
      await api.post('/varejo-facil/test-connection');
      setConnectionStatus('success');
      toast.success('Conexão com Varejo Fácil verificada com sucesso!');
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Ocorreu um erro.';
      setConnectionStatus('error');
      toast.error(`Falha na operação: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncProducts = async () => {
    setSyncing(true);
    const toastId = toast.loading('Iniciando sincronização de produtos...');
    try {
      const { data } = await api.post('/varejo-facil/sync-products');
      toast.success(
        `Sincronização concluída!\nProdutos novos: ${data.novos}\nProdutos atualizados: ${data.atualizados}`,
        { id: toastId, duration: 6000 }
      );
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Ocorreu um erro desconhecido.';
      toast.error(`Falha na sincronização: ${errorMessage}`, { id: toastId });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Integração Varejo Fácil</h1>
        <p className="text-gray-600">Conecte e sincronize dados com o seu ERP Varejo Fácil.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>1. Configuração da Conexão</CardTitle>
            <CardDescription>
              Insira o seu <strong>X-API-TOKEN</strong> fornecido pelo Varejo Fácil.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveAndTestToken} className="space-y-4">
              <div>
                <Label htmlFor="apiToken">X-API-TOKEN</Label>
                <Input
                  id="apiToken"
                  name="apiToken"
                  type="password"
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  placeholder="Cole seu token aqui"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Salvar e Testar Conexão
              </Button>
              {connectionStatus === 'success' && (
                <div className="flex items-center justify-center text-green-600 mt-4">
                  <ShieldCheck className="mr-2 h-5 w-5" />
                  <span>Conexão Ativa!</span>
                </div>
              )}
              {connectionStatus === 'error' && (
                <div className="flex items-center justify-center text-red-600 mt-4">
                  <ShieldAlert className="mr-2 h-5 w-5" />
                  <span>Falha na Conexão!</span>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>2. Sincronização de Dados</CardTitle>
            <CardDescription>
              Após a conexão ser ativada, você poderá sincronizar os dados.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleSyncProducts}
              disabled={connectionStatus !== 'success' || syncing || loading} 
              className="w-full"
            >
              {syncing ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sincronizando...</>
              ) : (
                <><RefreshCw className="mr-2 h-4 w-4" />Sincronizar Produtos</>
              )}
            </Button>
            <Button disabled={true} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Sincronizar Clientes (em breve)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VarejoFacil;
