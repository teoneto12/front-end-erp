// frontend/src/components/Modal.jsx

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const Modal = ({ open, onClose, title, children, className }) => {
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
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
      >
        {/* 
          ▼▼▼ CORREÇÃO DEFINITIVA APLICADA AQUI ▼▼▼
          - A classe 'max-w-lg' foi REMOVIDA.
          - Agora, o tamanho do modal é controlado EXCLUSIVAMENTE pela 'className'
            que é passada a partir da página que o chama (ex: PreSales.jsx).
          - Se nenhuma className for passada, ele usará 'w-full', ocupando a largura
            disponível até os limites do padding do container.
        */}
        <div
          className={`bg-white rounded-lg shadow-xl w-full ${className || ''}`}
          onClick={(e) => e.stopPropagation()}
        >
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
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

export default Modal;
