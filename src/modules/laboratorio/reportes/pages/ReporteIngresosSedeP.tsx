import { useState, useEffect, useCallback } from 'react';
import { Typography, Row, Col, message, Progress, Result, Button, Space } from 'antd';
import {
  ArrowLeftOutlined,
  BankOutlined,
  DollarOutlined,
  FileTextOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

import ModulePageLayout from '../../../../shared/components/ModulePageLayout';
import { GlobalTable } from '../../../../shared/components/GlobalTable';
import FiltrosReporte from '../components/FiltrosReporte';
import ExportButtons from '../components/ExportButtons';
import { usePermissions } from '../../../../shared/components/PermissionGuard';
import { getReporteIngresosSede } from '../api';
import { exportToExcel, exportToPDF, formatCurrency } from '../utils/exportHelpers';
import type { FiltrosReporte as FiltrosType, IngresoSede, ReporteIngresosSede } from '../types';

const { Text } = Typography;

export default function ReporteIngresosSedeP() {
  const navigate = useNavigate();
  const { hasPermission, isSuperAdmin, isAdmin } = usePermissions();

  const canAccess =
    isSuperAdmin ||
    isAdmin ||
    hasPermission('reports.ingresos.read') ||
    hasPermission('reports.read');

  const [filtros, setFiltros] = useState<FiltrosType>({
    fecha_inicio: dayjs().startOf('month').format('YYYY-MM-DD'),
    fecha_fin: dayjs().endOf('month').format('YYYY-MM-DD'),
  });

  const [reporte, setReporte] = useState<ReporteIngresosSede | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchReporte = useCallback(async (paramsToSearch: FiltrosType) => {
    try {
      setLoading(true);
      const data = await getReporteIngresosSede(paramsToSearch);
      setReporte(data);
    } catch (error) {
      console.error('Error al generar reporte de ingresos por sede:', error);
      message.error('Error al generar el reporte de ingresos');
    } finally {
      setLoading(false);
    }
  }, []);

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

  const maxMonto = reporte?.sedes.reduce((max, s) => Math.max(max, s.monto_total), 0) || 1;

  const columns: ColumnsType<IngresoSede> = [
    {
      title: 'Sede',
      dataIndex: 'sede_nombre',
      key: 'sede_nombre',
      width: 220,
      render: (nombre) => (
        <span style={{ fontWeight: 600, color: '#0f172a', fontSize: 13 }}>
          {nombre}
        </span>
      ),
    },
    {
      title: 'Órdenes Atendidas',
      dataIndex: 'cantidad_ordenes',
      key: 'cantidad_ordenes',
      width: 140,
      align: 'center',
      render: (cant) => (
        <span style={{ fontWeight: 700, color: '#0284c7' }}>
          {cant}
        </span>
      ),
    },
    {
      title: 'Monto Recaudado',
      dataIndex: 'monto_total',
      key: 'monto_total',
      width: 160,
      align: 'right',
      render: (monto) => (
        <span style={{ fontWeight: 700, color: '#059669', fontSize: 13 }}>
          {formatCurrency(monto || 0)}
        </span>
      ),
    },
    {
      title: 'Ticket Promedio',
      dataIndex: 'promedio_por_orden',
      key: 'promedio_por_orden',
      width: 140,
      align: 'right',
      render: (prom) => formatCurrency(prom || 0),
    },
    {
      title: 'Participación en Recaudación',
      key: 'participacion',
      width: 220,
      render: (_, record) => {
        const percent = Math.round((record.monto_total / maxMonto) * 100);
        return (
          <Progress
            percent={percent}
            size="small"
            strokeColor="#059669"
            format={() => `${percent}%`}
          />
        );
      },
    },
  ];

  const exportColumns = [
    { title: 'Sede', dataIndex: 'sede_nombre' },
    { title: 'Órdenes', dataIndex: 'cantidad_ordenes' },
    { title: 'Monto Total', dataIndex: 'monto_total' },
    { title: 'Promedio por Orden', dataIndex: 'promedio_por_orden' },
  ];

  const handleExportExcel = () => {
    if (!reporte?.sedes.length) return;
    exportToExcel(reporte.sedes, exportColumns, 'Reporte_Ingresos_Sede');
    message.success('Excel exportado exitosamente');
  };

  const handleExportPDF = () => {
    if (!reporte?.sedes.length) return;
    const subtitulo =
      filtros.fecha_inicio && filtros.fecha_fin
        ? `Período: ${filtros.fecha_inicio} al ${filtros.fecha_fin}`
        : 'Todas las fechas';
    exportToPDF(
      reporte.sedes,
      exportColumns,
      'Reporte_Ingresos_Sede',
      'Reporte de Ingresos por Sede',
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
        subTitle="No cuentas con permisos suficientes para consultar este reporte."
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
      title="Reporte de Ingresos por Sede"
      subtitle="Recaudación consolidada y volumen operativo distribuido por sedes"
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
            disabled={!reporte?.sedes?.length}
          />
        </Space>
      }
      stats={
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={8}>
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
                  background: 'rgba(5, 150, 105, 0.1)',
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
                  Total General Recaudado
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#059669', lineHeight: 1.2 }}>
                  {formatCurrency(reporte?.total_general.monto_total ?? 0)}
                </div>
              </div>
            </div>
          </Col>

          <Col xs={12} sm={8}>
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
                  {reporte?.total_general.cantidad_ordenes ?? 0}
                </div>
              </div>
            </div>
          </Col>

          <Col xs={24} sm={8}>
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
                  background: 'rgba(124, 58, 237, 0.1)',
                  color: '#7c3aed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                }}
              >
                <BankOutlined />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>
                  Sedes Activas con Actividad
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                  {reporte?.sedes?.length ?? 0}
                </div>
              </div>
            </div>
          </Col>
        </Row>
      }
      filters={
        <FiltrosReporte
          filtros={filtros}
          onFiltrosChange={setFiltros}
          onBuscar={handleBuscar}
          onLimpiar={handleLimpiar}
          loading={loading}
        />
      }
    >
      <GlobalTable
        columns={columns}
        dataSource={reporte?.sedes || []}
        rowKey="sede_id"
        loading={loading}
        resourceName="sedes"
        pagination={false}
      />
    </ModulePageLayout>
  );
}
