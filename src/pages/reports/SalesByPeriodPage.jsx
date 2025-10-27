// src/pages/reports/SalesByPeriodPage.jsx

import React, { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, startOfToday, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, FilterXIcon, Loader2, FileDown, FileSpreadsheet, BarChart2 } from "lucide-react";
import * as XLSX from "xlsx";
import pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts";

if (pdfFonts && pdfFonts.pdfMake) {
  pdfMake.vfs = pdfFonts.pdfMake.vfs;
}

// --- UI Components ---
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// --- Loading & Error States ---
const LoadingState = () => (
  <div className="flex justify-center items-center py-24">
    <Loader2 className="h-12 w-12 animate-spin text-primary" />
  </div>
);

const ErrorState = ({ error }) => (
  <div className="p-4 bg-red-50 text-red-700 rounded-md">
    <h3 className="font-bold">Não foi possível carregar o relatório.</h3>
    <p className="text-sm mt-2">
      <strong>Detalhe:</strong> {error}
    </p>
  </div>
);

// --- Schema ---
const filterSchema = z.object({
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  customer: z.string().optional(),
  status: z.enum(["all", "completed", "canceled"]).default("all"),
  minValue: z.coerce.number().optional(),
  maxValue: z.coerce.number().optional(),
});

const SalesByPeriodPage = () => {
  const [filters, setFilters] = useState({ status: "all" });
  const [salesData, setSalesData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const form = useForm({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      customer: "",
      status: "all",
    },
  });

  // --- Buscar dados da API ---
  useEffect(() => {
    const fetchSalesData = async () => {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.startDate) params.append("startDate", format(filters.startDate, "yyyy-MM-dd"));
      if (filters.endDate) params.append("endDate", format(filters.endDate, "yyyy-MM-dd"));
      if (filters.customer) params.append("customerName", filters.customer);
      if (filters.status && filters.status !== "all") params.append("status", filters.status);
      if (filters.minValue) params.append("minValue", String(filters.minValue));
      if (filters.maxValue) params.append("maxValue", String(filters.maxValue));

      try {
        const response = await fetch(`/api/reports/sales-by-period?${params.toString()}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Falha ao ler resposta do servidor." }));
          throw new Error(errorData.error || `Erro ${response.status}`);
        }
        const data = await response.json();
        setSalesData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido ao buscar dados.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSalesData();
  }, [filters]);

  const onSubmit = (data) => setFilters(data);

  const clearFilters = () => {
    form.reset({ customer: "", status: "all", minValue: undefined, maxValue: undefined, startDate: undefined, endDate: undefined });
    setFilters({ status: "all" });
  };

  // --- Filtros rápidos ---
  const setQuickFilter = (type) => {
    const today = startOfToday();
    let start, end;
    switch (type) {
      case "today":
        start = today;
        end = today;
        break;
      case "7days":
        start = subDays(today, 7);
        end = today;
        break;
      case "30days":
        start = subDays(today, 30);
        end = today;
        break;
      case "thisMonth":
        start = startOfMonth(today);
        end = endOfMonth(today);
        break;
      case "lastMonth":
        start = startOfMonth(subMonths(today, 1));
        end = endOfMonth(subMonths(today, 1));
        break;
      default:
        return;
    }
    form.setValue("startDate", start);
    form.setValue("endDate", end);
    setFilters({ ...filters, startDate: start, endDate: end });
  };

  // --- Preparar dados do gráfico ---
  const chartData = useMemo(() => {
    if (!Array.isArray(salesData)) return [];
    const grouped = {};
    salesData.forEach((sale) => {
      const day = format(new Date(sale.created_at), "dd/MM");
      const value = parseFloat(sale.total_value || 0);
      if (!grouped[day]) grouped[day] = { date: day, efetivadas: 0, canceladas: 0 };
      if (sale.status === "FINALIZADO") grouped[day].efetivadas += value;
      else if (sale.status === "CANCELADO") grouped[day].canceladas += value;
    });
    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date, undefined, { numeric: true }));
  }, [salesData]);

  // --- Exportar PDF ---
  const exportPDF = () => {
    const body = [
      ["ID Venda", "Cliente", "Data", "Status", "Valor"],
      ...salesData.map((s) => [
        s.id,
        s.customer_name || "Sem Cliente",
        s.created_at ? format(new Date(s.created_at), "dd/MM/yyyy HH:mm") : "",
        s.status,
        `R$ ${(parseFloat(s.total_value) || 0).toFixed(2)}`,
      ]),
    ];

    const doc = {
      content: [
        { text: "Relatório de Vendas por Período", style: "header" },
        { text: `Gerado em ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`, style: "subheader" },
        { table: { headerRows: 1, widths: ["*", "*", "*", "*", "*"], body } },
      ],
      styles: {
        header: { fontSize: 16, bold: true, marginBottom: 10 },
        subheader: { fontSize: 10, marginBottom: 10 },
      },
    };
    pdfMake.createPdf(doc).download("relatorio-vendas.pdf");
  };

  // --- Exportar Excel ---
  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      salesData.map((s) => ({
        ID: s.id,
        Cliente: s.customer_name || "N/A",
        Data: s.created_at ? format(new Date(s.created_at), "dd/MM/yyyy HH:mm") : "",
        Status: s.status,
        Valor: (parseFloat(s.total_value) || 0).toFixed(2),
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Vendas");
    XLSX.writeFile(wb, "relatorio-vendas.xlsx");
  };

  // --- Render ---
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Relatório de Vendas por Período</h1>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Refine os resultados do relatório abaixo.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                {/* Data Inicial */}
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Inicial</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant="outline" className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}>
                              {field.value ? format(field.value, "PPP", { locale: ptBR }) : "Escolha uma data"}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        </PopoverContent>
                      </Popover>
                    </FormItem>
                  )}
                />

                {/* Data Final */}
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Final</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant="outline" className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}>
                              {field.value ? format(field.value, "PPP", { locale: ptBR }) : "Escolha uma data"}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        </PopoverContent>
                      </Popover>
                    </FormItem>
                  )}
                />

                {/* Cliente */}
                <FormField control={form.control} name="customer" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do cliente" {...field} />
                    </FormControl>
                  </FormItem>
                )} />

                {/* Status */}
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">Ambos</SelectItem>
                        <SelectItem value="completed">Efetivadas</SelectItem>
                        <SelectItem value="canceled">Canceladas</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />

                {/* Valores */}
                <FormField control={form.control} name="minValue" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Mínimo (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Ex: 50.00" {...field} />
                    </FormControl>
                  </FormItem>
                )} />

                <FormField control={form.control} name="maxValue" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Máximo (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Ex: 500.00" {...field} />
                    </FormControl>
                  </FormItem>
                )} />
              </div>

              {/* Botões */}
              <div className="flex flex-wrap justify-between items-center pt-4 gap-2">
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={() => setQuickFilter("today")}>Hoje</Button>
                  <Button type="button" variant="outline" onClick={() => setQuickFilter("7days")}>Últimos 7 dias</Button>
                  <Button type="button" variant="outline" onClick={() => setQuickFilter("30days")}>Últimos 30 dias</Button>
                  <Button type="button" variant="outline" onClick={() => setQuickFilter("thisMonth")}>Este mês</Button>
                  <Button type="button" variant="outline" onClick={() => setQuickFilter("lastMonth")}>Mês passado</Button>
                </div>

                <div className="flex gap-2">
                  <Button type="button" variant="ghost" onClick={clearFilters}>
                    <FilterXIcon className="w-4 h-4 mr-1" /> Limpar
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando...</> : "Gerar"}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Conteúdo */}
      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState error={error} />
      ) : (
        <div className="space-y-6">
          {/* Gráfico */}
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>Total de Vendas por Dia</CardTitle>
              <BarChart2 className="text-gray-400" />
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                {chartData.length > 0 ? (
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={(v) => `R$ ${Number(v).toFixed(2)}`} />
                    <Tooltip formatter={(v) => [`R$ ${Number(v).toFixed(2)}`]} />
                    <Legend />
                    <Line type="monotone" dataKey="efetivadas" name="Efetivadas" stroke="#16a34a" strokeWidth={2} />
                    <Line type="monotone" dataKey="canceladas" name="Canceladas" stroke="#dc2626" strokeWidth={2} />
                  </LineChart>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Nenhum dado de venda efetivada ou cancelada para exibir no gráfico.
                  </div>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Detalhes + Exportação */}
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>Detalhes das Vendas</CardTitle>
              <div className="flex gap-2">
                <Button onClick={exportPDF} variant="outline"><FileDown className="w-4 h-4 mr-1" /> PDF</Button>
                <Button onClick={exportExcel} variant="outline"><FileSpreadsheet className="w-4 h-4 mr-1" /> Excel</Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesData.length > 0 ? (
                    salesData.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-mono">{s.id}</TableCell>
                        <TableCell>
                            {s.customer_name ? (
                                // Se o nome do cliente existe, exibe normalmente
                                <span>{s.customer_name}</span>
                            ) : (
                                // Se não existe, exibe "sem cliente" com uma classe de cor cinza
                                <span className="text-gray-500 italic">Sem cliente</span>
                            )}
                        </TableCell>
                        <TableCell>{s.created_at ? format(new Date(s.created_at), "dd/MM/yyyy HH:mm") : "—"}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              s.status === "FINALIZADO"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {s.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium">{`R$ ${(parseFloat(s.total_value) || 0).toFixed(2)}`}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan="5" className="text-center py-4 text-gray-500">
                        Nenhum registro encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SalesByPeriodPage;
