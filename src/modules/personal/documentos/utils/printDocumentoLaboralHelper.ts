import dayjs from 'dayjs';
import 'dayjs/locale/es';
import type { DocumentoLaboralItem } from '../../types';
import type { ConfiguracionSistema as Configuracion } from '../../../configuracion/sistema/types';
import defaultLogo from '../../../../assets/logo/logo.png';

dayjs.locale('es');

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const getImageUrl = (path: string | null | undefined) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_URL.replace('/api', '')}${path}`;
};

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre'
];

function fechaEspanolFormal(fechaStr?: string | null): string {
  if (!fechaStr) return '';
  const d = dayjs(fechaStr);
  if (!d.isValid()) return fechaStr;
  const dia = d.date();
  const mes = MESES[d.month()];
  const anio = d.year();
  return `${dia} de ${mes.charAt(0).toUpperCase() + mes.slice(1)} del ${anio}`;
}

// Convertir **negrita** a <strong>negrita</strong> y saltos de línea a párrafos
function formatBodyHtml(text?: string | null): string {
  if (!text) return '';
  // Convertir **bold** a <strong>bold</strong>
  let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Dividir por saltos de línea dobles para párrafos
  const paragraphs = formatted.split(/\n\s*\n/);
  return paragraphs
    .map(p => {
      const line = p.trim().replace(/\n/g, '<br/>');
      return line ? `<p style="margin-bottom: 38px; text-align: justify; line-height: 2.0;">${line}</p>` : '';
    })
    .join('');
}

export function imprimirDocumentoLaboralA4(
  docItem: DocumentoLaboralItem,
  configuracion?: Configuracion | null,
  enrichedData?: any
) {
  if (!docItem) return;

  const logoUrl = getImageUrl(configuracion?.logo_principal) || defaultLogo;
  const empresaNombre = configuracion?.empresa_nombre || 'VITELAB';
  const empresaRazonSocial = configuracion?.empresa_razon_social || configuracion?.empresa_nombre || 'VITELAB LABORATORIO CLÍNICO S.A.C.';
  const empresaRuc = configuracion?.empresa_ruc || '20608945123';
  const empresaDireccion = configuracion?.empresa_direccion || 'Av. Principal 123 - Lima, Perú';

  const titulo = enrichedData?.titulo_documento || (
    docItem.tipo_documento === 'CONSTANCIA_TRABAJO'
      ? 'CONSTANCIA DE TRABAJO'
      : docItem.tipo_documento === 'CERTIFICADO_LABORAL'
      ? 'CERTIFICADO DE TRABAJO'
      : 'CARTA DE PRESENTACIÓN'
  );

  const cuerpoTexto = docItem.contenido_renderizado || enrichedData?.contenido_renderizado || '';
  const cuerpoHtml = formatBodyHtml(cuerpoTexto);

  const parrafoCierre = enrichedData?.parrafo_cierre
    ? `<p style="margin-bottom: 38px; text-align: justify; line-height: 2.0;">${formatBodyHtml(enrichedData.parrafo_cierre)}</p>`
    : '<p style="margin-bottom: 38px; text-align: justify; line-height: 2.0;">Extendemos el presente certificado a solicitud del interesado para los fines que estime conveniente.</p>';

  const fechaActualFormal = fechaEspanolFormal(dayjs().format('YYYY-MM-DD'));
  const ciudadEmision = enrichedData?.ciudad_defecto || 'LIMA';
  const firmanteNombre = docItem.firmante_nombre || enrichedData?.firmante_nombre || 'DIRECCIÓN DE GESTIÓN HUMANA';
  const firmanteCargo = docItem.firmante_cargo || enrichedData?.firmante_cargo || 'JEFE DE RECURSOS HUMANOS';
  const firmaUrl = getImageUrl(docItem.firmante_firma_url || enrichedData?.firmante_firma_url);

  const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${titulo} - ${docItem.colaborador_nombre}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 25mm 32mm 20mm 32mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10.5pt;
      color: #000000;
      line-height: 2.0;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page-container {
      width: 100%;
      box-sizing: border-box;
    }
    .header-logo {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
    }
    .logo-img {
      max-height: 60px;
      max-width: 220px;
      object-fit: contain;
    }
    .doc-code {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 8.5pt;
      color: #64748b;
      text-align: right;
    }
    .doc-title-box {
      text-align: center;
      margin-top: 70px;
      margin-bottom: 50px;
    }
    .doc-title {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 13.5pt;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      text-decoration: underline;
      color: #000000;
      display: inline-block;
    }
    .doc-content {
      font-size: 10.5pt;
      text-align: justify;
      color: #000000;
      line-height: 2.0;
    }
    .date-line {
      margin-top: 50px;
      margin-bottom: 20px;
      font-size: 10.5pt;
      font-weight: 500;
      color: #000000;
      text-align: left;
    }
    .signature-block {
      margin-top: 100px;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      text-align: left;
      page-break-inside: avoid;
    }
    .signature-img {
      max-height: 65px;
      max-width: 180px;
      object-fit: contain;
      margin-bottom: -10px;
      margin-left: 10px;
    }
    .signature-line {
      width: 270px;
      border-top: 1.2px solid #000000;
      margin-bottom: 8px;
    }
    .signature-name {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10pt;
      font-weight: 700;
      text-transform: uppercase;
      color: #000000;
    }
    .signature-cargo {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 8.5pt;
      text-transform: uppercase;
      color: #000000;
      margin-top: 2px;
      margin-bottom: 12px;
    }
    .company-block {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 8.5pt;
      text-transform: uppercase;
      color: #000000;
      line-height: 1.45;
    }
    @media print {
      body {
        margin: 0;
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="page-container">
    <!-- Cabecera con Logotipo de la Empresa -->
    <div class="header-logo">
      <img src="${logoUrl}" alt="${empresaNombre}" class="logo-img" />
      <div class="doc-code">
        <div><strong>${docItem.codigo_emision}</strong></div>
      </div>
    </div>

    <!-- Título Central Subrayado (Posicionado en la zona media alta) -->
    <div class="doc-title-box">
      <h1 class="doc-title">${titulo}</h1>
    </div>

    <!-- Cuerpo del Documento (Distribuido armoniosamente en el centro) -->
    <div class="doc-content">
      ${cuerpoHtml}
      ${parrafoCierre}
    </div>

    <!-- Fecha en Español -->
    <div class="date-line">
      ${ciudadEmision.toUpperCase()}, ${fechaActualFormal}
    </div>

    <!-- Bloque de Firma y Datos de la Empresa alineados a la izquierda según el formato de referencia -->
    <div class="signature-block">
      ${firmaUrl ? `<img src="${firmaUrl}" alt="Firma" class="signature-img" />` : '<div style="height: 35px;"></div>'}
      <div class="signature-line"></div>
      <div class="signature-name">${firmanteNombre}</div>
      <div class="signature-cargo">${firmanteCargo}</div>
      <div class="company-block">
        <div>${empresaRazonSocial}</div>
        ${empresaDireccion ? `<div>${empresaDireccion.toUpperCase()}</div>` : ''}
        <div>RUC: ${empresaRuc}</div>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();

  // Limpiar iframe previo si existe
  const oldIframe = document.getElementById('iframe-print-doc-laboral');
  if (oldIframe) {
    oldIframe.remove();
  }

  // Crear iframe invisible con dimensiones A4 para la impresión
  const iframe = document.createElement('iframe');
  iframe.id = 'iframe-print-doc-laboral';
  iframe.style.position = 'fixed';
  iframe.style.left = '-9999px';
  iframe.style.top = '0';
  iframe.style.width = '210mm';
  iframe.style.height = '297mm';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  doc.open();
  doc.write(htmlContent);
  doc.close();

  const ejecutarImpresion = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (err) {
      console.error('Error al invocar impresión de documento:', err);
    } finally {
      setTimeout(() => {
        iframe.remove();
      }, 3000);
    }
  };

  const imagenesACargar: string[] = [];
  if (logoUrl) imagenesACargar.push(logoUrl);
  if (firmaUrl) imagenesACargar.push(firmaUrl);

  if (imagenesACargar.length > 0) {
    let cargadas = 0;
    const chequearListo = () => {
      cargadas++;
      if (cargadas >= imagenesACargar.length) {
        setTimeout(ejecutarImpresion, 200);
      }
    };
    imagenesACargar.forEach((src) => {
      const img = new Image();
      img.src = src;
      img.onload = chequearListo;
      img.onerror = chequearListo;
    });
  } else {
    setTimeout(ejecutarImpresion, 200);
  }
}
