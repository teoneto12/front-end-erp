import React from 'react'; // É uma boa prática manter a importação do React
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// ==================================================================
// CORREÇÃO:
// 1. Adicionada a propriedade 'itemName' com um valor padrão 'itens'.
// 2. O texto agora usa essa propriedade para ser dinâmico.
// 3. Adicionada uma lógica simples para remover o 's' do final se o total for 1.
// ==================================================================
const Pagination = ({ pagination, onPageChange, itemName = 'itens' }) => {
  // Não renderiza nada se não houver dados de paginação ou se houver apenas uma página
  if (!pagination || pagination.pages <= 1) {
    return null;
  }

  const { page, pages, total } = pagination;

  // Lógica para exibir o nome do item no singular ou plural
  const displayedItemName = total === 1 ? itemName.replace(/s$/, '') : itemName;

  return (
    <div className="flex items-center justify-between mt-4 pt-4 border-t" aria-label="Paginação">
      <div>
        <p className="text-sm text-gray-700">
          Página <span className="font-medium">{page}</span> de <span className="font-medium">{pages}</span> ({total} {displayedItemName})
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          aria-label="Ir para a página anterior"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page === pages}
          aria-label="Ir para a próxima página"
        >
          Próxima
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};

export default Pagination;
