import React, { useState, useMemo } from 'react';
import {
  Tabs,
  Table,
  Button,
  Input,
  Tag,
  Space,
  Modal,
  Form,
  Switch,
  Popconfirm,
  Tooltip,
  Typography,
} from 'antd';
import ModulePageLayout, { BrandCreateButton, brandSearchStyle } from '../../../../shared/components/ModulePageLayout';
import { usePermissions } from '../../../../shared/components/PermissionGuard';
import {
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  useCatalogos,
  useCrearCatalogoItem,
  useActualizarCatalogoItem,
  useEliminarCatalogoItem,
} from '../../hooks';
import type { PersonalCatalogoItem, CatalogoTipo } from '../../types';

const { Title, Text, Paragraph } = Typography;

interface TabConfig {
  key: CatalogoTipo;
  label: string;
  singular: string;
  description: string;
  placeholderName: string;
}

const TABS_CONFIG: TabConfig[] = [
  {
    key: 'cargos',
    label: 'Cargos Laborales',
    singular: 'Cargo',
    description: 'Puestos y responsabilidades asignados a los colaboradores del laboratorio y clínica.',
    placeholderName: 'Ej. Bioquímico Clínico, Flebotomista, Coordinador...',
  },
  {
    key: 'areas',
    label: 'Áreas de Trabajo',
    singular: 'Área',
    description: 'Departamentos funcionales donde opera el personal de la institución.',
    placeholderName: 'Ej. Bioquímica, Hematología, Logística...',
  },
  {
    key: 'tipos-contrato',
    label: 'Tipos de Contrato',
    singular: 'Tipo de Contrato',
    description: 'Modalidades de contratación y regímenes laborales aplicados a los empleados.',
    placeholderName: 'Ej. Planilla (Indefinido), Servicios No Personales...',
  },
  {
    key: 'motivos-cese',
    label: 'Motivos de Cese',
    singular: 'Motivo de Cese',
    description: 'Causales de término laboral o desvinculación aplicadas en el retiro de personal.',
    placeholderName: 'Ej. Renuncia Voluntaria, Mutuo Disenso, Término de Contrato...',
  },
];

