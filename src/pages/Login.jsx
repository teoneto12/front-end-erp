import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-100 p-4">
      <div className="flex w-full max-w-5xl h-[600px] bg-white rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Coluna da Esquerda (Ilustração e Branding) */}
        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-green-400 to-teal-600 p-8 text-white flex-col justify-center items-center text-center relative">
          <img 
            src="/flat-design-login.png" 
            alt="Ilustração Flat Design de Gestão"
            className="w-full h-auto object-contain max-h-[80%]"
          />
          <div className="absolute bottom-8 left-0 right-0 px-8">
            <h1 className="text-3xl font-bold mb-2">Sistema de Gestão</h1>
            <p className="text-lg leading-relaxed">O controle da sua empresa em qualquer lugar!</p>
          </div>
        </div>

        {/* Coluna da Direita (Formulário) */}
        <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center">
          <div className="md:hidden text-center mb-8">
             <h1 className="text-3xl font-bold text-gray-800">Sistema de Gestão</h1>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Bem-vindo de volta!</h2>
          <p className="text-gray-600 mb-8">Faça login para acessar o sistema.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2 relative">
              <Label htmlFor="username">Usuário</Label>
              <User className="absolute left-3 top-[2.4rem] w-5 h-5 text-gray-400" />
              <Input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                placeholder="Digite seu usuário"
                className="pl-10 h-12"
              />
            </div>
            
            <div className="space-y-2 relative">
              <Label htmlFor="password">Senha</Label>
              <Lock className="absolute left-3 top-[2.4rem] w-5 h-5 text-gray-400" />
              <Input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Digite sua senha"
                className="pl-10 h-12"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-12 text-base font-bold bg-green-500 hover:bg-green-600"
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
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Não tem uma conta?{' '}
              <Link to="/register" className="font-bold text-green-600 hover:underline">
                Registre-se
              </Link>
            </p>
          </div>
          
          <div className="text-center text-xs text-gray-500 mt-auto pt-6">
            <p>Usuário padrão: admin | Senha: password</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

