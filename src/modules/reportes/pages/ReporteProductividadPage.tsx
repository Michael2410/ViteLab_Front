import { useState } from 'react';
import { Table, Typography, Card, Row, Col, Statistic, message, Result, Button } from 'antd';
import { ArrowLeftOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import PageContainer from '../../../shared/components/PageContainer';
import FiltrosReporte from '../components/FiltrosReporte';
import ExportButtons from '../components/ExportButtons';
import { useAuthStore } from '../../auth/hooks';
import { getReporteProductividad } from '../api';
import { exportToExcel, exportToPDF } from '../utils/exportHelpers';
import type { FiltrosReporte as FiltrosType, ProductividadUsuario, ReporteProductividad } from '../types';

const { Title, Text } = Typography;

export default function ReporteProductividadPage() {
  const navigate = useNavigate();
  const { hasPermission } = useAuthStore();
  const [filtros, setFiltros] = useState<FiltrosType>({});
  const [reporte, setReporte] = useState<ReporteProductividad | null>(null);
  const [loading, setLoading] = useState(false);

  const handleBuscar = async () => {
    try {
      setLoading(true);
      const data = await getReporteProductividad(filtros);
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

  const columns: ColumnsType<ProductividadUsuario> = [
    {
      title: 'Usuario',
      dataIndex: 'usuario_nombre',
      key: 'usuario_nombre',
      width: 250,
    },
    {
      title: 'Órdenes Registradas',
      dataIndex: 'ordenes_registradas',
      key: 'ordenes_registradas',
      width: 150,
      align: 'center',
      sorter: (a, b) => a.ordenes_registradas - b.ordenes_registradas,
    },
    {
      title: 'Resultados Ingresados',
      dataIndex: 'resultados_ingresados',
      key: 'resultados_ingresados',
      width: 150,
      align: 'center',
      sorter: (a, b) => a.resultados_ingresados - b.resultados_ingresados,
    },
    {
      title: 'Órdenes Aprobadas',
      dataIndex: 'ordenes_aprobadas',
      key: 'ordenes_aprobadas',
      width: 150,
      align: 'center',
      sorter: (a, b) => a.ordenes_aprobadas - b.ordenes_aprobadas,
    },
    {
      title: 'Total Actividad',
      key: 'total',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <Text strong style={{ color: '#1890ff' }}>
          {record.ordenes_registradas + record.resultados_ingresados + record.ordenes_aprobadas}
        </Text>
      ),
      sorter: (a, b) => 
        (a.ordenes_registradas + a.resultados_ingresados + a.ordenes_aprobadas) -
        (b.ordenes_registradas + b.resultados_ingresados + b.ordenes_aprobadas),
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
    exportToExcel(reporte.usuarios, exportColumns, 'Reporte_Productividad');
    message.success('Excel exportado exitosamente');
  };

  const handleExportPDF = () => {
    if (!reporte?.usuarios.length) return;
    const subtitulo = filtros.fecha_inicio && filtros.fecha_fin
      ? `Período: ${filtros.fecha_inicio} al ${filtros.fecha_fin}`
      : 'Todas las fechas';
    exportToPDF(reporte.usuarios, exportColumns, 'Reporte_Productividad', 'Productividad por Usuario', subtitulo);
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
            Productividad por Usuario
          </Title>
          <Text type="secondary">
            Actividad de cada usuario: órdenes registradas, resultados y aprobaciones
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
            <Col xs={12} sm={6}>
              <Card size="small">
                <Statistic
                  title="Usuarios Activos"
                  value={reporte.usuarios.length}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card size="small">
                <Statistic
                  title="Órdenes Registradas"
                  value={reporte.totales.ordenes_registradas}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card size="small">
                <Statistic
                  title="Resultados Ingresados"
                  value={reporte.totales.resultados_ingresados}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card size="small">
                <Statistic
                  title="Órdenes Aprobadas"
                  value={reporte.totales.ordenes_aprobadas}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Tabla */}
          <Card
            title={`Resultados (${reporte.usuarios.length} usuarios)`}
            extra={
              hasPermission('orders.print') && (
                <ExportButtons
                  onExportExcel={handleExportExcel}
                  onExportPDF={handleExportPDF}
                  disabled={!reporte.usuarios.length}
                />
              )
            }
          >
            <Table
              columns={columns}
              dataSource={reporte.usuarios}
              rowKey="usuario_id"
              size="small"
              pagination={false}
              summary={() => (
                <Table.Summary fixed>
                  <Table.Summary.Row style={{ fontWeight: 'bold', background: '#fafafa' }}>
                    <Table.Summary.Cell index={0}>TOTAL</Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="center">
                      {reporte.totales.ordenes_registradas}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2} align="center">
                      {reporte.totales.resultados_ingresados}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3} align="center">
                      {reporte.totales.ordenes_aprobadas}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={4} align="center">
                      <Text strong style={{ color: '#1890ff' }}>
                        {reporte.totales.ordenes_registradas + 
                         reporte.totales.resultados_ingresados + 
                         reporte.totales.ordenes_aprobadas}
                      </Text>
                    </Table.Summary.Cell>
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
