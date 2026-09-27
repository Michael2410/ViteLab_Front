import { useState } from 'react';
import {
  Table,
  Button,
  Space,
  Typography,
  Input,
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
import { useMuestras, useCreateMuestra, useUpdateMuestra, useDeleteMuestra } from '../hooks';
import { useAuthStore } from '../../../auth/hooks';
import { MuestraFormModal } from '../components/MuestraFormModal';
import type { Muestra, CreateMuestraInput, UpdateMuestraInput } from '../types';
import ModulePageLayout, { brandButtonStyle, brandSearchStyle } from '../../../../shared/components/ModulePageLayout';

const { Text } = Typography;

export const MuestrasPage: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [muestraSeleccionada, setMuestraSeleccionada] = useState<Muestra | null>(null);

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

  return (
    <ModulePageLayout
      title="Muestras Biológicas"
      subtitle="Gestión y parametrización de tipos de muestras para componentes de análisis clínico"
      actionButton={
        hasPermission('catalogs.muestras.create') && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleNuevo}
            style={brandButtonStyle}
          >
            Nueva Muestra
          </Button>
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
          <Input
            placeholder="Buscar por nombre de muestra..."
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 280, ...brandSearchStyle }}
          />
          <Text type="secondary" style={{ fontSize: 13 }}>
            Total registros: <strong style={{ color: '#0f172a' }}>{filteredMuestras?.length ?? 0}</strong>
          </Text>
        </div>
      }
    >
      <Table
        columns={columns}
        dataSource={filteredMuestras || []}
        rowKey="id"
        loading={isLoading}
        scroll={{ x: 800 }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} muestras`,
        }}
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
    </ModulePageLayout>
  );
};

