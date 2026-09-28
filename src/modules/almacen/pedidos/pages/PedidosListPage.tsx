import { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  DatePicker,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import { ModulePageLayout, BrandCreateButton, brandSearchStyle, brandControlStyle } from '../../../../shared/components/ModulePageLayout';
import { usePermissions } from '../../../../shared/components/PermissionGuard';
import { pedidosApi } from '../pedidos.api';
import { useAlmacenSedeStore } from '../../shared/sede.store';
import { almacenApi } from '../../shared/almacen.api';
import type { Pedido } from '../pedidos.types';
import type { Almacen } from '../../maestros/maestros.types';
import PedidoDrawer from '../components/PedidoDrawer';
import PedidoDetalleModal from '../components/PedidoDetalleModal';

const { Text } = Typography;
const { RangePicker } = DatePicker;

export default function PedidosListPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [search, setSearch] = useState('');
  const [almacenId, setAlmacenId] = useState<number | undefined>(undefined);
  const [estadoFilter, setEstadoFilter] = useState<string | undefined>(undefined);
  const [rangoFechas, setRangoFechas] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);

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
        almacen_id: almacenId,
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
  }, [page, limit, search, almacenId, estadoFilter, rangoFechas]);

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
      width: 110,
      render: (v) => (v ? dayjs(v).format('YYYY-MM-DD') : '-'),
    },
    {
      title: 'Almacén Destino',
      dataIndex: 'almacen_nombre',
      key: 'almacen_nombre',
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
      width: 130,
      render: (v) => <Tag color={getStatusColor(v)}>{v}</Tag>,
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 90,
      align: 'center',
      render: (_, r) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={() => verDetalle(r)}
        />
      ),
    },
  ];

  return (
    <ModulePageLayout
      title="Pedidos Internos"
      subtitle="Solicitudes de reactivos y materiales requeridos para el trabajo en laboratorio"
      actionButton={
        canCreate ? (
          <BrandCreateButton onClick={() => setDrawerOpen(true)}>
            Nuevo Pedido
          </BrandCreateButton>
        ) : undefined
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

            <Select
              placeholder="Almacén de destino"
              value={almacenId}
              onChange={(val) => {
                setAlmacenId(val);
                setPage(1);
              }}
              style={{ width: 200, ...brandControlStyle }}
              allowClear
              options={almacenes.map((a) => ({ value: a.id, label: a.nombre }))}
            />

            <Select
              placeholder="Estado"
              value={estadoFilter}
              onChange={(val) => {
                setEstadoFilter(val);
                setPage(1);
              }}
              style={{ width: 160, ...brandControlStyle }}
              allowClear
              options={[
                { value: 'PENDIENTE', label: 'Pendiente' },
                { value: 'APROBADO', label: 'Aprobado' },
                { value: 'ATENDIDO_PARCIAL', label: 'Atendido Parcial' },
                { value: 'ATENDIDO_TOTAL', label: 'Atendido Total' },
                { value: 'RECHAZADO', label: 'Rechazado' },
                { value: 'ANULADO', label: 'Anulado' },
              ]}
            />

            <RangePicker
              value={rangoFechas}
              onChange={(dates) => {
                setRangoFechas(dates as any);
                setPage(1);
              }}
              format="YYYY-MM-DD"
              style={{ ...brandControlStyle }}
            />
          </div>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Total pedidos: <strong style={{ color: '#0f172a' }}>{total}</strong>
          </Text>
        </div>
      }
    >

      <Table
        dataSource={pedidos}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize: limit,
          total,
          showSizeChanger: true,
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
      />
    </ModulePageLayout>
  );
}
