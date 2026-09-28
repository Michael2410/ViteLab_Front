import { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Typography,
  Card,
  Row,
  Col,
  Tabs,
  message,
} from 'antd';
import {
  SearchOutlined,
  ShoppingOutlined,
  RollbackOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import { ModulePageLayout, BrandCreateButton, brandSearchStyle, brandControlStyle } from '../../../../shared/components/ModulePageLayout';
import { usePermissions } from '../../../../shared/components/PermissionGuard';
import { custodiaApi } from '../custodia.api';
import { personalApi } from '../../../personal/api';
import type { ItemCustodia, CustodiaResumen, Consumo, Devolucion } from '../custodia.types';
import type { Personal } from '../../../personal/types';
import ConsumoDrawer from '../components/ConsumoDrawer';
import DevolucionDrawer from '../components/DevolucionDrawer';

const { Text } = Typography;

interface TabConfig {
  key: 'custodia' | 'consumos' | 'devoluciones';
  label: string;
  description: string;
}

const TABS_CONFIG: TabConfig[] = [
  {
    key: 'custodia',
    label: 'Mi Inventario en Custodia',
    description: 'Control de reactivos, insumos y materiales asignados en custodia física al colaborador',
  },
  {
    key: 'consumos',
    label: 'Historial de Consumos',
    description: 'Registro histórico de insumos consumidos en procedimientos y análisis clínicos',
  },
  {
    key: 'devoluciones',
    label: 'Historial de Devoluciones',
    description: 'Registro de devoluciones de materiales y reactivos no utilizados al almacén central',
  },
];

export default function CustodiaPage() {
  const [activeTab, setActiveTab] = useState<'custodia' | 'consumos' | 'devoluciones'>('custodia');

  // Custodia State
  const [itemsCustodia, setItemsCustodia] = useState<ItemCustodia[]>([]);
  const [resumen, setResumen] = useState<CustodiaResumen>({
    total_items: 0,
    total_unidades: 0,
    items_por_vencer: 0,
    items_vencidos: 0,
  });
  const [loadingCustodia, setLoadingCustodia] = useState(false);
  const [totalCustodia, setTotalCustodia] = useState(0);
  const [pageCustodia, setPageCustodia] = useState(1);
  const [searchCustodia, setSearchCustodia] = useState('');

  // Collaborator filter (if supervisor)
  const [personalList, setPersonalList] = useState<Personal[]>([]);
  const [selectedPersonalId, setSelectedPersonalId] = useState<number | undefined>(undefined);

  // Consumos & Devoluciones History State
  const [consumos, setConsumos] = useState<Consumo[]>([]);
  const [loadingConsumos, setLoadingConsumos] = useState(false);
  const [devoluciones, setDevoluciones] = useState<Devolucion[]>([]);
  const [loadingDevoluciones, setLoadingDevoluciones] = useState(false);

  // Drawers
  const [consumoDrawerOpen, setConsumoDrawerOpen] = useState(false);
  const [devolucionDrawerOpen, setDevolucionDrawerOpen] = useState(false);

  const { hasPermission, isSuperAdmin } = usePermissions();
  const canViewAllPersonal = isSuperAdmin || hasPermission('almacen.custodia.read_personal');
  const canCreateConsumo = isSuperAdmin || hasPermission('almacen.consumos.create');

  useEffect(() => {
    if (canViewAllPersonal) {
      personalApi
        .getAll({ activo: true })
        .then((data) => setPersonalList(data || []))
        .catch(console.error);
    }
  }, [canViewAllPersonal]);

  const cargarCustodia = useCallback(async () => {
    try {
      setLoadingCustodia(true);
      const [res, stats] = await Promise.all([
        custodiaApi.listar({
          page: pageCustodia,
          limit: 20,
          personal_id: selectedPersonalId,
          search: searchCustodia.trim() || undefined,
          solo_con_stock: true,
        }),
        custodiaApi.obtenerResumen(selectedPersonalId),
      ]);
      setItemsCustodia(res.items || []);
      setTotalCustodia(res.total || 0);
      if (stats) setResumen(stats);
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Error cargando inventario en custodia');
    } finally {
      setLoadingCustodia(false);
    }
  }, [pageCustodia, selectedPersonalId, searchCustodia]);

  const cargarConsumos = useCallback(async () => {
    try {
      setLoadingConsumos(true);
      const res = await custodiaApi.listarConsumos({
        personal_id: selectedPersonalId,
        limit: 50,
      });
      setConsumos(res.items || []);
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Error cargando consumos');
    } finally {
      setLoadingConsumos(false);
    }
  }, [selectedPersonalId]);

  const cargarDevoluciones = useCallback(async () => {
    try {
      setLoadingDevoluciones(true);
      const res = await custodiaApi.listarDevoluciones({
        personal_id: selectedPersonalId,
        limit: 50,
      });
      setDevoluciones(res.items || []);
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Error cargando devoluciones');
    } finally {
      setLoadingDevoluciones(false);
    }
  }, [selectedPersonalId]);

  useEffect(() => {
    if (activeTab === 'custodia') cargarCustodia();
    else if (activeTab === 'consumos') cargarConsumos();
    else if (activeTab === 'devoluciones') cargarDevoluciones();
  }, [activeTab, cargarCustodia, cargarConsumos, cargarDevoluciones]);

  const handleRefresh = () => {
    if (activeTab === 'custodia') cargarCustodia();
    else if (activeTab === 'consumos') cargarConsumos();
    else if (activeTab === 'devoluciones') cargarDevoluciones();
  };

  const columnsCustodia: ColumnsType<ItemCustodia> = [
    {
      title: 'Código',
      dataIndex: 'producto_codigo',
      key: 'producto_codigo',
      width: 100,
      render: (v) => <Text code>{v || '-'}</Text>,
    },
    {
      title: 'Producto / Reactivo',
      dataIndex: 'producto_nombre',
      key: 'producto_nombre',
      render: (v, r) => (
        <div>
          <Text strong>{v}</Text>
          <Text type="secondary" style={{ display: 'block', fontSize: 11 }}>
            Origen: {r.almacen_nombre}
          </Text>
        </div>
      ),
    },
    {
      title: 'Lote',
      dataIndex: 'numero_lote',
      key: 'numero_lote',
      width: 130,
      render: (v) => <Tag color="blue">{v || 'Sin lote'}</Tag>,
    },
    {
      title: 'Vencimiento',
      key: 'vencimiento',
      width: 150,
      render: (_, r) => {
        if (!r.fecha_vencimiento) return <Text type="secondary">-</Text>;
        let color = 'cyan';
        let icon = <CheckCircleOutlined />;
        if (r.estado_vencimiento === 'VENCIDO') {
          color = 'red';
          icon = <CloseCircleOutlined />;
        } else if (r.estado_vencimiento === 'POR_VENCER') {
          color = 'orange';
          icon = <WarningOutlined />;
        }
        return (
          <Tag color={color} icon={icon}>
            {r.fecha_vencimiento} ({r.dias_para_vencer} d)
          </Tag>
        );
      },
    },
    {
      title: 'Saldo en Custodia',
      dataIndex: 'cantidad',
      key: 'cantidad',
      width: 160,
      align: 'left',
      render: (v, r) => (
        <Text strong style={{ fontSize: 14, color: '#059669' }}>
          {v} {r.unidad_medida_codigo}
        </Text>
      ),
    },
    ...(canViewAllPersonal && !selectedPersonalId
      ? [
          {
            title: 'Personal',
            key: 'personal',
            render: (_: any, r: ItemCustodia) => (
              <Text>{r.personal_nombres} {r.personal_apellidos}</Text>
            ),
          },
        ]
      : []),
  ];

  const columnsConsumos: ColumnsType<Consumo> = [
    {
      title: 'Número',
      dataIndex: 'numero',
      key: 'numero',
      width: 140,
      render: (v) => <Text strong style={{ color: '#0284c7' }}>{v}</Text>,
    },
    {
      title: 'Fecha',
      dataIndex: 'fecha',
      key: 'fecha',
      width: 120,
      render: (v) => (v ? dayjs(v).format('YYYY-MM-DD') : '-'),
    },
    {
      title: 'Personal',
      key: 'personal',
      render: (_, r) => <Text>{r.personal_nombres} {r.personal_apellidos}</Text>,
    },
    {
      title: 'Observaciones',
      dataIndex: 'observaciones',
      key: 'observaciones',
      render: (v) => v || '-',
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      width: 110,
      render: (v) => <Tag color={v === 'REGISTRADO' ? 'green' : 'red'}>{v}</Tag>,
    },
  ];

  const columnsDevoluciones: ColumnsType<Devolucion> = [
    {
      title: 'Número',
      dataIndex: 'numero',
      key: 'numero',
      width: 140,
      render: (v) => <Text strong style={{ color: '#0284c7' }}>{v}</Text>,
    },
    {
      title: 'Fecha',
      dataIndex: 'fecha',
      key: 'fecha',
      width: 120,
      render: (v) => (v ? dayjs(v).format('YYYY-MM-DD') : '-'),
    },
    {
      title: 'Almacén Destino',
      dataIndex: 'almacen_nombre',
      key: 'almacen_nombre',
      render: (v) => <Tag color="blue">{v || 'Almacén'}</Tag>,
    },
    {
      title: 'Personal',
      key: 'personal',
      render: (_, r) => <Text>{r.personal_nombres} {r.personal_apellidos}</Text>,
    },
    {
      title: 'Observaciones',
      dataIndex: 'observaciones',
      key: 'observaciones',
      render: (v) => v || '-',
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      width: 110,
      render: (v) => <Tag color={v === 'REGISTRADO' ? 'green' : 'red'}>{v}</Tag>,
    },
  ];

  const currentTabConfig = TABS_CONFIG.find((t) => t.key === activeTab) || TABS_CONFIG[0];

  return (
    <ModulePageLayout
      title="Custodia Personal & Consumos"
      subtitle={currentTabConfig.description}
      actionButton={
        canCreateConsumo ? (
          <Space>
            <BrandCreateButton
              icon={<ShoppingOutlined />}
              onClick={() => setConsumoDrawerOpen(true)}
            >
              Registrar Consumo
            </BrandCreateButton>
            <Button
              icon={<RollbackOutlined />}
              onClick={() => setDevolucionDrawerOpen(true)}
              style={{ height: 38, borderRadius: 8 }}
            >
              Devolver a Almacén
            </Button>
          </Space>
        ) : undefined
      }
      extraHeader={
        <div style={{ backgroundColor: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '6px 16px 0 16px' }}>
          <Tabs
            activeKey={activeTab}
            onChange={(k) => setActiveTab(k as 'custodia' | 'consumos' | 'devoluciones')}
            items={TABS_CONFIG.map((t) => ({
              key: t.key,
              label: (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 6px' }}>
                  <span style={{ fontWeight: 600 }}>{t.label}</span>
                  {t.key === 'custodia' && totalCustodia > 0 && (
                    <Tag style={{ margin: 0, borderRadius: 10, fontSize: 11, backgroundColor: '#f1f5f9', color: '#475569' }}>
                      {totalCustodia}
                    </Tag>
                  )}
                </span>
              ),
            }))}
          />
        </div>
      }
      filters={
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {canViewAllPersonal && (
              <Select
                placeholder="Ver inventario de: (Todo el personal)"
                value={selectedPersonalId}
                onChange={(val) => {
                  setSelectedPersonalId(val);
                  setPageCustodia(1);
                }}
                style={{ width: 280, ...brandControlStyle }}
                allowClear
                showSearch
                optionFilterProp="label"
                options={personalList.map((p) => ({
                  value: p.id,
                  label: `${p.nombres} ${p.apellidos} (${p.numero_documento || 'Sin doc'})`,
                }))}
              />
            )}

            <Input
              placeholder="Buscar por código, nombre o lote..."
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              value={searchCustodia}
              onChange={(e) => {
                setSearchCustodia(e.target.value);
                setPageCustodia(1);
              }}
              style={{ width: 280, ...brandSearchStyle }}
              allowClear
            />
          </div>
          {activeTab === 'custodia' && (
            <Text type="secondary" style={{ fontSize: 13 }}>
              Total en custodia: <strong style={{ color: '#0f172a' }}>{totalCustodia}</strong>
            </Text>
          )}
        </div>
      }
    >
      {/* Resumen KPI */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: 8, borderLeft: '4px solid #3b82f6' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Ítems en Custodia</Text>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#1e293b' }}>
              {resumen.total_items}
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: 8, borderLeft: '4px solid #10b981' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Unidades Totales</Text>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#1e293b' }}>
              {resumen.total_unidades}
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: 8, borderLeft: '4px solid #f59e0b' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Por Vencer (≤ 30 d)</Text>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#d97706' }}>
              {resumen.items_por_vencer}
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: 8, borderLeft: '4px solid #ef4444' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Vencidos</Text>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#dc2626' }}>
              {resumen.items_vencidos}
            </div>
          </Card>
        </Col>
      </Row>

      {activeTab === 'custodia' && (
        <Table
          dataSource={itemsCustodia}
          columns={columnsCustodia}
          rowKey="id"
          loading={loadingCustodia}
          pagination={{
            current: pageCustodia,
            pageSize: 20,
            total: totalCustodia,
            onChange: (p) => setPageCustodia(p),
          }}
        />
      )}

      {activeTab === 'consumos' && (
        <Table
          dataSource={consumos}
          columns={columnsConsumos}
          rowKey="id"
          loading={loadingConsumos}
          pagination={{ pageSize: 15 }}
        />
      )}

      {activeTab === 'devoluciones' && (
        <Table
          dataSource={devoluciones}
          columns={columnsDevoluciones}
          rowKey="id"
          loading={loadingDevoluciones}
          pagination={{ pageSize: 15 }}
        />
      )}

      <ConsumoDrawer
        open={consumoDrawerOpen}
        onClose={() => setConsumoDrawerOpen(false)}
        onSuccess={handleRefresh}
        personalId={selectedPersonalId}
        itemsCustodiaIniciales={itemsCustodia}
      />

      <DevolucionDrawer
        open={devolucionDrawerOpen}
        onClose={() => setDevolucionDrawerOpen(false)}
        onSuccess={handleRefresh}
        personalId={selectedPersonalId}
      />
    </ModulePageLayout>
  );
}
