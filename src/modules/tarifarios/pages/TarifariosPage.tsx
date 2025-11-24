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
  DollarOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useTarifarios, useCrearTarifario, useActualizarTarifario, useEliminarTarifario } from '../hooks';
import { TarifarioFormModal } from '../components/TarifarioFormModal';
import type { Tarifario, TarifarioFilters, CreateTarifarioInput, UpdateTarifarioInput } from '../types';

const { Title, Text } = Typography;

export const TarifariosPage: React.FC = () => {
  const [filtros, setFiltros] = useState<TarifarioFilters>({
    page: 1,
    limit: 20,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [tarifarioSeleccionado, setTarifarioSeleccionado] = useState<Tarifario | null>(null);

  const { data: tarifarios, isLoading } = useTarifarios(filtros);
  const crearTarifarioMutation = useCrearTarifario();
  const actualizarTarifarioMutation = useActualizarTarifario();
  const eliminarTarifarioMutation = useEliminarTarifario();

  const handleFiltroChange = (key: keyof TarifarioFilters, value: any) => {
    setFiltros((prev) => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const handleNuevo = () => {
    setTarifarioSeleccionado(null);
    setModalOpen(true);
  };

  const handleEditar = (tarifario: Tarifario) => {
    setTarifarioSeleccionado(tarifario);
    setModalOpen(true);
  };

  const handleEliminar = (tarifario: Tarifario) => {
    Modal.confirm({
      title: '¿Está seguro de eliminar este tarifario?',
      content: `Se eliminará el tarifario "${tarifario.nombre}". Esta acción no se puede deshacer.`,
      okText: 'Eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        await eliminarTarifarioMutation.mutateAsync(tarifario.id);
      },
    });
  };

  const handleToggleActivo = async (tarifario: Tarifario) => {
    await actualizarTarifarioMutation.mutateAsync({
      id: tarifario.id,
      data: { activo: !tarifario.activo },
    });
  };

  const handleSubmitForm = async (data: CreateTarifarioInput | UpdateTarifarioInput) => {
    if (tarifarioSeleccionado) {
      await actualizarTarifarioMutation.mutateAsync({
        id: tarifarioSeleccionado.id,
        data: data as UpdateTarifarioInput,
      });
    } else {
      await crearTarifarioMutation.mutateAsync(data as CreateTarifarioInput);
    }
    setModalOpen(false);
    setTarifarioSeleccionado(null);
  };

  const columns: ColumnsType<Tarifario> = [
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
      width: 300,
      render: (nombre: string) => (
        <Space>
          <DollarOutlined style={{ color: '#1890ff' }} />
          <Text strong>{nombre}</Text>
        </Space>
      ),
    },
    {
      title: 'Descripción',
      dataIndex: 'descripcion',
      key: 'descripcion',
      render: (descripcion: string | null) => descripcion || <Text type="secondary">-</Text>,
    },
    {
      title: 'Estado',
      dataIndex: 'activo',
      key: 'activo',
      width: 150,
      align: 'center',
      render: (activo: boolean, record: Tarifario) => (
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
      render: (_, record: Tarifario) => (
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
          <Title level={2} style={{ marginBottom: 8 }}>Tarifarios</Title>
          <Text type="secondary">Gestión de tarifarios y precios</Text>
        </Col>
        <Col>
          <Button type="primary" size="large" icon={<PlusOutlined />} onClick={handleNuevo}>
            Nuevo Tarifario
          </Button>
        </Col>
      </Row>

      {/* Filtros */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Input
              placeholder="Buscar tarifario..."
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
          dataSource={tarifarios || []}
          rowKey="id"
          loading={isLoading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} tarifarios`,
          }}
        />
      </Card>

      {/* Modal de formulario */}
      <TarifarioFormModal
        open={modalOpen}
        tarifario={tarifarioSeleccionado}
        onCancel={() => {
          setModalOpen(false);
          setTarifarioSeleccionado(null);
        }}
        onSubmit={handleSubmitForm}
        loading={crearTarifarioMutation.isPending || actualizarTarifarioMutation.isPending}
      />
    </div>
  );
};
