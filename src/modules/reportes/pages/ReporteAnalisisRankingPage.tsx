import { useState } from 'react';
import { Table, Typography, Card, Row, Col, Statistic, message, Progress, Tag, Result, Button } from 'antd';
import { ArrowLeftOutlined, TrophyOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import PageContainer from '../../../shared/components/PageContainer';
import FiltrosReporte from '../components/FiltrosReporte';
import ExportButtons from '../components/ExportButtons';
import { useAuthStore } from '../../auth/hooks';
import { getReporteAnalisisRanking } from '../api';
import { exportToExcel, exportToPDF } from '../utils/exportHelpers';
import type { FiltrosReporte as FiltrosType, AnalisisRanking, ReporteAnalisisRanking } from '../types';

const { Title, Text } = Typography;

export default function ReporteAnalisisRankingPage() {
  const navigate = useNavigate();
  const { hasPermission } = useAuthStore();
  const [filtros, setFiltros] = useState<FiltrosType>({});
  const [reporte, setReporte] = useState<ReporteAnalisisRanking | null>(null);
  const [loading, setLoading] = useState(false);

  const handleBuscar = async () => {
    try {
      setLoading(true);
      const data = await getReporteAnalisisRanking(filtros);
      setReporte(data);
    } catch (error) {
      message.error('Error al generar el reporte');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLimpiar = () => {
    setFiltros({});
    setReporte(null);
  };

  const getMedalColor = (index: number) => {
    if (index === 0) return '#FFD700'; // Oro
    if (index === 1) return '#C0C0C0'; // Plata
    if (index === 2) return '#CD7F32'; // Bronce
    return undefined;
  };

  const columns: ColumnsType<AnalisisRanking> = [
    {
      title: '#',
      key: 'ranking',
      width: 60,
      align: 'center',
      render: (_, __, index) => {
        const medalColor = getMedalColor(index);
        return medalColor ? (
          <TrophyOutlined style={{ fontSize: 18, color: medalColor }} />
        ) : (
          <Text type="secondary">{index + 1}</Text>
        );
      },
    },
    {
      title: 'Análisis',
      dataIndex: 'analisis_nombre',
      key: 'analisis_nombre',
      width: 300,
    },
    {
      title: 'Área',
      dataIndex: 'area_nombre',
      key: 'area_nombre',
      width: 150,
      render: (area) => <Tag>{area}</Tag>,
    },
    {
      title: 'Solicitudes',
      dataIndex: 'cantidad_solicitudes',
      key: 'cantidad_solicitudes',
      width: 100,
      align: 'center',
      sorter: (a, b) => b.cantidad_solicitudes - a.cantidad_solicitudes,
    },
    {
      title: 'Porcentaje',
      dataIndex: 'porcentaje',
      key: 'porcentaje',
      width: 200,
      render: (porcentaje) => (
        <Progress
          percent={Math.round(porcentaje * 10) / 10}
          size="small"
          strokeColor="#722ed1"
        />
      ),
    },
  ];

  const exportColumns = [
    { title: 'Ranking', dataIndex: 'ranking' },
    { title: 'Análisis', dataIndex: 'analisis_nombre' },
    { title: 'Área', dataIndex: 'area_nombre' },
    { title: 'Solicitudes', dataIndex: 'cantidad_solicitudes' },
    { title: 'Porcentaje', dataIndex: 'porcentaje' },
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
    const subtitulo = filtros.fecha_inicio && filtros.fecha_fin
      ? `Período: ${filtros.fecha_inicio} al ${filtros.fecha_fin}`
      : 'Todas las fechas';
    exportToPDF(dataWithRanking, exportColumns, 'Reporte_Analisis_Ranking', 'Análisis Más Solicitados', subtitulo);
    message.success('PDF exportado exitosamente');
  };

  if (!hasPermission('orders.read')) {
    return (
      <Result
        status="403"
        icon={<LockOutlined />}
        title="Acceso Denegado"
        subTitle="No tienes permisos para ver este reporte."
        extra={
          <Button type="primary" onClick={() => navigate('/reportes')} icon={<ArrowLeftOutlined />}>
            Volver a Reportes
          </Button>
        }
      />
    );
  }

  return (
    <PageContainer>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
        <ArrowLeftOutlined 
          style={{ fontSize: 20, cursor: 'pointer' }} 
          onClick={() => navigate('/reportes')}
        />
        <div>
          <Title level={3} style={{ margin: 0 }}>
            Análisis Más Solicitados
          </Title>
          <Text type="secondary">
            Ranking de los análisis con mayor demanda en el período
          </Text>
        </div>
      </div>

      <FiltrosReporte
        filtros={filtros}
        onFiltrosChange={setFiltros}
        onBuscar={handleBuscar}
        onLimpiar={handleLimpiar}
        loading={loading}
      />

      {reporte && (
        <>
          {/* Resumen */}
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={12} sm={8}>
              <Card size="small">
                <Statistic
                  title="Análisis en Ranking"
                  value={reporte.analisis.length}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8}>
              <Card size="small">
                <Statistic
                  title="Total Solicitudes"
                  value={reporte.total_solicitudes}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            {reporte.analisis[0] && (
              <Col xs={24} sm={8}>
                <Card size="small">
                  <Statistic
                    title="Más Solicitado"
                    value={reporte.analisis[0].analisis_nombre}
                    valueStyle={{ fontSize: 14, color: '#52c41a' }}
                    prefix={<TrophyOutlined style={{ color: '#FFD700' }} />}
                  />
                </Card>
              </Col>
            )}
          </Row>

          {/* Tabla */}
          <Card
            title={`Top ${reporte.analisis.length} Análisis`}
            extra={
              hasPermission('orders.print') && (
                <ExportButtons
                  onExportExcel={handleExportExcel}
                  onExportPDF={handleExportPDF}
                  disabled={!reporte.analisis.length}
                />
              )
            }
          >
            <Table
              columns={columns}
              dataSource={reporte.analisis}
              rowKey="analisis_id"
              size="small"
              pagination={false}
            />
          </Card>
        </>
      )}
    </PageContainer>
  );
}
