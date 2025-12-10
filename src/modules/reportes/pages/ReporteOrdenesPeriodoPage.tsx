import { useState } from 'react';
import { Table, Typography, Tag, Card, Row, Col, Statistic, message, Result, Button } from 'antd';
import { ArrowLeftOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import PageContainer from '../../../shared/components/PageContainer';
import FiltrosReporte from '../components/FiltrosReporte';
import ExportButtons from '../components/ExportButtons';
import { useAuthStore } from '../../auth/hooks';
import { getReporteOrdenesPeriodo } from '../api';
import { exportToExcel, exportToPDF, formatDateTime, formatCurrency } from '../utils/exportHelpers';
import type { FiltrosReporte as FiltrosType, OrdenReporte, ReporteOrdenesPeriodo } from '../types';

const { Title, Text } = Typography;

const estadoColors: Record<string, string> = {
  REGISTRADA: 'blue',
  MUESTRA_RECIBIDA: 'cyan',
  CON_RESULTADOS: 'purple',
  APROBADA: 'green',
  IMPRESO: 'default',
};

export default function ReporteOrdenesPeriodoPage() {
  const navigate = useNavigate();
  const { hasPermission } = useAuthStore();
  const [filtros, setFiltros] = useState<FiltrosType>({});
  const [reporte, setReporte] = useState<ReporteOrdenesPeriodo | null>(null);
  const [loading, setLoading] = useState(false);

  const handleBuscar = async () => {
    try {
      setLoading(true);
      const data = await getReporteOrdenesPeriodo(filtros);
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

  const columns: ColumnsType<OrdenReporte> = [
    {
      title: 'N° Atención',
      dataIndex: 'numero_atencion',
      key: 'numero_atencion',
      width: 120,
    },
    {
      title: 'Fecha',
      dataIndex: 'fecha_registro',
      key: 'fecha_registro',
      width: 150,
      render: (fecha) => formatDateTime(fecha),
    },
    {
      title: 'Paciente',
      key: 'paciente',
      width: 200,
      render: (_, record) => (
        <div>
          <Text strong>{record.paciente_apellidos}</Text>
          <br />
          <Text type="secondary">{record.paciente_nombres}</Text>
        </div>
      ),
    },
    {
      title: 'DNI',
      dataIndex: 'paciente_dni',
      key: 'paciente_dni',
      width: 100,
    },
    {
      title: 'Sede',
      dataIndex: 'sede_nombre',
      key: 'sede_nombre',
      width: 120,
    },
    {
      title: 'Tipo',
      dataIndex: 'tipo_paciente',
      key: 'tipo_paciente',
      width: 100,
      render: (tipo) => (
        <Tag color={tipo === 'CONVENIO' ? 'blue' : 'green'}>
          {tipo || 'PARTICULAR'}
        </Tag>
      ),
    },
    {
      title: 'Convenio',
      dataIndex: 'convenio_nombre',
      key: 'convenio_nombre',
      width: 120,
      render: (convenio) => convenio || '-',
    },
    {
      title: 'Análisis',
      dataIndex: 'total_analisis',
      key: 'total_analisis',
      width: 80,
      align: 'center',
    },
    {
      title: 'Monto',
      dataIndex: 'monto_total',
      key: 'monto_total',
      width: 100,
      align: 'right',
      render: (monto) => formatCurrency(monto || 0),
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      width: 130,
      render: (estado) => (
        <Tag color={estadoColors[estado] || 'default'}>
          {estado?.replace('_', ' ')}
        </Tag>
      ),
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
    const subtitulo = filtros.fecha_inicio && filtros.fecha_fin
      ? `Período: ${filtros.fecha_inicio} al ${filtros.fecha_fin}`
      : 'Todas las fechas';
    exportToPDF(reporte.ordenes, exportColumns, 'Reporte_Ordenes_Periodo', 'Reporte de Órdenes por Período', subtitulo);
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
            Reporte de Órdenes por Período
          </Title>
          <Text type="secondary">
            Listado detallado de órdenes con filtros por fecha, sede y estado
          </Text>
        </div>
      </div>

      <FiltrosReporte
        filtros={filtros}
        onFiltrosChange={setFiltros}
        onBuscar={handleBuscar}
        onLimpiar={handleLimpiar}
        loading={loading}
        mostrarEstado
        mostrarSede
      />

      {reporte && (
        <>
          {/* Resumen */}
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={12} sm={6}>
              <Card size="small">
                <Statistic
                  title="Total Órdenes"
                  value={reporte.totales.cantidad}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card size="small">
                <Statistic
                  title="Monto Total"
                  value={reporte.totales.monto_total}
                  precision={2}
                  prefix="S/"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12}>
              <Card size="small">
                <Text strong>Por Estado: </Text>
                {reporte.totales.por_estado.map((e, i) => (
                  <Tag key={i} color={estadoColors[e.estado]}>
                    {e.estado}: {e.cantidad}
                  </Tag>
                ))}
              </Card>
            </Col>
          </Row>

          {/* Tabla */}
          <Card
            title={`Resultados (${reporte.ordenes.length} registros)`}
            extra={
              hasPermission('orders.print') && (
                <ExportButtons
                  onExportExcel={handleExportExcel}
                  onExportPDF={handleExportPDF}
                  disabled={!reporte.ordenes.length}
                />
              )
            }
          >
            <Table
              columns={columns}
              dataSource={reporte.ordenes}
              rowKey="id"
              size="small"
              scroll={{ x: 1200 }}
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showTotal: (total) => `Total: ${total} registros`,
              }}
            />
          </Card>
        </>
      )}
    </PageContainer>
  );
}
