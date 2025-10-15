import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown, UserSearch } from 'lucide-react';
import useDebounce from '../hooks/useDebounce';

const CustomerSearch = ({ onCustomerSelect, initialCustomer }) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedValue, setSelectedValue] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    if (initialCustomer) {
      setSelectedValue(initialCustomer.name);
    } else {
      setSelectedValue('');
    }
  }, [initialCustomer]);

  useEffect(() => {
    if (debouncedSearchTerm) {
      setLoading(true);
      // Supondo que sua API de clientes aceite um parâmetro 'search'
      api.get('/customers', { params: { search: debouncedSearchTerm, limit: 10 } })
        .then(response => {
          setResults(response.data.customers || []);
        })
        .catch(error => {
          console.error("Erro ao buscar clientes:", error);
          setResults([]);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setResults([]);
    }
  }, [debouncedSearchTerm]);

  const handleSelect = (customer) => {
    onCustomerSelect(customer);
    setSelectedValue(customer ? customer.name : '');
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
          <div className="flex items-center truncate">
            <UserSearch className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            {selectedValue || "Buscar cliente..."}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar por nome ou CPF/CNPJ..."
            value={searchTerm}
            onValueChange={setSearchTerm} // CORRIGIDO: onValue-change -> onValueChange
          />
          <CommandList>
            {loading && <CommandEmpty>Buscando...</CommandEmpty>}
            {!loading && results.length === 0 && searchTerm && <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>}
            <CommandGroup>
              <CommandItem onSelect={() => handleSelect(null)}>
                <span className="text-sm text-gray-500">Nenhum (Consumidor Final)</span>
              </CommandItem>
              {results.map((customer) => (
                <CommandItem
                  key={customer.id}
                  value={customer.name}
                  onSelect={() => handleSelect(customer)}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{customer.name}</span>
                    <span className="text-xs text-gray-500">{customer.document || 'Sem documento'}</span>
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

export default CustomerSearch;
