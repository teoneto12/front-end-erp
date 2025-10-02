import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // MUDANÇA 1: Importe a função padrão

// Função para formatar moeda, para usar no PDF
const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export const exportToPDF = (transactions, dateFilter) => {
  // 1. Inicializa o documento PDF
  const doc = new jsPDF();

  // 2. Define o Título e o Período do Relatório
  const reportTitle = "Relatório de Vendas";
  const dateRange = dateFilter.start && dateFilter.end 
    ? `Período: ${new Date(dateFilter.start).toLocaleDateString('pt-BR')} a ${new Date(dateFilter.end).toLocaleDateString('pt-BR')}`
    : "Período: Todas as vendas";
  
  doc.setFontSize(18);
  doc.text(reportTitle, 14, 22);
  doc.setFontSize(11);
  doc.text(dateRange, 14, 30);

  // 3. Adiciona os KPIs (Resumo)
  const activeTransactions = transactions.filter(t => t.status !== 'CANCELADO');
  const totalRevenue = activeTransactions.reduce((acc, t) => acc + parseFloat(t.total_amount), 0);
  const totalSales = activeTransactions.length;
  const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

  const summaryText = `
    Faturamento Total: ${formatCurrency(totalRevenue)}
    Total de Vendas: ${totalSales}
    Ticket Médio: ${formatCurrency(averageTicket)}
  `;
  doc.setFontSize(11);
  doc.text(summaryText, 14, 40);

  // 4. Define as Colunas e as Linhas da Tabela
  const tableColumn = ["Nº Venda", "Data", "Operador", "Itens", "Status", "Total"];
  const tableRows = [];

  transactions.forEach(t => {
    const transactionData = [
      t.sale_number,
      new Date(t.transaction_date).toLocaleString('pt-BR'),
      t.cashier_name,
      (t.items || []).length, // Garante que items exista
      t.status,
      formatCurrency(t.total_amount)
    ];
    tableRows.push(transactionData);
  });

  // 5. Adiciona a Tabela ao PDF usando o autoTable
  // MUDANÇA 2: Chame autoTable como uma função, passando o 'doc'
  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 60, // Posição inicial da tabela (abaixo do resumo)
    theme: 'striped',
    headStyles: { fillColor: [22, 163, 74] }, // Cor verde para o cabeçalho
  });

  // 6. Adiciona um rodapé com a data de geração
  const pageCount = doc.internal.getNumberOfPages();
  for(let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width - 35, doc.internal.pageSize.height - 10);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, doc.internal.pageSize.height - 10);
  }

  // 7. Salva o arquivo
  doc.save(`relatorio_vendas_${new Date().toISOString().slice(0,10)}.pdf`);
};
