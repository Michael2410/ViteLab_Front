import { useState } from 'react';
import {
  Table,
  Button,
  Space,
  Typography,
  Tag,
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
import { useAreas, useCrearArea, useActualizarArea, useEliminarArea } from '../hooks';
import { AreaFormModal } from '../components/AreaFormModal';
import type { Area, AreaFilters, CreateAreaInput, UpdateAreaInput } from '../types';
import PageContainer from '../../../shared/components/PageContainer';

const { Title, Text } = Typography;

export const AreasPage: React.FC = () => {
  const [filtros, setFiltros] = useState<AreaFilters>({
    page: 1,
    limit: 20,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [areaSeleccionada, setAreaSeleccionada] = useState<Area | null>(null);

  const { data: areas, isLoading } = useAreas(filtros);
  const crearAreaMutation = useCrearArea();
  const actualizarAreaMutation = useActualizarArea();
  const eliminarAreaMutation = useEliminarArea();

  const handleFiltroChange = (key: keyof AreaFilters, value: any) => {
    setFiltros((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleNuevo = () => {
    setAreaSeleccionada(null);
    setModalOpen(true);
  };

  const handleEditar = (area: Area) => {
    setAreaSeleccionada(area);
    setModalOpen(true);
  };

  const handleEliminar = (area: Area) => {
    Modal.confirm({
      title: '¿Está seguro de eliminar esta área?',
      content: `Se eliminará el área "${area.nombre}". Esta acción no se puede deshacer.`,
      okText: 'Eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        await eliminarAreaMutation.mutateAsync(area.id);
      },
    });
  };

  const handleToggleActivo = async (area: Area) => {
    await actualizarAreaMutation.mutateAsync({
      id: area.id,
      data: { activo: !area.activo },
    });
  };

  const handleSubmitForm = async (data: CreateAreaInput | UpdateAreaInput) => {
    if (areaSeleccionada) {
      await actualizarAreaMutation.mutateAsync({
        id: areaSeleccionada.id,
        data: data as UpdateAreaInput,
      });
    } else {
      await crearAreaMutation.mutateAsync(data as CreateAreaInput);
    }
    setModalOpen(false);
    setAreaSeleccionada(null);
  };

  const columns: ColumnsType<Area> = [
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
      render: (activo: boolean, record: Area) => (
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
      render: (_, record: Area) => (
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
    <PageContainer>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ marginBottom: 8 }}>Áreas de Laboratorio</Title>
          <Text type="secondary">Gestión de áreas para clasificación de análisis</Text>
        </Col>
        <Col>
          <Button type="primary" size="large" icon={<PlusOutlined />} onClick={handleNuevo}>
            Nueva Área
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
          dataSource={areas || []}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 900 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} áreas`,
          }}
        />
      </Card>

      {/* Modal de formulario */}
      <AreaFormModal
        open={modalOpen}
        area={areaSeleccionada}
        onCancel={() => {
          setModalOpen(false);
          setAreaSeleccionada(null);
        }}
        onSubmit={handleSubmitForm}
        loading={crearAreaMutation.isPending || actualizarAreaMutation.isPending}
      />
    </PageContainer>
  );
};
