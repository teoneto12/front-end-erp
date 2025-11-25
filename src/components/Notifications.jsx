// src/components/Notifications.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import api from '../lib/api';

// Removida a prop 'iconSize', pois vamos definir os tamanhos diretamente aqui
const Notifications = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      const params = {
        status: 'atrasado',
        due_end_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        limit: 50,
      };
      const [receivablesRes, payablesRes] = await Promise.all([
        api.get('/accounts', { params: { ...params, type: 'receita' } }),
        api.get('/accounts', { params: { ...params, type: 'despesa' } }),
      ]);
      const allAlerts = [...(receivablesRes.data.accounts || []), ...(payablesRes.data.accounts || [])];
      allAlerts.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
      setAlerts(allAlerts);
    } catch (error) {
      console.error("Erro ao buscar alertas financeiros:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 300000); 
    return () => clearInterval(interval);
  }, []);

  const totalAlerts = alerts.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        {/* ▼▼▼ 2. BOTÃO E ÍCONE SIGNIFICATIVAMENTE MAIORES ▼▼▼ */}
        <Button variant="ghost" className="relative h-12 w-12 rounded-full">
          <Bell size={50} className="!h-6 !w-6" /> {/* Ícone grande */}
          {totalAlerts > 0 && (
            // ▼▼▼ 3. BOLHA DE NOTIFICAÇÃO MAIOR E COM FONTE MAIS VISÍVEL ▼▼▼
            <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
              {totalAlerts > 9 ? '9+' : totalAlerts}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="p-4">
          <h3 className="text-lg font-semibold">Notificações</h3>
          <p className="text-sm text-muted-foreground">
            {totalAlerts > 0 ? `Você tem ${totalAlerts} contas vencidas ou próximas do vencimento.` : 'Nenhuma notificação no momento.'}
          </p>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <p className="p-4 text-sm text-center">Carregando...</p>
          ) : (
            alerts.map(alert => (
              <Link to="/finance" key={`${alert.type}-${alert.id}`} className="block border-t p-4 hover:bg-gray-50">
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`h-5 w-5 flex-shrink-0 ${alert.status === 'atrasado' ? 'text-red-500' : 'text-yellow-500'}`} />
                  <div>
                    <p className="text-sm font-medium">{alert.type === 'receita' ? 'Conta a Receber' : 'Conta a Pagar'}</p>
                    <p className="text-xs text-muted-foreground">{alert.description}</p>
                    <p className="text-xs font-semibold">Vence em: {new Date(alert.due_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
        {totalAlerts > 0 && (
          <div className="border-t p-2">
            <Link to="/finance">
              <Button variant="link" className="w-full">Ver todas as contas</Button>
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default Notifications;
