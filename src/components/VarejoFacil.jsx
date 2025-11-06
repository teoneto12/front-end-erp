// frontend/src/pages/VarejoFacil.jsx

import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, ShieldCheck, ShieldAlert } from 'lucide-react';
import { toast } from 'react-hot-toast';

const VarejoFacil = () => {
  const [apiUrl, setApiUrl] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);

  useEffect(() => {
    const fetchSettingsAndTest = async () => {
      setLoading(true);
      setConnectionStatus(null);
      try {
        // Busca as duas configurações em paralelo
        const [urlRes, tokenRes] = await Promise.all([
          api.get('/settings/varejo_facil_api_url').catch(() => ({ data: { value: '' } })),
          api.get('/settings/varejo_facil_api_token').catch(() => ({ data: { value: '' } }))
        ]);
        
        const url = urlRes.data.value || 'https://f5automacao.varejofacil.com/api/v1';
        const token = tokenRes.data.value || '';

        setApiUrl(url );
        setApiToken(token);

        if (token && url) {
          await api.post('/varejo-facil/test-connection');
          setConnectionStatus('success');
        } else {
          setConnectionStatus('error');
        }
      } catch (error) {
        console.error(error.response?.data?.error || "Falha ao verificar configurações.");
        setConnectionStatus('error');
      } finally {
        setLoading(false);
      }
    };
    fetchSettingsAndTest();
  }, []);

  const handleSaveAndTest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setConnectionStatus(null);
    try {
      // Salva as duas configurações em paralelo
      await Promise.all([
        api.post('/settings/varejo_facil_api_url', { value: apiUrl }),
        api.post('/settings/varejo_facil_api_token', { value: apiToken })
      ]);
      toast.success('Configurações salvas com sucesso!');
      
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

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Integração Varejo Fácil</h1>
        <p className="text-gray-600">Conecte e sincronize dados com o seu ERP Varejo Fácil.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Configuração da Conexão</CardTitle>
          <CardDescription>
            Insira a URL base da API e o seu X-API-TOKEN fornecido pelo Varejo Fácil.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveAndTest} className="space-y-4">
            <div>
              <Label htmlFor="apiUrl">URL Base da API</Label>
              <Input
                id="apiUrl"
                name="apiUrl"
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="Ex: https://f5automacao.varejofacil.com/api/v1"
                required
              />
            </div>
            <div>
              <Label htmlFor="apiToken">X-API-TOKEN</Label>
              <Input
                id="apiToken"
                name="apiToken"
                type="password"
                value={apiToken}
                onChange={(e ) => setApiToken(e.target.value)}
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
                <span>Falha na Conexão! Verifique a URL e o Token.</span>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default VarejoFacil;
