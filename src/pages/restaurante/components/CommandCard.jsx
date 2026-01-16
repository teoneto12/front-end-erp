// src/pages/restaurant/components/CommandCard.jsx

import React, { useState, useEffect } from 'react';
import { Clock, User, Lock } from 'lucide-react';

const CommandCard = ({ table, onClick, isSelected }) => {
  const [elapsedTime, setElapsedTime] = useState('--');

  useEffect(() => {
    const dateValue = table.created_at;
    if (!dateValue) return;

    const calculateElapsedTime = () => {
      const now = new Date();
      const openedAt = new Date(dateValue);
      if (isNaN(openedAt.getTime())) return;

      const diffInSeconds = Math.floor((now - openedAt) / 1000);

      if (diffInSeconds < 60) return setElapsedTime('< 1m');

      const hours = Math.floor(diffInSeconds / 3600);
      const minutes = Math.floor((diffInSeconds % 3600) / 60);

      setElapsedTime(hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`);
    };

    calculateElapsedTime();
    const interval = setInterval(calculateElapsedTime, 60000);
    return () => clearInterval(interval);
  }, [table.created_at]);

  const isLocked = table.status === 'EM_PAGAMENTO';

  // 🔥 NOVA REGRA:
  // Se estiver BLOQUEADO E SELECIONADO → continua vermelho
  const isRed = isLocked;

const cardClasses = `
  flex flex-col justify-between 
  p-5 rounded-2xl cursor-pointer 
  transition-all duration-200 ease-in-out

  min-h-[160px]
  border-2 shadow-md

  ${!isSelected ? 'transform hover:-translate-y-1' : ''}

  ${isSelected ? 'ring-4 ring-blue-500/20 ring-offset-2 ring-offset-transparent' : ''}

  ${isRed 
    ? 'border-red-400 bg-red-50 hover:shadow-lg'
    : 'border-slate-300 bg-white hover:shadow-lg'
  }
`;




  return (
    <div onClick={() => onClick(table.id)} className={cardClasses}>
      
      {/* HEADER */}
      <header className="flex justify-between items-start">
        <h3
          className={`font-bold text-3xl truncate 
            ${isRed ? 'text-red-900' : 'text-slate-800'}
          `}
          title={table.number}
        >
          {table.name}
        </h3>

        <div
          className={`
            flex items-center text-xs font-semibold px-2 py-1 rounded-full 
            ${isRed ? 'bg-red-200 text-red-800' : 'bg-green-100 text-green-800'}
          `}
        >
          {isRed ? (
            <Lock className="w-3 h-3 mr-1.5" />
          ) : (
            <div className="w-2 h-2 bg-green-500 rounded-full mr-1.5" />
          )}
          {isRed ? 'Bloqueado' : 'Ativa'}
        </div>
      </header>

      <div className="flex-grow"></div>

      {/* FOOTER */}
      <footer
        className={`flex justify-between items-center text-sm border-t pt-3 mt-3 
          ${isRed ? 'border-red-200 text-red-700' : 'border-slate-200 text-slate-500'}
        `}
      >
        <div className="flex items-center truncate">
          <User className="w-4 h-4 mr-1.5" />
          <span className="truncate">{table.customer_name || 'Consumidor'}</span>
        </div>

        <div className="flex items-center">
          <Clock className="w-4 h-4 mr-1" />
          <span>{elapsedTime}</span>
        </div>
      </footer>
    </div>
  );
};

export default React.memo(CommandCard);
