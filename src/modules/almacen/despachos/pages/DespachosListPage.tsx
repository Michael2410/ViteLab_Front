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
  const [almacenIds, setAlmacenIds] = useState<number[] | undefined>(undefined);
  const [estadoFilter, setEstadoFilter] = useState<string[] | undefined>(undefined);
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
        almacen_id: almacenIds,
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
  }, [page, limit, search, almacenIds, estadoFilter, rangoFechas]);

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

  const handleTableChange = (pagination: any, tableFilters: any) => {
    setPage(pagination.current || 1);
    setLimit(pagination.pageSize || limit);

    const almVal = tableFilters.almacen_nombre;
    setAlmacenIds(almVal && almVal.length > 0 ? (almVal as any[]).map(Number) : undefined);

    const estVal = tableFilters.estado;
    setEstadoFilter(estVal && estVal.length > 0 ? (estVal as string[]) : undefined);
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
      title: 'Almacén Origen',
      dataIndex: 'almacen_nombre',
      key: 'almacen_nombre',
      width: 170,
      filters: almacenes.map((a) => ({ text: a.nombre, value: a.id })),
      filteredValue: almacenIds && almacenIds.length > 0 ? almacenIds : null,
      filterIcon: renderTableFilterIcon,
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
      width: 130,
      align: 'center',
      filters: [
        { text: 'Registrado', value: 'REGISTRADO' },
        { text: 'Anulado', value: 'ANULADO' },
      ],
      filteredValue: estadoFilter && estadoFilter.length > 0 ? estadoFilter : null,
      filterIcon: renderTableFilterIcon,
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
          icon={<EyeOutlined style={{ color: '#0284c7' }} />}
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

          {canCreate && (
            <BrandCreateButton onClick={() => setDrawerOpen(true)}>
              Nuevo Despacho
            </BrandCreateButton>
          )}
        </div>
      }
    >
      <GlobalTable<Despacho>
        resourceName="despachos"
        rowKey="id"
        columns={columns}
        dataSource={despachos}
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
