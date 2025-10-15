import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth'; // Certifique-se que o caminho está correto

const ProtectedRoute = ({ children }) => {
  // Pega o status de autenticação e o estado de carregamento do nosso hook
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // 1. Se ainda estiver carregando os dados de autenticação, mostre uma tela de loading
  //    Isso evita um "piscar" da tela de login antes de verificar o token.
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        {/* Você pode usar um spinner ou qualquer indicador de loading aqui */}
        <p>Carregando...</p>
      </div>
    );
  }

  // 2. Se não estiver autenticado (e o loading já terminou), redireciona para o login
  if (!isAuthenticated) {
    // `replace` impede que o usuário volte para a página anterior (protegida) usando o botão "voltar" do navegador.
    // `state={{ from: location }}` é opcional, mas útil para redirecionar o usuário de volta para a página que ele tentou acessar após o login.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Se estiver autenticado, renderiza o componente filho (no seu caso, o <Layout /> com as páginas dentro).
  return children;
};

export default ProtectedRoute;
