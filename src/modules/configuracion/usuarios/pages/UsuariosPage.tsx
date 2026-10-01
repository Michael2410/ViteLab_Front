import { useState, useMemo } from 'react';
import {
  Button,
  Space,
  Typography,
  Input,
  Switch,
  Tag,
  App,
  Tooltip,
  Tabs,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  MailOutlined,
  ApartmentOutlined,
  TeamOutlined,
  IdcardOutlined,
  PhoneOutlined,
  UserAddOutlined,
  KeyOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useUsuarios, useCrearUsuario, useActualizarUsuario, useEliminarUsuario, useAdminReset2FA } from '../hooks';
import { usePersonalList } from '../../../personal/hooks';
import type { Personal } from '../../../personal/types';
import { usePermissions } from '../../../../shared/components/PermissionGuard';
import { UsuarioFormModal } from '../components/UsuarioFormModal';
import type { Usuario, CreateUsuarioInput, UpdateUsuarioInput } from '../types';
import ModulePageLayout, { BrandCreateButton, brandButtonStyle, brandSearchStyle, renderTableFilterIcon } from '../../../../shared/components/ModulePageLayout';
import GlobalTable from '../../../../shared/components/GlobalTable';

const { Text } = Typography;

interface TabConfig {
  key: 'usuarios' | 'sin_cuenta';
  label: string;
  description: string;
}

const TABS_CONFIG: TabConfig[] = [
  {
    key: 'usuarios',
    label: 'Cuentas de Usuarios',
    description: 'Administración de credenciales de acceso, asignación de roles y permisos por sede',
  },
  {
    key: 'sin_cuenta',
    label: 'Colaboradores sin Cuenta',
    description: 'Personal activo registrado en Recursos Humanos pendiente de asignación de credenciales',
  },
];

