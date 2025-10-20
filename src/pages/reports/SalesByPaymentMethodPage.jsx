// src/pages/reports/SalesByPaymentMethodPage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { Loader2, FileDown, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts";

// Configuração do PDFMake
if (pdfFonts && pdfFonts.pdfMake) {
  pdfMake.vfs = pdfFonts.pdfMake.vfs;
}

// --- Componentes da UI ---
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Button } from '@/components/ui/button';
import { MultiSelect } from '@/components/ui/multi-select'; // Importando o novo componente

// --- Gráficos (recharts) ---
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// --- Componentes de Estado da UI ---
const LoadingState = () => (
  <div className="flex justify-center items-center py-24">
    <Loader2 className="h-12 w-12 animate-spin text-primary" />
  </div>
);

const ErrorState = ({ error }) => (
  <div className="p-4 bg-red-50 text-red-700 rounded-md">
    <h3 className="font-bold">Não foi possível carregar o relatório.</h3>
    <p className="text-sm mt-2"><strong>Detalhe:</strong> {error}</p>
  </div>
);

const COLORS = ['#10b981', '#3b82f6', '#f97316', '#ef4444', '#8b5cf6', '#ec4899'];

const SalesByPaymentMethodPage = () => {
  // --- Estados do Componente ---
  const [dateRange, setDateRange] = useState(undefined);
  const [reportData, setReportData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para o novo filtro de MultiSelect
  const [paymentMethods, setPaymentMethods] = useState([]); // Lista de todas as opções
  const [selectedMethods, setSelectedMethods] = useState([]); // Lista das opções selecionadas

  // --- Efeitos (Hooks) ---

  // Efeito para buscar a lista de todas as formas de pagamento (executa uma vez)
  useEffect(() => {
    const fetchAllPaymentMethods = async () => {
      try {
        // Busca apenas as formas de pagamento ativas
        const response = await fetch('/api/payment-methods?is_active=true');
        if (!response.ok) throw new Error('Falha ao buscar formas de pagamento');
        const data = await response.json();
        // Formata os dados para o formato que o MultiSelect espera: { label, value }
        setPaymentMethods(data.paymentMethods.map(pm => ({ label: pm.name, value: pm.id })));
      } catch (e) {
        console.error("Falha ao buscar formas de pagamento", e);
        // Opcional: mostrar um toast de erro
      }
    };
    fetchAllPaymentMethods();
  }, []);

  // Efeito principal para buscar os dados do relatório (executa quando os filtros mudam)
  useEffect(() => {
    const fetchReportData = async () => {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (dateRange?.from) params.append('startDate', format(dateRange.from, 'yyyy-MM-dd'));
      if (dateRange?.to) params.append('endDate', format(dateRange.to, 'yyyy-MM-dd'));
      
      // Adiciona os IDs selecionados aos parâmetros da requisição
      if (selectedMethods.length > 0) {
        params.append('paymentMethodIds', selectedMethods.map(pm => pm.value).join(','));
      }

      try {
        const response = await fetch(`/api/reports/sales-by-payment-method?${params.toString()}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Falha ao ler a resposta do servidor.' }));
          throw new Error(errorData.error || `Erro ${response.status}`);
        }
        const data = await response.json();
        setReportData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReportData();
  }, [dateRange, selectedMethods]); // Depende agora também das formas de pagamento selecionadas

  const totalValue = useMemo(() => reportData.reduce((sum, item) => sum + (item.value || 0), 0), [reportData]);

  // --- Funções de Exportação (sem alterações) ---
  const exportPDF = () => { /* ...código existente... */ };
  const exportExcel = () => { /* ...código existente... */ };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vendas por Forma de Pagamento</h1>
          <p className="text-gray-500">Analise o faturamento por cada método de pagamento.</p>
        </div>
        <div className="flex items-center gap-4">
          <DateRangePicker date={dateRange} onDateChange={setDateRange} />
        </div>
      </div>

      {/* --- Card de Filtros Adicionais --- */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Selecione as formas de pagamento para incluir no relatório.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-md">
            <label className="text-sm font-medium mb-2 block">Formas de Pagamento</label>
            <MultiSelect
              options={paymentMethods}
              selected={selectedMethods}
              onChange={setSelectedMethods}
              placeholder="Selecionar..."
            />
          </div>
        </CardContent>
      </Card>

      {/* --- Conteúdo do Relatório --- */}
      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState error={error} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>Detalhes</CardTitle>
              <div className="flex gap-2">
                <Button onClick={exportPDF} variant="outline" size="sm"><FileDown className="w-4 h-4 mr-1" /> PDF</Button>
                <Button onClick={exportExcel} variant="outline" size="sm"><FileSpreadsheet className="w-4 h-4 mr-1" /> Excel</Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Forma de Pagamento</TableHead>
                    <TableHead>Qtd. Vendas</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.length > 0 ? (
                    reportData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium flex items-center">
                          <span className="h-2 w-2 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          {item.name}
                        </TableCell>
                        <TableCell>{item.count}</TableCell>
                        <TableCell className="text-right">R$ {(item.value || 0).toFixed(2)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan="3" className="text-center h-24">Nenhum dado encontrado para os filtros aplicados.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribuição Percentual</CardTitle>
              <CardDescription>Baseado no valor total faturado.</CardDescription>
            </CardHeader>
            <CardContent>
              {reportData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={reportData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                        const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                        const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                        return (
                          <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                            {`${(percent * 100).toFixed(0)}%`}
                          </text>
                        );
                      }}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {reportData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `R$ ${Number(value).toFixed(2)}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  Sem dados para exibir o gráfico.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SalesByPaymentMethodPage;
