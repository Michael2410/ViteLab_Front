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
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useMuestras, useCreateMuestra, useUpdateMuestra, useDeleteMuestra } from '../hooks';
import { useAuthStore } from '../../auth/hooks';
import { MuestraFormModal } from '../components/MuestraFormModal';
import type { Muestra, CreateMuestraInput, UpdateMuestraInput } from '../types';
import PageContainer from '../../../shared/components/PageContainer';

const { Title, Text } = Typography;

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
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEditar(record)}
            />
          )}
          {hasPermission('catalogs.muestras.delete') && (
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
          <Title level={2} style={{ marginBottom: 4 }}>Muestras</Title>
          <Text type="secondary">Gestión de tipos de muestras para componentes de análisis</Text>
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

          {hasPermission('catalogs.muestras.create') && (
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={handleNuevo}
            >
              Nueva Muestra
            </Button>
          )}
        </div>
      </div>

      {/* 🔵 Tabla */}
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
    </PageContainer>
  );

};
