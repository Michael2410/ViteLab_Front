import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Popover, Tooltip, Tag } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import { IconResultados, IconAlmacen, IconPersonal, IconConfiguracion, IconApps } from '../../assets/icons/NavIcons';
import { usePermissions } from './PermissionGuard';

export const AppSwitcher: React.FC = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission, hasAnyPermission, isSuperAdmin } = usePermissions();

  const currentPath = location.pathname;

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

  interface ModuleItem {
    id: string;
    title: string;
    desc: string;
    path: string;
    icon: React.ReactNode;
    color: string;
    bg: string;
    visible: boolean;
    active: boolean;
    tag?: string;
  }

  const allModules: ModuleItem[] = [
    {
      id: 'laboratorio',
      title: 'Laboratorio Clínico',
      desc: 'Órdenes, resultados, validación',
      path: '/dashboard',
      icon: <IconResultados />,
      color: '#059669',
      bg: 'rgba(5, 150, 105, 0.1)',
      visible: true,
      active: currentPath.startsWith('/dashboard') || currentPath.startsWith('/ordenes') || currentPath.startsWith('/resultados') || currentPath.startsWith('/aprobaciones') || currentPath.startsWith('/catalogos') || currentPath.startsWith('/reportes'),
    },
    {
      id: 'almacen',
      title: 'Almacén & Logística',
      desc: 'Reactivos, insumos y catálogo',
      path: '/almacen',
      icon: <IconAlmacen />,
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.1)',
      visible: canAccessAlmacen,
      active: currentPath.startsWith('/almacen'),
    },
    {
      id: 'personal',
      title: 'Personal & RRHH',
      desc: 'Directorio, cargos y contratos',
      path: '/personal',
      icon: <IconPersonal />,
      color: '#2563eb',
      bg: 'rgba(37, 99, 235, 0.1)',
      visible: canAccessPersonal,
      active: currentPath.startsWith('/personal'),
    },
    {
      id: 'configuracion',
      title: 'Configuración',
      desc: 'Usuarios, roles, sedes y sistema',
      path: '/configuracion',
      icon: <IconConfiguracion />,
      color: '#7c3aed',
      bg: 'rgba(124, 58, 237, 0.1)',
      visible: canAccessConfig,
      active: currentPath.startsWith('/configuracion'),
    },
  ];

  const modules = useMemo(() => allModules.filter((m) => m.visible), [allModules]);

  const content = (
    <div style={{ width: 280, padding: '4px 0' }}>
      <div style={{
        padding: '0 8px 10px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        marginBottom: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', color: '#94a3b8', textTransform: 'uppercase' }}>
          Sistemas ViteLab
        </span>
        <button
          onClick={() => {
            setOpen(false);
            navigate('/portal');
          }}
          style={{
            background: 'none',
            border: 'none',
            color: '#38bdf8',
            fontSize: 11,
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          Ver portal <ArrowRightOutlined style={{ fontSize: 9 }} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {modules.map((m) => (
          <div
            key={m.id}
            onClick={() => {
              setOpen(false);
              navigate(m.path);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '8px 10px',
              borderRadius: 8,
              cursor: 'pointer',
              backgroundColor: m.active ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
              border: m.active ? `1px solid ${m.color}40` : '1px solid transparent',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (!m.active) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
            }}
            onMouseLeave={(e) => {
              if (!m.active) e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: m.bg,
              color: m.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              flexShrink: 0,
            }}>
              {m.icon}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>
                  {m.title}
                </span>
                {m.tag && (
                  <Tag style={{ margin: 0, fontSize: 9, padding: '0 4px', lineHeight: '14px', borderRadius: 4, backgroundColor: 'rgba(245,158,11,0.2)', color: '#fbbf24', border: 'none' }}>
                    {m.tag}
                  </Tag>
                )}
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {m.desc}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
      styles={{
        body: {
          backgroundColor: '#0f172a',
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 12px 30px rgba(0,0,0,0.5)',
        },
      }}
    >
      <Tooltip title="Cambiar de Sistema">
        <button
          style={{
            background: open ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#cbd5e1',
            borderRadius: 8,
            width: 38,
            height: 38,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
          }}
          onMouseLeave={(e) => {
            if (!open) {
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
            }
          }}
        >
          <IconApps width={18} height={18} />
        </button>
      </Tooltip>
    </Popover>
  );
};
