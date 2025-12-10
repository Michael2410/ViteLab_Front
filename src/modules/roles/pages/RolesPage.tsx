import { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Typography,
  Tooltip,
  Popconfirm,
  App,
  Input,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useRoles, useEliminarRol } from '../hooks';
import { useAuthStore } from '../../auth/hooks';
import { RolFormModal } from '../components/RolFormModal';
import type { Rol } from '../types';

const { Title, Text } = Typography;

export function RolesPage() {
  const { message } = App.useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const [rolEditar, setRolEditar] = useState<Rol | null>(null);
  const [searchText, setSearchText] = useState('');

  const { hasPermission } = useAuthStore();
  const { data: roles, isLoading, refetch } = useRoles();
  const eliminarRolMutation = useEliminarRol();

  const rolesFiltrados = roles?.filter((rol) =>
    rol.nombre.toLowerCase().includes(searchText.toLowerCase()) ||
    rol.descripcion?.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleCrear = () => {
    setRolEditar(null);
    setModalVisible(true);
  };

  const handleEditar = (rol: Rol) => {
    setRolEditar(rol);
    setModalVisible(true);
  };

  const handleEliminar = async (id: number) => {
    try {
      await eliminarRolMutation.mutateAsync(id);
      message.success('Rol eliminado exitosamente');
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Error al eliminar el rol');
    }
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setRolEditar(null);
  };

  const handleModalSuccess = () => {
    setModalVisible(false);
    setRolEditar(null);
    refetch();
  };

  // Determinar si un rol es del sistema (no editable/eliminable)
  const esRolSistema = (nombre: string) => ['SUPER_ADMIN', 'ADMIN'].includes(nombre);

  const columns: ColumnsType<Rol> = [
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
      width: 180,
      render: (nombre: string) => (
        <Space>
          <SafetyCertificateOutlined style={{ color: esRolSistema(nombre) ? '#faad14' : '#1890ff' }} />
          <Text strong>{nombre}</Text>
          {esRolSistema(nombre) && (
            <Tag color="gold" style={{ marginLeft: 4 }}>Sistema</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Descripción',
      dataIndex: 'descripcion',
      key: 'descripcion',
      ellipsis: true,
      render: (descripcion: string | null) => descripcion || <Text type="secondary">Sin descripción</Text>,
    },
    {
      title: 'Usuarios',
      dataIndex: 'total_usuarios',
      key: 'total_usuarios',
      width: 100,
      align: 'center',
      render: (total: number) => (
        <Tooltip title={`${total} usuario(s) con este rol`}>
          <Space>
            <TeamOutlined />
            <span>{total}</span>
          </Space>
        </Tooltip>
      ),
    },
    {
      title: 'Permisos',
      dataIndex: 'permisos',
      key: 'permisos',
      width: 120,
      align: 'center',
      render: (permisos: string[]) => (
        <Tag color="blue">{permisos?.length || 0} permisos</Tag>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'activo',
      key: 'activo',
      width: 100,
      align: 'center',
      render: (activo: boolean) => (
        <Tag color={activo ? 'success' : 'default'}>
          {activo ? 'Activo' : 'Inactivo'}
        </Tag>
      ),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          {hasPermission('auth.roles.update') && (
            <Tooltip title="Editar">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => handleEditar(record)}
                disabled={esRolSistema(record.nombre) && record.nombre === 'SUPER_ADMIN'}
              />
            </Tooltip>
          )}
          {hasPermission('auth.roles.delete') && !esRolSistema(record.nombre) && (
            <Popconfirm
              title="¿Eliminar rol?"
              description={
                record.total_usuarios && record.total_usuarios > 0
                  ? 'Este rol tiene usuarios asignados. Reasígnelos primero.'
                  : '¿Estás seguro de eliminar este rol?'
              }
              onConfirm={() => handleEliminar(record.id)}
              okText="Sí"
              cancelText="No"
              disabled={(record.total_usuarios ?? 0) > 0}
            >
              <Tooltip title={(record.total_usuarios ?? 0) > 0 ? 'Tiene usuarios asignados' : 'Eliminar'}>
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  disabled={(record.total_usuarios ?? 0) > 0}
                />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <Title level={4} style={{ margin: 0 }}>
                <SafetyCertificateOutlined style={{ marginRight: 8 }} />
                Gestión de Roles
              </Title>
              <Text type="secondary">Administra los roles y permisos del sistema</Text>
            </div>
            {hasPermission('auth.roles.create') && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCrear}
              >
                Nuevo Rol
              </Button>
            )}
          </div>

          <Input
            placeholder="Buscar por nombre o descripción..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ maxWidth: 350 }}
            allowClear
          />
        </div>

        <Table
          columns={columns}
          dataSource={rolesFiltrados}
          rowKey="id"
          loading={isLoading}
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => `Total: ${total} roles`,
          }}
        />
      </Card>

      {/* Modal para crear/editar rol */}
      <RolFormModal
        visible={modalVisible}
        rol={rolEditar}
        onCancel={handleModalClose}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
