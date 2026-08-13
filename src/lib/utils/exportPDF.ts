import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportToPDF({
  title,
  subtitle,
  headers,
  rows,
  filename = 'Laporan_Kas',
}: {
  title: string;
  subtitle?: string;
  headers: string[];
  rows: (string | number)[][];
  filename?: string;
}) {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(title, 14, 20);

  if (subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(subtitle, 14, 27);
  }

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, subtitle ? 33 : 27);

  // Table
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: subtitle ? 38 : 32,
    theme: 'grid',
    headStyles: {
      fillColor: [79, 70, 229], // Indigo 600
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  doc.save(`${filename}_${new Date().toISOString().slice(0, 10)}.pdf`);
}
