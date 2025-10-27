import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../lib/api'; // Supondo que seu api.js configure o token

// 1. Cria o contexto
const AuthContext = createContext(null);

// 2. Cria o Provedor do Contexto
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Tenta carregar o usuário do localStorage ao iniciar a app
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      // Se tiver um token, busca os dados do usuário na API
      // (Você precisará de uma rota como /api/auth/me ou /api/users/me)
      api.get('/auth/me').then(response => {
        setUser(response.data);
      }).catch(() => {
        // Se o token for inválido, limpa tudo
        localStorage.removeItem('authToken');
        setUser(null);
      }).finally(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  // Função de login que será chamada pela página de Login
  const login = async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    const { token, user: userData } = response.data;
    
    localStorage.setItem('authToken', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`; // Atualiza o header da API
    setUser(userData);
  };

  // Função de logout
  const logout = () => {
    localStorage.removeItem('authToken');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    loading,
  };

  // 3. Retorna o Provedor envolvendo os componentes filhos
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// 4. Cria um hook customizado para facilitar o uso do contexto
export const useAuth = () => {
  return useContext(AuthContext);
};
