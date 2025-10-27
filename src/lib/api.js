// frontend/src/lib/api.js

import axios from 'axios';

// Função que lê a URL base e GARANTE que ela termine com /api
const getApiBaseUrl = () => {
  const savedApiUrl = localStorage.getItem('apiBaseUrl');
  
  if (!savedApiUrl) {
    // Retorna um fallback seguro para o ambiente de desenvolvimento
    return 'http://localhost:3000/api'; 
  }

  // Garante que a URL base (que não tem /api ) receba o sufixo /api
  return `${savedApiUrl}/api`;
};

// Cria a instância do Axios sem um baseURL inicial para evitar "congelamento"
const api = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// Função que salva a URL base "limpa" (sem /api) no localStorage
export const updateApiBaseUrl = (newUrl) => {
  // Remove /api e barras extras do final, se o usuário digitou
  const baseUrl = newUrl.replace(/\/api$/, '').replace(/\/$/, '');
  localStorage.setItem('apiBaseUrl', baseUrl);
  console.log('URL base da API foi salva no localStorage como:', baseUrl);
};

// Interceptor que define a URL correta para CADA requisição
api.interceptors.request.use(
  (config) => {
    config.baseURL = getApiBaseUrl(); // Garante que a URL mais recente seja usada
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`Enviando requisição para: ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de resposta (permanece o mesmo)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
