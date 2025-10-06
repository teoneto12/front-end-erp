import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

// ATUALIZAÇÃO: A função agora aceita um array de transações e um filtro de data opcional.
export const exportToPDF = (transactions, dateFilter = null) => {
  if (!transactions || transactions.length === 0) {
    alert("Não há dados para gerar o PDF.");
    return;
  }

  const doc = new jsPDF();
  const isSingleTransaction = transactions.length === 1;

  // --- Título do Documento ---
  const reportTitle = isSingleTransaction ? `Comprovante de Venda #${transactions[0].sale_number}` : "Relatório de Vendas";
  doc.setFontSize(18);
  doc.text(reportTitle, 14, 22);

  // --- Período ou Data da Venda ---
  let dateText;
  if (isSingleTransaction) {
    dateText = `Data: ${new Date(transactions[0].transaction_date).toLocaleString('pt-BR')}`;
  } else if (dateFilter && dateFilter.start && dateFilter.end) {
    dateText = `Período: ${new Date(dateFilter.start).toLocaleDateString('pt-BR')} a ${new Date(dateFilter.end).toLocaleDateString('pt-BR')}`;
  } else {
    dateText = "Período: Todas as vendas";
  }
  doc.setFontSize(11);
  doc.text(dateText, 14, 30);

  // --- Resumo (KPIs) ---
  const activeTransactions = transactions.filter(t => t.status !== 'CANCELADO');
  const totalRevenue = activeTransactions.reduce((acc, t) => acc + parseFloat(t.total_amount), 0);
  
  if (!isSingleTransaction) {
    const totalSales = activeTransactions.length;
    const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;
    const summaryText = `
      Faturamento Total: ${formatCurrency(totalRevenue)}
      Total de Vendas: ${totalSales}
      Ticket Médio: ${formatCurrency(averageTicket)}
    `;
    doc.text(summaryText, 14, 40);
  }

  // --- Tabela de Itens/Vendas ---
  const tableColumn = isSingleTransaction 
    ? ["Qtd", "Produto", "Preço Unit.", "Subtotal"]
    : ["Nº Venda", "Data", "Operador", "Itens", "Status", "Total"];
  
  const tableRows = [];
  if (isSingleTransaction) {
    const tran = transactions[0];
    (tran.items || []).forEach(item => {
      tableRows.push([
        item.quantity,
        item.product_name,
        formatCurrency(item.unit_price),
        formatCurrency(item.subtotal)
      ]);
    });
  } else {
    transactions.forEach(t => {
      tableRows.push([
        t.sale_number,
        new Date(t.transaction_date).toLocaleString('pt-BR'),
        t.cashier_name,
        (t.items || []).length,
        t.status,
        formatCurrency(t.total_amount)
      ]);
    });
  }

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: isSingleTransaction ? 40 : 60,
    theme: 'striped',
    headStyles: { fillColor: [22, 163, 74] },
  });

  // --- Seção de Totais e Pagamentos (apenas para venda única) ---
  if (isSingleTransaction) {
    const finalY = doc.lastAutoTable.finalY + 10;
    const tran = transactions[0];
    const subtotal = (tran.items || []).reduce((acc, item) => acc + parseFloat(item.subtotal), 0);
    const discountAmount = tran.discount_percent > 0 ? (subtotal * (tran.discount_percent / 100)) : 0;

    doc.setFontSize(10);
    doc.text(`Subtotal: ${formatCurrency(subtotal)}`, 14, finalY);
    if (discountAmount > 0) {
      doc.text(`Desconto: -${formatCurrency(discountAmount)}`, 14, finalY + 5);
    }
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Total: ${formatCurrency(tran.total_amount)}`, 14, finalY + 12);
    doc.setFont("helvetica", "normal");

    doc.setFontSize(10);
    doc.text("Pagamentos:", 14, finalY + 20);
    let paymentY = finalY + 25;
    (tran.payments || []).forEach(p => {
      doc.text(`${p.payment_method_name}: ${formatCurrency(p.amount)}`, 14, paymentY);
      paymentY += 5;
    });
  }

  // --- Rodapé ---
  const pageCount = doc.internal.getNumberOfPages();
  for(let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width - 35, doc.internal.pageSize.height - 10);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, doc.internal.pageSize.height - 10);
  }

  // --- Salvar Arquivo ---
  const fileName = isSingleTransaction 
    ? `venda_${transactions[0].sale_number}.pdf`
    : `relatorio_vendas_${new Date().toISOString().slice(0,10)}.pdf`;
  doc.save(fileName);
};
