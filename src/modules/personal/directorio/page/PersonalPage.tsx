import { useState, useMemo } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  Tag,
  Space,
  Avatar,
  App,
  Tooltip,
  Dropdown,
  type TableProps,
} from 'antd';
import {
  UserAddOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  TeamOutlined,
  UserOutlined,
  ApartmentOutlined,
  UserDeleteOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  ExclamationCircleOutlined,
  CalendarOutlined,
  MoreOutlined,
  AuditOutlined,
  FolderOpenOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  usePersonalList,
  useCrearPersonal,
  useActualizarPersonal,
  useEliminarPersonal,
  useDarDeBajaPersonal,
  useReincorporarPersonal,
  useCargos,
  useAreasPersonal,
} from '../../hooks';
import type { Personal, PersonalFilters, DarDeBajaPersonalInput } from '../../types';
import { PersonalFormDrawer } from '../components/PersonalFormDrawer';
import { DarDeBajaModal } from '../components/DarDeBajaModal';
import { HistorialLaboralDrawer } from '../components/HistorialLaboralDrawer';
import { ExpedienteColaboradorDrawer } from '../components/ExpedienteColaboradorDrawer';
import { usePermissions } from '../../../../shared/components/PermissionGuard';
import { BrandCreateButton } from '../../../../shared/components/BrandCreateButton';
import { brandSearchStyle, brandControlStyle } from '../../../../shared/components/ModulePageLayout';

