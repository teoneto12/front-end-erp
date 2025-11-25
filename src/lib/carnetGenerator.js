import jsPDF from "jspdf";
import "jspdf-barcode";

// --- FUNÇÕES AUXILIARES ---

const formatCurrency = (value) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatDate = (date) =>
  new Date(date).toLocaleDateString("pt-br", { timeZone: "UTC" });

const extractInstallmentInfo = (description) => {
  const match = description.match(/parcela\s*(\d+)\s*\/\s*(\d+)/i);
  if (match && match.length === 3) {
    return {
      current: parseInt(match[1], 10),
      total: parseInt(match[2], 10),
    };
  }
  return null;
};

// --- FUNÇÃO PRINCIPAL ---

export const generateCarnetPDF = (partner, accounts, companyInfo) => {
  if (!partner || !accounts || accounts.length === 0) {
    alert("Parceiro ou contas inválidas para gerar o carnê.");
    return;
  }

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const sortedAccounts = [...accounts].sort(
    (a, b) => new Date(a.due_date) - new Date(b.due_date)
  );

  const startX = 10;
  const startY = 15;
  const carnetWidth = 277;
  const carnetHeight = 85;
  const spacingY = 10;

  sortedAccounts.forEach((account, index) => {
    const installmentInfo = extractInstallmentInfo(account.description);
    const pageNumber = installmentInfo ? installmentInfo.current : index + 1;
    const totalPages = installmentInfo ? installmentInfo.total : sortedAccounts.length;

    const carnetIndexOnPage = index % 2;
    const currentY = startY + carnetIndexOnPage * (carnetHeight + spacingY);

    if (index > 0 && index % 2 === 0) {
      doc.addPage();
    }

    doc.setDrawColor(150);
    doc.setLineWidth(0.2);
    doc.rect(startX, currentY, carnetWidth, carnetHeight);

    const cutLineX = startX + 90;
    doc.setLineDashPattern([2, 1], 0);
    doc.line(cutLineX, currentY, cutLineX, currentY + carnetHeight);
    doc.setLineDashPattern([], 0);
    doc.setFontSize(12);
    doc.text("✂", cutLineX - 1.5, currentY + 5);

    // --- LADO ESQUERDO (VIA DO CLIENTE) ---
    const leftX = startX + 3;
    const leftY = currentY + 8;
    doc.setFontSize(7);
    doc.setTextColor(80);
    // ▼▼▼ ALTERAÇÃO 1 ▼▼▼
    doc.text("Nome Cliente", leftX, leftY);
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.setFont(undefined, "bold");
    doc.text(partner.name.toUpperCase(), leftX, leftY + 5);

    doc.line(startX, leftY + 8, cutLineX, leftY + 8);

    doc.setFontSize(7);
    doc.setTextColor(80);
    doc.text("Tipo Cobrança", leftX, leftY + 13);
    doc.text("Vencimento", leftX + 50, leftY + 13);
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.setFont(undefined, "normal");
    doc.text(account.description, leftX, leftY + 18);
    doc.setFont(undefined, "bold");
    doc.text(formatDate(account.due_date), leftX + 50, leftY + 18);

    doc.rect(leftX, leftY + 21, 84, 25);
    doc.line(leftX, leftY + 28, leftX + 84, leftY + 28);
    doc.line(leftX + 28, leftY + 21, leftX + 28, leftY + 46);
    doc.line(leftX + 56, leftY + 21, leftX + 56, leftY + 35);
    doc.line(leftX, leftY + 35, leftX + 84, leftY + 35);

    doc.setFontSize(7);
    doc.setTextColor(80);
    doc.text("Nº Lanç.", leftX + 2, leftY + 26);
    doc.text("Valor c/ Desconto", leftX + 30, leftY + 26);
    doc.text("Valor s/ Desconto", leftX + 58, leftY + 26);
    doc.text("Juros/Multa(+)", leftX + 2, leftY + 40);
    doc.text("Desc.(-)", leftX + 30, leftY + 40);
    doc.text("V. Cobrado(=)", leftX + 58, leftY + 40);

    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.setFont(undefined, "bold");
    doc.text(String(account.id), leftX + 2, leftY + 33);
    doc.text(formatCurrency(account.amount), leftX + 30, leftY + 33);
    doc.text(formatCurrency(account.amount), leftX + 58, leftY + 33);

    doc.setFontSize(7);
    doc.setTextColor(80);
    // ▼▼▼ ALTERAÇÃO 2 ▼▼▼
    doc.text("Observações:", leftX, leftY + 52);
    doc.setFontSize(9);
    doc.setTextColor(0);
    doc.setFont(undefined, "bold");
    // Removido o texto fixo "CURSO EXEMPLO"
    doc.text("", leftX, leftY + 57); 
    doc.setFontSize(7);
    doc.setTextColor(150);
    // ▼▼▼ ALTERAÇÃO 3 ▼▼▼
    doc.text("Via do Cliente", leftX + 70, leftY + 62);

    // --- LADO DIREITO (VIA DO ESTABELECIMENTO) ---
    const rightX = cutLineX + 5;
    const rightY = currentY + 8;

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.setFont(undefined, "bold");
    doc.text(companyInfo.name.toUpperCase(), rightX, rightY);

    const boxWidth = carnetWidth - (rightX - startX) - 5;
    doc.rect(rightX + boxWidth - 40, currentY + 2, 40, 12);
    doc.line(rightX + boxWidth - 20, currentY + 2, rightX + boxWidth - 20, currentY + 14);
    doc.setFontSize(7);
    doc.setTextColor(80);
    doc.text("Nº Lanç.", rightX + boxWidth - 38, currentY + 6);
    doc.text("Parcela", rightX + boxWidth - 18, currentY + 6);
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.setFont(undefined, "bold");
    doc.text(String(account.id), rightX + boxWidth - 38, currentY + 11);
    doc.text(`${pageNumber}/${totalPages}`, rightX + boxWidth - 18, currentY + 11);

    doc.setFontSize(7);
    doc.setTextColor(80);
    // ▼▼▼ ALTERAÇÃO 4 ▼▼▼
    doc.text("Nome Cliente", rightX, rightY + 10);
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.setFont(undefined, "bold");
    doc.text(partner.name.toUpperCase(), rightX, rightY + 15);

    const tableRightY = rightY + 20;
    doc.rect(rightX, tableRightY, boxWidth, 14);
    doc.line(rightX, tableRightY + 7, rightX + boxWidth, tableRightY + 7);
    doc.line(rightX + 40, tableRightY, rightX + 40, tableRightY + 14);
    doc.line(rightX + 80, tableRightY, rightX + 80, tableRightY + 14);
    doc.line(rightX + 120, tableRightY, rightX + 120, tableRightY + 14);

    doc.setFontSize(7);
    doc.setTextColor(80);
    doc.text("Tipo Cobrança", rightX + 2, tableRightY + 5);
    doc.text("Vencimento", rightX + 42, tableRightY + 5);
    doc.text("Sem Desconto(=)", rightX + 82, tableRightY + 5);
    doc.text("Com Desconto(=)", rightX + 122, tableRightY + 5);

    doc.setFontSize(9);
    doc.setTextColor(0);
    doc.setFont(undefined, "bold");
    doc.text(account.description, rightX + 2, tableRightY + 12);
    doc.text(formatDate(account.due_date), rightX + 42, tableRightY + 12);
    doc.text(formatCurrency(account.amount), rightX + 82, tableRightY + 12);
    doc.text(formatCurrency(account.amount), rightX + 122, tableRightY + 12);

    doc.setFontSize(7);
    doc.setTextColor(80);
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.setFont(undefined, "bold");


    try {
      doc.barcode(String(account.id), {
        fontSize: 10,
        x: rightX + boxWidth - 50,
        y: tableRightY + 30,
        width: 0.6,
        height: 15,
      });
    } catch (e) {
      console.error("Erro ao gerar código de barras:", e);
    }

    doc.setFontSize(7);
    doc.setTextColor(150);
    // ▼▼▼ ALTERAÇÃO 5 ▼▼▼
    doc.text("Via do Estabelecimento", rightX + boxWidth - 65, carnetHeight + currentY - 3);
  });

  doc.output("dataurlnewwindow");
};
