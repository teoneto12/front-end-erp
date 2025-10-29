// frontend/src/components/Modal.jsx

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const Modal = ({ open, onClose, title, children, className = '', maxWidth = 'max-w-md' }) => {
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'auto';
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <>
      {/* Fundo escurecido */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Container principal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
      >
        <div
          className={`bg-white rounded-xl shadow-xl w-full mx-auto ${maxWidth} ${className}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Cabeçalho */}
          <div className="flex items-center justify-between p-4 border-b">
            {title && <h3 className="text-lg font-semibold text-gray-800">{title}</h3>}
            <button
              onClick={onClose}
              aria-label="Fechar"
              className="p-1 rounded-full text-gray-500 hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Conteúdo rolável */}
          <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
        </div>
      </div>
    </>,
    document.body
  );
};

export default Modal;
