import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Typography,
  Tag,
  Row,
  Col,
  message,
  Result,
  Button,
  Space,
  Card,
  DatePicker,
  Select,
} from 'antd';
import {
  ArrowLeftOutlined,
  LockOutlined,
  DollarOutlined,
  WalletOutlined,
  CreditCardOutlined,
  ShoppingOutlined,
  PrinterOutlined,
  SearchOutlined,
  CalendarOutlined,
  UserOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { type Dayjs } from 'dayjs';

import ModulePageLayout from '../../../../shared/components/ModulePageLayout';
import { GlobalTable } from '../../../../shared/components/GlobalTable';
import ExportButtons from '../components/ExportButtons';
import { usePermissions } from '../../../../shared/components/PermissionGuard';
import { getReporteCuadreCaja } from '../api';
import { useSedesActivas } from '../../ordenes/hooks';
import { useUsuarios } from '../../../configuracion/usuarios/hooks';
import { exportToExcel, exportToPDF, formatCurrency } from '../utils/exportHelpers';
import { imprimirTicketCuadreCaja } from '../utils/printCuadreCajaHelper';
import type { FiltrosCuadreCaja, PagoCuadreDetalle, ReporteCuadreCaja } from '../types';

const { Text } = Typography;

const metodoPagoConfig: Record<string, { color: string; label: string; icon: string }> = {
  EFECTIVO: { color: 'green', label: 'Efectivo', icon: '💵' },
  YAPE: { color: 'purple', label: 'Yape', icon: '🟣' },
  PLIN: { color: 'cyan', label: 'Plin', icon: '🔵' },
  TARJETA: { color: 'blue', label: 'Tarjeta / POS', icon: '💳' },
  TRANSFERENCIA: { color: 'orange', label: 'Transferencia', icon: '🏦' },
};

export default function ReporteCuadreCajaPage() {
  const navigate = useNavigate();
  const { hasPermission, isSuperAdmin, isAdmin } = usePermissions();

  const canAccess =
    isSuperAdmin ||
    isAdmin ||
    hasPermission('reports.cuadre_caja.read') ||
    hasPermission('reports.read');

  // Filtros iniciales: Hoy
  const [fechaSeleccionada, setFechaSeleccionada] = useState<Dayjs>(dayjs());
  const [sedeId, setSedeId] = useState<number | undefined>(undefined);
  const [usuarioId, setUsuarioId] = useState<number | undefined>(undefined);

  const [reporte, setReporte] = useState<ReporteCuadreCaja | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: sedes, isLoading: loadingSedes } = useSedesActivas();
  const { data: usuarios } = useUsuarios();

  const fetchCuadre = useCallback(async (filtrosParams: FiltrosCuadreCaja) => {
    try {
      setLoading(true);
      const data = await getReporteCuadreCaja(filtrosParams);
      setReporte(data);
    } catch (error) {
      console.error('Error al obtener el cuadre de caja:', error);
      message.error('Error al generar el arqueo de caja');
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar datos al montar y al cambiar filtros principales
  useEffect(() => {
    if (canAccess) {
      fetchCuadre({
        fecha: fechaSeleccionada.format('YYYY-MM-DD'),
        sede_id: sedeId,
        usuario_id: usuarioId,
      });
    }
  }, [canAccess, fechaSeleccionada, sedeId, usuarioId, fetchCuadre]);

  const handleBuscar = () => {
    fetchCuadre({
      fecha: fechaSeleccionada.format('YYYY-MM-DD'),
      sede_id: sedeId,
      usuario_id: usuarioId,
    });
  };

  const handleHoy = () => {
    const hoy = dayjs();
    setFechaSeleccionada(hoy);
    fetchCuadre({
      fecha: hoy.format('YYYY-MM-DD'),
      sede_id: sedeId,
      usuario_id: usuarioId,
    });
  };

  const columns: ColumnsType<PagoCuadreDetalle> = [
    {
      title: 'Hora',
      dataIndex: 'fecha_hora',
      key: 'hora',
      width: 95,
      render: (fh) => (
        <span style={{ fontWeight: 600, color: '#334155', fontFamily: 'monospace' }}>
          {fh ? dayjs(fh).format('HH:mm:ss') : '-'}
        </span>
      ),
    },
    {
      title: 'N° Orden',
      dataIndex: 'numero_atencion',
      key: 'numero_atencion',
      width: 105,
      render: (num) => (
        <span style={{ fontWeight: 700, color: '#0284c7', fontFamily: 'monospace' }}>
          #{num}
        </span>
      ),
    },
    {
      title: 'Paciente',
      key: 'paciente',
      width: 220,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0f172a' }}>
            {record.paciente_nombre}
          </div>
          <div style={{ fontSize: 11, color: '#64748b' }}>
            DNI: {record.paciente_dni || 'Sin documento'}
          </div>
        </div>
      ),
    },
    {
      title: 'Sede',
      dataIndex: 'sede_nombre',
      key: 'sede_nombre',
      width: 130,
      render: (sede) => (
        <Tag style={{ borderRadius: 6, fontWeight: 500 }}>
          {sede || 'Principal'}
        </Tag>
      ),
    },
    {
      title: 'Cajero / Registrado por',
      dataIndex: 'usuario_registro_nombre',
      key: 'usuario_registro_nombre',
      width: 170,
      render: (usr) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <UserOutlined style={{ color: '#94a3b8', fontSize: 12 }} />
          <span style={{ fontSize: 13, color: '#334155', fontWeight: 500 }}>
            {usr || 'Sistema'}
          </span>
        </div>
      ),
    },
    {
      title: 'Método de Pago',
      dataIndex: 'metodo_pago',
      key: 'metodo_pago',
      width: 145,
      render: (metodo) => {
        const conf = metodoPagoConfig[metodo] || { color: 'default', label: metodo || 'Efectivo', icon: '💵' };
        return (
          <Tag color={conf.color} style={{ borderRadius: 6, fontWeight: 600, padding: '2px 8px' }}>
            {conf.icon} {conf.label}
          </Tag>
        );
      },
    },
    {
      title: 'Pruebas',
      dataIndex: 'total_analisis',
      key: 'total_analisis',
      width: 80,
      align: 'center',
      render: (cnt) => (
        <Tag color="geekblue" style={{ borderRadius: 10, fontWeight: 600 }}>
          {cnt || 0}
        </Tag>
      ),
    },
    {
      title: 'Total Cobrado',
      dataIndex: 'monto',
      key: 'monto',
      width: 120,
      align: 'right',
      render: (monto) => (
        <span style={{ fontWeight: 700, color: '#059669', fontSize: 13 }}>
          {formatCurrency(monto || 0)}
        </span>
      ),
    },
  ];

  const exportColumns = [
    { title: 'Hora', dataIndex: 'fecha_hora' },
    { title: 'N° Atención', dataIndex: 'numero_atencion' },
    { title: 'DNI', dataIndex: 'paciente_dni' },
    { title: 'Paciente', dataIndex: 'paciente_nombre' },
    { title: 'Sede', dataIndex: 'sede_nombre' },
    { title: 'Cajero', dataIndex: 'usuario_registro_nombre' },
    { title: 'Método Pago', dataIndex: 'metodo_pago' },
    { title: 'Pruebas', dataIndex: 'total_analisis' },
    { title: 'Total S/', dataIndex: 'monto' },
  ];

  const handleExportExcel = () => {
    if (!reporte?.ordenes.length) return;
    exportToExcel(reporte.ordenes, exportColumns, `Cuadre_Caja_${fechaSeleccionada.format('YYYYMMDD')}`);
    message.success('Excel exportado exitosamente');
  };

  const handleExportPDF = () => {
    if (!reporte?.ordenes.length) return;
    const subtitulo = `Fecha: ${fechaSeleccionada.format('DD/MM/YYYY')} - Total Recaudado: ${formatCurrency(reporte.totales.total_recaudado)}`;
    exportToPDF(
      reporte.ordenes,
      exportColumns,
      `Cuadre_Caja_${fechaSeleccionada.format('YYYYMMDD')}`,
      'Arqueo y Cuadre de Caja Diaria',
      subtitulo
    );
    message.success('PDF exportado exitosamente');
  };

  const sedeActualNombre = useMemo(() => {
    if (!sedeId) return 'Todas las Sedes';
    return sedes?.find((s) => s.id === sedeId)?.nombre || 'Sede';
  }, [sedeId, sedes]);

  const cajeroActualNombre = useMemo(() => {
    if (!usuarioId) return 'Todos los Cajeros / Trabajadores';
    const u = usuarios?.find((usr: any) => usr.id === usuarioId);
    return u ? `${u.nombres || ''} ${u.apellidos || ''}`.trim() : 'Cajero';
  }, [usuarioId, usuarios]);

  const handlePrint = () => {
    if (!reporte) return;
    imprimirTicketCuadreCaja({
      reporte,
      fecha: fechaSeleccionada,
      sedeNombre: sedeActualNombre,
      cajeroNombre: cajeroActualNombre,
    });
  };

  if (!canAccess) {
    return (
      <Result
        status="403"
        icon={<LockOutlined />}
        title="Acceso Denegado"
        subTitle="No cuentas con permisos suficientes para consultar el cuadre de caja."
        extra={
          <Button
            type="primary"
            onClick={() => navigate('/reportes')}
            icon={<ArrowLeftOutlined />}
            style={{ borderRadius: 8 }}
          >
            Volver a Reportes
          </Button>
        }
      />
    );
  }

  return (
    <ModulePageLayout
      title="Cuadre de Caja Diaria"
      subtitle="Arqueo de ingresos por turno, control de efectivo físico vs cobros digitales y liquidación"
      actionButton={
        <Space size={10}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/reportes')}
            style={{
              height: 38,
              borderRadius: 8,
              fontWeight: 500,
              color: '#475569',
            }}
          >
            Volver
          </Button>
          <Button
            icon={<PrinterOutlined />}
            onClick={handlePrint}
            disabled={!reporte?.ordenes?.length}
            style={{
              height: 38,
              borderRadius: 8,
              fontWeight: 600,
              borderColor: '#0284c7',
              color: '#0284c7',
            }}
          >
            Imprimir Ticket
          </Button>
          <ExportButtons
            onExportExcel={handleExportExcel}
            onExportPDF={handleExportPDF}
            disabled={!reporte?.ordenes?.length}
          />
        </Space>
      }
      stats={
        <div>
          <Row gutter={[16, 16]}>
            {/* 1. Efectivo Físico */}
            <Col xs={24} sm={12} lg={6}>
              <div
                style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
                  border: '1px solid #bbf7d0',
                  borderRadius: 14,
                  padding: '18px 20px',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    boxShadow: '0 4px 10px rgba(16, 185, 129, 0.25)',
                    flexShrink: 0,
                  }}
                >
                  <DollarOutlined />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#047857', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Efectivo en Caja
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#065f46', lineHeight: 1.2 }}>
                    {formatCurrency(reporte?.totales.total_efectivo ?? 0)}
                  </div>
                  <div style={{ fontSize: 11, color: '#059669', marginTop: 2 }}>
                    Dinero físico en gaveta
                  </div>
                </div>
              </div>
            </Col>

            {/* 2. Cobros Digitales */}
            <Col xs={24} sm={12} lg={6}>
              <div
                style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #faf5ff 100%)',
                  border: '1px solid #e9d5ff',
                  borderRadius: 14,
                  padding: '18px 20px',
                  boxShadow: '0 2px 8px rgba(147, 51, 234, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    boxShadow: '0 4px 10px rgba(124, 58, 237, 0.25)',
                    flexShrink: 0,
                  }}
                >
                  <CreditCardOutlined />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Cobros Digitales
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#5b21b6', lineHeight: 1.2 }}>
                    {formatCurrency(reporte?.totales.total_digital ?? 0)}
                  </div>
                  <div style={{ fontSize: 11, color: '#7c3aed', marginTop: 2 }}>
                    Yape, Plin, POS y Bancos
                  </div>
                </div>
              </div>
            </Col>

            {/* 3. Gran Total Recaudado */}
            <Col xs={24} sm={12} lg={6}>
              <div
                style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)',
                  border: '1px solid #bae6fd',
                  borderRadius: 14,
                  padding: '18px 20px',
                  boxShadow: '0 2px 8px rgba(2, 132, 199, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    boxShadow: '0 4px 10px rgba(2, 132, 199, 0.25)',
                    flexShrink: 0,
                  }}
                >
                  <WalletOutlined />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0369a1', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Total Recaudado
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#0c4a6e', lineHeight: 1.2 }}>
                    {formatCurrency(reporte?.totales.total_recaudado ?? 0)}
                  </div>
                  <div style={{ fontSize: 11, color: '#0284c7', marginTop: 2 }}>
                    Venta bruta del período
                  </div>
                </div>
              </div>
            </Col>

            {/* 4. Total de Órdenes */}
            <Col xs={24} sm={12} lg={6}>
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 14,
                  padding: '18px 20px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: 'rgba(245, 158, 11, 0.12)',
                    color: '#d97706',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    flexShrink: 0,
                  }}
                >
                  <ShoppingOutlined />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Atenciones / Tickets
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                    {reporte?.totales.cantidad_ordenes ?? 0}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                    Ticket Prom: {formatCurrency(reporte?.totales.ticket_promedio ?? 0)}
                  </div>
                </div>
              </div>
            </Col>
          </Row>

          {/* Desglose por método de cobro */}
          {reporte?.desglose_metodos && reporte.desglose_metodos.length > 0 && (
            <div
              style={{
                marginTop: 14,
                padding: '14px 20px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                flexWrap: 'wrap',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              }}
            >
              <Text strong style={{ fontSize: 13, color: '#334155' }}>
                Desglose Detallado de Ingresos:
              </Text>
              {reporte.desglose_metodos.map((item) => {
                const conf = metodoPagoConfig[item.metodo] || { color: 'default', label: item.metodo, icon: '💵' };
                return (
                  <Tag
                    key={item.metodo}
                    color={conf.color}
                    style={{
                      borderRadius: 8,
                      padding: '6px 12px',
                      fontSize: 13,
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      margin: 0,
                    }}
                  >
                    <span>{conf.icon} {conf.label}:</span>
                    <span style={{ fontWeight: 800, fontSize: 14 }}>{formatCurrency(item.monto)}</span>
                    <span style={{ opacity: 0.85, fontSize: 11 }}>({item.cantidad} tickets)</span>
                  </Tag>
                );
              })}
            </div>
          )}
        </div>
      }
      filters={
        <Card
          style={{
            marginBottom: 20,
            borderRadius: 14,
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
            background: '#ffffff',
          }}
          styles={{ body: { padding: '16px 20px' } }}
        >
          <Row gutter={[16, 16]} align="bottom">
            <Col xs={24} sm={12} md={6}>
              <div style={{ marginBottom: 6 }}>
                <Text strong style={{ fontSize: 13, color: '#334155' }}>
                  <CalendarOutlined style={{ marginRight: 6, color: '#0284c7' }} />
                  Fecha de Caja
                </Text>
              </div>
              <DatePicker
                style={{ width: '100%', height: 38, borderRadius: 8 }}
                format="DD/MM/YYYY"
                value={fechaSeleccionada}
                onChange={(date) => {
                  if (date) setFechaSeleccionada(date);
                }}
                allowClear={false}
              />
            </Col>

            <Col xs={24} sm={12} md={6}>
              <div style={{ marginBottom: 6 }}>
                <Text strong style={{ fontSize: 13, color: '#334155' }}>
                  <ShopOutlined style={{ marginRight: 6, color: '#0284c7' }} />
                  Sede del Laboratorio
                </Text>
              </div>
              <Select
                style={{ width: '100%', height: 38 }}
                placeholder="Todas las sedes"
                allowClear
                loading={loadingSedes}
                value={sedeId}
                onChange={(val) => setSedeId(val)}
                options={sedes?.map((s) => ({ value: s.id, label: s.nombre }))}
              />
            </Col>

            <Col xs={24} sm={12} md={6}>
              <div style={{ marginBottom: 6 }}>
                <Text strong style={{ fontSize: 13, color: '#334155' }}>
                  <UserOutlined style={{ marginRight: 6, color: '#0284c7' }} />
                  Cajero / Atendido por
                </Text>
              </div>
              <Select
                style={{ width: '100%', height: 38 }}
                placeholder="Todos los cajeros"
                allowClear
                showSearch
                optionFilterProp="label"
                value={usuarioId}
                onChange={(val) => setUsuarioId(val)}
                options={usuarios?.map((u: any) => ({
                  value: u.id,
                  label: `${u.nombres || ''} ${u.apellidos || ''}`.trim() || u.email,
                }))}
              />
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button
                  onClick={handleHoy}
                  style={{
                    height: 38,
                    borderRadius: 8,
                    fontWeight: 600,
                    borderColor: '#0284c7',
                    color: '#0284c7',
                  }}
                >
                  Hoy
                </Button>
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={handleBuscar}
                  loading={loading}
                  style={{
                    height: 38,
                    borderRadius: 8,
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #0284c7 0%, #059669 100%)',
                    border: 'none',
                    boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)',
                  }}
                >
                  Consultar
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>
      }
    >
      <GlobalTable
        columns={columns}
        dataSource={reporte?.ordenes || []}
        rowKey="id"
        loading={loading}
        resourceName="pagos"
      />
    </ModulePageLayout>
  );
}
