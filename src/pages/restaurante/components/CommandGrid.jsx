// src/pages/restaurant/components/CommandGrid.jsx
import React from 'react';
import CommandCard from './CommandCard';

const CommandGrid = ({ tables, loading, selectedTableIds, onTableClick }) => {
  if (loading) return <p>Carregando mesas...</p>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 overflow-visible">
      {tables.map((table) => (
        <CommandCard
          key={table.id}
          table={table}
          onClick={() => onTableClick(table.id)}
          isSelected={selectedTableIds.includes(table.id)}
        />
      ))}
    </div>
  );
};

export default CommandGrid;