export const UsuariosPage: React.FC = () => {
  const { modal } = App.useApp();
  const [activeTab, setActiveTab] = useState<'usuarios' | 'sin_cuenta'>('usuarios');
  const [searchText, setSearchText] = useState('');
  const [searchPersonalText, setSearchPersonalText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null);

  const { hasPermission } = usePermissions();
  const canCreate = hasPermission('auth.users.create');
  const canUpdate = hasPermission('auth.users.update');
  const canDelete = hasPermission('auth.users.delete');

  const { data: usuarios, isLoading } = useUsuarios();
  const { data: personalList = [], isLoading: isLoadingPersonal } = usePersonalList({ activo: true });

  const crearUsuarioMutation = useCrearUsuario();
  const actualizarUsuarioMutation = useActualizarUsuario();
  const eliminarUsuarioMutation = useEliminarUsuario();
  const adminReset2FAMutation = useAdminReset2FA();

  // Colaboradores activos en RRHH sin cuenta de usuario
  const personalSinCuenta = useMemo(() => {
    return personalList.filter(
      (p) => !usuarios?.some((u) => u.personal_id === p.id)
    );
  }, [personalList, usuarios]);

  // Filtrar colaboradores sin cuenta
  const personalSinCuentaFiltrados = useMemo(() => {
    if (!searchPersonalText) return personalSinCuenta;
    const search = searchPersonalText.toLowerCase();
    return personalSinCuenta.filter(
      (p) =>
        p.nombres.toLowerCase().includes(search) ||
        p.apellidos.toLowerCase().includes(search) ||
        (p.numero_documento && p.numero_documento.toLowerCase().includes(search)) ||
        (p.cargo && p.cargo.toLowerCase().includes(search)) ||
        (p.area && p.area.toLowerCase().includes(search)) ||
        (p.email && p.email.toLowerCase().includes(search))
    );
  }, [personalSinCuenta, searchPersonalText]);

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

  const sugerirUsername = (colab: Personal) => {
    if (colab.email) {
      return colab.email.split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g, '');
    }
    const primerNombre = colab.nombres.trim().split(' ')[0].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const primerApellido = colab.apellidos.trim().split(' ')[0].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return `${primerNombre}.${primerApellido}`.replace(/[^a-z0-9._-]/g, '');
  };

  const handleCrearParaPersonal = (colab: Personal) => {
    setUsuarioSeleccionado({
      id: 0,
      username: sugerirUsername(colab),
      email: colab.email || '',
      nombres: colab.nombres,
      apellidos: colab.apellidos,
      rol_id: undefined as any,
      rol_nombre: '',
      rol_descripcion: '',
      personal_id: colab.id,
      sedes: colab.sedes || [],
      activo: true,
      created_at: '',
      updated_at: '',
    } as Usuario);
    setModalOpen(true);
  };

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
    if (!canUpdate) return;
    await actualizarUsuarioMutation.mutateAsync({
      id: usuario.id,
      data: { activo: !usuario.activo },
    });
  };

  const handleReset2FA = (usuario: Usuario) => {
    modal.confirm({
      title: '¿Restablecer 2FA de este usuario?',
      content: `Se restablecerá la configuración de doble factor para "${usuario.username}". En su próximo inicio de sesión se le solicitará vincular su aplicación autenticadora nuevamente.`,
      okText: 'Restablecer',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        await adminReset2FAMutation.mutateAsync(usuario.id);
      },
    });
  };

  const handleSubmitForm = async (data: CreateUsuarioInput | UpdateUsuarioInput) => {
    if (usuarioSeleccionado && usuarioSeleccionado.id > 0) {
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
      title: 'Usuario',
      dataIndex: 'username',
      key: 'username',
      width: 140,
      render: (username: string) => <Text strong style={{ color: '#0f172a' }}>{username}</Text>,
    },
    {
      title: 'Nombre Completo',
      key: 'nombre_completo',
      width: 190,
      render: (_, record: Usuario) => (
        <Text style={{ fontWeight: 500 }}>{`${record.nombres} ${record.apellidos}`}</Text>
      ),
    },
    {
      title: 'Personal (RRHH)',
      key: 'personal',
      width: 210,
      render: (_, record: Usuario) => {
        const vinculado = record.personal || personalList.find((p) => p.id === record.personal_id);
        if (vinculado) {
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: '#0f172a', fontSize: 12.5 }}>
                <TeamOutlined style={{ color: '#059669' }} />
                <span>{vinculado.nombres} {vinculado.apellidos}</span>
              </div>
              <span style={{ fontSize: 11, color: '#64748b' }}>
                {vinculado.cargo || 'Colaborador'} {vinculado.numero_documento ? `• ${vinculado.numero_documento}` : ''}
              </span>
            </div>
          );
        }
        return (
          <Tag style={{ borderRadius: 6, fontSize: 10.5, backgroundColor: '#f8fafc', color: '#94a3b8', borderColor: '#e2e8f0' }}>
            Cuenta directa
          </Tag>
        );
      },
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 200,
      render: (email: string) => (
        <Space size={6}>
          <MailOutlined style={{ color: '#0284c7' }} />
          <Text ellipsis style={{ fontSize: 12.5 }}>{email}</Text>
        </Space>
      ),
    },
    {
      title: 'Rol',
      dataIndex: 'rol_nombre',
      key: 'rol_nombre',
      width: 130,
      filters: Array.from(new Set(usuarios?.map((u) => u.rol_nombre).filter(Boolean) || [])).map((rol) => ({
        text: rol,
        value: rol,
      })),
      onFilter: (value, record) => record.rol_nombre === value,
      filterIcon: (filtered) => renderTableFilterIcon(filtered),
      render: (rol_nombre: string) => (
        <Tag
          style={{
            backgroundColor: '#eff6ff',
            borderColor: '#bfdbfe',
            color: '#1d4ed8',
            borderRadius: 6,
            fontWeight: 600,
            fontSize: 11,
          }}
        >
          {rol_nombre}
        </Tag>
      ),
    },
    {
      title: 'Sedes Permitidas',
      key: 'sedes',
      width: 180,
      render: (_, record: Usuario) => (
        <Space size={[0, 4]} wrap>
          {record.sedes && record.sedes.length > 0 ? (
            record.sedes.map((s) => (
              <Tag
                key={s.id}
                icon={<ApartmentOutlined style={{ color: '#0284c7' }} />}
                style={{
                  backgroundColor: '#f0fdfa',
                  borderColor: '#99f6e4',
                  color: '#0d9488',
                  borderRadius: 6,
                  fontSize: 10.5,
                  padding: '1px 6px',
                }}
              >
                {s.nombre}
              </Tag>
            ))
          ) : (
            <span style={{ fontSize: 11, color: '#94a3b8' }}>Todas las sedes</span>
          )}
        </Space>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'activo',
      key: 'activo',
      width: 110,
      align: 'center',
      filters: [
        { text: 'Activo', value: true },
        { text: 'Inactivo', value: false },
      ],
      onFilter: (value, record) => record.activo === value,
      filterIcon: (filtered) => renderTableFilterIcon(filtered),
      render: (activo: boolean, record: Usuario) => (
        <Switch
          checked={activo}
          onChange={() => handleToggleActivo(record)}
          checkedChildren="Activo"
          unCheckedChildren="Inactivo"
          disabled={!canUpdate}
        />
      ),
    },
    {
      title: '2FA (TOTP)',
      dataIndex: 'two_factor_enabled',
      key: 'two_factor_enabled',
      width: 120,
      align: 'center',
      filters: [
        { text: 'Activado', value: true },
        { text: 'Pendiente', value: false },
      ],
      onFilter: (value, record) => !!record.two_factor_enabled === value,
      filterIcon: (filtered) => renderTableFilterIcon(filtered),
      render: (enabled?: boolean) => (
        <Tag
          color={enabled ? 'success' : 'default'}
          style={{
            borderRadius: 6,
            fontWeight: 600,
            fontSize: 11,
            padding: '1px 8px',
          }}
        >
          {enabled ? 'Activado' : 'Pendiente'}
        </Tag>
      ),
    },
    {
      title: 'Fecha',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 110,
      render: (fecha: string) => (
        <span style={{ fontSize: 12, color: '#64748b' }}>
          {dayjs(fecha).format('DD/MM/YYYY')}
        </span>
      ),
    },
    ...(canUpdate || canDelete
      ? [
          {
            title: 'Acciones',
            key: 'acciones',
            width: 110,
            align: 'center' as const,
            render: (_: any, record: Usuario) => (
              <Space size="small">
                {canUpdate && (
                  <Tooltip title="Editar usuario">
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined style={{ color: '#0284c7' }} />}
                      onClick={() => handleEditar(record)}
                    />
                  </Tooltip>
                )}
                {canUpdate && record.two_factor_enabled && (
                  <Tooltip title="Restablecer 2FA (Re-vincular)">
                    <Button
                      type="text"
                      size="small"
                      icon={<KeyOutlined style={{ color: '#d97706' }} />}
                      onClick={() => handleReset2FA(record)}
                    />
                  </Tooltip>
                )}
                {canDelete && (
                  <Tooltip title="Eliminar usuario">
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleEliminar(record)}
                    />
                  </Tooltip>
                )}
              </Space>
            ),
          },
        ]
      : []),
  ];

  const columnsPersonalSinCuenta: ColumnsType<Personal> = [
    {
      title: 'Colaborador',
      key: 'colaborador',
      width: 220,
      render: (_, record: Personal) => (
        <Space direction="vertical" size={2}>
          <Text strong style={{ color: '#0f172a', fontSize: 13.5 }}>
            {record.nombres} {record.apellidos}
          </Text>
          <Space size={6}>
            <Tag style={{ borderRadius: 6, fontSize: 11, backgroundColor: '#f1f5f9', color: '#475569', borderColor: '#cbd5e1' }}>
              <IdcardOutlined style={{ marginRight: 4 }} />
              {record.tipo_documento}: {record.numero_documento || 'S/N'}
            </Tag>
          </Space>
        </Space>
      ),
    },
    {
      title: 'Cargo y Área',
      key: 'cargo_area',
      width: 200,
      filters: Array.from(new Set(personalSinCuenta.map((p) => p.area).filter(Boolean) as string[])).map((area) => ({
        text: area,
        value: area,
      })),
      onFilter: (value, record) => record.area === value,
      filterIcon: (filtered) => renderTableFilterIcon(filtered),
      render: (_, record: Personal) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontWeight: 600, color: '#334155', fontSize: 13 }}>
            {record.cargo || 'Sin cargo asignado'}
          </span>
          {record.area ? (
            <Tag color="cyan" style={{ width: 'fit-content', borderRadius: 6, fontSize: 11 }}>
              {record.area}
            </Tag>
          ) : (
            <span style={{ fontSize: 11, color: '#94a3b8' }}>Sin área</span>
          )}
        </div>
      ),
    },
    {
      title: 'Contacto',
      key: 'contacto',
      width: 220,
      render: (_, record: Personal) => (
        <Space direction="vertical" size={2}>
          {record.email ? (
            <Space size={6}>
              <MailOutlined style={{ color: '#0284c7' }} />
              <Text ellipsis style={{ fontSize: 12.5, maxWidth: 190 }}>{record.email}</Text>
            </Space>
          ) : (
            <Tag color="orange" style={{ borderRadius: 6, fontSize: 11 }}>Sin correo registrado</Tag>
          )}
          {record.telefono && (
            <Space size={6}>
              <PhoneOutlined style={{ color: '#10b981' }} />
              <span style={{ fontSize: 12, color: '#64748b' }}>{record.telefono}</span>
            </Space>
          )}
        </Space>
      ),
    },
    {
      title: 'Sedes',
      key: 'sedes',
      width: 180,
      render: (_, record: Personal) => (
        <Space size={[0, 4]} wrap>
          {record.sedes && record.sedes.length > 0 ? (
            record.sedes.map((s) => (
              <Tag
                key={s.id}
                icon={<ApartmentOutlined style={{ color: '#0284c7' }} />}
                style={{
                  backgroundColor: '#f0fdfa',
                  borderColor: '#99f6e4',
                  color: '#0d9488',
                  borderRadius: 6,
                  fontSize: 10.5,
                  padding: '1px 6px',
                }}
              >
                {s.nombre}
              </Tag>
            ))
          ) : (
            <span style={{ fontSize: 11, color: '#94a3b8' }}>Todas las sedes</span>
          )}
        </Space>
      ),
    },
    {
      title: 'Acción',
      key: 'accion',
      width: 140,
      align: 'center' as const,
      render: (_, record: Personal) => (
        <Button
          type="primary"
          size="small"
          icon={<UserAddOutlined />}
          style={{ ...brandButtonStyle, fontSize: 12 }}
          onClick={() => handleCrearParaPersonal(record)}
          disabled={!canCreate}
        >
          Crear Cuenta
        </Button>
      ),
    },
  ];

  const currentTabConfig = TABS_CONFIG.find((t) => t.key === activeTab) || TABS_CONFIG[0];

  return (
    <ModulePageLayout
      title="Usuarios del Sistema"
      subtitle={currentTabConfig.description}
      actionButton={
        <Space size="middle" wrap>
          {activeTab === 'usuarios' ? (
            <>
              <Input
                placeholder="Buscar usuario, nombre o email..."
                prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                allowClear
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 280, ...brandSearchStyle }}
              />
              {canCreate && (
                <BrandCreateButton onClick={handleNuevo}>
                  Nuevo Usuario
                </BrandCreateButton>
              )}
            </>
          ) : (
            <Input
              placeholder="Buscar colaborador, documento o área..."
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              allowClear
              value={searchPersonalText}
              onChange={(e) => setSearchPersonalText(e.target.value)}
              style={{ width: 320, ...brandSearchStyle }}
            />
          )}
        </Space>
      }
      extraHeader={
        <div style={{ backgroundColor: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '6px 16px 0 16px' }}>
          <Tabs
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key as 'usuarios' | 'sin_cuenta')}
            items={TABS_CONFIG.map((t) => ({
              key: t.key,
              label: (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 6px' }}>
                  <span style={{ fontWeight: 600 }}>{t.label}</span>
                  {t.key === 'usuarios' && (
                    <Tag style={{ margin: 0, borderRadius: 10, fontSize: 11, backgroundColor: '#f1f5f9', color: '#475569' }}>
                      {usuarios?.length ?? 0}
                    </Tag>
                  )}
                  {t.key === 'sin_cuenta' && personalSinCuenta.length > 0 && (
                    <Tag color="warning" style={{ margin: 0, borderRadius: 10, fontSize: 11, fontWeight: 600 }}>
                      {personalSinCuenta.length}
                    </Tag>
                  )}
                </span>
              ),
            }))}
          />
        </div>
      }
    >
      {activeTab === 'usuarios' && (
        <GlobalTable<Usuario>
          resourceName="configuracion-usuarios"
          columns={columns}
          dataSource={usuariosFiltrados || []}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total: number) => `Total ${total} usuarios`,
          }}
        />
      )}

      {activeTab === 'sin_cuenta' && (
        <GlobalTable<Personal>
          resourceName="configuracion-usuarios-pendientes"
          columns={columnsPersonalSinCuenta}
          dataSource={personalSinCuentaFiltrados}
          rowKey="id"
          loading={isLoadingPersonal}
          scroll={{ x: 1000 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total: number) => `Total ${total} colaboradores sin cuenta`,
          }}
          locale={{
            emptyText: '¡Excelente! Todos los colaboradores activos de RRHH ya cuentan con acceso al sistema.',
          }}
        />
      )}

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
    </ModulePageLayout>
  );
};
