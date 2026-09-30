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
import { useMuestras, useCreateMuestra, useUpdateMuestra, useDeleteMuestra } from '../hooks';
import { useAuthStore } from '../../../auth/hooks';
import { MuestraFormModal } from '../components/MuestraFormModal';
import type { Muestra, CreateMuestraInput, UpdateMuestraInput } from '../types';
import ModulePageLayout, { BrandCreateButton, brandSearchStyle, renderTableFilterIcon } from '../../../../shared/components/ModulePageLayout';
import { GlobalTable } from '../../../../shared/components/GlobalTable';

const { Text } = Typography;

interface MuestrasPageProps {
  isTab?: boolean;
  createTrigger?: number;
  externalSearch?: string;
}

export const MuestrasPage = ({ isTab = false, createTrigger, externalSearch }: MuestrasPageProps) => {
  const [internalSearchText, setInternalSearchText] = useState('');
  const searchText = isTab && externalSearch !== undefined ? externalSearch : internalSearchText;
  const setSearchText = setInternalSearchText;
  const [modalOpen, setModalOpen] = useState(false);
  const [muestraSeleccionada, setMuestraSeleccionada] = useState<Muestra | null>(null);

  const lastTriggerRef = useRef(createTrigger || 0);
  useEffect(() => {
    if (createTrigger && createTrigger > lastTriggerRef.current) {
      lastTriggerRef.current = createTrigger;
      handleNuevo();
    }
  }, [createTrigger]);

  const { hasPermission } = useAuthStore();
  const { data: muestras, isLoading } = useMuestras();
  const createMutation = useCreateMuestra();
  const updateMutation = useUpdateMuestra();
  const deleteMutation = useDeleteMuestra();

  const handleNuevo = () => {
    setMuestraSeleccionada(null);
    setModalOpen(true);
  };

  const handleEditar = (muestra: Muestra) => {
    setMuestraSeleccionada(muestra);
    setModalOpen(true);
  };

  const handleEliminar = (muestra: Muestra) => {
    Modal.confirm({
      title: '¿Está seguro de eliminar esta muestra?',
      content: `Se eliminará la muestra "${muestra.nombre}". Esta acción no se puede deshacer.`,
      okText: 'Eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        await deleteMutation.mutateAsync(muestra.id);
      },
    });
  };

  const handleToggleActivo = async (muestra: Muestra) => {
    if (!hasPermission('catalogs.muestras.update')) return;
    await updateMutation.mutateAsync({
      id: muestra.id,
      data: { activo: !muestra.activo },
    });
  };

  const handleSubmitForm = async (data: CreateMuestraInput | UpdateMuestraInput) => {
    if (muestraSeleccionada) {
      await updateMutation.mutateAsync({
        id: muestraSeleccionada.id,
        data: data as UpdateMuestraInput,
      });
    } else {
      await createMutation.mutateAsync(data as CreateMuestraInput);
    }
    setModalOpen(false);
    setMuestraSeleccionada(null);
  };

  // Filtrado local
  const filteredMuestras = muestras?.filter((muestra) =>
    muestra.nombre.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns: ColumnsType<Muestra> = [
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
      onFilter: (value, record: Muestra) => record.activo === value,
      render: (activo: boolean, record: Muestra) => (
        <Switch
          checked={activo}
          onChange={() => handleToggleActivo(record)}
          checkedChildren="Activo"
          unCheckedChildren="Inactivo"
          disabled={!hasPermission('catalogs.muestras.update')}
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
      render: (_, record: Muestra) => (
        <Space size="small">
          {hasPermission('catalogs.muestras.update') && (
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: '#0284c7' }} />}
              onClick={() => handleEditar(record)}
              style={{ borderRadius: 6 }}
            />
          )}
          {hasPermission('catalogs.muestras.delete') && (
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
        dataSource={filteredMuestras || []}
        loading={isLoading}
        resourceName="muestras"
      />

      {/* Modal */}
      <MuestraFormModal
        open={modalOpen}
        muestra={muestraSeleccionada}
        onCancel={() => {
          setModalOpen(false);
          setMuestraSeleccionada(null);
        }}
        onSubmit={handleSubmitForm}
        loading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );

  if (isTab) {
    return content;
  }

  return (
    <ModulePageLayout
      title="Muestras Biológicas"
      subtitle="Gestión y parametrización de tipos de muestras para componentes de análisis clínico"
      actionButton={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Input
            placeholder="Buscar por nombre de muestra..."
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 280, ...brandSearchStyle }}
          />
          {hasPermission('catalogs.muestras.create') && (
            <BrandCreateButton onClick={handleNuevo}>
              Nueva Muestra
            </BrandCreateButton>
          )}
        </div>
      }
    >
      {content}
    </ModulePageLayout>
  );
};

