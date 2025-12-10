import { useState } from 'react';
import { Table, Typography, Card, Row, Col, Statistic, message, Progress, Result, Button } from 'antd';
import { ArrowLeftOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import PageContainer from '../../../shared/components/PageContainer';
import FiltrosReporte from '../components/FiltrosReporte';
import ExportButtons from '../components/ExportButtons';
import { useAuthStore } from '../../auth/hooks';
import { getReporteIngresosSede } from '../api';
import { exportToExcel, exportToPDF, formatCurrency } from '../utils/exportHelpers';
import type { FiltrosReporte as FiltrosType, IngresoSede, ReporteIngresosSede } from '../types';

const { Title, Text } = Typography;

export default function ReporteIngresosSedeP() {
  const navigate = useNavigate();
  const { hasPermission } = useAuthStore();
  const [filtros, setFiltros] = useState<FiltrosType>({});
  const [reporte, setReporte] = useState<ReporteIngresosSede | null>(null);
  const [loading, setLoading] = useState(false);

  const handleBuscar = async () => {
    try {
      setLoading(true);
      const data = await getReporteIngresosSede(filtros);
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

  const maxMonto = reporte?.sedes.reduce((max, s) => Math.max(max, s.monto_total), 0) || 1;

  const columns: ColumnsType<IngresoSede> = [
    {
      title: 'Sede',
      dataIndex: 'sede_nombre',
      key: 'sede_nombre',
      width: 200,
    },
    {
      title: 'Órdenes',
      dataIndex: 'cantidad_ordenes',
      key: 'cantidad_ordenes',
      width: 100,
      align: 'center',
    },
    {
      title: 'Monto Total',
      dataIndex: 'monto_total',
      key: 'monto_total',
      width: 150,
      align: 'right',
      render: (monto) => formatCurrency(monto || 0),
    },
    {
      title: 'Promedio/Orden',
      dataIndex: 'promedio_por_orden',
      key: 'promedio_por_orden',
      width: 130,
      align: 'right',
      render: (promedio) => formatCurrency(promedio || 0),
    },
    {
      title: 'Distribución',
      key: 'distribucion',
      width: 200,
      render: (_, record) => (
        <Progress
          percent={Math.round((record.monto_total / maxMonto) * 100)}
          size="small"
          strokeColor="#52c41a"
          showInfo={false}
        />
      ),
    },
  ];

  const exportColumns = [
    { title: 'Sede', dataIndex: 'sede_nombre' },
    { title: 'Cantidad Órdenes', dataIndex: 'cantidad_ordenes' },
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
    const subtitulo = filtros.fecha_inicio && filtros.fecha_fin
      ? `Período: ${filtros.fecha_inicio} al ${filtros.fecha_fin}`
      : 'Todas las fechas';
    exportToPDF(reporte.sedes, exportColumns, 'Reporte_Ingresos_Sede', 'Reporte de Ingresos por Sede', subtitulo);
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
            Reporte de Ingresos por Sede
          </Title>
          <Text type="secondary">
            Órdenes y montos totales agrupados por cada sede
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
                  title="Total Sedes"
                  value={reporte.sedes.length}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8}>
              <Card size="small">
                <Statistic
                  title="Total Órdenes"
                  value={reporte.total_general.cantidad_ordenes}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card size="small">
                <Statistic
                  title="Monto Total"
                  value={reporte.total_general.monto_total}
                  precision={2}
                  prefix="S/"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Tabla */}
          <Card
            title={`Resultados (${reporte.sedes.length} sedes)`}
            extra={
              hasPermission('orders.print') && (
                <ExportButtons
                  onExportExcel={handleExportExcel}
                  onExportPDF={handleExportPDF}
                  disabled={!reporte.sedes.length}
                />
              )
            }
          >
            <Table
              columns={columns}
              dataSource={reporte.sedes}
              rowKey="sede_id"
              size="small"
              pagination={false}
              summary={() => (
                <Table.Summary fixed>
                  <Table.Summary.Row style={{ fontWeight: 'bold', background: '#fafafa' }}>
                    <Table.Summary.Cell index={0}>TOTAL</Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="center">
                      {reporte.total_general.cantidad_ordenes}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2} align="right">
                      {formatCurrency(reporte.total_general.monto_total)}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3} align="right">-</Table.Summary.Cell>
                    <Table.Summary.Cell index={4}>-</Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
          </Card>
        </>
      )}
    </PageContainer>
  );
}
