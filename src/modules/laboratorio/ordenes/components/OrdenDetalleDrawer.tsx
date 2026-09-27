import React from 'react';
import {
  Drawer,
  Button,
  Card,
  Descriptions,
  Space,
  Tag,
  Table,
  Typography,
  Spin,
  Alert,
  Avatar,
  Tabs,
  Tooltip,
  theme,
} from 'antd';
import {
  PrinterOutlined,
  FileTextOutlined,
  UserOutlined,
  MedicineBoxOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  PhoneOutlined,
  MailOutlined,
  RobotOutlined,
  EditOutlined,
  WhatsAppOutlined,
  FullscreenOutlined,
  ExperimentOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import { useOrdenDetalle, usePreanalitica } from '../hooks';
import { useAuthStore } from '../../../auth/hooks';
import {
  ESTADO_ORDEN_COLORS,
  ESTADO_ORDEN_LABELS,
  EstadoOrden,
  type OrdenAnalisis,
  type Orden,
} from '../types';

const { Text, Paragraph } = Typography;

interface OrdenDetalleDrawerProps {
  open: boolean;
  ordenId: number | null;
  onClose: () => void;
  onEditar?: (ordenId: number) => void;
  onRecepcionar?: (orden: Orden) => void;
  onWhatsApp?: (orden: Orden) => void;
}

export const OrdenDetalleDrawer: React.FC<OrdenDetalleDrawerProps> = ({
  open,
  ordenId,
  onClose,
  onEditar,
  onWhatsApp,
}) => {
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const { hasPermission, user } = useAuthStore();
  const isSuperAdmin = user?.rol_nombre === 'SUPER_ADMIN' || user?.rol_id === 1;
  const canUpdate = isSuperAdmin || hasPermission('orders.update');

  const validId = open && ordenId ? ordenId : 0;
  const { data: orden, isLoading, error } = useOrdenDetalle(validId, validId > 0 && hasPermission('orders.read'));
  const { data: preanaliticaIA, isLoading: loadingPreanalitica } = usePreanalitica(
    validId,
    validId > 0 && hasPermission('orders.read')
  );

  const textoPreanalitica = preanaliticaIA || orden?.condiciones_preanaliticas;

  const totalOrden =
    orden?.analisis?.reduce((sum, item) => sum + (Number(item.precio) || 0), 0) || 0;

  const columnsAnalisis: ColumnsType<OrdenAnalisis> = [
    {
      title: 'Código / Análisis',
      dataIndex: 'nombre',
      key: 'nombre',
      render: (_: unknown, record: OrdenAnalisis) => (
        <Space>
          <Avatar
            shape="square"
            size="small"
            style={{ backgroundColor: '#e0f2fe', color: '#0284c7', fontWeight: 700 }}
          >
            {record.nombre ? record.nombre.charAt(0) : 'A'}
          </Avatar>
          <div>
            <Text strong style={{ display: 'block', fontSize: 13 }}>
              {record.nombre}
            </Text>
            <Text type="secondary" style={{ fontSize: 11 }}>
              ID: {record.analisis_id}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Precio Unitario',
      dataIndex: 'precio',
      key: 'precio',
      width: 140,
      align: 'right',
      render: (precio: number) => (
        <Text strong style={{ color: '#0f172a' }}>
          S/ {(Number(precio) || 0).toFixed(2)}
        </Text>
      ),
    },
  ];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      destroyOnHidden
      width={Math.min(940, typeof window !== 'undefined' ? window.innerWidth * 0.95 : 940)}
      styles={{
        header: {
          padding: '16px 24px',
          borderBottom: '1px solid #e2e8f0',
          background: '#ffffff',
        },
        body: {
          padding: '20px 24px',
          background: '#f8fafc',
          overflowY: 'auto',
        },
        footer: {
          padding: '12px 24px',
          background: '#ffffff',
          borderTop: '1px solid #e2e8f0',
        },
      }}
      title={
        orden ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: 18,
                  boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)',
                }}
              >
                <ExperimentOutlined />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
                    Orden #{orden.numero_atencion}
                  </span>
                  <Tag
                    color={ESTADO_ORDEN_COLORS[orden.estado]}
                    style={{ borderRadius: 6, fontWeight: 700, fontSize: 12 }}
                  >
                    {ESTADO_ORDEN_LABELS[orden.estado]?.toUpperCase()}
                  </Tag>
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  <CalendarOutlined style={{ marginRight: 4 }} />
                  {dayjs(orden.fecha_registro).format('DD/MM/YYYY [a las] HH:mm')} • {orden.sede?.nombre}
                </div>
              </div>
            </div>

            <Tooltip title="Abrir en pantalla completa">
              <Button
                type="text"
                icon={<FullscreenOutlined style={{ fontSize: 16, color: '#64748b' }} />}
                onClick={() => {
                  onClose();
                  navigate(`/ordenes/${orden.id}`);
                }}
                style={{ marginRight: 16 }}
              />
            </Tooltip>
          </div>
        ) : (
          <span>Detalle de Orden</span>
        )
      }
      footer={
        orden && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Importe Total: <strong style={{ color: '#0284c7', fontSize: 16 }}>S/ {totalOrden.toFixed(2)}</strong>
              </Text>
            </div>

            <Space size="middle" wrap>
              {canUpdate && orden.estado === EstadoOrden.REGISTRADA && (
                <Button
                  icon={<EditOutlined />}
                  onClick={() => {
                    onClose();
                    onEditar?.(orden.id);
                  }}
                  style={{ borderRadius: 8, height: 36 }}
                >
                  Editar
                </Button>
              )}

              {hasPermission('orders.print') && (
                <Button
                  icon={<PrinterOutlined />}
                  onClick={() => navigate(`/ordenes/${orden.id}/imprimir`)}
                  style={{ borderRadius: 8, height: 36 }}
                >
                  Imprimir Comprobante
                </Button>
              )}

              {hasPermission('results.read') && (
                <Button
                  type="primary"
                  icon={<FileTextOutlined />}
                  onClick={() => navigate(`/resultados/orden/${orden.id}`)}
                  style={{
                    borderRadius: 8,
                    height: 36,
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    borderColor: '#0284c7',
                  }}
                >
                  Informe de Resultados
                </Button>
              )}

              {(orden.estado === EstadoOrden.APROBADA || orden.estado === EstadoOrden.IMPRESO) && (
                <Button
                  icon={<WhatsAppOutlined style={{ color: '#25D366' }} />}
                  onClick={() => {
                    onClose();
                    onWhatsApp?.(orden as unknown as Orden);
                  }}
                  style={{ borderRadius: 8, height: 36 }}
                >
                  WhatsApp
                </Button>
              )}
            </Space>
          </div>
        )
      }
    >
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: 350, gap: 12 }}>
          <Spin size="large" />
          <Text type="secondary" style={{ fontSize: 13 }}>Cargando expediente...</Text>
        </div>
      ) : error || !orden ? (
        <Alert
          message="No se encontró la orden"
          description="La orden solicitada no existe o no tiene permisos para visualizarla."
          type="error"
          showIcon
        />
      ) : (
        <Tabs
          defaultActiveKey="resumen"
          items={[
            {
              key: 'resumen',
              label: (
                <Space>
                  <UserOutlined />
                  <span>Resumen & Paciente</span>
                </Space>
              ),
              children: (
                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                  {/* Tarjeta Paciente */}
                    <Card
                      title={
                        <Space>
                          <UserOutlined style={{ color: '#0284c7' }} />
                          <span style={{ fontWeight: 600 }}>Ficha del Paciente</span>
                        </Space>
                      }
                      variant="borderless"
                      style={{ borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}
                    >
                    <Descriptions column={{ xs: 1, sm: 2 }} size="middle">
                      <Descriptions.Item label="Nombre Completo">
                        <Text strong>
                          {orden.paciente?.nombres} {orden.paciente?.apellido_paterno} {orden.paciente?.apellido_materno}
                        </Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="DNI / Documento">
                        <Tag color="blue" style={{ borderRadius: 4, fontWeight: 700 }}>
                          {orden.paciente?.dni}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Sexo">
                        <Tag color="cyan" style={{ borderRadius: 4 }}>
                          {orden.paciente?.genero === 'M' ? 'Masculino' : orden.paciente?.genero === 'F' ? 'Femenino' : '-'}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Fecha de Nacimiento">
                        {orden.paciente?.fecha_nacimiento
                          ? dayjs(orden.paciente.fecha_nacimiento).format('DD/MM/YYYY')
                          : '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Teléfono">
                        {orden.paciente?.telefono ? (
                          <Space>
                            <PhoneOutlined style={{ color: '#0284c7' }} />
                            {orden.paciente.telefono}
                          </Space>
                        ) : (
                          '-'
                        )}
                      </Descriptions.Item>
                      <Descriptions.Item label="Correo Electrónico">
                        {orden.paciente?.email ? (
                          <Space>
                            <MailOutlined style={{ color: '#0284c7' }} />
                            {orden.paciente.email}
                          </Space>
                        ) : (
                          '-'
                        )}
                      </Descriptions.Item>
                      <Descriptions.Item label="Dirección" span={2}>
                        {orden.paciente?.direccion || 'Sin dirección registrada'}
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>

                  {/* Tarjeta Administrativa */}
                  <Card
                    title={
                      <Space>
                        <MedicineBoxOutlined style={{ color: '#0284c7' }} />
                        <span style={{ fontWeight: 600 }}>Detalles Administrativos</span>
                      </Space>
                    }
                    variant="borderless"
                    style={{ borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}
                  >
                    <Descriptions column={{ xs: 1, sm: 2 }} size="middle">
                      <Descriptions.Item label="Sede de Atención">
                        <Text strong>{orden.sede?.nombre || '-'}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Tipo de Cliente">
                        <Tag color="blue">{orden.tipo_cliente?.nombre || '-'}</Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Convenio / Empresa">
                        {orden.convenio ? (
                          <Space>
                            <EnvironmentOutlined style={{ color: '#10b981' }} />
                            <Text strong>{orden.convenio.nombre_empresa}</Text>
                          </Space>
                        ) : (
                          <Tag color="default">PARTICULAR</Tag>
                        )}
                      </Descriptions.Item>
                      <Descriptions.Item label="Médico Referente">
                        <Text strong>{orden.medico || 'Sin médico registrado'}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Observaciones / Notas" span={2}>
                        <Paragraph
                          style={{
                            margin: 0,
                            color: orden.nota ? '#334155' : '#94a3b8',
                            fontStyle: orden.nota ? 'normal' : 'italic',
                          }}
                        >
                          {orden.nota || 'Ninguna observación especial registrada.'}
                        </Paragraph>
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                </Space>
              ),
            },
            {
              key: 'analisis',
              label: (
                <Space>
                  <ExperimentOutlined />
                  <span>Análisis Solicitados ({orden.analisis?.length || 0})</span>
                </Space>
              ),
              children: (
                <Card
                  variant="borderless"
                  style={{ borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}
                  styles={{ body: { padding: 0 } }}
                >
                  <Table
                    columns={columnsAnalisis}
                    dataSource={orden.analisis || []}
                    rowKey="id"
                    pagination={false}
                    summary={(pageData) => {
                      const total = pageData.reduce((acc, curr) => acc + (Number(curr.precio) || 0), 0);
                      return (
                        <Table.Summary.Row style={{ backgroundColor: '#f8fafc' }}>
                          <Table.Summary.Cell index={0}>
                            <Text strong>Importe Total Calculado</Text>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={1} align="right">
                            <Text strong style={{ color: '#0284c7', fontSize: 16 }}>
                              S/ {total.toFixed(2)}
                            </Text>
                          </Table.Summary.Cell>
                        </Table.Summary.Row>
                      );
                    }}
                  />
                </Card>
              ),
            },
            {
              key: 'preanalitica',
              label: (
                <Space>
                  <RobotOutlined />
                  <span>Condiciones Preanalíticas</span>
                </Space>
              ),
              children: (
                <Card
                  title={
                    <Space>
                      <RobotOutlined style={{ color: '#7c3aed' }} />
                      <span style={{ fontWeight: 600 }}>Trazabilidad y Recomendaciones Clínicas</span>
                    </Space>
                  }
                  variant="borderless"
                  style={{ borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}
                >
                  {loadingPreanalitica ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 0', gap: 8 }}>
                      <Spin />
                      <Text type="secondary" style={{ fontSize: 13 }}>Consultando recomendaciones pre-analíticas...</Text>
                    </div>
                  ) : textoPreanalitica ? (
                    <Alert
                      message="Condiciones para la Toma de Muestras"
                      description={<div style={{ whiteSpace: 'pre-line', marginTop: 8 }}>{textoPreanalitica}</div>}
                      type="info"
                      showIcon
                      icon={<RobotOutlined style={{ color: '#7c3aed', fontSize: 20 }} />}
                      style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 8 }}
                    />
                  ) : (
                    <Text type="secondary">
                      No se han generado condiciones preanalíticas específicas para esta orden.
                    </Text>
                  )}
                </Card>
              ),
            },
          ]}
        />
      )}
    </Drawer>
  );
};
