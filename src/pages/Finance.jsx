import { useState, useEffect } from 'react';
// ... (outras importações do Finance.jsx)
import Modal from '../components/Modal.jsx';

// Formulário de Lançamento ATUALIZADO
const AccountForm = ({ account, activeTab, onSave, onCancel, customers }) => { // <-- Recebe a lista de clientes
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    due_date: '',
    type: activeTab,
    status: 'pendente',
    payment_term: 'a_vista', // <-- NOVO CAMPO
    customer_id: '',        // <-- NOVO CAMPO
  });

  useEffect(() => {
    if (account) {
      setFormData({
        description: account.description || '',
        amount: account.amount || '',
        due_date: account.due_date ? new Date(account.due_date).toISOString().slice(0, 10) : '',
        type: account.type || activeTab,
        status: account.status || 'pendente',
        payment_term: account.payment_term || 'a_vista', // <-- NOVO CAMPO
        customer_id: account.customer_id || '',          // <-- NOVO CAMPO
      });
    } else {
      setFormData({
        description: '', amount: '', due_date: '', type: activeTab, status: 'pendente', payment_term: 'a_vista', customer_id: '',
      });
    }
  }, [account, activeTab]);

  // ... (handleChange e handleSubmit permanecem iguais)
  const handleChange = (e) => { /* ... */ };
  const handleSubmit = (e) => { /* ... */ };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* ... (campo de descrição) ... */}
      
      {/* NOVO CAMPO: Cliente */}
      <div>
        <label htmlFor="customer_id" className="block text-sm font-medium text-gray-700 mb-1">Cliente (Opcional)</label>
        <Select name="customer_id" value={formData.customer_id} onValueChange={(value) => setFormData(prev => ({ ...prev, customer_id: value }))}>
          <SelectTrigger><SelectValue placeholder="Selecione um cliente" /></SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="">Nenhum</SelectItem>
            {customers.map(customer => (
              <SelectItem key={customer.id} value={customer.id.toString()}>{customer.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ... (campos de valor e data) ... */}

      <div className="grid grid-cols-2 gap-4">
        {/* NOVO CAMPO: Condição de Pagamento */}
        <div>
          <label htmlFor="payment_term" className="block text-sm font-medium text-gray-700 mb-1">Condição</label>
          <Select name="payment_term" value={formData.payment_term} onValueChange={(value) => setFormData(prev => ({ ...prev, payment_term: value }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="a_vista">À Vista</SelectItem>
              <SelectItem value="a_prazo">A Prazo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <Select name="status" value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="pago">Pago</SelectItem>
              <SelectItem value="atrasado">Atrasado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* ... (botões de salvar e cancelar) ... */}
    </form>
  );
};

// Componente Finance ATUALIZADO
const Finance = () => {
  const [accounts, setAccounts] = useState([]);
  const [customers, setCustomers] = useState([]); // <-- NOVO ESTADO para clientes
  const [loading, setLoading] = useState(true);
  // ... (outros estados)

  // Efeito para buscar contas E clientes
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      // Usamos Promise.all para buscar tudo em paralelo
      await Promise.all([
        fetchAccounts(activeTab),
        fetchCustomers()
      ]);
      setLoading(false);
    };
    loadData();
  }, [activeTab]);

  const fetchAccounts = async (type) => { /* ... (sem alterações) ... */ };

  // NOVA FUNÇÃO para buscar clientes
  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers');
      setCustomers(response.data.customers || []);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
    }
  };

  // ... (outras funções handle)

  return (
    <div className="p-6">
      {/* ... (cabeçalho da página) ... */}
      
      {/* ... (Tabs e Card com a tabela) ... */}
      {/* Você pode querer adicionar as colunas "Cliente" e "Condição" na tabela também */}

      <Modal
        open={isModalOpen}
        onClose={handleModalClose}
        title={editingAccount ? 'Editar Lançamento' : 'Novo Lançamento'}
      >
        <AccountForm
          account={editingAccount}
          activeTab={activeTab}
          onSave={handleSaveAccount}
          onCancel={handleModalClose}
          customers={customers} // <-- PASSA A LISTA DE CLIENTES PARA O FORMULÁRIO
        />
      </Modal>
    </div>
  );
};

export default Finance;
