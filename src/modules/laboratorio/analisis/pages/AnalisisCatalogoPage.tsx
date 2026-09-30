import React, { useState, useMemo } from 'react';
import { Tabs, Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import ModulePageLayout, { BrandCreateButton, brandSearchStyle } from '../../../../shared/components/ModulePageLayout';
import { useAuthStore } from '../../../auth/hooks';
import { AnalisisPage } from './AnalisisPage';
import { ComponentesPage } from '../../componentes/pages/ComponentesPage';

export const AnalisisCatalogoPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasPermission } = useAuthStore();
  const [createTrigger, setCreateTrigger] = useState(0);
  const [searchText, setSearchText] = useState('');

  const activeKey = useMemo(() => {
    const requestedTab = searchParams.get('tab');
    if (requestedTab && ['analisis', 'componentes'].includes(requestedTab)) {
      return requestedTab;
    }
    return 'analisis';
  }, [searchParams]);

  const searchPlaceholder = useMemo(() => {
    switch (activeKey) {
      case 'analisis':
        return 'Buscar por nombre o sinónimos...';
      case 'componentes':
        return 'Buscar por nombre de componente...';
      default:
        return 'Buscar...';
    }
  }, [activeKey]);

  const tabItems = useMemo(() => {
    const items = [];

    if (hasPermission('catalogs.analysis.read')) {
      items.push({
        key: 'analisis',
        label: (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 6px' }}>
            <span style={{ fontWeight: 600 }}>Análisis Clínicos</span>
          </span>
        ),
        description: 'Catálogo oficial de pruebas analíticas, perfiles diagnósticos y valores de referencia',
        children: <AnalisisPage isTab createTrigger={createTrigger} externalSearch={searchText} />,
      });
    }

    if (hasPermission('catalogs.components.read')) {
      items.push({
        key: 'componentes',
        label: (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 6px' }}>
            <span style={{ fontWeight: 600 }}>Componentes / Analitos</span>
          </span>
        ),
        description: 'Parámetros individuales, analitos y variables medibles en pruebas analíticas',
        children: <ComponentesPage isTab createTrigger={createTrigger} externalSearch={searchText} />,
      });
    }

    return items;
  }, [hasPermission, createTrigger, searchText]);

  const currentTab = useMemo(() => tabItems.find((i) => i.key === activeKey) || tabItems[0], [activeKey, tabItems]);

  const handleTabChange = (key: string) => {
    setSearchText('');
    setSearchParams({ tab: key });
  };

  const actionButton = useMemo(() => {
    const createBtn = (() => {
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
      return null;
    })();

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <Input
          placeholder={searchPlaceholder}
          prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
          allowClear
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 280, ...brandSearchStyle }}
        />
        {createBtn}
      </div>
    );
  }, [activeKey, hasPermission, searchPlaceholder, searchText]);

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
