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
import {
  useTiposCliente,
  useCrearTipoCliente,
  useActualizarTipoCliente,
  useEliminarTipoCliente
} from '../hooks';
import { useAuthStore } from '../../auth/hooks';
import { TipoClienteFormModal } from '../components/TipoClienteFormModal';
import type { TipoCliente, CreateTipoClienteInput, UpdateTipoClienteInput } from '../types';
import PageContainer from '../../../shared/components/PageContainer';

const { Title, Text } = Typography;

export const TiposClientePage: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [tipoClienteSeleccionado, setTipoClienteSeleccionado] = useState<TipoCliente | null>(null);

  const { hasPermission } = useAuthStore();
  const { data: tiposCliente, isLoading } = useTiposCliente({});
  const crearTipoClienteMutation = useCrearTipoCliente();
  const actualizarTipoClienteMutation = useActualizarTipoCliente();
  const eliminarTipoClienteMutation = useEliminarTipoCliente();

  // Filtrado local
  const tiposClienteFiltrados = tiposCliente?.filter((tc) => {
    if (!searchText) return true;
    const search = searchText.toLowerCase();
    return tc.nombre.toLowerCase().includes(search);
  });

  const handleNuevo = () => {
    setTipoClienteSeleccionado(null);
    setModalOpen(true);
  };

  const handleEditar = (tipoCliente: TipoCliente) => {
    setTipoClienteSeleccionado(tipoCliente);
    setModalOpen(true);
  };

  const handleEliminar = (tipoCliente: TipoCliente) => {
    Modal.confirm({
      title: '¿Está seguro de eliminar este tipo de cliente?',
      content: `Se eliminará el tipo "${tipoCliente.nombre}". Esta acción no se puede deshacer.`,
      okText: 'Eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        await eliminarTipoClienteMutation.mutateAsync(tipoCliente.id);
      },
    });
  };

  const handleToggleActivo = async (tipoCliente: TipoCliente) => {
    if (!hasPermission('catalogs.tipos-cliente.update')) return;
    await actualizarTipoClienteMutation.mutateAsync({
      id: tipoCliente.id,
      data: { activo: !tipoCliente.activo },
    });
  };

  const handleSubmitForm = async (data: CreateTipoClienteInput | UpdateTipoClienteInput) => {
    if (tipoClienteSeleccionado) {
      await actualizarTipoClienteMutation.mutateAsync({
        id: tipoClienteSeleccionado.id,
        data: data as UpdateTipoClienteInput,
      });
    } else {
      await crearTipoClienteMutation.mutateAsync(data as CreateTipoClienteInput);
    }
    setModalOpen(false);
    setTipoClienteSeleccionado(null);
  };

  const columns: ColumnsType<TipoCliente> = [
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
      width: 300,
      render: (nombre: string) => <Text strong>{nombre}</Text>,
    },
    {
      title: 'Estado',
      dataIndex: 'activo',
      key: 'activo',
      width: 150,
      align: 'center',
      render: (activo: boolean, record: TipoCliente) => (
        <Switch
          checked={activo}
          onChange={() => handleToggleActivo(record)}
          checkedChildren="Activo"
          unCheckedChildren="Inactivo"
          disabled={!hasPermission('catalogs.tipos-cliente.update')}
        />
      ),
    },
    {
      title: 'Fecha Creación',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (fecha: string) => dayjs(fecha).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 150,
      align: 'center',
      render: (_, record: TipoCliente) => (
        <Space size="small">
          {hasPermission('catalogs.tipos-cliente.update') && (
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEditar(record)}
            />
          )}
          {hasPermission('catalogs.tipos-cliente.delete') && (
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
          <Title level={2} style={{ marginBottom: 4 }}>Tipos de Cliente</Title>
          <Text type="secondary">Clasificación de clientes (Particular, Convenio, etc.)</Text>
        </div>

        {/* Buscador + botón a la derecha */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Input
            placeholder="Buscar por nombre..."
            prefix={<SearchOutlined />}
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 280 }}
          />

          {hasPermission('catalogs.tipos-cliente.create') && (
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={handleNuevo}
            >
              Nuevo Tipo
            </Button>
          )}
        </div>
      </div>

      {/* 🔵 Tabla */}
      <Table
        columns={columns}
        dataSource={tiposClienteFiltrados || []}
        rowKey="id"
        loading={isLoading}
        scroll={{ x: 800 }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} tipos de cliente`,
        }}
      />

      {/* Modal */}
      <TipoClienteFormModal
        open={modalOpen}
        tipoCliente={tipoClienteSeleccionado}
        onCancel={() => {
          setModalOpen(false);
          setTipoClienteSeleccionado(null);
        }}
        onSubmit={handleSubmitForm}
        loading={crearTipoClienteMutation.isPending || actualizarTipoClienteMutation.isPending}
      />
    </PageContainer>
  );
};
