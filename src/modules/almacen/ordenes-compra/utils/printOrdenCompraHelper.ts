import dayjs from 'dayjs';
import type { OrdenCompra } from '../ordenes-compra.types';
import type { ConfiguracionSistema as Configuracion } from '../../../configuracion/sistema/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const getImageUrl = (path: string | null | undefined) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_URL.replace('/api', '')}${path}`;
};

export function imprimirOrdenCompraA4(
  orden: OrdenCompra,
  configuracion?: Configuracion | null
) {
  if (!orden) return;

  const logoUrl = getImageUrl(configuracion?.logo_principal);
  const empresaNombre = configuracion?.empresa_nombre || 'VITELAB - LABORATORIO CLÍNICO';
  const empresaRuc = configuracion?.empresa_ruc ? `RUC: ${configuracion.empresa_ruc}` : 'RUC: 20608549123';
  const empresaDireccion = configuracion?.empresa_direccion || 'Av. Principal 123 - Lima, Perú';
  const empresaTelefono = configuracion?.empresa_telefono ? `Telf: ${configuracion.empresa_telefono}` : '';
  const empresaEmail = configuracion?.empresa_email ? `Email: ${configuracion.empresa_email}` : '';

  const monedaSimbolo = orden.moneda === 'USD' ? '$' : 'S/';
  const subtotal = Number(orden.subtotal || 0).toFixed(2);
  const igv = Number(orden.igv || 0).toFixed(2);
  const total = Number(orden.total || 0).toFixed(2);

  const filasItems = (orden.items || [])
    .map(
      (it, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
        <td style="padding: 7px 8px; text-align: center; color: #64748b;">${idx + 1}</td>
        <td style="padding: 7px 8px; font-weight: 600; color: #1e293b;">${it.producto_codigo || '-'}</td>
        <td style="padding: 7px 8px; color: #0f172a;">
          <div style="font-weight: 600;">${it.producto_nombre || 'Producto'}</div>
          ${it.observaciones ? `<div style="font-size: 9.5px; color: #64748b; font-style: italic;">Obs: ${it.observaciones}</div>` : ''}
        </td>
        <td style="padding: 7px 8px; text-align: center; color: #475569;">${it.unidad_medida_codigo || 'UND'}</td>
        <td style="padding: 7px 8px; text-align: right; font-weight: 700; color: #0f172a;">${Number(it.cantidad_solicitada).toFixed(2)}</td>
        <td style="padding: 7px 8px; text-align: right; color: #334155;">${monedaSimbolo} ${Number(it.precio_unitario).toFixed(2)}</td>
        <td style="padding: 7px 8px; text-align: right; font-weight: 700; color: #0f172a;">${monedaSimbolo} ${Number(it.subtotal).toFixed(2)}</td>
      </tr>`
    )
    .join('');

  const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Orden de Compra - ${orden.numero}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 10mm 12mm 10mm;
    }
    * {
      box-sizing: border-box;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    html, body {
      margin: 0;
      padding: 0;
      color: #0f172a;
      background: #ffffff;
      font-size: 11px;
      line-height: 1.35;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
    }
    .oc-box {
      border: 2px solid #0284c7;
      border-radius: 8px;
      padding: 10px 14px;
      text-align: center;
      background-color: #f0f9ff;
    }
    .info-card {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 10px 12px;
      margin-bottom: 14px;
    }
    .table-items {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      margin-bottom: 14px;
    }
    .table-items th {
      background-color: #0284c7;
      color: #ffffff;
      font-weight: 700;
      font-size: 11px;
      padding: 7px 8px;
      text-align: left;
    }
    .totals-table {
      width: 280px;
      border-collapse: collapse;
      float: right;
      margin-bottom: 20px;
    }
    .totals-table td {
      padding: 5px 8px;
      font-size: 11.5px;
    }
    .signatures {
      width: 100%;
      margin-top: 40px;
      display: flex;
      justify-content: space-between;
      clear: both;
    }
    .sig-box {
      width: 30%;
      text-align: center;
      border-top: 1px solid #64748b;
      padding-top: 6px;
      font-size: 10px;
      color: #475569;
    }
  </style>
</head>
<body>

  <!-- CABECERA INSTITUCIONAL -->
  <table class="header-table">
    <tr>
      <td style="vertical-align: top; width: 62%;">
        <div style="display: flex; align-items: center; gap: 12px;">
          ${logoUrl ? `<img src="${logoUrl}" alt="Logo" style="max-height: 52px; max-width: 160px; object-fit: contain;" />` : ''}
          <div>
            <div style="font-size: 16px; font-weight: 800; color: #0369a1; text-transform: uppercase;">${empresaNombre}</div>
            <div style="font-size: 11px; font-weight: 600; color: #334155; margin-top: 1px;">${empresaRuc}</div>
            <div style="font-size: 10.5px; color: #64748b; margin-top: 1px;">${empresaDireccion}</div>
            <div style="font-size: 10px; color: #64748b;">${[empresaTelefono, empresaEmail].filter(Boolean).join(' • ')}</div>
          </div>
        </div>
      </td>
      <td style="vertical-align: top; width: 38%;">
        <div class="oc-box">
          <div style="font-size: 13px; font-weight: 800; color: #0369a1; letter-spacing: 0.5px;">ORDEN DE COMPRA</div>
          <div style="font-size: 18px; font-weight: 900; color: #0f172a; margin-top: 4px;">${orden.numero}</div>
          <div style="font-size: 10px; color: #475569; margin-top: 3px;">SEDE: <strong>${orden.sede_nombre || 'Principal'}</strong></div>
        </div>
      </td>
    </tr>
  </table>

  <!-- DATOS DE LA OPERACION Y PROVEEDOR -->
  <div class="info-card">
    <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
      <tr>
        <td style="width: 55%; vertical-align: top; padding-right: 12px; border-right: 1px dashed #cbd5e1;">
          <div style="font-size: 11px; font-weight: 700; color: #0369a1; text-transform: uppercase; margin-bottom: 4px; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px;">
            Datos del Proveedor
          </div>
          <div><strong>Razón Social:</strong> ${orden.proveedor_razon_social || '-'}</div>
          <div><strong>R.U.C.:</strong> ${orden.proveedor_ruc || 'Sin documento'}</div>
          <div><strong>Dirección:</strong> ${orden.proveedor_direccion || 'No especificada'}</div>
          <div><strong>Contacto:</strong> ${orden.proveedor_contacto || '-'} ${orden.proveedor_telefono ? `(${orden.proveedor_telefono})` : ''}</div>
          <div><strong>Email:</strong> ${orden.proveedor_email || '-'}</div>
        </td>
        <td style="width: 45%; vertical-align: top; padding-left: 12px;">
          <div style="font-size: 11px; font-weight: 700; color: #0369a1; text-transform: uppercase; margin-bottom: 4px; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px;">
            Condiciones de la Orden
          </div>
          <div><strong>Fecha de Emisión:</strong> ${dayjs(orden.fecha_emision).format('DD/MM/YYYY')}</div>
          <div><strong>Fecha Entrega Esperada:</strong> ${orden.fecha_entrega_esperada ? dayjs(orden.fecha_entrega_esperada).format('DD/MM/YYYY') : 'Inmediata / A coordinar'}</div>
          <div><strong>Moneda:</strong> ${orden.moneda === 'USD' ? 'Dólares Americanos (USD)' : 'Soles Peruanos (PEN)'}</div>
          <div><strong>Condición de Pago:</strong> ${orden.condicion_pago || 'CONTADO'}</div>
          <div><strong>Almacén Sugerido:</strong> ${orden.almacen_destino_nombre || 'Almacén Central'}</div>
        </td>
      </tr>
    </table>
  </div>

  <!-- TABLA DE PRODUCTOS SOLICITADOS -->
  <table class="table-items">
    <thead>
      <tr>
        <th style="width: 35px; text-align: center;">#</th>
        <th style="width: 90px;">Código</th>
        <th>Descripción del Producto</th>
        <th style="width: 60px; text-align: center;">U.M.</th>
        <th style="width: 80px; text-align: right;">Cant.</th>
        <th style="width: 90px; text-align: right;">P. Unit</th>
        <th style="width: 95px; text-align: right;">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      ${filasItems}
    </tbody>
  </table>

  <!-- RESUMEN ECONOMICO Y OBSERVACIONES -->
  <div style="width: 100%; display: flex; justify-content: space-between; align-items: flex-start;">
    <div style="width: 58%; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; background-color: #f8fafc; font-size: 10.5px;">
      <div style="font-weight: 700; color: #334155; margin-bottom: 2px;">Observaciones y Condiciones:</div>
      <div style="color: #64748b;">${orden.observaciones || 'La entrega de los bienes debe realizarse con su respectiva Guía de Remisión o Factura en los almacenes de la empresa.'}</div>
    </div>

    <table class="totals-table">
      <tr>
        <td style="color: #64748b; font-weight: 500;">Subtotal:</td>
        <td style="text-align: right; font-weight: 600; color: #1e293b;">${monedaSimbolo} ${subtotal}</td>
      </tr>
      <tr>
        <td style="color: #64748b; font-weight: 500;">I.G.V. (18%):</td>
        <td style="text-align: right; font-weight: 600; color: #1e293b;">${monedaSimbolo} ${igv}</td>
      </tr>
      <tr style="border-top: 2px solid #0284c7; background-color: #f0f9ff;">
        <td style="font-weight: 800; color: #0284c7; font-size: 12.5px;">TOTAL:</td>
        <td style="text-align: right; font-weight: 900; color: #0284c7; font-size: 13.5px;">${monedaSimbolo} ${total}</td>
      </tr>
    </table>
  </div>

  <!-- FIRMAS Y AUTORIZACIONES -->
  <div class="signatures">
    <div class="sig-box">
      <strong>${orden.usuario_registro_nombre || 'Compras / Logística'}</strong><br />
      Elaborado por
    </div>
    <div class="sig-box">
      <strong>Gerencia / Administración</strong><br />
      Aprobado por
    </div>
    <div class="sig-box">
      <strong>Firma y Sello del Proveedor</strong><br />
      Aceptado y Conforme
    </div>
  </div>

</body>
</html>
`;

  // Remover iframe previo si existiera
  const oldIframe = document.getElementById('iframe-print-orden-compra');
  if (oldIframe) {
    oldIframe.remove();
  }

  // Usar un iframe invisible para la impresión
  // Esto evita abrir una ventana en blanco y que el HTML de fondo quede visible detrás del diálogo de impresión
  const iframe = document.createElement('iframe');
  iframe.id = 'iframe-print-orden-compra';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
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
      console.error('Error al invocar impresión:', err);
    } finally {
      // Dejar que termine de procesar el spool de impresión antes de remover
      setTimeout(() => {
        iframe.remove();
      }, 3000);
    }
  };

  // Si hay logo, esperar a que cargue antes de lanzar el diálogo
  if (logoUrl) {
    const img = new Image();
    img.src = logoUrl;
    img.onload = () => setTimeout(ejecutarImpresion, 200);
    img.onerror = () => setTimeout(ejecutarImpresion, 200);
  } else {
    setTimeout(ejecutarImpresion, 200);
  }
}
