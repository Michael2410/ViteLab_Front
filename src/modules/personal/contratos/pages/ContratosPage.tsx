import { useState, useMemo } from 'react';
import {
  Button,
  Input,
  Tag,
  Space,
  Tooltip,
  Dropdown,
  App,
  Tabs,
  Badge,
  type TableProps,
} from 'antd';
import {
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  MoreOutlined,
  CheckCircleOutlined,
  AlertOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import ModulePageLayout, { BrandCreateButton, brandSearchStyle, renderTableFilterIcon } from '../../../../shared/components/ModulePageLayout';
import GlobalTable from '../../../../shared/components/GlobalTable';
import { usePermissions } from '../../../../shared/components/PermissionGuard';
import {
  useContratosList,
  useCrearContrato,
  useActualizarContrato,
  useEliminarContrato,
  useRenovarContrato,
  usePersonalList,
} from '../../hooks';
import type { ContratoItem } from '../../types';
import { ContratoModal } from '../components/ContratoModal';
import { RenovarContratoModal } from '../components/RenovarContratoModal';

type ContratoTab = 'todos' | 'por_vencer';

interface TabConfig {
  key: ContratoTab;
  label: string;
  description: string;
}

const TABS_CONFIG: TabConfig[] = [
  {
    key: 'todos',
    label: 'Todos los Contratos',
    description: 'Padrón general y registro histórico de relaciones contractuales de todo el personal.',
  },
  {
    key: 'por_vencer',
    label: 'Por Vencer (< 30 días)',
    description: 'Semáforo preventivo de contratos con fecha de término en los próximos 30 días para renovación o término.',
  },
];

export default function ContratosPage() {
  const { modal } = App.useApp();
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission('personal.contratos.create');
  const canUpdate = hasPermission('personal.contratos.update');
  const canDelete = hasPermission('personal.contratos.delete');

  const [filterMode, setFilterMode] = useState<ContratoTab>('todos');
  const [searchTerm, setSearchTerm] = useState('');

  const currentTabConfig = useMemo(
    () => TABS_CONFIG.find((t) => t.key === filterMode) || TABS_CONFIG[0],
    [filterMode]
  );

  // Modales
  const [contratoModalOpen, setContratoModalOpen] = useState(false);
  const [selectedContrato, setSelectedContrato] = useState<ContratoItem | null>(null);

  const [renovarModalOpen, setRenovarModalOpen] = useState(false);
  const [contratoParaRenovar, setContratoParaRenovar] = useState<ContratoItem | null>(null);

  // Queries: Obtenemos el padrón completo para conteo exacto en las pestañas
  const { data: todosContratos = [], isLoading } = useContratosList();
  const { data: personalList = [] } = usePersonalList({ activo: true });

  const crearMutation = useCrearContrato();
  const actualizarMutation = useActualizarContrato();
  const eliminarMutation = useEliminarContrato();
  const renovarMutation = useRenovarContrato();

  // Estadísticas globales para cabecera y badges de pestañas
  const stats = useMemo(() => {
    const total = todosContratos.length;
    const porVencer = todosContratos.filter((c: ContratoItem) => c.estado === 'POR_VENCER').length;
    return { total, porVencer };
  }, [todosContratos]);

  // Filtrado reactivo en memoria para máxima velocidad de respuesta
  const contratosFiltrados = useMemo(() => {
    return todosContratos.filter((c: ContratoItem) => {
      if (filterMode === 'por_vencer' && c.estado !== 'POR_VENCER') {
        return false;
      }

      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase().trim();
      return (
        c.colaborador_nombre?.toLowerCase().includes(term) ||
        c.numero_contrato?.toLowerCase().includes(term) ||
        c.cargo?.toLowerCase().includes(term) ||
        c.colaborador_documento?.toLowerCase().includes(term)
      );
    });
  }, [todosContratos, filterMode, searchTerm]);

  // Handlers
  const handleOpenCreate = () => {
    setSelectedContrato(null);
    setContratoModalOpen(true);
  };

  const handleOpenEdit = (contrato: ContratoItem) => {
    setSelectedContrato(contrato);
    setContratoModalOpen(true);
  };

  const handleOpenRenovar = (contrato: ContratoItem) => {
    setContratoParaRenovar(contrato);
    setRenovarModalOpen(true);
  };

  const handleSaveContrato = async (data: any) => {
    if (selectedContrato) {
      await actualizarMutation.mutateAsync({ id: selectedContrato.id, data });
    } else {
      await crearMutation.mutateAsync({ personalId: data.personal_id, data });
    }
    setContratoModalOpen(false);
  };

  const handleConfirmRenovar = async (contratoAnteriorId: number, data: any) => {
    await renovarMutation.mutateAsync({ id: contratoAnteriorId, data });
    setRenovarModalOpen(false);
    setContratoParaRenovar(null);
  };

  const handleDeleteContrato = (contrato: ContratoItem) => {
    modal.confirm({
      title: '¿Eliminar contrato?',
      content: `Se eliminará el contrato Nº ${contrato.numero_contrato || contrato.id} de ${contrato.colaborador_nombre}. Esta acción no se puede deshacer.`,
      okText: 'Sí, eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        await eliminarMutation.mutateAsync(contrato.id);
      },
    });
  };

  const getEstadoBadge = (record: ContratoItem) => {
    if (record.estado === 'POR_VENCER') {
      return (
        <Tooltip title={`Vence en ${record.dias_restantes} día(s)`}>
          <Tag color="warning" icon={<AlertOutlined />} style={{ fontWeight: 600 }}>
            Por vencer ({record.dias_restantes}d)
          </Tag>
        </Tooltip>
      );
    }
    if (record.estado === 'VENCIDO') {
      return (
        <Tag color="error" icon={<CloseCircleOutlined />} style={{ fontWeight: 600 }}>
          Vencido
        </Tag>
      );
    }
    if (record.estado === 'VIGENTE') {
      return (
        <Tag color="success" icon={<CheckCircleOutlined />}>
          {record.es_indefinido ? 'Vigente (Indeterminado)' : 'Vigente'}
        </Tag>
      );
    }
    if (record.estado === 'RENOVADO') {
      return <Tag color="default">Renovado</Tag>;
    }
    return <Tag color="default">{record.estado}</Tag>;
  };

  const columns: TableProps<ContratoItem>['columns'] = [
    {
      title: 'Colaborador',
      key: 'colaborador',
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0f172a' }}>{r.colaborador_nombre}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            Doc: {r.colaborador_documento || 'S/N'} • Cargo: {r.cargo || 'N/A'}
          </div>
        </div>
      ),
    },
    {
      title: 'Nº Contrato / Modalidad',
      key: 'modalidad',
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 500, color: '#334155' }}>
            {r.numero_contrato || 'Sin código'}
          </div>
          <Tag color="cyan" style={{ fontSize: 11, marginTop: 2 }}>
            {r.tipo_contrato_nombre || 'Contrato general'}
          </Tag>
        </div>
      ),
    },
    {
      title: 'Vigencia',
      key: 'vigencia',
      render: (_, r) => (
        <div>
          <div style={{ fontSize: 12, color: '#334155' }}>
            <strong>Inicio:</strong> {dayjs(r.fecha_inicio).format('DD/MM/YYYY')}
          </div>
          <div style={{ fontSize: 12, color: r.estado === 'POR_VENCER' ? '#ea580c' : '#64748b' }}>
            <strong>Vence:</strong> {r.es_indefinido ? 'Indefinido' : r.fecha_fin ? dayjs(r.fecha_fin).format('DD/MM/YYYY') : 'No fijado'}
          </div>
        </div>
      ),
    },
    {
      title: 'Sueldo (S/)',
      key: 'sueldo',
      align: 'right',
      render: (_, r) =>
        r.sueldo_pactado ? (
          <span style={{ fontWeight: 600, color: '#0f172a' }}>
            S/ {Number(r.sueldo_pactado).toFixed(2)}
          </span>
        ) : (
          <span style={{ color: '#94a3b8' }}>-</span>
        ),
    },
    {
      title: 'Estado / Alerta',
      key: 'estado',
      align: 'center',
      filters: [
        { text: 'Vigente', value: 'VIGENTE' },
        { text: 'Por Vencer', value: 'POR_VENCER' },
        { text: 'Vencido', value: 'VENCIDO' },
        { text: 'Renovado', value: 'RENOVADO' },
      ],
      onFilter: (value, record) => record.estado === value,
      filterIcon: (filtered) => renderTableFilterIcon(filtered),
      render: (_, r) => getEstadoBadge(r),
    },
    ...(canUpdate || canDelete
      ? [
          {
            title: 'Acciones',
            key: 'acciones',
            width: 110,
            render: (_: any, r: ContratoItem) => {
              const items = [
                ...(canUpdate
                  ? [
                      {
                        key: 'renovar',
                        icon: <ReloadOutlined style={{ color: '#059669' }} />,
                        label: 'Renovar contrato',
                      },
                      {
                        key: 'edit',
                        icon: <EditOutlined />,
                        label: 'Editar contrato',
                      },
                    ]
                  : []),
                ...(canUpdate && canDelete
                  ? [
                      {
                        type: 'divider' as const,
                      },
                    ]
                  : []),
                ...(canDelete
                  ? [
                      {
                        key: 'delete',
                        icon: <DeleteOutlined />,
                        danger: true,
                        label: 'Eliminar contrato',
                      },
                    ]
                  : []),
              ];

              return (
                <Space direction="horizontal" size={4}>
                  {canUpdate && (
                    <>
                      <Tooltip title="Renovar">
                        <Button
                          type="text"
                          size="small"
                          icon={<ReloadOutlined style={{ color: '#059669' }} />}
                          onClick={() => handleOpenRenovar(r)}
                          style={{ borderRadius: 6 }}
                        />
                      </Tooltip>
                      <Tooltip title="Editar">
                        <Button
                          type="text"
                          size="small"
                          icon={<EditOutlined style={{ color: '#0284c7' }} />}
                          onClick={() => handleOpenEdit(r)}
                          style={{ borderRadius: 6 }}
                        />
                      </Tooltip>
                    </>
                  )}
                  {items.length > 0 && (
                    <Dropdown
                      menu={{
                        items,
                        onClick: ({ key }) => {
                          if (key === 'renovar') handleOpenRenovar(r);
                          else if (key === 'edit') handleOpenEdit(r);
                          else if (key === 'delete') handleDeleteContrato(r);
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
                  )}
                </Space>
              );
            },
          },
        ]
      : []),
  ];

  return (
    <ModulePageLayout
      title={
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          <span>Contratos & Alertas de Vencimiento</span>
        </span>
      }
      subtitle={currentTabConfig.description}
      wrapInTableCard={false}
      actionButton={
        <Space size="middle" wrap>
          <Input
            placeholder="Buscar por colaborador, código o cargo..."
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            allowClear
            style={{ width: 280, ...brandSearchStyle }}
          />
          {canCreate && (
            <BrandCreateButton onClick={handleOpenCreate}>
              Nuevo Contrato
            </BrandCreateButton>
          )}
        </Space>
      }
      extraHeader={
        <div style={{ backgroundColor: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '6px 16px 0 16px' }}>
          <Tabs
            activeKey={filterMode}
            onChange={(key) => {
              setFilterMode(key as ContratoTab);
              setSearchTerm('');
            }}
            items={TABS_CONFIG.map((t) => {
              const isPorVencer = t.key === 'por_vencer';
              const count = isPorVencer ? stats.porVencer : stats.total;
              const badgeColor = isPorVencer ? (count > 0 ? '#ea580c' : '#94a3b8') : '#0284c7';

              return {
                key: t.key,
                label: (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 6px' }}>
                    <span style={{ fontWeight: 600 }}>{t.label}</span>
                    <Badge
                      count={count}
                      style={{
                        backgroundColor: badgeColor,
                        boxShadow: 'none',
                        fontSize: 11,
                        borderRadius: 999,
                      }}
                    />
                  </span>
                ),
              };
            })}
          />
        </div>
      }
    >
      {/* Tabla Libre y Limpia */}
      <GlobalTable<ContratoItem>
        resourceName="personal-contratos"
        columns={columns}
        dataSource={contratosFiltrados}
        rowKey="id"
        loading={isLoading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
          showTotal: (total) => `Total: ${total} contratos`,
        }}
        locale={{ emptyText: 'No se encontraron contratos con los filtros seleccionados' }}
      />

      {/* Modal Nuevo / Editar Contrato */}
      <ContratoModal
        open={contratoModalOpen}
        onClose={() => setContratoModalOpen(false)}
        onSubmit={handleSaveContrato}
        loading={crearMutation.isPending || actualizarMutation.isPending}
        contrato={selectedContrato}
        personalList={personalList}
      />

      {/* Modal Renovar Contrato */}
      <RenovarContratoModal
        open={renovarModalOpen}
        onClose={() => {
          setRenovarModalOpen(false);
          setContratoParaRenovar(null);
        }}
        onSubmit={handleConfirmRenovar}
        loading={renovarMutation.isPending}
        contratoAnterior={contratoParaRenovar}
      />
    </ModulePageLayout>
  );
}
