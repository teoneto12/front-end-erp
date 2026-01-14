import { useState, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';




const API_BASE_URL = '/api'; 

export function useMenuData() {
  const [sections, setSections] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingSections, setLoadingSections] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Função para buscar as SEÇÕES REAIS da sua API
  const fetchSections = useCallback(async () => {
    setLoadingSections(true);
    try {
      // Assumindo que você tem uma rota que retorna as seções.
      // Se o formato da resposta for diferente, ajuste aqui.
      const response = await axios.get(`${API_BASE_URL}/sections`/*, { headers: { Authorization: `Bearer ${token}` } }*/);
      
      // Se a sua API de seções retorna um objeto { sections: [...] }, mantenha a linha abaixo.
      // Se ela retorna diretamente o array [...], use: setSections(response.data || []);
      setSections(response.data.sections?.filter(s => s.id != null) || []);
    } catch (error) {
      console.error("Falha ao buscar seções:", error);
      toast.error("Não foi possível carregar as seções do cardápio.");
    } finally {
      setLoadingSections(false);
    }
  }, [/* token */]);

  // Função para buscar os PRODUTOS REAIS de uma seção específica, usando seu controller
  const fetchProductsBySection = useCallback(async (sectionId) => {
    if (!sectionId) {
      setProducts([]);
      return;
    }
    setLoadingProducts(true);
    try {
      // Chamada real à API, exatamente como seu controller espera
      const response = await axios.get(`${API_BASE_URL}/products`, {
        params: {
          section_id: sectionId,
          limit: 200 // Define um limite alto para buscar todos os produtos da seção
        }
        /*, headers: { Authorization: `Bearer ${token}` } */
      });
      
      // Seu controller retorna { products: [...] }, então acessamos response.data.products
      setProducts(response.data.products || []);
    } catch (error) {
      console.error("Falha ao buscar produtos da seção:", error);
      toast.error("Não foi possível carregar os produtos.");
    } finally {
      setLoadingProducts(false);
    }
  }, [/* token */]);

  return {
    sections,
    products,
    fetchSections,
    fetchProductsBySection,
    loadingSections,
    loadingProducts,
  };
}
