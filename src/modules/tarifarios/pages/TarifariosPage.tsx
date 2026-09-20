import { useState } from 'react';
import {
  Table,
  Button,
  Space,
  Typography,
  Input,
  Modal,
  Switch,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  DollarOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useTarifarios, useCrearTarifario, useActualizarTarifario, useEliminarTarifario } from '../hooks';
import { useAuthStore } from '../../auth/hooks';
import { TarifarioFormModal, TarifarioPreciosModal } from '../components';
import type { Tarifario, CreateTarifarioInput, UpdateTarifarioInput } from '../types';
import PageContainer from '../../../shared/components/PageContainer';

const { Title, Text } = Typography;

export const TarifariosPage: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [preciosModalOpen, setPreciosModalOpen] = useState(false);
  const [tarifarioSeleccionado, setTarifarioSeleccionado] = useState<Tarifario | null>(null);

  const { hasPermission } = useAuthStore();
  const { data: tarifarios, isLoading } = useTarifarios({});
  const crearTarifarioMutation = useCrearTarifario();
  const actualizarTarifarioMutation = useActualizarTarifario();
  const eliminarTarifarioMutation = useEliminarTarifario();

  // Filtrado local
  const tarifariosFiltrados = tarifarios?.filter((tarifario) => {
    if (!searchText) return true;
    const search = searchText.toLowerCase();
    return (
      tarifario.nombre.toLowerCase().includes(search) ||
      (tarifario.descripcion && tarifario.descripcion.toLowerCase().includes(search))
    );
  });

  const handleNuevo = () => {
    setTarifarioSeleccionado(null);
    setModalOpen(true);
  };

  const handleEditar = (tarifario: Tarifario) => {
    setTarifarioSeleccionado(tarifario);
    setModalOpen(true);
  };

  const handleGestionarPrecios = (tarifario: Tarifario) => {
    setTarifarioSeleccionado(tarifario);
    setPreciosModalOpen(true);
  };

  const handleEliminar = (tarifario: Tarifario) => {
    Modal.confirm({
      title: '¿Está seguro de eliminar este tarifario?',
      content: `Se eliminará el tarifario "${tarifario.nombre}". Esta acción no se puede deshacer.`,
      okText: 'Eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        await eliminarTarifarioMutation.mutateAsync(tarifario.id);
      },
    });
  };

  const handleToggleActivo = async (tarifario: Tarifario) => {
    if (!hasPermission('tariffs.update')) return;
    await actualizarTarifarioMutation.mutateAsync({
      id: tarifario.id,
      data: { activo: !tarifario.activo },
    });
  };

  const handleSubmitForm = async (data: CreateTarifarioInput | UpdateTarifarioInput) => {
    if (tarifarioSeleccionado) {
      await actualizarTarifarioMutation.mutateAsync({
        id: tarifarioSeleccionado.id,
        data: data as UpdateTarifarioInput,
      });
    } else {
      await crearTarifarioMutation.mutateAsync(data as CreateTarifarioInput);
    }
    setModalOpen(false);
    setTarifarioSeleccionado(null);
  };

  const columns: ColumnsType<Tarifario> = [
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
      width: 300,
      render: (nombre: string) => (
        <Space>
          <DollarOutlined style={{ color: '#52c41a' }} />
          <Text strong>{nombre}</Text>
        </Space>
      ),
    },
    {
      title: 'Descripción',
      dataIndex: 'descripcion',
      key: 'descripcion',
      render: (descripcion: string | null) => descripcion || <Text type="secondary">-</Text>,
    },
    {
      title: 'Estado',
      dataIndex: 'activo',
      key: 'activo',
      width: 150,
      align: 'center',
      render: (activo: boolean, record: Tarifario) => (
        <Switch
          checked={activo}
          onChange={() => handleToggleActivo(record)}
          checkedChildren="Activo"
          unCheckedChildren="Inactivo"
          disabled={!hasPermission('tariffs.update')}
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
      width: 150,
      align: 'center',
      render: (_, record: Tarifario) => (
        <Space size="small">
          {hasPermission('tariffs.update') && (
            <Tooltip title="Gestionar Precios">
              <Button
                type="primary"
                ghost
                icon={<UnorderedListOutlined />}
                onClick={() => handleGestionarPrecios(record)}
              />
            </Tooltip>
          )}
          {hasPermission('tariffs.update') && (
            <Tooltip title="Editar">
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => handleEditar(record)}
              />
            </Tooltip>
          )}
          {hasPermission('tariffs.delete') && (
            <Tooltip title="Eliminar">
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleEliminar(record)}
              />
            </Tooltip>
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
          <Title level={2} style={{ marginBottom: 4 }}>Tarifarios</Title>
          <Text type="secondary">Gestión de tarifarios y precios por análisis</Text>
        </div>

        {/* Buscador + botón */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Input
            placeholder="Buscar tarifario..."
            prefix={<SearchOutlined />}
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
          />

          {hasPermission('tariffs.create') && (
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={handleNuevo}
            >
              Nuevo Tarifario
            </Button>
          )}
        </div>
      </div>

      {/* 🔵 Tabla */}
      <Table
        columns={columns}
        dataSource={tarifariosFiltrados || []}
        rowKey="id"
        loading={isLoading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} tarifarios`,
        }}
      />

      {/* Modal de formulario */}
      <TarifarioFormModal
        open={modalOpen}
        tarifario={tarifarioSeleccionado}
        onCancel={() => {
          setModalOpen(false);
          setTarifarioSeleccionado(null);
        }}
        onSubmit={handleSubmitForm}
        loading={
          crearTarifarioMutation.isPending ||
          actualizarTarifarioMutation.isPending
        }
      />

      {/* Modal de Precios */}
      {hasPermission('tariffs.update') && (
        <TarifarioPreciosModal
          open={preciosModalOpen}
          tarifarioId={tarifarioSeleccionado?.id || null}
          tarifarioNombre={tarifarioSeleccionado?.nombre || ''}
          onClose={() => {
            setPreciosModalOpen(false);
            setTarifarioSeleccionado(null);
          }}
        />
      )}

    </PageContainer>
  );

};
