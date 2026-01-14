// src/pages/restaurant/components/CommandCard.jsx

import React, { useState, useEffect } from 'react';
import { Clock, User, Lock } from 'lucide-react'; // Adicionado ícone Lock

const CommandCard = ({ table, onClick, isSelected }) => {
  const [elapsedTime, setElapsedTime] = useState('--');

  useEffect(() => {
    const dateValue = table.created_at;
    if (!dateValue) {
      setElapsedTime('--');
      return;
    }
    
    const calculateElapsedTime = () => {
      const now = new Date();
      const openedAt = new Date(dateValue);
      if (isNaN(openedAt.getTime())) {
        setElapsedTime('--');
        return;
      }
      const diffInSeconds = Math.floor((now - openedAt) / 1000);
      if (diffInSeconds < 60) { setElapsedTime('< 1m'); return; }
      const hours = Math.floor(diffInSeconds / 3600);
      const minutes = Math.floor((diffInSeconds % 3600) / 60);
      if (hours > 0) { setElapsedTime(`${hours}h ${minutes}m`); } 
      else { setElapsedTime(`${minutes}m`); }
    };

    calculateElapsedTime();
    const interval = setInterval(calculateElapsedTime, 60000);
    return () => clearInterval(interval);
  }, [table.created_at]);

  const isLocked = table.status === 'EM_PAGAMENTO';

  const cardClasses = `
    flex flex-col justify-between p-4 rounded-xl shadow-md cursor-pointer 
    transition-all duration-200 ease-in-out transform hover:-translate-y-1 
    min-h-[120px] border-2
    ${isSelected 
      ? 'border-blue-500 ring-4 ring-blue-500/10' 
      : isLocked 
        ? 'border-red-300 bg-red-50' // <<-- ESTILO QUANDO BLOQUEADO, MAS NÃO SELECIONADO
        : 'border-slate-200 bg-white hover:shadow-lg'
    }
  `;

  return (
    <div onClick={() => onClick(table.id)} className={cardClasses}>
      <header className="flex justify-between items-start">
        <h3 className={`font-bold text-2xl truncate ${isLocked && !isSelected ? 'text-red-900' : 'text-slate-800'}`} title={table.number}>
          {table.name}
        </h3>
        <div className={`flex items-center text-xs font-semibold px-2 py-1 rounded-full ${isLocked ? 'bg-red-200 text-red-800' : 'bg-green-100 text-green-800'}`}>
          {isLocked ? (
            <Lock className="w-3 h-3 mr-1.5" />
          ) : (
            <div className="w-2 h-2 bg-green-500 rounded-full mr-1.5"></div>
          )}
          {isLocked ? 'Pagando' : 'Ativa'}
        </div>
      </header>

      <div className="flex-grow"></div>

      <footer className="flex justify-between items-center text-xs border-t pt-2 mt-2 ${isLocked && !isSelected ? 'border-red-200' : 'border-slate-200'}">
        <div className={`flex items-center truncate ${isLocked && !isSelected ? 'text-red-700' : 'text-slate-500'}`}>
          <User className="w-3 h-3 mr-1.5 flex-shrink-0" />
          <span className="truncate">{table.customer_name || 'Consumidor'}</span>
        </div>
        <div className={`flex items-center ${isLocked && !isSelected ? 'text-red-700' : 'text-slate-500'}`}>
          <Clock className="w-3 h-3 mr-1" />
          <span>{elapsedTime}</span>
        </div>
      </footer>
    </div>
  );
};

export default React.memo(CommandCard);
