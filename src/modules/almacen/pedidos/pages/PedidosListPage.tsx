import { useState, useEffect, useCallback } from 'react';
import {
  Button,
  Input,
  DatePicker,
  Space,
  Tag,
  Typography,
  Tooltip,
  message,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  SendOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import ModulePageLayout, { BrandCreateButton, brandSearchStyle, brandControlStyle, renderTableFilterIcon } from '../../../../shared/components/ModulePageLayout';
import { GlobalTable } from '../../../../shared/components/GlobalTable';
import { usePermissions } from '../../../../shared/components/PermissionGuard';
import { pedidosApi } from '../pedidos.api';
import { useAlmacenSedeStore } from '../../shared/sede.store';
import { almacenApi } from '../../shared/almacen.api';
import type { Pedido } from '../pedidos.types';
import type { Almacen } from '../../maestros/maestros.types';
import PedidoDrawer from '../components/PedidoDrawer';
import PedidoDetalleModal from '../components/PedidoDetalleModal';
import { DespacharPedidoModal } from '../components/DespacharPedidoModal';

const { Text } = Typography;
const { RangePicker } = DatePicker;

export default function PedidosListPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
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
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  const [despachoModalOpen, setDespachoModalOpen] = useState(false);
  const [pedidoADespachar, setPedidoADespachar] = useState<Pedido | null>(null);

  const { hasPermission, isSuperAdmin } = usePermissions();
  const canCreate = isSuperAdmin || hasPermission('almacen.pedidos.create');
  const canApprove = isSuperAdmin || hasPermission('almacen.pedidos.approve');
  const canDelete = isSuperAdmin || hasPermission('almacen.pedidos.delete');
  const { sedeId } = useAlmacenSedeStore();

  useEffect(() => {
    almacenApi
      .get<Almacen[]>('/maestros/almacenes', { sede_id: sedeId, activo: true })
      .then((data) => setAlmacenes(data || []))
      .catch(console.error);
  }, [sedeId]);

  const cargarPedidos = useCallback(async () => {
    try {
      setLoading(true);
      const res = await pedidosApi.listar({
        page,
        limit,
        search: search.trim() || undefined,
        almacen_id: almacenIds,
        estado: estadoFilter,
        fecha_desde: rangoFechas ? rangoFechas[0].format('YYYY-MM-DD') : undefined,
        fecha_hasta: rangoFechas ? rangoFechas[1].format('YYYY-MM-DD') : undefined,
      });
      setPedidos(res.items || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Error cargando pedidos');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, almacenIds, estadoFilter, rangoFechas]);

  useEffect(() => {
    cargarPedidos();
  }, [cargarPedidos]);

  const verDetalle = async (p: Pedido) => {
    try {
      setLoading(true);
      const completo = await pedidosApi.obtener(p.id);
      setSelectedPedido(completo);
      setModalDetalleOpen(true);
    } catch (err: any) {
      message.error('Error obteniendo detalle del pedido');
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (pagination: any, tableFilters: any) => {
    setPage(pagination.current || 1);
    setLimit(pagination.pageSize || limit);

    const almVal = tableFilters.almacen_nombre;
    setAlmacenIds(almVal && almVal.length > 0 ? (almVal as any[]).map(Number) : undefined);

    const estVal = tableFilters.estado;
    setEstadoFilter(estVal && estVal.length > 0 ? (estVal as string[]) : undefined);
  };

  const getStatusColor = (st: string) => {
    switch (st) {
      case 'PENDIENTE': return 'gold';
      case 'APROBADO': return 'blue';
      case 'ATENDIDO_PARCIAL': return 'purple';
      case 'ATENDIDO_TOTAL': return 'green';
      case 'RECHAZADO': return 'volcano';
      case 'ANULADO': return 'default';
      default: return 'default';
    }
  };

  const columns: ColumnsType<Pedido> = [
    {
      title: 'Número',
      dataIndex: 'numero',
      key: 'numero',
      width: 140,
      render: (v) => <Text strong style={{ color: '#0284c7' }}>{v}</Text>,
    },
    {
      title: 'Fecha',
      dataIndex: 'created_at',
      key: 'created_at',
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
      title: 'Almacén Destino',
      dataIndex: 'almacen_nombre',
      key: 'almacen_nombre',
      width: 170,
      filters: almacenes.map((a) => ({ text: a.nombre, value: a.id })),
      filteredValue: almacenIds && almacenIds.length > 0 ? almacenIds : null,
      filterIcon: renderTableFilterIcon,
      render: (v) => <Tag color="blue">{v || 'Almacén'}</Tag>,
    },
    {
      title: 'Solicitante',
      key: 'solicitante',
      render: (_, r) => (
        <div>
          <Text strong>{r.solicitante_nombres} {r.solicitante_apellidos}</Text>
          {r.solicitante_documento && (
            <Text type="secondary" style={{ display: 'block', fontSize: 11 }}>
              Doc: {r.solicitante_documento}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: 'Observación',
      dataIndex: 'observaciones',
      key: 'observaciones',
      render: (v) => v || '-',
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      width: 140,
      align: 'center',
      filters: [
        { value: 'PENDIENTE', text: 'Pendiente' },
        { value: 'APROBADO', text: 'Aprobado' },
        { value: 'ATENDIDO_PARCIAL', text: 'Atendido Parcial' },
        { value: 'ATENDIDO_TOTAL', text: 'Atendido Total' },
        { value: 'RECHAZADO', text: 'Rechazado' },
        { value: 'ANULADO', text: 'Anulado' },
      ],
      filteredValue: estadoFilter && estadoFilter.length > 0 ? estadoFilter : null,
      filterIcon: renderTableFilterIcon,
      render: (v) => <Tag color={getStatusColor(v)}>{v}</Tag>,
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 130,
      align: 'center',
      render: (_, r) => (
        <Space size={4}>
          <Tooltip title="Ver Detalle">
            <Button
              type="text"
              icon={<EyeOutlined style={{ color: '#0284c7' }} />}
              onClick={() => verDetalle(r)}
            />
          </Tooltip>

          {canApprove && r.estado === 'PENDIENTE' && (
            <Tooltip title="Aprobar y Despachar">
              <Button
                type="text"
                style={{ color: '#0284c7' }}
                icon={<SendOutlined />}
                onClick={() => {
                  setPedidoADespachar(r);
                  setDespachoModalOpen(true);
                }}
              />
            </Tooltip>
          )}

          {canApprove && ['APROBADO', 'ATENDIDO_PARCIAL'].includes(r.estado) && (
            <Tooltip title="Despachar Pedido">
              <Button
                type="text"
                style={{ color: '#059669' }}
                icon={<SendOutlined />}
                onClick={() => {
                  setPedidoADespachar(r);
                  setDespachoModalOpen(true);
                }}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <ModulePageLayout
      title="Pedidos Internos"
      subtitle="Solicitudes de reactivos y materiales requeridos para el trabajo en laboratorio"
      actionButton={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Input
            placeholder="Buscar por número o solicitante..."
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{ width: 260, ...brandSearchStyle }}
            allowClear
          />

          {canCreate && (
            <BrandCreateButton onClick={() => setDrawerOpen(true)}>
              Nuevo Pedido
            </BrandCreateButton>
          )}
        </div>
      }
    >
      <GlobalTable<Pedido>
        resourceName="pedidos"
        rowKey="id"
        columns={columns}
        dataSource={pedidos}
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

      <PedidoDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSuccess={cargarPedidos}
      />

      <PedidoDetalleModal
        open={modalDetalleOpen}
        pedido={selectedPedido}
        onClose={() => setModalDetalleOpen(false)}
        onSuccess={cargarPedidos}
        canApprove={canApprove}
        canAnular={canDelete}
        onDespachar={(p) => {
          setPedidoADespachar(p);
          setDespachoModalOpen(true);
        }}
      />

      <DespacharPedidoModal
        open={despachoModalOpen}
        pedido={pedidoADespachar}
        onClose={() => {
          setDespachoModalOpen(false);
          setPedidoADespachar(null);
        }}
        onSuccess={cargarPedidos}
      />
    </ModulePageLayout>
  );
}
