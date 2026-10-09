import { useState, useEffect, useCallback } from 'react';
import {
  Button,
  Input,
  Space,
  Switch,
  Tooltip,
  Typography,
  message,
} from 'antd';
import {
  SearchOutlined,
  EditOutlined,
  PhoneOutlined,
  MailOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { ModulePageLayout, BrandCreateButton, brandSearchStyle, renderTableFilterIcon } from '../../../../shared/components/ModulePageLayout';
import GlobalTable from '../../../../shared/components/GlobalTable';
import { usePermissions } from '../../../../shared/components/PermissionGuard';
import { proveedoresApi } from '../proveedores.api';
import type { Proveedor } from '../proveedores.types';
import ProveedorDrawer from '../components/ProveedorDrawer';

const { Text } = Typography;

export default function ProveedoresListPage() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [activoFilter, setActivoFilter] = useState<boolean | undefined>(true);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingProveedor, setEditingProveedor] = useState<Proveedor | null>(null);

  const { hasPermission, isSuperAdmin } = usePermissions();
  const canCreate = isSuperAdmin || hasPermission('almacen.proveedores.create');
  const canEdit = isSuperAdmin || hasPermission('almacen.proveedores.update');
  const canDelete = isSuperAdmin || hasPermission('almacen.proveedores.delete');

  const cargarProveedores = useCallback(async () => {
    try {
      setLoading(true);
      const res = await proveedoresApi.listar({
        page,
        limit,
        search: search.trim() || undefined,
        activo: activoFilter,
      });
      setProveedores(res.items || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al cargar proveedores';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, activoFilter]);

  useEffect(() => {
    cargarProveedores();
  }, [cargarProveedores]);

  const handleCrear = () => {
    setEditingProveedor(null);
    setDrawerOpen(true);
  };

  const handleEditar = (p: Proveedor) => {
    setEditingProveedor(p);
    setDrawerOpen(true);
  };

  const handleToggleActivo = async (record: Proveedor, checked: boolean) => {
    try {
      await proveedoresApi.actualizar(record.id, { activo: checked });
      message.success(`Proveedor "${record.razon_social}" ${checked ? 'activado' : 'desactivado'}`);
      setProveedores((prev) =>
        prev.map((p) => (p.id === record.id ? { ...p, activo: checked } : p))
      );
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Error actualizando estado del proveedor');
    }
  };

  const handleDesactivar = async (id: number) => {
    try {
      await proveedoresApi.desactivar(id);
      message.success('Proveedor desactivado exitosamente');
      cargarProveedores();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al desactivar proveedor';
      message.error(msg);
    }
  };

  const columns: ColumnsType<Proveedor> = [
    {
      title: 'RUC',
      dataIndex: 'ruc',
      key: 'ruc',
      width: 140,
      render: (ruc: string | null) => (
        <Text strong style={{ color: '#0369a1', fontFamily: 'monospace' }}>
          {ruc || '—'}
        </Text>
      ),
    },
    {
      title: 'Razón Social / Nombre Comercial',
      key: 'razon_social',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0f172a' }}>{record.razon_social}</div>
          {record.nombre_comercial && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.nombre_comercial}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: 'Contacto',
      dataIndex: 'contacto',
      key: 'contacto',
      width: 180,
      render: (c: string | null) => c || <Text type="secondary">—</Text>,
    },
    {
      title: 'Teléfono / Email',
      key: 'comunicacion',
      width: 220,
      render: (_, record) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {record.telefono && (
            <span style={{ fontSize: 12, color: '#334155' }}>
              <PhoneOutlined style={{ color: '#0284c7', marginRight: 4 }} />
              {record.telefono}
            </span>
          )}
          {record.email && (
            <span style={{ fontSize: 12, color: '#334155' }}>
              <MailOutlined style={{ color: '#f59e0b', marginRight: 4 }} />
              {record.email}
            </span>
          )}
          {!record.telefono && !record.email && <Text type="secondary">—</Text>}
        </div>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'activo',
      key: 'activo',
      width: 140,
      align: 'center',
      filters: [
        { text: 'Activos', value: 'true' },
        { text: 'Inactivos', value: 'false' },
      ],
      filteredValue: activoFilter === undefined ? null : [String(activoFilter)],
      filterIcon: (filtered: boolean) => renderTableFilterIcon(filtered),
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
            <Tooltip title="Editar Proveedor">
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
      title="Directorio de Proveedores"
      subtitle={`Proveedores registrados para suministro de reactivos, insumos y equipos`}
      actionButton={
        <Space size="middle" wrap>
          <Input
            placeholder="Buscar por RUC, razón social o nombre..."
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{ width: 280, ...brandSearchStyle }}
            allowClear
          />
          {canCreate && (
            <BrandCreateButton onClick={handleCrear}>
              Nuevo Proveedor
            </BrandCreateButton>
          )}
        </Space>
      }
    >
      <GlobalTable<Proveedor>
        resourceName="proveedores"
        rowKey="id"
        columns={columns}
        dataSource={proveedores}
        loading={loading}
        pagination={{
          current: page,
          pageSize: limit,
          total,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
          onChange: (p, l) => {
            setPage(p);
            setLimit(l);
          },
          showTotal: (tot) => `Total: ${tot} proveedores`,
        }}
        onChange={(_pagination, filters) => {
          const act = filters.activo as string[] | undefined;
          if (act && act.length === 1) {
            setActivoFilter(act[0] === 'true');
          } else {
            setActivoFilter(undefined);
          }
          setPage(1);
        }}
      />

      <ProveedorDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSuccess={cargarProveedores}
        proveedor={editingProveedor}
      />
    </ModulePageLayout>
  );
}
