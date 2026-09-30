import { useState } from 'react';
import {
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
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useRoles, useEliminarRol } from '../hooks';
import { usePermissions } from '../../../../shared/components/PermissionGuard';
import { RolFormModal } from '../components/RolFormModal';
import type { Rol } from '../types';
import ModulePageLayout, { BrandCreateButton, brandSearchStyle, renderTableFilterIcon } from '../../../../shared/components/ModulePageLayout';
import GlobalTable from '../../../../shared/components/GlobalTable';

const { Text } = Typography;

export function RolesPage() {
  const { message } = App.useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const [rolEditar, setRolEditar] = useState<Rol | null>(null);
  const [searchText, setSearchText] = useState('');

  const { hasPermission } = usePermissions();
  const canCreate = hasPermission('auth.roles.create');
  const canUpdate = hasPermission('auth.roles.update');
  const canDelete = hasPermission('auth.roles.delete');

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
      filters: [
        { text: 'Activo', value: true },
        { text: 'Inactivo', value: false },
      ],
      onFilter: (value, record) => record.activo === value,
      filterIcon: (filtered) => renderTableFilterIcon(filtered),
      render: (activo: boolean) => (
        <Tag color={activo ? 'success' : 'default'}>
          {activo ? 'Activo' : 'Inactivo'}
        </Tag>
      ),
    },
    ...(canUpdate || canDelete
      ? [
          {
            title: 'Acciones',
            key: 'acciones',
            width: 120,
            align: 'center' as const,
            render: (_: any, record: Rol) => (
              <Space size="small">
                {canUpdate && (
                  <Tooltip title="Editar">
                    <Button
                      type="text"
                      icon={<EditOutlined />}
                      onClick={() => handleEditar(record)}
                      disabled={esRolSistema(record.nombre) && record.nombre === 'SUPER_ADMIN'}
                    />
                  </Tooltip>
                )}
                {canDelete && !esRolSistema(record.nombre) && (
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
        ]
      : []),
  ];

  return (
    <ModulePageLayout
      title="Gestión de Roles y Permisos"
      subtitle="Administración de perfiles de usuario, niveles de acceso y permisos del sistema"
      actionButton={
        <Space size="middle" wrap>
          <Input
            placeholder="Buscar rol o descripción..."
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 280, ...brandSearchStyle }}
            allowClear
          />
          {canCreate && (
            <BrandCreateButton onClick={handleCrear}>
              Nuevo Rol
            </BrandCreateButton>
          )}
        </Space>
      }
    >
      <GlobalTable<Rol>
        resourceName="configuracion-roles"
        columns={columns}
        dataSource={rolesFiltrados}
        rowKey="id"
        loading={isLoading}
        pagination={{
          showSizeChanger: true,
          showTotal: (total) => `Total: ${total} roles`,
        }}
      />

      {/* Modal para crear/editar rol */}
      <RolFormModal
        visible={modalVisible}
        rol={rolEditar}
        onCancel={handleModalClose}
        onSuccess={handleModalSuccess}
      />
    </ModulePageLayout>
  );
}
