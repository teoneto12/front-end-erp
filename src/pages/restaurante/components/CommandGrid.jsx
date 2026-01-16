// src/pages/restaurant/components/CommandGrid.jsx

import CommandCard from './CommandCard';
import { Utensils } from 'lucide-react';

const CommandGrid = ({ tables, onTableClick, selectedTableId }) => {
  if (tables.length === 0) {
    return (
      <div className="
        text-center py-20 border-2 border-dashed rounded-lg mt-4 
        flex flex-col items-center justify-center h-full bg-white
      ">
        <Utensils className="mx-auto h-12 w-12 text-slate-400" />
        <h3 className="mt-2 text-sm font-medium text-slate-900">
          Nenhuma comanda ativa
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Clique em "Nova Comanda" para abrir a primeira.
        </p>
      </div>
    );
  }

  return (
    <div
      className="
        grid 
        grid-cols-1 
        md:grid-cols-2 
        lg:grid-cols-3 
        xl:grid-cols-4
        gap-6     /* 🔥 mais espaço entre os cards */
        pt-4      /* 🔥 espaço no topo → evita que o card 'coma' a linha */
      "
    >
      {tables.map((table) => (
        <CommandCard
          key={table.id}
          table={table}
          onClick={onTableClick}
          isSelected={selectedTableId === table.id}
        />
      ))}
    </div>
  );
};

export default CommandGrid;
