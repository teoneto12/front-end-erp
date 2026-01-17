// frontend/src/components/DetalhesPedidoModal.jsx

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const DetalhesPedidoModal = ({ pedido, isOpen, onClose }) => {
  if (!pedido || !pedido.payload) {
    return null;
  }

  const { payload } = pedido;
  const { cliente, itens, pagamentos, valorTotal } = payload;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Detalhes do Pedido Local Nº {pedido.id}</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 max-h-[70vh] overflow-y-auto">
          {/* Coluna da Esquerda: Cliente e Pagamento */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">Cliente</h3>
              <div className="text-sm p-3 border rounded-md bg-muted">
                <p><strong>Nome:</strong> {cliente.nome}</p>
                <p><strong>Documento:</strong> {cliente.numeroDoDocumento}</p>
                <p><strong>Tipo:</strong> {cliente.tipoDePessoa}</p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Pagamento</h3>
              {pagamentos.map((pag, index) => (
                <div key={index} className="text-sm p-3 border rounded-md bg-muted">
                  <p><strong>Forma ID:</strong> {pag.formaPagamentoId}</p>
                  <p><strong>Valor:</strong> R$ {pag.valor.toFixed(2)}</p>
                  <p><strong>Parcelas:</strong> {pag.numeroParcelas}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Coluna da Direita: Itens */}
          <div>
            <h3 className="font-semibold text-lg mb-2">Itens do Pedido</h3>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-center">Qtd</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itens.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.descricaoProdutoEcommerce}</TableCell>
                      <TableCell className="text-center">{item.quantidadeDeEmbalagem}</TableCell>
                      <TableCell className="text-right">R$ {item.valorTotal.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="text-xl flex justify-between font-bold mt-4 p-3 bg-muted rounded-md">
              <span>TOTAL</span>
              <span>R$ {valorTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">Fechar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DetalhesPedidoModal;
