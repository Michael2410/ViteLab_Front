import {
  Layout,
  Menu,
  Button,
  Avatar,
  Dropdown,
  Typography,
  Breadcrumb,
  theme,
  Space,
  Tag,
  Grid // Import Grid to use breakpoints
} from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  FileTextOutlined,
  ExperimentOutlined,
  DatabaseOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
  CheckSquareOutlined,
  TeamOutlined,
  HomeOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { useState, useMemo } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../../modules/auth/hooks';
import HeaderAlertas from './HeaderAlertas';
import { usePermissions } from './PermissionGuard';

const { Header, Sider, Content, Footer } = Layout;
const { Text } = Typography;
const { useBreakpoint } = Grid; // Destructure useBreakpoint

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clearAuth } = useAuthStore();
  const { token } = theme.useToken();
  const { hasPermission, hasAnyPermission, isSuperAdmin } = usePermissions();

  // Hook to detect screen size
  const screens = useBreakpoint();

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  // --- Menu Configuration con permisos ---
  const menuItems = useMemo(() => {
    const items: any[] = [];

    // Dashboard - siempre visible (o permiso dashboard.read)
    if (isSuperAdmin || hasPermission('dashboard.read')) {
      items.push({ key: 'dashboard', icon: <DashboardOutlined />, label: 'Dashboard' });
    }

    // Órdenes
    if (isSuperAdmin || hasAnyPermission(['orders.read', 'orders.create'])) {
      const ordenesChildren = [];
      if (isSuperAdmin || hasPermission('orders.create')) {
        ordenesChildren.push({ key: 'ordenes-nueva', label: 'Nueva Orden' });
      }
      if (isSuperAdmin || hasPermission('orders.read')) {
        ordenesChildren.push({ key: 'ordenes-listado', label: 'Listado' });
      }
      if (ordenesChildren.length > 0) {
        items.push({
          key: 'ordenes',
          icon: <FileTextOutlined />,
          label: 'Órdenes',
          children: ordenesChildren,
        });
      }
    }

    // Resultados
    if (isSuperAdmin || hasAnyPermission(['results.read', 'results.create', 'results.update'])) {
      items.push({ key: 'resultados', icon: <ExperimentOutlined />, label: 'Resultados' });
    }

    // Aprobaciones
    if (isSuperAdmin || hasPermission('results.approve')) {
      items.push({ key: 'aprobaciones', icon: <CheckSquareOutlined />, label: 'Aprobaciones' });
    }

    // Catálogos
    if (isSuperAdmin || hasAnyPermission([
      'catalogs.areas.read', 'catalogs.methods.read', 'catalogs.sedes.read',
      'catalogs.tipos-cliente.read', 'catalogs.components.read', 'catalogs.analysis.read',
      'catalogs.convenios.read', 'tariffs.read', 'catalogs.muestras.read'
    ])) {
      const catalogosChildren = [];
      if (isSuperAdmin || hasPermission('catalogs.areas.read')) {
        catalogosChildren.push({ key: 'catalogos-areas', label: 'Áreas' });
      }
      if (isSuperAdmin || hasPermission('catalogs.methods.read')) {
        catalogosChildren.push({ key: 'catalogos-metodos', label: 'Métodos' });
      }
      if (isSuperAdmin || hasPermission('catalogs.sedes.read')) {
        catalogosChildren.push({ key: 'catalogos-sedes', label: 'Sedes' });
      }
      if (isSuperAdmin || hasPermission('catalogs.tipos-cliente.read')) {
        catalogosChildren.push({ key: 'catalogos-tipos-cliente', label: 'Tipos de Cliente' });
      }
      if (isSuperAdmin || hasPermission('catalogs.components.read')) {
        catalogosChildren.push({ key: 'catalogos-componentes', label: 'Componentes' });
      }
      if (isSuperAdmin || hasPermission('catalogs.analysis.read')) {
        catalogosChildren.push({ key: 'catalogos-analisis', label: 'Análisis' });
      }
      if (isSuperAdmin || hasPermission('catalogs.convenios.read')) {
        catalogosChildren.push({ key: 'catalogos-convenios', label: 'Convenios' });
      }
      if (isSuperAdmin || hasPermission('tariffs.read')) {
        catalogosChildren.push({ key: 'catalogos-tarifarios', label: 'Tarifarios' });
      }
      if (isSuperAdmin || hasPermission('catalogs.muestras.read')) {
        catalogosChildren.push({ key: 'catalogos-muestras', label: 'Muestras' });
      }
      if (catalogosChildren.length > 0) {
        items.push({
          key: 'catalogos',
          icon: <DatabaseOutlined />,
          label: 'Catálogos',
          children: catalogosChildren,
        });
      }
    }

    // Usuarios
    if (isSuperAdmin || hasPermission('auth.users.read')) {
      items.push({ key: 'usuarios', icon: <TeamOutlined />, label: 'Usuarios' });
    }

    // Reportes
    if (isSuperAdmin || hasPermission('reports.read')) {
      items.push({ key: 'reportes', icon: <BarChartOutlined />, label: 'Reportes' });
    }

    // Configuración
    if (isSuperAdmin || hasAnyPermission(['auth.roles.read', 'settings.read'])) {
      const configChildren = [];
      if (isSuperAdmin || hasPermission('auth.roles.read')) {
        configChildren.push({ key: 'settings-roles', label: 'Roles' });
      }
      if (isSuperAdmin || hasPermission('settings.read')) {
        configChildren.push({ key: 'settings-sistema', label: 'Sistema' });
      }
      if (configChildren.length > 0) {
        items.push({
          key: 'configuracion',
          icon: <SettingOutlined />,
          label: 'Configuración',
          children: configChildren,
        });
      }
    }

    return items;
  }, [user, hasPermission, hasAnyPermission, isSuperAdmin]);

  const routeMap: Record<string, string> = {
    'dashboard': '/dashboard',
    'ordenes-nueva': '/ordenes/nueva',
    'ordenes-listado': '/ordenes',
    'resultados': '/resultados',
    'aprobaciones': '/aprobaciones',
    'catalogos-areas': '/catalogos/areas',
    'catalogos-metodos': '/catalogos/metodos',
    'catalogos-sedes': '/catalogos/sedes',
    'catalogos-tipos-cliente': '/catalogos/tipos-cliente',
    'catalogos-componentes': '/catalogos/componentes',
    'catalogos-analisis': '/catalogos/analisis',
    'catalogos-convenios': '/catalogos/convenios',
    'catalogos-tarifarios': '/catalogos/tarifarios',
    'catalogos-muestras': '/catalogos/muestras',
    'usuarios': '/usuarios',
    'reportes': '/reportes',
    'settings-roles': '/settings/roles',
    'settings-sistema': '/settings/sistema',
  };

  const activeKey = useMemo(() => {
    const currentPath = location.pathname;
    let bestMatchKey = 'dashboard';

    if (currentPath === '/') return 'dashboard';

    Object.entries(routeMap).forEach(([key, route]) => {
      if (currentPath.startsWith(route) && route !== '/dashboard') {
        bestMatchKey = key;
      }
    });

    return bestMatchKey;
  }, [location.pathname]);

  const breadcrumbItems = useMemo(() => {
    const pathSnippets = location.pathname.split('/').filter((i) => i);
    const items = [
      { title: <Link to="/dashboard"><HomeOutlined /></Link> }
    ];

    pathSnippets.forEach((snippet, index) => {
      const url = `/${pathSnippets.slice(0, index + 1).join('/')}`;
      const title = snippet.charAt(0).toUpperCase() + snippet.slice(1);
      items.push({ title: <Link to={url}>{title}</Link> });
    });
    return items;
  }, [location.pathname]);

  const handleMenuClick = (info: { key: string }) => {
    const route = routeMap[info.key];
    if (route) navigate(route);
  };

  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: 'Mi Perfil', onClick: () => navigate('/perfil') },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Cerrar Sesión', onClick: handleLogout, danger: true },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* SIDER */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={260}
        style={{
          background: '#001529',
          overflow: 'hidden',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
          boxShadow: '2px 0 8px rgba(0,0,0,0.15)'
        }}
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#002140',
          transition: 'all 0.2s'
        }}>
          <Space>
            <span style={{ fontSize: 24 }}>🧪</span>
            {!collapsed && (
              <Text strong style={{ color: 'white', fontSize: 18, whiteSpace: 'nowrap' }}>
                ViteLab <span style={{ fontWeight: 300, opacity: 0.7 }}>LIMS</span>
              </Text>
            )}
          </Space>
        </div>

        <div style={{ height: 'calc(100vh - 64px)', overflowY: 'auto' }}>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[activeKey]}
            defaultOpenKeys={activeKey.includes('-') ? [activeKey.split('-')[0]] : []}
            items={menuItems}
            onClick={handleMenuClick}
            style={{ borderRight: 0, padding: '8px 0' }}
          />
        </div>
      </Sider>

      {/* MAIN LAYOUT */}
      <Layout
        style={{
          marginLeft: collapsed ? 80 : 260,
          transition: 'margin-left 0.2s ease',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* HEADER */}
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 99,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            height: 64
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: 16, width: 40, height: 40, marginRight: 16 }}
            />
            <Breadcrumb items={breadcrumbItems} style={{ display: collapsed ? 'none' : 'flex' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginTop: 20 }}>
            <HeaderAlertas />
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginTop: -20 }}>
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    borderRadius: 8,
                    transition: 'background 0.3s'
                  }}
                  className="user-dropdown-trigger"
                >
                  {/* Corrected logic for responsiveness */}
                  <div style={{
                    textAlign: 'right',
                    marginRight: 12,
                    lineHeight: 1.2,
                    display: screens.md ? 'block' : 'none'
                  }}>
                    <Text strong style={{ display: 'block', color: token.colorTextHeading }}>{user?.nombres}</Text>
                    <Tag color="blue" style={{ margin: 0, fontSize: 10, lineHeight: '16px', border: 0 }}>
                      {user?.rol_nombre || 'Usuario'}
                    </Tag>
                  </div>
                  <Avatar
                    size="large"
                    icon={<UserOutlined />}
                    style={{ backgroundColor: token.colorPrimary, boxShadow: `0 2px 8px ${token.colorPrimary}40` }}
                  />
                </div>
              </Dropdown>
            </div>
          </div>
        </Header>

        {/* CONTENT WRAPPER */}
        <Content
          style={{
            margin: '24px 24px 0',
            minHeight: 280,
            background: token.colorBgContainer,
            borderRadius: token.borderRadiusLG,
            flex: 1,
            overflow: 'initial'
          }}
        >
          <Outlet />
        </Content>

        {/* FOOTER */}
        <Footer
          style={{
            textAlign: 'center',
            background: 'transparent',
            padding: '16px 24px',
            marginTop: 'auto'
          }}
        >
          <Space direction="vertical" size={0}>
            <Text type="secondary" style={{ fontSize: 13 }}>
              ViteLab LIMS ©{new Date().getFullYear()}
            </Text>
            <Text type="secondary" style={{ fontSize: 11, opacity: 0.7 }}>
              Sistema de Gestión de Laboratorio Clínico v1.0.0
            </Text>
          </Space>
        </Footer>
      </Layout>
    </Layout>
  );
}