export const PersonalCatalogosPage: React.FC = () => {
  const { hasPermission } = usePermissions();
  const canManage = hasPermission('personal.catalogos.manage');

  const [activeTab, setActiveTab] = useState<CatalogoTipo>('cargos');
  const [searchText, setSearchText] = useState<string>('');

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<PersonalCatalogoItem | null>(null);
  const [form] = Form.useForm();

  // Queries for each catalog
  const {
    data: cargos = [],
    isLoading: loadingCargos,
    refetch: refetchCargos,
  } = useCatalogos('cargos');
  const {
    data: areas = [],
    isLoading: loadingAreas,
    refetch: refetchAreas,
  } = useCatalogos('areas');
  const {
    data: tiposContrato = [],
    isLoading: loadingContratos,
    refetch: refetchContratos,
  } = useCatalogos('tipos-contrato');
  const {
    data: motivosCese = [],
    isLoading: loadingMotivosCese,
    refetch: refetchMotivosCese,
  } = useCatalogos('motivos-cese');

  // Mutations
  const crearMutation = useCrearCatalogoItem();
  const actualizarMutation = useActualizarCatalogoItem();
  const eliminarMutation = useEliminarCatalogoItem();

  // Current tab config
  const currentTabConfig = useMemo(
    () => TABS_CONFIG.find((t) => t.key === activeTab) || TABS_CONFIG[0],
    [activeTab]
  );

  // Current tab dataset
  const currentData = useMemo(() => {
    let list: PersonalCatalogoItem[] = [];
    if (activeTab === 'cargos') list = cargos;
    else if (activeTab === 'areas') list = areas;
    else if (activeTab === 'tipos-contrato') list = tiposContrato;
    else if (activeTab === 'motivos-cese') list = motivosCese;

    if (!searchText.trim()) return list;

    const term = searchText.toLowerCase().trim();
    return list.filter(
      (item) =>
        item.nombre.toLowerCase().includes(term) ||
        (item.descripcion && item.descripcion.toLowerCase().includes(term))
    );
  }, [activeTab, cargos, areas, tiposContrato, motivosCese, searchText]);

  const currentLoading =
    activeTab === 'cargos'
      ? loadingCargos
      : activeTab === 'areas'
      ? loadingAreas
      : activeTab === 'tipos-contrato'
      ? loadingContratos
      : loadingMotivosCese;

  const handleRefreshCurrent = () => {
    if (activeTab === 'cargos') refetchCargos();
    else if (activeTab === 'areas') refetchAreas();
    else if (activeTab === 'tipos-contrato') refetchContratos();
    else if (activeTab === 'motivos-cese') refetchMotivosCese();
  };

  // Open modal to add
  const handleOpenAdd = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({ activo: true });
    setModalVisible(true);
  };

  // Open modal to edit
  const handleOpenEdit = (item: PersonalCatalogoItem) => {
    setEditingItem(item);
    form.resetFields();
    form.setFieldsValue({
      nombre: item.nombre,
      descripcion: item.descripcion || '',
      activo: item.activo,
    });
    setModalVisible(true);
  };

  // Submit Modal
  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingItem) {
        await actualizarMutation.mutateAsync({
          tipo: activeTab,
          id: editingItem.id,
          data: {
            nombre: values.nombre,
            descripcion: values.descripcion || null,
            activo: values.activo,
          },
        });
      } else {
        await crearMutation.mutateAsync({
          tipo: activeTab,
          data: {
            nombre: values.nombre,
            descripcion: values.descripcion || null,
          },
        });
      }
      setModalVisible(false);
      handleRefreshCurrent();
    } catch {
      // Form validation error
    }
  };

  // Toggle quick status
  const handleToggleStatus = async (item: PersonalCatalogoItem, checked: boolean) => {
    await actualizarMutation.mutateAsync({
      tipo: activeTab,
      id: item.id,
      data: { activo: checked },
    });
    handleRefreshCurrent();
  };

  // Delete item
  const handleDeleteItem = async (id: number) => {
    await eliminarMutation.mutateAsync({
      tipo: activeTab,
      id,
    });
    handleRefreshCurrent();
  };

  // Stats calculation
  const totalItems = currentData.length;
  const activeCount = currentData.filter((i) => i.activo).length;
  const totalAssignedCollaborators = currentData.reduce(
    (acc, curr) => acc + (curr.total_colaboradores || 0),
    0
  );

  // Columns definition
  const columns: ColumnsType<PersonalCatalogoItem> = [
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
      width: '28%',
      render: (nombre: string, record) => (
        <Space direction="vertical" size={2}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 600, color: '#0f172a', fontSize: 14 }}>{nombre}</span>
            {!record.activo && (
              <Tag color="default" style={{ fontSize: 11, borderRadius: 12 }}>
                Inactivo
              </Tag>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: 'Descripción / Observaciones',
      dataIndex: 'descripcion',
      key: 'descripcion',
      render: (desc: string | null) =>
        desc ? (
          <Text type="secondary" style={{ fontSize: 13 }}>
            {desc}
          </Text>
        ) : (
          <Text type="secondary" italic style={{ fontSize: 12, opacity: 0.6 }}>
            Sin descripción registrada
          </Text>
        ),
    },
    {
      title: 'Colaboradores',
      dataIndex: 'total_colaboradores',
      key: 'total_colaboradores',
      width: 150,
      align: 'center',
      render: (total: number = 0) => (
        <Tag
          color={total > 0 ? 'processing' : 'default'}
          style={{
            borderRadius: 14,
            padding: '2px 10px',
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          <TeamOutlined style={{ marginRight: 6 }} />
          {total} {total === 1 ? 'persona' : 'personas'}
        </Tag>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'activo',
      key: 'activo',
      width: 140,
      align: 'center',
      render: (activo: boolean, record) => (
        <Switch
          checked={activo}
          disabled={!canManage}
          checkedChildren="Activo"
          unCheckedChildren="Inactivo"
          onChange={(checked) => handleToggleStatus(record, checked)}
          loading={actualizarMutation.isPending}
        />
      ),
    },
    ...(canManage
      ? [
          {
            title: 'Acciones',
            key: 'acciones',
            width: 120,
            align: 'center' as const,
            render: (_: any, record: PersonalCatalogoItem) => {
              const isInUse = (record.total_colaboradores || 0) > 0;
              return (
                <Space size="small">
                  <Tooltip title="Editar detalles">
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined style={{ color: '#0284c7' }} />}
                      onClick={() => handleOpenEdit(record)}
                    />
                  </Tooltip>
                  <Popconfirm
                    title={`¿Eliminar ${currentTabConfig.singular.toLowerCase()}?`}
                    description={
                      isInUse
                        ? `Tiene ${record.total_colaboradores} colaborador(es) asignado(s). Se desactivará para proteger el historial laboral.`
                        : 'Esta acción no se puede deshacer.'
                    }
                    okText={isInUse ? 'Desactivar' : 'Eliminar'}
                    cancelText="Cancelar"
                    okButtonProps={{ danger: true }}
                    onConfirm={() => handleDeleteItem(record.id)}
                  >
                    <Tooltip title={isInUse ? 'Desactivar (en uso)' : 'Eliminar'}>
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        loading={eliminarMutation.isPending}
                      />
                    </Tooltip>
                  </Popconfirm>
                </Space>
              );
            },
          },
        ]
      : []),
  ];

  return (
    <ModulePageLayout
      title="Catálogos de Personal"
      subtitle={currentTabConfig.description}
      actionButton={
        canManage ? (
          <BrandCreateButton onClick={handleOpenAdd}>
            Nuevo {currentTabConfig.singular}
          </BrandCreateButton>
        ) : undefined
      }
      extraHeader={
        <div style={{ backgroundColor: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '6px 16px 0 16px' }}>
          <Tabs
            activeKey={activeTab}
            onChange={(key) => {
              setActiveTab(key as CatalogoTipo);
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Input
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              placeholder={`Buscar ${currentTabConfig.singular.toLowerCase()}...`}
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 280, ...brandSearchStyle }}
            />
          </div>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Total registros: <strong style={{ color: '#0f172a' }}>{currentData?.length ?? 0}</strong>
          </Text>
        </div>
      }
    >
      {/* Tabla de Elementos */}
      <Table<PersonalCatalogoItem>
        columns={columns}
        dataSource={currentData}
        rowKey="id"
        loading={currentLoading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
          showTotal: (total) => `Total ${total} registros`,
        }}
      />

      {/* Modal para Crear / Editar Elemento */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontWeight: 700, color: '#0f172a' }}>
              {editingItem
                ? `Editar ${currentTabConfig.singular}`
                : `Registrar Nuevo ${currentTabConfig.singular}`}
            </span>
          </div>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleModalSubmit}
        confirmLoading={crearMutation.isPending || actualizarMutation.isPending}
        okText={editingItem ? 'Guardar Cambios' : 'Registrar'}
        cancelText="Cancelar"
        destroyOnHidden
        okButtonProps={{
          style: {
            background: 'linear-gradient(135deg, #0284c7 0%, #059669 100%)',
            border: 'none',
            borderRadius: 8,
          },
        }}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="nombre"
            label="Nombre"
            rules={[
              { required: true, message: `Por favor ingresa el nombre del ${currentTabConfig.singular.toLowerCase()}` },
              { min: 2, message: 'El nombre debe tener al menos 2 caracteres' },
              { max: 100, message: 'Máximo 100 caracteres' },
            ]}
          >
            <Input placeholder={currentTabConfig.placeholderName} style={{ borderRadius: 8 }} />
          </Form.Item>

          <Form.Item name="descripcion" label="Descripción / Funciones (Opcional)">
            <Input.TextArea
              rows={3}
              placeholder="Describe el alcance, funciones principales o particularidades..."
              maxLength={300}
              showCount
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          {editingItem && (
            <Form.Item
              name="activo"
              label="Estado Operativo"
              valuePropName="checked"
              extra="Si desactivas este elemento, ya no estará disponible para nuevas asignaciones, pero se conservará en los registros históricos."
            >
              <Switch checkedChildren="Activo" unCheckedChildren="Inactivo" />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </ModulePageLayout>
  );
};

export default PersonalCatalogosPage;
