// frontend/src/pages/PedidoVendaVarejo.jsx

import React, { useState, useEffect, useRef } from 'react';
import api from '../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, User, Trash2, Loader2, Send, ArrowLeft, Download, Printer, Wifi, WifiOff } from 'lucide-react';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// --- Componente ApiSearch (sem alterações) ---
const ApiSearch = ({ fetchFunction, onSelect, placeholder, searchParamName, disabled, renderResult }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const handleSearch = async (e) => { e.preventDefault(); if (query.length < 3) { toast.error('Digite pelo menos 3 caracteres para buscar.'); return; } setLoading(true); try { const params = { [searchParamName]: query }; const { data } = await fetchFunction(params); setResults(data.items || []); } catch (error) { toast.error('Falha na busca.'); } finally { setLoading(false); } };
  return ( <div className="relative"> <div className="flex gap-2"> <Input placeholder={placeholder} value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(e); }} disabled={disabled || loading} /> <Button onClick={handleSearch} type="button" disabled={disabled || loading}> {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} </Button> </div> {results.length > 0 && ( <ul className="absolute z-10 w-full bg-white border rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg"> {results.map((item) => ( <li key={item.id} onClick={() => { onSelect(item); setResults([]); setQuery(''); }} className="p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"> {renderResult ? renderResult(item) : <span>{item.descricao || item.nome}</span>} </li> ))} </ul> )} </div> );
};

// --- Componente ConsultaProdutoModal (sem alterações) ---
const ConsultaProdutoModal = ({ onAddProduct, closeModal }) => {
  const [stage, setStage] = useState('search'); const [query, setQuery] = useState(''); const [searchResults, setSearchResults] = useState([]); const [selectedProduct, setSelectedProduct] = useState(null); const [loading, setLoading] = useState(false);
  const handleSearch = async (e) => { e.preventDefault(); if (query.length < 3) { toast.error('Digite pelo menos 3 caracteres para buscar.'); return; } setLoading(true); try { const { data } = await api.get('varejo-facil/products', { params: { descricao: query } }); setSearchResults(data.items || []); if (!data.items || data.items.length === 0) toast.info('Nenhum produto encontrado.'); } catch (error) { toast.error('Falha na busca de produtos.'); } finally { setLoading(false); } };
  const handleSelectProduct = (product) => { setSelectedProduct(product); setStage('details'); };
  const handleAddAndClose = (product, price) => { onAddProduct(product, price); closeModal(); };
  const resetToSearch = () => { setStage('search'); setSelectedProduct(null); setSearchResults([]); setQuery(''); };
  const PriceButton = ({ label, price, product }) => ( <Button variant="outline" className="w-full justify-between" onClick={() => handleAddAndClose(product, price)} disabled={!price || price === 0}> <span>{label}</span> <span className="font-bold">R$ {price.toFixed(2)}</span> </Button> );
  return ( <DialogContent className="max-w-2xl"> <DialogHeader> <div className="flex items-center"> {stage === 'details' && ( <Button variant="ghost" size="icon" className="mr-2" onClick={resetToSearch}> <ArrowLeft className="h-4 w-4" /> </Button> )} <DialogTitle>{stage === 'search' ? 'Consulta de Produtos' : selectedProduct?.descricao}</DialogTitle> </div> </DialogHeader> {stage === 'search' && ( <div className="py-4"> <form onSubmit={handleSearch} className="flex gap-2 mb-4"> <Input placeholder="Digite o nome do produto..." value={query} onChange={(e) => setQuery(e.target.value)} /> <Button type="submit" disabled={loading}> {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} </Button> </form> <div className="max-h-[50vh] overflow-y-auto"> <Table> <TableHeader><TableRow><TableHead>Produto</TableHead><TableHead className="text-right">Estoque</TableHead></TableRow></TableHeader> <TableBody> {loading ? <TableRow><TableCell colSpan={2} className="text-center h-24">Buscando...</TableCell></TableRow> : searchResults.map(product => ( <TableRow key={product.id} onClick={() => handleSelectProduct(product)} className="cursor-pointer hover:bg-muted/50"> <TableCell className="font-medium">{product.descricao}</TableCell> <TableCell className="text-right">{product.estoque || 0}</TableCell> </TableRow> ))} </TableBody> </Table> </div> </div> )} {stage === 'details' && selectedProduct && ( <div className="py-4 space-y-4"> <div className="p-4 border rounded-lg bg-muted"> <h3 className="font-semibold text-lg">{selectedProduct.descricao}</h3> <p>Estoque Disponível: <span className="font-bold">{selectedProduct.estoque || 0}</span></p> </div> <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> <div className="space-y-2"> <h4 className="font-medium">Preços de Venda</h4> <PriceButton label="Preço 1" price={selectedProduct.priceInfo?.precoVenda1} product={selectedProduct} /> <PriceButton label="Preço 2" price={selectedProduct.priceInfo?.precoVenda2} product={selectedProduct} /> <PriceButton label="Preço 3" price={selectedProduct.priceInfo?.precoVenda3} product={selectedProduct} /> </div> <div className="space-y-2"> <h4 className="font-medium">Preços de Oferta</h4> <PriceButton label="Oferta 1" price={selectedProduct.priceInfo?.precoOferta1} product={selectedProduct} /> <PriceButton label="Oferta 2" price={selectedProduct.priceInfo?.precoOferta2} product={selectedProduct} /> <PriceButton label="Oferta 3" price={selectedProduct.priceInfo?.precoOferta3} product={selectedProduct} /> </div> </div> </div> )} </DialogContent> );
};

