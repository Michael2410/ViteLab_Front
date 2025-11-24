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
  Select,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ExperimentOutlined,
  SortAscendingOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { 
  useComponentes, 
  useCrearComponente, 
  useActualizarComponente, 
  useEliminarComponente 
} from '../hooks';
import { useAnalisisActivos } from '../../analisis/hooks';
import { useAreasActivas } from '../../areas/hooks';
import { useMetodosActivos } from '../../metodos/hooks';
import { ComponenteFormModal } from '../components/ComponenteFormModal';
import type { Componente, ComponenteFilters, CreateComponenteInput, UpdateComponenteInput } from '../types';

const { Title, Text } = Typography;

export const ComponentesPage: React.FC = () => {
  const [filtros, setFiltros] = useState<ComponenteFilters>({
    page: 1,
    limit: 20,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [componenteSeleccionado, setComponenteSeleccionado] = useState<Componente | null>(null);

  const { data: componentes, isLoading } = useComponentes(filtros);
  const { data: analisisList } = useAnalisisActivos();
  const { data: areasList } = useAreasActivas();
  const { data: metodosList } = useMetodosActivos();
  
  const crearComponenteMutation = useCrearComponente();
  const actualizarComponenteMutation = useActualizarComponente();
  const eliminarComponenteMutation = useEliminarComponente();

  const handleFiltroChange = (key: keyof ComponenteFilters, value: any) => {
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
    setComponenteSeleccionado(null);
    setModalOpen(true);
  };

  const handleEditar = (componente: Componente) => {
    setComponenteSeleccionado(componente);
    setModalOpen(true);
  };

  const handleEliminar = (componente: Componente) => {
    Modal.confirm({
      title: '¿Está seguro de eliminar este componente?',
      content: `Se eliminará el componente "${componente.nombre}". Esta acción no se puede deshacer.`,
      okText: 'Eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        await eliminarComponenteMutation.mutateAsync(componente.id);
      },
    });
  };

  const handleToggleActivo = async (componente: Componente) => {
    await actualizarComponenteMutation.mutateAsync({
      id: componente.id,
      data: { activo: !componente.activo },
    });
  };

  const handleSubmitForm = async (data: CreateComponenteInput | UpdateComponenteInput) => {
    if (componenteSeleccionado) {
      await actualizarComponenteMutation.mutateAsync({
        id: componenteSeleccionado.id,
        data: data as UpdateComponenteInput,
      });
    } else {
      await crearComponenteMutation.mutateAsync(data as CreateComponenteInput);
    }
    setModalOpen(false);
    setComponenteSeleccionado(null);
  };

  const columns: ColumnsType<Componente> = [
    {
      title: 'Análisis',
      dataIndex: 'analisis',
      key: 'analisis',
      width: 250,
      render: (analisis: Componente['analisis']) => (
        <Space>
          <ExperimentOutlined />
          <Text>{analisis?.nombre || '-'}</Text>
        </Space>
      ),
    },
    {
      title: 'Componente',
      dataIndex: 'nombre',
      key: 'nombre',
      width: 250,
      render: (nombre: string, record: Componente) => (
        <Space direction="vertical" size="small">
          <Text strong>{nombre}</Text>
          {record.orden > 0 && (
            <Tag icon={<SortAscendingOutlined />} color="default">
              Orden: {record.orden}
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Valor Referencial',
      dataIndex: 'valor_referencial',
      key: 'valor_referencial',
      width: 150,
      render: (valor: string) => valor || <Text type="secondary">-</Text>,
    },
    {
      title: 'Unidad',
      dataIndex: 'unidad_medida',
      key: 'unidad_medida',
      width: 100,
      render: (unidad: string) => unidad || <Text type="secondary">-</Text>,
    },
    {
      title: 'Área',
      dataIndex: 'area',
      key: 'area',
      width: 150,
      render: (area: Componente['area']) => 
        area ? <Tag color="blue">{area.nombre}</Tag> : <Text type="secondary">-</Text>,
    },
    {
      title: 'Método',
      dataIndex: 'metodo',
      key: 'metodo',
      width: 150,
      render: (metodo: Componente['metodo']) => 
        metodo ? <Tag color="green">{metodo.nombre}</Tag> : <Text type="secondary">-</Text>,
    },
    {
      title: 'Estado',
      dataIndex: 'activo',
      key: 'activo',
      width: 120,
      align: 'center',
      render: (activo: boolean, record: Componente) => (
        <Switch
          checked={activo}
          onChange={() => handleToggleActivo(record)}
          checkedChildren="Activo"
          unCheckedChildren="Inactivo"
        />
      ),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 120,
      align: 'center',
      render: (_, record: Componente) => (
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
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={2}>Componentes de Análisis</Title>
            <Text type="secondary">Gestión de componentes (subtítulos) para cada análisis</Text>
          </div>
          <Button type="primary" size="large" icon={<PlusOutlined />} onClick={handleNuevo}>
            Nuevo Componente
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Input
              placeholder="Buscar por nombre..."
              prefix={<SearchOutlined />}
              allowClear
              value={filtros.search}
              onChange={(e) => handleFiltroChange('search', e.target.value)}
            />
          </Col>
          <Col xs={24} md={6}>
            <Select
              placeholder="Filtrar por análisis"
              allowClear
              showSearch
              style={{ width: '100%' }}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              value={filtros.analisis_id}
              onChange={(value) => handleFiltroChange('analisis_id', value)}
              options={analisisList?.map((a) => ({
                label: a.nombre,
                value: a.id,
              }))}
            />
          </Col>
          <Col xs={24} md={5}>
            <Select
              placeholder="Filtrar por área"
              allowClear
              style={{ width: '100%' }}
              value={filtros.area_id}
              onChange={(value) => handleFiltroChange('area_id', value)}
              options={areasList?.map((a) => ({
                label: a.nombre,
                value: a.id,
              }))}
            />
          </Col>
          <Col xs={24} md={5}>
            <Select
              placeholder="Filtrar por método"
              allowClear
              style={{ width: '100%' }}
              value={filtros.metodo_id}
              onChange={(value) => handleFiltroChange('metodo_id', value)}
              options={metodosList?.map((m) => ({
                label: m.nombre,
                value: m.id,
              }))}
            />
          </Col>
        </Row>
      </Card>

      {/* Tabla */}
      <Card>
        <Table
          columns={columns}
          dataSource={componentes || []}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 1600 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} componentes`,
          }}
        />
      </Card>

      {/* Modal de formulario */}
      <ComponenteFormModal
        open={modalOpen}
        componente={componenteSeleccionado}
        onCancel={() => {
          setModalOpen(false);
          setComponenteSeleccionado(null);
        }}
        onSubmit={handleSubmitForm}
        loading={crearComponenteMutation.isPending || actualizarComponenteMutation.isPending}
      />
    </div>
  );
};
