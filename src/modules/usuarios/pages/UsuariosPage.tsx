import { useState } from 'react';
import {
  Button,
  Space,
  Typography,
  Input,
  Switch,
  Tag,
  Avatar,
  App,
  Table,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  UserOutlined,
  MailOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useUsuarios, useCrearUsuario, useActualizarUsuario, useEliminarUsuario } from '../hooks';
import { useAuthStore } from '../../auth/hooks';
import { UsuarioFormModal } from '../components/UsuarioFormModal';
import type { Usuario, CreateUsuarioInput, UpdateUsuarioInput } from '../types';
import PageContainer from '../../../shared/components/PageContainer';

const { Title, Text } = Typography;

export const UsuariosPage: React.FC = () => {
  const { modal } = App.useApp();
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null);

  const { hasPermission } = useAuthStore();
  const { data: usuarios, isLoading } = useUsuarios();
  const crearUsuarioMutation = useCrearUsuario();
  const actualizarUsuarioMutation = useActualizarUsuario();
  const eliminarUsuarioMutation = useEliminarUsuario();

  // Filtrar usuarios localmente
  const usuariosFiltrados = usuarios?.filter((u) => {
    if (!searchText) return true;
    const search = searchText.toLowerCase();
    return (
      u.username.toLowerCase().includes(search) ||
      u.email.toLowerCase().includes(search) ||
      u.nombres.toLowerCase().includes(search) ||
      u.apellidos.toLowerCase().includes(search)
    );
  });

  const handleNuevo = () => {
    setUsuarioSeleccionado(null);
    setModalOpen(true);
  };

  const handleEditar = (usuario: Usuario) => {
    setUsuarioSeleccionado(usuario);
    setModalOpen(true);
  };

  const handleEliminar = (usuario: Usuario) => {
    modal.confirm({
      title: '¿Está seguro de eliminar este usuario?',
      content: `Se eliminará el usuario "${usuario.username}". Esta acción no se puede deshacer.`,
      okText: 'Eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        await eliminarUsuarioMutation.mutateAsync(usuario.id);
      },
    });
  };

  const handleToggleActivo = async (usuario: Usuario) => {
    if (!hasPermission('auth.users.update')) return;
    await actualizarUsuarioMutation.mutateAsync({
      id: usuario.id,
      data: { activo: !usuario.activo },
    });
  };

  const handleSubmitForm = async (data: CreateUsuarioInput | UpdateUsuarioInput) => {
    if (usuarioSeleccionado) {
      await actualizarUsuarioMutation.mutateAsync({
        id: usuarioSeleccionado.id,
        data: data as UpdateUsuarioInput,
      });
    } else {
      await crearUsuarioMutation.mutateAsync(data as CreateUsuarioInput);
    }
    setModalOpen(false);
    setUsuarioSeleccionado(null);
  };

  const columns: ColumnsType<Usuario> = [
    {
      title: 'Firma',
      dataIndex: 'firma_url',
      key: 'firma_url',
      width: 80,
      align: 'center',
      render: (firma_url: string | null) => (
        firma_url ? (
          <Avatar
            src={firma_url}
            size={40}
            shape="square"
            style={{ border: '1px solid #d9d9d9' }}
          />
        ) : (
          <Avatar
            icon={<UserOutlined />}
            size={40}
            shape="square"
            style={{ backgroundColor: '#1890ff' }}
          />
        )
      ),
    },
    {
      title: 'Usuario',
      dataIndex: 'username',
      key: 'username',
      width: 150,
      render: (username: string) => <Text strong>{username}</Text>,
    },
    {
      title: 'Nombre Completo',
      key: 'nombre_completo',
      width: 200,
      render: (_, record: Usuario) => (
        <Text>{`${record.nombres} ${record.apellidos}`}</Text>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 200,
      render: (email: string) => (
        <Space>
          <MailOutlined />
          <Text ellipsis>{email}</Text>
        </Space>
      ),
    },
    {
      title: 'Rol',
      dataIndex: 'rol_nombre',
      key: 'rol_nombre',
      width: 150,
      render: (rol_nombre: string) => (
        <Tag color="blue">{rol_nombre}</Tag>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'activo',
      key: 'activo',
      width: 120,
      align: 'center',
      render: (activo: boolean, record: Usuario) => (
        <Switch
          checked={activo}
          onChange={() => handleToggleActivo(record)}
          checkedChildren="Activo"
          unCheckedChildren="Inactivo"
          disabled={!hasPermission('auth.users.update')}
        />
      ),
    },
    {
      title: 'Fecha Creación',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 130,
      render: (fecha: string) => dayjs(fecha).format('DD/MM/YYYY'),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 120,
      align: 'center',
      render: (_, record: Usuario) => (
        <Space size="small">
          {hasPermission('auth.users.update') && (
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEditar(record)}
            />
          )}
          {hasPermission('auth.users.delete') && (
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
          <Title level={2} style={{ marginBottom: 4 }}>Usuarios</Title>
          <Text type="secondary">Gestión de usuarios del sistema</Text>
        </div>

        {/* Buscador + botón */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Input
            placeholder="Buscar por usuario, nombre o email..."
            prefix={<SearchOutlined />}
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 280 }}
          />

          {hasPermission('auth.users.create') && (
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={handleNuevo}
            >
              Nuevo Usuario
            </Button>
          )}
        </div>
      </div>

      {/* 🔵 Tabla */}
      <Table
        columns={columns}
        dataSource={usuariosFiltrados || []}
        rowKey="id"
        loading={isLoading}
        scroll={{ x: 1100 }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total: number) => `Total ${total} usuarios`,
        }}
      />

      {/* Modal */}
      <UsuarioFormModal
        open={modalOpen}
        usuario={usuarioSeleccionado}
        onCancel={() => {
          setModalOpen(false);
          setUsuarioSeleccionado(null);
        }}
        onSubmit={handleSubmitForm}
        loading={
          crearUsuarioMutation.isPending ||
          actualizarUsuarioMutation.isPending
        }
      />
    </PageContainer>
  );

};