// ==================================================================
// COMPONENTE 'ComprovanteModal' ATUALIZADO PARA O FLUXO ONLINE/OFFLINE
// ==================================================================
const ComprovanteModal = ({ pedido, onOpenChange }) => {
  const comprovanteRef = useRef(null);

  if (!pedido) return null;

  const handleDownloadPdf = () => {
    const input = comprovanteRef.current;
    if (!input) return;
    html2canvas(input, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [80, 297] });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const fileName = pedido.isOnline ? `pedido-online-${pedido.idExterno}.pdf` : `pedido-local-${pedido.localOrderId}.pdf`;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(fileName);
    });
  };

  const handlePrint = () => {
    const content = comprovanteRef.current.innerHTML;
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Comprovante de Pedido</title>');
    printWindow.document.write('<style> body { font-family: monospace; margin: 0; padding: 0; font-size: 12px; } </style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(content);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  return (
    <Dialog open={!!pedido} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Comprovante de Pedido</DialogTitle>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto p-2 flex justify-center">
          <div ref={comprovanteRef} className="bg-white p-4 font-mono text-black text-sm" style={{ width: '100mm' }}>
            <header className="text-center mb-4">
              <h1 className="text-lg font-bold">NOME DA SUA LOJA</h1>
              <p>Rua Fictícia, 123 - Bairro, Cidade</p>
              <p>CNPJ: 00.000.000/0001-00</p>
              <hr className="border-dashed border-black my-2" />
              <p className="font-bold">COMPROVANTE DE PEDIDO</p>
              <hr className="border-dashed border-black my-2" />
            </header>
            <section className="mb-2">
              {pedido.isOnline ? (
                <p>ID Pedido: {pedido.idExterno}</p>
              ) : (
                <p>Pedido Local Nº: {pedido.localOrderId}</p>
              )}
              <p>Data: {new Date(pedido.payload.dataEmissao).toLocaleString('pt-BR')}</p>
            </section>
            <section className="mb-2">
              <hr className="border-dashed border-black my-2" />
              <p className="font-bold">CLIENTE:</p>
              <p>{pedido.payload.cliente.nome}</p>
              <p>CPF/CNPJ: {pedido.payload.cliente.numeroDoDocumento}</p>
            </section>
            
            <section className="my-2">
              <hr className="border-dashed border-black my-2" />
              <div className="grid grid-cols-12 gap-2 font-bold">
                <div className="col-span-6">Produto</div>
                <div className="col-span-2 text-center">Qtd</div>
                <div className="col-span-2 text-right">Vl.Unit</div>
                <div className="col-span-2 text-right">Subtotal</div>
              </div>
              <hr className="border-dashed border-black my-2" />
              {pedido.payload.itens.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 mb-1">
                  <div className="col-span-6 truncate">{item.descricaoProdutoEcommerce}</div>
                  <div className="col-span-2 text-center">{item.quantidadeDeEmbalagem} {item.unidade}</div>
                  <div className="col-span-2 text-right">{item.valorEmbalagem.toFixed(2)}</div>
                  <div className="col-span-2 text-right">{item.valorTotal.toFixed(2)}</div>
                </div>
              ))}
            </section>

            <footer className="mt-4">
              <hr className="border-dashed border-black my-2" />
              <div className="text-lg flex justify-between font-bold">
                <span>TOTAL</span>
                <span>R$ {pedido.payload.valorTotal.toFixed(2)}</span>
              </div>
              <hr className="border-dashed border-black my-2" />
              <p className="font-bold">PAGAMENTO:</p>
              <div className="flex justify-between">
                <span>{pedido.formaPagamento?.descricao || 'N/A'}</span>
                <span>R$ {pedido.payload.valorTotal.toFixed(2)}</span>
              </div>
              <hr className="border-dashed border-black my-2" />
            </footer>
            <div className="text-center text-xs mt-4">
              {pedido.isOnline ? (
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <Wifi size={14} />
                  <p>Pedido sincronizado com sucesso!</p>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-orange-600">
                  <WifiOff size={14} />
                  <p>Pedido salvo localmente. Sincronização pendente.</p>
                </div>
              )}
              <p className="font-bold mt-2">NÃO É DOCUMENTO FISCAL</p>
              <p>Obrigado e volte sempre!</p>
            </div>
          </div>
        </div>
        <DialogFooter className="sm:justify-center gap-2">
          <Button onClick={handleDownloadPdf}><Download className="mr-2 h-4 w-4" />Salvar PDF</Button>
          <Button variant="outline" onClick={handlePrint}><Printer className="mr-2 h-4 w-4" />Imprimir</Button>
          <DialogClose asChild><Button variant="secondary">Fechar</Button></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


