// ARQUIVO: src/components/kitchen/KitchenFilters.jsx

import { Search } from 'lucide-react';

const KitchenFilters = ({ filters, setFilters }) => {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col md:flex-row items-center gap-4">
      {/* Filtro de Status */}
      <div className="w-full md:w-auto">
        <select
          name="status"
          value={filters.status}
          onChange={handleInputChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        >
          <option value="PREPARANDO">Preparando</option>
          <option value="PRONTO">Pronto</option>
          <option value="AGUARDANDO_ENTREGA">Aguardando Entrega</option>
        </select>
      </div>

      {/* Filtro de Setor */}
      <div className="w-full md:w-auto">
        <input
          type="text"
          name="setor"
          placeholder="Filtrar por setor..."
          value={filters.setor}
          onChange={handleInputChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Filtro de Busca */}
      <div className="relative w-full md:flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          name="busca"
          placeholder="Buscar por nº do pedido ou produto..."
          value={filters.busca}
          onChange={handleInputChange}
          className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
};

export default KitchenFilters;
