// src/components/reports/ReportDisplay.jsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';

// Função simples para exportar para CSV (pode ser melhorada)
const exportToCSV = (data, headers, filename) => {
  const csvRows = [];
  const headerRow = headers.map(h => h.label);
  csvRows.push(headerRow.join(','));

  for (const row of data) {
    const values = headers.map(header => {
      const escaped = ('' + row[header.key]).replace(/"/g, '\\"');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('hidden', '');
  a.setAttribute('href', url);
  a.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

const ReportDisplay = ({ title, description, headers, data, loading, filterBar, onExport }) => {
  const handleExport = () => {
    if (onExport) {
      onExport(); // Permite uma lógica customizada de exportação
    } else {
      exportToCSV(data, headers, title.toLowerCase().replace(/ /g, '_'));
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
      <p className="text-gray-600 mb-6">{description}</p>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex-1">
              <CardTitle>Resultados</CardTitle>
              <CardDescription>Dados gerados com base nos filtros aplicados.</CardDescription>
            </div>
            {filterBar}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end mb-4">
            <Button onClick={handleExport} disabled={loading || !data || data.length === 0} variant="outline">
              <FileDown className="w-4 h-4 mr-2" />
              Exportar para CSV
            </Button>
          </div>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  {headers.map((header) => <TableHead key={header.key}>{header.label}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={headers.length} className="h-24 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                    </TableCell>
                  </TableRow>
                ) : !data || data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={headers.length} className="h-24 text-center">
                      Nenhum resultado encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {headers.map((header) => (
                        <TableCell key={`${rowIndex}-${header.key}`}>
                          {row[header.key]}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportDisplay;
