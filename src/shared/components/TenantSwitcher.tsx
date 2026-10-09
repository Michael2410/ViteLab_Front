import React, { useState } from 'react';
import { Dropdown, Button, Tag, Spin, message, Typography } from 'antd';
import {
  BankOutlined,
  CheckCircleFilled,
  SwapOutlined,
  DownOutlined,
  MedicineBoxOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../../modules/auth/api';
import { useAuthStore } from '../../modules/auth/hooks';
import type { TenantSummary } from '../../modules/auth/types';

const { Text } = Typography;

export const TenantSwitcher: React.FC = () => {
  const queryClient = useQueryClient();
  const { activeTenant, setAuth } = useAuthStore();
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  // Obtener la lista de laboratorios donde el usuario tiene membresía
  const { data: tenantsResponse, isLoading } = useQuery({
    queryKey: ['my-tenants'],
    queryFn: authApi.getMyTenants,
    staleTime: 1000 * 60 * 5, // 5 minutos de caché
  });

  const tenantsList = tenantsResponse?.data || [];
  const currentTenant = activeTenant || tenantsList.find((t) => t.isCurrent) || tenantsList[0];

  // Mutación para alternar entre laboratorios
  const switchMutation = useMutation({
    mutationFn: (tenantId: string) => authApi.switchTenant({ tenantId }),
    onMutate: (tenantId) => {
      setSwitchingId(tenantId);
    },
    onSuccess: (response) => {
      if (response.success && response.data) {
        const { user, accessToken, refreshToken, activeTenant: newTenant } = response.data;
        setAuth(user, accessToken, refreshToken, newTenant);
        message.success(`Laboratorio cambiado a: ${newTenant?.name || 'Nuevo laboratorio'}`);
        // Resetear todas las consultas cacheadas para cargar los datos del nuevo laboratorio
        queryClient.clear();
        // Recargar suavemente para reinicializar sockets y estados de contexto
        window.location.reload();
      }
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Error al cambiar de laboratorio';
      message.error(msg);
      setSwitchingId(null);
    },
  });

  const handleSelectTenant = (tenant: TenantSummary) => {
    if (tenant.id === currentTenant?.id || switchingId) return;
    switchMutation.mutate(tenant.id);
  };

  // Si solo tiene 1 laboratorio o no hay lista
  if (!isLoading && tenantsList.length <= 1) {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 7,
          padding: '5px 12px',
          background: 'rgba(2, 132, 199, 0.06)',
          border: '1px solid rgba(2, 132, 199, 0.2)',
          borderRadius: 20,
          color: '#0369a1',
          fontSize: 12,
          fontWeight: 600,
        }}
        title={`Laboratorio Activo: ${currentTenant?.name || 'ViteLab Central'}`}
      >
        <MedicineBoxOutlined style={{ color: '#0284c7', fontSize: 14 }} />
        <span style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {currentTenant?.name || 'ViteLab Central'}
        </span>
      </div>
    );
  }

  // Menú desplegable para cuando tiene MÚLTIPLES laboratorios
  const menuItems = [
    {
      key: 'header',
      type: 'group' as const,
      label: (
        <div style={{ padding: '4px 0', borderBottom: '1px solid #f1f5f9' }}>
          <Text strong style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Tus Laboratorios Clínicos
          </Text>
        </div>
      ),
    },
    ...tenantsList.map((t) => {
      const isSelected = t.id === currentTenant?.id;
      const isThisSwitching = switchingId === t.id;

      return {
        key: t.id,
        label: (
          <div
            onClick={() => handleSelectTenant(t)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 4px',
              gap: 14,
              minWidth: 240,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: isSelected ? 'rgba(5, 150, 105, 0.1)' : 'rgba(2, 132, 199, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isSelected ? '#059669' : '#0284c7',
                }}
              >
                {isThisSwitching ? <Spin size="small" /> : <BankOutlined style={{ fontSize: 16 }} />}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <Text
                  strong
                  style={{
                    fontSize: 13,
                    color: isSelected ? '#0f172a' : '#334155',
                  }}
                >
                  {t.name}
                </Text>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  @{t.slug}
                </Text>
              </div>
            </div>

            <div>
              {isSelected ? (
                <Tag color="success" style={{ borderRadius: 10, marginRight: 0, fontSize: 11 }}>
                  <CheckCircleFilled style={{ marginRight: 4 }} />
                  Activo
                </Tag>
              ) : (
                <Button
                  size="small"
                  type="text"
                  icon={<SwapOutlined />}
                  loading={isThisSwitching}
                  style={{ color: '#0284c7', fontSize: 12, padding: '0 6px' }}
                >
                  Cambiar
                </Button>
              )}
            </div>
          </div>
        ),
      };
    }),
  ];

  return (
    <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight" arrow>
      <Button
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          height: 36,
          padding: '0 12px',
          background: 'rgba(2, 132, 199, 0.06)',
          borderColor: 'rgba(2, 132, 199, 0.25)',
          borderRadius: 20,
          color: '#0369a1',
          fontWeight: 600,
          fontSize: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          transition: 'all 0.2s ease',
        }}
        className="tenant-switcher-btn"
      >
        <MedicineBoxOutlined style={{ color: '#0284c7', fontSize: 14 }} />
        <span
          style={{
            maxWidth: 150,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {switchingId ? 'Cambiando...' : currentTenant?.name || 'Seleccionar Laboratorio'}
        </span>
        <DownOutlined style={{ fontSize: 10, color: '#64748b' }} />
      </Button>
    </Dropdown>
  );
};
export default TenantSwitcher;
