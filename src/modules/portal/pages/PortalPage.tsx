import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dropdown, Avatar, Tag, type MenuProps } from 'antd';
import {
  LogoutOutlined,
  UserOutlined,
  CheckCircleFilled,
  ClockCircleFilled,
} from '@ant-design/icons';
import { useAuthStore } from '../../auth/hooks';
import { usePermissions } from '../../../shared/components/PermissionGuard';
import viteLogo from '../../../assets/logo/logo.png';
import { IconResultados, IconAlmacen, IconPersonal, IconConfiguracion } from '../../../assets/icons/NavIcons';

export default function PortalPage() {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const { hasAnyPermission, isSuperAdmin } = usePermissions();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const canAccessConfig = isSuperAdmin || hasAnyPermission([
    'auth.users.read',
    'auth.roles.read',
    'catalogs.sedes.read',
    'settings.read',
  ]);

  const canAccessPersonal = isSuperAdmin || hasAnyPermission([
    'personal.directorio.read',
    'personal.contratos.read',
    'personal.catalogos.read',
    'personal.vacaciones.read',
    'personal.asistencia.read',
    'personal.documentos.read',
  ]);

  const canAccessAlmacen = isSuperAdmin || hasAnyPermission([
    'almacen.dashboard.read',
    'almacen.productos.read',
    'almacen.proveedores.read',
    'almacen.maestros.read',
    'almacen.stock.read',
    'almacen.ingresos.read',
  ]);

  const handleLogout = () => {
    clearAuth();
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/login');
  };

  // Mismo menú desglosable que en los otros layouts
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'user-info',
      disabled: true,
      label: (
        <div style={{ padding: '4px 0' }}>
          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 13 }}>
            {user?.nombres} {user?.apellidos}
          </div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{user?.email}</div>
          <Tag color="blue" style={{ marginTop: 6, fontSize: 10, borderRadius: 4 }}>
            {user?.rol_nombre || 'Usuario'}
          </Tag>
        </div>
      ),
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

  const allModules = [
    {
      id: 'laboratorio',
      title: 'Laboratorio Clínico',
      subtitle: 'LIMS & Análisis',
      badge: 'Activo',
      path: '/dashboard',
      icon: <IconResultados />,
      iconColor: '#059669', // Verde menta
      hoverBg: 'rgba(236, 253, 245, 0.75)',
      badgeBg: '#ecfdf5',
      badgeColor: '#059669',
      badgeBorder: '#a7f3d0',
      active: true,
      visible: true,
    },
    {
      id: 'almacen',
      title: 'Almacén & Logística',
      subtitle: 'Reactivos & Stock',
      badge: 'Activo',
      path: '/almacen',
      icon: <IconAlmacen />,
      iconColor: '#f59e0b',
      hoverBg: 'rgba(254, 243, 199, 0.75)',
      badgeBg: '#fef3c7',
      badgeColor: '#b45309',
      badgeBorder: '#fde68a',
      active: true,
      visible: canAccessAlmacen,
    },
    {
      id: 'personal',
      title: 'Personal & RRHH',
      subtitle: 'Directorio & Gestión Humana',
      badge: 'Activo',
      path: '/personal',
      icon: <IconPersonal />,
      iconColor: '#2563eb', // Azul médico
      hoverBg: 'rgba(239, 246, 255, 0.85)',
      badgeBg: '#eff6ff',
      badgeColor: '#1d4ed8',
      badgeBorder: '#bfdbfe',
      active: true,
      visible: canAccessPersonal,
    },
    {
      id: 'configuracion',
      title: 'Configuración',
      subtitle: 'Usuarios, Roles & Sedes',
      badge: 'Activo',
      path: '/configuracion',
      icon: <IconConfiguracion />,
      iconColor: '#7c3aed', // Púrpura / Violeta
      hoverBg: 'rgba(245, 243, 255, 0.85)',
      badgeBg: '#f5f3ff',
      badgeColor: '#6d28d9',
      badgeBorder: '#ddd6fe',
      active: true,
      visible: canAccessConfig,
    },
  ];

  const modules = allModules.filter((m) => m.visible);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        backgroundImage: `
          radial-gradient(circle at 12% 18%, rgba(16, 185, 129, 0.12) 0%, transparent 45%),
          radial-gradient(circle at 88% 18%, rgba(37, 99, 235, 0.1) 0%, transparent 45%),
          radial-gradient(circle at 50% 85%, rgba(6, 182, 212, 0.08) 0%, transparent 50%),
          linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)
        `,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Header con Dropdown idéntico a Dashboard y Personal */}
      <header
        style={{
          padding: '20px 36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          width: '100%',
        }}
      >
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              padding: '4px 12px 4px 6px',
              borderRadius: 24,
              transition: 'all 0.2s',
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(226, 232, 240, 0.8)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
          >
            <Avatar
              size={32}
              icon={<UserOutlined />}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #2563eb 100%)',
                boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)',
                marginRight: 10,
              }}
            >
              {user?.nombres?.charAt(0)?.toUpperCase()}
            </Avatar>
            <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                {user?.nombres || 'Usuario'}
              </div>
              <Tag
                color="blue"
                style={{
                  margin: '2px 0 0 0',
                  fontSize: 10,
                  lineHeight: '15px',
                  padding: '0 6px',
                  border: 0,
                  borderRadius: 4,
                }}
              >
                {user?.rol_nombre || 'Usuario'}
              </Tag>
            </div>
          </div>
        </Dropdown>
      </header>

      {/* Centro: Logo + Barra Segmentada Glassmorphism (Inspirada en la referencia) */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px 24px 60px',
          width: '100%',
        }}
      >
        {/* Logo Centrado con Divisor */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            marginBottom: 40,
          }}
        >
          <img
            src={viteLogo}
            alt="ViteLab"
            style={{
              height: 50,
              objectFit: 'contain',
              filter: 'drop-shadow(0 4px 10px rgba(16, 185, 129, 0.2))',
            }}
          />
          <div
            style={{
              width: 1.5,
              height: 38,
              backgroundColor: 'rgba(15, 23, 42, 0.15)',
            }}
          />
          <div style={{ textAlign: 'left' }}>
            <div
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: '#0f172a',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
              }}
            >
              ViteLab
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: '#059669', // Verde menta
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              Suite Hospitalaria & Diagnóstica
            </div>
          </div>
        </div>

        {/* Barra Modular Glassmorphism Horizontal */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            borderRadius: 20,
            border: '1px solid rgba(255, 255, 255, 0.95)',
            boxShadow: `
              0 20px 48px -12px rgba(15, 23, 42, 0.08),
              0 4px 16px -4px rgba(16, 185, 129, 0.06),
              0 0 0 1px rgba(226, 232, 240, 0.7)
            `,
            display: 'flex',
            flexWrap: 'wrap',
            maxWidth: 1040,
            width: '100%',
            overflow: 'hidden',
          }}
        >
          {modules.map((m, idx) => {
            const isHovered = hoveredId === m.id;

            return (
              <div
                key={m.id}
                onClick={() => navigate(m.path)}
                onMouseEnter={() => setHoveredId(m.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  flex: '1 1 220px',
                  padding: '38px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                  backgroundColor: isHovered ? m.hoverBg : 'transparent',
                  borderRight:
                    idx < modules.length - 1
                      ? '1px solid rgba(226, 232, 240, 0.75)'
                      : 'none',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                {/* Icono agrandado con animación interactiva */}
                <div
                  style={{
                    fontSize: 48,
                    color: m.iconColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 56,
                    marginBottom: 18,
                    transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    transform: isHovered ? 'scale(1.12) translateY(-3px)' : 'scale(1)',
                    filter: isHovered ? `drop-shadow(0 8px 16px ${m.iconColor}44)` : 'none',
                  }}
                >
                  {React.cloneElement(m.icon as React.ReactElement<{ width?: number; height?: number }>, { width: 48, height: 48 })}
                </div>

                {/* Título */}
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: isHovered ? '#0f172a' : '#1e293b',
                    marginBottom: 4,
                    letterSpacing: '-0.01em',
                    transition: 'color 0.2s ease',
                  }}
                >
                  {m.title}
                </div>

                {/* Subtítulo */}
                <div
                  style={{
                    fontSize: 12.5,
                    fontWeight: 500,
                    color: '#64748b',
                    marginBottom: 12,
                  }}
                >
                  {m.subtitle}
                </div>

                {/* Tag de Estado Sutil */}
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 999,
                    backgroundColor: m.badgeBg,
                    color: m.badgeColor,
                    border: `1px solid ${m.badgeBorder}`,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    lineHeight: '14px',
                  }}
                >
                  {m.active ? (
                    <CheckCircleFilled style={{ fontSize: 9.5 }} />
                  ) : (
                    <ClockCircleFilled style={{ fontSize: 9.5 }} />
                  )}
                  {m.badge}
                </span>
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer Minimalista */}
      <footer
        style={{
          padding: '16px 24px',
          textAlign: 'center',
          fontSize: 12,
          color: '#94a3b8',
        }}
      >
        ViteLab • Suite Hospitalaria & Diagnóstica
      </footer>
    </div>
  );
}
