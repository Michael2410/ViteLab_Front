import React, { useState, useMemo } from 'react';
import { Tabs } from 'antd';
import { useSearchParams } from 'react-router-dom';
import { ExperimentOutlined, AppstoreOutlined } from '@ant-design/icons';
import ModulePageLayout, { BrandCreateButton } from '../../../../shared/components/ModulePageLayout';
import { useAuthStore } from '../../../auth/hooks';
import { AnalisisPage } from './AnalisisPage';
import { ComponentesPage } from '../../componentes/pages/ComponentesPage';

export const AnalisisCatalogoPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasPermission } = useAuthStore();
  const [createTrigger, setCreateTrigger] = useState(0);

  const activeKey = useMemo(() => {
    const requestedTab = searchParams.get('tab');
    if (requestedTab && ['analisis', 'componentes'].includes(requestedTab)) {
      return requestedTab;
    }
    return 'analisis';
  }, [searchParams]);

  const tabItems = useMemo(() => {
    const items = [];

    if (hasPermission('catalogs.analysis.read')) {
      items.push({
        key: 'analisis',
        label: (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 6px' }}>
            <ExperimentOutlined style={{ fontSize: 16 }} />
            <span style={{ fontWeight: 600 }}>Análisis Clínicos</span>
          </span>
        ),
        description: 'Catálogo oficial de pruebas analíticas, perfiles diagnósticos y valores de referencia',
        children: <AnalisisPage isTab createTrigger={createTrigger} />,
      });
    }

    if (hasPermission('catalogs.components.read')) {
      items.push({
        key: 'componentes',
        label: (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 6px' }}>
            <AppstoreOutlined style={{ fontSize: 16 }} />
            <span style={{ fontWeight: 600 }}>Componentes / Analitos</span>
          </span>
        ),
        description: 'Parámetros individuales, analitos y variables medibles en pruebas analíticas',
        children: <ComponentesPage isTab createTrigger={createTrigger} />,
      });
    }

    return items;
  }, [hasPermission, createTrigger]);

  const currentTab = useMemo(() => tabItems.find((i) => i.key === activeKey) || tabItems[0], [activeKey, tabItems]);

  const handleTabChange = (key: string) => {
    setSearchParams({ tab: key });
  };

  const actionButton = useMemo(() => {
    if (activeKey === 'analisis' && hasPermission('catalogs.analysis.create')) {
      return (
        <BrandCreateButton onClick={() => setCreateTrigger((prev) => prev + 1)}>
          Nuevo Análisis
        </BrandCreateButton>
      );
    }
    if (activeKey === 'componentes' && hasPermission('catalogs.components.create')) {
      return (
        <BrandCreateButton onClick={() => setCreateTrigger((prev) => prev + 1)}>
          Nuevo Componente
        </BrandCreateButton>
      );
    }
    return undefined;
  }, [activeKey, hasPermission]);

  return (
    <ModulePageLayout
      title="Catálogo de Análisis Clínicos"
      subtitle={currentTab?.description || 'Gestión integral de exámenes de laboratorio, pruebas analíticas y componentes asociados'}
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

export default AnalisisCatalogoPage;
