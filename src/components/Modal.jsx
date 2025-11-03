// frontend/src/components/Modal.jsx

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const Modal = ({ open, onClose, title, children, className = '', maxWidth = 'max-w-md' }) => {
  useEffect(() => {
    if (!open) return;

    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEsc);

    // Quando o modal abre, o resto da aplicação deve ser inacessível.
    // A melhor prática é adicionar um atributo 'inert' ao corpo ou ao 'root' do app.
    const rootElement = document.getElementById('root'); // Assumindo que seu app está em <div id="root">
    if (rootElement) {
      rootElement.setAttribute('inert', '');
    }
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEsc);
      // Quando o modal fecha, removemos o 'inert' e restauramos a rolagem.
      if (rootElement) {
        rootElement.removeAttribute('inert');
      }
      document.body.style.overflow = 'auto';
    };
  }, [open, onClose]);

  if (!open) return null;

  // O portal continua sendo a abordagem correta para renderizar o modal no topo do DOM.
  return createPortal(
    // O container do fundo escuro (backdrop)
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {/* A caixa de conteúdo do modal */}
      <div
        className={`bg-white rounded-xl shadow-2xl w-full mx-auto ${maxWidth} ${className} flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          {title && <h3 className="text-lg font-semibold text-gray-800">{title}</h3>}
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="p-1 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo rolável */}
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
