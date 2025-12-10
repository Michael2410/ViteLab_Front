import { 
  Button, 
  Card, 
  Descriptions, 
  Space, 
  Tag, 
  Table, 
  Typography, 
  Spin, 
  Alert, 
  Row, 
  Col, 
  Avatar, 
  Divider, 
  Statistic,
  Timeline,
  theme,
  Result,
} from 'antd';
import {
  ArrowLeftOutlined,
  PrinterOutlined,
  FileSearchOutlined,
  UserOutlined,
  MedicineBoxOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  PhoneOutlined,
  MailOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import { useOrdenDetalle } from '../hooks';
import { useAuthStore } from '../../auth/hooks';
import {
  ESTADO_ORDEN_COLORS,
  ESTADO_ORDEN_LABELS,
  SEXO_LABELS,
  type OrdenAnalisis,
} from '../types';

const { Title, Text, Paragraph } = Typography;

export const OrdenDetallePage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const ordenId = id ? parseInt(id, 10) : 0;
  const { token } = theme.useToken();
  const { hasPermission } = useAuthStore();

  const { data: orden, isLoading, error } = useOrdenDetalle(ordenId, {
    enabled: hasPermission('orders.read'),
  });

  // Columnas de la tabla
  const columnsAnalisis: ColumnsType<OrdenAnalisis> = [
    {
      title: 'Código / Análisis',
      dataIndex: 'nombre',
      key: 'nombre',
      render: (_: unknown, record: OrdenAnalisis) => (
        <Space>
           <Avatar shape="square" size="small" style={{ backgroundColor: token.colorPrimaryBg, color: token.colorPrimary }}>
              {record.nombre ? record.nombre.charAt(0) : 'A'}
           </Avatar>
           <div>
             <Text strong style={{ display: 'block' }}>{record.nombre}</Text>
             <Text type="secondary" style={{ fontSize: 11 }}>ID: {record.analisis_id}</Text>
           </div>
        </Space>
      ),
    },
    {
      title: 'Precio Unitario',
      dataIndex: 'precio',
      key: 'precio',
      width: 150,
      align: 'right',
      render: (precio: number) => (
        <Text strong>S/ {(Number(precio) || 0).toFixed(2)}</Text>
      ),
    },
  ];

  if (!hasPermission('orders.read')) {
    return (
      <Result
        status="403"
        icon={<LockOutlined />}
        title="Acceso Denegado"
        subTitle="No tienes permisos para ver el detalle de las órdenes."
        extra={
          <Button type="primary" onClick={() => navigate('/ordenes')} icon={<ArrowLeftOutlined />}>
            Volver al listado
          </Button>
        }
      />
    );
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" tip="Cargando expediente..." />
      </div>
    );
  }

  if (error || !orden) {
    return (
      <div style={{ padding: 40 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/ordenes')} style={{ marginBottom: 16 }}>
          Volver
        </Button>
        <Alert
          message="No se encontró la orden"
          description="La orden solicitada no existe o ha sido eliminada."
          type="error"
          showIcon
        />
      </div>
    );
  }

  // Cálculo del total
  const totalOrden = orden.analisis.reduce((sum, item) => sum + (Number(item.precio) || 0), 0);

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', paddingBottom: 40 }}>
      
      {/* 1. Header de Página */}
      <div style={{ marginBottom: 24 }}>
        <Button 
          type="text" 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/ordenes')} 
          style={{ paddingLeft: 0, color: token.colorTextSecondary }}
        >
          Volver al listado
        </Button>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 8, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <Space align="center">
                <Title level={2} style={{ margin: 0 }}>Orden #{orden.numero_atencion}</Title>
                <Tag color={ESTADO_ORDEN_COLORS[orden.estado]} style={{ fontSize: 14, padding: '4px 10px', borderRadius: 4 }}>
                    {ESTADO_ORDEN_LABELS[orden.estado].toUpperCase()}
                </Tag>
            </Space>
            <div style={{ marginTop: 4 }}>
                <Text type="secondary">
                    <CalendarOutlined /> Registrada el {dayjs(orden.fecha_registro).format('DD [de] MMMM, YYYY [a las] HH:mm')}
                </Text>
            </div>
          </div>

          <Space>
            {hasPermission('orders.print') && (
              <Button
                icon={<PrinterOutlined />}
                onClick={() => navigate(`/ordenes/${orden.id}/imprimir`)}
              >
                Imprimir Orden
              </Button>

            )}
            {hasPermission('results.read') && (
              <Button 
                type="primary"
                icon={<FileSearchOutlined />}
                onClick={() => navigate(`/resultados/orden/${orden.id}`)}
                style={{ boxShadow: `0 4px 14px ${token.colorPrimary}40` }}
              >
                Gestionar Resultados
              </Button>
            )}
          </Space>
        </div>
      </div>

      <Row gutter={24}>
        {/* COLUMNA IZQUIERDA (Principal) */}
        <Col xs={24} lg={16}>
            
            {/* Tarjeta de Información Administrativa */}
            <Card 
                title={<Space><MedicineBoxOutlined /> Detalles Administrativos</Space>}
                bordered={false}
                style={{ borderRadius: token.borderRadiusLG, boxShadow: '0 4px 12px rgba(0,0,0,0.03)', marginBottom: 24 }}
            >
                <Descriptions column={{ xs: 1, sm: 2 }} labelStyle={{ color: token.colorTextSecondary }}>
                    <Descriptions.Item label="Sede de Atención">
                        <Text strong>{orden.sede.nombre}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Tipo de Cliente">
                        <Tag color="blue">{orden.tipo_cliente.nombre}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Convenio / Empresa">
                        {orden.convenio ? (
                            <Space>
                                <Avatar size="small" shape="square" src={null} icon={<EnvironmentOutlined />} />
                                {orden.convenio.nombre_empresa}
                            </Space>
                        ) : (
                            <Text type="secondary" italic>Tarifa Particular</Text>
                        )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Médico Referente">
                        {orden.medico || <Text type="secondary">No especificado</Text>}
                    </Descriptions.Item>
                    {orden.nota && (
                         <Descriptions.Item label="Notas" span={2}>
                            <Alert message={orden.nota} type="warning" showIcon style={{ border: 0 }} />
                         </Descriptions.Item>
                    )}
                </Descriptions>
            </Card>

            {/* Tarjeta de Análisis (Tabla) */}
            <Card 
                title={<Space><FileSearchOutlined /> Análisis Solicitados</Space>}
                bordered={false}
                style={{ borderRadius: token.borderRadiusLG, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
                bodyStyle={{ padding: 0 }} // Tabla a sangre
            >
                <Table
                    columns={columnsAnalisis}
                    dataSource={orden.analisis}
                    rowKey="id"
                    pagination={false}
                    bordered={false}
                />
                
                {/* Footer de Totales */}
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'flex-end', 
                    padding: 24, 
                    backgroundColor: token.colorBgLayout,
                    borderBottomLeftRadius: token.borderRadiusLG,
                    borderBottomRightRadius: token.borderRadiusLG 
                }}>
                    <Space size="large" align="center">
                        <Text type="secondary">Cantidad: {orden.analisis.length} ítems</Text>
                        <Divider type="vertical" style={{ height: 24 }} />
                        <Statistic 
                            title="Monto Total" 
                            value={totalOrden} 
                            precision={2} 
                            prefix="S/" 
                            valueStyle={{ color: token.colorPrimary, fontWeight: 700 }}
                        />
                    </Space>
                </div>
            </Card>
        </Col>

        {/* COLUMNA DERECHA (Sidebar) */}
        <Col xs={24} lg={8}>
            
            {/* Tarjeta de Paciente (Estilo Perfil) */}
            <Card 
                bordered={false}
                style={{ 
                    borderRadius: token.borderRadiusLG, 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)', 
                    marginBottom: 24,
                    textAlign: 'center'
                }}
            >
                <Avatar 
                    size={80} 
                    style={{ backgroundColor: token.colorPrimaryBg, color: token.colorPrimary, fontSize: 32, marginBottom: 16 }}
                >
                    {orden.paciente.nombres.charAt(0)}
                </Avatar>
                <Title level={4} style={{ margin: 0 }}>
                    {orden.paciente.nombres} {orden.paciente.apellido_paterno}
                </Title>
                <Text type="secondary">{orden.paciente.dni}</Text>

                <Divider style={{ margin: '16px 0' }} />

                <div style={{ textAlign: 'left' }}>
                    <Row gutter={[16, 16]}>
                        <Col span={12}>
                            <Statistic title="Edad" value={dayjs().diff(dayjs(orden.paciente.fecha_nacimiento), 'years')} suffix="años" valueStyle={{ fontSize: 16 }} />
                        </Col>
                        <Col span={12}>
                            <Statistic title="Sexo" value={SEXO_LABELS[orden.paciente.genero]} valueStyle={{ fontSize: 16 }} />
                        </Col>
                    </Row>
                    
                    <div style={{ marginTop: 24 }}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                            {orden.paciente.telefono && (
                                <Space><PhoneOutlined style={{ color: token.colorTextSecondary }} /> {orden.paciente.telefono}</Space>
                            )}
                            {orden.paciente.email && (
                                <Space><MailOutlined style={{ color: token.colorTextSecondary }} /> <Text ellipsis>{orden.paciente.email}</Text></Space>
                            )}
                            {orden.paciente.direccion && (
                                <Space align="start">
                                    <EnvironmentOutlined style={{ color: token.colorTextSecondary, marginTop: 4 }} /> 
                                    <Text style={{ fontSize: 13 }}>{orden.paciente.direccion}</Text>
                                </Space>
                            )}
                        </Space>
                    </div>
                </div>
            </Card>

            {/* Tarjeta de Línea de Tiempo */}
            <Card 
                title="Historial de Estado" 
                bordered={false}
                style={{ borderRadius: token.borderRadiusLG, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
            >
                <Timeline
                    items={[
                        {
                            color: 'blue',
                            dot: <ClockCircleOutlined />,
                            children: (
                                <>
                                    <Text strong>Orden Registrada</Text><br/>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        {dayjs(orden.fecha_registro).format('DD MMM YYYY - HH:mm')}
                                    </Text><br/>
                                    <Tag style={{ marginTop: 4 }}>
                                        <UserOutlined /> {orden.usuario_registro?.nombres}
                                    </Tag>
                                </>
                            ),
                        },
                        orden.fecha_aprobacion ? {
                            color: 'green',
                            dot: <CheckCircleOutlined />,
                            children: (
                                <>
                                    <Text strong>Orden Aprobada</Text><br/>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        {dayjs(orden.fecha_aprobacion).format('DD MMM YYYY - HH:mm')}
                                    </Text><br/>
                                    <Tag color="success" style={{ marginTop: 4 }}>
                                        <UserOutlined /> {orden.usuario_aprobacion?.nombres}
                                    </Tag>
                                </>
                            ),
                        } : {
                            color: 'gray',
                            dot: <SyncOutlined spin />,
                            children: <Text type="secondary">Esperando aprobación...</Text>
                        }
                    ]}
                />
            </Card>
        </Col>
      </Row>
    </div>
  );
};