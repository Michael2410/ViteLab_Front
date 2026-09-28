import { useState, useEffect, useCallback } from 'react';
import {
  Tabs,
  Table,
  Input,
  Select,
  Switch,
  DatePicker,
  Space,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import {
  SearchOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import { ModulePageLayout, brandSearchStyle, brandControlStyle } from '../../../../shared/components/ModulePageLayout';
import { stockApi } from '../stock.api';
import { almacenApi } from '../../shared/almacen.api';
import { useAlmacenSedeStore } from '../../shared/sede.store';
import type { StockItem, KardexItem } from '../stock.types';
import type { Almacen, Categoria } from '../../maestros/maestros.types';

const { Text } = Typography;
const { RangePicker } = DatePicker;

interface TabConfig {
  key: 'stock' | 'kardex';
  label: string;
  description: string;
}

const TABS_CONFIG: TabConfig[] = [
  {
    key: 'stock',
    label: 'Stock Actual & Existencias',
    description: 'Saldos disponibles en tiempo real, desglose por lotes y alertas de existencias en almacenes',
  },
  {
    key: 'kardex',
    label: 'Kardex de Movimientos',
    description: 'Trazabilidad cronológica de ingresos, despachos, consumos, transferencias y ajustes de inventario',
  },
];

export default function StockListPage() {
  const [activeTab, setActiveTab] = useState<'stock' | 'kardex'>('stock');
  const { sedeId } = useAlmacenSedeStore();

  // Estados Catálogos
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  // Estados Stock
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [totalStock, setTotalStock] = useState(0);
  const [pageStock, setPageStock] = useState(1);
  const [limitStock, setLimitStock] = useState(10);
  const [searchStock, setSearchStock] = useState('');
  const [almacenIdStock, setAlmacenIdStock] = useState<number | undefined>(undefined);
  const [categoriaIdStock, setCategoriaIdStock] = useState<number | undefined>(undefined);
  const [desglosarLote, setDesglosarLote] = useState(false);
  const [soloConSaldo, setSoloConSaldo] = useState(true);
  const [loadingStock, setLoadingStock] = useState(false);

  // Estados Kardex
  const [kardexItems, setKardexItems] = useState<KardexItem[]>([]);
  const [totalKardex, setTotalKardex] = useState(0);
  const [pageKardex, setPageKardex] = useState(1);
  const [limitKardex, setLimitKardex] = useState(10);
  const [tipoMovimiento, setTipoMovimiento] = useState<string | undefined>(undefined);
  const [almacenIdKardex, setAlmacenIdKardex] = useState<number | undefined>(undefined);
  const [rangoKardex, setRangoKardex] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [loadingKardex, setLoadingKardex] = useState(false);

  // Cargar catálogos
  useEffect(() => {
    almacenApi
      .get<Almacen[]>('/maestros/almacenes', { sede_id: sedeId, activo: true })
      .then((data) => setAlmacenes(data || []))
      .catch((err) => console.error(err));

    almacenApi
      .get<Categoria[]>('/maestros/categorias', { activo: true })
      .then((data) => setCategorias(data || []))
      .catch((err) => console.error(err));
  }, [sedeId]);

  // Cargar Stock
  const cargarStock = useCallback(async () => {
    try {
      setLoadingStock(true);
      const res = await stockApi.listarStock({
        page: pageStock,
        limit: limitStock,
        search: searchStock.trim() || undefined,
        almacen_id: almacenIdStock,
        categoria_id: categoriaIdStock,
        desglosar_lote: desglosarLote,
        con_saldo: soloConSaldo,
      });
      setStockItems(res.items || []);
      setTotalStock(res.total || 0);
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Error cargando stock');
    } finally {
      setLoadingStock(false);
    }
  }, [pageStock, limitStock, searchStock, almacenIdStock, categoriaIdStock, desglosarLote, soloConSaldo]);

  // Cargar Kardex
  const cargarKardex = useCallback(async () => {
    try {
      setLoadingKardex(true);
      const res = await stockApi.listarKardex({
        page: pageKardex,
        limit: limitKardex,
        tipo: tipoMovimiento,
        almacen_id: almacenIdKardex,
        fecha_desde: rangoKardex ? rangoKardex[0].format('YYYY-MM-DD') : undefined,
        fecha_hasta: rangoKardex ? rangoKardex[1].format('YYYY-MM-DD') : undefined,
      });
      setKardexItems(res.items || []);
      setTotalKardex(res.total || 0);
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Error cargando kardex');
    } finally {
      setLoadingKardex(false);
    }
  }, [pageKardex, limitKardex, tipoMovimiento, almacenIdKardex, rangoKardex]);

  useEffect(() => {
    if (activeTab === 'stock') cargarStock();
    if (activeTab === 'kardex') cargarKardex();
  }, [activeTab, cargarStock, cargarKardex]);

  // Columnas Stock
  const columnsStock: ColumnsType<StockItem> = [
    {
      title: 'Producto',
      key: 'prod',
      render: (_, r) => (
        <div>
          <Text strong>{r.producto_nombre}</Text>
          {r.producto_codigo && (
            <div>
              <Text type="secondary" style={{ fontSize: 11 }}>
                {r.producto_codigo}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Almacén',
      dataIndex: 'almacen_nombre',
      key: 'alm',
      width: 170,
      render: (alm, r) => (
        <div>
          <span>{alm}</span>
          <div style={{ fontSize: 11, color: '#64748b' }}>{r.sede_nombre}</div>
        </div>
      ),
    },
    {
      title: 'Categoría',
      dataIndex: 'categoria_nombre',
      key: 'cat',
      width: 150,
      render: (c) => c ? <Tag color="blue">{c}</Tag> : <Text type="secondary">—</Text>,
    },
    ...(desglosarLote
      ? [
          {
            title: 'Lote / Marca',
            key: 'lote',
            width: 160,
            render: (_: any, r: StockItem) => (
              <div>
                <Tag color="geekblue">{r.numero_lote || 'Genérico'}</Tag>
                {r.marca && <span style={{ fontSize: 11, color: '#64748b' }}>{r.marca}</span>}
              </div>
            ),
          },
          {
            title: 'Vencimiento',
            dataIndex: 'fecha_vencimiento',
            key: 'venc',
            width: 130,
            render: (v: string | null) => {
              if (!v) return <Text type="secondary">—</Text>;
              const dias = dayjs(v).diff(dayjs(), 'day');
              const color = dias < 0 ? 'magenta' : dias <= 30 ? 'red' : dias <= 90 ? 'gold' : 'default';
              return (
                <Tooltip title={dias < 0 ? 'Lote vencido' : `Vence en ${dias} días`}>
                  <Tag color={color}>{v}</Tag>
                </Tooltip>
              );
            },
          },
        ]
      : [
          {
            title: 'Lotes Registrados',
            dataIndex: 'total_lotes',
            key: 'lotes_count',
            width: 140,
            render: (t: number) => <Tag color="cyan">{t || 1} lotes</Tag>,
          },
          {
            title: 'Próximo Vencimiento',
            dataIndex: 'proximo_vencimiento',
            key: 'prox_venc',
            width: 180,
            render: (v: string | null) => {
              if (!v) return <Text type="secondary">—</Text>;
              const dias = dayjs(v).diff(dayjs(), 'day');
              const color = dias < 0 ? 'magenta' : dias <= 30 ? 'red' : dias <= 90 ? 'gold' : 'green';
              return (
                <Tooltip title={dias < 0 ? 'Vencido' : `Próximo a vencer en ${dias} días`}>
                  <Tag color={color}>{v}</Tag>
                </Tooltip>
              );
            },
          },
        ]),
    {
      title: 'Saldo Actual',
      dataIndex: 'cantidad',
      key: 'cant',
      width: 120,
      align: 'right',
      render: (c, r) => (
        <span style={{ fontWeight: 700, fontSize: 14, color: Number(c) > 0 ? '#0f172a' : '#ef4444' }}>
          {Number(c).toLocaleString()} {r.unidad_medida_codigo || ''}
        </span>
      ),
    },
    {
      title: 'Nivel Stock',
      key: 'nivel',
      width: 130,
      align: 'center',
      render: (_, r) => {
        const cant = Number(r.cantidad);
        const min = Number(r.stock_minimo);
        if (cant <= 0) return <Tag color="error">Agotado</Tag>;
        if (min > 0 && cant <= min) return <Tag color="warning" icon={<WarningOutlined />}>Bajo Stock</Tag>;
        return <Tag color="success">Normal</Tag>;
      },
    },
  ];

  // Columnas Kardex
  const columnsKardex: ColumnsType<KardexItem> = [
    {
      title: 'Fecha / Hora',
      dataIndex: 'fecha',
      key: 'fecha',
      width: 160,
      render: (f: string) => dayjs(f).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: 'Operación',
      dataIndex: 'tipo',
      key: 'tipo',
      width: 140,
      render: (t: string) => {
        const color =
          t === 'INGRESO'
            ? 'green'
            : t === 'DESPACHO'
            ? 'blue'
            : t === 'CONSUMO'
            ? 'purple'
            : t === 'ANULACION'
            ? 'red'
            : 'default';
        return <Tag color={color}>{t}</Tag>;
      },
    },
    {
      title: 'Producto',
      key: 'prod',
      render: (_, r) => (
        <div>
          <Text strong>{r.producto_nombre}</Text>
          {r.producto_codigo && (
            <div style={{ fontSize: 11, color: '#64748b' }}>{r.producto_codigo}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Lote',
      dataIndex: 'numero_lote',
      key: 'lote',
      width: 120,
      render: (l) => l ? <Tag color="geekblue">{l}</Tag> : <Text type="secondary">—</Text>,
    },
    {
      title: 'Cantidad',
      key: 'cant',
      width: 200,
      align: 'right',
      render: (_, r) => {
        const esSalida = ['DESPACHO', 'CONSUMO', 'TRANSFERENCIA_SALIDA', 'AJUSTE_SALIDA'].includes(r.tipo);
        return (
          <span style={{ fontWeight: 700, color: esSalida ? '#ef4444' : '#10b981' }}>
            {esSalida ? '-' : '+'}{Number(r.cantidad).toLocaleString()} {r.unidad_medida_codigo || ''}
          </span>
        );
      },
    },
    {
      title: 'Documento Ref.',
      key: 'doc',
      width: 140,
      render: (_, r) => (
        <span style={{ fontSize: 12, color: '#334155' }}>
          {r.documento_tipo} #{r.documento_id}
        </span>
      ),
    },
    {
      title: 'Usuario / Actor',
      dataIndex: 'usuario_nombre',
      key: 'user',
      width: 130,
    },
  ];

  const currentTabConfig = TABS_CONFIG.find((t) => t.key === activeTab) || TABS_CONFIG[0];

  return (
    <ModulePageLayout
      title="Stock & Kardex de Almacén"
      subtitle={currentTabConfig.description}
      extraHeader={
        <div style={{ backgroundColor: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '6px 16px 0 16px' }}>
          <Tabs
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key as 'stock' | 'kardex')}
            items={TABS_CONFIG.map((t) => ({
              key: t.key,
              label: (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 6px' }}>
                  <span style={{ fontWeight: 600 }}>{t.label}</span>
                </span>
              ),
            }))}
          />
        </div>
      }
    >
      {activeTab === 'stock' && (
        <div>
          {/* FILTROS DE STOCK */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              padding: '12px 16px',
              marginBottom: 16,
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.02)',
            }}
          >
            <Space wrap size="middle" style={{ width: '100%', justifyContent: 'space-between' }}>
              <Space wrap size="middle">
                <Input
                  placeholder="Buscar por producto o lote..."
                  prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                  value={searchStock}
                  onChange={(e) => setSearchStock(e.target.value)}
                  onPressEnter={() => {
                    setPageStock(1);
                    cargarStock();
                  }}
                  style={{ width: 260, ...brandSearchStyle }}
                  allowClear
                />

                <Select
                  placeholder="Todos los almacenes"
                  allowClear
                  value={almacenIdStock}
                  onChange={(v) => {
                    setAlmacenIdStock(v);
                    setPageStock(1);
                  }}
                  style={{ width: 200, ...brandControlStyle }}
                  options={almacenes.map((a) => ({ value: a.id, label: a.nombre }))}
                />

                <Select
                  placeholder="Categoría"
                  allowClear
                  value={categoriaIdStock}
                  onChange={(v) => {
                    setCategoriaIdStock(v);
                    setPageStock(1);
                  }}
                  style={{ width: 180, ...brandControlStyle }}
                  options={categorias.map((c) => ({ value: c.id, label: c.nombre }))}
                />
              </Space>

              <Space wrap size="middle">
                <span style={{ fontSize: 12, color: '#475569' }}>Desglosar por lote:</span>
                <Switch checked={desglosarLote} onChange={(checked) => setDesglosarLote(checked)} />

                <span style={{ fontSize: 12, color: '#475569', marginLeft: 8 }}>Solo con saldo:</span>
                <Switch checked={soloConSaldo} onChange={(checked) => setSoloConSaldo(checked)} />
              </Space>
            </Space>
          </div>

          <Table<StockItem>
            rowKey={(r, i) => `${r.almacen_id}-${r.producto_id}-${r.lote_id || i}`}
            columns={columnsStock}
            dataSource={stockItems}
            loading={loadingStock}
            scroll={{ x: 'max-content' }}
            pagination={{
              current: pageStock,
              pageSize: limitStock,
              total: totalStock,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50'],
              onChange: (p, l) => {
                setPageStock(p);
                setLimitStock(l);
              },
              showTotal: (tot) => `Total: ${tot} registros de stock`,
            }}
          />
        </div>
      )}

      {activeTab === 'kardex' && (
        <div>
          {/* FILTROS DE KARDEX */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              padding: '12px 16px',
              marginBottom: 16,
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.02)',
            }}
          >
            <Space wrap size="middle">
              <Select
                placeholder="Tipo de Operación"
                allowClear
                value={tipoMovimiento}
                onChange={(v) => {
                  setTipoMovimiento(v);
                  setPageKardex(1);
                }}
                style={{ width: 180, ...brandControlStyle }}
                options={[
                  { value: 'INGRESO', label: 'Ingreso' },
                  { value: 'DESPACHO', label: 'Despacho' },
                  { value: 'CONSUMO', label: 'Consumo' },
                  { value: 'DEVOLUCION', label: 'Devolución' },
                  { value: 'TRANSFERENCIA_SALIDA', label: 'Transf. Salida' },
                  { value: 'TRANSFERENCIA_ENTRADA', label: 'Transf. Entrada' },
                  { value: 'AJUSTE_ENTRADA', label: 'Ajuste Entrada' },
                  { value: 'AJUSTE_SALIDA', label: 'Ajuste Salida' },
                  { value: 'ANULACION', label: 'Anulación' },
                ]}
              />

              <Select
                placeholder="Almacén"
                allowClear
                value={almacenIdKardex}
                onChange={(v) => {
                  setAlmacenIdKardex(v);
                  setPageKardex(1);
                }}
                style={{ width: 200, ...brandControlStyle }}
                options={almacenes.map((a) => ({ value: a.id, label: a.nombre }))}
              />

              <RangePicker
                style={{ width: 240, ...brandControlStyle }}
                format="YYYY-MM-DD"
                value={rangoKardex}
                onChange={(dates) => {
                  setRangoKardex(dates ? [dates[0]!, dates[1]!] : null);
                  setPageKardex(1);
                }}
              />
            </Space>
          </div>

          <Table<KardexItem>
            rowKey="id"
            columns={columnsKardex}
            dataSource={kardexItems}
            loading={loadingKardex}
            scroll={{ x: 'max-content' }}
            pagination={{
              current: pageKardex,
              pageSize: limitKardex,
              total: totalKardex,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50'],
              onChange: (p, l) => {
                setPageKardex(p);
                setLimitKardex(l);
              },
              showTotal: (tot) => `Total: ${tot} movimientos registrados`,
            }}
          />
        </div>
      )}
    </ModulePageLayout>
  );
}
