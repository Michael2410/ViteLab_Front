import { Layout, Menu, Button, Avatar, Dropdown, Typography } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  FileTextOutlined,
  ExperimentOutlined,
  DollarOutlined,
  DatabaseOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../modules/auth/hooks';

const { Header, Sider, Content, Footer } = Layout;
const { Text } = Typography;

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const menuItems = [
    {
      key: '1',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
      onClick: () => navigate('/dashboard'),
    },
    {
      key: '2',
      icon: <FileTextOutlined />,
      label: 'Órdenes',
      children: [
        { key: '2-1', label: 'Nueva Orden', onClick: () => navigate('/ordenes/nueva') },
        { key: '2-2', label: 'Listado', onClick: () => navigate('/ordenes') },
      ],
    },
    {
      key: '3',
      icon: <ExperimentOutlined />,
      label: 'Resultados',
      onClick: () => navigate('/resultados'),
    },
    {
      key: '4',
      icon: <DatabaseOutlined />,
      label: 'Catálogos',
      children: [
        { key: '4-1', label: 'Áreas', onClick: () => navigate('/catalogos/areas') },
        { key: '4-2', label: 'Métodos', onClick: () => navigate('/catalogos/metodos') },
        { key: '4-3', label: 'Sedes', onClick: () => navigate('/catalogos/sedes') },
        { key: '4-4', label: 'Tipos de Cliente', onClick: () => navigate('/catalogos/tipos-cliente') },
        { key: '4-5', label: 'Componentes', onClick: () => navigate('/catalogos/componentes') },
        { key: '4-6', label: 'Análisis', onClick: () => navigate('/catalogos/analisis') },
        { key: '4-7', label: 'Convenios', onClick: () => navigate('/catalogos/convenios') },
        { key: '4-8', label: 'Tarifarios', onClick: () => navigate('/catalogos/tarifarios') },
      ],
    },
    {
      key: '6',
      icon: <SettingOutlined />,
      label: 'Configuración',
      children: [
        { key: '6-1', label: 'Usuarios', onClick: () => navigate('/settings/usuarios') },
        { key: '6-2', label: 'Roles', onClick: () => navigate('/settings/roles') },
        { key: '6-3', label: 'Sistema', onClick: () => navigate('/settings/sistema') },
      ],
    },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Mi Perfil',
      onClick: () => navigate('/perfil'),
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Cerrar Sesión',
      onClick: handleLogout,
      danger: true,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={250}
        style={{
          background: '#001529',
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: collapsed ? 18 : 20,
            fontWeight: 'bold',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {collapsed ? '🧪' : '🧪 ViteLab'}
        </div>
        <Menu 
          theme="dark" 
          mode="inline" 
          defaultSelectedKeys={['1']} 
          items={menuItems}
          style={{ borderRight: 0 }}
        />
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 250, transition: 'margin-left 0.2s' }}>
        <Header 
          style={{ 
            padding: '0 24px', 
            background: '#fff', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 1,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: 16, width: 64, height: 64 }}
          />

          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 12 }}>
              <Avatar icon={<UserOutlined />} src={user?.firma_url} style={{ backgroundColor: '#1890ff' }} />
              <div style={{ textAlign: 'right' }}>
                <div>
                  <Text strong>{user?.nombres} {user?.apellidos}</Text>
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>{user?.rol_nombre}</Text>
                </div>
              </div>
            </div>
          </Dropdown>
        </Header>

        <Content 
          style={{ 
            padding: '24px',
            minHeight: 'calc(100vh - 64px - 48px)',
            background: '#f0f2f5',
          }}
        >
          <Outlet />
        </Content>

        <Footer style={{ textAlign: 'center', padding: '12px 24px', background: '#fff', borderTop: '1px solid #f0f0f0' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            ViteLab LIMS ©{new Date().getFullYear()} - Sistema de Gestión de Laboratorio Clínico
          </Text>
        </Footer>
      </Layout>
    </Layout>
  );
}
