import React, { useState, useMemo } from 'react';
import { Tabs, Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import ModulePageLayout, { BrandCreateButton, brandSearchStyle } from '../../../../shared/components/ModulePageLayout';
import { useAuthStore } from '../../../auth/hooks';
import { TarifariosPage } from './TarifariosPage';
import { ConveniosPage } from '../../convenios/pages/ConveniosPage';
import { TiposClientePage } from '../../tipos-cliente/pages/TiposClientePage';

export const TarifasConveniosPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasPermission } = useAuthStore();
  const [createTrigger, setCreateTrigger] = useState(0);
  const [searchText, setSearchText] = useState('');

  const activeKey = useMemo(() => {
    const requestedTab = searchParams.get('tab');
    if (requestedTab && ['tarifarios', 'convenios', 'tipos-cliente'].includes(requestedTab)) {
      return requestedTab;
    }
    return 'tarifarios';
  }, [searchParams]);

  const searchPlaceholder = useMemo(() => {
    switch (activeKey) {
      case 'tarifarios':
        return 'Buscar tarifario...';
      case 'convenios':
        return 'Buscar por empresa o RUC...';
      case 'tipos-cliente':
        return 'Buscar por tipo de cliente...';
      default:
        return 'Buscar...';
    }
  }, [activeKey]);

  const tabItems = useMemo(() => {
    const items = [];

    if (hasPermission('tariffs.read')) {
      items.push({
        key: 'tarifarios',
        label: (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 6px' }}>
            <span style={{ fontWeight: 600 }}>Tarifarios y Precios</span>
          </span>
        ),
        description: 'Listas de precios base, tarifas especiales y márgenes para análisis clínicos',
        children: <TarifariosPage isTab createTrigger={createTrigger} externalSearch={searchText} />,
      });
    }

    if (hasPermission('catalogs.convenios.read')) {
      items.push({
        key: 'convenios',
        label: (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 6px' }}>
            <span style={{ fontWeight: 600 }}>Convenios Empresariales</span>
          </span>
        ),
        description: 'Acuerdos comerciales con empresas, aseguradoras y centros médicos remitentes',
        children: <ConveniosPage isTab createTrigger={createTrigger} externalSearch={searchText} />,
      });
    }

    if (hasPermission('catalogs.tipos-cliente.read')) {
      items.push({
        key: 'tipos-cliente',
        label: (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 6px' }}>
            <span style={{ fontWeight: 600 }}>Tipos de Cliente</span>
          </span>
        ),
        description: 'Segmentación comercial de clientes, pacientes particulares e institucionales',
        children: <TiposClientePage isTab createTrigger={createTrigger} externalSearch={searchText} />,
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
          style={{ width: 250, ...brandSearchStyle }}
        />
        {createBtn}
      </div>
    );
  }, [activeKey, hasPermission, searchPlaceholder, searchText]);

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
