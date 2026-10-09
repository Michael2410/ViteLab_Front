import dayjs, { type Dayjs } from 'dayjs';
import type { ReporteCuadreCaja } from '../types';

export interface PrintCuadreCajaParams {
  reporte: ReporteCuadreCaja;
  fecha: Dayjs;
  sedeNombre?: string;
  cajeroNombre?: string;
}

export function imprimirTicketCuadreCaja({
  reporte,
  fecha,
  sedeNombre = 'Todas las Sedes',
  cajeroNombre = 'Todos los Cajeros / Trabajadores',
}: PrintCuadreCajaParams) {
  if (!reporte) return;

  const printWindow = window.open('', '_blank', 'width=1200,height=900');
  if (!printWindow) {
    alert('Por favor habilite las ventanas emergentes en el navegador para imprimir');
    return;
  }

  const filasMetodos = (reporte.desglose_metodos || [])
    .map(
      (item) => `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 4px 0; font-size: 11px;">${item.metodo}</td>
        <td style="padding: 4px 0; text-align: center; font-size: 11px;">${item.cantidad}</td>
        <td style="padding: 4px 0; text-align: right; font-weight: 700; font-size: 11px;">S/ ${Number(item.monto).toFixed(2)}</td>
      </tr>`
    )
    .join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Cierre_Caja_${fecha.format('YYYYMMDD')}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 4mm;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            font-size: 11px;
            color: #0f172a;
            margin: 0;
            padding: 6px;
            line-height: 1.35;
          }
          .ticket {
            max-width: 380px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            border-bottom: 1px dashed #94a3b8;
            padding-bottom: 6px;
            margin-bottom: 6px;
          }
          .header h2 {
            margin: 0 0 2px 0;
            font-size: 14px;
            font-weight: 800;
            letter-spacing: 0.5px;
          }
          .header p {
            margin: 0;
            font-size: 10px;
            color: #475569;
          }
          .meta {
            font-size: 10.5px;
            border-bottom: 1px dashed #94a3b8;
            padding-bottom: 6px;
            margin-bottom: 6px;
          }
          .meta-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 2px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 6px;
          }
          th {
            border-bottom: 1px solid #cbd5e1;
            padding: 3px 0;
            text-align: left;
            font-size: 10px;
            color: #64748b;
            text-transform: uppercase;
          }
          .totales {
            border-top: 1px dashed #94a3b8;
            padding-top: 6px;
            margin-top: 4px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
            font-size: 11px;
          }
          .grand-total {
            display: flex;
            justify-content: space-between;
            font-size: 14px;
            font-weight: 800;
            border-top: 1.5px solid #0f172a;
            border-bottom: 1.5px solid #0f172a;
            padding: 5px 0;
            margin: 5px 0;
            background: #f8fafc;
          }
          .firmas {
            margin-top: 36px;
            display: flex;
            justify-content: space-between;
            text-align: center;
            font-size: 9.5px;
          }
          .firma-box {
            width: 44%;
            border-top: 1px solid #64748b;
            padding-top: 4px;
          }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="header">
            <h2>VITELAB - CIERRE DE CAJA</h2>
            <p>Arqueo y Liquidación Diaria</p>
          </div>
          <div class="meta">
            <div class="meta-row"><span>Fecha:</span><strong>${fecha.format('DD/MM/YYYY')}</strong></div>
            <div class="meta-row"><span>Hora:</span><strong>${dayjs().format('HH:mm:ss')}</strong></div>
            <div class="meta-row"><span>Sede:</span><strong>${sedeNombre}</strong></div>
            <div class="meta-row"><span>Cajero:</span><strong>${cajeroNombre}</strong></div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Medio Pago</th>
                <th style="text-align:center;">Cant.</th>
                <th style="text-align:right;">Monto</th>
              </tr>
            </thead>
            <tbody>
              ${filasMetodos}
            </tbody>
          </table>
          <div class="totales">
            <div class="total-row"><span>💵 Efectivo en Caja:</span><strong>S/ ${Number(reporte.totales.total_efectivo || 0).toFixed(2)}</strong></div>
            <div class="total-row"><span>📱 Cobros Digitales:</span><strong>S/ ${Number(reporte.totales.total_digital || 0).toFixed(2)}</strong></div>
            <div class="grand-total">
              <span>TOTAL RECAUDADO:</span>
              <span>S/ ${Number(reporte.totales.total_recaudado || 0).toFixed(2)}</span>
            </div>
            <div class="total-row" style="color: #64748b; font-size: 10px;">
              <span>Atenciones registradas:</span>
              <strong>${reporte.totales.cantidad_ordenes || 0}</strong>
            </div>
          </div>
          <div class="firmas">
            <div class="firma-box">
              <strong>Cajero / Operador</strong><br/>
              <span>DNI / Firma</span>
            </div>
            <div class="firma-box">
              <strong>V°B° Administración</strong><br/>
              <span>Supervisor</span>
            </div>
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
