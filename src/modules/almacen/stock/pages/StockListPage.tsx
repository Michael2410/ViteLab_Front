import { useState, useEffect, useCallback } from 'react';
import {
  Tabs,
  Input,
  Button,
  Radio,
  DatePicker,
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
import ModulePageLayout, { brandSearchStyle, brandControlStyle, renderTableFilterIcon } from '../../../../shared/components/ModulePageLayout';
import { GlobalTable } from '../../../../shared/components/GlobalTable';
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
  const [almacenIdsStock, setAlmacenIdsStock] = useState<number[] | undefined>(undefined);
  const [categoriaIdsStock, setCategoriaIdsStock] = useState<number[] | undefined>(undefined);
  const [modoVista, setModoVista] = useState<'producto' | 'marca' | 'lote'>('producto');
  const [loadingStock, setLoadingStock] = useState(false);

  // Estados Kardex
  const [kardexItems, setKardexItems] = useState<KardexItem[]>([]);
  const [totalKardex, setTotalKardex] = useState(0);
  const [pageKardex, setPageKardex] = useState(1);
  const [limitKardex, setLimitKardex] = useState(10);
  const [tiposMovimiento, setTiposMovimiento] = useState<string[] | undefined>(undefined);
  const [almacenIdsKardex, setAlmacenIdsKardex] = useState<number[] | undefined>(undefined);
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
        almacen_id: almacenIdsStock,
        categoria_id: categoriaIdsStock,
        agrupar_por: modoVista,
        desglosar_lote: modoVista === 'lote',
        con_saldo: true,
      });
      setStockItems(res.items || []);
      setTotalStock(res.total || 0);
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Error cargando stock');
    } finally {
      setLoadingStock(false);
    }
  }, [pageStock, limitStock, searchStock, almacenIdsStock, categoriaIdsStock, modoVista]);

  // Cargar Kardex
  const cargarKardex = useCallback(async () => {
    try {
      setLoadingKardex(true);
      const res = await stockApi.listarKardex({
        page: pageKardex,
        limit: limitKardex,
        tipo: tiposMovimiento,
        almacen_id: almacenIdsKardex,
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
  }, [pageKardex, limitKardex, tiposMovimiento, almacenIdsKardex, rangoKardex]);

  useEffect(() => {
    if (activeTab === 'stock') cargarStock();
    if (activeTab === 'kardex') cargarKardex();
  }, [activeTab, cargarStock, cargarKardex]);

  const handleTableChangeStock = (pagination: any, tableFilters: any) => {
    setPageStock(pagination.current || 1);
    setLimitStock(pagination.pageSize || limitStock);

    const almVal = tableFilters.almacen_nombre;
    setAlmacenIdsStock(almVal && almVal.length > 0 ? (almVal as any[]).map(Number) : undefined);

    const catVal = tableFilters.categoria_nombre;
    setCategoriaIdsStock(catVal && catVal.length > 0 ? (catVal as any[]).map(Number) : undefined);
  };

  const handleTableChangeKardex = (pagination: any, tableFilters: any) => {
    setPageKardex(pagination.current || 1);
    setLimitKardex(pagination.pageSize || limitKardex);

    const movVal = tableFilters.tipo;
    setTiposMovimiento(movVal && movVal.length > 0 ? (movVal as string[]) : undefined);

    const almVal = tableFilters.almacen_nombre;
    setAlmacenIdsKardex(almVal && almVal.length > 0 ? (almVal as any[]).map(Number) : undefined);
  };

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
      key: 'almacen_nombre',
      width: 170,
      filters: almacenes.map((a) => ({ text: a.nombre, value: a.id })),
      filteredValue: almacenIdsStock && almacenIdsStock.length > 0 ? almacenIdsStock : null,
      filterIcon: renderTableFilterIcon,
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
      key: 'categoria_nombre',
      width: 150,
      filters: categorias.map((c) => ({ text: c.nombre, value: c.id })),
      filteredValue: categoriaIdsStock && categoriaIdsStock.length > 0 ? categoriaIdsStock : null,
      filterIcon: renderTableFilterIcon,
      render: (c) => (c ? <Tag color="blue">{c}</Tag> : <Text type="secondary">—</Text>),
    },
    ...(modoVista === 'lote'
      ? [
          {
            title: 'Lote / Marca',
            key: 'lote',
            width: 160,
            render: (_: any, r: StockItem) => (
              <div>
                <Tag color="geekblue">{r.numero_lote || 'Genérico'}</Tag>
                {r.marca && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{r.marca}</div>}
              </div>
            ),
          },
          {
            title: 'Ubicación',
            key: 'ubicacion',
            width: 140,
            render: (_: any, r: StockItem) => (
              r.ubicacion_codigo ? (
                <Tooltip title={r.ubicacion_nombre ? `${r.ubicacion_codigo} - ${r.ubicacion_nombre}` : r.ubicacion_codigo}>
                  <Tag color="cyan">
                    {r.ubicacion_codigo}
                  </Tag>
                </Tooltip>
              ) : (
                <Text type="secondary">—</Text>
              )
            ),
          },
          {
            title: 'Vencimiento',
            dataIndex: 'fecha_vencimiento',
            key: 'venc',
            width: 170,
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
      : modoVista === 'marca'
      ? [
          {
            title: 'Marca',
            key: 'marca',
            width: 150,
            render: (_: any, r: StockItem) => (
              <Tag color="purple" style={{ fontWeight: 600 }}>
                {r.marca || 'Sin Marca'}
              </Tag>
            ),
          },
          {
            title: 'Lotes Registrados',
            dataIndex: 'total_lotes',
            key: 'lotes_count',
            width: 140,
            render: (t: number) => <Tag color="cyan">{t || 1} {t === 1 ? 'lote' : 'lotes'}</Tag>,
          },
          {
            title: 'Ubicación(es)',
            key: 'ubicaciones_str',
            width: 150,
            render: (_: any, r: StockItem) => (
              r.ubicaciones_str ? (
                <Tooltip title={`Ubicaciones: ${r.ubicaciones_str}`}>
                  <Tag color="cyan">
                    {r.ubicaciones_str}
                  </Tag>
                </Tooltip>
              ) : (
                <Text type="secondary">—</Text>
              )
            ),
          },
          {
            title: 'Próx. Vencimiento',
            dataIndex: 'proximo_vencimiento',
            key: 'prox_venc',
            width: 180,
            render: (v: string | null) => {
              if (!v) return <Text type="secondary">—</Text>;
              const dias = dayjs(v).diff(dayjs(), 'day');
              const color = dias < 0 ? 'magenta' : dias <= 30 ? 'red' : dias <= 90 ? 'gold' : 'green';
              return (
                <Tooltip title={dias < 0 ? 'Lote vencido' : `Lote más próximo de esta marca vence en ${dias} días`}>
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
            width: 150,
            render: (t: number) => <Tag color="cyan">{t || 1} {t === 1 ? 'lote' : 'lotes'}</Tag>,
          },
          {
            title: 'Ubicación(es)',
            key: 'ubicaciones_str',
            width: 160,
            render: (_: any, r: StockItem) => (
              r.ubicaciones_str ? (
                <Tooltip title={`Ubicaciones: ${r.ubicaciones_str}`}>
                  <Tag color="cyan">
                    {r.ubicaciones_str}
                  </Tag>
                </Tooltip>
              ) : (
                <Text type="secondary">—</Text>
              )
            ),
          },
          {
            title: 'Vencimiento',
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
      width: 170,
      render: (f: string) => dayjs(f).format('YYYY-MM-DD HH:mm'),
      filterDropdown: ({ confirm, clearFilters }) => (
        <div style={{ padding: 12, width: 280, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <RangePicker
            style={{ width: '100%', ...brandControlStyle }}
            format="YYYY-MM-DD"
            placeholder={['Desde', 'Hasta']}
            value={rangoKardex}
            onChange={(dates) => {
              setRangoKardex(dates ? [dates[0]!, dates[1]!] : null);
              setPageKardex(1);
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            {rangoKardex && (
              <Button
                size="small"
                onClick={() => {
                  setRangoKardex(null);
                  setPageKardex(1);
                  if (clearFilters) clearFilters();
                  confirm();
                }}
              >
                Limpiar
              </Button>
            )}
            <Button
              type="primary"
              size="small"
              onClick={() => confirm()}
              style={{ background: '#0284c7', borderColor: '#0284c7' }}
            >
              Filtrar
            </Button>
          </div>
        </div>
      ),
      filterIcon: () => renderTableFilterIcon(Boolean(rangoKardex)),
    },
    {
      title: 'Operación',
      dataIndex: 'tipo',
      key: 'tipo',
      width: 150,
      filters: [
        { value: 'INGRESO', text: 'Ingreso' },
        { value: 'DESPACHO', text: 'Despacho' },
        { value: 'CONSUMO', text: 'Consumo' },
        { value: 'DEVOLUCION', text: 'Devolución' },
        { value: 'TRANSFERENCIA_SALIDA', text: 'Transf. Salida' },
        { value: 'TRANSFERENCIA_ENTRADA', text: 'Transf. Entrada' },
        { value: 'AJUSTE_ENTRADA', text: 'Ajuste Entrada' },
        { value: 'AJUSTE_SALIDA', text: 'Ajuste Salida' },
        { value: 'ANULACION', text: 'Anulación' },
      ],
      filteredValue: tiposMovimiento && tiposMovimiento.length > 0 ? tiposMovimiento : null,
      filterIcon: renderTableFilterIcon,
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
      title: 'Almacén',
      dataIndex: 'almacen_nombre',
      key: 'almacen_nombre',
      width: 160,
      filters: almacenes.map((a) => ({ text: a.nombre, value: a.id })),
      filteredValue: almacenIdsKardex && almacenIdsKardex.length > 0 ? almacenIdsKardex : null,
      filterIcon: renderTableFilterIcon,
      render: (alm) => alm || <Text type="secondary">—</Text>,
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
      render: (l) => (l ? <Tag color="geekblue">{l}</Tag> : <Text type="secondary">—</Text>),
    },
    {
      title: 'Ubicación',
      key: 'ubicacion',
      width: 140,
      render: (_, r) => (
        r.ubicacion_codigo ? (
          <Tooltip title={r.ubicacion_nombre ? `${r.ubicacion_codigo} - ${r.ubicacion_nombre}` : r.ubicacion_codigo}>
            <Tag color="cyan">
              {r.ubicacion_codigo}
            </Tag>
          </Tooltip>
        ) : (
          <Text type="secondary">—</Text>
        )
      ),
    },
    {
      title: 'Cantidad',
      key: 'cant',
      width: 160,
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
      actionButton={
        activeTab === 'stock' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <Input
              placeholder="Buscar por producto, marca o lote..."
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              value={searchStock}
              onChange={(e) => setSearchStock(e.target.value)}
              onPressEnter={() => {
                setPageStock(1);
                cargarStock();
              }}
              style={{ width: 240, ...brandSearchStyle }}
              allowClear
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>Vista:</span>
              <Radio.Group
                value={modoVista}
                onChange={(e) => {
                  setModoVista(e.target.value);
                  setPageStock(1);
                }}
              >
                <Radio value="producto">Consolidado</Radio>
                <Radio value="marca">Por Marca</Radio>
                <Radio value="lote">Por Lote</Radio>
              </Radio.Group>
            </div>
          </div>
        ) : (
          ((tiposMovimiento && tiposMovimiento.length > 0) || (almacenIdsKardex && almacenIdsKardex.length > 0) || Boolean(rangoKardex)) ? (
            <Button
              type="link"
              onClick={() => {
                setTiposMovimiento(undefined);
                setAlmacenIdsKardex(undefined);
                setRangoKardex(null);
                setPageKardex(1);
              }}
              style={{ height: 38, padding: '0 8px', color: '#ef4444' }}
            >
              Limpiar filtros
            </Button>
          ) : undefined
        )
      }
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
        <GlobalTable<StockItem>
          resourceName="registros de stock"
          rowKey={(r, i) => `${r.almacen_id}-${r.producto_id}-${r.lote_id || i}`}
          columns={columnsStock}
          dataSource={stockItems}
          loading={loadingStock}
          onChange={handleTableChangeStock}
          pagination={{
            current: pageStock,
            pageSize: limitStock,
            total: totalStock,
            onChange: (p, l) => {
              setPageStock(p);
              setLimitStock(l);
            },
          }}
        />
      )}

      {activeTab === 'kardex' && (
        <GlobalTable<KardexItem>
          resourceName="movimientos"
          rowKey="id"
          columns={columnsKardex}
          dataSource={kardexItems}
          loading={loadingKardex}
          onChange={handleTableChangeKardex}
          pagination={{
            current: pageKardex,
            pageSize: limitKardex,
            total: totalKardex,
            onChange: (p, l) => {
              setPageKardex(p);
              setLimitKardex(l);
            },
          }}
        />
      )}
    </ModulePageLayout>
  );
}
