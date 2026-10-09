import { useState, useEffect, useCallback, useMemo } from 'react';
import { Typography, Row, Col, message, Progress, Tag, Result, Button, Space } from 'antd';
import {
  ArrowLeftOutlined,
  TrophyOutlined,
  LockOutlined,
  ExperimentOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

import ModulePageLayout from '../../../../shared/components/ModulePageLayout';
import { GlobalTable } from '../../../../shared/components/GlobalTable';
import FiltrosReporte from '../components/FiltrosReporte';
import ExportButtons from '../components/ExportButtons';
import { usePermissions } from '../../../../shared/components/PermissionGuard';
import { getReporteAnalisisRanking } from '../api';
import { exportToExcel, exportToPDF } from '../utils/exportHelpers';
import type { FiltrosReporte as FiltrosType, AnalisisRanking, ReporteAnalisisRanking } from '../types';

const { Text } = Typography;

export default function ReporteAnalisisRankingPage() {
  const navigate = useNavigate();
  const { hasPermission, isSuperAdmin, isAdmin } = usePermissions();

  const canAccess =
    isSuperAdmin ||
    isAdmin ||
    hasPermission('reports.analisis.read') ||
    hasPermission('reports.read');

  // Inicializar con el mes en curso por defecto
  const [filtros, setFiltros] = useState<FiltrosType>({
    fecha_inicio: dayjs().startOf('month').format('YYYY-MM-DD'),
    fecha_fin: dayjs().endOf('month').format('YYYY-MM-DD'),
  });

  const [reporte, setReporte] = useState<ReporteAnalisisRanking | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchReporte = useCallback(async (paramsToSearch: FiltrosType) => {
    try {
      setLoading(true);
      const data = await getReporteAnalisisRanking(paramsToSearch);
      setReporte(data);
    } catch (error) {
      console.error('Error al generar ranking de análisis:', error);
      message.error('Error al generar el ranking de análisis');
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

  const topAnalisis = useMemo(() => {
    return reporte?.analisis?.[0] || null;
  }, [reporte]);

  const columns: ColumnsType<AnalisisRanking> = [
    {
      title: 'Posición',
      key: 'ranking',
      width: 90,
      align: 'center',
      render: (_, __, index) => {
        if (index === 0) {
          return (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '2px 8px',
                borderRadius: 12,
                background: '#fef9c3',
                color: '#854d0e',
                fontWeight: 700,
                fontSize: 12,
              }}
            >
              <TrophyOutlined style={{ color: '#ca8a04', fontSize: 14 }} /> 1°
            </div>
          );
        }
        if (index === 1) {
          return (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '2px 8px',
                borderRadius: 12,
                background: '#f1f5f9',
                color: '#475569',
                fontWeight: 700,
                fontSize: 12,
              }}
            >
              2°
            </div>
          );
        }
        if (index === 2) {
          return (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '2px 8px',
                borderRadius: 12,
                background: '#ffedd5',
                color: '#9a3412',
                fontWeight: 700,
                fontSize: 12,
              }}
            >
              3°
            </div>
          );
        }
        return (
          <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>
            {index + 1}°
          </span>
        );
      },
    },
    {
      title: 'Análisis Clínico',
      dataIndex: 'analisis_nombre',
      key: 'analisis_nombre',
      width: 280,
      render: (nombre) => (
        <span style={{ fontWeight: 600, color: '#0f172a', fontSize: 13 }}>
          {nombre}
        </span>
      ),
    },
    {
      title: 'Área de Laboratorio',
      dataIndex: 'area_nombre',
      key: 'area_nombre',
      width: 160,
      render: (area) => (
        <Tag color="cyan" style={{ borderRadius: 6, fontWeight: 500 }}>
          {area || 'General'}
        </Tag>
      ),
    },
    {
      title: 'Solicitudes',
      dataIndex: 'cantidad_solicitudes',
      key: 'cantidad_solicitudes',
      width: 120,
      align: 'center',
      sorter: (a, b) => b.cantidad_solicitudes - a.cantidad_solicitudes,
      render: (cant) => (
        <Tag
          color="blue"
          style={{
            borderRadius: 10,
            fontWeight: 700,
            fontSize: 13,
            padding: '2px 10px',
          }}
        >
          {cant}
        </Tag>
      ),
    },
    {
      title: 'Participación en Demanda',
      dataIndex: 'porcentaje',
      key: 'porcentaje',
      width: 240,
      render: (porcentaje) => {
        const pct = Math.round((porcentaje || 0) * 10) / 10;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Progress
              percent={pct}
              size="small"
              strokeColor={{
                '0%': '#7c3aed',
                '100%': '#2563eb',
              }}
              style={{ flex: 1, margin: 0 }}
            />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#475569', minWidth: 42 }}>
              {pct}%
            </span>
          </div>
        );
      },
    },
  ];

  const exportColumns = [
    { title: 'Ranking', dataIndex: 'ranking' },
    { title: 'Análisis', dataIndex: 'analisis_nombre' },
    { title: 'Área', dataIndex: 'area_nombre' },
    { title: 'Solicitudes', dataIndex: 'cantidad_solicitudes' },
    { title: 'Porcentaje (%)', dataIndex: 'porcentaje' },
  ];

  const handleExportExcel = () => {
    if (!reporte?.analisis.length) return;
    const dataWithRanking = reporte.analisis.map((a, i) => ({ ...a, ranking: i + 1 }));
    exportToExcel(dataWithRanking, exportColumns, 'Reporte_Analisis_Ranking');
    message.success('Excel exportado exitosamente');
  };

  const handleExportPDF = () => {
    if (!reporte?.analisis.length) return;
    const dataWithRanking = reporte.analisis.map((a, i) => ({ ...a, ranking: i + 1 }));
    const subtitulo =
      filtros.fecha_inicio && filtros.fecha_fin
        ? `Período: ${filtros.fecha_inicio} al ${filtros.fecha_fin}`
        : 'Todas las fechas';
    exportToPDF(
      dataWithRanking,
      exportColumns,
      'Reporte_Analisis_Ranking',
      'Análisis Más Solicitados',
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
        subTitle="No cuentas con permisos suficientes para consultar el ranking de análisis."
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
      title="Análisis Más Solicitados"
      subtitle="Ranking de demanda y volumen de pruebas solicitadas por período"
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
            disabled={!reporte?.analisis?.length}
          />
        </Space>
      }
      stats={
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
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
                  background: 'rgba(234, 179, 8, 0.12)',
                  color: '#ca8a04',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                }}
              >
                <TrophyOutlined />
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>
                  Análisis N° 1 del Período
                </div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: '#0f172a',
                    lineHeight: 1.3,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={topAnalisis?.analisis_nombre || 'Ninguno'}
                >
                  {topAnalisis ? topAnalisis.analisis_nombre : 'Sin solicitudes'}
                </div>
              </div>
            </div>
          </Col>

          <Col xs={12} sm={6} md={8}>
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
                  background: 'rgba(37, 99, 235, 0.1)',
                  color: '#2563eb',
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
                  Total Solicitudes
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                  {reporte?.total_solicitudes ?? 0}
                </div>
              </div>
            </div>
          </Col>

          <Col xs={12} sm={6} md={8}>
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
                <BarChartOutlined />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>
                  Pruebas en Ranking
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                  {reporte?.analisis?.length ?? 0}
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
          mostrarSede
        />
      }
    >
      <GlobalTable
        columns={columns}
        dataSource={reporte?.analisis || []}
        rowKey="analisis_id"
        loading={loading}
        resourceName="análisis"
        pagination={false}
      />
    </ModulePageLayout>
  );
}
