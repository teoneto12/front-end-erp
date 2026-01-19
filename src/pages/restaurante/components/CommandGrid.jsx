import CommandCard from './CommandCard';
import { Utensils } from 'lucide-react';

const CommandGrid = ({ tables, onTableClick, selectedTableId }) => {
  if (!tables || tables.length === 0) {
    return (
      <div className="text-center py-20 border-2 border-dashed rounded-lg mt-4 flex flex-col items-center bg-white">
        <Utensils className="h-12 w-12 text-slate-400" />
        <h3 className="mt-2 font-medium">Nenhuma comanda ativa</h3>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-4">
      {tables.map((table) => (
        <CommandCard
          key={table.id}
          table={table}
          onClick={() => onTableClick(table.id)}
          isSelected={selectedTableId.includes(table.id)}
        />
      ))}
    </div>
  );
};

export default CommandGrid;
