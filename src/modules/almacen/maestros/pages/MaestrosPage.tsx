import { useState, useEffect, useCallback } from 'react';
import {
  Tabs,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  EditOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { ModulePageLayout, BrandCreateButton, brandSearchStyle, renderTableFilterIcon } from '../../../../shared/components/ModulePageLayout';
import GlobalTable from '../../../../shared/components/GlobalTable';
import { usePermissions } from '../../../../shared/components/PermissionGuard';
import { maestrosApi } from '../maestros.api';
import { useAlmacenSedeStore } from '../../shared/sede.store';
import apiClient from '../../../../shared/utils/apiClient';
import type {
  UnidadMedida,
  Categoria,
  Almacen,
  Ubicacion,
} from '../maestros.types';

const { Text } = Typography;

interface SedeSimple {
  id: number;
  nombre: string;
}

interface TabConfig {
  key: string;
  label: string;
  singular: string;
  createLabel: string;
  description: string;
}

const TABS_CONFIG: TabConfig[] = [
  {
    key: 'unidades',
    label: 'Unidades de Medida',
    singular: 'Unidad',
    createLabel: 'Nueva Unidad',
    description: 'Gestión de magnitudes físicas, métricas de dispensación y decimales para inventario',
  },
  {
    key: 'categorias',
    label: 'Categorías',
    singular: 'Categoría',
    createLabel: 'Nueva Categoría',
    description: 'Clasificación taxonómica y familias de productos químicos, reactivos y materiales',
  },
  {
    key: 'almacenes',
    label: 'Almacenes Físicos',
    singular: 'Almacén',
    createLabel: 'Nuevo Almacén',
    description: 'Espacios físicos de custodia, bodegas centrales y almacenes satélites por sede',
  },
  {
    key: 'ubicaciones',
    label: 'Ubicaciones',
    singular: 'Ubicación',
    createLabel: 'Nueva Ubicación',
    description: 'Distribución espacial interna, estantes, gavetas y refrigeradores de almacenamiento',
  },
];

export default function MaestrosPage() {
  const [activeTab, setActiveTab] = useState('unidades');
  const [searchText, setSearchText] = useState('');
  const { hasPermission, isSuperAdmin } = usePermissions();
  const canManage = isSuperAdmin || hasPermission('almacen.maestros.manage');
  const { sedeId } = useAlmacenSedeStore();

  // Estados de datos
  const [unidades, setUnidades] = useState<UnidadMedida[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [sedes, setSedes] = useState<SedeSimple[]>([]);
  const [filtroAlmacenIds, setFiltroAlmacenIds] = useState<number[] | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  // Modales
  const [modalUnidadOpen, setModalUnidadOpen] = useState(false);
  const [modalCategoriaOpen, setModalCategoriaOpen] = useState(false);
  const [modalAlmacenOpen, setModalAlmacenOpen] = useState(false);
  const [modalUbicacionOpen, setModalUbicacionOpen] = useState(false);

  const [editingItem, setEditingItem] = useState<any>(null);
  const [form] = Form.useForm();

  // Cargar sedes activas
  useEffect(() => {
    apiClient
      .get<{ success: boolean; data: SedeSimple[] }>('/sedes/active')
      .then((res) => setSedes(res.data?.data || []))
      .catch((err) => console.error(err));
  }, []);

  // Cargas según tab
  const cargarUnidades = useCallback(async () => {
    setLoading(true);
    try {
      const data = await maestrosApi.listarUnidades();
      setUnidades(data || []);
    } catch (e: any) {
      message.error(e.response?.data?.message || 'Error cargando unidades');
    } finally {
      setLoading(false);
    }
  }, []);

  const cargarCategorias = useCallback(async () => {
    setLoading(true);
    try {
      const data = await maestrosApi.listarCategorias();
      setCategorias(data || []);
    } catch (e: any) {
      message.error(e.response?.data?.message || 'Error cargando categorías');
    } finally {
      setLoading(false);
    }
  }, []);

  const cargarAlmacenes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await maestrosApi.listarAlmacenes();
      setAlmacenes(data || []);
    } catch (e: any) {
      message.error(e.response?.data?.message || 'Error cargando almacenes');
    } finally {
      setLoading(false);
    }
  }, []);

  const cargarUbicaciones = useCallback(async () => {
    setLoading(true);
    try {
      const data = await maestrosApi.listarUbicaciones({ almacen_id: filtroAlmacenIds });
      setUbicaciones(data || []);
    } catch (e: any) {
      message.error(e.response?.data?.message || 'Error cargando ubicaciones');
    } finally {
      setLoading(false);
    }
  }, [filtroAlmacenIds]);

  useEffect(() => {
    if (activeTab === 'unidades') cargarUnidades();
    if (activeTab === 'categorias') cargarCategorias();
    if (activeTab === 'almacenes') cargarAlmacenes();
    if (activeTab === 'ubicaciones') {
      cargarAlmacenes();
      cargarUbicaciones();
    }
  }, [activeTab, cargarUnidades, cargarCategorias, cargarAlmacenes, cargarUbicaciones]);

  // Handlers Unidades
  const handleGuardarUnidad = async () => {
    const vals = await form.validateFields();
    try {
      if (editingItem) {
        await maestrosApi.actualizarUnidad(editingItem.id, vals);
        message.success('Unidad actualizada');
      } else {
        await maestrosApi.crearUnidad(vals);
        message.success('Unidad creada');
      }
      setModalUnidadOpen(false);
      cargarUnidades();
    } catch (e: any) {
      message.error(e.response?.data?.message || 'Error guardando unidad');
    }
  };

  // Handlers Categorias
  const handleGuardarCategoria = async () => {
    const vals = await form.validateFields();
    try {
      if (editingItem) {
        await maestrosApi.actualizarCategoria(editingItem.id, vals);
        message.success('Categoría actualizada');
      } else {
        await maestrosApi.crearCategoria(vals);
        message.success('Categoría creada');
      }
      setModalCategoriaOpen(false);
      cargarCategorias();
    } catch (e: any) {
      message.error(e.response?.data?.message || 'Error guardando categoría');
    }
  };

  // Handlers Almacenes
  const handleGuardarAlmacen = async () => {
    const vals = await form.validateFields();
    try {
      if (editingItem) {
        await maestrosApi.actualizarAlmacen(editingItem.id, vals);
        message.success('Almacén actualizado');
      } else {
        await maestrosApi.crearAlmacen(vals);
        message.success('Almacén creado');
      }
      setModalAlmacenOpen(false);
      cargarAlmacenes();
    } catch (e: any) {
      message.error(e.response?.data?.message || 'Error guardando almacén');
    }
  };

  // Handlers Ubicaciones
  const handleGuardarUbicacion = async () => {
    const vals = await form.validateFields();
    try {
      if (editingItem) {
        await maestrosApi.actualizarUbicacion(editingItem.id, vals);
        message.success('Ubicación actualizada');
      } else {
        await maestrosApi.crearUbicacion(vals);
        message.success('Ubicación creada');
      }
      setModalUbicacionOpen(false);
      cargarUbicaciones();
    } catch (e: any) {
      message.error(e.response?.data?.message || 'Error guardando ubicación');
    }
  };

  // Handlers Activo Toggle
  const handleToggleUnidad = async (record: UnidadMedida, checked: boolean) => {
    try {
      await maestrosApi.actualizarUnidad(record.id, { activo: checked });
      message.success(`Unidad ${checked ? 'activada' : 'desactivada'}`);
      cargarUnidades();
    } catch (e: any) {
      message.error(e.response?.data?.message || 'Error al cambiar estado');
    }
  };

  const handleToggleCategoria = async (record: Categoria, checked: boolean) => {
    try {
      await maestrosApi.actualizarCategoria(record.id, { activo: checked });
      message.success(`Categoría ${checked ? 'activada' : 'desactivada'}`);
      cargarCategorias();
    } catch (e: any) {
      message.error(e.response?.data?.message || 'Error al cambiar estado');
    }
  };

  const handleToggleAlmacen = async (record: Almacen, checked: boolean) => {
    try {
      await maestrosApi.actualizarAlmacen(record.id, { activo: checked });
      message.success(`Almacén ${checked ? 'activado' : 'desactivado'}`);
      cargarAlmacenes();
    } catch (e: any) {
      message.error(e.response?.data?.message || 'Error al cambiar estado');
    }
  };

  const handleToggleUbicacion = async (record: Ubicacion, checked: boolean) => {
    try {
      await maestrosApi.actualizarUbicacion(record.id, { activo: checked });
      message.success(`Ubicación ${checked ? 'activada' : 'desactivada'}`);
      cargarUbicaciones();
    } catch (e: any) {
      message.error(e.response?.data?.message || 'Error al cambiar estado');
    }
  };

  // Columnas Unidades
  const colsUnidades: ColumnsType<UnidadMedida> = [
    { title: 'Código', dataIndex: 'codigo', key: 'codigo', width: 140, render: (v) => <Tag color="blue">{v}</Tag> },
    { title: 'Nombre', dataIndex: 'nombre', key: 'nombre', render: (v) => <Text strong>{v}</Text> },
    {
      title: 'Permite Decimales',
      dataIndex: 'permite_decimales',
      key: 'permite_decimales',
      width: 170,
      filters: [
        { text: 'Sí', value: true },
        { text: 'No', value: false },
      ],
      onFilter: (value, record) => record.permite_decimales === value,
      filterIcon: (filtered) => renderTableFilterIcon(filtered),
      render: (v: boolean) => (v ? <Tag color="green">Sí</Tag> : <Tag>No</Tag>),
    },
    {
      title: 'Estado',
      dataIndex: 'activo',
      key: 'activo',
      width: 140,
      align: 'center',
      filters: [
        { text: 'Activo', value: true },
        { text: 'Inactivo', value: false },
      ],
      onFilter: (value, record) => record.activo === value,
      filterIcon: (filtered) => renderTableFilterIcon(filtered),
      render: (v: boolean, r) => (
        <Switch
          checked={v}
          checkedChildren="Activo"
          unCheckedChildren="Inactivo"
          disabled={!canManage}
          onChange={(checked) => handleToggleUnidad(r, checked)}
        />
      ),
    },
    {
      title: 'Acciones',
      key: 'act',
      width: 80,
      align: 'center',
      render: (_, r) =>
        canManage && (
          <Space>
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: '#0284c7' }} />}
              onClick={() => {
                setEditingItem(r);
                form.setFieldsValue(r);
                setModalUnidadOpen(true);
              }}
            />
          </Space>
        ),
    },
  ];

  // Columnas Categorias
  const colsCategorias: ColumnsType<Categoria> = [
    { title: 'Nombre', dataIndex: 'nombre', key: 'nombre', render: (v) => <Text strong>{v}</Text> },
    { title: 'Descripción', dataIndex: 'descripcion', key: 'descripcion', render: (v) => v || '—' },
    {
      title: 'Estado',
      dataIndex: 'activo',
      key: 'activo',
      width: 140,
      align: 'center',
      filters: [
        { text: 'Activo', value: true },
        { text: 'Inactivo', value: false },
      ],
      onFilter: (value, record) => record.activo === value,
      filterIcon: (filtered) => renderTableFilterIcon(filtered),
      render: (v: boolean, r) => (
        <Switch
          checked={v}
          checkedChildren="Activo"
          unCheckedChildren="Inactivo"
          disabled={!canManage}
          onChange={(checked) => handleToggleCategoria(r, checked)}
        />
      ),
    },
    {
      title: 'Acciones',
      key: 'act',
      width: 80,
      align: 'center',
      render: (_, r) =>
        canManage && (
          <Space>
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: '#0284c7' }} />}
              onClick={() => {
                setEditingItem(r);
                form.setFieldsValue(r);
                setModalCategoriaOpen(true);
              }}
            />
          </Space>
        ),
    },
  ];

  // Columnas Almacenes
  const colsAlmacenes: ColumnsType<Almacen> = [
    {
      title: 'Sede',
      dataIndex: 'sede_nombre',
      key: 'sede_nombre',
      width: 180,
      filters: sedes.map((s) => ({ text: s.nombre, value: s.nombre })),
      onFilter: (value, record) => record.sede_nombre === value,
      filterIcon: (filtered) => renderTableFilterIcon(filtered),
      render: (v) => <Tag color="cyan">{v || 'Sede'}</Tag>,
    },
    { title: 'Nombre Almacén', dataIndex: 'nombre', key: 'nombre', render: (v) => <Text strong>{v}</Text> },
    { title: 'Descripción', dataIndex: 'descripcion', key: 'descripcion', render: (v) => v || '—' },
    {
      title: 'Principal',
      dataIndex: 'es_principal',
      key: 'es_principal',
      width: 120,
      filters: [
        { text: 'Principal', value: true },
        { text: 'Secundario', value: false },
      ],
      onFilter: (value, record) => record.es_principal === value,
      filterIcon: (filtered) => renderTableFilterIcon(filtered),
      render: (v: boolean) => (v ? <Tag color="gold">Principal</Tag> : <Text type="secondary">Secundario</Text>),
    },
    {
      title: 'Estado',
      dataIndex: 'activo',
      key: 'activo',
      width: 140,
      align: 'center',
      filters: [
        { text: 'Activo', value: true },
        { text: 'Inactivo', value: false },
      ],
      onFilter: (value, record) => record.activo === value,
      filterIcon: (filtered) => renderTableFilterIcon(filtered),
      render: (v: boolean, r) => (
        <Switch
          checked={v}
          checkedChildren="Activo"
          unCheckedChildren="Inactivo"
          disabled={!canManage}
          onChange={(checked) => handleToggleAlmacen(r, checked)}
        />
      ),
    },
    {
      title: 'Acciones',
      key: 'act',
      width: 80,
      align: 'center',
      render: (_, r) =>
        canManage && (
          <Space>
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: '#0284c7' }} />}
              onClick={() => {
                setEditingItem(r);
                form.setFieldsValue(r);
                setModalAlmacenOpen(true);
              }}
            />
          </Space>
        ),
    },
  ];

  // Columnas Ubicaciones
  const colsUbicaciones: ColumnsType<Ubicacion> = [
    {
      title: 'Almacén',
      dataIndex: 'almacen_id',
      key: 'almacen_id',
      width: 180,
      filters: almacenes.map((a) => ({ text: a.nombre, value: a.id })),
      filteredValue: filtroAlmacenIds && filtroAlmacenIds.length > 0 ? filtroAlmacenIds : null,
      filterIcon: (filtered) => renderTableFilterIcon(filtered),
      render: (almId: number) => {
        const alm = almacenes.find((a) => a.id === almId);
        return alm ? <Text strong>{alm.nombre}</Text> : '—';
      },
    },
    { title: 'Código', dataIndex: 'codigo', key: 'codigo', width: 120, render: (v) => <Tag color="geekblue">{v}</Tag> },
    { title: 'Nombre / Estante', dataIndex: 'nombre', key: 'nombre', render: (v) => <Text strong>{v}</Text> },
    {
      title: 'Tipo',
      dataIndex: 'tipo',
      key: 'tipo',
      width: 140,
      filters: [
        { text: 'Estante', value: 'ESTANTE' },
        { text: 'Refrigerador', value: 'REFRIGERADOR' },
        { text: 'Congelador', value: 'CONGELADOR' },
        { text: 'Cajón', value: 'CAJON' },
        { text: 'Otro', value: 'OTRO' },
      ],
      onFilter: (value, record) => record.tipo === value,
      filterIcon: (filtered) => renderTableFilterIcon(filtered),
      render: (v) => <Tag color="purple">{v}</Tag>,
    },
    {
      title: 'Rango Temp.',
      key: 'temp',
      width: 150,
      render: (_, r) =>
        r.temp_min !== null || r.temp_max !== null ? (
          <Text style={{ fontSize: 12 }}>{`${r.temp_min ?? '?'}°C a ${r.temp_max ?? '?'}°C`}</Text>
        ) : (
          <Text type="secondary">Ambiente</Text>
        ),
    },
    {
      title: 'Estado',
      dataIndex: 'activo',
      key: 'activo',
      width: 140,
      align: 'center',
      filters: [
        { text: 'Activo', value: true },
        { text: 'Inactivo', value: false },
      ],
      onFilter: (value, record) => record.activo === value,
      filterIcon: (filtered) => renderTableFilterIcon(filtered),
      render: (v: boolean, r) => (
        <Switch
          checked={v}
          checkedChildren="Activo"
          unCheckedChildren="Inactivo"
          disabled={!canManage}
          onChange={(checked) => handleToggleUbicacion(r, checked)}
        />
      ),
    },
    {
      title: 'Acciones',
      key: 'act',
      width: 80,
      align: 'center',
      render: (_, r) =>
        canManage && (
          <Space>
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: '#0284c7' }} />}
              onClick={() => {
                setEditingItem(r);
                form.setFieldsValue(r);
                setModalUbicacionOpen(true);
              }}
            />
          </Space>
        ),
    },
  ];

  const currentTabConfig = TABS_CONFIG.find((t) => t.key === activeTab) || TABS_CONFIG[0];

  const handleOpenCreate = () => {
    setEditingItem(null);
    form.resetFields();
    if (activeTab === 'unidades') {
      form.setFieldsValue({ permite_decimales: false, activo: true });
      setModalUnidadOpen(true);
    } else if (activeTab === 'categorias') {
      form.setFieldsValue({ activo: true });
      setModalCategoriaOpen(true);
    } else if (activeTab === 'almacenes') {
      form.setFieldsValue({ sede_id: sedeId || undefined, es_principal: false, activo: true });
      setModalAlmacenOpen(true);
    } else if (activeTab === 'ubicaciones') {
      form.setFieldsValue({
        almacen_id: (filtroAlmacenIds && filtroAlmacenIds[0]) || almacenes[0]?.id,
        tipo: 'ESTANTE',
        activo: true,
      });
      setModalUbicacionOpen(true);
    }
  };

  const unidadesFiltradas = unidades.filter((u) => {
    if (!searchText.trim()) return true;
    const term = searchText.toLowerCase();
    return u.nombre.toLowerCase().includes(term) || u.codigo.toLowerCase().includes(term);
  });

  const categoriasFiltradas = categorias.filter((c) => {
    if (!searchText.trim()) return true;
    const term = searchText.toLowerCase();
    return c.nombre.toLowerCase().includes(term) || (c.descripcion && c.descripcion.toLowerCase().includes(term));
  });

  const almacenesFiltrados = almacenes.filter((a) => {
    if (!searchText.trim()) return true;
    const term = searchText.toLowerCase();
    return (
      a.nombre.toLowerCase().includes(term) ||
      (a.descripcion && a.descripcion.toLowerCase().includes(term)) ||
      (a.sede_nombre && a.sede_nombre.toLowerCase().includes(term))
    );
  });

  const ubicacionesFiltradas = ubicaciones.filter((ub) => {
    if (filtroAlmacenIds && filtroAlmacenIds.length > 0 && !filtroAlmacenIds.includes(ub.almacen_id)) return false;
    if (!searchText.trim()) return true;
    const term = searchText.toLowerCase();
    return (
      ub.codigo.toLowerCase().includes(term) ||
      ub.nombre.toLowerCase().includes(term) ||
      ub.tipo.toLowerCase().includes(term)
    );
  });

  return (
    <ModulePageLayout
      title="Maestros y Catálogos de Almacén"
      subtitle={currentTabConfig.description}
      actionButton={
        <Space size="middle" wrap>
          <Input
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            placeholder={`Buscar ${currentTabConfig.singular.toLowerCase()}...`}
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 260, ...brandSearchStyle }}
          />
          {canManage && (
            <BrandCreateButton onClick={handleOpenCreate}>
              {currentTabConfig.createLabel}
            </BrandCreateButton>
          )}
        </Space>
      }
      extraHeader={
        <div style={{ backgroundColor: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '6px 16px 0 16px' }}>
          <Tabs
            activeKey={activeTab}
            onChange={(key) => {
              setActiveTab(key);
              setSearchText('');
            }}
            items={TABS_CONFIG.map((t) => ({
              key: t.key,
              label: (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 6px' }}>
                  <span style={{ fontWeight: 600 }}>{t.label}</span>
                </span>
              ),
            }))}
          />
        </div>
      }
    >
      {activeTab === 'unidades' && (
        <GlobalTable<UnidadMedida>
          resourceName="maestros-unidades"
          rowKey="id"
          columns={colsUnidades}
          dataSource={unidadesFiltradas}
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            showTotal: (total) => `Total: ${total} unidades`,
          }}
        />
      )}
      {activeTab === 'categorias' && (
        <GlobalTable<Categoria>
          resourceName="maestros-categorias"
          rowKey="id"
          columns={colsCategorias}
          dataSource={categoriasFiltradas}
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            showTotal: (total) => `Total: ${total} categorías`,
          }}
        />
      )}
      {activeTab === 'almacenes' && (
        <GlobalTable<Almacen>
          resourceName="maestros-almacenes"
          rowKey="id"
          columns={colsAlmacenes}
          dataSource={almacenesFiltrados}
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            showTotal: (total) => `Total: ${total} almacenes`,
          }}
        />
      )}
      {activeTab === 'ubicaciones' && (
        <GlobalTable<Ubicacion>
          resourceName="maestros-ubicaciones"
          rowKey="id"
          columns={colsUbicaciones}
          dataSource={ubicacionesFiltradas}
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            showTotal: (total) => `Total: ${total} ubicaciones`,
          }}
          onChange={(_pagination, filters) => {
            const alm = filters.almacen_id as number[] | undefined;
            setFiltroAlmacenIds(alm && alm.length > 0 ? alm : undefined);
          }}
        />
      )}

        {/* MODAL UNIDAD */}
      <Modal
        title={editingItem ? 'Editar Unidad de Medida' : 'Nueva Unidad de Medida'}
        open={modalUnidadOpen}
        onCancel={() => setModalUnidadOpen(false)}
        onOk={handleGuardarUnidad}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="codigo" label="Código (símbolo)" rules={[{ required: true, message: 'Ingrese el código' }]}>
            <Input placeholder="Ej. ML, CAJA, UND" maxLength={20} />
          </Form.Item>
          <Form.Item name="nombre" label="Nombre" rules={[{ required: true, message: 'Ingrese el nombre' }]}>
            <Input placeholder="Ej. Mililitro, Caja x 100" maxLength={50} />
          </Form.Item>
          <Form.Item name="permite_decimales" label="¿Permite Decimales?" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      {/* MODAL CATEGORIA */}
      <Modal
        title={editingItem ? 'Editar Categoría' : 'Nueva Categoría'}
        open={modalCategoriaOpen}
        onCancel={() => setModalCategoriaOpen(false)}
        onOk={handleGuardarCategoria}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="nombre" label="Nombre de Categoría" rules={[{ required: true, message: 'Ingrese el nombre' }]}>
            <Input placeholder="Ej. Reactivos Bioquímica" maxLength={100} />
          </Form.Item>
          <Form.Item name="descripcion" label="Descripción">
            <Input.TextArea rows={2} placeholder="Descripción opcional..." maxLength={500} />
          </Form.Item>
        </Form>
      </Modal>

      {/* MODAL ALMACEN */}
      <Modal
        title={editingItem ? 'Editar Almacén' : 'Nuevo Almacén'}
        open={modalAlmacenOpen}
        onCancel={() => setModalAlmacenOpen(false)}
        onOk={handleGuardarAlmacen}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="sede_id" label="Sede" rules={[{ required: true, message: 'Seleccione la sede' }]}>
            <Select
              placeholder="Seleccione sede"
              options={sedes.map((s) => ({ value: s.id, label: s.nombre }))}
            />
          </Form.Item>
          <Form.Item name="nombre" label="Nombre del Almacén" rules={[{ required: true, message: 'Ingrese el nombre' }]}>
            <Input placeholder="Ej. Almacén Central de Reactivos" maxLength={100} />
          </Form.Item>
          <Form.Item name="descripcion" label="Descripción">
            <Input.TextArea rows={2} placeholder="Ubicación física, piso, ambiente..." maxLength={500} />
          </Form.Item>
          <Form.Item name="es_principal" label="¿Es Almacén Principal de la Sede?" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      {/* MODAL UBICACION */}
      <Modal
        title={editingItem ? 'Editar Ubicación' : 'Nueva Ubicación'}
        open={modalUbicacionOpen}
        onCancel={() => setModalUbicacionOpen(false)}
        onOk={handleGuardarUbicacion}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="almacen_id" label="Almacén" rules={[{ required: true, message: 'Seleccione el almacén' }]}>
            <Select
              placeholder="Seleccione almacén"
              options={almacenes.map((a) => ({ value: a.id, label: `${a.nombre} (${a.sede_nombre || 'Sede'})` }))}
            />
          </Form.Item>
          <Form.Item name="codigo" label="Código Ubicación" rules={[{ required: true, message: 'Ingrese el código' }]}>
            <Input placeholder="Ej. EST-01-A" maxLength={30} />
          </Form.Item>
          <Form.Item name="nombre" label="Nombre / Detalle" rules={[{ required: true, message: 'Ingrese el nombre' }]}>
            <Input placeholder="Ej. Estante 1 Nivel A" maxLength={100} />
          </Form.Item>
          <Form.Item name="tipo" label="Tipo">
            <Select
              options={[
                { value: 'ESTANTE', label: 'Estante' },
                { value: 'REFRIGERADOR', label: 'Refrigerador' },
                { value: 'CONGELADOR', label: 'Congelador' },
                { value: 'CAJON', label: 'Cajón' },
                { value: 'OTRO', label: 'Otro' },
              ]}
            />
          </Form.Item>
          <Space style={{ display: 'flex' }}>
            <Form.Item name="temp_min" label="Temp. Mínima (°C)">
              <InputNumber min={-90} max={60} />
            </Form.Item>
            <Form.Item name="temp_max" label="Temp. Máxima (°C)">
              <InputNumber min={-90} max={60} />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </ModulePageLayout>
  );
}
