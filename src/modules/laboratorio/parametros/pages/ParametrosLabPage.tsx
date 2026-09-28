import React, { useState, useMemo } from 'react';
import { Tabs } from 'antd';
import { useSearchParams } from 'react-router-dom';
import ModulePageLayout, { BrandCreateButton } from '../../../../shared/components/ModulePageLayout';
import { useAuthStore } from '../../../auth/hooks';
import { AreasPage } from '../../areas/pages/AreasPage';
import { MetodosPage } from '../../metodos/pages/MetodosPage';
import { MuestrasPage } from '../../muestras/pages/MuestrasPage';

export const ParametrosLabPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasPermission } = useAuthStore();
  const [createTrigger, setCreateTrigger] = useState(0);

  const activeKey = useMemo(() => {
    const requestedTab = searchParams.get('tab');
    if (requestedTab && ['areas', 'metodos', 'muestras'].includes(requestedTab)) {
      return requestedTab;
    }
    return 'areas';
  }, [searchParams]);

  const tabItems = useMemo(() => {
    const items = [];

    if (hasPermission('catalogs.areas.read')) {
      items.push({
        key: 'areas',
        label: (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 6px' }}>
            <span style={{ fontWeight: 600 }}>Áreas Técnicas</span>
          </span>
        ),
        description: 'Configuración y control de áreas de procesamiento analítico y departamentos de laboratorio',
        children: <AreasPage isTab createTrigger={createTrigger} />,
      });
    }

    if (hasPermission('catalogs.methods.read')) {
      items.push({
        key: 'metodos',
        label: (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 6px' }}>
            <span style={{ fontWeight: 600 }}>Métodos y Técnicas</span>
          </span>
        ),
        description: 'Técnicas de análisis, metodologías instrumentales y principios analíticos aplicados',
        children: <MetodosPage isTab createTrigger={createTrigger} />,
      });
    }

    if (hasPermission('catalogs.muestras.read')) {
      items.push({
        key: 'muestras',
        label: (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 6px' }}>
            <span style={{ fontWeight: 600 }}>Tipos de Muestra</span>
          </span>
        ),
        description: 'Tipos biológicos de especímenes, condiciones de conservación y recipientes de recolección',
        children: <MuestrasPage isTab createTrigger={createTrigger} />,
      });
    }

    return items;
  }, [hasPermission, createTrigger]);

  const currentTab = useMemo(() => tabItems.find((i) => i.key === activeKey) || tabItems[0], [activeKey, tabItems]);

  const handleTabChange = (key: string) => {
    setSearchParams({ tab: key });
  };

  const actionButton = useMemo(() => {
    if (activeKey === 'areas' && hasPermission('catalogs.areas.create')) {
      return (
        <BrandCreateButton onClick={() => setCreateTrigger((prev) => prev + 1)}>
          Nueva Área
        </BrandCreateButton>
      );
    }
    if (activeKey === 'metodos' && hasPermission('catalogs.methods.create')) {
      return (
        <BrandCreateButton onClick={() => setCreateTrigger((prev) => prev + 1)}>
          Nuevo Método
        </BrandCreateButton>
      );
    }
    if (activeKey === 'muestras' && hasPermission('catalogs.muestras.create')) {
      return (
        <BrandCreateButton onClick={() => setCreateTrigger((prev) => prev + 1)}>
          Nueva Muestra
        </BrandCreateButton>
      );
    }
    return undefined;
  }, [activeKey, hasPermission]);

  return (
    <ModulePageLayout
      title="Parámetros del Laboratorio"
      subtitle={currentTab?.description || 'Configuración técnica de áreas de procesamiento, metodologías analíticas y tipos de muestras'}
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

export default ParametrosLabPage;
