import React, { useState, useMemo } from 'react';
import { Tabs } from 'antd';
import { useSearchParams } from 'react-router-dom';
import { DollarCircleOutlined, BankOutlined, TeamOutlined } from '@ant-design/icons';
import ModulePageLayout, { BrandCreateButton } from '../../../../shared/components/ModulePageLayout';
import { useAuthStore } from '../../../auth/hooks';
import { TarifariosPage } from './TarifariosPage';
import { ConveniosPage } from '../../convenios/pages/ConveniosPage';
import { TiposClientePage } from '../../tipos-cliente/pages/TiposClientePage';

export const TarifasConveniosPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasPermission } = useAuthStore();
  const [createTrigger, setCreateTrigger] = useState(0);

  const activeKey = useMemo(() => {
    const requestedTab = searchParams.get('tab');
    if (requestedTab && ['tarifarios', 'convenios', 'tipos-cliente'].includes(requestedTab)) {
      return requestedTab;
    }
    return 'tarifarios';
  }, [searchParams]);

  const tabItems = useMemo(() => {
    const items = [];

    if (hasPermission('tariffs.read')) {
      items.push({
        key: 'tarifarios',
        label: (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 6px' }}>
            <DollarCircleOutlined style={{ fontSize: 16 }} />
            <span style={{ fontWeight: 600 }}>Tarifarios y Precios</span>
          </span>
        ),
        description: 'Listas de precios base, tarifas especiales y márgenes para análisis clínicos',
        children: <TarifariosPage isTab createTrigger={createTrigger} />,
      });
    }

    if (hasPermission('catalogs.convenios.read')) {
      items.push({
        key: 'convenios',
        label: (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 6px' }}>
            <BankOutlined style={{ fontSize: 16 }} />
            <span style={{ fontWeight: 600 }}>Convenios Empresariales</span>
          </span>
        ),
        description: 'Acuerdos comerciales con empresas, aseguradoras y centros médicos remitentes',
        children: <ConveniosPage isTab createTrigger={createTrigger} />,
      });
    }

    if (hasPermission('catalogs.tipos-cliente.read')) {
      items.push({
        key: 'tipos-cliente',
        label: (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 6px' }}>
            <TeamOutlined style={{ fontSize: 16 }} />
            <span style={{ fontWeight: 600 }}>Tipos de Cliente</span>
          </span>
        ),
        description: 'Segmentación comercial de clientes, pacientes particulares e institucionales',
        children: <TiposClientePage isTab createTrigger={createTrigger} />,
      });
    }

    return items;
  }, [hasPermission, createTrigger]);

  const currentTab = useMemo(() => tabItems.find((i) => i.key === activeKey) || tabItems[0], [activeKey, tabItems]);

  const handleTabChange = (key: string) => {
    setSearchParams({ tab: key });
  };

  const actionButton = useMemo(() => {
    if (activeKey === 'tarifarios' && hasPermission('tariffs.create')) {
      return (
        <BrandCreateButton onClick={() => setCreateTrigger((prev) => prev + 1)}>
          Nuevo Tarifario
        </BrandCreateButton>
      );
    }
    if (activeKey === 'convenios' && hasPermission('catalogs.convenios.create')) {
      return (
        <BrandCreateButton onClick={() => setCreateTrigger((prev) => prev + 1)}>
          Nuevo Convenio
        </BrandCreateButton>
      );
    }
    if (activeKey === 'tipos-cliente' && hasPermission('catalogs.tipos-cliente.create')) {
      return (
        <BrandCreateButton onClick={() => setCreateTrigger((prev) => prev + 1)}>
          Nuevo Tipo
        </BrandCreateButton>
      );
    }
    return undefined;
  }, [activeKey, hasPermission]);

  return (
    <ModulePageLayout
      title="Tarifas y Convenios"
      subtitle={currentTab?.description || 'Gestión comercial de esquemas tarifarios, convenios corporativos y categorías de clientes'}
      actionButton={actionButton}
      extraHeader={
        <div style={{ backgroundColor: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '6px 16px 0 16px' }}>
          <Tabs
            activeKey={activeKey}
            onChange={handleTabChange}
            items={tabItems.map((item) => ({
              key: item.key,
              label: item.label,
            }))}
          />
        </div>
      }
    >
      {currentTab?.children}
    </ModulePageLayout>
  );
};

export default TarifasConveniosPage;
