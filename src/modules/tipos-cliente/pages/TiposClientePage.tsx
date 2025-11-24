import { useState } from 'react';
import {
  Table,
  Button,
  Space,
  Typography,
  Input,
  Card,
  Row,
  Col,
  Modal,
  Switch,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { 
  useTiposCliente, 
  useCrearTipoCliente, 
  useActualizarTipoCliente, 
  useEliminarTipoCliente 
} from '../hooks';
import { TipoClienteFormModal } from '../components/TipoClienteFormModal';
import type { TipoCliente, TipoClienteFilters, CreateTipoClienteInput, UpdateTipoClienteInput } from '../types';

const { Title, Text } = Typography;

export const TiposClientePage: React.FC = () => {
  const [filtros, setFiltros] = useState<TipoClienteFilters>({
    page: 1,
    limit: 20,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [tipoClienteSeleccionado, setTipoClienteSeleccionado] = useState<TipoCliente | null>(null);

  const { data: tiposCliente, isLoading } = useTiposCliente(filtros);
  const crearTipoClienteMutation = useCrearTipoCliente();
  const actualizarTipoClienteMutation = useActualizarTipoCliente();
  const eliminarTipoClienteMutation = useEliminarTipoCliente();

  const handleFiltroChange = (key: keyof TipoClienteFilters, value: any) => {
    setFiltros((prev) => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const handlePaginationChange = (page: number, pageSize?: number) => {
    setFiltros((prev) => ({
      ...prev,
      page,
      limit: pageSize || prev.limit,
    }));
  };

  const handleNuevo = () => {
    setTipoClienteSeleccionado(null);
    setModalOpen(true);
  };

  const handleEditar = (tipoCliente: TipoCliente) => {
    setTipoClienteSeleccionado(tipoCliente);
    setModalOpen(true);
  };

  const handleEliminar = (tipoCliente: TipoCliente) => {
    Modal.confirm({
      title: '¿Está seguro de eliminar este tipo de cliente?',
      content: `Se eliminará el tipo "${tipoCliente.nombre}". Esta acción no se puede deshacer.`,
      okText: 'Eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        await eliminarTipoClienteMutation.mutateAsync(tipoCliente.id);
      },
    });
  };

  const handleToggleActivo = async (tipoCliente: TipoCliente) => {
    await actualizarTipoClienteMutation.mutateAsync({
      id: tipoCliente.id,
      data: { activo: !tipoCliente.activo },
    });
  };

  const handleSubmitForm = async (data: CreateTipoClienteInput | UpdateTipoClienteInput) => {
    if (tipoClienteSeleccionado) {
      await actualizarTipoClienteMutation.mutateAsync({
        id: tipoClienteSeleccionado.id,
        data: data as UpdateTipoClienteInput,
      });
    } else {
      await crearTipoClienteMutation.mutateAsync(data as CreateTipoClienteInput);
    }
    setModalOpen(false);
    setTipoClienteSeleccionado(null);
  };

  const columns: ColumnsType<TipoCliente> = [
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
      width: 300,
      render: (nombre: string) => <Text strong>{nombre}</Text>,
    },
    {
      title: 'Estado',
      dataIndex: 'activo',
      key: 'activo',
      width: 150,
      align: 'center',
      render: (activo: boolean, record: TipoCliente) => (
        <Switch
          checked={activo}
          onChange={() => handleToggleActivo(record)}
          checkedChildren="Activo"
          unCheckedChildren="Inactivo"
        />
      ),
    },
    {
      title: 'Fecha Creación',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (fecha: string) => dayjs(fecha).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 150,
      align: 'center',
      render: (_, record: TipoCliente) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditar(record)}
          />
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleEliminar(record)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ marginBottom: 8 }}>Tipos de Cliente</Title>
          <Text type="secondary">Clasificación de clientes (Particular, Convenio, etc.)</Text>
        </Col>
        <Col>
          <Button type="primary" size="large" icon={<PlusOutlined />} onClick={handleNuevo}>
            Nuevo Tipo
          </Button>
        </Col>
      </Row>

      {/* Filtros */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} md={12} lg={8}>
            <Input
              placeholder="Buscar por nombre..."
              prefix={<SearchOutlined />}
              allowClear
              value={filtros.search}
              onChange={(e) => handleFiltroChange('search', e.target.value)}
            />
          </Col>
        </Row>
      </Card>

      {/* Tabla */}
      <Card>
        <Table
          columns={columns}
          dataSource={tiposCliente || []}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 800 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} tipos de cliente`,
          }}
        />
      </Card>

      {/* Modal de formulario */}
      <TipoClienteFormModal
        open={modalOpen}
        tipoCliente={tipoClienteSeleccionado}
        onCancel={() => {
          setModalOpen(false);
          setTipoClienteSeleccionado(null);
        }}
        onSubmit={handleSubmitForm}
        loading={crearTipoClienteMutation.isPending || actualizarTipoClienteMutation.isPending}
      />
    </div>
  );
};
