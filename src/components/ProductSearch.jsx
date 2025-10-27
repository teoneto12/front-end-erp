import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown, PackageSearch } from 'lucide-react';
import useDebounce from '../hooks/useDebounce';

const ProductSearch = ({ onProductSelect }) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    if (debouncedSearchTerm) {
      setLoading(true);
      // Supondo que sua API de produtos aceite um parâmetro 'search'
      api.get('/products', { params: { search: debouncedSearchTerm, limit: 10 } })
        .then(response => {
          setResults(response.data.products || []);
        })
        .catch(error => {
          console.error("Erro ao buscar produtos:", error);
          setResults([]);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setResults([]);
    }
  }, [debouncedSearchTerm]);

  const handleSelect = (product) => {
    onProductSelect(product);
    setOpen(false);
    setSearchTerm('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <div className="flex items-center">
            <PackageSearch className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            Digite para buscar um produto...
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar por nome ou código..."
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            {loading && <CommandEmpty>Buscando...</CommandEmpty>}
            {!loading && results.length === 0 && searchTerm && <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>}
            <CommandGroup>
              {results.map((product) => (
                <CommandItem
                  key={product.id}
                  value={`${product.name} ${product.code}`}
                  onSelect={() => handleSelect(product)}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{product.name}</span>
                    <span className="text-xs text-gray-500">Cód: {product.code} | R$ {parseFloat(product.price).toFixed(2)}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default ProductSearch;
