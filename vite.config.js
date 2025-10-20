import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // ==================================================
  // ▼▼▼ ADICIONE ESTE BLOCO PARA RESOLVER O PROBLEMA ▼▼▼
  // ==================================================
  server: {
    proxy: {
      // Qualquer requisição no frontend que comece com '/api'
      '/api': {
        // Será redirecionada para o seu servidor backend.
        // **IMPORTANTE**: Altere 'http://localhost:3000' se o seu backend rodar em outra porta.
        target: 'http://localhost:3000', 
        
        // Necessário para que o servidor de destino não recuse a requisição.
        changeOrigin: true, 
      }
    }
  }
  // ==================================================
  // ▲▲▲ FIM DO BLOCO ADICIONADO ▲▲▲
  // ==================================================
} )
