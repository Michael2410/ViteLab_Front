import { useState, useEffect, useCallback } from 'react';
import {
  Button,
  Input,
  DatePicker,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import ModulePageLayout, { BrandCreateButton, brandSearchStyle, brandControlStyle, renderTableFilterIcon } from '../../../../shared/components/ModulePageLayout';
import { GlobalTable } from '../../../../shared/components/GlobalTable';
import { usePermissions } from '../../../../shared/components/PermissionGuard';
import { ingresosApi } from '../ingresos.api';
import { useAlmacenSedeStore } from '../../shared/sede.store';
import { almacenApi } from '../../shared/almacen.api';
import type { Ingreso } from '../ingresos.types';
import type { Almacen } from '../../maestros/maestros.types';
import IngresoModal from '../components/IngresoModal';
import IngresoDetalleModal from '../components/IngresoDetalleModal';

const { Text } = Typography;
const { RangePicker } = DatePicker;

export default function IngresosListPage() {
  const [ingresos, setIngresos] = useState<Ingreso[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [search, setSearch] = useState('');
  const [almacenId, setAlmacenId] = useState<number | undefined>(undefined);
  const [estadoFilter, setEstadoFilter] = useState<string | undefined>(undefined);
  const [rangoFechas, setRangoFechas] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [modalNuevoOpen, setModalNuevoOpen] = useState(false);
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);
  const [selectedIngreso, setSelectedIngreso] = useState<Ingreso | null>(null);

  const { hasPermission, isSuperAdmin } = usePermissions();
  const canCreate = isSuperAdmin || hasPermission('almacen.ingresos.create');
  const { sedeId } = useAlmacenSedeStore();

  // Cargar almacenes de la sede activa
  useEffect(() => {
    almacenApi
      .get<Almacen[]>('/maestros/almacenes', { sede_id: sedeId, activo: true })
      .then((data) => setAlmacenes(data || []))
      .catch((err) => console.error(err));
  }, [sedeId]);

  const cargarIngresos = useCallback(async () => {
    try {
      setLoading(true);
      const res = await ingresosApi.listar({
        page,
        limit,
        search: search.trim() || undefined,
        almacen_id: almacenId,
        estado: estadoFilter,
        fecha_desde: rangoFechas ? rangoFechas[0].format('YYYY-MM-DD') : undefined,
        fecha_hasta: rangoFechas ? rangoFechas[1].format('YYYY-MM-DD') : undefined,
      });
      setIngresos(res.items || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error cargando ingresos';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, almacenId, estadoFilter, rangoFechas]);

  useEffect(() => {
    cargarIngresos();
  }, [cargarIngresos]);

  const verDetalle = async (r: Ingreso) => {
    try {
      setLoading(true);
      const completo = await ingresosApi.obtener(r.id);
      setSelectedIngreso(completo);
      setModalDetalleOpen(true);
    } catch (err: any) {
      message.error('Error obteniendo detalle del ingreso');
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (pagination: any, tableFilters: any) => {
    setPage(pagination.current || 1);
    setLimit(pagination.pageSize || limit);

    const almVal = tableFilters.almacen_nombre?.[0];
    setAlmacenId(almVal !== undefined && almVal !== null ? Number(almVal) : undefined);

    const estVal = tableFilters.estado?.[0];
    setEstadoFilter(estVal ? String(estVal) : undefined);
  };

  const columns: ColumnsType<Ingreso> = [
    {
      title: 'Correlativo',
      dataIndex: 'numero',
      key: 'numero',
      width: 160,
      render: (val: string, r) => (
        <span style={{ fontWeight: 700, color: '#0369a1', fontFamily: 'monospace' }}>
          {val || r.correlativo || '—'}
        </span>
      ),
    },
    {
      title: 'Fecha',
      dataIndex: 'fecha_ingreso',
      key: 'fecha_ingreso',
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
      title: 'Almacén Destino',
      dataIndex: 'almacen_nombre',
      key: 'almacen_nombre',
      width: 170,
      filters: almacenes.map((a) => ({ text: a.nombre, value: a.id })),
      filterMultiple: false,
      filteredValue: almacenId !== undefined ? [almacenId] : null,
      filterIcon: renderTableFilterIcon,
      render: (a: string) => <span style={{ fontWeight: 600 }}>{a}</span>,
    },
    {
      title: 'Proveedor',
      dataIndex: 'proveedor_razon_social',
      key: 'proveedor_razon_social',
      render: (val: string) => val || <Text type="secondary">—</Text>,
    },
    {
      title: 'Doc. Referencia',
      key: 'doc_ref',
      width: 180,
      render: (_, r) => {
        if (!r.tipo_documento && !r.numero_documento && !r.serie_documento) return <Text type="secondary">—</Text>;
        const docNumero = r.serie_documento
          ? `${r.serie_documento}-${r.numero_documento || ''}`
          : (r.numero_documento || 'S/N');
        return (
          <span style={{ fontSize: 12 }}>
            <span style={{ fontWeight: 600, color: '#475569' }}>{r.tipo_documento || 'DOC'}:</span>{' '}
            {docNumero}
          </span>
        );
      },
    },
    {
      title: 'Total Ítems',
      dataIndex: 'total_items',
      key: 'total_items',
      width: 110,
      align: 'center',
      render: (tot: number) => <Tag color="blue">{tot ?? 0} ítems</Tag>,
    },
    {
      title: 'Monto Total',
      dataIndex: 'monto_total',
      key: 'monto_total',
      width: 130,
      align: 'right',
      render: (m: number | string | null, r) => {
        if (m === null || m === undefined || m === '') return <Text type="secondary">—</Text>;
        const valor = Number(m);
        const moneda = r.moneda === 'USD' ? '$' : 'S/';
        return (
          <span style={{ fontWeight: 600, color: '#0f172a' }}>
            {`${moneda} ${valor.toFixed(2)}`}
          </span>
        );
      },
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      width: 130,
      align: 'center',
      filters: [
        { text: 'Registrado', value: 'REGISTRADO' },
        { text: 'Anulado', value: 'ANULADO' },
      ],
      filterMultiple: false,
      filteredValue: estadoFilter ? [estadoFilter] : null,
      filterIcon: renderTableFilterIcon,
      render: (st: string) => {
        if (st === 'REGISTRADO') return <Tag color="success">REGISTRADO</Tag>;
        if (st === 'ANULADO') return <Tag color="error">ANULADO</Tag>;
        return <Tag>{st}</Tag>;
      },
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 90,
      align: 'center',
      render: (_, record) => (
        <Button
          type="text"
          size="small"
          icon={<EyeOutlined style={{ color: '#0284c7' }} />}
          onClick={() => verDetalle(record)}
        >
        </Button>
      ),
    },
  ];

  return (
    <ModulePageLayout
      title="Ingresos de Almacén"
      subtitle={`Entrada de mercadería por compras, facturas, guías e inventario inicial (${total} registros)`}
      actionButton={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Input
            placeholder="Buscar por correlativo o factura..."
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onPressEnter={() => {
              setPage(1);
              cargarIngresos();
            }}
            style={{ width: 260, ...brandSearchStyle }}
            allowClear
          />

          {canCreate && (
            <BrandCreateButton onClick={() => setModalNuevoOpen(true)}>
              Nuevo Ingreso
            </BrandCreateButton>
          )}
        </div>
      }
    >
      <GlobalTable<Ingreso>
        resourceName="ingresos"
        rowKey="id"
        columns={columns}
        dataSource={ingresos}
        loading={loading}
        onChange={handleTableChange}
        pagination={{
          current: page,
          pageSize: limit,
          total,
          onChange: (p, l) => {
            setPage(p);
            setLimit(l);
          },
        }}
      />

      {/* MODAL NUEVO INGRESO */}
      <IngresoModal
        open={modalNuevoOpen}
        onClose={() => setModalNuevoOpen(false)}
        onSuccess={cargarIngresos}
      />

      {/* MODAL DETALLE / ANULAR */}
      <IngresoDetalleModal
        open={modalDetalleOpen}
        onClose={() => setModalDetalleOpen(false)}
        ingreso={selectedIngreso}
        onAnulado={cargarIngresos}
      />
    </ModulePageLayout>
  );
}
