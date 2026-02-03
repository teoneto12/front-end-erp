// Em /pages/restaurante/prints/PrintPage.jsx (VERSÃO DE DIAGNÓSTICO)

import { useEffect } from "react";
import { useParams } from "react-router-dom";

const PrintPage = () => {
  // Esta mensagem DEVE aparecer no console.
  console.log("--- [DIAGNÓSTICO SEM PROTECTEDROUTE] Componente PrintPage foi renderizado. ---");

  const { tableId } = useParams();
  console.log(`- ID da comanda na URL: ${tableId}`);

  useEffect(() => {
    console.log("- [DIAGNÓSTICO SEM PROTECTEDROUTE] useEffect foi executado.");
  }, []);

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif', fontSize: 18 }}>
      <h1>Página de Diagnóstico (Sem Proteção)</h1>
      <p>Verifique o console do navegador (F12).</p>
      <p>A janela de impressão não deve abrir.</p>
      <p>ID da Comanda: <strong>{tableId}</strong></p>
    </div>
  );
};

export default PrintPage;
