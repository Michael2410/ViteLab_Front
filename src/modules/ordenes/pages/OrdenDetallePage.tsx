import { Button, Card, Descriptions, Space, Tag, Table, Typography, Spin, Alert, Modal, Select } from 'antd';
import {
  ArrowLeftOutlined,
  PrinterOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import { useOrdenDetalle, useActualizarEstadoOrden } from '../hooks';
import {
  EstadoOrden,
  ESTADO_ORDEN_COLORS,
  ESTADO_ORDEN_LABELS,
  SEXO_LABELS,
  type OrdenAnalisis,
} from '../types';
import { useState } from 'react';

const { Title, Text } = Typography;

export const OrdenDetallePage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const ordenId = id ? parseInt(id, 10) : 0;

  const [modalEstado, setModalEstado] = useState(false);
  const [nuevoEstado, setNuevoEstado] = useState<EstadoOrden | null>(null);

  const { data: orden, isLoading, error } = useOrdenDetalle(ordenId);
  const actualizarEstadoMutation = useActualizarEstadoOrden();

  const handleCambiarEstado = () => {
    setModalEstado(true);
    // Pre-seleccionar el siguiente estado lógico
    if (orden) {
      if (orden.estado === EstadoOrden.REGISTRADA) {
        setNuevoEstado(EstadoOrden.CON_RESULTADOS);
      } else if (orden.estado === EstadoOrden.CON_RESULTADOS) {
        setNuevoEstado(EstadoOrden.APROBADA);
      }
    }
  };

  const handleConfirmarCambioEstado = async () => {
    if (!nuevoEstado || !orden) return;

    await actualizarEstadoMutation.mutateAsync({
      id: orden.id,
      data: { estado: nuevoEstado },
    });

    setModalEstado(false);
    setNuevoEstado(null);
  };

  const columnsAnalisis: ColumnsType<OrdenAnalisis> = [
    {
      title: 'Código',
      dataIndex: ['analisis', 'codigo'],
      key: 'codigo',
      width: 120,
    },
    {
      title: 'Análisis',
      dataIndex: ['analisis', 'nombre'],
      key: 'nombre',
      render: (nombre: string, record: OrdenAnalisis) => (
        <Space direction="vertical" size={0}>
          <Text strong>{nombre}</Text>
          {record.analisis?.area_nombre && (
            <Text type="secondary">{record.analisis.area_nombre}</Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Método',
      dataIndex: ['analisis', 'metodo_nombre'],
      key: 'metodo',
      width: 180,
    },
    {
      title: 'Precio',
      dataIndex: 'precio',
      key: 'precio',
      width: 120,
      align: 'right',
      render: (precio: number) => <Text>S/ {precio.toFixed(2)}</Text>,
    },
  ];

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" tip="Cargando orden..." />
      </div>
    );
  }

  if (error || !orden) {
    return (
      <div>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/ordenes')}
          style={{ marginBottom: 16 }}
        >
          Volver
        </Button>
        <Alert
          message="Error"
          description="No se pudo cargar la información de la orden"
          type="error"
          showIcon
        />
      </div>
    );
  }

  // Determinar estados disponibles para cambio
  const estadosDisponibles = [];
  if (orden.estado === EstadoOrden.REGISTRADA) {
    estadosDisponibles.push(EstadoOrden.CON_RESULTADOS);
  }
  if (orden.estado === EstadoOrden.CON_RESULTADOS) {
    estadosDisponibles.push(EstadoOrden.APROBADA);
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/ordenes')}
          style={{ marginBottom: 16 }}
        >
          Volver
        </Button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={2}>Orden {orden.numero_orden}</Title>
            <Space size="middle">
              <Tag color={ESTADO_ORDEN_COLORS[orden.estado]} style={{ fontSize: '14px' }}>
                {ESTADO_ORDEN_LABELS[orden.estado]}
              </Tag>
              <Text type="secondary">
                Registrada: {dayjs(orden.fecha_registro).format('DD/MM/YYYY HH:mm')}
              </Text>
            </Space>
          </div>

          <Space>
            {estadosDisponibles.length > 0 && (
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={handleCambiarEstado}
                disabled={orden.estado === EstadoOrden.APROBADA}
              >
                Cambiar Estado
              </Button>
            )}
            <Button icon={<PrinterOutlined />}>Imprimir</Button>
          </Space>
        </div>
      </div>

      {/* Datos del Paciente */}
      <Card title="Datos del Paciente" style={{ marginBottom: 16 }}>
        <Descriptions column={{ xs: 1, sm: 2, md: 3 }}>
          <Descriptions.Item label="DNI">{orden.paciente.dni}</Descriptions.Item>
          <Descriptions.Item label="Nombres">{orden.paciente.nombres}</Descriptions.Item>
          <Descriptions.Item label="Apellidos">{orden.paciente.apellidos}</Descriptions.Item>
          <Descriptions.Item label="Fecha de Nacimiento">
            {dayjs(orden.paciente.fecha_nacimiento).format('DD/MM/YYYY')}
          </Descriptions.Item>
          <Descriptions.Item label="Edad">
            {dayjs().diff(dayjs(orden.paciente.fecha_nacimiento), 'years')} años
          </Descriptions.Item>
          <Descriptions.Item label="Sexo">
            {SEXO_LABELS[orden.paciente.sexo]}
          </Descriptions.Item>
          {orden.paciente.telefono && (
            <Descriptions.Item label="Teléfono">{orden.paciente.telefono}</Descriptions.Item>
          )}
          {orden.paciente.email && (
            <Descriptions.Item label="Email">{orden.paciente.email}</Descriptions.Item>
          )}
          {orden.paciente.direccion && (
            <Descriptions.Item label="Dirección" span={2}>
              {orden.paciente.direccion}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* Datos de la Orden */}
      <Card title="Información de la Orden" style={{ marginBottom: 16 }}>
        <Descriptions column={{ xs: 1, sm: 2, md: 3 }}>
          <Descriptions.Item label="Sede">{orden.sede.nombre}</Descriptions.Item>
          <Descriptions.Item label="Tipo de Cliente">
            {orden.tipo_cliente.nombre}
          </Descriptions.Item>
          <Descriptions.Item label="Convenio">
            {orden.convenio?.nombre || 'Sin convenio'}
          </Descriptions.Item>
          <Descriptions.Item label="Usuario Registro">
            {orden.usuario_registro?.nombre}
          </Descriptions.Item>
          {orden.fecha_resultados && (
            <>
              <Descriptions.Item label="Fecha Resultados">
                {dayjs(orden.fecha_resultados).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="Usuario Resultados">
                {orden.usuario_resultados?.nombre}
              </Descriptions.Item>
            </>
          )}
          {orden.fecha_aprobacion && (
            <>
              <Descriptions.Item label="Fecha Aprobación">
                {dayjs(orden.fecha_aprobacion).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="Usuario Aprobación">
                {orden.usuario_aprobacion?.nombre}
              </Descriptions.Item>
            </>
          )}
          {orden.observaciones && (
            <Descriptions.Item label="Observaciones" span={3}>
              {orden.observaciones}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* Análisis Solicitados */}
      <Card title="Análisis Solicitados" style={{ marginBottom: 16 }}>
        <Table
          columns={columnsAnalisis}
          dataSource={orden.analisis}
          rowKey="id"
          pagination={false}
          summary={(data) => {
            const total = data.reduce((sum, item) => sum + item.precio, 0);
            return (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={3} align="right">
                    <Text strong>TOTAL:</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="right">
                    <Text strong style={{ fontSize: '16px' }}>
                      S/ {total.toFixed(2)}
                    </Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            );
          }}
        />
      </Card>

      {/* Timeline de Estados */}
      <Card title="Historial de Estados">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Space>
              <ClockCircleOutlined style={{ color: '#1890ff' }} />
              <Text strong>Registrada</Text>
              <Text type="secondary">
                {dayjs(orden.fecha_registro).format('DD/MM/YYYY HH:mm')}
              </Text>
              <Text type="secondary">por {orden.usuario_registro?.nombre}</Text>
            </Space>
          </div>

          {orden.fecha_resultados && (
            <div>
              <Space>
                <ClockCircleOutlined style={{ color: '#fa8c16' }} />
                <Text strong>Con Resultados</Text>
                <Text type="secondary">
                  {dayjs(orden.fecha_resultados).format('DD/MM/YYYY HH:mm')}
                </Text>
                <Text type="secondary">por {orden.usuario_resultados?.nombre}</Text>
              </Space>
            </div>
          )}

          {orden.fecha_aprobacion && (
            <div>
              <Space>
                <CheckCircleOutlined style={{ color: '#52c41a' }} />
                <Text strong>Aprobada</Text>
                <Text type="secondary">
                  {dayjs(orden.fecha_aprobacion).format('DD/MM/YYYY HH:mm')}
                </Text>
                <Text type="secondary">por {orden.usuario_aprobacion?.nombre}</Text>
              </Space>
            </div>
          )}
        </Space>
      </Card>

      {/* Modal Cambiar Estado */}
      <Modal
        title="Cambiar Estado de Orden"
        open={modalEstado}
        onOk={handleConfirmarCambioEstado}
        onCancel={() => setModalEstado(false)}
        confirmLoading={actualizarEstadoMutation.isPending}
        okText="Confirmar"
        cancelText="Cancelar"
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Text>Estado actual: </Text>
            <Tag color={ESTADO_ORDEN_COLORS[orden.estado]}>
              {ESTADO_ORDEN_LABELS[orden.estado]}
            </Tag>
          </div>

          <div>
            <Text>Nuevo estado:</Text>
            <Select
              style={{ width: '100%', marginTop: 8 }}
              value={nuevoEstado}
              onChange={setNuevoEstado}
              options={estadosDisponibles.map((estado) => ({
                label: ESTADO_ORDEN_LABELS[estado as EstadoOrden],
                value: estado,
              }))}
            />
          </div>

          <Alert
            message="Nota"
            description="El cambio de estado quedará registrado con su usuario y fecha/hora actual."
            type="info"
            showIcon
          />
        </Space>
      </Modal>
    </div>
  );
};
