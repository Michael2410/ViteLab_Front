import {
  Layout,
  Menu,
  Button,
  Avatar,
  Dropdown,
  Typography,
  Breadcrumb,
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
  LogoutOutlined,
  UserOutlined,
  HomeOutlined,
  WhatsAppOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import {
  IconDashboard,
  IconOrdenes,
  IconResultados,
  IconAprobaciones,
  IconReportes,
  IconAnalisisClinicos,
  IconParametrosLab,
  IconTarifasConvenios,
} from '../../../assets/icons/NavIcons';
import { useState, useMemo, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../../auth/hooks';
import HeaderAlertas from './components/HeaderAlertas';
import { usePermissions } from '../../../shared/components/PermissionGuard';
import { WhatsAppQRModal, useWhatsAppStatus } from '../whatsapp';
import viteLogo from '../../../assets/logo/logo.png';
import { AppSwitcher } from '../../../shared/components/AppSwitcher';

const { Header, Sider, Content, Footer } = Layout;
const { Text } = Typography;
const { useBreakpoint } = Grid; // Destructure useBreakpoint

export default function LaboratorioLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isDashboard = location.pathname === '/dashboard' || location.pathname === '/';
  const { user, clearAuth } = useAuthStore();
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
      items.push({ 
        key: 'dashboard', 
        icon: <IconDashboard width={22} height={22} />, 
        label: <span>Dashboard</span> 
      });
    }

    // Órdenes
    if (isSuperAdmin || hasAnyPermission(['orders.read', 'orders.create'])) {
      items.push({ 
        key: 'ordenes', 
        icon: <IconOrdenes width={22} height={22} />, 
        label: <span>Órdenes</span> 
      });
    }

    // Resultados
    if (isSuperAdmin || hasAnyPermission(['results.read', 'results.create', 'results.update'])) {
      items.push({ 
        key: 'resultados', 
        icon: <IconResultados width={22} height={22} />, 
        label: <span>Resultados</span> 
      });
    }

    // Aprobaciones
    if (isSuperAdmin || hasPermission('results.approve')) {
      items.push({ 
        key: 'aprobaciones', 
        icon: <IconAprobaciones width={22} height={22} />, 
        label: <span>Aprobaciones</span> 
      });
    }

    // Análisis Clínicos (Análisis + Componentes)
    if (isSuperAdmin || hasAnyPermission(['catalogs.analysis.read', 'catalogs.components.read'])) {
      items.push({ 
        key: 'analisis-clinicos', 
        icon: <IconAnalisisClinicos width={22} height={22} />, 
        label: <span>Análisis Clínicos</span> 
      });
    }

    // Parámetros del Lab (Áreas + Métodos + Muestras)
    if (isSuperAdmin || hasAnyPermission(['catalogs.areas.read', 'catalogs.methods.read', 'catalogs.muestras.read'])) {
      items.push({ 
        key: 'parametros-lab', 
        icon: <IconParametrosLab width={22} height={22} />, 
        label: <span>Parámetros</span> 
      });
    }

    // Tarifas & Convenios (Tarifarios + Convenios + Tipos de Cliente)
    if (isSuperAdmin || hasAnyPermission(['tariffs.read', 'catalogs.convenios.read', 'catalogs.tipos-cliente.read'])) {
      items.push({ 
        key: 'tarifas-convenios', 
        icon: <IconTarifasConvenios width={22} height={22} />, 
        label: <span>Tarifas & Convenios</span> 
      });
    }

    // Reportes
    if (isSuperAdmin || hasPermission('reports.read')) {
      items.push({ 
        key: 'reportes', 
        icon: <IconReportes width={22} height={22} />, 
        label: <span>Reportes</span> 
      });
    }

    return items;
  }, [user, hasPermission, hasAnyPermission, isSuperAdmin]);

  const routeMap: Record<string, string> = {
    'dashboard': '/dashboard',
    'ordenes': '/ordenes',
    'resultados': '/resultados',
    'aprobaciones': '/aprobaciones',
    'analisis-clinicos': '/analisis',
    'parametros-lab': '/parametros',
    'tarifas-convenios': '/tarifas-convenios',
    'reportes': '/reportes',
  };

  const activeKey = useMemo(() => {
    const currentPath = location.pathname;

    if (currentPath === '/') return 'dashboard';

    if (
      currentPath.startsWith('/analisis') ||
      currentPath.startsWith('/catalogos/analisis') ||
      currentPath.startsWith('/catalogos/componentes')
    ) {
      return 'analisis-clinicos';
    }
    if (
      currentPath.startsWith('/parametros') ||
      currentPath.startsWith('/catalogos/areas') ||
      currentPath.startsWith('/catalogos/metodos') ||
      currentPath.startsWith('/catalogos/muestras')
    ) {
      return 'parametros-lab';
    }
    if (
      currentPath.startsWith('/tarifas-convenios') ||
      currentPath.startsWith('/catalogos/tarifarios') ||
      currentPath.startsWith('/catalogos/convenios') ||
      currentPath.startsWith('/catalogos/tipos-cliente')
    ) {
      return 'tarifas-convenios';
    }

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
    {
      key: 'user-info',
      disabled: true,
      label: (
        <div style={{ padding: '4px 0' }}>
          <div style={{ fontWeight: 600, color: '#0f172a' }}>
            {user?.nombres} {user?.apellidos}
          </div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{user?.email}</div>
          <Tag color="cyan" style={{ marginTop: 4, fontSize: 10 }}>
            {user?.rol_nombre || 'Usuario'}
          </Tag>
        </div>
      ),
    },
    { type: 'divider' },
    {
      key: 'portal',
      label: 'Portal Principal',
      onClick: () => navigate('/portal'),
    },
    {
      key: 'personal',
      label: 'Personal & RRHH',
      onClick: () => navigate('/personal'),
    },
    {
      key: 'configuracion',
      label: 'Configuración & Seguridad',
      onClick: () => navigate('/configuracion/usuarios'),
    },
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Mi Perfil',
      onClick: () => navigate('/perfil'),
    },
    { type: 'divider' },
    {
      key: 'logout',
      danger: true,
      icon: <LogoutOutlined />,
      label: 'Cerrar Sesión',
      onClick: handleLogout,
    },
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
          font-size: 22px !important;
          min-width: 24px !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .vitelab-sider-menu .ant-menu-item .ant-menu-item-icon svg,
        .vitelab-sider-menu .ant-menu-submenu-title .ant-menu-item-icon svg {
          width: 22px !important;
          height: 22px !important;
        }
        .vitelab-sider-menu .ant-menu-item-selected {
          background: linear-gradient(90deg, rgba(16, 185, 129, 0.25) 0%, rgba(2, 132, 199, 0.1) 100%) !important;
          border-left: 3px solid #10b981 !important;
          color: #ffffff !important;
          font-weight: 600 !important;
        }
        .vitelab-sider-menu .ant-menu-item:hover,
        .vitelab-sider-menu .ant-menu-submenu-title:hover {
          color: #ffffff !important;
          background: rgba(255, 255, 255, 0.06) !important;
        }
        .vitelab-sider-menu .ant-menu-submenu-selected > .ant-menu-submenu-title {
          color: #10b981 !important;
        }
        .vitelab-sider-menu .ant-menu-sub .ant-menu-item-selected {
          background: linear-gradient(90deg, rgba(16, 185, 129, 0.2) 0%, rgba(2, 132, 199, 0.08) 100%) !important;
          border-left: 3px solid #10b981 !important;
          color: #ffffff !important;
          font-weight: 600 !important;
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
        width={250}
        collapsedWidth={76}
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
          boxShadow: '4px 0 20px rgba(0, 0, 0, 0.15)'
        }}
      >
        {/* Logo Header */}
        <div style={{
          height: 64,
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: '#050a14',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #0284c7 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            flexShrink: 0
          }}>
            <img src={viteLogo} alt="ViteLab" style={{ width: 26, height: 26, objectFit: 'contain' }} />
          </div>
          {!collapsed && (
            <div style={{ lineHeight: 1.2 }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#ffffff', letterSpacing: '0.4px' }}>
                ViteLab
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#34d399', letterSpacing: '1.2px', textTransform: 'uppercase', marginTop: 2 }}>
                Laboratorio Clínico
              </div>
            </div>
          )}
        </div>

        {/* Menu */}
        <div style={{ height: 'calc(100vh - 64px - 62px)', overflowY: 'auto' }}>
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

        {/* Regresar al portal */}
        <div style={{
          position: 'absolute',
          bottom: 16,
          left: 0,
          right: 0,
          padding: '0 14px',
        }}>
          <Button
            block
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/portal')}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              color: '#94a3b8',
              borderRadius: 8,
              height: 38,
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: 8,
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            {!collapsed && 'Ir al Portal'}
          </Button>
        </div>
      </Sider>

      {/* MAIN LAYOUT */}
      <Layout
        style={{
          marginLeft: collapsed ? 76 : 250,
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
              style={{
                fontSize: 17,
                width: 38,
                height: 38,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 14,
                color: '#475569'
              }}
            />
            <Breadcrumb items={breadcrumbItems} style={{ display: collapsed ? 'none' : 'flex' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Toolbar de Acciones: Alertas y WhatsApp */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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

            <AppSwitcher />

            {/* Separador vertical sutil */}
            <div style={{ width: 1, height: 22, backgroundColor: '#e2e8f0', margin: '0 2px' }} />

            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  cursor: 'pointer',
                  padding: '4px 12px 4px 6px',
                  borderRadius: 24,
                  backgroundColor: 'rgba(241, 245, 249, 0.85)',
                  border: '1px solid #e2e8f0',
                  transition: 'all 0.2s',
                }}
                className="user-dropdown-trigger"
              >
                <Avatar
                  size={30}
                  icon={<UserOutlined />}
                  style={{
                    background: 'linear-gradient(135deg, #0284c7 0%, #059669 100%)',
                    color: '#ffffff',
                    fontWeight: 600,
                  }}
                />
                {screens.sm && (
                  <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0f172a' }}>
                      {user?.nombres || 'Usuario'}
                    </div>
                    <Tag
                      style={{
                        margin: '1px 0 0',
                        fontSize: 9.5,
                        lineHeight: '13px',
                        padding: '0 4px',
                        borderRadius: 3,
                        border: '1px solid #a7f3d0',
                        backgroundColor: '#ecfdf5',
                        color: '#059669',
                        fontWeight: 600,
                      }}
                    >
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
            margin: isDashboard ? '12px 24px 0' : '20px 24px 0',
            minHeight: 280,
            background: 'transparent',
            flex: isDashboard ? 'none' : 1,
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
            padding: isDashboard ? '10px 24px 24px' : '20px 24px',
            marginTop: isDashboard ? 4 : 'auto'
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

export { LaboratorioLayout, LaboratorioLayout as DashboardLayout };