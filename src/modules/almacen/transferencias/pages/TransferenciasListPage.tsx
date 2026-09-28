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
  const [almacenId, setAlmacenId] = useState<number | undefined>(undefined);
  const [estadoFilter, setEstadoFilter] = useState<string | undefined>(undefined);
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
        almacen_id: almacenId,
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
  }, [page, limit, search, almacenId, estadoFilter, rangoFechas]);

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
      width: 120,
      render: (v) => (v ? dayjs(v).format('YYYY-MM-DD') : '-'),
    },
    {
      title: 'Origen',
      dataIndex: 'almacen_origen_nombre',
      key: 'origen',
      render: (v) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: 'Destino',
      dataIndex: 'almacen_destino_nombre',
      key: 'destino',
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
      width: 130,
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
          icon={<EyeOutlined />}
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
        canCreate ? (
          <BrandCreateButton onClick={() => setDrawerOpen(true)}>
            Nueva Transferencia
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

            <Select
              placeholder="Almacén (origen o destino)"
              value={almacenId}
              onChange={(val) => {
                setAlmacenId(val);
                setPage(1);
              }}
              style={{ width: 220, ...brandControlStyle }}
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
              style={{ width: 150, ...brandControlStyle }}
              allowClear
              options={[
                { value: 'EN_TRANSITO', label: 'En Tránsito' },
                { value: 'RECIBIDA', label: 'Recibida' },
                { value: 'ANULADA', label: 'Anulada' },
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
            Total transferencias: <strong style={{ color: '#0f172a' }}>{total}</strong>
          </Text>
        </div>
      }
    >

      <Table
        dataSource={transferencias}
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
