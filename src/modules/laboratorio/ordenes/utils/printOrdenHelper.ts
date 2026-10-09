import dayjs from 'dayjs';
import type { OrdenDetalle } from '../types';
import type { ConfiguracionSistema as Configuracion } from '../../../configuracion/sistema/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const getImageUrl = (path: string | null | undefined) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_URL.replace('/api', '')}${path}`;
};

const calcularEdad = (fechaNacimiento: string | null | undefined): string => {
  if (!fechaNacimiento) return '-';
  const hoy = dayjs();
  const nacimiento = dayjs(fechaNacimiento);
  const años = hoy.diff(nacimiento, 'year');
  return `${años}a`;
};

export function imprimirTicketOrden(
  orden: OrdenDetalle,
  configuracion?: Configuracion | null
) {
  if (!orden) return;

  const printWindow = window.open('', '_blank', 'width=1200,height=900');
  if (!printWindow) {
    alert('Por favor habilite las ventanas emergentes en el navegador para imprimir el ticket');
    return;
  }

  const logoUrl = getImageUrl(configuracion?.logo_principal);
  const empresaNombre = configuracion?.empresa_nombre || 'VITELAB - LABORATORIO CLÍNICO';
  const ruc = configuracion?.empresa_ruc ? `RUC: ${configuracion.empresa_ruc}` : '';

  const pacienteNombre = `${orden.paciente?.nombres || ''} ${orden.paciente?.apellido_paterno || ''} ${orden.paciente?.apellido_materno || ''}`.trim() || 'Paciente General';
  const dni = orden.paciente?.dni || 'Sin documento';
  const edad = calcularEdad(orden.paciente?.fecha_nacimiento);
  const genero = orden.paciente?.genero === 'M' ? 'M' : orden.paciente?.genero === 'F' ? 'F' : '-';
  const telefono = orden.paciente?.telefono || '';
  const sedeNombre = orden.sede?.nombre || 'Principal';

  const totalCalculado = orden.analisis.reduce(
    (sum, item) => sum + (Number(item.precio) || 0),
    0
  );
  const totalFinal = orden.total ? Number(orden.total) : totalCalculado;

  const filasAnalisis = orden.analisis
    .map(
      (item) => `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 3px 0; font-size: 10.5px; vertical-align: top;">${item.nombre}</td>
        <td style="padding: 3px 0; text-align: right; font-weight: 700; font-size: 10.5px; vertical-align: top; white-space: nowrap;">
          S/ ${(Number(item.precio) || 0).toFixed(2)}
        </td>
      </tr>`
    )
    .join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Ticket_Orden_${String(orden.numero_atencion).padStart(6, '0')}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 3mm;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            font-size: 10.5px;
            color: #0f172a;
            margin: 0;
            padding: 4px;
            line-height: 1.3;
          }
          .ticket {
            max-width: 380px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            border-bottom: 1px dashed #94a3b8;
            padding-bottom: 6px;
            margin-bottom: 5px;
          }
          .logo {
            max-height: 38px;
            max-width: 130px;
            margin-bottom: 3px;
            object-fit: contain;
          }
          .header h2 {
            margin: 0 0 1px 0;
            font-size: 12.5px;
            font-weight: 800;
            letter-spacing: 0.3px;
            color: #0f172a;
          }
          .header p {
            margin: 0;
            font-size: 9.5px;
            color: #475569;
          }
          .ticket-title {
            margin-top: 4px;
            font-size: 11px;
            font-weight: 800;
            color: #0284c7;
            text-transform: uppercase;
            letter-spacing: 0.4px;
          }
          .ticket-number {
            font-size: 14px;
            font-weight: 900;
            color: #0f172a;
            font-family: monospace;
          }
          .meta {
            font-size: 10px;
            border-bottom: 1px dashed #94a3b8;
            padding-bottom: 4px;
            margin-bottom: 5px;
          }
          .meta-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5px;
          }
          .meta-group {
            display: flex;
            align-items: center;
            gap: 4px;
          }
          .meta-label {
            color: #64748b;
          }
          .meta-val {
            font-weight: 600;
            color: #1e293b;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 4px;
          }
          th {
            border-bottom: 1px solid #cbd5e1;
            padding: 3px 0;
            text-align: left;
            font-size: 9.5px;
            color: #64748b;
            text-transform: uppercase;
          }
          .summary {
            border-top: 1px dashed #94a3b8;
            padding-top: 4px;
            margin-top: 2px;
          }
          .grand-total {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 13.5px;
            font-weight: 800;
            border-top: 1.5px solid #0f172a;
            border-bottom: 1.5px solid #0f172a;
            padding: 4px 0;
            margin: 4px 0 2px 0;
            background: #f8fafc;
          }
          .summary-sub {
            display: flex;
            justify-content: space-between;
            color: #64748b;
            font-size: 9.5px;
            margin-top: 2px;
          }
          .footer {
            margin-top: 10px;
            text-align: center;
            font-size: 9px;
            color: #64748b;
            border-top: 1px dashed #cbd5e1;
            padding-top: 4px;
          }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="header">
            ${logoUrl ? `<img src="${logoUrl}" alt="Logo" class="logo" /><br/>` : ''}
            <h2>${empresaNombre}</h2>
            ${ruc ? `<p>${ruc}</p>` : ''}
            <div class="ticket-title">Orden de Atención</div>
            <div class="ticket-number">N° ${String(orden.numero_atencion).padStart(6, '0')}</div>
            <p style="margin-top: 2px;">${dayjs(orden.fecha_registro).format('DD/MM/YYYY HH:mm A')}</p>
          </div>

          <!-- Datos del paciente compactos -->
          <div class="meta">
            <div class="meta-row">
              <div class="meta-group">
                <span class="meta-label">Paciente:</span>
                <span class="meta-val">${pacienteNombre}</span>
              </div>
            </div>
            <div class="meta-row">
              <div class="meta-group">
                <span class="meta-label">DNI:</span>
                <span class="meta-val">${dni}</span>
              </div>
              <div class="meta-group">
                <span class="meta-label">Edad/Sexo:</span>
                <span class="meta-val">${edad} (${genero})</span>
              </div>
            </div>
            <div class="meta-row">
              <div class="meta-group">
                <span class="meta-label">Sede:</span>
                <span class="meta-val">${sedeNombre}</span>
              </div>
              ${telefono ? `
              <div class="meta-group">
                <span class="meta-label">Telf:</span>
                <span class="meta-val">${telefono}</span>
              </div>` : ''}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Análisis / Examen</th>
                <th style="text-align:right;">Precio</th>
              </tr>
            </thead>
            <tbody>
              ${filasAnalisis}
            </tbody>
          </table>

          <div class="summary">
            <div class="grand-total">
              <span>TOTAL A PAGAR:</span>
              <span>S/ ${totalFinal.toFixed(2)}</span>
            </div>
            <div class="summary-sub">
              <span>Total exámenes:</span>
              <strong>${orden.analisis.length}</strong>
            </div>
          </div>

          <div class="footer">
            <p style="margin: 0 0 2px 0; font-weight: 600;">¡Gracias por su preferencia!</p>
            <p style="margin: 0;">Consulte sus resultados con su N° de documento.</p>
          </div>
        </div>

        <script>
          window.onload = function() {
            window.focus();
            window.print();
            setTimeout(function() { window.close(); }, 800);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
