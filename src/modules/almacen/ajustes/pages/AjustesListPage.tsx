import { useState, useEffect, useCallback } from 'react';
import {
  Button,
  Input,
  DatePicker,
  Space,
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
import { ModulePageLayout, BrandCreateButton, brandSearchStyle, renderTableFilterIcon } from '../../../../shared/components/ModulePageLayout';
import GlobalTable from '../../../../shared/components/GlobalTable';
import { usePermissions } from '../../../../shared/components/PermissionGuard';
import { ajustesApi } from '../ajustes.api';
import { almacenApi } from '../../shared/almacen.api';
import type { Ajuste } from '../ajustes.types';
import type { Almacen } from '../../maestros/maestros.types';
import AjusteDrawer from '../components/AjusteDrawer';
import AjusteDetalleModal from '../components/AjusteDetalleModal';

const { Text } = Typography;
const { RangePicker } = DatePicker;

export default function AjustesListPage() {
  const [ajustes, setAjustes] = useState<Ajuste[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [search, setSearch] = useState('');
  const [almacenIds, setAlmacenIds] = useState<number[] | undefined>(undefined);
  const [tipoFilter, setTipoFilter] = useState<string[] | undefined>(undefined);
  const [estadoFilter, setEstadoFilter] = useState<string[] | undefined>(undefined);
  const [rangoFechas, setRangoFechas] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);
  const [selectedAjuste, setSelectedAjuste] = useState<Ajuste | null>(null);

  const { hasPermission, isSuperAdmin } = usePermissions();
  const canCreate = isSuperAdmin || hasPermission('almacen.ajustes.create');
  const canApprove = isSuperAdmin || hasPermission('almacen.ajustes.approve');

  useEffect(() => {
    almacenApi
      .get<Almacen[]>('/maestros/almacenes', { activo: true })
      .then((data) => setAlmacenes(data || []))
      .catch(console.error);
  }, []);

  const cargarAjustes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await ajustesApi.listar({
        page,
        limit,
        search: search.trim() || undefined,
        almacen_id: almacenIds,
        tipo: tipoFilter,
        estado: estadoFilter,
        fecha_desde: rangoFechas ? rangoFechas[0].format('YYYY-MM-DD') : undefined,
        fecha_hasta: rangoFechas ? rangoFechas[1].format('YYYY-MM-DD') : undefined,
      });
      setAjustes(res.items || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Error cargando ajustes');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, almacenIds, tipoFilter, estadoFilter, rangoFechas]);

  useEffect(() => {
    cargarAjustes();
  }, [cargarAjustes]);

  const verDetalle = async (aj: Ajuste) => {
    try {
      setLoading(true);
      const completo = await ajustesApi.obtener(aj.id);
      setSelectedAjuste(completo);
      setModalDetalleOpen(true);
    } catch (err: any) {
      message.error('Error obteniendo detalle del ajuste');
    } finally {
      setLoading(false);
    }
  };

  const getTipoTag = (tipo: string) => {
    switch (tipo) {
      case 'CONTEO_FISICO':
        return <Tag color="blue">Conteo Físico</Tag>;
      case 'MERMA':
        return <Tag color="orange">Merma</Tag>;
      case 'BAJA':
        return <Tag color="red">Baja / Descarte</Tag>;
      case 'REGULARIZACION':
        return <Tag color="purple">Regularización</Tag>;
      default:
        return <Tag>{tipo}</Tag>;
    }
  };

  const getEstadoTag = (st: string) => {
    switch (st) {
      case 'PENDIENTE':
        return <Tag color="gold">PENDIENTE APROBACIÓN</Tag>;
      case 'APROBADO':
        return <Tag color="green">APROBADO</Tag>;
      case 'RECHAZADO':
        return <Tag color="error">RECHAZADO</Tag>;
      default:
        return <Tag>{st}</Tag>;
    }
  };

  const columns: ColumnsType<Ajuste> = [
    {
      title: 'Número',
      dataIndex: 'numero',
      key: 'numero',
      width: 140,
      render: (num: string, record) => (
        <a
          onClick={() => verDetalle(record)}
          style={{ fontWeight: 600, color: '#0284c7' }}
        >
          {num}
        </a>
      ),
    },
    {
      title: 'Fecha',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 140,
      render: (date: string) => (date ? dayjs(date).format('DD/MM/YYYY') : '-'),
      filterDropdown: ({ setSelectedKeys, confirm, clearFilters }: any) => (
        <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
          <RangePicker
            value={rangoFechas}
            onChange={(dates) => {
              setRangoFechas(dates as any);
              setSelectedKeys(dates ? ['selected'] : []);
            }}
            style={{ marginBottom: 8, display: 'flex' }}
            format="DD/MM/YYYY"
          />
          <Space style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              type="primary"
              size="small"
              onClick={() => {
                confirm();
                setPage(1);
              }}
            >
              Filtrar
            </Button>
            <Button
              size="small"
              onClick={() => {
                setRangoFechas(null);
                clearFilters && clearFilters();
                confirm();
                setPage(1);
              }}
            >
              Reiniciar
            </Button>
          </Space>
        </div>
      ),
      filterIcon: (filtered: boolean) => renderTableFilterIcon(filtered || !!rangoFechas),
    },
    {
      title: 'Almacén',
      dataIndex: 'almacen_id',
      key: 'almacen_id',
      width: 180,
      filters: almacenes.map((a) => ({ text: a.nombre, value: a.id })),
      filteredValue: almacenIds && almacenIds.length > 0 ? almacenIds : null,
      filterIcon: (filtered: boolean) => renderTableFilterIcon(filtered),
      render: (_: any, r: Ajuste) => <Text strong>{r.almacen_nombre}</Text>,
    },
    {
      title: 'Tipo',
      dataIndex: 'tipo',
      key: 'tipo',
      width: 170,
      filters: [
        { text: 'Conteo Físico', value: 'CONTEO_FISICO' },
        { text: 'Merma', value: 'MERMA' },
        { text: 'Baja / Descarte', value: 'BAJA' },
        { text: 'Regularización', value: 'REGULARIZACION' },
      ],
      filteredValue: tipoFilter && tipoFilter.length > 0 ? tipoFilter : null,
      filterIcon: (filtered: boolean) => renderTableFilterIcon(filtered),
      render: (tipo: string) => getTipoTag(tipo),
    },
    {
      title: 'Motivo',
      dataIndex: 'motivo',
      key: 'motivo',
      ellipsis: true,
      render: (m: string | null) => m || <Text type="secondary">-</Text>,
    },
    {
      title: 'Items',
      key: 'items_count',
      width: 90,
      align: 'center',
      render: (_: any, r: Ajuste) => (
        <Tag color="default">{r.items?.length ?? '-'}</Tag>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      width: 190,
      filters: [
        { text: 'Pendiente Aprobación', value: 'PENDIENTE' },
        { text: 'Aprobado', value: 'APROBADO' },
        { text: 'Rechazado', value: 'RECHAZADO' },
      ],
      filteredValue: estadoFilter && estadoFilter.length > 0 ? estadoFilter : null,
      filterIcon: (filtered: boolean) => renderTableFilterIcon(filtered),
      render: (st: string) => getEstadoTag(st),
    },
    {
      title: 'Registrado Por',
      dataIndex: 'usuario_registro_nombre',
      key: 'usuario_registro_nombre',
      width: 160,
      render: (u: string) => u || '-',
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 110,
      fixed: 'right',
      render: (_: any, record: Ajuste) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={() => verDetalle(record)}
        >
          Detalle
        </Button>
      ),
    },
  ];

  return (
    <ModulePageLayout
      title="Ajustes y Bajas de Inventario"
      subtitle="Regularizaciones de stock, registro de mermas, bajas y conteos físicos con aprobación de doble control"
      actionButton={
        <Space size="middle" wrap>
          <Input
            placeholder="Buscar por número o motivo..."
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
              Nuevo Ajuste
            </BrandCreateButton>
          )}
        </Space>
      }
    >
      <GlobalTable<Ajuste>
        resourceName="ajustes"
        dataSource={ajustes}
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
        onChange={(_pagination, filters) => {
          const alm = filters.almacen_id as any[] | undefined;
          setAlmacenIds(alm && alm.length > 0 ? alm.map(Number) : undefined);

          const tip = filters.tipo as string[] | undefined;
          setTipoFilter(tip && tip.length > 0 ? tip : undefined);

          const est = filters.estado as string[] | undefined;
          setEstadoFilter(est && est.length > 0 ? est : undefined);
          setPage(1);
        }}
      />

      <AjusteDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSuccess={cargarAjustes}
      />

      <AjusteDetalleModal
        open={modalDetalleOpen}
        ajuste={selectedAjuste}
        onClose={() => setModalDetalleOpen(false)}
        onSuccess={cargarAjustes}
        canApprove={canApprove}
      />
    </ModulePageLayout>
  );
}
