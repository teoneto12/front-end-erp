// src/lib/pdfGenerator.js

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- FUNÇÕES AUXILIARES MAIS ROBUSTAS ---
const formatCurrency = (value) => {
  const numberValue = Number(value);
  if (isNaN(numberValue)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numberValue);
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'Data inválida';
  return date.toLocaleString('pt-BR', { timeZone: 'UTC' });
};

const formatNumber = (value) => {
  const numberValue = Number(value);
  if (isNaN(numberValue)) return '0';
  return new Intl.NumberFormat('pt-BR').format(numberValue);
};

// ==================================================================
// FUNÇÃO PARA GERAR O CUPOM TÉRMICO DE 80mm
// ==================================================================
const generateThermalReceipt = (transaction) => {
  // Garante que transaction seja um objeto para evitar erros de acesso
  const t = transaction || {};

  const company = {
    fantasyName: 'NOME DE FANTASIA',
    legalName: 'NOME DA RAZAO SOCIAL LTDA-ME',
    address1: 'Rua dos Equipamentos, 9',
    address2: 'Centro - Rio de Janeiro/RJ',
    cnpj: '11.111.111/0001-11',
    phone: '(21) 1111-2222'
  };

  // ▼▼▼ CORREÇÃO: Cálculos com verificação de segurança ▼▼▼
  const subtotal = (t.items || []).reduce((acc, item) => acc + parseFloat(item.subtotal || 0), 0);
  const discountAmount = parseFloat(t.discount_amount || 0);
  const totalAmount = parseFloat(t.total_amount || 0);
  const totalPaid = (t.payments || []).reduce((acc, p) => acc + parseFloat(p.amount || 0), 0);
  const change = Math.max(0, totalPaid - totalAmount);

  const lineHeight = 4;
  const baseHeight = 140;
  const itemsHeight = (t.items || []).length * (lineHeight * 2);
  const paymentsHeight = (t.payments || []).length * lineHeight;
  const finalHeight = baseHeight + itemsHeight + paymentsHeight;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, finalHeight] 
  });

  doc.setFont('Courier', 'normal');

  let y = 10;
  const leftMargin = 3;
  const rightMargin = 77;
  const center = 40;

  const drawText = (text, yPos, style = 'normal', size = 9) => {
    doc.setFontSize(size).setFont('Courier', style);
    doc.text(String(text || ''), center, yPos, { align: 'center' });
  };

  const drawLeftRight = (leftText, rightText, yPos, style = 'normal', size = 9) => {
  if (typeof yPos !== 'number' || isNaN(yPos)) {
    console.error("ERRO: yPos inválido no drawLeftRight:", yPos, leftText, rightText);
    return;
  }

  const left = String(leftText ?? '');
  const right = String(rightText ?? '');

  doc.setFontSize(size).setFont('Courier', style);

  try {
    doc.text(left, leftMargin, yPos);
  } catch (e) {
    console.error("ERRO left:", left, leftMargin, yPos, e);
  }

  try {
    doc.text(right, rightMargin, yPos, { align: 'right' });
  } catch (e) {
    console.error("ERRO right:", right, rightMargin, yPos, e);
  }
};

  
  const drawLine = (yPos) => {
    doc.text('-'.repeat(45), center, yPos, { align: 'center' });
  };

  drawText(company.fantasyName, y, 'bold', 11); y += lineHeight;
  drawText(company.legalName, y); y += lineHeight;
  drawText(company.address1, y); y += lineHeight;
  drawText(company.address2, y); y += lineHeight;
  drawText(`CNPJ: ${company.cnpj}`, y); y += lineHeight;
  drawText(company.phone, y); y += (lineHeight * 2);

  drawLine(y); y += lineHeight;
  
  drawLeftRight(`Data: ${formatDate(t.transaction_date)}`, `Venda: ${t.sale_number || 'N/A'}`); y += lineHeight;
  doc.text(`Cliente: ${t.customer_name || 'CONSUMIDOR FINAL'}`, leftMargin, y); y += lineHeight;
  doc.text(`Vendedor: ${t.cashier_name || 'N/A'}`, leftMargin, y); y += lineHeight;
  drawLine(y); y += lineHeight;

  drawText('CUPOM NAO FISCAL', y, 'bold'); y += (lineHeight * 1.5);
  doc.setFontSize(9).setFont('Courier', 'bold');
  doc.text('PRODUTO', leftMargin, y);
  doc.text('VL. TOTAL', rightMargin, y, { align: 'right' });
  y += lineHeight;
  doc.setFontSize(8).setFont('Courier', 'normal');
  
  (t.items || []).forEach(item => {
    doc.text(item.product_name || 'Produto desconhecido', leftMargin, y);
    y += lineHeight;
    doc.text(
      `${item.quantity || 0} un x ${formatCurrency(item.unit_price)}`,
      leftMargin + 2, y
    );
    doc.text(formatCurrency(item.subtotal), rightMargin, y, { align: 'right' });
    y += lineHeight;
  });
  
  drawLine(y); y += lineHeight;

  drawLeftRight('Subtotal', formatCurrency(subtotal), y, 'normal', 10); y += lineHeight;
  if (discountAmount > 0) {
    drawLeftRight('Desconto', `-${formatCurrency(discountAmount)}`, y, 'normal', 10); y += lineHeight;
  }
  drawLeftRight('TOTAL', formatCurrency(totalAmount), y, 'bold', 12); y += (lineHeight * 2);

  drawText('PAGAMENTOS', y); y += lineHeight;
  (t.payments || []).forEach(p => {
    drawLeftRight(p.payment_method_name || 'N/A', formatCurrency(p.amount), y);
    y += lineHeight;
  });
  y += lineHeight;

  drawLeftRight('Valor Recebido', formatCurrency(totalPaid), y); y += lineHeight;
  drawLeftRight('Troco', formatCurrency(change), y); y += lineHeight;
  
  drawLine(y); y += (lineHeight * 2);

  drawText('* OBRIGADO E VOLTE SEMPRE *', y);

  return doc;
};

