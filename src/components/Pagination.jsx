// frontend/src/components/Pagination.jsx

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ pagination, onPageChange, itemName = 'itens' }) => {
  // Não renderiza se não houver paginação ou apenas uma página
  if (!pagination || pagination.totalPages <= 1) {
    return null;
  }

  // ▼▼▼ CORREÇÃO APLICADA AQUI ▼▼▼
  // Usando os nomes corretos enviados pelo backend: 'currentPage', 'totalPages', 'totalItems'
  const { currentPage, totalPages, totalItems } = pagination;

  // Lógica para singular/plural
  const displayedItemName = totalItems === 1 ? itemName.replace(/s$/, '') : itemName;

  return (
    <div className="flex items-center justify-between mt-4 pt-4 border-t" aria-label="Paginação">
      <div>
        <p className="text-sm text-gray-700">
          Página <span className="font-medium">{currentPage}</span> de <span className="font-medium">{totalPages}</span> ({totalItems} {displayedItemName})
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Ir para a página anterior"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
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
