import React, { useState, useEffect } from 'react';
import api, { updateApiBaseUrl } from '../lib/api';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Save } from 'lucide-react';
import toast from 'react-hot-toast';

import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from "@/components/ui/tabs";

const Settings = () => {

  // PRE-SALE PATH
  const [exportPath, setExportPath] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // SERVICE FEE
  const [serviceFee, setServiceFee] = useState('');
  const [loadingServiceFee, setLoadingServiceFee] = useState(true);
  const [savingServiceFee, setSavingServiceFee] = useState(false);

  // API URL
  const [apiUrl, setApiUrl] = useState(() =>
    localStorage.getItem('apiBaseUrl') || 'http://localhost:3000/api'
  );
  const [savingApiUrl, setSavingApiUrl] = useState(false);

  // ==============================
  // BUSCAR CONFIGURAÇÕES INICIAIS
  // ==============================
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const response = await api.get('/settings/PRE_SALE_EXPORT_PATH');
        setExportPath(response.data.value || '');
      } catch (error) {
        console.error("Erro:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchServiceFee = async () => {
      setLoadingServiceFee(true);
      try {
        const response = await api.get('/settings/SERVICE_FEE_PERCENT');
        setServiceFee(response.data.value || '');
      } catch (error) {
        console.error("Erro ao buscar taxa de serviço:", error);
      } finally {
        setLoadingServiceFee(false);
      }
    };

    fetchSettings();
    fetchServiceFee();
  }, []);

  // ==============================
  // SALVAR CAMINHO DE EXPORTAÇÃO
  // ==============================
  const handleSaveExportPath = async () => {
    setSaving(true);

    const promise = api.post('/settings/PRE_SALE_EXPORT_PATH', {
      value: exportPath
    });

    toast.promise(promise, {
      loading: 'Salvando...',
      success: 'Caminho salvo!',
      error: (err) => `Erro: ${err.response?.data?.error || err.message}`,
    });

    try {
      await promise;
    } finally {
      setSaving(false);
    }
  };

  // ==============================
  // SALVAR TAXA DE SERVIÇO
  // ==============================
  const handleSaveServiceFee = async () => {
    setSavingServiceFee(true);

    const numeric = Number(serviceFee);
    if (isNaN(numeric) || numeric < 0 || numeric > 100) {
      toast.error("Informe uma taxa válida entre 0 e 100.");
      setSavingServiceFee(false);
      return;
    }

    const promise = api.post('/settings/SERVICE_FEE_PERCENT', {
      value: numeric.toString()
    });

    toast.promise(promise, {
      loading: 'Salvando taxa...',
      success: 'Taxa de serviço salva!',
      error: (err) => `Erro: ${err.response?.data?.error || err.message}`,
    });

    try {
      await promise;
    } finally {
      setSavingServiceFee(false);
    }
  };

  // ==============================
  // SALVAR URL DA API
  // ==============================
  const handleSaveApiUrl = async () => {
    setSavingApiUrl(true);

    if (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
      toast.error('URL inválida.');
      setSavingApiUrl(false);
      return;
    }

    localStorage.setItem('apiBaseUrl', apiUrl);
    updateApiBaseUrl(apiUrl);

    try {
      await api.get('/settings/PRE_SALE_EXPORT_PATH');
      toast.success('Conexão OK!');
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      toast.error('Endereço salvo, mas não conectou.');
    } finally {
      setSavingApiUrl(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Configurações do Sistema</h1>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="general">Configurações Gerais</TabsTrigger>
          <TabsTrigger value="restaurant">Configurações do Restaurante</TabsTrigger>
        </TabsList>

        {/* ----------------------------- */}
        {/* ABA 1 — CONFIGURAÇÕES GERAIS */}
        {/* ----------------------------- */}
        <TabsContent value="general">

          {/* Card API */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Conexão com o Servidor (API)</CardTitle>
              <CardDescription>Defina o endereço da API.</CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-4 max-w-xl">
                <Label htmlFor="api-url">Endereço do Servidor</Label>
                <Input
                  id="api-url"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                />

                <Button onClick={handleSaveApiUrl} disabled={savingApiUrl}>
                  {savingApiUrl ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Salvar e Testar Conexão
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card PRE-VENDA */}
          <Card>
            <CardHeader>
              <CardTitle>Integração com PDV</CardTitle>
              <CardDescription>Caminho da exportação de pré-venda.</CardDescription>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Carregando...</span>
                </div>
              ) : (
                <div className="space-y-4 max-w-xl">
                  <Label htmlFor="export-path">Caminho da Pré-Venda</Label>
                  <Input
                    id="export-path"
                    value={exportPath}
                    onChange={(e) => setExportPath(e.target.value)}
                  />

                  <Button onClick={handleSaveExportPath} disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Salvar Configuração do PDV
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

        </TabsContent>

        {/* ----------------------------- */}
        {/* ABA 2 — CONFIG. RESTAURANTE  */}
        {/* ----------------------------- */}
        <TabsContent value="restaurant">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Restaurante</CardTitle>
              <CardDescription>Mesas, comandas e regras de consumo.</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 max-w-xl">

              {/* TAXA DE SERVIÇO */}
              <div className="space-y-2">
                <Label htmlFor="service-fee">Taxa de Serviço (%)</Label>

                {loadingServiceFee ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Carregando...</span>
                  </div>
                ) : (
                  <>
                    <Input
                      id="service-fee"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={serviceFee}
                      onChange={(e) => setServiceFee(e.target.value)}
                    />

                    <Button onClick={handleSaveServiceFee} disabled={savingServiceFee}>
                      {savingServiceFee ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Salvar Taxa de Serviço
                    </Button>
                  </>
                )}
              </div>

            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
};

export default Settings;
