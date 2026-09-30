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
  LogoutOutlined,
  UserOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { 
  IconDirectorioPersonal, 
  IconContratosAlertas, 
  IconControlVacaciones, 
  IconAsistenciaFaltas, 
  IconDocumentosConstancias, 
  IconCatalogos 
} from '../../../../assets/icons/NavIcons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../../auth/hooks';
import { usePermissions } from '../../../../shared/components/PermissionGuard';
import viteLogo from '../../../../assets/logo/logo.png';
import { AppSwitcher } from '../../../../shared/components/AppSwitcher';
import { getUserInitials } from '../../../../shared/utils/user.utils';

const { Header, Sider, Content } = Layout;
const { useBreakpoint } = Grid;

export const PersonalLayout: React.FC = () => {
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
      key: 'laboratorio',
      label: 'Laboratorio Clínico',
      onClick: () => navigate('/dashboard'),
    },
    {
      key: 'almacen',
      label: 'Almacén & Logística',
      onClick: () => navigate('/almacen'),
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

  const menuItems: MenuProps['items'] = useMemo(() => {
    const items: any[] = [];

    if (isSuperAdmin || hasPermission('personal.directorio.read')) {
      items.push({
        key: 'directorio',
        icon: <IconDirectorioPersonal width={24} height={24} />,
        label: <span style={{ marginLeft: 6 }}>Directorio de Personal</span>,
      });
    }

    if (isSuperAdmin || hasPermission('personal.contratos.read')) {
      items.push({
        key: 'contratos',
        icon: <IconContratosAlertas width={24} height={24} />,
        label: <span style={{ marginLeft: 6 }}>Contratos</span>,
      });
    }

    if (isSuperAdmin || hasPermission('personal.vacaciones.read')) {
      items.push({
        key: 'vacaciones',
        icon: <IconControlVacaciones width={24} height={24} />,
        label: <span style={{ marginLeft: 6 }}>Control de Vacaciones</span>,
      });
    }

    if (isSuperAdmin || hasPermission('personal.asistencia.read')) {
      items.push({
        key: 'asistencia',
        icon: <IconAsistenciaFaltas width={24} height={24} />,
        label: <span style={{ marginLeft: 6 }}>Asistencia & Faltas</span>,
      });
    }

    if (isSuperAdmin || hasPermission('personal.documentos.read')) {
      items.push({
        key: 'documentos',
        icon: <IconDocumentosConstancias width={24} height={24} />,
        label: <span style={{ marginLeft: 6 }}>Documentos</span>,
      });
    }

    if (isSuperAdmin || hasPermission('personal.catalogos.read')) {
      items.push({
        key: 'catalogos',
        icon: <IconCatalogos width={24} height={24} />,
        label: <span style={{ marginLeft: 6 }}>Catálogos</span>,
      });
    }

    return items;
  }, [hasPermission, isSuperAdmin]);

  // Determinar pestaña activa según URL
  const selectedKey = useMemo(() => {
    if (location.pathname.includes('/personal/catalogos')) return 'catalogos';
    if (location.pathname.includes('/personal/contratos')) return 'contratos';
    if (location.pathname.includes('/personal/vacaciones')) return 'vacaciones';
    if (location.pathname.includes('/personal/asistencia')) return 'asistencia';
    if (location.pathname.includes('/personal/documentos')) return 'documentos';
    return 'directorio';
  }, [location.pathname]);

  const sectionTitle = useMemo(() => {
    switch (selectedKey) {
      case 'contratos':
        return 'Contratos Laborales';
      case 'vacaciones':
        return 'Control de Vacaciones';
      case 'asistencia':
        return 'Asistencia & Faltas';
      case 'documentos':
        return 'Documentos & Constancias';
      case 'catalogos':
        return 'Cargos & Áreas';
      default:
        return 'Directorio de Personal';
    }
  }, [selectedKey]);

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'directorio') navigate('/personal');
    if (key === 'contratos') navigate('/personal/contratos');
    if (key === 'catalogos') navigate('/personal/catalogos');
    if (key === 'vacaciones') navigate('/personal/vacaciones');
    if (key === 'asistencia') navigate('/personal/asistencia');
    if (key === 'documentos') navigate('/personal/documentos');
  };

  return (
    <Layout style={{ minHeight: '100vh', backgroundColor: '#f4f7fb' }}>
      <style>{`
        /* Personal Sider Menu Styles */
        .vitelab-personal-sider-menu.ant-menu-dark {
          background: transparent !important;
        }
        .vitelab-personal-sider-menu .ant-menu-item {
          border-radius: 8px !important;
          margin: 4px 8px !important;
          width: calc(100% - 16px) !important;
          transition: all 0.2s ease !important;
        }
        .vitelab-personal-sider-menu .ant-menu-item .ant-menu-item-icon {
          font-size: 19px !important;
          min-width: 22px !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .vitelab-personal-sider-menu .ant-menu-item-selected {
          background: linear-gradient(90deg, rgba(37, 99, 235, 0.22) 0%, rgba(2, 132, 199, 0.08) 100%) !important;
          border-left: 3px solid #2563eb !important;
          color: #ffffff !important;
          font-weight: 600 !important;
        }
        .vitelab-personal-sider-menu .ant-menu-item:hover {
          color: #ffffff !important;
          background: rgba(255, 255, 255, 0.06) !important;
        }
        .user-dropdown-personal:hover {
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
            flexShrink: 0,
          }}>
            <img src={viteLogo} alt="ViteLab" style={{ width: 26, height: 26, objectFit: 'contain' }} />
          </div>
          {!collapsed && (
            <div style={{ lineHeight: 1.2 }}>
              <div style={{
                fontSize: 17,
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: '0.4px',
              }}>
                ViteLab
              </div>
              <div style={{
                fontSize: 10,
                color: '#3b82f6',
                fontWeight: 700,
                letterSpacing: '1.2px',
                textTransform: 'uppercase',
                marginTop: 2,
              }}>
                Personal & RRHH
              </div>
            </div>
          )}
        </div>

        {/* MENU */}
        <div style={{ height: 'calc(100vh - 64px - 62px)', overflowY: 'auto' }}>
          <Menu
            theme="dark"
            mode="inline"
            className="vitelab-personal-sider-menu"
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

      {/* RIGHT SIDE LAYOUT */}
      <Layout style={{
        marginLeft: collapsed ? 76 : 250,
        transition: 'margin-left 0.2s ease',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f4f7fb',
      }}>
        {/* HEADER */}
        <Header style={{
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
        }}>
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
                Módulo de Personal & Talento Humano
              </span>
              <span style={{ color: '#94a3b8', margin: '0 8px' }}>•</span>
              <span style={{ fontSize: 12, color: '#2563eb', fontWeight: 600 }}>
                {sectionTitle}
              </span>
            </div>
          </div>

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
                className="user-dropdown-personal"
              >
                <Avatar
                  size={30}
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: 12,
                  }}
                >
                  {getUserInitials(user)}
                </Avatar>
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
                        border: '1px solid #bfdbfe',
                        backgroundColor: '#eff6ff',
                        color: '#1d4ed8',
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
        <Content style={{
          padding: '24px 28px',
          color: '#0f172a',
          overflowY: 'auto',
          backgroundColor: '#f4f7fb',
          flex: 1,
        }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default PersonalLayout;
