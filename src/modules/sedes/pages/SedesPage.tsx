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
  Tag,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useSedes, useCrearSede, useActualizarSede, useEliminarSede } from '../hooks';
import { SedeFormModal } from '../components/SedeFormModal';
import type { Sede, SedeFilters, CreateSedeInput, UpdateSedeInput } from '../types';

const { Title, Text } = Typography;

export const SedesPage: React.FC = () => {
  const [filtros, setFiltros] = useState<SedeFilters>({
    page: 1,
    limit: 20,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [sedeSeleccionada, setSedeSeleccionada] = useState<Sede | null>(null);

  const { data: sedes, isLoading } = useSedes(filtros);
  const crearSedeMutation = useCrearSede();
  const actualizarSedeMutation = useActualizarSede();
  const eliminarSedeMutation = useEliminarSede();

  const handleFiltroChange = (key: keyof SedeFilters, value: any) => {
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
    setSedeSeleccionada(null);
    setModalOpen(true);
  };

  const handleEditar = (sede: Sede) => {
    setSedeSeleccionada(sede);
    setModalOpen(true);
  };

  const handleEliminar = (sede: Sede) => {
    Modal.confirm({
      title: '¿Está seguro de eliminar esta sede?',
      content: `Se eliminará la sede "${sede.nombre}". Esta acción no se puede deshacer.`,
      okText: 'Eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        await eliminarSedeMutation.mutateAsync(sede.id);
      },
    });
  };

  const handleToggleActivo = async (sede: Sede) => {
    await actualizarSedeMutation.mutateAsync({
      id: sede.id,
      data: { activo: !sede.activo },
    });
  };

  const handleSubmitForm = async (data: CreateSedeInput | UpdateSedeInput) => {
    if (sedeSeleccionada) {
      await actualizarSedeMutation.mutateAsync({
        id: sedeSeleccionada.id,
        data: data as UpdateSedeInput,
      });
    } else {
      await crearSedeMutation.mutateAsync(data as CreateSedeInput);
    }
    setModalOpen(false);
    setSedeSeleccionada(null);
  };

  const columns: ColumnsType<Sede> = [
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
      width: 250,
      render: (nombre: string) => <Text strong>{nombre}</Text>,
    },
    {
      title: 'Dirección',
      dataIndex: 'direccion',
      key: 'direccion',
      ellipsis: true,
      render: (direccion: string) => 
        direccion ? (
          <Space>
            <EnvironmentOutlined />
            <Text>{direccion}</Text>
          </Space>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: 'Teléfono',
      dataIndex: 'telefono',
      key: 'telefono',
      width: 150,
      render: (telefono: string) => 
        telefono ? (
          <Space>
            <PhoneOutlined />
            <Text>{telefono}</Text>
          </Space>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: 'Estado',
      dataIndex: 'activo',
      key: 'activo',
      width: 120,
      align: 'center',
      render: (activo: boolean, record: Sede) => (
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
      render: (_, record: Sede) => (
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
          <Title level={2} style={{ marginBottom: 8 }}>Sedes del Laboratorio</Title>
          <Text type="secondary">Gestión de sedes y sucursales del laboratorio</Text>
        </Col>
        <Col>
          <Button type="primary" size="large" icon={<PlusOutlined />} onClick={handleNuevo}>
            Nueva Sede
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
          dataSource={sedes || []}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 1100 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} sedes`,
          }}
        />
      </Card>

      {/* Modal de formulario */}
      <SedeFormModal
        open={modalOpen}
        sede={sedeSeleccionada}
        onCancel={() => {
          setModalOpen(false);
          setSedeSeleccionada(null);
        }}
        onSubmit={handleSubmitForm}
        loading={crearSedeMutation.isPending || actualizarSedeMutation.isPending}
      />
    </div>
  );
};
