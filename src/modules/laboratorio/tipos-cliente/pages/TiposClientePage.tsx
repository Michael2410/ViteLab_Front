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
import { useAuthStore } from '../../../auth/hooks';
import { TipoClienteFormModal } from '../components/TipoClienteFormModal';
import type { TipoCliente, CreateTipoClienteInput, UpdateTipoClienteInput } from '../types';
import ModulePageLayout, { brandButtonStyle, brandSearchStyle } from '../../../../shared/components/ModulePageLayout';

const { Text } = Typography;

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
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: '#0284c7' }} />}
              onClick={() => handleEditar(record)}
              style={{ borderRadius: 6 }}
            />
          )}
          {hasPermission('catalogs.tipos-cliente.delete') && (
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
      title="Tipos de Cliente"
      subtitle="Clasificación comercial y tarifaria de clientes (Particular, Convenios, Empresas)"
      actionButton={
        hasPermission('catalogs.tipos-cliente.create') && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleNuevo}
            style={brandButtonStyle}
          >
            Nuevo Tipo
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
            placeholder="Buscar por tipo de cliente..."
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 280, ...brandSearchStyle }}
          />
          <Text type="secondary" style={{ fontSize: 13 }}>
            Total registros: <strong style={{ color: '#0f172a' }}>{tiposClienteFiltrados?.length ?? 0}</strong>
          </Text>
        </div>
      }
    >
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
    </ModulePageLayout>
  );
};
