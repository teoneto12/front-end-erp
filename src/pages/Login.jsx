import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, LogIn, User, Lock, AlertCircle } from 'lucide-react';
import '../App.css';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-100 p-4">
      <div className="flex w-full max-w-4xl h-auto md:h-[600px] bg-white rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Coluna da Esquerda (Formulário) */}
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
                <Input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="seu.usuario"
                  className="pl-11 h-12 text-base rounded-lg"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-base">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="pl-11 h-12 text-base rounded-lg"
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-12 text-base font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-5 w-5" />
                  Entrar
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Coluna da Direita (Ilustração) */}
        <div className="hidden md:flex w-1/2 bg-gray-50 p-8 flex-col justify-center items-center text-center">
          <img 
            src="/flat-design-login.png" 
            alt="Ilustração de uma pessoa usando um laptop para gestão de negócios"
            className="w-full max-w-sm"
          />
        </div>

      </div>
    </div>
  );
};

export default Login;