const PedidoVendaVarejo = () => {
  const [cliente, setCliente] = useState(null);
  const [itens, setItens] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isConsultaModalOpen, setIsConsultaModalOpen] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [pedidoFinalizado, setPedidoFinalizado] = useState(null);

  useEffect(() => {
    const newTotal = itens.reduce((acc, item) => acc + (item.quantidade * item.valor), 0);
    setTotal(newTotal);
  }, [itens]);

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const { data } = await api.get('varejo-facil/payment-methods');
        setPaymentMethods(data.items || []);
      } catch (error) {
        toast.error('Não foi possível carregar as formas de pagamento.');
      }
    };
    fetchPaymentMethods();
  }, []);

  const adicionarProduto = (produto, preco) => {
    setItens(prevItens => {
      const itemExistente = prevItens.find(item => item.produtoId === produto.id && item.valor === preco);
      if (itemExistente) {
        return prevItens.map(item => item.produtoId === produto.id && item.valor === preco ? { ...item, quantidade: item.quantidade + 1 } : item);
      } else {
        return [...prevItens, { produtoId: produto.id, descricao: produto.descricao, quantidade: 1, valor: preco, unidade: produto.unidade }];
      }
    });
    toast.success(`"${produto.descricao}" adicionado ao pedido.`);
  };

  const atualizarQuantidade = (produtoId, valor, novaQuantidadeStr) => {
    setItens(prev => prev.map(item => {
      if (item.produtoId === produtoId && item.valor === valor) {
        const novaQuantidade = novaQuantidadeStr === '' ? '' : parseInt(novaQuantidadeStr, 10);
        return { ...item, quantidade: isNaN(novaQuantidade) ? '' : novaQuantidade };
      }
      return item;
    }));
  };

  const validarQuantidadeAoPerderFoco = (produtoId, valor, quantidadeAtual) => {
    if (quantidadeAtual === '' || quantidadeAtual < 1) {
      toast.error('Quantidade inválida. Restaurando para 1.');
      setItens(prev => prev.map(item => item.produtoId === produtoId && item.valor === valor ? { ...item, quantidade: 1 } : item));
    }
  };

  const removerItem = (produtoId, valor) => {
    setItens(prev => prev.filter(item => !(item.produtoId === produtoId && item.valor === valor)));
  };

  // ==================================================================
  // FUNÇÃO 'handleFinalizarPedido' ATUALIZADA PARA O FLUXO ONLINE-FIRST
  // ==================================================================
  const handleFinalizarPedido = async () => {
    if (!cliente) { toast.error('Por favor, selecione um cliente.'); return; }
    if (itens.length === 0) { toast.error('Adicione pelo menos um item ao pedido.'); return; }
    if (!selectedPaymentMethod) { toast.error('Por favor, selecione uma forma de pagamento.'); return; }
    const itensInvalidos = itens.some(item => !item.quantidade || item.quantidade < 1);
    if (itensInvalidos) { toast.error('Existem itens com quantidade inválida.'); return; }

    setLoading(true);
    const toastId = toast.loading('Processando pedido...');

    const formaPagamentoSelecionada = paymentMethods.find(p => p.id === parseInt(selectedPaymentMethod));

    const pedidoPayload = {
      lojaId: 1,
      tipoFaturamento: "CUPOM_FISCAL",
      dataEmissao: new Date().toISOString(),
      status: "ABERTO",
      tipoDeFrete: "SEM_FRETE",
      valorTotal: total,
      valorLiquido: total,
      valorBruto: total,
      retiradaNaLoja: true,
      cliente: { id: cliente.id, nome: cliente.nome, numeroDoDocumento: cliente.numeroDoDocumento, tipoDePessoa: cliente.tipoDePessoa },
      itens: itens.map(item => ({
        produtoId: item.produtoId,
        descricaoProdutoEcommerce: item.descricao,
        quantidadeDeEmbalagem: item.quantidade,
        quantidadeDeItemEmbalagem: 1,
        valor: item.valor * item.quantidade,
        valorEmbalagem: item.valor,
        valorTotal: item.valor * item.quantidade,
        unidade: item.unidade || "UN",
        compoeValorTotal: true,
      })),
      pagamentos: [{
        formaPagamentoId: parseInt(selectedPaymentMethod, 10),
        dataVencimento: new Date().toISOString().split('T')[0],
        valor: total,
        numeroParcelas: 1,
        pago: false
      }],
    };

    try {
      const { data: responseData } = await api.post('varejo-facil/process-order', pedidoPayload);

      if (responseData.status === 'ONLINE_SUCCESS') {
        toast.success(`Pedido ${responseData.idExterno} enviado com sucesso!`, { id: toastId });
        setPedidoFinalizado({
          idExterno: responseData.idExterno,
          payload: pedidoPayload,
          formaPagamento: formaPagamentoSelecionada,
          isOnline: true,
        });
      } else if (responseData.status === 'OFFLINE_FALLBACK') {
        toast.warn(`Conexão falhou. Pedido Nº ${responseData.localOrderId} salvo para sincronizar depois.`, { id: toastId, duration: 6000 });
        setPedidoFinalizado({
          localOrderId: responseData.localOrderId,
          payload: pedidoPayload,
          formaPagamento: formaPagamentoSelecionada,
          isOnline: false,
        });
      }

      setCliente(null);
      setItens([]);
      setSelectedPaymentMethod('');

    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Falha crítica ao processar o pedido.';
      toast.error(`Erro: ${errorMessage}`, { id: toastId, duration: 8000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isConsultaModalOpen} onOpenChange={setIsConsultaModalOpen}>
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Pedido de Venda</h1>
          <DialogTrigger asChild>
            <Button variant="outline"><Search className="mr-2 h-4 w-4" />Consultar Produto</Button>
          </DialogTrigger>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader><CardTitle>Itens do Pedido</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead><TableHead className="w-24">Qtd.</TableHead><TableHead>Vl. Unit.</TableHead><TableHead>Subtotal</TableHead><TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itens.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center h-24">Nenhum item adicionado</TableCell></TableRow>
                    ) : (
                      itens.map(item => (
                        <TableRow key={`${item.produtoId}-${item.valor}`}>
                          <TableCell>{item.descricao}</TableCell>
                          <TableCell>
                            <Input type="number" className="w-20 h-8" value={item.quantidade} onChange={(e) => atualizarQuantidade(item.produtoId, item.valor, e.target.value)} onBlur={() => validarQuantidadeAoPerderFoco(item.produtoId, item.valor, item.quantidade)} />
                          </TableCell>
                          <TableCell>{(item.valor || 0).toFixed(2)}</TableCell>
                          <TableCell>{((item.quantidade || 0) * (item.valor || 0)).toFixed(2)}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => removerItem(item.produtoId, item.valor)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader><CardTitle>Detalhes do Pedido</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-sm font-medium">Cliente</label>
                  {cliente ? (
                    <div className="p-3 border rounded-md bg-gray-50 flex justify-between items-center">
                      <div><p className="font-semibold">{cliente.nome}</p><p className="text-sm text-gray-600">{cliente.numeroDoDocumento}</p></div>
                      <Button variant="ghost" size="icon" onClick={() => setCliente(null)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </div>
                  ) : (
                    <ApiSearch fetchFunction={(params) => api.get('varejo-facil/clients', { params })} onSelect={setCliente} placeholder="Buscar cliente por nome..." searchParamName="nome" renderResult={(item) => (
                      <div><p className="font-medium">{item.nome}</p><p className="text-xs text-gray-500">{item.numeroDoDocumento || 'Documento não informado'}</p></div>
                    )} />
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">Forma de Pagamento</label>
                  <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod} disabled={paymentMethods.length === 0}>
                    <SelectTrigger><SelectValue placeholder="Selecione um pagamento..." /></SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method.id} value={String(method.id)}>{method.descricao}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4 pt-6">
                <div className="w-full flex justify-between text-2xl font-bold"><span>TOTAL</span><span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}</span></div>
                <Button className="w-full" size="lg" onClick={handleFinalizarPedido} disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Finalizar Pedido
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
      <ConsultaProdutoModal onAddProduct={adicionarProduto} closeModal={() => setIsConsultaModalOpen(false)} />
      <ComprovanteModal pedido={pedidoFinalizado} onOpenChange={() => setPedidoFinalizado(null)} />
    </Dialog>
  );
};

export default PedidoVendaVarejo;
