// src/lib/receiptGenerator.js

import html2canvas from 'html2canvas';

// Funções auxiliares (permanecem as mesmas)
const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);
const formatDate = (dateString) => new Date(dateString).toLocaleString('pt-BR');

/**
 * Gera uma IMAGEM de um recibo e a imprime.
 * @param {object} transaction - O objeto da transação.
 */
export const printReceipt = async (transaction) => {
  // 1. Criar um elemento DIV invisível que servirá de molde para o recibo
  const receiptElement = document.createElement('div');
  
  // Estilos para o molde (parecido com o CSS anterior, mas agora para o molde)
  receiptElement.style.width = '280px'; // ~72mm em pixels
  receiptElement.style.fontFamily = "'Courier New', Courier, monospace";
  receiptElement.style.fontSize = '12px';
  receiptElement.style.color = '#000';
  receiptElement.style.padding = '15px';
  receiptElement.style.background = '#fff'; // Fundo branco é crucial para a imagem

  // 2. Montar o HTML interno do recibo (lógica que já tínhamos)
  const itemsHtml = (transaction.items || []).map(item => `
    <div style="display: flex; justify-content: space-between;">
      <span>${item.quantity}x ${item.product_name}</span>
      <span>${formatCurrency(item.subtotal)}</span>
    </div>
  `).join('');

  const paymentsHtml = (transaction.payments || []).map(p => {
    const methodName = p.name || p.payment_method_name || p.method || 'N/A';
    return `
      <div style="display: flex; justify-content: space-between;">
        <span>${methodName.toUpperCase()}:</span>
        <span>${formatCurrency(p.amount)}</span>
      </div>
    `;
  }).join('');

  const subtotal = transaction.subtotal_amount || (transaction.items || []).reduce((acc, item) => acc + parseFloat(item.subtotal || 0), 0);
  const discountAmount = transaction.discount_amount ?? (subtotal * (transaction.discount_percent / 100));

  receiptElement.innerHTML = `
    <div style="text-align: center; margin-bottom: 10px;">
      <h2 style="margin: 0; font-size: 16px; font-weight: bold;">NOME DA SUA EMPRESA</h2>
      <p style="margin: 2px 0;">Rua Exemplo, 123 - Bairro, Cidade - UF</p>
      <p style="margin: 2px 0;">CNPJ: 00.000.000/0001-00</p>
    </div>
    <hr style="border: none; border-top: 1px dashed #000; margin: 5px 0;">
    <div style="display: flex; justify-content: space-between;">
      <span>Venda: #${transaction.sale_number}</span>
      <span>${formatDate(transaction.transaction_date)}</span>
    </div>
    <div style="display: flex; justify-content: space-between;">
      <span>Operador: ${transaction.cashier_name}</span>
    </div>
    <hr style="border: none; border-top: 1px dashed #000; margin: 5px 0;">
    ${itemsHtml}
    <hr style="border: none; border-top: 1px dashed #000; margin: 5px 0;">
    <div style="display: flex; justify-content: space-between;">
      <span>Subtotal:</span>
      <span>${formatCurrency(subtotal)}</span>
    </div>
    ${discountAmount > 0 ? `
      <div style="display: flex; justify-content: space-between;">
        <span>Desconto:</span>
        <span>-${formatCurrency(discountAmount)}</span>
      </div>
    ` : ''}
    <hr style="border: none; border-top: 1px dashed #000; margin: 5px 0;">
    <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 14px;">
      <span>TOTAL:</span>
      <span>${formatCurrency(transaction.total_amount)}</span>
    </div>
    <hr style="border: none; border-top: 1px dashed #000; margin: 5px 0;">
    <div style="font-weight: bold;">Pagamentos:</div>
    ${paymentsHtml}
    <hr style="border: none; border-top: 1px dashed #000; margin: 5px 0;">
    <div style="text-align: center; margin-top: 10px;">
      <p>Obrigado e volte sempre!</p>
      <p>Este documento não é um cupom fiscal.</p>
    </div>
  `;

  // 3. Adicionar o molde invisível ao corpo da página para que ele possa ser renderizado
  receiptElement.style.position = 'absolute';
  receiptElement.style.left = '-9999px';
  document.body.appendChild(receiptElement);

  try {
    // 4. Usar html2canvas para transformar o molde em uma imagem
    const canvas = await html2canvas(receiptElement, {
      scale: 2, // Aumenta a resolução da imagem para maior nitidez
      useCORS: true,
      backgroundColor: '#ffffff',
    });

    const imageUrl = canvas.toDataURL('image/png');

    // 5. Abrir uma nova janela e imprimir a IMAGEM
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>Imprimir Recibo</title></head>
          <body style="margin:0;">
            <img src="${imageUrl}" style="width:100%;" />
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    } else {
      alert('Seu navegador bloqueou a janela de impressão.');
    }

  } catch (error) {
    console.error('Erro ao gerar a imagem do recibo:', error);
    alert('Ocorreu um erro ao preparar o recibo para impressão.');
  } finally {
    // 6. Remover o molde invisível da página
    document.body.removeChild(receiptElement);
  }
};
