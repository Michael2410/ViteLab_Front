import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Tag } from 'antd';
import { ArrowLeftOutlined, ExperimentOutlined, AppstoreOutlined, ClockCircleOutlined, SafetyCertificateOutlined, BarChartOutlined, BellOutlined } from '@ant-design/icons';
import viteLogo from '../../../assets/logo/logo.png';
import { IconAlmacen } from '../../../assets/icons/NavIcons';

export default function AlmacenComingSoonPage() {
  const navigate = useNavigate();

  const previewCards = [
    {
      title: 'Control de Inventario & Stock',
      description: 'Supervisión en tiempo real de existencias por sede, niveles de seguridad y umbrales de reorden automático.',
      icon: <AppstoreOutlined style={{ fontSize: 22, color: '#f59e0b' }} />,
    },
    {
      title: 'Trazabilidad de Reactivos & Lotes',
      description: 'Gestión rigurosa de fechas de vencimiento, series de fabricación y asociación directa con pruebas de laboratorio.',
      icon: <ExperimentOutlined style={{ fontSize: 22, color: '#06b6d4' }} />,
    },
    {
      title: 'Kardex Digital de Movimientos',
      description: 'Historial inmutable de ingresos, despachos, transferencias inter-sedes y bajas con firmas de responsabilidad.',
      icon: <BarChartOutlined style={{ fontSize: 22, color: '#10b981' }} />,
    },
    {
      title: 'Alertas Preventivas de Caducidad',
      description: 'Notificaciones anticipadas vía sistema y WhatsApp para mitigar mermas y asegurar reactivos vigentes.',
      icon: <BellOutlined style={{ fontSize: 22, color: '#8b5cf6' }} />,
    },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#070c14',
      backgroundImage: `
        radial-gradient(ellipse 70% 60% at 50% 20%, rgba(245,158,11,0.12), transparent),
        radial-gradient(ellipse 50% 50% at 80% 80%, rgba(37,99,235,0.08), transparent)
      `,
      display: 'flex',
      flexDirection: 'column',
      color: '#f8fafc',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    }}>
      {/* Header */}
      <header style={{
        padding: '18px 36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(12px)',
        backgroundColor: 'rgba(7,12,20,0.6)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src={viteLogo} alt="ViteLab" style={{ height: 34, objectFit: 'contain' }} />
          <span style={{ fontSize: 18, fontWeight: 700, color: '#ffffff' }}>ViteLab</span>
          <span style={{ color: '#475569' }}>/</span>
          <span style={{ fontSize: 13, color: '#f59e0b', fontWeight: 600 }}>Almacén & Logística</span>
        </div>

        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/portal')}
          style={{
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderColor: 'rgba(255,255,255,0.15)',
            color: '#cbd5e1',
            borderRadius: 10,
          }}
        >
          Volver al Portal
        </Button>
      </header>

      {/* Main hero */}
      <main style={{
        flex: 1,
        maxWidth: 960,
        margin: '0 auto',
        width: '100%',
        padding: '60px 24px 40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}>
        {/* Glow Icon */}
        <div style={{
          position: 'relative',
          marginBottom: 30,
        }}>
          <div style={{
            position: 'absolute',
            inset: -10,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(245,158,11,0.4) 0%, transparent 70%)',
            filter: 'blur(15px)',
          }} />
          <div style={{
            position: 'relative',
            width: 88,
            height: 88,
            borderRadius: 24,
            background: 'linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(217,119,6,0.1) 100%)',
            border: '1px solid rgba(245,158,11,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 40,
            color: '#f59e0b',
            boxShadow: '0 12px 30px -8px rgba(245,158,11,0.3)',
          }}>
            <IconAlmacen />
          </div>
        </div>

        {/* Badges */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <Tag style={{
            backgroundColor: 'rgba(245,158,11,0.15)',
            border: '1px solid rgba(245,158,11,0.3)',
            color: '#fbbf24',
            borderRadius: 999,
            padding: '4px 14px',
            fontSize: 12,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <ClockCircleOutlined />
            Próximamente disponible
          </Tag>
          <Tag style={{
            backgroundColor: 'rgba(59,130,246,0.15)',
            border: '1px solid rgba(59,130,246,0.3)',
            color: '#60a5fa',
            borderRadius: 999,
            padding: '4px 14px',
            fontSize: 12,
            fontWeight: 600,
          }}>
            Módulo Suite v1.1
          </Tag>
        </div>

        <h1 style={{
          fontSize: 'clamp(28px, 4vw, 40px)',
          fontWeight: 800,
          letterSpacing: '-0.02em',
          margin: '0 0 16px',
          color: '#ffffff',
        }}>
          Gestión Integral de Almacén & Reactivos
        </h1>

        <p style={{
          fontSize: 15,
          color: '#94a3b8',
          maxWidth: 620,
          lineHeight: 1.7,
          marginBottom: 44,
        }}>
          Estamos preparando un sistema diseñado específicamente para el control de insumos biomédicos, reactivos con cadena de frío y consumibles de diagnóstico clínico con trazabilidad por sede.
        </p>

        {/* 4 Feature cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 20,
          width: '100%',
          textAlign: 'left',
          marginBottom: 44,
        }}>
          {previewCards.map((c, i) => (
            <div
              key={i}
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 16,
                padding: '22px 20px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(245,158,11,0.35)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ marginBottom: 12 }}>{c.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', marginBottom: 6 }}>
                {c.title}
              </div>
              <div style={{ fontSize: 12.5, color: '#94a3b8', lineHeight: 1.5 }}>
                {c.description}
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 14 }}>
          <Button
            type="primary"
            size="large"
            onClick={() => navigate('/dashboard')}
            style={{
              borderRadius: 12,
              backgroundColor: '#2563eb',
              fontWeight: 600,
              padding: '0 24px',
              height: 44,
            }}
          >
            Ir al Laboratorio Clínico
          </Button>

          <Button
            size="large"
            onClick={() => navigate('/portal')}
            style={{
              borderRadius: 12,
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderColor: 'rgba(255,255,255,0.15)',
              color: '#f8fafc',
              fontWeight: 600,
              padding: '0 24px',
              height: 44,
            }}
          >
            Volver al Portal
          </Button>
        </div>
      </main>
    </div>
  );
}
