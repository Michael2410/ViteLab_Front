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
import { transferenciasApi } from '../transferencias.api';
import { almacenApi } from '../../shared/almacen.api';
import type { Transferencia } from '../transferencias.types';
import type { Almacen } from '../../maestros/maestros.types';
import TransferenciaDrawer from '../components/TransferenciaDrawer';
import TransferenciaRecepcionModal from '../components/TransferenciaRecepcionModal';

const { Text } = Typography;
const { RangePicker } = DatePicker;

export default function TransferenciasListPage() {
  const [transferencias, setTransferencias] = useState<Transferencia[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [search, setSearch] = useState('');
  const [almacenIds, setAlmacenIds] = useState<number[] | undefined>(undefined);
  const [estadoFilter, setEstadoFilter] = useState<string[] | undefined>(undefined);
  const [rangoFechas, setRangoFechas] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);
  const [selectedTransf, setSelectedTransf] = useState<Transferencia | null>(null);

  const { hasPermission, isSuperAdmin } = usePermissions();
  const canCreate = isSuperAdmin || hasPermission('almacen.transferencias.create');
  const canApprove = isSuperAdmin || hasPermission('almacen.transferencias.approve');
  const canDelete = isSuperAdmin || hasPermission('almacen.transferencias.delete');

  useEffect(() => {
    almacenApi
      .get<Almacen[]>('/maestros/almacenes', { activo: true })
      .then((data) => setAlmacenes(data || []))
      .catch(console.error);
  }, []);

  const cargarTransferencias = useCallback(async () => {
    try {
      setLoading(true);
      const res = await transferenciasApi.listar({
        page,
        limit,
        search: search.trim() || undefined,
        almacen_id: almacenIds,
        estado: estadoFilter,
        fecha_desde: rangoFechas ? rangoFechas[0].format('YYYY-MM-DD') : undefined,
        fecha_hasta: rangoFechas ? rangoFechas[1].format('YYYY-MM-DD') : undefined,
      });
      setTransferencias(res.items || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Error cargando transferencias');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, almacenIds, estadoFilter, rangoFechas]);

  useEffect(() => {
    cargarTransferencias();
  }, [cargarTransferencias]);

  const verDetalle = async (t: Transferencia) => {
    try {
      setLoading(true);
      const completo = await transferenciasApi.obtener(t.id);
      setSelectedTransf(completo);
      setModalDetalleOpen(true);
    } catch (err: any) {
      message.error('Error obteniendo detalle de transferencia');
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (pagination: any, tableFilters: any) => {
    setPage(pagination.current || 1);
    setLimit(pagination.pageSize || limit);

    const almVal = tableFilters.origen ?? tableFilters.almacen_origen_nombre;
    setAlmacenIds(almVal && almVal.length > 0 ? (almVal as any[]).map(Number) : undefined);

    const estVal = tableFilters.estado;
    setEstadoFilter(estVal && estVal.length > 0 ? (estVal as string[]) : undefined);
  };

  const getStatusColor = (st: string) => {
    switch (st) {
      case 'EN_TRANSITO': return 'gold';
      case 'RECIBIDA': return 'green';
      case 'ANULADA': return 'red';
      default: return 'default';
    }
  };

  const columns: ColumnsType<Transferencia> = [
    {
      title: 'Número',
      dataIndex: 'numero',
      key: 'numero',
      width: 140,
      render: (v) => <Text strong style={{ color: '#0284c7' }}>{v}</Text>,
    },
    {
      title: 'Fecha Envío',
      dataIndex: 'fecha_envio',
      key: 'fecha_envio',
      width: 140,
      render: (v) => (v ? dayjs(v).format('YYYY-MM-DD') : '-'),
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
      title: 'Origen',
      dataIndex: 'almacen_origen_nombre',
      key: 'origen',
      width: 170,
      filters: almacenes.map((a) => ({ text: a.nombre, value: a.id })),
      filteredValue: almacenIds && almacenIds.length > 0 ? almacenIds : null,
      filterIcon: renderTableFilterIcon,
      render: (v) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: 'Destino',
      dataIndex: 'almacen_destino_nombre',
      key: 'destino',
      width: 160,
      render: (v) => <Tag color="purple">{v}</Tag>,
    },
    {
      title: 'Enviado por',
      dataIndex: 'usuario_envio_nombre',
      key: 'usuario_envio_nombre',
      width: 140,
      render: (v) => v || '-',
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      width: 140,
      align: 'center',
      filters: [
        { value: 'EN_TRANSITO', text: 'En Tránsito' },
        { value: 'RECIBIDA', text: 'Recibida' },
        { value: 'ANULADA', text: 'Anulada' },
      ],
      filteredValue: estadoFilter && estadoFilter.length > 0 ? estadoFilter : null,
      filterIcon: renderTableFilterIcon,
      render: (v) => <Tag color={getStatusColor(v)}>{v === 'EN_TRANSITO' ? 'EN TRÁNSITO' : v}</Tag>,
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 90,
      align: 'center',
      render: (_, r) => (
        <Button
          type="text"
          icon={<EyeOutlined style={{ color: '#0284c7' }} />}
          onClick={() => verDetalle(r)}
        />
      ),
    },
  ];

  return (
    <ModulePageLayout
      title="Transferencias entre Almacenes"
      subtitle="Control de traslados intersede con seguimiento de mercadería en tránsito y mermas"
      actionButton={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Input
            placeholder="Buscar por número..."
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{ width: 220, ...brandSearchStyle }}
            allowClear
          />

          {canCreate && (
            <BrandCreateButton onClick={() => setDrawerOpen(true)}>
              Nueva Transferencia
            </BrandCreateButton>
          )}
        </div>
      }
    >
      <GlobalTable<Transferencia>
        resourceName="transferencias"
        rowKey="id"
        columns={columns}
        dataSource={transferencias}
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

      <TransferenciaDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSuccess={cargarTransferencias}
      />

      <TransferenciaRecepcionModal
        open={modalDetalleOpen}
        transferencia={selectedTransf}
        onClose={() => setModalDetalleOpen(false)}
        onSuccess={cargarTransferencias}
        canApprove={canApprove}
        canAnular={canDelete}
      />
    </ModulePageLayout>
  );
}
