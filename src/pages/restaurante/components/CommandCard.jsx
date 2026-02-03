import React, { useState, useEffect } from 'react';
import { Clock, User, Lock, CheckCircle2 } from 'lucide-react';

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
      if (diffInSeconds < 60) {
        setElapsedTime('< 1m');
        return;
      }
      const hours = Math.floor(diffInSeconds / 3600);
      const minutes = Math.floor((diffInSeconds % 3600) / 60);
      setElapsedTime(hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`);
    };

    calculateElapsedTime();
    const interval = setInterval(calculateElapsedTime, 60000); // Atualiza a cada minuto
    return () => clearInterval(interval);
  }, [table.created_at]);

  const isLocked = table.status === 'EM_PAGAMENTO';

  // --- Paleta de Cores para os Estados ---
  const stateStyles = {
    default: {
      card: 'bg-white border-slate-200 hover:border-slate-400 hover:bg-slate-50',
      tableName: 'text-slate-800',
      statusBadge: 'bg-green-100 text-green-800',
      footerText: 'text-slate-500',
      footerIcon: 'text-slate-400',
    },
    locked: {
      card: 'bg-red-50 border-red-200 hover:border-red-400',
      tableName: 'text-red-900',
      statusBadge: 'bg-red-100 text-red-800',
      footerText: 'text-red-700',
      footerIcon: 'text-red-400',
    },
    selected: {
      // REMOVIDO: scale-[1.03] e z-10 para evitar quebra de layout no grid
      card: 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/50 shadow-md',
      tableName: 'text-blue-900',
      statusBadge: 'bg-blue-100 text-blue-800',
      footerText: 'text-blue-700',
      footerIcon: 'text-blue-400',
    },
  };

  const currentStyle = isSelected ? stateStyles.selected : (isLocked ? stateStyles.locked : stateStyles.default);

  const StatusIcon = isLocked ? Lock : CheckCircle2;
  const statusText = isLocked ? 'BLOQUEADA' : 'ATIVA';

  return (
    <div
      onClick={onClick}
      className={`
        relative flex flex-col justify-between
        p-4 rounded-xl cursor-pointer
        transition-all duration-200 ease-in-out
        w-full h-full min-h-[160px]
        border-2
        ${currentStyle.card}
      `}
    >
      {/* Cabeçalho do Card */}
      <header className="flex justify-between items-start gap-2">
        <h3 className={`font-bold text-5xl leading-none tracking-tight ${currentStyle.tableName}`}>
          {table.name}
        </h3>
        <div className={`flex items-center text-xs font-bold px-2.5 py-1 rounded-full ${currentStyle.statusBadge}`}>
          <StatusIcon className="w-3.5 h-3.5 mr-1.5" />
          <span>{statusText}</span>
        </div>
      </header>

      {/* Rodapé do Card */}
      <footer className="mt-auto pt-4 space-y-2">
        <div className={`flex items-center text-sm font-semibold ${currentStyle.footerText}`}>
          <User className={`w-4 h-4 mr-2 shrink-0 ${currentStyle.footerIcon}`} />
          <span className="truncate">{table.customer_name || 'Consumidor'}</span>
        </div>
        <div className={`flex items-center text-xs font-medium ${currentStyle.footerText}`}>
          <Clock className={`w-4 h-4 mr-2 shrink-0 ${currentStyle.footerIcon}`} />
          <span>{elapsedTime}</span>
        </div>
      </footer>
    </div>
  );
};

export default React.memo(CommandCard);
