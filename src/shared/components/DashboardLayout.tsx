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
  Grid,
  Tooltip,
  Badge,
  type MenuProps
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
  BarChartOutlined,
  WhatsAppOutlined
} from '@ant-design/icons';
import { useState, useMemo, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../../modules/auth/hooks';
import HeaderAlertas from './HeaderAlertas';
import { usePermissions } from './PermissionGuard';
import { WhatsAppQRModal, useWhatsAppStatus } from '../../modules/whatsapp';

const { Header, Sider, Content, Footer } = Layout;
const { Text } = Typography;
const { useBreakpoint } = Grid; // Destructure useBreakpoint

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clearAuth } = useAuthStore();
  const { token } = theme.useToken();
  const { hasPermission, hasAnyPermission, isSuperAdmin } = usePermissions();
  const { data: whatsappStatus } = useWhatsAppStatus();

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

    if (currentPath === '/') return 'dashboard';

    // Ordenar entradas por longitud de ruta descendente para que las más específicas (/ordenes/nueva) se evalúen antes que las genéricas (/ordenes)
    const sortedEntries = Object.entries(routeMap).sort((a, b) => b[1].length - a[1].length);

    for (const [key, route] of sortedEntries) {
      if (route === '/dashboard') continue;
      if (currentPath === route || currentPath.startsWith(route + '/')) {
        return key;
      }
    }

    return 'dashboard';
  }, [location.pathname]);

  const [openKeys, setOpenKeys] = useState<string[]>([]);

  useEffect(() => {
    if (activeKey.includes('-')) {
      const parentKey = activeKey.split('-')[0];
      setOpenKeys((prev) => (prev.includes(parentKey) ? prev : [...prev, parentKey]));
    }
  }, [activeKey]);

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

  const userMenuItems: MenuProps['items'] = [
    { key: 'profile', icon: <UserOutlined />, label: 'Mi Perfil', onClick: () => navigate('/perfil') },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Cerrar Sesión', onClick: handleLogout, danger: true },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#f4f7fb' }}>
      <style>{`
        /* Sidebar Menu Styles */
        .vitelab-sider-menu.ant-menu-dark {
          background: transparent !important;
        }
        .vitelab-sider-menu .ant-menu-item,
        .vitelab-sider-menu .ant-menu-submenu-title {
          border-radius: 8px !important;
          margin: 4px 8px !important;
          width: calc(100% - 16px) !important;
          transition: all 0.2s ease !important;
        }
        .vitelab-sider-menu .ant-menu-item .ant-menu-item-icon,
        .vitelab-sider-menu .ant-menu-submenu-title .ant-menu-item-icon {
          font-size: 16px !important;
          min-width: 16px !important;
          text-align: center !important;
        }
        .vitelab-sider-menu .ant-menu-item-selected {
          background: linear-gradient(90deg, rgba(37, 99, 235, 0.3) 0%, rgba(37, 99, 235, 0.08) 100%) !important;
          border-left: 3px solid #38bdf8 !important;
          color: #ffffff !important;
          font-weight: 600 !important;
        }
        .vitelab-sider-menu .ant-menu-item:hover,
        .vitelab-sider-menu .ant-menu-submenu-title:hover {
          color: #ffffff !important;
          background: rgba(255, 255, 255, 0.06) !important;
        }
        .vitelab-sider-menu .ant-menu-submenu-selected > .ant-menu-submenu-title {
          color: #38bdf8 !important;
        }
        .user-dropdown-trigger:hover {
          background: rgba(226, 232, 240, 0.9) !important;
        }
        .btn-header-wsp-connected {
          color: #25D366 !important;
          background: rgba(37, 211, 102, 0.08) !important;
        }
        .btn-header-wsp-connected:hover {
          color: #25D366 !important;
          background: rgba(37, 211, 102, 0.16) !important;
        }
        .btn-header-wsp-neutral {
          color: #64748b !important;
        }
        .btn-header-wsp-neutral:hover {
          color: #1e293b !important;
          background: rgba(0, 0, 0, 0.04) !important;
        }
      `}</style>

      {/* SIDER */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={260}
        style={{
          background: '#070f1e',
          borderRight: '1px solid rgba(255, 255, 255, 0.07)',
          overflow: 'hidden',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
          boxShadow: '4px 0 20px rgba(0, 0, 0, 0.2)'
        }}
      >
        {/* Logo Header */}
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? '0' : '0 18px',
          background: '#050a14',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          transition: 'all 0.25s ease',
          gap: 12
        }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(14, 165, 233, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            flexShrink: 0
          }}>
            <ExperimentOutlined style={{ fontSize: 20, color: '#ffffff' }} />
          </div>
          {!collapsed && (
            <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#ffffff', letterSpacing: '0.4px', lineHeight: 1.1 }}>
                ViteLab
              </div>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#38bdf8', letterSpacing: '1.4px', textTransform: 'uppercase', marginTop: 2 }}>
                Clinical LIMS
              </div>
            </div>
          )}
        </div>

        {/* Menu */}
        <div style={{ height: 'calc(100vh - 64px)', overflowY: 'auto' }}>
          <Menu
            theme="dark"
            mode="inline"
            className="vitelab-sider-menu"
            selectedKeys={[activeKey]}
            openKeys={collapsed ? [] : openKeys}
            onOpenChange={(keys) => setOpenKeys(keys)}
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
          flexDirection: 'column',
          background: '#f4f7fb'
        }}
      >
        {/* HEADER */}
        <Header
          style={{
            padding: '0 24px',
            background: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 99,
            borderBottom: '1px solid #e2e8f0',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
            height: 64
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: 17, width: 38, height: 38, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 14, color: '#475569' }}
            />
            <Breadcrumb items={breadcrumbItems} style={{ display: collapsed ? 'none' : 'flex' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Toolbar de Acciones: Alertas y WhatsApp */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <HeaderAlertas />
              
              <Tooltip title={whatsappStatus?.isConnected ? 'WhatsApp Conectado' : 'Vincular WhatsApp'}>
                <Badge
                  dot={Boolean(whatsappStatus?.isConnected)}
                  color="#25D366"
                  offset={[-4, 5]}
                >
                  <Button
                    type="text"
                    className={whatsappStatus?.isConnected ? 'btn-header-wsp-connected' : 'btn-header-wsp-neutral'}
                    icon={<WhatsAppOutlined style={{ fontSize: 19, color: whatsappStatus?.isConnected ? '#25D366' : '#64748b' }} />}
                    onClick={() => setWhatsappModalOpen(true)}
                    style={{ 
                      width: 38, 
                      height: 38, 
                      borderRadius: 8, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: whatsappStatus?.isConnected ? '#25D366' : '#64748b',
                      background: whatsappStatus?.isConnected ? 'rgba(37, 211, 102, 0.08)' : 'transparent',
                      transition: 'all 0.2s ease',
                    }}
                  />
                </Badge>
              </Tooltip>
            </div>

            {/* Separador vertical sutil */}
            <div style={{ width: 1, height: 22, backgroundColor: '#e2e8f0', margin: '0 2px' }} />

            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  padding: '4px 12px 4px 6px',
                  borderRadius: 24,
                  transition: 'all 0.2s',
                  background: 'rgba(241, 245, 249, 0.85)',
                  border: '1px solid #e2e8f0',
                }}
                className="user-dropdown-trigger"
              >
                <Avatar
                  size={32}
                  icon={<UserOutlined />}
                  style={{
                    background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
                    boxShadow: '0 2px 8px rgba(14, 165, 233, 0.35)',
                    marginRight: screens.md ? 10 : 0
                  }}
                />
                {screens.md && (
                  <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                      {user?.nombres || 'Usuario'}
                    </div>
                    <Tag color="blue" style={{ margin: '2px 0 0 0', fontSize: 10, lineHeight: '15px', padding: '0 6px', border: 0, borderRadius: 4 }}>
                      {user?.rol_nombre || 'Usuario'}
                    </Tag>
                  </div>
                )}
              </div>
            </Dropdown>
          </div>
        </Header>

        {/* CONTENT WRAPPER */}
        <Content
          style={{
            margin: '20px 24px 0',
            minHeight: 280,
            background: 'transparent',
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
            padding: '20px 24px',
            marginTop: 'auto'
          }}
        >
          <Space direction="vertical" size={2}>
            <Text type="secondary" style={{ fontSize: 12, color: '#64748b' }}>
              © {new Date().getFullYear()} ViteLab Systems — Plataforma de Gestión Clínica
            </Text>
            <Text type="secondary" style={{ fontSize: 11, color: '#94a3b8' }}>
              v1.0.0
            </Text>
          </Space>
        </Footer>
      </Layout>

      {/* Modal de WhatsApp */}
      <WhatsAppQRModal
        open={whatsappModalOpen}
        onClose={() => setWhatsappModalOpen(false)}
      />
    </Layout>
  );
}