export default function PersonalPage() {
  const { modal } = App.useApp();
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission('personal.directorio.create');
  const canUpdate = hasPermission('personal.directorio.update');
  const canDelete = hasPermission('personal.directorio.delete');
  const canViewHistorial = hasPermission('personal.historial.read') || hasPermission('personal.directorio.read');

  const [filters, setFilters] = useState<PersonalFilters>({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedPersonal, setSelectedPersonal] = useState<Personal | null>(null);

  const [darDeBajaModalOpen, setDarDeBajaModalOpen] = useState(false);
  const [personalParaBaja, setPersonalParaBaja] = useState<Personal | null>(null);

  const [historialDrawerOpen, setHistorialDrawerOpen] = useState(false);
  const [personalParaHistorial, setPersonalParaHistorial] = useState<Personal | null>(null);

  const [expedienteOpen, setExpedienteOpen] = useState(false);
  const [personalParaExpediente, setPersonalParaExpediente] = useState<Personal | null>(null);

  // Queries & Mutations
  const { data: personalList = [], isLoading } = usePersonalList(filters);
  const { data: catalogoCargos = [] } = useCargos();
  const { data: catalogoAreas = [] } = useAreasPersonal();

  const cargoFilterOptions = useMemo(() => {
    return catalogoCargos.map((c) => ({ label: c.nombre, value: c.nombre }));
  }, [catalogoCargos]);

  const areaFilterOptions = useMemo(() => {
    return catalogoAreas.map((a) => ({ label: a.nombre, value: a.nombre }));
  }, [catalogoAreas]);

  const crearMutation = useCrearPersonal();
  const actualizarMutation = useActualizarPersonal();
  const eliminarMutation = useEliminarPersonal();
  const darDeBajaMutation = useDarDeBajaPersonal();
  const reincorporarMutation = useReincorporarPersonal();

  // Summary statistics (100% RRHH)
  const stats = useMemo(() => {
    const total = personalList.length;
    const activos = personalList.filter((p) => p.activo).length;
    const cesados = personalList.filter((p) => !p.activo).length;
    const areasUnicas = new Set(personalList.map((p) => p.area).filter(Boolean)).size;
    return { total, activos, cesados, areasUnicas };
  }, [personalList]);

  // Handlers
  const handleOpenCreate = () => {
    setSelectedPersonal(null);
    setDrawerOpen(true);
  };

  const handleOpenEdit = (colaborador: Personal) => {
    setSelectedPersonal(colaborador);
    setDrawerOpen(true);
  };

  const handleSaveColaborador = async (data: any) => {
    if (selectedPersonal) {
      await actualizarMutation.mutateAsync({ id: selectedPersonal.id, data });
    } else {
      await crearMutation.mutateAsync(data);
    }
    setDrawerOpen(false);
  };

  const handleOpenDarDeBaja = (colaborador: Personal) => {
    setPersonalParaBaja(colaborador);
    setDarDeBajaModalOpen(true);
  };

  const handleDarDeBajaSubmit = async (data: DarDeBajaPersonalInput) => {
    if (!personalParaBaja) return;
    await darDeBajaMutation.mutateAsync({ id: personalParaBaja.id, data });
    setDarDeBajaModalOpen(false);
  };

  const handleReincorporar = async (personalId: number) => {
    await reincorporarMutation.mutateAsync(personalId);
  };

  const handleEliminar = async (id: number) => {
    await eliminarMutation.mutateAsync(id);
  };

  const handleConfirmEliminar = (colaborador: Personal) => {
    modal.confirm({
      title: '¿Desactivar colaborador?',
      icon: <ExclamationCircleOutlined style={{ color: '#ef4444' }} />,
      content: `Se deshabilitará la ficha de ${colaborador.nombres} ${colaborador.apellidos}.`,
      okText: 'Sí, desactivar',
      okType: 'danger',
      cancelText: 'Cancelar',
      centered: true,
      onOk: () => handleEliminar(colaborador.id),
    });
  };

  const handleConfirmReincorporar = (colaborador: Personal) => {
    modal.confirm({
      title: '¿Reincorporar colaborador?',
      icon: <ReloadOutlined style={{ color: '#059669' }} />,
      content: `Se restaurará la ficha de ${colaborador.nombres} ${colaborador.apellidos} al estado Activo y se removerá el registro de cese laboral.`,
      okText: 'Sí, reincorporar',
      okButtonProps: { style: { backgroundColor: '#059669', borderColor: '#059669' } },
      cancelText: 'Cancelar',
      centered: true,
      onOk: () => handleReincorporar(colaborador.id),
    });
  };

  // Columns - 100% RRHH & Directorio de Personal
  const columns: TableProps<Personal>['columns'] = [
    {
      title: 'Colaborador',
      key: 'colaborador',
      render: (_, record) => {
        const initials = `${record.nombres.charAt(0)}${record.apellidos.charAt(0)}`.toUpperCase();
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar
              size={40}
              style={{
                background: record.activo
                  ? 'linear-gradient(135deg, #0284c7 0%, #059669 100%)'
                  : '#94a3b8',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: 14,
                flexShrink: 0,
                boxShadow: record.activo ? '0 2px 8px rgba(2, 132, 199, 0.25)' : 'none',
                cursor: 'pointer',
              }}
              onClick={() => {
                setPersonalParaExpediente(record);
                setExpedienteOpen(true);
              }}
            >
              {initials}
            </Avatar>
            <div
              style={{ cursor: 'pointer' }}
              onClick={() => {
                setPersonalParaExpediente(record);
                setExpedienteOpen(true);
              }}
            >
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0284c7' }}>
                {record.nombres} {record.apellidos}
              </div>
              <div style={{ fontSize: 11.5, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6, marginTop: 1 }}>
                <span>{record.tipo_documento || 'DNI'}: {record.numero_documento || 'No registrado'}</span>
                {record.colegiatura && (
                  <Tag
                    style={{
                      fontSize: 10,
                      lineHeight: '14px',
                      padding: '0 5px',
                      margin: 0,
                      backgroundColor: '#ecfdf5',
                      borderColor: '#a7f3d0',
                      color: '#059669',
                      fontWeight: 600,
                      borderRadius: 4,
                    }}
                  >
                    {record.colegiatura}
                  </Tag>
                )}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: 'Cargo & Área',
      key: 'cargo',
      render: (_, record) => (
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
            {record.cargo || 'Sin cargo'}
          </div>
          <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 1 }}>
            {record.area || 'Laboratorio'} • {record.tipo_contrato || 'Contrato general'}
          </div>
        </div>
      ),
    },
    {
      title: 'Contacto',
      key: 'contacto',
      render: (_, record) => (
        <div style={{ fontSize: 12 }}>
          <div style={{ color: '#0284c7', fontWeight: 500 }}>{record.email || '—'}</div>
          <div style={{ color: '#64748b', fontSize: 11, marginTop: 1 }}>{record.telefono || '—'}</div>
        </div>
      ),
    },
    {
      title: 'Fecha de Ingreso',
      key: 'fecha_ingreso',
      render: (_, record) => {
        if (!record.fecha_ingreso) {
          return <span style={{ fontSize: 12, color: '#94a3b8' }}>No especificada</span>;
        }
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CalendarOutlined style={{ color: '#64748b', fontSize: 13 }} />
            <span style={{ fontSize: 12, fontWeight: 500, color: '#334155' }}>
              {dayjs(record.fecha_ingreso).format('DD/MM/YYYY')}
            </span>
          </div>
        );
      },
    },
    {
      title: 'Estado',
      key: 'activo',
      width: 140,
      render: (_, record) => {
        if (record.activo) {
          return (
            <Tag
              style={{
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 600,
                backgroundColor: '#ecfdf5',
                borderColor: '#a7f3d0',
                color: '#059669',
                padding: '2px 10px',
              }}
            >
              Activo
            </Tag>
          );
        }

        const isCesado = Boolean(record.fecha_cese || record.motivo_cese);

        return (
          <Tooltip
            title={
              isCesado ? (
                <div style={{ fontSize: 11.5, lineHeight: 1.5 }}>
                  <div style={{ fontWeight: 700, color: '#fca5a5', marginBottom: 2 }}>
                    Colaborador Cesado / De Baja
                  </div>
                  {record.fecha_cese && (
                    <div>
                      <strong>Fecha cese:</strong> {dayjs(record.fecha_cese).format('DD/MM/YYYY')}
                    </div>
                  )}
                  {record.motivo_cese && (
                    <div>
                      <strong>Motivo:</strong> {record.motivo_cese}
                    </div>
                  )}
                  {record.observaciones_cese && (
                    <div>
                      <strong>Obs:</strong> {record.observaciones_cese}
                    </div>
                  )}
                </div>
              ) : (
                'Colaborador inactivo'
              )
            }
          >
            <Tag
              style={{
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 600,
                backgroundColor: isCesado ? '#fff1f2' : '#f1f5f9',
                borderColor: isCesado ? '#fecdd3' : '#e2e8f0',
                color: isCesado ? '#e11d48' : '#64748b',
                padding: '2px 10px',
                cursor: isCesado ? 'pointer' : 'default',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {isCesado ? 'Cesado (Baja)' : 'Inactivo'}
              {isCesado && <InfoCircleOutlined style={{ fontSize: 11 }} />}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 140,
      render: (_, record) => {
        const items = [
          {
            key: 'expediente',
            icon: <FolderOpenOutlined style={{ color: '#0d9488' }} />,
            label: 'Ver Expediente 360º',
          },
          ...(canViewHistorial
            ? [
                {
                  key: 'historial',
                  icon: <AuditOutlined style={{ color: '#0284c7' }} />,
                  label: 'Historial & Altas/Ceses',
                },
              ]
            : []),
          ...(canUpdate
            ? [
                {
                  key: 'edit',
                  icon: <EditOutlined />,
                  label: 'Editar información',
                },
              ]
            : []),
          ...((canUpdate || canDelete)
            ? [
                {
                  type: 'divider' as const,
                },
              ]
            : []),
          ...(record.activo
            ? [
                ...(canUpdate
                  ? [
                      {
                        key: 'dar_de_baja',
                        icon: <UserDeleteOutlined style={{ color: '#e11d48' }} />,
                        danger: true,
                        label: 'Dar de Baja (Cese / Renuncia)',
                      },
                    ]
                  : []),
                ...(canDelete
                  ? [
                      {
                        key: 'delete',
                        icon: <DeleteOutlined />,
                        danger: true,
                        label: 'Desactivación rápida',
                      },
                    ]
                  : []),
              ]
            : [
                ...(canUpdate
                  ? [
                      {
                        key: 'reincorporar',
                        icon: <ReloadOutlined style={{ color: '#059669' }} />,
                        label: 'Reincorporar colaborador',
                      },
                    ]
                  : []),
              ]),
        ];

        return (
          <Space direction="horizontal" size={4}>
            <Tooltip title="Expediente Digital 360º">
              <Button
                type="text"
                size="small"
                icon={<FolderOpenOutlined style={{ color: '#0d9488', fontSize: 16 }} />}
                onClick={() => {
                  setPersonalParaExpediente(record);
                  setExpedienteOpen(true);
                }}
                style={{ borderRadius: 6 }}
              />
            </Tooltip>
            {canUpdate && (
              <Tooltip title="Editar">
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined style={{ color: '#0284c7' }} />}
                  onClick={() => handleOpenEdit(record)}
                  style={{ borderRadius: 6 }}
                />
              </Tooltip>
            )}
            <Dropdown
              menu={{
                items,
                onClick: ({ key, domEvent }) => {
                  domEvent.stopPropagation();
                  if (key === 'expediente') {
                    setPersonalParaExpediente(record);
                    setExpedienteOpen(true);
                  } else if (key === 'historial') {
                    setPersonalParaHistorial(record);
                    setHistorialDrawerOpen(true);
                  } else if (key === 'edit') {
                    handleOpenEdit(record);
                  } else if (key === 'dar_de_baja') {
                    handleOpenDarDeBaja(record);
                  } else if (key === 'delete') {
                    handleConfirmEliminar(record);
                  } else if (key === 'reincorporar') {
                    handleConfirmReincorporar(record);
                  }
                },
              }}
              trigger={['click']}
              placement="bottomRight"
            >
              <Button
                type="text"
                size="small"
                icon={<MoreOutlined style={{ color: '#64748b' }} />}
                style={{ borderRadius: 6 }}
              />
            </Dropdown>
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Banner / Actions */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <div>
          <h1 style={{
            fontSize: 22,
            fontWeight: 800,
            color: '#0f172a',
            margin: '0 0 4px',
            letterSpacing: '-0.02em',
          }}>
            Directorio de Personal & Talento
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
            Gestión integral de colaboradores, expedientes laborales, cargos y firmas médicas de resultados
          </p>
        </div>

        {canCreate && (
          <Space size="middle">
            <BrandCreateButton
              icon={<UserAddOutlined />}
              onClick={handleOpenCreate}
            >
              Nuevo Colaborador
            </BrandCreateButton>
          </Space>
        )}
      </div>

      {/* Statistics Cards (Blanco / Azul / Menta / Violeta) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 14,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
        }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: 'rgba(2, 132, 199, 0.1)',
            color: '#0284c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
          }}>
            <TeamOutlined />
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
              {stats.total}
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, fontWeight: 500 }}>
              Total Colaboradores
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 14,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
        }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: '#ecfdf5',
            color: '#059669',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
          }}>
            <UserOutlined />
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
              {stats.activos}
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, fontWeight: 500 }}>
              Colaboradores Activos
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 14,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
        }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
          }}>
            <UserDeleteOutlined />
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
              {stats.cesados}
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, fontWeight: 500 }}>
              Cesados / Bajas
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 14,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
        }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: 'rgba(124, 58, 237, 0.1)',
            color: '#7c3aed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
          }}>
            <ApartmentOutlined />
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
              {stats.areasUnicas}
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, fontWeight: 500 }}>
              Áreas Laborales
            </div>
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        padding: '12px 16px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        alignItems: 'center',
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.02)',
      }}>
        <Input
          placeholder="Buscar por nombre, documento o email..."
          prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
          allowClear
          value={filters.search}
          onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
          style={{ width: 280, ...brandSearchStyle }}
        />

        <Select
          placeholder="Estado colaborador"
          allowClear
          value={filters.activo}
          onChange={(val) => setFilters((prev) => ({ ...prev, activo: val }))}
          options={[
            { label: 'Solo Activos', value: true },
            { label: 'Cesados / Inactivos', value: false },
          ]}
          style={{ width: 160, ...brandControlStyle }}
        />

        <Select
          placeholder="Filtrar por cargo"
          allowClear
          showSearch
          value={filters.cargo}
          onChange={(val) => setFilters((prev) => ({ ...prev, cargo: val }))}
          options={cargoFilterOptions}
          optionFilterProp="label"
          style={{ width: 180, ...brandControlStyle }}
        />

        <Select
          placeholder="Filtrar por área"
          allowClear
          showSearch
          value={filters.area}
          onChange={(val) => setFilters((prev) => ({ ...prev, area: val }))}
          options={areaFilterOptions}
          optionFilterProp="label"
          style={{ width: 180, ...brandControlStyle }}
        />

        {(filters.search || filters.cargo || filters.area || filters.activo !== undefined) && (
          <Button
            type="link"
            onClick={() => setFilters({})}
            style={{ color: '#0284c7', fontSize: 12, padding: 0, fontWeight: 500 }}
          >
            Limpiar filtros
          </Button>
        )}
      </div>

      {/* Main Table Libre */}
      <Table
        columns={columns}
        dataSource={personalList}
        rowKey="id"
        loading={isLoading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
          showTotal: (total) => `Total ${total} colaboradores`,
        }}
        locale={{ emptyText: 'No se encontraron colaboradores' }}
      />

      {/* Form Drawer */}
      <PersonalFormDrawer
        open={drawerOpen}
        personal={selectedPersonal}
        onClose={() => setDrawerOpen(false)}
        onSubmit={handleSaveColaborador}
        loading={crearMutation.isPending || actualizarMutation.isPending}
      />

      {/* Dar de Baja Modal */}
      <DarDeBajaModal
        open={darDeBajaModalOpen}
        personal={personalParaBaja}
        onClose={() => setDarDeBajaModalOpen(false)}
        onConfirm={handleDarDeBajaSubmit}
        loading={darDeBajaMutation.isPending}
      />

      {/* Historial y Auditoría Laboral Drawer */}
      <HistorialLaboralDrawer
        open={historialDrawerOpen}
        colaborador={personalParaHistorial}
        onClose={() => {
          setHistorialDrawerOpen(false);
          setPersonalParaHistorial(null);
        }}
      />

      {/* Expediente Digital 360º del Colaborador */}
      <ExpedienteColaboradorDrawer
        open={expedienteOpen}
        colaborador={personalParaExpediente}
        onClose={() => {
          setExpedienteOpen(false);
          setPersonalParaExpediente(null);
        }}
      />
    </div>
  );
}
