import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ pagination, onPageChange }) => {
  // Não renderiza nada se não houver dados de paginação ou se houver apenas uma página
  if (!pagination || pagination.pages <= 1) {
    return null;
  }

  const { page, pages, total } = pagination;

  return (
    <div className="flex items-center justify-between mt-6" aria-label="Paginação">
      <div>
        <p className="text-sm text-gray-700">
          Página <span className="font-medium">{page}</span> de <span className="font-medium">{pages}</span> ({total} produtos)
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
