import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Button,
  Input,
  Tag,
  Space,
  Tooltip,
  DatePicker,
  App,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  PrinterOutlined,
  InboxOutlined,
  ShoppingCartOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  StopOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import {
  ModulePageLayout,
  BrandCreateButton,
  brandSearchStyle,
  brandControlStyle,
  renderTableFilterIcon,
} from '../../../../shared/components/ModulePageLayout';
import { GlobalTable } from '../../../../shared/components/GlobalTable';
import { usePermissions } from '../../../../shared/components/PermissionGuard';
import { ordenesCompraApi } from '../ordenes-compra.api';
import { useAlmacenSedeStore } from '../../shared/sede.store';
import { useConfiguracion } from '../../../configuracion/sistema/hooks';
import { imprimirOrdenCompraA4 } from '../utils/printOrdenCompraHelper';
import OrdenCompraModal from '../components/OrdenCompraModal';
import OrdenCompraDetalleModal from '../components/OrdenCompraDetalleModal';
import IngresoModal from '../../ingresos/components/IngresoModal';
import type { OrdenCompra, ListarOrdenesCompraParams } from '../ordenes-compra.types';

const { RangePicker } = DatePicker;

export default function OrdenesCompraListPage() {
  const { message } = App.useApp();
  const { hasPermission, isSuperAdmin } = usePermissions();
  const canCreate = isSuperAdmin || hasPermission('almacen.ordenes_compra.create');
  const canReceive = isSuperAdmin || hasPermission('almacen.ingresos.create');

  const { sedeId } = useAlmacenSedeStore();
  const { data: configuracion } = useConfiguracion();

  // Estados de carga y datos
  const [loading, setLoading] = useState(false);
  const [ordenes, setOrdenes] = useState<OrdenCompra[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Filtros
  const [search, setSearch] = useState('');
  const [filtroEstados, setFiltroEstados] = useState<string[] | undefined>(undefined);
  const [rangoFechas, setRangoFechas] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  // Modales
  const [modalCrearOpen, setModalCrearOpen] = useState(false);
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<OrdenCompra | null>(null);

  // Modal Ingreso precargado
  const [modalIngresoOpen, setModalIngresoOpen] = useState(false);
  const [ordenParaIngreso, setOrdenParaIngreso] = useState<OrdenCompra | null>(null);

  // Debounce para búsqueda en tiempo real
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const cargarOrdenes = useCallback(async () => {
    try {
      setLoading(true);
      const params: ListarOrdenesCompraParams = {
        sede_id: sedeId || undefined,
        estado: filtroEstados,
        search: debouncedSearch.trim() || undefined,
        fecha_desde: rangoFechas?.[0] ? rangoFechas[0].format('YYYY-MM-DD') : undefined,
        fecha_hasta: rangoFechas?.[1] ? rangoFechas[1].format('YYYY-MM-DD') : undefined,
        page,
        limit,
      };

      const res = await ordenesCompraApi.listar(params);
      setOrdenes(res.items || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Error al cargar órdenes de compra');
    } finally {
      setLoading(false);
    }
  }, [sedeId, filtroEstados, debouncedSearch, rangoFechas, page, limit]);

  useEffect(() => {
    cargarOrdenes();
  }, [cargarOrdenes]);

  const handleVerDetalle = async (record: OrdenCompra) => {
    try {
      setLoading(true);
      const ordenCompleta = await ordenesCompraApi.obtener(record.id);
      setOrdenSeleccionada(ordenCompleta);
      setModalDetalleOpen(true);
    } catch (err: any) {
      message.error('Error al cargar detalle de la orden');
    } finally {
      setLoading(false);
    }
  };

  const handleRecepcionar = async (record: OrdenCompra) => {
    try {
      setLoading(true);
      const ordenCompleta = await ordenesCompraApi.obtener(record.id);
      setOrdenParaIngreso(ordenCompleta);
      setModalIngresoOpen(true);
    } catch (err: any) {
      message.error('Error al preparar recepción de la orden');
    } finally {
      setLoading(false);
    }
  };

  // Métricas rápidas
  const stats = useMemo(() => {
    const pendientes = ordenes.filter((o) => o.estado === 'PENDIENTE').length;
    const parciales = ordenes.filter((o) => o.estado === 'PARCIAL').length;
    const recepcionadas = ordenes.filter((o) => o.estado === 'RECEPCIONADA').length;
    return { total, pendientes, parciales, recepcionadas };
  }, [ordenes, total]);

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return <Tag icon={<ClockCircleOutlined />} color="orange">Pendiente</Tag>;
      case 'PARCIAL':
        return <Tag icon={<SyncOutlined spin />} color="processing">Parcial</Tag>;
      case 'RECEPCIONADA':
        return <Tag icon={<CheckCircleOutlined />} color="success">Recepcionada</Tag>;
      case 'ANULADA':
        return <Tag icon={<StopOutlined />} color="error">Anulada</Tag>;
      default:
        return <Tag>{estado}</Tag>;
    }
  };

  const columns: ColumnsType<OrdenCompra> = [
    {
      title: 'N° Orden',
      dataIndex: 'numero',
      key: 'numero',
      width: 140,
      render: (num) => (
        <span style={{ fontWeight: 700, color: '#0369a1', fontFamily: 'monospace' }}>
          {num || '—'}
        </span>
      ),
    },
    {
      title: 'Fecha Emisión',
      dataIndex: 'fecha_emision',
      key: 'fecha_emision',
      width: 140,
      render: (f: string) => (f ? dayjs(f).format('DD/MM/YYYY') : '—'),
      filterDropdown: ({ confirm, clearFilters }) => (
        <div style={{ padding: 12, width: 280, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <RangePicker
            style={{ width: '100%', ...brandControlStyle }}
            format="YYYY-MM-DD"
            placeholder={['Desde', 'Hasta']}
            value={rangoFechas}
            onChange={(dates) => {
              setRangoFechas(dates ? [dates[0]!, dates[1]!] : null);
              setPage(1);
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            {rangoFechas && (
              <Button
                size="small"
                onClick={() => {
                  setRangoFechas(null);
                  setPage(1);
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
      filterIcon: () => renderTableFilterIcon(Boolean(rangoFechas)),
    },
    {
      title: 'Proveedor',
      key: 'proveedor',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0f172a' }}>{record.proveedor_razon_social || '-'}</div>
          <div style={{ fontSize: 11.5, color: '#64748b' }}>
            RUC: {record.proveedor_ruc || 'Sin documento'} {record.proveedor_contacto ? `• ${record.proveedor_contacto}` : ''}
          </div>
        </div>
      ),
    },
    {
      title: 'F. Entrega Esperada',
      dataIndex: 'fecha_entrega_esperada',
      key: 'fecha_entrega',
      width: 150,
      render: (f) => (
        <span style={{ fontSize: 12, color: f ? '#334155' : '#94a3b8' }}>
          {f ? dayjs(f).format('DD/MM/YYYY') : 'A coordinar'}
        </span>
      ),
    },
    {
      title: 'Total',
      key: 'total',
      width: 130,
      align: 'right',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 13 }}>
            {record.moneda === 'USD' ? '$' : 'S/'} {Number(record.total || 0).toFixed(2)}
          </div>
          <div style={{ fontSize: 10.5, color: '#64748b' }}>
            {record.condicion_pago || 'CONTADO'}
          </div>
        </div>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      width: 160,
      align: 'center',
      filters: [
        { text: 'Pendiente', value: 'PENDIENTE' },
        { text: 'Recepción Parcial', value: 'PARCIAL' },
        { text: 'Recepcionada 100%', value: 'RECEPCIONADA' },
        { text: 'Anulada', value: 'ANULADA' },
      ],
      filteredValue: filtroEstados && filtroEstados.length > 0 ? filtroEstados : null,
      filterIcon: renderTableFilterIcon,
      render: (e) => getEstadoBadge(e),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 130,
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Ver detalle de la orden">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined style={{ color: '#0284c7' }} />}
              onClick={() => handleVerDetalle(record)}
            />
          </Tooltip>

          <Tooltip title="Imprimir Orden A4">
            <Button
              type="text"
              size="small"
              icon={<PrinterOutlined style={{ color: '#059669' }} />}
              onClick={async () => {
                const ordenCompleta = await ordenesCompraApi.obtener(record.id);
                imprimirOrdenCompraA4(ordenCompleta, configuracion);
              }}
            />
          </Tooltip>

          {(record.estado === 'PENDIENTE' || record.estado === 'PARCIAL') && canReceive && (
            <Tooltip title="Registrar Ingreso de esta orden">
              <Button
                type="text"
                size="small"
                icon={<InboxOutlined style={{ color: '#d97706', fontSize: 15 }} />}
                onClick={() => handleRecepcionar(record)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <ModulePageLayout
      title="Órdenes de Compra a Proveedores"
      subtitle={`Generación formal de pedidos de compra e impresión de órdenes`}
      actionButton={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Input
            placeholder="Buscar por N° Orden, Proveedor, RUC, Producto..."
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            onPressEnter={() => {
              setDebouncedSearch(search);
              setPage(1);
            }}
            style={{ width: 280, ...brandSearchStyle }}
            allowClear
          />

          {canCreate && (
            <BrandCreateButton onClick={() => setModalCrearOpen(true)}>
              Nueva Orden de Compra
            </BrandCreateButton>
          )}
        </div>
      }
    >
      {/* Tarjetas de Estadísticas */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 14,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: 'rgba(2, 132, 199, 0.1)',
              color: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
            }}
          >
            <ShoppingCartOutlined />
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
              {stats.total}
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, fontWeight: 500 }}>
              Total Órdenes
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 14,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: 'rgba(217, 119, 6, 0.1)',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
            }}
          >
            <ClockCircleOutlined />
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#d97706', lineHeight: 1 }}>
              {stats.pendientes}
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, fontWeight: 500 }}>
              Pendientes de Entrega
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 14,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              color: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
            }}
          >
            <SyncOutlined />
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#3b82f6', lineHeight: 1 }}>
              {stats.parciales}
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, fontWeight: 500 }}>
              En Recepción Parcial
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 14,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: 'rgba(5, 150, 105, 0.1)',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
            }}
          >
            <CheckCircleOutlined />
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#059669', lineHeight: 1 }}>
              {stats.recepcionadas}
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, fontWeight: 500 }}>
              Recepcionadas 100%
            </div>
          </div>
        </div>
      </div>

      {/* Tabla Global */}
      <GlobalTable<OrdenCompra>
        resourceName="almacen-ordenes-compra"
        columns={columns}
        dataSource={ordenes}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize: limit,
          total,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
          showTotal: (tot) => `Total: ${tot} órdenes de compra`,
        }}
        locale={{ emptyText: 'No se encontraron órdenes de compra' }}
        onChange={(pagination, tableFilters) => {
          setPage(pagination.current || 1);
          setLimit(pagination.pageSize || 10);
          const est = tableFilters.estado;
          setFiltroEstados(est && est.length > 0 ? (est as string[]) : undefined);
        }}
      />

      {/* Modal Crear */}
      <OrdenCompraModal
        open={modalCrearOpen}
        onClose={() => setModalCrearOpen(false)}
        onSuccess={() => {
          cargarOrdenes();
        }}
      />

      {/* Modal Detalle */}
      <OrdenCompraDetalleModal
        open={modalDetalleOpen}
        onClose={() => setModalDetalleOpen(false)}
        orden={ordenSeleccionada}
        onRecepcionar={(orden) => {
          setOrdenParaIngreso(orden);
          setModalIngresoOpen(true);
        }}
        onActualizado={() => {
          cargarOrdenes();
        }}
      />

      {/* Modal Ingreso contextualizado con Orden de Compra */}
      <IngresoModal
        open={modalIngresoOpen}
        onClose={() => {
          setModalIngresoOpen(false);
          setOrdenParaIngreso(null);
        }}
        onSuccess={() => {
          cargarOrdenes();
        }}
        ordenCompra={ordenParaIngreso}
      />
    </ModulePageLayout>
  );
}
