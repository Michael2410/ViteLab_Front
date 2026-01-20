import { useState } from 'react';
import {
  Table,
  Button,
  Space,
  Typography,
  Input,
  Row,
  Col,
  Modal,
  Switch,
  Tag,
  Select,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  useComponentes,
  useCrearComponente,
  useActualizarComponente,
  useEliminarComponente
} from '../hooks';
import { useAuthStore } from '../../auth/hooks';
import { useAreasActivas } from '../../areas/hooks';
import { useMetodosActivos } from '../../metodos/hooks';
import { ComponenteFormModal } from '../components/ComponenteFormModal';
import type { Componente, CreateComponenteInput, UpdateComponenteInput } from '../types';
import PageContainer from '../../../shared/components/PageContainer';

const { Title, Text } = Typography;

export const ComponentesPage: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [areaIdFilter, setAreaIdFilter] = useState<number | undefined>(undefined);
  const [metodoIdFilter, setMetodoIdFilter] = useState<number | undefined>(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const [componenteSeleccionado, setComponenteSeleccionado] = useState<Componente | null>(null);

  const { hasPermission } = useAuthStore();
  const { data: componentes, isLoading } = useComponentes({});
  const { data: areasList } = useAreasActivas();
  const { data: metodosList } = useMetodosActivos();

  const crearComponenteMutation = useCrearComponente();
  const actualizarComponenteMutation = useActualizarComponente();
  const eliminarComponenteMutation = useEliminarComponente();

  // Filtrado local
  const componentesFiltrados = componentes?.filter((comp) => {
    // Filtro de texto
    if (searchText) {
      const search = searchText.toLowerCase();
      if (!comp.nombre.toLowerCase().includes(search)) return false;
    }
    // Filtro por área
    if (areaIdFilter && comp.area_id !== areaIdFilter) return false;
    // Filtro por método
    if (metodoIdFilter && comp.metodo_id !== metodoIdFilter) return false;
    return true;
  });

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
    if (!hasPermission('catalogs.components.update')) return;
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
      title: 'Componente',
      dataIndex: 'nombre',
      key: 'nombre',
      width: 150,
      render: (nombre: string) => (
        <Space direction="vertical" size="small">
          <Text strong>{nombre}</Text>
        </Space>
      ),
    },
    {
      title: 'Valores Referenciales',
      dataIndex: 'valores_referenciales',
      key: 'valores_referenciales',
      width: 200,
      render: (valores: string[]) => {
        if (!valores || valores.length === 0) {
          return <Text type="secondary">-</Text>;
        }
        return (
          <Space size={[0, 4]} wrap>
            {valores.map((v, idx) => (
              <Tag key={idx} color="blue">{v}</Tag>
            ))}
          </Space>
        );
      },
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
      width: 100,
      render: (area: Componente['area']) =>
        area ? <Tag color="cyan">{area.nombre}</Tag> : <Text type="secondary">-</Text>,
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
          disabled={!hasPermission('catalogs.components.update')}
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
          {hasPermission('catalogs.components.update') && (
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEditar(record)}
            />
          )}
          {hasPermission('catalogs.components.delete') && (
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleEliminar(record)}
            />
          )}
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>

      {/* 🔵 Header con título + buscador + botón */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <div>
          <Title level={2} style={{ marginBottom: 4 }}>Componentes de Análisis</Title>
          <Text type="secondary">Gestión de componentes (subtítulos) para cada análisis</Text>
        </div>

        {/* Buscador + botón */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Input
            placeholder="Buscar por nombre..."
            prefix={<SearchOutlined />}
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 280 }}
          />

          {hasPermission('catalogs.components.create') && (
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={handleNuevo}
            >
              Nuevo Componente
            </Button>
          )}
        </div>
      </div>

      {/* 🔵 Filtros adicionales (Área + Método) */}
      <div style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Select
              placeholder="Filtrar por área"
              allowClear
              style={{ width: '100%' }}
              value={areaIdFilter}
              onChange={(value) => setAreaIdFilter(value)}
              options={areasList?.map((a) => ({
                label: a.nombre,
                value: a.id,
              }))}
            />
          </Col>

          <Col xs={24} md={8}>
            <Select
              placeholder="Filtrar por método"
              allowClear
              style={{ width: '100%' }}
              value={metodoIdFilter}
              onChange={(value) => setMetodoIdFilter(value)}
              options={metodosList?.map((m) => ({
                label: m.nombre,
                value: m.id,
              }))}
            />
          </Col>
        </Row>
      </div>

      {/* 🔵 Tabla */}
      <Table
        columns={columns}
        dataSource={componentesFiltrados || []}
        rowKey="id"
        loading={isLoading}
        scroll={{ x: 1600 }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} componentes`,
        }}
      />
      {/* Modal */}
      <ComponenteFormModal
        open={modalOpen}
        componente={componenteSeleccionado}
        onCancel={() => {
          setModalOpen(false);
          setComponenteSeleccionado(null);
        }}
        onSubmit={handleSubmitForm}
        loading={
          crearComponenteMutation.isPending ||
          actualizarComponenteMutation.isPending
        }
      />
    </PageContainer>
  );

};
