import React, { useState, useMemo } from 'react';
import {
  Layout,
  Menu,
  Button,
  Avatar,
  Dropdown,
  Tag,
  Grid,
  type MenuProps,
} from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  AppstoreOutlined,
  TeamOutlined,
  DatabaseOutlined,
  ImportOutlined,
  ExportOutlined,
  InboxOutlined,
  FileTextOutlined,
  HistoryOutlined,
  LogoutOutlined,
  UserOutlined,
  ArrowLeftOutlined,
  SwapOutlined,
  SlidersOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../auth/hooks';
import { usePermissions } from '../../../shared/components/PermissionGuard';
import { AppSwitcher } from '../../../shared/components/AppSwitcher';
import viteLogo from '../../../assets/logo/logo.png';

const { Header, Sider, Content } = Layout;
const { useBreakpoint } = Grid;

export const AlmacenLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { user, clearAuth } = useAuthStore();
  const { hasPermission, isSuperAdmin } = usePermissions();
  const screens = useBreakpoint();

  const handleLogout = () => {
    clearAuth();
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/login');
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'user-info',
      disabled: true,
      label: (
        <div style={{ padding: '4px 0' }}>
          <div style={{ fontWeight: 600, color: '#0f172a' }}>
            {user?.nombres ? `${user.nombres} ${user.apellidos || ''}` : user?.username}
          </div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{user?.email}</div>
          <Tag
            style={{
              marginTop: 4,
              fontSize: 10,
              backgroundColor: '#fef3c7',
              borderColor: '#fde68a',
              color: '#b45309',
              fontWeight: 600,
            }}
          >
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
      key: 'laboratorio',
      label: 'Laboratorio Clínico',
      onClick: () => navigate('/dashboard'),
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

  // Menú con permisos
  const menuItems: MenuProps['items'] = useMemo(() => {
    const items: MenuProps['items'] = [];

    // Catálogo de Productos
    if (isSuperAdmin || hasPermission('almacen.productos.read')) {
      items.push({
        key: 'productos',
        icon: <AppstoreOutlined style={{ fontSize: 18 }} />,
        label: <span style={{ marginLeft: 6 }}>Productos</span>,
      });
    }

    // Stock y Kardex
    if (isSuperAdmin || hasPermission('almacen.stock.read')) {
      items.push({
        key: 'stock',
        icon: <HistoryOutlined style={{ fontSize: 18 }} />,
        label: <span style={{ marginLeft: 6 }}>Stock & Kardex</span>,
      });
    }

    // Ingresos / Entradas
    if (isSuperAdmin || hasPermission('almacen.ingresos.read')) {
      items.push({
        key: 'ingresos',
        icon: <ImportOutlined style={{ fontSize: 18 }} />,
        label: <span style={{ marginLeft: 6 }}>Ingresos</span>,
      });
    }

    // Despachos
    if (isSuperAdmin || hasPermission('almacen.despachos.read')) {
      items.push({
        key: 'despachos',
        icon: <ExportOutlined style={{ fontSize: 18 }} />,
        label: <span style={{ marginLeft: 6 }}>Despachos</span>,
      });
    }

    // Mi Custodia & Consumos
    if (isSuperAdmin || hasPermission('almacen.custodia.read')) {
      items.push({
        key: 'custodia',
        icon: <InboxOutlined style={{ fontSize: 18 }} />,
        label: <span style={{ marginLeft: 6 }}>Mi Custodia & Consumos</span>,
      });
    }

    // Pedidos Internos
    if (isSuperAdmin || hasPermission('almacen.pedidos.read')) {
      items.push({
        key: 'pedidos',
        icon: <FileTextOutlined style={{ fontSize: 18 }} />,
        label: <span style={{ marginLeft: 6 }}>Pedidos Internos</span>,
      });
    }

    // Transferencias entre Almacenes
    if (isSuperAdmin || hasPermission('almacen.transferencias.read')) {
      items.push({
        key: 'transferencias',
        icon: <SwapOutlined style={{ fontSize: 18 }} />,
        label: <span style={{ marginLeft: 6 }}>Transferencias</span>,
      });
    }

    // Ajustes y Bajas de Inventario
    if (isSuperAdmin || hasPermission('almacen.ajustes.read')) {
      items.push({
        key: 'ajustes',
        icon: <SlidersOutlined style={{ fontSize: 18 }} />,
        label: <span style={{ marginLeft: 6 }}>Ajustes & Bajas</span>,
      });
    }

    // Proveedores
    if (isSuperAdmin || hasPermission('almacen.proveedores.read')) {
      items.push({
        key: 'proveedores',
        icon: <TeamOutlined style={{ fontSize: 18 }} />,
        label: <span style={{ marginLeft: 6 }}>Proveedores</span>,
      });
    }

    // Maestros y Catálogos
    if (isSuperAdmin || hasPermission('almacen.maestros.read')) {
      items.push({
        key: 'maestros',
        icon: <DatabaseOutlined style={{ fontSize: 18 }} />,
        label: <span style={{ marginLeft: 6 }}>Maestros</span>,
      });
    }

    return items;
  }, [hasPermission, isSuperAdmin]);

  // Selección activa del menú
  const selectedKey = useMemo(() => {
    const path = location.pathname;
    if (path.includes('/almacen/productos')) return 'productos';
    if (path.includes('/almacen/stock')) return 'stock';
    if (path.includes('/almacen/ingresos')) return 'ingresos';
    if (path.includes('/almacen/despachos')) return 'despachos';
    if (path.includes('/almacen/custodia')) return 'custodia';
    if (path.includes('/almacen/pedidos')) return 'pedidos';
    if (path.includes('/almacen/transferencias')) return 'transferencias';
    if (path.includes('/almacen/ajustes')) return 'ajustes';
    if (path.includes('/almacen/proveedores')) return 'proveedores';
    if (path.includes('/almacen/maestros')) return 'maestros';
    return (menuItems?.[0]?.key as string) || 'productos';
  }, [location.pathname, menuItems]);

  const sectionTitle = useMemo(() => {
    switch (selectedKey) {
      case 'productos':
        return 'Catálogo de Productos';
      case 'stock':
        return 'Stock & Kardex';
      case 'ingresos':
        return 'Ingresos de Almacén';
      case 'despachos':
        return 'Despachos al Personal';
      case 'custodia':
        return 'Mi Custodia & Consumos';
      case 'pedidos':
        return 'Pedidos Internos';
      case 'transferencias':
        return 'Transferencias entre Almacenes';
      case 'ajustes':
        return 'Ajustes y Bajas de Inventario';
      case 'proveedores':
        return 'Directorio de Proveedores';
      case 'maestros':
        return 'Maestros y Catálogos';
      default:
        return 'Gestión de Almacén';
    }
  }, [selectedKey]);

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(`/almacen/${key}`);
  };

  return (
    <Layout style={{ minHeight: '100vh', backgroundColor: '#f4f7fb' }}>
      <style>{`
        /* Almacen Sider Menu Styles */
        .vitelab-almacen-sider-menu.ant-menu-dark {
          background: transparent !important;
        }
        .vitelab-almacen-sider-menu .ant-menu-item {
          border-radius: 8px !important;
          margin: 4px 8px !important;
          width: calc(100% - 16px) !important;
          transition: all 0.2s ease !important;
        }
        .vitelab-almacen-sider-menu .ant-menu-item .ant-menu-item-icon {
          font-size: 19px !important;
          min-width: 22px !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .vitelab-almacen-sider-menu .ant-menu-item-selected {
          background: linear-gradient(90deg, rgba(245, 158, 11, 0.22) 0%, rgba(2, 132, 199, 0.08) 100%) !important;
          border-left: 3px solid #f59e0b !important;
          color: #ffffff !important;
          font-weight: 600 !important;
        }
        .vitelab-almacen-sider-menu .ant-menu-item:hover {
          color: #ffffff !important;
          background: rgba(255, 255, 255, 0.06) !important;
        }
        .user-dropdown-almacen:hover {
          background: rgba(226, 232, 240, 0.9) !important;
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
          boxShadow: '4px 0 20px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* LOGO */}
        <div
          style={{
            height: 64,
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: '#050a14',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #0284c7 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              flexShrink: 0,
            }}
          >
            <img src={viteLogo} alt="ViteLab" style={{ width: 26, height: 26, objectFit: 'contain' }} />
          </div>
          {!collapsed && (
            <div style={{ lineHeight: 1.2 }}>
              <div
                style={{
                  fontSize: 17,
                  fontWeight: 800,
                  color: '#ffffff',
                  letterSpacing: '0.4px',
                }}
              >
                ViteLab
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: '#f59e0b',
                  fontWeight: 700,
                  letterSpacing: '1.2px',
                  textTransform: 'uppercase',
                  marginTop: 2,
                }}
              >
                Almacén & Logística
              </div>
            </div>
          )}
        </div>

        {/* MENU */}
        <div style={{ height: 'calc(100vh - 64px - 62px)', overflowY: 'auto' }}>
          <Menu
            theme="dark"
            mode="inline"
            className="vitelab-almacen-sider-menu"
            selectedKeys={[selectedKey]}
            items={menuItems}
            onClick={handleMenuClick}
            style={{
              backgroundColor: 'transparent',
              borderRight: 'none',
              padding: '12px 0',
            }}
          />
        </div>

        {/* REGRESAR AL PORTAL */}
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            left: 0,
            right: 0,
            padding: '0 14px',
          }}
        >
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

      {/* RIGHT SIDE LAYOUT */}
      <Layout
        style={{
          marginLeft: collapsed ? 76 : 250,
          transition: 'margin-left 0.2s ease',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#f4f7fb',
        }}
      >
        {/* HEADER */}
        <Header
          style={{
            padding: '0 24px',
            backgroundColor: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 90,
            borderBottom: '1px solid #e2e8f0',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
            height: 64,
          }}
        >
          {/* Izquierda: Toggle + Breadcrumb + Selector de Sede */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: 17,
                width: 38,
                height: 38,
                borderRadius: 8,
                color: '#475569',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            />

            <div>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                Módulo de Almacén & Logística
              </span>
              <span style={{ color: '#94a3b8', margin: '0 8px' }}>•</span>
              <span style={{ fontSize: 12, color: '#d97706', fontWeight: 600 }}>
                {sectionTitle}
              </span>
            </div>
          </div>

          {/* Derecha: AppSwitcher + Píldora de Usuario */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <AppSwitcher />

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
                className="user-dropdown-almacen"
              >
                <Avatar
                  size={30}
                  icon={<UserOutlined />}
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: '#ffffff',
                    fontWeight: 600,
                  }}
                >
                  {(user?.nombres || user?.username || 'U').charAt(0).toUpperCase()}
                </Avatar>
                {screens.sm && (
                  <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0f172a' }}>
                      {user?.nombres || user?.username || 'Usuario'}
                    </div>
                    <Tag
                      style={{
                        margin: '1px 0 0',
                        fontSize: 9.5,
                        lineHeight: '13px',
                        padding: '0 4px',
                        borderRadius: 3,
                        border: '1px solid #fde68a',
                        backgroundColor: '#fef3c7',
                        color: '#b45309',
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

        {/* CONTENT */}
        <Content
          style={{
            padding: '24px 28px',
            color: '#0f172a',
            overflowY: 'auto',
            backgroundColor: '#f4f7fb',
            flex: 1,
          }}
        >
          <Outlet />
        </Content>

        <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12, padding: '16px 24px' }}>
          ViteLab © {new Date().getFullYear()} — Módulo de Almacén & Logística v1.0
        </div>
      </Layout>
    </Layout>
  );
};

export default AlmacenLayout;
