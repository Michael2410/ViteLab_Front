import { useState, useEffect, useMemo, useCallback } from 'react';
import { Typography, Tag, Row, Col, message, Result, Button, Space } from 'antd';
import {
  ArrowLeftOutlined,
  LockOutlined,
  FileTextOutlined,
  DollarOutlined,
  ExperimentOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

import ModulePageLayout from '../../../../shared/components/ModulePageLayout';
import { GlobalTable } from '../../../../shared/components/GlobalTable';
import FiltrosReporte from '../components/FiltrosReporte';
import ExportButtons from '../components/ExportButtons';
import { usePermissions } from '../../../../shared/components/PermissionGuard';
import { getReporteOrdenesPeriodo } from '../api';
import { exportToExcel, exportToPDF, formatDateTime, formatCurrency } from '../utils/exportHelpers';
import type { FiltrosReporte as FiltrosType, OrdenReporte, ReporteOrdenesPeriodo } from '../types';

const { Text } = Typography;

const estadoConfig: Record<string, { color: string; label: string }> = {
  REGISTRADA: { color: 'blue', label: 'Registrada' },
  MUESTRA_RECIBIDA: { color: 'cyan', label: 'Muestra Recibida' },
  CON_RESULTADOS: { color: 'purple', label: 'Con Resultados' },
  APROBADA: { color: 'green', label: 'Aprobada' },
  IMPRESO: { color: 'default', label: 'Impreso' },
};

const metodoPagoConfig: Record<string, { color: string; label: string }> = {
  EFECTIVO: { color: 'green', label: '💵 Efectivo' },
  YAPE: { color: 'purple', label: '🟣 Yape' },
  PLIN: { color: 'cyan', label: '🔵 Plin' },
  TARJETA: { color: 'blue', label: '💳 Tarjeta / POS' },
  TRANSFERENCIA: { color: 'orange', label: '🏦 Transferencia' },
};

export default function ReporteOrdenesPeriodoPage() {
  const navigate = useNavigate();
  const { hasPermission, isSuperAdmin, isAdmin } = usePermissions();

  const canAccess =
    isSuperAdmin ||
    isAdmin ||
    hasPermission('reports.ordenes.read') ||
    hasPermission('reports.read');

  // Inicializar por defecto con el mes en curso
  const [filtros, setFiltros] = useState<FiltrosType>({
    fecha_inicio: dayjs().startOf('month').format('YYYY-MM-DD'),
    fecha_fin: dayjs().endOf('month').format('YYYY-MM-DD'),
  });

  const [reporte, setReporte] = useState<ReporteOrdenesPeriodo | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchReporte = useCallback(async (paramsToSearch: FiltrosType) => {
    try {
      setLoading(true);
      const data = await getReporteOrdenesPeriodo(paramsToSearch);
      setReporte(data);
    } catch (error) {
      console.error('Error al generar el reporte:', error);
      message.error('Error al generar el reporte de órdenes');
    } finally {
      setLoading(false);
    }
  }, []);

  // Carga inicial automática
  useEffect(() => {
    if (canAccess) {
      fetchReporte(filtros);
    }
  }, [canAccess, fetchReporte]);

  const handleBuscar = () => {
    fetchReporte(filtros);
  };

  const handleLimpiar = () => {
    const filtrosVacios: FiltrosType = {};
    setFiltros(filtrosVacios);
    fetchReporte(filtrosVacios);
  };

  const ticketPromedio = useMemo(() => {
    if (!reporte?.totales.cantidad || reporte.totales.cantidad === 0) return 0;
    return reporte.totales.monto_total / reporte.totales.cantidad;
  }, [reporte]);

  const totalAnalisisSum = useMemo(() => {
    if (!reporte?.ordenes) return 0;
    return reporte.ordenes.reduce((acc, o) => acc + (o.total_analisis || 0), 0);
  }, [reporte]);

  const columns: ColumnsType<OrdenReporte> = [
    {
      title: 'N° Atención',
      dataIndex: 'numero_atencion',
      key: 'numero_atencion',
      width: 110,
      render: (num) => (
        <span style={{ fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>
          #{num}
        </span>
      ),
    },
    {
      title: 'Fecha Registro',
      dataIndex: 'fecha_registro',
      key: 'fecha_registro',
      width: 145,
      render: (fecha) => (
        <Text style={{ fontSize: 13, color: '#475569' }}>
          {formatDateTime(fecha)}
        </Text>
      ),
    },
    {
      title: 'Paciente',
      key: 'paciente',
      width: 210,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0f172a' }}>
            {record.paciente_apellidos}
          </div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            {record.paciente_nombres}
          </div>
        </div>
      ),
    },
    {
      title: 'DNI / Doc',
      dataIndex: 'paciente_dni',
      key: 'paciente_dni',
      width: 105,
      render: (dni) => (
        <span style={{ fontSize: 12, fontWeight: 500, color: '#334155' }}>
          {dni || '-'}
        </span>
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
      title: 'Tipo / Convenio',
      key: 'tipo_convenio',
      width: 140,
      render: (_, record) => (
        record.tipo_paciente === 'CONVENIO' ? (
          <div>
            <Tag color="blue" style={{ borderRadius: 6, marginBottom: 2 }}>CONVENIO</Tag>
            <div style={{ fontSize: 11, color: '#64748b' }}>{record.convenio_nombre}</div>
          </div>
        ) : (
          <Tag color="green" style={{ borderRadius: 6 }}>PARTICULAR</Tag>
        )
      ),
    },
    {
      title: 'Método de Pago',
      dataIndex: 'metodo_pago',
      key: 'metodo_pago',
      width: 135,
      render: (metodo) => {
        const conf = metodoPagoConfig[metodo] || { color: 'default', label: metodo || 'Efectivo' };
        return (
          <Tag color={conf.color} style={{ borderRadius: 6, fontWeight: 600 }}>
            {conf.label}
          </Tag>
        );
      },
    },
    {
      title: 'Análisis',
      dataIndex: 'total_analisis',
      key: 'total_analisis',
      width: 85,
      align: 'center',
      render: (count) => (
        <Tag color="geekblue" style={{ borderRadius: 10, fontWeight: 600 }}>
          {count || 0}
        </Tag>
      ),
    },
    {
      title: 'Monto Total',
      dataIndex: 'monto_total',
      key: 'monto_total',
      width: 115,
      align: 'right',
      render: (monto) => (
        <span style={{ fontWeight: 700, color: '#059669', fontSize: 13 }}>
          {formatCurrency(monto || 0)}
        </span>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      width: 135,
      render: (estado) => {
        const conf = estadoConfig[estado] || { color: 'default', label: estado };
        return (
          <Tag color={conf.color} style={{ borderRadius: 6, fontWeight: 600 }}>
            {conf.label}
          </Tag>
        );
      },
    },
  ];

  const exportColumns = [
    { title: 'N° Atención', dataIndex: 'numero_atencion' },
    { title: 'Fecha', dataIndex: 'fecha_registro' },
    { title: 'DNI', dataIndex: 'paciente_dni' },
    { title: 'Paciente', dataIndex: 'paciente_apellidos' },
    { title: 'Nombres', dataIndex: 'paciente_nombres' },
    { title: 'Sede', dataIndex: 'sede_nombre' },
    { title: 'Tipo', dataIndex: 'tipo_paciente' },
    { title: 'Convenio', dataIndex: 'convenio_nombre' },
    { title: 'Método de Pago', dataIndex: 'metodo_pago' },
    { title: 'Análisis', dataIndex: 'total_analisis' },
    { title: 'Monto', dataIndex: 'monto_total' },
    { title: 'Estado', dataIndex: 'estado' },
  ];

  const handleExportExcel = () => {
    if (!reporte?.ordenes.length) return;
    exportToExcel(reporte.ordenes, exportColumns, 'Reporte_Ordenes_Periodo');
    message.success('Excel exportado exitosamente');
  };

  const handleExportPDF = () => {
    if (!reporte?.ordenes.length) return;
    const subtitulo =
      filtros.fecha_inicio && filtros.fecha_fin
        ? `Período: ${filtros.fecha_inicio} al ${filtros.fecha_fin}`
        : 'Todas las fechas';
    exportToPDF(
      reporte.ordenes,
      exportColumns,
      'Reporte_Ordenes_Periodo',
      'Reporte de Órdenes por Período',
      subtitulo
    );
    message.success('PDF exportado exitosamente');
  };

  if (!canAccess) {
    return (
      <Result
        status="403"
        icon={<LockOutlined />}
        title="Acceso Denegado"
        subTitle="No cuentas con permisos suficientes para consultar los reportes del laboratorio."
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
      title="Reporte de Órdenes por Período"
      subtitle="Auditoría, volumen de atenciones y recaudación por rango de fechas, sede, estado y método de pago"
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
            <Col xs={12} sm={6}>
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: 'rgba(2, 132, 199, 0.1)',
                    color: '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                  }}
                >
                  <FileTextOutlined />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>
                    Total Órdenes
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                    {reporte?.totales.cantidad ?? 0}
                  </div>
                </div>
              </div>
            </Col>

            <Col xs={12} sm={6}>
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: 'rgba(16, 185, 129, 0.1)',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                  }}
                >
                  <DollarOutlined />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>
                    Monto Recaudado
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#059669', lineHeight: 1.2 }}>
                    {formatCurrency(reporte?.totales.monto_total ?? 0)}
                  </div>
                </div>
              </div>
            </Col>

            <Col xs={12} sm={6}>
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: 'rgba(99, 102, 241, 0.1)',
                    color: '#6366f1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                  }}
                >
                  <ExperimentOutlined />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>
                    Análisis Solicitados
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                    {totalAnalisisSum}
                  </div>
                </div>
              </div>
            </Col>

            <Col xs={12} sm={6}>
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: 'rgba(245, 158, 11, 0.1)',
                    color: '#d97706',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                  }}
                >
                  <RiseOutlined />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>
                    Ticket Promedio
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                    {formatCurrency(ticketPromedio)}
                  </div>
                </div>
              </div>
            </Col>
          </Row>

          {/* Desglose interactivo por método de pago */}
          {reporte?.totales.por_metodo_pago && reporte.totales.por_metodo_pago.length > 0 && (
            <div
              style={{
                marginTop: 12,
                padding: '10px 16px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              <Text strong style={{ fontSize: 13, color: '#475569' }}>
                Recaudación por Método:
              </Text>
              {reporte.totales.por_metodo_pago.map((item) => {
                const conf = metodoPagoConfig[item.metodo] || { color: 'default', label: item.metodo };
                return (
                  <Tag
                    key={item.metodo}
                    color={conf.color}
                    style={{
                      borderRadius: 6,
                      padding: '4px 10px',
                      fontSize: 12,
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      margin: 0,
                    }}
                  >
                    <span>{conf.label}:</span>
                    <span style={{ fontWeight: 700 }}>{formatCurrency(item.monto)}</span>
                    <span style={{ opacity: 0.8, fontSize: 11 }}>({item.cantidad} ord.)</span>
                  </Tag>
                );
              })}
            </div>
          )}
        </div>
      }
      filters={
        <FiltrosReporte
          filtros={filtros}
          onFiltrosChange={setFiltros}
          onBuscar={handleBuscar}
          onLimpiar={handleLimpiar}
          loading={loading}
          mostrarEstado
          mostrarSede
          mostrarMetodoPago
        />
      }
    >
      <GlobalTable
        columns={columns}
        dataSource={reporte?.ordenes || []}
        rowKey="id"
        loading={loading}
        resourceName="órdenes"
      />
    </ModulePageLayout>
  );
}
