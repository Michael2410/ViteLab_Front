import { useState } from 'react';
import {
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Input,
  Select,
  DatePicker,
  Card,
  Row,
  Col,
  Modal,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  DeleteOutlined,
  SearchOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import { useOrdenes, useEliminarOrden, useSedesActivas } from '../hooks';
import {
  EstadoOrden,
  ESTADO_ORDEN_COLORS,
  ESTADO_ORDEN_LABELS,
  type Orden,
  type OrdenFilters,
} from '../types';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export const OrdenesPage: React.FC = () => {
  const navigate = useNavigate();
  const [filtros, setFiltros] = useState<OrdenFilters>({
    page: 1,
    limit: 20,
  });
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const { data: ordenes, isLoading } = useOrdenes(filtros);
  const { data: sedes } = useSedesActivas();
  const eliminarOrdenMutation = useEliminarOrden();

  const handleFiltroChange = (key: keyof OrdenFilters, value: any) => {
    setFiltros((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset page cuando cambian filtros
    }));
  };

  const handleLimpiarFiltros = () => {
    setFiltros({
      page: 1,
      limit: 20,
    });
  };

  const handleEliminar = (record: Orden) => {
    Modal.confirm({
      title: '¿Está seguro de eliminar esta orden?',
      content: `Se eliminará la orden ${record.numero_orden}. Esta acción no se puede deshacer.`,
      okText: 'Eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        await eliminarOrdenMutation.mutateAsync(record.id);
      },
    });
  };

  const handlePaginationChange = (page: number, pageSize?: number) => {
    setFiltros((prev) => ({
      ...prev,
      page,
      limit: pageSize || prev.limit,
    }));
  };

  const columns: ColumnsType<Orden> = [
    {
      title: 'N° Orden',
      dataIndex: 'numero_orden',
      key: 'numero_orden',
      width: 130,
      fixed: 'left',
      render: (numero: string) => <Text strong>{numero}</Text>,
    },
    {
      title: 'Fecha Registro',
      dataIndex: 'fecha_registro',
      key: 'fecha_registro',
      width: 120,
      render: (fecha: string) => dayjs(fecha).format('DD/MM/YYYY'),
    },
    {
      title: 'Paciente',
      key: 'paciente',
      width: 200,
      render: (_, record: any) => (
        <div>
          <div>
            <Text strong>{record.paciente_nombres}</Text>
          </div>
          <Text type="secondary">{record.paciente_dni}</Text>
        </div>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      width: 140,
      render: (estado: EstadoOrden) => (
        <Tag color={ESTADO_ORDEN_COLORS[estado]}>{ESTADO_ORDEN_LABELS[estado]}</Tag>
      ),
    },
    {
      title: 'Sede',
      dataIndex: 'sede_nombre',
      key: 'sede_nombre',
      width: 150,
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      width: 100,
      align: 'right',
      render: (total: number) => <Text strong>S/ {total.toFixed(2)}</Text>,
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Ver detalle">
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/ordenes/${record.id}`)}
            />
          </Tooltip>
          <Tooltip title="Eliminar">
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleEliminar(record)}
              disabled={record.estado !== EstadoOrden.REGISTRADA}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const filtrosActivos = Object.keys(filtros).filter(
    (key) =>
      key !== 'page' &&
      key !== 'limit' &&
      filtros[key as keyof OrdenFilters] !== undefined &&
      filtros[key as keyof OrdenFilters] !== ''
  ).length;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={2}>Órdenes de Atención</Title>
            <Text type="secondary">Gestión de órdenes de laboratorio</Text>
          </div>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => navigate('/ordenes/nueva')}
          >
            Nueva Orden
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {/* Barra de búsqueda rápida */}
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Input
                placeholder="Buscar por N° de orden..."
                prefix={<SearchOutlined />}
                allowClear
                value={filtros.numero_orden}
                onChange={(e) => handleFiltroChange('numero_orden', e.target.value)}
              />
            </Col>
            <Col xs={24} md={8}>
              <Input
                placeholder="Buscar por DNI del paciente..."
                prefix={<SearchOutlined />}
                allowClear
                maxLength={8}
                value={filtros.paciente_dni}
                onChange={(e) => handleFiltroChange('paciente_dni', e.target.value)}
              />
            </Col>
            <Col xs={24} md={8}>
              <Button
                icon={<FilterOutlined />}
                onClick={() => setMostrarFiltros(!mostrarFiltros)}
              >
                Filtros avanzados {filtrosActivos > 0 && `(${filtrosActivos})`}
              </Button>
              {filtrosActivos > 0 && (
                <Button type="link" onClick={handleLimpiarFiltros}>
                  Limpiar
                </Button>
              )}
            </Col>
          </Row>

          {/* Filtros avanzados */}
          {mostrarFiltros && (
            <Row gutter={16}>
              <Col xs={24} md={6}>
                <Select
                  placeholder="Filtrar por estado"
                  style={{ width: '100%' }}
                  allowClear
                  value={filtros.estado}
                  onChange={(value) => handleFiltroChange('estado', value)}
                  options={Object.values(EstadoOrden).map((estado) => ({
                    label: ESTADO_ORDEN_LABELS[estado],
                    value: estado,
                  }))}
                />
              </Col>
              <Col xs={24} md={6}>
                <Select
                  placeholder="Filtrar por sede"
                  style={{ width: '100%' }}
                  allowClear
                  value={filtros.sede_id}
                  onChange={(value) => handleFiltroChange('sede_id', value)}
                  options={sedes?.map((sede) => ({
                    label: sede.nombre,
                    value: sede.id,
                  }))}
                />
              </Col>
              <Col xs={24} md={12}>
                <RangePicker
                  style={{ width: '100%' }}
                  format="DD/MM/YYYY"
                  placeholder={['Fecha desde', 'Fecha hasta']}
                  value={
                    filtros.fecha_desde && filtros.fecha_hasta
                      ? [dayjs(filtros.fecha_desde), dayjs(filtros.fecha_hasta)]
                      : null
                  }
                  onChange={(dates) => {
                    if (dates) {
                      handleFiltroChange('fecha_desde', dates[0]?.format('YYYY-MM-DD'));
                      handleFiltroChange('fecha_hasta', dates[1]?.format('YYYY-MM-DD'));
                    } else {
                      handleFiltroChange('fecha_desde', undefined);
                      handleFiltroChange('fecha_hasta', undefined);
                    }
                  }}
                />
              </Col>
            </Row>
          )}
        </Space>
      </Card>

      {/* Tabla */}
      <Card>
        <Table
          columns={columns}
          dataSource={ordenes?.items || []}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 1200 }}
          pagination={{
            current: filtros.page,
            pageSize: filtros.limit,
            total: ordenes?.total || 0,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} órdenes`,
            onChange: handlePaginationChange,
          }}
        />
      </Card>
    </div>
  );
};
