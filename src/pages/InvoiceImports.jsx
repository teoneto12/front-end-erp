import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { XMLParser } from 'fast-xml-parser';
import toast from 'react-hot-toast';
import api from '../lib/api.js';

// Componentes de UI (assumindo que você os tem em seu projeto)
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

// Ícones
import { Upload, PackagePlus, Loader2, ArrowDown, ArrowUp, Minus, Link2, PlusCircle, RefreshCw, ChevronsUpDown } from 'lucide-react';

// Componente de Combobox para busca e associação de produtos
const AssociationCombobox = ({ item, onAssociationChange }) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Efeito para buscar produtos com base no termo digitado
  useEffect(() => {
    // Se o campo de busca estiver vazio, mostra as sugestões iniciais
    if (searchTerm.length < 2) {
      setSearchResults(item.matchData.suggestions || []);
      return;
    }

    const debounce = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await api.get('/products', { params: { search: searchTerm, limit: 10 } });
        setSearchResults(response.data.products || []);
      } catch (error) {
        console.error("Erro ao buscar produtos:", error);
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300); // Atraso para evitar buscas a cada tecla

    return () => clearTimeout(debounce);
  }, [searchTerm, item.matchData.suggestions]);

  const handleSelect = (product) => {
    onAssociationChange(product);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-[300px] justify-between bg-amber-50 border-amber-300">
          <span className="truncate">
            {item.matchData.associatedProduct ? item.matchData.associatedProduct.name : "Selecione para associar..."}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput
            placeholder="Digite para buscar produto..."
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            {isLoading && <CommandEmpty>Buscando...</CommandEmpty>}
            {!isLoading && searchResults.length === 0 && searchTerm.length > 1 && <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>}
            
            <CommandGroup>
               <CommandItem onSelect={() => handleSelect(null)} className="text-blue-600 cursor-pointer">
                  <PlusCircle size={14} className="mr-2" /> Criar como novo produto
               </CommandItem>
              {searchResults.map((product) => (
                <CommandItem
                  key={product.id}
                  value={product.name}
                  onSelect={() => handleSelect(product)}
                  className="cursor-pointer"
                >
                  {product.name} <span className="text-xs ml-2 text-gray-500">({product.sku})</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};


const InvoiceImport = () => {
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [fileName, setFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAllSelected, setIsAllSelected] = useState(true);
  const navigate = useNavigate();

  const [additionalCosts, setAdditionalCosts] = useState({ freight: 0, expenses: 0, discount: 0 });
  const [shouldRateCost, setShouldRateCost] = useState(true);
  const [isMatching, setIsMatching] = useState(false);

  useEffect(() => {
    if (invoiceItems.length > 0) {
      recalculateFinalCosts();
    }
  }, [additionalCosts, shouldRateCost]);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file || file.type !== 'text/xml') {
      toast.error("Por favor, selecione um arquivo XML válido.");
      return;
    }

    setFileName(file.name);
    setIsMatching(true);
    toast.loading('Lendo XML e buscando associações...', { id: 'matching-toast' });

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const xmlContent = e.target.result;
        const parser = new XMLParser({ ignoreAttributes: false, parseAttributeValue: true });
        const jsonObj = parser.parse(xmlContent);

        const nfe = jsonObj.nfeProc?.NFe || jsonObj.NFe;
        if (!nfe) throw new Error("Estrutura NFe não encontrada no XML.");

        let items = nfe.infNFe.det;
        if (items && !Array.isArray(items)) items = [items];
        if (!items) throw new Error("Nenhum produto (tag <det>) encontrado.");

        const icmsTotal = nfe.infNFe.total.ICMSTot;
        setAdditionalCosts({
          freight: parseFloat(icmsTotal.vFrete) || 0,
          expenses: parseFloat(icmsTotal.vOutro) || 0,
          discount: parseFloat(icmsTotal.vDesc) || 0,
        });

        const processedItems = await Promise.all(items.map(async (item) => {
          const cEAN = item.prod.cEAN?.toString() || '';
          const cProd = item.prod.cProd?.toString() || '';
          const sku = (cEAN && cEAN.trim().toUpperCase() !== 'SEM GTIN') ? cEAN : cProd;
          const name = item.prod.xProd;

          const response = await api.post('/products/find-match', { barcode: sku, name, supplierCode: cProd });
          const { matchType, product, suggestions } = response.data;

          return {
            xmlData: {
              code: cProd, barcode: sku, name: name, unit: item.prod.uCom,
              quantity: parseFloat(item.prod.qCom), unitCost: parseFloat(item.prod.vUnCom),
            },
            matchData: {
              matchType, associatedProduct: product, suggestions: suggestions || [],
              selectedProductId: product ? product.id : null,
              isEditingAssociation: matchType === 'suggestion',
            },
            ui: {
              isSelected: true, conversionFactor: 1, finalCost: parseFloat(item.prod.vUnCom), costVariation: 0,
            }
          };
        }));

        setInvoiceItems(processedItems);
        recalculateFinalCosts(processedItems);
        setIsAllSelected(true);
        toast.success(`${processedItems.length} produtos carregados e associados!`, { id: 'matching-toast' });

      } catch (error) {
        console.error("Erro ao processar XML:", error);
        toast.error(`Erro: ${error.message}`, { id: 'matching-toast' });
        setInvoiceItems([]);
        setFileName('');
      } finally {
        setIsMatching(false);
      }
    };
    reader.readAsText(file);
  };

  const recalculateFinalCosts = (items = invoiceItems) => {
    const netAdditionalCost = additionalCosts.freight + additionalCosts.expenses - additionalCosts.discount;
    const totalValue = items.reduce((acc, item) => acc + (item.xmlData.unitCost * item.xmlData.quantity), 0);

    const updatedItems = items.map(item => {
      let finalCost = item.xmlData.unitCost;
      if (shouldRateCost && totalValue > 0 && netAdditionalCost !== 0) {
        const itemTotalValue = item.xmlData.unitCost * item.xmlData.quantity;
        const rateFactor = itemTotalValue / totalValue;
        const proportionalCost = (netAdditionalCost * rateFactor) / item.xmlData.quantity;
        finalCost += proportionalCost;
      }

      const convertedCost = finalCost / item.ui.conversionFactor;
      let costVariation = 0;
      if (item.matchData.associatedProduct && item.matchData.associatedProduct.cost > 0) {
        costVariation = ((convertedCost - item.matchData.associatedProduct.cost) / item.matchData.associatedProduct.cost) * 100;
      }

      return { ...item, ui: { ...item.ui, finalCost: convertedCost, costVariation: costVariation } };
    });
    setInvoiceItems(updatedItems);
  };

  const handleCostInputChange = (field, value) => {
    const parsedValue = parseFloat(value);
    setAdditionalCosts(prev => ({ ...prev, [field]: isNaN(parsedValue) ? 0 : parsedValue }));
  };

  const handleAssociationChange = (itemIndex, selectedProduct) => {
    const newItems = [...invoiceItems];
    const item = newItems[itemIndex];

    if (selectedProduct === null) { // Opção "Criar como novo"
      item.matchData.associatedProduct = null;
      item.matchData.selectedProductId = null;
      item.matchData.matchType = 'none';
    } else {
      item.matchData.associatedProduct = selectedProduct;
      item.matchData.selectedProductId = selectedProduct.id;
      item.matchData.matchType = 'perfect';
    }
    item.matchData.isEditingAssociation = false;
    setInvoiceItems(newItems);
    recalculateFinalCosts(newItems);
  };

  const toggleAssociationEdit = (itemIndex) => {
    const newItems = [...invoiceItems];
    newItems[itemIndex].matchData.isEditingAssociation = !newItems[itemIndex].matchData.isEditingAssociation;
    setInvoiceItems(newItems);
  };

  const handleCreateAllNew = () => {
    if (!window.confirm("Tem certeza que deseja marcar todos os itens para serem criados como novos produtos?")) return;

    const newItems = invoiceItems.map(item => ({
      ...item,
      matchData: {
        ...item.matchData,
        associatedProduct: null,
        selectedProductId: null,
        matchType: 'none',
        isEditingAssociation: false,
      }
    }));
    setInvoiceItems(newItems);
    recalculateFinalCosts(newItems);
    toast.success("Todos os itens foram marcados para criação.");
  };

  const handleStockUpdate = async () => {
    const selectedItems = invoiceItems.filter(item => item.ui.isSelected);
    if (selectedItems.length === 0) {
      toast.error("Nenhum item selecionado para dar entrada.");
      return;
    }

    const itemsToSubmit = selectedItems.map(item => ({
      productId: item.matchData.selectedProductId,
      barcode: item.xmlData.barcode,
      name: item.xmlData.name,
      quantity: item.xmlData.quantity * item.ui.conversionFactor,
      cost: item.ui.finalCost,
      supplierCode: item.xmlData.code,
    }));

    setIsSubmitting(true);
    try {
      const promise = api.post('/products/stock-entry', { items: itemsToSubmit });
      await toast.promise(promise, {
        loading: `Dando entrada em ${itemsToSubmit.length} produto(s)...`,
        success: (response) => {
          navigate('/products', { state: { needsUpdate: true } });
          return response.data.message || 'Estoque atualizado com sucesso!';
        },
        error: (err) => `Erro: ${err.response?.data?.error || err.message}`,
      });
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      // O toast.promise já trata o erro na UI
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectAll = (checked) => {
    setIsAllSelected(checked);
    setInvoiceItems(invoiceItems.map(item => ({ ...item, ui: { ...item.ui, isSelected: checked } })));
  };

  const handleSelectItem = (index, checked) => {
    const newItems = [...invoiceItems];
    newItems[index].ui.isSelected = checked;
    setInvoiceItems(newItems);
    setIsAllSelected(newItems.every(item => item.ui.isSelected));
  };

  const handleConversionChange = (index, value) => {
    const newItems = [...invoiceItems];
    const factor = parseFloat(value);
    newItems[index].ui.conversionFactor = !isNaN(factor) && factor > 0 ? factor : 1;
    setInvoiceItems(newItems);
    recalculateFinalCosts(newItems);
  };

  const selectedCount = invoiceItems.filter(item => item.ui.isSelected).length;

  const renderCostVariation = (variation) => {
    if (variation === 0 || !isFinite(variation)) {
      return <span className="text-gray-500 flex items-center"><Minus size={14} className="mr-1" /> 0.00%</span>;
    }
    const isPositive = variation > 0;
    const color = isPositive ? 'text-red-600' : 'text-green-600';
    const Icon = isPositive ? ArrowUp : ArrowDown;
    return (
      <span className={`font-semibold flex items-center ${color}`}>
        <Icon size={14} className="mr-1" /> {variation.toFixed(2)}%
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Importar Nota Fiscal (XML)</h1>
        <p className="text-gray-600">Faça o upload de um arquivo XML da NF-e para dar entrada nos produtos.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>1. Selecionar Arquivo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button asChild variant="outline" disabled={isMatching}>
              <label htmlFor="xml-upload" className="cursor-pointer flex items-center">
                {isMatching ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                {isMatching ? 'Processando...' : 'Escolher XML'}
                <Input id="xml-upload" type="file" accept=".xml,text/xml" onChange={handleFileChange} className="hidden" />
              </label>
            </Button>
            {fileName && <p className="text-sm text-gray-500">Arquivo: {fileName}</p>}
          </div>
        </CardContent>
      </Card>

      {invoiceItems.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>2. Custos Adicionais da Nota</CardTitle>
              <CardDescription>Informe os valores totais da nota para ratear o custo entre os produtos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="freight">Valor do Frete (R$)</Label>
                  <Input id="freight" type="number" value={additionalCosts.freight} onChange={(e) => handleCostInputChange('freight', e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="expenses">Outras Despesas (R$)</Label>
                  <Input id="expenses" type="number" value={additionalCosts.expenses} onChange={(e) => handleCostInputChange('expenses', e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="discount">Desconto Total (R$)</Label>
                  <Input id="discount" type="number" value={additionalCosts.discount} onChange={(e) => handleCostInputChange('discount', e.target.value)} />
                </div>
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <Switch id="rate-cost-switch" checked={shouldRateCost} onCheckedChange={setShouldRateCost} />
                <Label htmlFor="rate-cost-switch">Ratear custos adicionais no custo final dos produtos</Label>
              </div>
            </CardContent>
          </Card>
      
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>3. Revisar, Associar e Dar Entrada</CardTitle>
                  <CardDescription>Ajuste as associações e confirme a entrada no estoque.</CardDescription>
                </div>
                <Button variant="secondary" size="sm" onClick={handleCreateAllNew}>
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Criar Todos como Novos
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]"><Checkbox checked={isAllSelected} onCheckedChange={handleSelectAll} /></TableHead>
                      <TableHead>Produto no XML</TableHead>
                      <TableHead>Associação no Sistema</TableHead>
                      <TableHead>Qtd.</TableHead>
                      <TableHead>Custo Final (Rateado)</TableHead>
                      <TableHead>Variação de Custo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoiceItems.map((item, index) => (
                      <TableRow key={`${item.xmlData.barcode}-${index}`} data-state={item.ui.isSelected ? 'selected' : ''}>
                        <TableCell><Checkbox checked={item.ui.isSelected} onCheckedChange={(c) => handleSelectItem(index, c)} /></TableCell>
                        <TableCell>
                          <div className="font-medium">{item.xmlData.name}</div>
                          <div className="text-sm text-muted-foreground font-mono">Cód. Forn: {item.xmlData.code}</div>
                          <div className="text-sm text-muted-foreground font-mono">EAN: {item.xmlData.barcode}</div>
                        </TableCell>
                        <TableCell>
                          {item.matchData.isEditingAssociation ? (
                            <AssociationCombobox 
                              item={item} 
                              onAssociationChange={(selectedProduct) => handleAssociationChange(index, selectedProduct)}
                            />
                          ) : (
                            <div className="flex items-center justify-between">
                              {item.matchData.matchType === 'none' ? (
                                <div className="flex items-center text-blue-600">
                                  <PlusCircle size={14} className="mr-2" />
                                  <span className="font-semibold">Será criado como novo</span>
                                </div>
                              ) : (
                                <div className="flex items-center text-green-600">
                                  <Link2 size={14} className="mr-2 flex-shrink-0" />
                                  <div>
                                    <p className="font-semibold">{item.matchData.associatedProduct?.name || 'Produto não encontrado'}</p>
                                    <p className="text-xs">SKU: {item.matchData.associatedProduct?.sku || 'N/A'}</p>
                                  </div>
                                </div>
                              )}
                              <Button variant="ghost" size="sm" onClick={() => toggleAssociationEdit(index)}>
                                <RefreshCw className="w-3 h-3 mr-2" /> Alterar
                              </Button>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{item.xmlData.quantity.toFixed(2)} {item.xmlData.unit} =</span>
                            <Input
                              type="number" min="1" step="1" value={item.ui.conversionFactor}
                              onChange={(e) => handleConversionChange(index, e.target.value)}
                              className="h-8 w-20 text-center" disabled={!item.ui.isSelected}
                            />
                            <span>UN</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono font-semibold">R$ {item.ui.finalCost.toFixed(4)}</TableCell>
                        <TableCell>{renderCostVariation(item.ui.costVariation)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-6 flex justify-end">
                <Button onClick={handleStockUpdate} disabled={isSubmitting || selectedCount === 0} className="bg-green-600 hover:bg-green-700">
                  {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PackagePlus className="w-4 h-4 mr-2" />}
                  {isSubmitting ? 'Processando...' : `Dar Entrada em ${selectedCount} Iten(s)`}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default InvoiceImport;
