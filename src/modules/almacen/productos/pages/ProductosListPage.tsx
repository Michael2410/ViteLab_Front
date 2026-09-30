import { useState, useEffect, useCallback } from 'react';
import {
  Button,
  Input,
  Space,
  Tag,
  Switch,
  Tooltip,
  Typography,
  message,
} from 'antd';
import {
  SearchOutlined,
  EditOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import ModulePageLayout, { BrandCreateButton, brandSearchStyle, renderTableFilterIcon } from '../../../../shared/components/ModulePageLayout';
import { GlobalTable } from '../../../../shared/components/GlobalTable';
import { usePermissions } from '../../../../shared/components/PermissionGuard';
import { productosApi } from '../productos.api';
import { almacenApi } from '../../shared/almacen.api';
import type { Producto } from '../productos.types';
import ProductoDrawer from '../components/ProductoDrawer';

const { Text } = Typography;

interface CategoriaOption {
  id: number;
  nombre: string;
}

export default function ProductosListPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [categoriaId, setCategoriaId] = useState<number | undefined>(undefined);
  const [activoFilter, setActivoFilter] = useState<boolean | undefined>(true);

  const [categorias, setCategorias] = useState<CategoriaOption[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingProducto, setEditingProducto] = useState<Producto | null>(null);

  const { hasPermission, isSuperAdmin } = usePermissions();
  const canCreate = isSuperAdmin || hasPermission('almacen.productos.create');
  const canEdit = isSuperAdmin || hasPermission('almacen.productos.update');
  const canDelete = isSuperAdmin || hasPermission('almacen.productos.delete');

  // Cargar categorías para el filtro
  useEffect(() => {
    almacenApi
      .get<CategoriaOption[]>('/maestros/categorias')
      .then((data) => setCategorias(data || []))
      .catch((err) => console.error(err));
  }, []);

  const cargarProductos = useCallback(async () => {
    try {
      setLoading(true);
      const res = await productosApi.listar({
        page,
        limit,
        search: search.trim() || undefined,
        categoria_id: categoriaId,
        activo: activoFilter,
      });
      setProductos(res.items || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al cargar productos';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, categoriaId, activoFilter]);

  useEffect(() => {
    cargarProductos();
  }, [cargarProductos]);

  const handleCrear = () => {
    setEditingProducto(null);
    setDrawerOpen(true);
  };

  const handleEditar = (p: Producto) => {
    setEditingProducto(p);
    setDrawerOpen(true);
  };

  const handleToggleActivo = async (record: Producto, checked: boolean) => {
    try {
      await productosApi.actualizar(record.id, { activo: checked });
      message.success(`Producto "${record.nombre}" ${checked ? 'activado' : 'desactivado'}`);
      setProductos((prev) =>
        prev.map((p) => (p.id === record.id ? { ...p, activo: checked } : p))
      );
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Error actualizando estado del producto');
    }
  };

  const handleDesactivar = async (id: number) => {
    try {
      await productosApi.desactivar(id);
      message.success('Producto desactivado correctamente');
      cargarProductos();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Error al desactivar');
    }
  };

  const handleTableChange = (pagination: any, tableFilters: any) => {
    setPage(pagination.current || 1);
    setLimit(pagination.pageSize || limit);

    const catVal = tableFilters.categoria_nombre?.[0];
    setCategoriaId(catVal !== undefined && catVal !== null ? Number(catVal) : undefined);

    const actVal = tableFilters.activo?.[0];
    if (actVal === 'true') {
      setActivoFilter(true);
    } else if (actVal === 'false') {
      setActivoFilter(false);
    } else {
      setActivoFilter(undefined);
    }
  };

  const columns: ColumnsType<Producto> = [
    {
      title: 'Código',
      dataIndex: 'codigo',
      key: 'codigo',
      width: 120,
      render: (val: string | null) => (
        <span style={{ fontWeight: 600, color: '#0369a1', fontFamily: 'monospace' }}>
          {val || '—'}
        </span>
      ),
    },
    {
      title: 'Producto',
      key: 'nombre',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0f172a' }}>{record.nombre}</div>
          {record.descripcion && (
            <div style={{ fontSize: 12, color: '#64748b' }}>{record.descripcion}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Categoría',
      dataIndex: 'categoria_nombre',
      key: 'categoria_nombre',
      width: 240,
      filters: categorias.map((c) => ({ text: c.nombre, value: c.id })),
      filterMultiple: false,
      filteredValue: categoriaId !== undefined ? [categoriaId] : null,
      filterIcon: renderTableFilterIcon,
      render: (val: string | null) => val || <Text type="secondary">—</Text>,
    },
    {
      title: 'Unidad de Medida',
      key: 'unidad_medida',
      width: 150,
      render: (_, record) => {
        const codigo = record.unidad_codigo || record.unidad_medida_codigo;
        const nombre = record.unidad_nombre || record.unidad_medida_nombre;
        const texto =
          nombre && codigo && nombre.toUpperCase() !== codigo.toUpperCase()
            ? `${nombre} (${codigo})`
            : (nombre || codigo || null);
        return (
          <span style={{ fontSize: 13 }}>
            {texto || <Text type="secondary">—</Text>}
          </span>
        );
      },
    },
    {
      title: 'Stock Mínimo',
      dataIndex: 'stock_minimo',
      key: 'stock_minimo',
      width: 160,
      align: 'right',
      render: (val: number) => (
        <span style={{ fontWeight: 600 }}>{val ?? 0}</span>
      ),
    },
    {
      title: 'Control',
      key: 'control',
      width: 160,
      render: (_, record) => (
        <Space size={4} wrap>
          {record.controla_lote && (
            <Tag color="cyan" style={{ fontSize: 10 }}>
              LOTE
            </Tag>
          )}
          {record.controla_vencimiento && (
            <Tag color="purple" style={{ fontSize: 10 }}>
              VENCE
            </Tag>
          )}
          {record.requiere_cadena_frio && (
            <Tag color="blue" style={{ fontSize: 10 }}>
              FRÍO {record.temp_min !== null && record.temp_max !== null ? `(${record.temp_min}° a ${record.temp_max}°C)` : ''}
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'activo',
      key: 'activo',
      width: 140,
      align: 'center',
      filters: [
        { text: 'Activo', value: 'true' },
        { text: 'Inactivo', value: 'false' },
      ],
      filterMultiple: false,
      filteredValue: activoFilter === undefined ? null : [activoFilter ? 'true' : 'false'],
      filterIcon: renderTableFilterIcon,
      render: (activo: boolean, record) => (
        <Switch
          checked={activo}
          checkedChildren="Activo"
          unCheckedChildren="Inactivo"
          disabled={!canEdit}
          onChange={(checked) => handleToggleActivo(record, checked)}
        />
      ),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 90,
      align: 'center',
      render: (_, record) => (
        <Space size={6}>
          {canEdit && (
            <Tooltip title="Editar Producto">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined style={{ color: '#0284c7' }} />}
                onClick={() => handleEditar(record)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <ModulePageLayout
      title="Catálogo de Productos"
      subtitle={`Reactivos, materiales, insumos y calibradores (${total} registrados)`}
      actionButton={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Input
            placeholder="Buscar por código o nombre..."
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onPressEnter={() => {
              setPage(1);
              cargarProductos();
            }}
            style={{ width: 260, ...brandSearchStyle }}
            allowClear
          />
          {canCreate && (
            <BrandCreateButton onClick={handleCrear}>
              Nuevo Producto
            </BrandCreateButton>
          )}
        </div>
      }
    >
      <GlobalTable<Producto>
        resourceName="productos"
        rowKey="id"
        columns={columns}
        dataSource={productos}
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

      <ProductoDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSuccess={cargarProductos}
        producto={editingProducto}
      />
    </ModulePageLayout>
  );
}
