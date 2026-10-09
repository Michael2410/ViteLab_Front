import { useState, useEffect, useCallback } from 'react';
import { Typography, Row, Col, message, Result, Button, Space, Tag } from 'antd';
import {
  ArrowLeftOutlined,
  TeamOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ExperimentOutlined,
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
import { getReporteProductividad } from '../api';
import { exportToExcel, exportToPDF } from '../utils/exportHelpers';
import type { FiltrosReporte as FiltrosType, ProductividadUsuario, ReporteProductividad } from '../types';

const { Text } = Typography;

export default function ReporteProductividadPage() {
  const navigate = useNavigate();
  const { hasPermission, isSuperAdmin, isAdmin } = usePermissions();

  const canAccess =
    isSuperAdmin ||
    isAdmin ||
    hasPermission('reports.productividad.read') ||
    hasPermission('reports.read');

  const [filtros, setFiltros] = useState<FiltrosType>({
    fecha_inicio: dayjs().startOf('month').format('YYYY-MM-DD'),
    fecha_fin: dayjs().endOf('month').format('YYYY-MM-DD'),
  });

  const [reporte, setReporte] = useState<ReporteProductividad | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchReporte = useCallback(async (paramsToSearch: FiltrosType) => {
    try {
      setLoading(true);
      const data = await getReporteProductividad(paramsToSearch);
      setReporte(data);
    } catch (error) {
      console.error('Error al generar reporte de productividad:', error);
      message.error('Error al generar el reporte de productividad');
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

  const columns: ColumnsType<ProductividadUsuario> = [
    {
      title: 'Colaborador / Usuario',
      dataIndex: 'usuario_nombre',
      key: 'usuario_nombre',
      width: 250,
      render: (nombre) => (
        <span style={{ fontWeight: 600, color: '#0f172a', fontSize: 13 }}>
          {nombre}
        </span>
      ),
    },
    {
      title: 'Órdenes Registradas',
      dataIndex: 'ordenes_registradas',
      key: 'ordenes_registradas',
      width: 170,
      align: 'center',
      sorter: (a, b) => b.ordenes_registradas - a.ordenes_registradas,
      render: (cant) => (
        <Tag color="blue" style={{ borderRadius: 8, fontWeight: 700, fontSize: 13 }}>
          {cant}
        </Tag>
      ),
    },
    {
      title: 'Resultados Ingresados',
      dataIndex: 'resultados_ingresados',
      key: 'resultados_ingresados',
      width: 170,
      align: 'center',
      sorter: (a, b) => b.resultados_ingresados - a.resultados_ingresados,
      render: (cant) => (
        <Tag color="purple" style={{ borderRadius: 8, fontWeight: 700, fontSize: 13 }}>
          {cant}
        </Tag>
      ),
    },
    {
      title: 'Órdenes Validadas / Aprobadas',
      dataIndex: 'ordenes_aprobadas',
      key: 'ordenes_aprobadas',
      width: 200,
      align: 'center',
      sorter: (a, b) => b.ordenes_aprobadas - a.ordenes_aprobadas,
      render: (cant) => (
        <Tag color="green" style={{ borderRadius: 8, fontWeight: 700, fontSize: 13 }}>
          {cant}
        </Tag>
      ),
    },
  ];

  const exportColumns = [
    { title: 'Usuario', dataIndex: 'usuario_nombre' },
    { title: 'Órdenes Registradas', dataIndex: 'ordenes_registradas' },
    { title: 'Resultados Ingresados', dataIndex: 'resultados_ingresados' },
    { title: 'Órdenes Aprobadas', dataIndex: 'ordenes_aprobadas' },
  ];

  const handleExportExcel = () => {
    if (!reporte?.usuarios.length) return;
    exportToExcel(reporte.usuarios, exportColumns, 'Reporte_Productividad_Usuarios');
    message.success('Excel exportado exitosamente');
  };

  const handleExportPDF = () => {
    if (!reporte?.usuarios.length) return;
    const subtitulo =
      filtros.fecha_inicio && filtros.fecha_fin
        ? `Período: ${filtros.fecha_inicio} al ${filtros.fecha_fin}`
        : 'Todas las fechas';
    exportToPDF(
      reporte.usuarios,
      exportColumns,
      'Reporte_Productividad_Usuarios',
      'Reporte de Productividad por Usuario',
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
      title="Productividad de Personal"
      subtitle="Monitoreo de actividad operativa: órdenes creadas, resultados ingresados y validaciones"
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
            disabled={!reporte?.usuarios?.length}
          />
        </Space>
      }
      stats={
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
                  Total Órdenes Registradas
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                  {reporte?.totales.ordenes_registradas ?? 0}
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
                  background: 'rgba(124, 58, 237, 0.1)',
                  color: '#7c3aed',
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
                  Resultados Ingresados
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                  {reporte?.totales.resultados_ingresados ?? 0}
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
                  background: 'rgba(5, 150, 105, 0.1)',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                }}
              >
                <CheckCircleOutlined />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>
                  Órdenes Validadas
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#059669', lineHeight: 1.2 }}>
                  {reporte?.totales.ordenes_aprobadas ?? 0}
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
                  background: 'rgba(234, 88, 12, 0.1)',
                  color: '#ea580c',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                }}
              >
                <TeamOutlined />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>
                  Colaboradores Activos
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                  {reporte?.usuarios?.length ?? 0}
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
        dataSource={reporte?.usuarios || []}
        rowKey="usuario_id"
        loading={loading}
        resourceName="colaboradores"
        pagination={false}
      />
    </ModulePageLayout>
  );
}
