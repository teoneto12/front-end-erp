// frontend/src/pages/Login.jsx

import { useState, useEffect, useCallback } from 'react'; // 1. Adiciona useCallback
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { updateApiBaseUrl } from '../lib/api.js';

// --- Componentes da UI ---
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';

// --- Ícones ---
import { Loader2, LogIn, User, Lock, AlertCircle, Settings } from 'lucide-react';

import '../App.css';

const Login = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [apiUrlInput, setApiUrlInput] = useState(''); // 2. Renomeado para clareza

  // 3. Função para verificar a URL, agora usando useCallback para otimização
  const checkApiUrl = useCallback(() => {
    const savedUrl = localStorage.getItem('apiBaseUrl');
    setApiUrlInput(savedUrl || '');

    if (!savedUrl) {
      setError('O endereço do servidor não está configurado. Clique no ícone de engrenagem para configurar.');
    } else {
      setError(''); // Limpa o erro se a URL existir
    }
  }, []); // Esta função é estável e não precisa de dependências

  // 4. useEffect principal que roda apenas uma vez na montagem para a verificação inicial
  useEffect(() => {
    checkApiUrl();
  }, [checkApiUrl]);

  const handleSaveApiUrl = () => {
    if (!apiUrlInput || !apiUrlInput.startsWith('http' )) {
      setError('Por favor, insira uma URL válida (ex: http://192.168.0.100:3000 )');
      return;
    }
    
    // A função updateApiBaseUrl agora é inteligente e lida com a formatação
    updateApiBaseUrl(apiUrlInput);
    
    setIsModalOpen(false); // Fecha o modal
    
    // 5. Chama a função de verificação novamente para ATUALIZAR a UI imediatamente
    checkApiUrl(); 
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const currentApiUrl = localStorage.getItem('apiBaseUrl');
    if (!currentApiUrl) {
      setError('O endereço do servidor não está configurado. Clique no ícone de engrenagem para configurar.');
      return;
    }

    setLoading(true);
    setError('');

    const result = await login(formData.username, formData.password);
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Ocorreu um erro desconhecido.');
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-gray-100 p-4">
      
      {/* Ícone de Configuração e Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-900"
            aria-label="Configurações do Servidor"
          >
            <Settings className="h-6 w-6" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Configurar Servidor</DialogTitle>
            <DialogDescription>
              Insira o endereço base do servidor (sem /api no final).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="api-url" className="text-right">
                URL Base
              </Label>
              <Input
                id="api-url"
                value={apiUrlInput} // Usa o novo estado
                onChange={(e) => setApiUrlInput(e.target.value)}
                className="col-span-3"
                placeholder="http://192.168.1.10:3000"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveApiUrl}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Card de Login */}
      <div className="flex w-full max-w-4xl h-auto md:h-[600px] bg-white rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Coluna da Esquerda (Formulário ) */}
        <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center">
          <div className="mb-8">
             <h1 className="text-3xl font-bold text-gray-800">Sistema de Gestão</h1>
             <p className="text-gray-600 mt-2">O controle da sua empresa em qualquer lugar!</p>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Acesse sua conta</h2>
          <p className="text-gray-500 mb-8">Bem-vindo de volta! Por favor, insira seus dados.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="username" className="text-base">Usuário</Label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input id="username" name="username" type="text" required value={formData.username} onChange={handleChange} placeholder="seu.usuario" className="pl-11 h-12 text-base rounded-lg" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-base">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input id="password" name="password" type="password" required value={formData.password} onChange={handleChange} placeholder="••••••••" className="pl-11 h-12 text-base rounded-lg" />
              </div>
            </div>
            
            <Button type="submit" className="w-full h-12 text-base font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg" disabled={loading}>
              {loading ? ( <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Entrando...</> ) : ( <><LogIn className="mr-2 h-5 w-5" />Entrar</> )}
            </Button>
          </form>
        </div>

        {/* Coluna da Direita (Ilustração) */}
        <div className="hidden md:flex w-1/2 bg-gray-50 p-8 flex-col justify-center items-center text-center">
          <img src="/flat-design-login.png" alt="Ilustração de gestão" className="w-full max-w-sm" />
        </div>

      </div>
    </div>
  );
};

export default Login;