// ==================================================================
// FUNÇÃO PARA GERAR O RELATÓRIO A4 (sem alterações)
// ==================================================================
const generateSalesReport = (transactions, dateFilter) => {
  const doc = new jsPDF();
  doc.setFontSize(18).text("Relatório de Vendas", 14, 22);
  let dateText = "Período: Todas as vendas";
  if (dateFilter && dateFilter.start && dateFilter.end) {
    const startDate = new Date(dateFilter.start);
    startDate.setDate(startDate.getDate() + 1);
    const endDate = new Date(dateFilter.end);
    endDate.setDate(endDate.getDate() + 1);
    dateText = `Período: ${startDate.toLocaleDateString('pt-BR')} a ${endDate.toLocaleDateString('pt-BR')}`;
  }
  doc.setFontSize(11).text(dateText, 14, 30);

  const activeTransactions = transactions.filter(t => t.status !== 'CANCELADO');
  const totalRevenue = activeTransactions.reduce((acc, t) => acc + parseFloat(t.total_amount || 0), 0);
  const totalSales = activeTransactions.length;
  const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;
  
  const summaryText = `Faturamento Total: ${formatCurrency(totalRevenue)}  |  Total de Vendas: ${formatNumber(totalSales)}  |  Ticket Médio: ${formatCurrency(averageTicket)}`;
  doc.setFontSize(10).text(summaryText, 14, 40);

  const tableColumn = ["Nº Venda", "Data", "Operador", "Cliente", "Itens", "Status", "Total"];
  const tableRows = transactions.map(t => [
    t.sale_number,
    formatDate(t.transaction_date),
    t.cashier_name,
    t.customer_name || 'N/A',
    (t.items || []).length,
    t.status,
    formatCurrency(t.total_amount)
  ]);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 50,
    theme: 'striped',
    headStyles: { fillColor: [37, 99, 235] },
  });
  
  return doc;
};


// ==================================================================
// FUNÇÃO PRINCIPAL (ORQUESTRADORA)
// ==================================================================
export const exportToPDF = (transactions, dateFilter = null) => {
  if (!transactions || transactions.length === 0) {
    alert("Não há dados para gerar o PDF.");
    return;
  }

  const isSingleTransaction = transactions.length === 1;
  let doc;

  if (isSingleTransaction) {
    doc = generateThermalReceipt(transactions[0]);
  } else {
    doc = generateSalesReport(transactions, dateFilter);
  }

  if (!isSingleTransaction) {
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8).setTextColor(100);
      doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, doc.internal.pageSize.height - 10);
    }
  }

  const fileName = isSingleTransaction
    ? `cupom_venda_${(transactions[0] || {}).sale_number || 'recibo'}.pdf`
    : `relatorio_vendas_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.output('dataurlnewwindow', { filename: fileName });
};
