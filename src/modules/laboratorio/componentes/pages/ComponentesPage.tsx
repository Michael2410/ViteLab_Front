import { useState, useRef, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Typography,
  Input,
  Modal,
  Switch,
  Tag,
  Select,
} from 'antd';
import {
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
import { useAuthStore } from '../../../auth/hooks';
import { useAreasActivas } from '../../areas/hooks';
import { useMetodosActivos } from '../../metodos/hooks';
import { ComponenteFormModal } from '../components/ComponenteFormModal';
import type { Componente, CreateComponenteInput, UpdateComponenteInput } from '../types';
import ModulePageLayout, { BrandCreateButton, brandSearchStyle, brandControlStyle } from '../../../../shared/components/ModulePageLayout';

const { Text } = Typography;

interface ComponentesPageProps {
  isTab?: boolean;
  createTrigger?: number;
}

export const ComponentesPage = ({ isTab = false, createTrigger }: ComponentesPageProps) => {
  const [searchText, setSearchText] = useState('');
  const [areaIdFilter, setAreaIdFilter] = useState<number | undefined>(undefined);
  const [metodoIdFilter, setMetodoIdFilter] = useState<number | undefined>(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const [componenteSeleccionado, setComponenteSeleccionado] = useState<Componente | null>(null);

  const lastTriggerRef = useRef(createTrigger || 0);
  useEffect(() => {
    if (createTrigger && createTrigger > lastTriggerRef.current) {
      lastTriggerRef.current = createTrigger;
      handleNuevo();
    }
  }, [createTrigger]);

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
      render: (nombre: string, record: Componente) => (
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
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: '#0284c7' }} />}
              onClick={() => handleEditar(record)}
              style={{ borderRadius: 6 }}
            />
          )}
          {hasPermission('catalogs.components.delete') && (
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleEliminar(record)}
              style={{ borderRadius: 6 }}
            />
          )}
        </Space>
      ),
    },
  ];

  const content = (
    <>
      {isTab && (
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 16,
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <Input
              placeholder="Buscar por nombre de componente..."
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 280, ...brandSearchStyle }}
            />

            <Select
              placeholder="Filtrar por área"
              allowClear
              style={{ width: 200, ...brandControlStyle }}
              value={areaIdFilter}
              onChange={(value) => setAreaIdFilter(value)}
              options={areasList?.map((a) => ({
                label: a.nombre,
                value: a.id,
              }))}
            />

            <Select
              placeholder="Filtrar por método"
              allowClear
              style={{ width: 200, ...brandControlStyle }}
              value={metodoIdFilter}
              onChange={(value) => setMetodoIdFilter(value)}
              options={metodosList?.map((m) => ({
                label: m.nombre,
                value: m.id,
              }))}
            />
          </div>

          <Text type="secondary" style={{ fontSize: 13 }}>
            Total registros: <strong style={{ color: '#0f172a' }}>{componentesFiltrados?.length ?? 0}</strong>
          </Text>
        </div>
      )}

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
    </>
  );

  if (isTab) {
    return <div style={{ paddingTop: 8 }}>{content}</div>;
  }

  return (
    <ModulePageLayout
      title="Componentes de Análisis"
      subtitle="Gestión de analitos, parámetros técnicos y rangos de referencia para análisis clínicos"
      actionButton={
        hasPermission('catalogs.components.create') && (
          <BrandCreateButton onClick={handleNuevo}>
            Nuevo Componente
          </BrandCreateButton>
        )
      }
      filters={
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <Input
              placeholder="Buscar por nombre de componente..."
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 280, ...brandSearchStyle }}
            />

            <Select
              placeholder="Filtrar por área"
              allowClear
              style={{ width: 200, ...brandControlStyle }}
              value={areaIdFilter}
              onChange={(value) => setAreaIdFilter(value)}
              options={areasList?.map((a) => ({
                label: a.nombre,
                value: a.id,
              }))}
            />

            <Select
              placeholder="Filtrar por método"
              allowClear
              style={{ width: 200, ...brandControlStyle }}
              value={metodoIdFilter}
              onChange={(value) => setMetodoIdFilter(value)}
              options={metodosList?.map((m) => ({
                label: m.nombre,
                value: m.id,
              }))}
            />
          </div>

          <Text type="secondary" style={{ fontSize: 13 }}>
            Total registros: <strong style={{ color: '#0f172a' }}>{componentesFiltrados?.length ?? 0}</strong>
          </Text>
        </div>
      }
    >
      {content}
    </ModulePageLayout>
  );
};
