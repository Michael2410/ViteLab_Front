import { useState, useRef, useEffect } from 'react';
import {
  Button,
  Space,
  Typography,
  Input,
  Modal,
  Switch,
  Tag,
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
import ModulePageLayout, { BrandCreateButton, brandSearchStyle, renderTableFilterIcon } from '../../../../shared/components/ModulePageLayout';
import { GlobalTable } from '../../../../shared/components/GlobalTable';

const { Text } = Typography;

interface ComponentesPageProps {
  isTab?: boolean;
  createTrigger?: number;
  externalSearch?: string;
}

export const ComponentesPage = ({ isTab = false, createTrigger, externalSearch }: ComponentesPageProps) => {
  const [internalSearchText, setInternalSearchText] = useState('');
  const searchText = isTab && externalSearch !== undefined ? externalSearch : internalSearchText;
  const setSearchText = setInternalSearchText;
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

  // Filtrado local por texto (área, método y estado se filtran nativamente en la tabla)
  const componentesFiltrados = componentes?.filter((comp) => {
    if (!searchText) return true;
    return comp.nombre.toLowerCase().includes(searchText.toLowerCase());
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
      width: 120,
      filters: areasList?.map((a) => ({ text: a.nombre, value: a.id })),
      filterIcon: renderTableFilterIcon,
      onFilter: (value, record: Componente) => record.area_id === value,
      render: (area: Componente['area']) =>
        area ? <Tag color="cyan">{area.nombre}</Tag> : <Text type="secondary">-</Text>,
    },
    {
      title: 'Método',
      dataIndex: 'metodo',
      key: 'metodo',
      width: 150,
      filters: metodosList?.map((m) => ({ text: m.nombre, value: m.id })),
      filterIcon: renderTableFilterIcon,
      onFilter: (value, record: Componente) => record.metodo_id === value,
      render: (metodo: Componente['metodo']) =>
        metodo ? <Tag color="green">{metodo.nombre}</Tag> : <Text type="secondary">-</Text>,
    },
    {
      title: 'Estado',
      dataIndex: 'activo',
      key: 'activo',
      width: 120,
      align: 'center',
      filters: [
        { text: 'Activo', value: true },
        { text: 'Inactivo', value: false },
      ],
      filterIcon: renderTableFilterIcon,
      onFilter: (value, record: Componente) => record.activo === value,
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
    <div style={{ paddingTop: isTab ? 4 : 0 }}>
      <GlobalTable
        columns={columns}
        dataSource={componentesFiltrados || []}
        loading={isLoading}
        resourceName="componentes"
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
    </div>
  );

  if (isTab) {
    return content;
  }

  return (
    <ModulePageLayout
      title="Componentes de Análisis"
      subtitle="Gestión de analitos, parámetros técnicos y rangos de referencia para análisis clínicos"
      actionButton={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Input
            placeholder="Buscar por nombre de componente..."
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 280, ...brandSearchStyle }}
          />
          {hasPermission('catalogs.components.create') && (
            <BrandCreateButton onClick={handleNuevo}>
              Nuevo Componente
            </BrandCreateButton>
          )}
        </div>
      }
    >
      {content}
    </ModulePageLayout>
  );
};
