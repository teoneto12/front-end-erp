import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const Modal = ({ open, onClose, title, children }) => {
  // Efeito para fechar com a tecla 'Esc' e travar o scroll do fundo
  useEffect(() => {
    if (!open) return;

    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEsc);
    // Trava o scroll da página principal
    document.body.style.overflow = 'hidden';

    // Função de limpeza
    return () => {
      document.removeEventListener('keydown', handleEsc);
      // Libera o scroll ao fechar
      document.body.style.overflow = 'auto';
    };
  }, [open, onClose]);

  // Não renderiza nada se o modal não estiver aberto
  if (!open) return null;

  // Usa createPortal para renderizar o modal no final do <body>
  return createPortal(
    <>
      {/* 1. Overlay (fundo escuro) */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 2. Conteúdo do Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
      >
        <div
          className="bg-white rounded-lg shadow-xl w-full max-w-lg"
          // Impede que o clique dentro do modal o feche
          onClick={(e) => e.stopPropagation()}
        >
          {/* Cabeçalho do Modal */}
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
            <button
              onClick={onClose}
              aria-label="Fechar"
              className="p-1 rounded-full text-gray-500 hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Corpo do Modal (onde o formulário vai entrar) */}
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </>,
    document.body // O alvo do portal
  );
};

export default Modal;
