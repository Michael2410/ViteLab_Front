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
import { useMetodos, useCrearMetodo, useActualizarMetodo, useEliminarMetodo } from '../hooks';
import { MetodoFormModal } from '../components/MetodoFormModal';
import type { Metodo, MetodoFilters, CreateMetodoInput, UpdateMetodoInput } from '../types';

const { Title, Text } = Typography;

export const MetodosPage: React.FC = () => {
  const [filtros, setFiltros] = useState<MetodoFilters>({
    page: 1,
    limit: 20,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [metodoSeleccionado, setMetodoSeleccionado] = useState<Metodo | null>(null);

  const { data: metodos, isLoading } = useMetodos(filtros);
  const crearMetodoMutation = useCrearMetodo();
  const actualizarMetodoMutation = useActualizarMetodo();
  const eliminarMetodoMutation = useEliminarMetodo();

  const handleFiltroChange = (key: keyof MetodoFilters, value: any) => {
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
    setMetodoSeleccionado(null);
    setModalOpen(true);
  };

  const handleEditar = (metodo: Metodo) => {
    setMetodoSeleccionado(metodo);
    setModalOpen(true);
  };

  const handleEliminar = (metodo: Metodo) => {
    Modal.confirm({
      title: '¿Está seguro de eliminar este método?',
      content: `Se eliminará el método "${metodo.nombre}". Esta acción no se puede deshacer.`,
      okText: 'Eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        await eliminarMetodoMutation.mutateAsync(metodo.id);
      },
    });
  };

  const handleToggleActivo = async (metodo: Metodo) => {
    await actualizarMetodoMutation.mutateAsync({
      id: metodo.id,
      data: { activo: !metodo.activo },
    });
  };

  const handleSubmitForm = async (data: CreateMetodoInput | UpdateMetodoInput) => {
    if (metodoSeleccionado) {
      await actualizarMetodoMutation.mutateAsync({
        id: metodoSeleccionado.id,
        data: data as UpdateMetodoInput,
      });
    } else {
      await crearMetodoMutation.mutateAsync(data as CreateMetodoInput);
    }
    setModalOpen(false);
    setMetodoSeleccionado(null);
  };

  const columns: ColumnsType<Metodo> = [
    {
      title: 'Código',
      dataIndex: 'codigo',
      key: 'codigo',
      width: 120,
      render: (codigo: string) => <Text strong>{codigo}</Text>,
    },
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
      width: 250,
    },
    {
      title: 'Descripción',
      dataIndex: 'descripcion',
      key: 'descripcion',
      ellipsis: true,
      render: (descripcion: string) => descripcion || '-',
    },
    {
      title: 'Estado',
      dataIndex: 'activo',
      key: 'activo',
      width: 120,
      align: 'center',
      render: (activo: boolean, record: Metodo) => (
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
      width: 150,
      render: (fecha: string) => dayjs(fecha).format('DD/MM/YYYY'),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 120,
      align: 'center',
      render: (_, record: Metodo) => (
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
          <Title level={2} style={{ marginBottom: 8 }}>Métodos de Análisis</Title>
          <Text type="secondary">Gestión de métodos para clasificación de análisis</Text>
        </Col>
        <Col>
          <Button type="primary" size="large" icon={<PlusOutlined />} onClick={handleNuevo}>
            Nuevo Método
          </Button>
        </Col>
      </Row>

      {/* Filtros */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} md={12} lg={8}>
            <Input
              placeholder="Buscar por código o nombre..."
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
          dataSource={metodos || []}
          scroll={{ x: 900 }}
          rowKey="id"
          loading={isLoading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} métodos`,
          }}
        />
      </Card>

      {/* Modal de formulario */}
      <MetodoFormModal
        open={modalOpen}
        metodo={metodoSeleccionado}
        onCancel={() => {
          setModalOpen(false);
          setMetodoSeleccionado(null);
        }}
        onSubmit={handleSubmitForm}
        loading={crearMetodoMutation.isPending || actualizarMetodoMutation.isPending}
      />
    </div>
  );
};
