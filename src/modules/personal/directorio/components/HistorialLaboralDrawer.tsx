import React, { useEffect, useState } from 'react';
import {
  Drawer,
  Timeline,
  Tag,
  Typography,
  Spin,
  Empty,
  Avatar,
  Space,
  Card,
  Divider,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  UserOutlined,
  CalendarOutlined,
  DollarOutlined,
  AuditOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { personalHistorialApi } from '../../api';
import type { Personal, HistorialLaboralItem, TipoEventoLaboral } from '../../types';

const { Text, Title } = Typography;

interface HistorialLaboralDrawerProps {
  open: boolean;
  onClose: () => void;
  colaborador: Personal | null;
}

export const HistorialLaboralDrawer: React.FC<HistorialLaboralDrawerProps> = ({
  open,
  onClose,
  colaborador,
}) => {
  const [loading, setLoading] = useState(false);
  const [historial, setHistorial] = useState<HistorialLaboralItem[]>([]);

  useEffect(() => {
    if (open && colaborador?.id) {
      cargarHistorial(colaborador.id);
    }
  }, [open, colaborador?.id]);

  const cargarHistorial = async (personalId: number) => {
    setLoading(true);
    try {
      const data = await personalHistorialApi.getByPersonalId(personalId);
      setHistorial(data || []);
    } catch (error) {
      console.error('Error al cargar historial laboral:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventoBadge = (tipo: TipoEventoLaboral) => {
    switch (tipo) {
      case 'ALTA_INICIAL':
        return <Tag color="success">Ingreso Inicial</Tag>;
      case 'CESE':
        return <Tag color="error">Cese Laboral</Tag>;
      case 'REINGRESO':
        return <Tag color="processing">Reincorporación</Tag>;
      case 'CAMBIO_CARGO':
        return <Tag color="purple">Cambio de Cargo</Tag>;
      case 'CAMBIO_SUELDO':
        return <Tag color="gold">Ajuste Salarial</Tag>;
      default:
        return <Tag color="default">{tipo}</Tag>;
    }
  };

  const getEventoDot = (tipo: TipoEventoLaboral) => {
    switch (tipo) {
      case 'ALTA_INICIAL':
        return <CheckCircleOutlined style={{ fontSize: 16, color: '#10b981' }} />;
      case 'CESE':
        return <CloseCircleOutlined style={{ fontSize: 16, color: '#ef4444' }} />;
      case 'REINGRESO':
        return <SyncOutlined style={{ fontSize: 16, color: '#3b82f6' }} />;
      default:
        return <ExclamationCircleOutlined style={{ fontSize: 16, color: '#8b5cf6' }} />;
    }
  };

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <AuditOutlined style={{ fontSize: 20, color: '#0d9488' }} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
              Historial y Trayectoria Laboral
            </div>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 400 }}>
              Registro de auditoría de altas, ceses, reingresos y cambios contractuales
            </div>
          </div>
        </div>
      }
      placement="right"
      width={560}
      open={open}
      onClose={onClose}
      styles={{
        body: { padding: '20px 24px', backgroundColor: '#f8fafc' },
      }}
    >
      {colaborador && (
        <Card
          size="small"
          style={{
            marginBottom: 24,
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            background: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Avatar
              size={52}
              style={{
                backgroundColor: colaborador.activo ? '#0d9488' : '#64748b',
                fontWeight: 700,
                fontSize: 18,
              }}
            >
              {colaborador.nombres?.[0]}
              {colaborador.apellidos?.[0]}
            </Avatar>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Title level={5} style={{ margin: 0, color: '#0f172a' }}>
                  {colaborador.apellidos}, {colaborador.nombres}
                </Title>
                <Tag color={colaborador.activo ? 'green' : 'red'}>
                  {colaborador.activo ? 'Activo' : 'Cesado'}
                </Tag>
              </div>
              <div style={{ fontSize: 13, color: '#475569', marginTop: 2 }}>
                {colaborador.cargo || 'Sin cargo'} • {colaborador.area || 'Sin área'}
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                Doc: {colaborador.tipo_documento} {colaborador.numero_documento || 'S/N'}
              </div>
            </div>
          </div>
        </Card>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 12, color: '#64748b' }}>Cargando eventos de auditoría...</div>
        </div>
      ) : historial.length === 0 ? (
        <Empty
          description="No hay eventos laborales registrados en la auditoría"
          style={{ marginTop: 60 }}
        />
      ) : (
        <Timeline
          items={historial.map((item) => ({
            dot: getEventoDot(item.tipo_evento),
            children: (
              <div
                style={{
                  background: '#ffffff',
                  padding: 16,
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 8,
                  }}
                >
                  <Space orientation="horizontal" size={6}>
                    {getEventoBadge(item.tipo_evento)}
                    <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>
                      <CalendarOutlined style={{ marginRight: 4 }} />
                      {item.fecha_evento}
                    </span>
                  </Space>
                  {item.usuario_nombre && (
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      Por: <Text strong style={{ fontSize: 11 }}>{item.usuario_nombre}</Text>
                    </Text>
                  )}
                </div>

                {item.tipo_evento === 'CESE' ? (
                  <div
                    style={{
                      background: '#fff1f2',
                      border: '1px solid #fecdd3',
                      padding: '8px 12px',
                      borderRadius: 8,
                      marginTop: 6,
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#be123c' }}>
                      Motivo: {item.motivo_cese_texto || 'No especificado'}
                    </div>
                    {item.observaciones && (
                      <div style={{ fontSize: 12, color: '#9f1239', marginTop: 4 }}>
                        Detalle: {item.observaciones}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {(item.cargo || item.area) && (
                      <div style={{ fontSize: 13, color: '#1e293b', fontWeight: 500 }}>
                        {item.cargo} {item.area && `(${item.area})`}
                      </div>
                    )}

                    <div
                      style={{
                        display: 'flex',
                        gap: 16,
                        marginTop: 6,
                        fontSize: 12,
                        color: '#64748b',
                        flexWrap: 'wrap',
                      }}
                    >
                      {item.tipo_contrato && <span>Contrato: {item.tipo_contrato}</span>}
                      {item.sueldo_base && (
                        <span>
                          <DollarOutlined /> S/ {Number(item.sueldo_base).toFixed(2)}
                        </span>
                      )}
                    </div>

                    {item.observaciones && (
                      <div
                        style={{
                          fontSize: 12,
                          color: '#475569',
                          marginTop: 6,
                          fontStyle: 'italic',
                          background: '#f8fafc',
                          padding: '4px 8px',
                          borderRadius: 6,
                        }}
                      >
                        {item.observaciones}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ),
          }))}
        />
      )}
    </Drawer>
  );
};
