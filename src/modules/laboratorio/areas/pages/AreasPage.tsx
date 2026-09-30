import { useState, useRef, useEffect } from 'react';
import {
  Button,
  Space,
  Typography,
  Input,
  Modal,
  Switch,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useAreas, useCrearArea, useActualizarArea, useEliminarArea } from '../hooks';
import { useAuthStore } from '../../../auth/hooks';
import { AreaFormModal } from '../components/AreaFormModal';
import type { Area, CreateAreaInput, UpdateAreaInput } from '../types';
import ModulePageLayout, { BrandCreateButton, brandSearchStyle, renderTableFilterIcon } from '../../../../shared/components/ModulePageLayout';
import { GlobalTable } from '../../../../shared/components/GlobalTable';

const { Text } = Typography;

interface AreasPageProps {
  isTab?: boolean;
  createTrigger?: number;
  externalSearch?: string;
}

export const AreasPage = ({ isTab = false, createTrigger, externalSearch }: AreasPageProps) => {
  const [internalSearchText, setInternalSearchText] = useState('');
  const searchText = isTab && externalSearch !== undefined ? externalSearch : internalSearchText;
  const setSearchText = setInternalSearchText;
  const [modalOpen, setModalOpen] = useState(false);
  const [areaSeleccionada, setAreaSeleccionada] = useState<Area | null>(null);

  const lastTriggerRef = useRef(createTrigger || 0);
  useEffect(() => {
    if (createTrigger && createTrigger > lastTriggerRef.current) {
      lastTriggerRef.current = createTrigger;
      handleNuevo();
    }
  }, [createTrigger]);

  const { hasPermission } = useAuthStore();
  const { data: areas, isLoading } = useAreas({});
  const crearAreaMutation = useCrearArea();
  const actualizarAreaMutation = useActualizarArea();
  const eliminarAreaMutation = useEliminarArea();

  // Filtrado local
  const areasFiltradas = areas?.filter((area) => {
    if (!searchText) return true;
    const search = searchText.toLowerCase();
    return (
      area.nombre.toLowerCase().includes(search) ||
      (area.descripcion && area.descripcion.toLowerCase().includes(search))
    );
  });

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
    if (!hasPermission('catalogs.areas.update')) return;
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
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
      width: 250,
      render: (nombre: string) => <Text strong>{nombre}</Text>,
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
      filters: [
        { text: 'Activo', value: true },
        { text: 'Inactivo', value: false },
      ],
      filterIcon: renderTableFilterIcon,
      onFilter: (value, record: Area) => record.activo === value,
      render: (activo: boolean, record: Area) => (
        <Switch
          checked={activo}
          onChange={() => handleToggleActivo(record)}
          checkedChildren="Activo"
          unCheckedChildren="Inactivo"
          disabled={!hasPermission('catalogs.areas.update')}
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
          {hasPermission('catalogs.areas.update') && (
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: '#0284c7' }} />}
              onClick={() => handleEditar(record)}
              style={{ borderRadius: 6 }}
            />
          )}
          {hasPermission('catalogs.areas.delete') && (
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
        dataSource={areasFiltradas || []}
        loading={isLoading}
        resourceName="áreas"
      />

      {/* Modal */}
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
    </div>
  );

  if (isTab) {
    return content;
  }

  return (
    <ModulePageLayout
      title="Áreas de Laboratorio"
      subtitle="Gestión y clasificación de áreas técnicas para análisis clínicos"
      actionButton={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Input
            placeholder="Buscar por código o nombre de área..."
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 280, ...brandSearchStyle }}
          />
          {hasPermission('catalogs.areas.create') && (
            <BrandCreateButton onClick={handleNuevo}>
              Nueva Área
            </BrandCreateButton>
          )}
        </div>
      }
    >
      {content}
    </ModulePageLayout>
  );
};

