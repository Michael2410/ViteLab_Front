import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Exportar datos a Excel
 */
export const exportToExcel = (
  data: any[],
  columns: { title: string; dataIndex: string }[],
  filename: string
) => {
  // Preparar datos para Excel
  const excelData = data.map(row => {
    const newRow: Record<string, any> = {};
    columns.forEach(col => {
      newRow[col.title] = row[col.dataIndex] ?? '';
    });
    return newRow;
  });

  // Crear workbook
  const ws = XLSX.utils.json_to_sheet(excelData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Reporte');

  // Ajustar ancho de columnas
  const maxWidth = columns.map(col => ({
    wch: Math.max(col.title.length, 15)
  }));
  ws['!cols'] = maxWidth;

  // Descargar
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

/**
 * Exportar datos a PDF
 */
export const exportToPDF = (
  data: any[],
  columns: { title: string; dataIndex: string }[],
  filename: string,
  titulo: string,
  subtitulo?: string
) => {
  const doc = new jsPDF('l', 'mm', 'a4'); // Landscape para más columnas
  
  // Título
  doc.setFontSize(18);
  doc.setTextColor(30, 58, 95);
  doc.text(titulo, 14, 20);
  
  // Subtítulo (fechas, filtros, etc.)
  if (subtitulo) {
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(subtitulo, 14, 28);
  }

  // Preparar datos para la tabla
  const tableData = data.map(row => 
    columns.map(col => {
      const value = row[col.dataIndex];
      if (value === null || value === undefined) return '-';
      if (typeof value === 'number') {
        // Formatear números con decimales como moneda
        if (col.dataIndex.includes('monto') || col.dataIndex.includes('precio')) {
          return `S/ ${value.toFixed(2)}`;
        }
        return value.toString();
      }
      return String(value);
    })
  );

  // Crear tabla
  autoTable(doc, {
    head: [columns.map(col => col.title)],
    body: tableData,
    startY: subtitulo ? 35 : 28,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [30, 58, 95],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    margin: { top: 10, left: 10, right: 10 },
  });

  // Pie de página
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Página ${i} de ${pageCount} - Generado el ${new Date().toLocaleString('es-PE')}`,
      14,
      doc.internal.pageSize.height - 10
    );
    doc.text(
      'ViteLab LIMS',
      doc.internal.pageSize.width - 30,
      doc.internal.pageSize.height - 10
    );
  }

  // Descargar
  doc.save(`${filename}.pdf`);
};

/**
 * Formatear moneda
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
  }).format(value);
};

/**
 * Formatear fecha
 */
export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Formatear fecha y hora
 */
export const formatDateTime = (date: string): string => {
  return new Date(date).toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
