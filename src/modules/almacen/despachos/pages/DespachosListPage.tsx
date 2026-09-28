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
import { despachosApi } from '../despachos.api';
import { useAlmacenSedeStore } from '../../shared/sede.store';
import { almacenApi } from '../../shared/almacen.api';
import type { Despacho } from '../despachos.types';
import type { Almacen } from '../../maestros/maestros.types';
import DespachoDrawer from '../components/DespachoDrawer';
import DespachoDetalleModal from '../components/DespachoDetalleModal';

const { Text } = Typography;
const { RangePicker } = DatePicker;

export default function DespachosListPage() {
  const [despachos, setDespachos] = useState<Despacho[]>([]);
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
  const [selectedDespacho, setSelectedDespacho] = useState<Despacho | null>(null);

  const { hasPermission, isSuperAdmin } = usePermissions();
  const canCreate = isSuperAdmin || hasPermission('almacen.despachos.create');
  const canDelete = isSuperAdmin || hasPermission('almacen.despachos.delete');
  const { sedeId } = useAlmacenSedeStore();

  useEffect(() => {
    almacenApi
      .get<Almacen[]>('/maestros/almacenes', { sede_id: sedeId, activo: true })
      .then((data) => setAlmacenes(data || []))
      .catch(console.error);
  }, [sedeId]);

  const cargarDespachos = useCallback(async () => {
    try {
      setLoading(true);
      const res = await despachosApi.listar({
        page,
        limit,
        search: search.trim() || undefined,
        almacen_id: almacenId,
        estado: estadoFilter,
        fecha_desde: rangoFechas ? rangoFechas[0].format('YYYY-MM-DD') : undefined,
        fecha_hasta: rangoFechas ? rangoFechas[1].format('YYYY-MM-DD') : undefined,
      });
      setDespachos(res.items || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Error cargando despachos');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, almacenId, estadoFilter, rangoFechas]);

  useEffect(() => {
    cargarDespachos();
  }, [cargarDespachos]);

  const verDetalle = async (d: Despacho) => {
    try {
      setLoading(true);
      const completo = await despachosApi.obtener(d.id);
      setSelectedDespacho(completo);
      setModalDetalleOpen(true);
    } catch (err: any) {
      message.error('Error obteniendo detalle del despacho');
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<Despacho> = [
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
      width: 110,
      render: (v) => (v ? dayjs(v).format('YYYY-MM-DD') : '-'),
    },
    {
      title: 'Almacén Origen',
      dataIndex: 'almacen_nombre',
      key: 'almacen_nombre',
      render: (v) => <Tag color="blue">{v || 'Principal'}</Tag>,
    },
    {
      title: 'Trabajador Receptor',
      key: 'receptor',
      render: (_, r) => (
        <div>
          <Text strong>{r.receptor_nombres} {r.receptor_apellidos}</Text>
          {r.receptor_documento && (
            <Text type="secondary" style={{ display: 'block', fontSize: 11 }}>
              Doc: {r.receptor_documento}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: 'Registrado Por',
      dataIndex: 'usuario_registro_nombre',
      key: 'usuario_registro_nombre',
      width: 140,
      render: (v) => v || '-',
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      width: 110,
      render: (v) => (
        <Tag color={v === 'REGISTRADO' ? 'green' : 'red'}>
          {v}
        </Tag>
      ),
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
      title="Despachos al Personal"
      subtitle="Registro y control de asignaciones de materiales y reactivos a los trabajadores"
      actionButton={
        canCreate ? (
          <BrandCreateButton onClick={() => setDrawerOpen(true)}>
            Nuevo Despacho
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
              placeholder="Buscar por número o receptor..."
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
              placeholder="Almacén de origen"
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
              style={{ width: 140, ...brandControlStyle }}
              allowClear
              options={[
                { value: 'REGISTRADO', label: 'Registrado' },
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
            Total despachos: <strong style={{ color: '#0f172a' }}>{total}</strong>
          </Text>
        </div>
      }
    >

      <Table
        dataSource={despachos}
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

      <DespachoDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSuccess={cargarDespachos}
      />

      <DespachoDetalleModal
        open={modalDetalleOpen}
        despacho={selectedDespacho}
        onClose={() => setModalDetalleOpen(false)}
        onAnulado={cargarDespachos}
        canAnular={canDelete}
      />
    </ModulePageLayout>
  );
}
