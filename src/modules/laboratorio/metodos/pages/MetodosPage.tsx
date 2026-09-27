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
import { useMetodos, useCrearMetodo, useActualizarMetodo, useEliminarMetodo } from '../hooks';
import { useAuthStore } from '../../../auth/hooks';
import { MetodoFormModal } from '../components/MetodoFormModal';
import type { Metodo, CreateMetodoInput, UpdateMetodoInput } from '../types';
import ModulePageLayout, { brandButtonStyle, brandSearchStyle } from '../../../../shared/components/ModulePageLayout';

const { Text } = Typography;

export const MetodosPage: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [metodoSeleccionado, setMetodoSeleccionado] = useState<Metodo | null>(null);

  const { hasPermission } = useAuthStore();
  const { data: metodos, isLoading } = useMetodos({});
  const crearMetodoMutation = useCrearMetodo();
  const actualizarMetodoMutation = useActualizarMetodo();
  const eliminarMetodoMutation = useEliminarMetodo();

  // Filtrado local
  const metodosFiltrados = metodos?.filter((metodo) => {
    if (!searchText) return true;
    const search = searchText.toLowerCase();
    return (
      metodo.nombre.toLowerCase().includes(search) ||
      (metodo.descripcion && metodo.descripcion.toLowerCase().includes(search))
    );
  });

  const handleNuevo = () => {
    setMetodoSeleccionado(null);
    setModalOpen(true);
  };

  const handleEditar = (metodo: Metodo) => {
    setMetodoSeleccionado(metodo);
    setModalOpen(true);
  };

  const handleEliminar = (metodo: Metodo) => {
    Modal.confirm({
      title: '¿Está seguro de eliminar este método?',
      content: `Se eliminará el método "${metodo.nombre}". Esta acción no se puede deshacer.`,
      okText: 'Eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        await eliminarMetodoMutation.mutateAsync(metodo.id);
      },
    });
  };

  const handleToggleActivo = async (metodo: Metodo) => {
    if (!hasPermission('catalogs.methods.update')) return;
    await actualizarMetodoMutation.mutateAsync({
      id: metodo.id,
      data: { activo: !metodo.activo },
    });
  };

  const handleSubmitForm = async (data: CreateMetodoInput | UpdateMetodoInput) => {
    if (metodoSeleccionado) {
      await actualizarMetodoMutation.mutateAsync({
        id: metodoSeleccionado.id,
        data: data as UpdateMetodoInput,
      });
    } else {
      await crearMetodoMutation.mutateAsync(data as CreateMetodoInput);
    }
    setModalOpen(false);
    setMetodoSeleccionado(null);
  };

  const columns: ColumnsType<Metodo> = [
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
      render: (activo: boolean, record: Metodo) => (
        <Switch
          checked={activo}
          onChange={() => handleToggleActivo(record)}
          checkedChildren="Activo"
          unCheckedChildren="Inactivo"
          disabled={!hasPermission('catalogs.methods.update')}
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
      render: (_, record: Metodo) => (
        <Space size="small">
          {hasPermission('catalogs.methods.update') && (
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: '#0284c7' }} />}
              onClick={() => handleEditar(record)}
              style={{ borderRadius: 6 }}
            />
          )}
          {hasPermission('catalogs.methods.delete') && (
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
      title="Métodos de Análisis"
      subtitle="Gestión y estandarización de técnicas y metodologías analíticas"
      actionButton={
        hasPermission('catalogs.methods.create') && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleNuevo}
            style={brandButtonStyle}
          >
            Nuevo Método
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
            placeholder="Buscar por método o técnica..."
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 280, ...brandSearchStyle }}
          />
          <Text type="secondary" style={{ fontSize: 13 }}>
            Total registros: <strong style={{ color: '#0f172a' }}>{metodosFiltrados?.length ?? 0}</strong>
          </Text>
        </div>
      }
    >
      <Table
        columns={columns}
        dataSource={metodosFiltrados || []}
        rowKey="id"
        loading={isLoading}
        scroll={{ x: 900 }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} métodos`,
        }}
      />

      {/* Modal */}
      <MetodoFormModal
        open={modalOpen}
        metodo={metodoSeleccionado}
        onCancel={() => {
          setModalOpen(false);
          setMetodoSeleccionado(null);
        }}
        onSubmit={handleSubmitForm}
        loading={crearMetodoMutation.isPending || actualizarMetodoMutation.isPending}
      />
    </ModulePageLayout>
  );
};

