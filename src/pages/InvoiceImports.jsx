import { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 1. IMPORTAR useNavigate
import { XMLParser } from 'fast-xml-parser';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, PackagePlus } from 'lucide-react';
import api from '../lib/api.js';

const InvoiceImport = () => {
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [fileName, setFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAllSelected, setIsAllSelected] = useState(true);
  const navigate = useNavigate(); // 2. INICIALIZAR O HOOK

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'text/xml') {
      setFileName(file.name);
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const xmlContent = e.target.result;
          const parser = new XMLParser({ ignoreAttributes: false, parseAttributeValue: true });
          const jsonObj = parser.parse(xmlContent);
          
          const nfe = jsonObj.nfeProc?.NFe || jsonObj.NFe;
          let items = nfe?.infNFe?.det;

          if (items && !Array.isArray(items)) {
            items = [items];
          }

          if (!items) {
            toast.error("Não foram encontrados produtos (tag <det>) neste XML.");
            return;
          }

          const extractedItems = items.map(item => {
            const cEAN = item.prod.cEAN ? item.prod.cEAN.toString() : '';
            const cProd = item.prod.cProd ? item.prod.cProd.toString() : '';
            const sku = (cEAN && cEAN.trim().toUpperCase() !== 'SEM GTIN') ? cEAN : cProd;

            return {
              code: cProd,
              barcode: sku,
              name: item.prod.xProd,
              unit: item.prod.uCom,
              quantity: parseFloat(item.prod.qCom),
              unitCost: parseFloat(item.prod.vUnCom),
              conversionFactor: 1,
              isSelected: true,
            };
          });

          setInvoiceItems(extractedItems);
          setIsAllSelected(true);
          toast.success(`${extractedItems.length} produtos carregados do XML!`);

        } catch (error) {
          console.error("Erro ao processar XML:", error);
          toast.error("Ocorreu um erro ao ler o arquivo XML. Verifique o formato.");
          setInvoiceItems([]);
          setFileName('');
        }
      };
      
      reader.readAsText(file);
    } else {
      toast.error("Por favor, selecione um arquivo XML válido.");
      setInvoiceItems([]);
      setFileName('');
    }
  };

  const handleSelectAll = (checked) => {
    setIsAllSelected(checked);
    const newItems = invoiceItems.map(item => ({ ...item, isSelected: checked }));
    setInvoiceItems(newItems);
  };

  const handleSelectItem = (index, checked) => {
    const newItems = [...invoiceItems];
    newItems[index].isSelected = checked;
    setInvoiceItems(newItems);
    setIsAllSelected(newItems.every(item => item.isSelected));
  };

  const handleConversionChange = (index, value) => {
    const newItems = [...invoiceItems];
    const factor = parseFloat(value);
    newItems[index].conversionFactor = !isNaN(factor) && factor > 0 ? factor : 1;
    setInvoiceItems(newItems);
  };

  const handleStockUpdate = async () => {
    const selectedItems = invoiceItems.filter(item => item.isSelected);

    if (selectedItems.length === 0) {
      toast.error("Nenhum item selecionado para dar entrada.");
      return;
    }

    const itemsToSubmit = selectedItems.map(item => ({
      code: item.code,
      barcode: item.barcode,
      name: item.name,
      quantity: item.quantity * item.conversionFactor,
      cost: item.unitCost / item.conversionFactor,
    }));

    setIsSubmitting(true);

    try {
      const promise = api.post('/products/stock-entry', { items: itemsToSubmit });

      await toast.promise(promise, {
        loading: `Dando entrada em ${itemsToSubmit.length} produto(s)...`,
        success: (response) => {
          // 3. NAVEGAR PARA A PÁGINA DE PRODUTOS COM SINAL DE ATUALIZAÇÃO
          navigate('/products', { state: { needsUpdate: true } });
          return response.data.message || 'Estoque atualizado com sucesso!';
        },
        error: (err) => {
          return `Erro: ${err.response?.data?.error || err.message}`;
        },
      });

    } catch (error) {
      console.error("Falha na submissão do estoque:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCount = invoiceItems.filter(item => item.isSelected).length;

  return (
    <div className="p-6">
      {/* O JSX do componente permanece o mesmo */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Importar Nota Fiscal (XML)</h1>
        <p className="text-gray-600">Faça o upload de um arquivo XML da NF-e para dar entrada nos produtos.</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>1. Selecionar Arquivo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <label htmlFor="xml-upload" className="flex-grow">
              <Input id="xml-upload" type="file" accept=".xml,text/xml" onChange={handleFileChange} className="hidden" />
              <Button asChild variant="outline">
                <span className="cursor-pointer flex items-center">
                  <Upload className="w-4 h-4 mr-2" />
                  Escolher XML
                </span>
              </Button>
            </label>
            {fileName && <p className="text-sm text-gray-500">Arquivo: {fileName}</p>}
          </div>
        </CardContent>
      </Card>

      {invoiceItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>2. Revisar e Selecionar Itens</CardTitle>
            <CardDescription>Marque os produtos que deseja cadastrar, ajuste as conversões e dê entrada no estoque.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={handleSelectAll}
                        aria-label="Selecionar todos"
                      />
                    </TableHead>
                    <TableHead>Produto (SKU)</TableHead>
                    <TableHead>Un. Compra</TableHead>
                    <TableHead>Qtd. Compra</TableHead>
                    <TableHead>Fator Conversão</TableHead>
                    <TableHead className="text-right">Qtd. Final (Estoque)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoiceItems.map((item, index) => (
                    <TableRow key={`${item.barcode}-${index}`} data-state={item.isSelected ? 'selected' : ''}>
                      <TableCell>
                        <Checkbox
                          checked={item.isSelected}
                          onCheckedChange={(checked) => handleSelectItem(index, checked)}
                          aria-label={`Selecionar ${item.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-muted-foreground font-mono">{item.barcode}</div>
                      </TableCell>
                      <TableCell className="text-center font-medium">{item.unit}</TableCell>
                      <TableCell className="text-center">{item.quantity.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>1 {item.unit} =</span>
                          <Input
                            type="number"
                            min="1"
                            step="1"
                            value={item.conversionFactor}
                            onChange={(e) => handleConversionChange(index, e.target.value)}
                            className="h-8 w-20 text-center"
                            disabled={!item.isSelected}
                          />
                          <span>UN</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold text-lg">
                        {(item.quantity * item.conversionFactor).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={handleStockUpdate} disabled={isSubmitting || selectedCount === 0} className="bg-green-600 hover:bg-green-700">
                <PackagePlus className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Processando...' : `Dar Entrada em ${selectedCount} Iten(s)`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InvoiceImport;
