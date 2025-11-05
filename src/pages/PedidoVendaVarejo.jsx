// frontend/src/pages/PedidoVendaVarejo.jsx

import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, User, Trash2, Loader2, Send } from 'lucide-react';
import { toast } from 'react-hot-toast';

// Componente reutilizável para busca com dropdown de resultados
const ApiSearch = ({
  fetchFunction,
  onSelect,
  placeholder,
  searchParamName = 'descricao',
  disabled = false,
  renderResult
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (query.length < 3) {
      toast.error('Digite pelo menos 3 caracteres para buscar.');
      return;
    }
    setLoading(true);
    try {
      // Lógica corrigida que usa o searchParamName dinamicamente
      const params = { [searchParamName]: query };
      const { data } = await fetchFunction(params);
      setResults(data.items || []);
    } catch (error) {
      toast.error('Falha na busca.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(e); }}
          disabled={disabled || loading}
        />
        <Button onClick={handleSearch} type="button" disabled={disabled || loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
      </div>
      {results.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
          {results.map((item) => (
            <li
              key={item.id}
              onClick={() => { onSelect(item); setResults([]); setQuery(''); }}
              className="p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
            >
              {renderResult ? renderResult(item) : <span>{item.descricao || item.nome}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};


const PedidoVendaVarejo = () => {
  const [cliente, setCliente] = useState(null);
  const [itens, setItens] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [addingProduct, setAddingProduct] = useState(false);

  useEffect(() => {
    const newTotal = itens.reduce((acc, item) => acc + (item.quantidade * item.valor), 0);
    setTotal(newTotal);
  }, [itens]);

  const adicionarProduto = async (produto) => {
    if (addingProduct) return;
    setAddingProduct(true);
    const toastId = toast.loading(`Buscando preço para ${produto.descricao}...`);
    try {
      const { data: priceInfo } = await api.get(`varejo-facil/products/${produto.id}/price`);
      if (!priceInfo || typeof priceInfo.valor === 'undefined') {
        throw new Error('Preço não disponível para este produto.');
      }
      const preco = parseFloat(priceInfo.valor) || 0;
      setItens(prevItens => {
        const itemExistente = prevItens.find(item => item.produtoId === produto.id);
        if (itemExistente) {
          return prevItens.map(item =>
            item.produtoId === produto.id ? { ...item, quantidade: item.quantidade + 1 } : item
          );
        } else {
          return [...prevItens, {
            produtoId: produto.id,
            descricao: produto.descricao,
            quantidade: 1,
            valor: preco,
          }];
        }
      });
      toast.success('Produto adicionado!', { id: toastId });
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Não foi possível obter o preço do produto.';
      toast.error(errorMessage, { id: toastId });
    } finally {
      setAddingProduct(false);
    }
  };

  const removerItem = (produtoId) => {
    setItens(itens.filter(item => item.produtoId !== produtoId));
  };

  const handleFinalizarPedido = async () => {
    if (!cliente) {
      toast.error('Por favor, selecione um cliente.');
      return;
    }
    if (itens.length === 0) {
      toast.error('Adicione pelo menos um item ao pedido.');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Enviando pedido para o Varejo Fácil...');

    const pedidoPayload = {
      lojaId: 1,
      clienteId: cliente.id,
      valorTotal: total,
      itens: itens.map(item => ({
        produtoId: item.produtoId,
        quantidadeDeEmbalagem: item.quantidade,
        valor: item.valor,
      })),
      pagamentos: [
        {
          formaPagamentoId: 1,
          valor: total,
        }
      ]
    };

    try {
      await api.post('varejo-facil/sales-order', pedidoPayload);
      toast.success('Pedido enviado com sucesso!', { id: toastId });
      setCliente(null);
      setItens([]);
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Falha ao enviar o pedido.';
      toast.error(errorMessage, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Pedido de Venda - Varejo Fácil</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Itens do Pedido</CardTitle></CardHeader>
            <CardContent>
              <div className="mb-4">
                <label className="text-sm font-medium">Buscar Produto</label>
                <ApiSearch
                  fetchFunction={(params) => api.get('varejo-facil/products', { params })}
                  onSelect={adicionarProduto}
                  placeholder="Digite o nome do produto..."
                  searchParamName="descricao"
                  disabled={addingProduct}
                  renderResult={(item) => <span>{item.descricao}</span>}
                />
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Qtd.</TableHead>
                    <TableHead>Vl. Unit.</TableHead>
                    <TableHead>Subtotal</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itens.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center h-24">Nenhum item adicionado</TableCell></TableRow>
                  ) : (
                    itens.map(item => (
                      <TableRow key={item.produtoId}>
                        <TableCell>{item.descricao}</TableCell>
                        <TableCell>{item.quantidade}</TableCell>
                        <TableCell>{(item.valor || 0).toFixed(2)}</TableCell>
                        <TableCell>{((item.quantidade || 0) * (item.valor || 0)).toFixed(2)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => removerItem(item.produtoId)}>
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
                    <div>
                      <p className="font-semibold">{cliente.nome}</p>
                      <p className="text-sm text-gray-600">{cliente.numeroDoDocumento}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setCliente(null)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ) : (
                  <ApiSearch
                    fetchFunction={(params) => api.get('varejo-facil/clients', { params })}
                    onSelect={setCliente}
                    placeholder="Buscar cliente por nome..."
                    searchParamName="nome"
                    renderResult={(item) => (
                      <div>
                        <p className="font-medium">{item.nome}</p>
                        <p className="text-xs text-gray-500">{item.numeroDoDocumento || 'Documento não informado'}</p>
                      </div>
                    )}
                  />
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 pt-6">
              <div className="w-full flex justify-between text-2xl font-bold">
                <span>TOTAL</span>
                <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}</span>
              </div>
              <Button className="w-full" size="lg" onClick={handleFinalizarPedido} disabled={loading || addingProduct}>
                {(loading || addingProduct) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Finalizar e Enviar Pedido
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PedidoVendaVarejo;
