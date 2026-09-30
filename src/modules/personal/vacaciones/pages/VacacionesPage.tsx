import { useState, useMemo } from 'react';
import {
  Button,
  Tag,
  Space,
  Tooltip,
  App,
  Input,
  Calendar,
  Drawer,
  Tabs,
  Badge,
  type TableProps,
} from 'antd';
import {
  CalendarOutlined,
  PlusOutlined,
  CheckOutlined,
  CloseOutlined,
  SearchOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  StopOutlined,
  LeftOutlined,
  RightOutlined,
  UserOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
dayjs.extend(isBetween);

import ModulePageLayout, { BrandCreateButton, brandSearchStyle, renderTableFilterIcon } from '../../../../shared/components/ModulePageLayout';
import GlobalTable from '../../../../shared/components/GlobalTable';
import { usePermissions } from '../../../../shared/components/PermissionGuard';
import {
  useVacacionesSolicitudes,
  useCrearSolicitudVacacion,
  useCambiarEstadoVacacion,
  usePersonalList,
} from '../../hooks';
import { useConfiguracion } from '../../../configuracion/sistema/hooks';
import type { SolicitudVacacion, SaldoVacacionalColaborador, Personal } from '../../types';
import { NuevaSolicitudModal } from '../components/NuevaSolicitudModal';

type VacacionTab = 'saldos' | 'solicitudes' | 'calendario';

interface TabConfig {
  key: VacacionTab;
  label: string;
  description: string;
}

const TABS_CONFIG: TabConfig[] = [
  {
    key: 'saldos',
    label: 'Saldos Vacacionales',
    description: 'Cálculo automatizado de días acumulados por ley, descansos gozados y saldos disponibles por colaborador.',
  },
  {
    key: 'solicitudes',
    label: 'Solicitudes & Aprobaciones',
    description: 'Bandeja de solicitudes vacacionales, estados de tramitación y evaluación de directores.',
  },
  {
    key: 'calendario',
    label: 'Calendario de Ausencias',
    description: 'Planificación visual mensual de descansos remunerados, distribución de turnos y cobertura de servicio.',
  },
];

export default function VacacionesPage() {
  const { modal } = App.useApp();
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission('personal.vacaciones.create');
  const canApprove = hasPermission('personal.vacaciones.approve');

  const [tab, setTab] = useState<VacacionTab>('saldos');
  const [estadoFilter, setEstadoFilter] = useState<string>('TODAS');
  const [search, setSearch] = useState('');

  const currentTabConfig = useMemo(
    () => TABS_CONFIG.find((t) => t.key === tab) || TABS_CONFIG[0],
    [tab]
  );

  // Navegación del Calendario
  const [calendarValue, setCalendarValue] = useState<Dayjs>(dayjs());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Dayjs | null>(null);
  const [drawerAusenciasOpen, setDrawerAusenciasOpen] = useState(false);

  // Modal de solicitud
  const [modalOpen, setModalOpen] = useState(false);
  const [colaboradorParaVacacion, setColaboradorParaVacacion] = useState<Personal | null>(null);
  const [saldoParaVacacion, setSaldoParaVacacion] = useState<number>(30);

  const { data: solicitudes = [], isLoading: loadingSolicitudes } = useVacacionesSolicitudes();
  const { data: personalList = [] } = usePersonalList({ activo: true });

  const crearMutation = useCrearSolicitudVacacion();
  const cambiarEstadoMutation = useCambiarEstadoVacacion();

  // Configuración del sistema (Régimen Laboral: GENERAL vs MYPE)
  const { data: configuracion } = useConfiguracion();
  const regimenLaboral = configuracion?.regimen_laboral || 'GENERAL';
  const esMype = regimenLaboral === 'MYPE';
  const factorMensual = esMype ? 1.25 : 2.5; // 15 días/año en MYPE, 30 días/año en General
  const maxCapDias = esMype ? 45 : 90; // hasta 3 periodos acumulados

  // Cálculo de saldos vacacionales por colaborador (Opción A: proporcional real por mes trabajado)
  const saldos: SaldoVacacionalColaborador[] = useMemo(() => {
    return personalList.map((p) => {
      if (!p.fecha_ingreso) {
        return {
          personal_id: p.id,
          colaborador_nombre: `${p.apellidos}, ${p.nombres}`,
          cargo: p.cargo || 'Sin cargo',
          area: p.area || 'General',
          fecha_ingreso: '-',
          anios_servicio: 0,
          dias_generados: 0,
          dias_gozados: 0,
          dias_pendientes: 0,
          dias_por_vencer: 0,
        };
      }

      const fechaIngreso = dayjs(p.fecha_ingreso);
      const mesesServicio = Math.max(0, dayjs().diff(fechaIngreso, 'month'));
      const aniosServicio = parseFloat((mesesServicio / 12).toFixed(1));

      // Opción A: Días proporcionales reales según meses trabajados
      const diasGenerados = Math.min(maxCapDias, Math.floor(mesesServicio * factorMensual));

      // Contar días gozados en solicitudes aprobadas/tomadas
      const gozados = solicitudes
        .filter((s) => s.personal_id === p.id && (s.estado === 'APROBADA' || s.estado === 'TOMADA'))
        .reduce((acc, curr) => acc + curr.dias_solicitados, 0);

      const pendientes = Math.max(0, diasGenerados - gozados);
      const limitePeriodo = esMype ? 15 : 30;

      return {
        personal_id: p.id,
        colaborador_nombre: `${p.apellidos}, ${p.nombres}`,
        cargo: p.cargo || 'Sin cargo',
        area: p.area || 'General',
        fecha_ingreso: p.fecha_ingreso,
        anios_servicio: aniosServicio,
        dias_generados: diasGenerados,
        dias_gozados: gozados,
        dias_pendientes: pendientes,
        dias_por_vencer: pendientes > limitePeriodo ? pendientes - limitePeriodo : 0,
      };
    });
  }, [personalList, solicitudes, factorMensual, maxCapDias, esMype]);

  // Mapa de saldo disponible por ID de personal
  const saldosMap = useMemo(() => {
    const map: Record<number, number> = {};
    saldos.forEach((s) => {
      map[s.personal_id] = s.dias_pendientes;
    });
    return map;
  }, [saldos]);

  // Solicitudes pendientes totales
  const solicitudesPendientesCount = useMemo(() => {
    return solicitudes.filter((s) => s.estado === 'PENDIENTE').length;
  }, [solicitudes]);

  // Filtrado de solicitudes
  const solicitudesFiltradas = useMemo(() => {
    return solicitudes.filter((s) => {
      const matchEstado = estadoFilter === 'TODAS' || s.estado === estadoFilter;
      const matchSearch =
        !search ||
        (s.colaborador_nombre && s.colaborador_nombre.toLowerCase().includes(search.toLowerCase())) ||
        (s.motivo && s.motivo.toLowerCase().includes(search.toLowerCase()));
      return matchEstado && matchSearch;
    });
  }, [solicitudes, estadoFilter, search]);

  // Filtrado de saldos
  const saldosFiltrados = useMemo(() => {
    if (!search) return saldos;
    const q = search.toLowerCase();
    return saldos.filter(
      (s) =>
        s.colaborador_nombre.toLowerCase().includes(q) ||
        s.cargo.toLowerCase().includes(q) ||
        s.area.toLowerCase().includes(q)
    );
  }, [saldos, search]);

  // Handlers para abrir el modal
  const handleOpenGlobal = () => {
    setColaboradorParaVacacion(null);
    setSaldoParaVacacion(30);
    setModalOpen(true);
  };

  const handleOpenForColaborador = (saldoItem: SaldoVacacionalColaborador) => {
    const colab = personalList.find((p) => p.id === saldoItem.personal_id) || null;
    setColaboradorParaVacacion(colab);
    setSaldoParaVacacion(saldoItem.dias_pendientes);
    setModalOpen(true);
  };

  const handleCrear = async (data: any, colabNombre: string, colabCargo: string) => {
    await crearMutation.mutateAsync({
      data,
      colaboradorNombre: colabNombre,
      colaboradorCargo: colabCargo,
    });
    setModalOpen(false);
  };

  const handleAprobar = (item: SolicitudVacacion) => {
    modal.confirm({
      title: 'Aprobar periodo vacacional',
      content: `¿Confirmas la aprobación del periodo (${item.dias_solicitados} días) para ${item.colaborador_nombre || 'el colaborador'}?`,
      okText: 'Aprobar',
      okType: 'primary',
      okButtonProps: { style: { backgroundColor: '#059669', borderColor: '#059669', borderRadius: 8 } },
      cancelText: 'Cancelar',
      centered: true,
      onOk: async () => {
        await cambiarEstadoMutation.mutateAsync({
          id: item.id,
          estado: 'APROBADA',
          observaciones: 'Aprobado conforme a programación de turnos',
        });
      },
    });
  };

  const handleRechazar = (item: SolicitudVacacion) => {
    let motivo = '';
    modal.confirm({
      title: 'Rechazar solicitud',
      content: (
        <div>
          <p>Indique el motivo del rechazo para {item.colaborador_nombre || 'el colaborador'}:</p>
          <Input.TextArea
            rows={2}
            placeholder="Motivo (necesidad de servicio, cruce de turnos...)"
            style={{ borderRadius: 8 }}
            onChange={(e) => {
              motivo = e.target.value;
            }}
          />
        </div>
      ),
      okText: 'Rechazar',
      okType: 'danger',
      okButtonProps: { style: { borderRadius: 8 } },
      cancelText: 'Cancelar',
      centered: true,
      onOk: async () => {
        await cambiarEstadoMutation.mutateAsync({
          id: item.id,
          estado: 'RECHAZADA',
          observaciones: motivo || 'Rechazado por necesidad de servicio',
        });
      },
    });
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'APROBADA':
        return (
          <Tag
            style={{
              backgroundColor: '#ecfdf5',
              borderColor: '#a7f3d0',
              color: '#059669',
              borderRadius: 999,
              fontWeight: 600,
              padding: '2px 10px',
            }}
            icon={<CheckCircleOutlined />}
          >
            Aprobada
          </Tag>
        );
      case 'PENDIENTE':
        return (
          <Tag
            style={{
              backgroundColor: '#fffbeb',
              borderColor: '#fde68a',
              color: '#d97706',
              borderRadius: 999,
              fontWeight: 600,
              padding: '2px 10px',
            }}
            icon={<ClockCircleOutlined />}
          >
            Pendiente
          </Tag>
        );
      case 'RECHAZADA':
        return (
          <Tag
            style={{
              backgroundColor: '#fff1f2',
              borderColor: '#fecdd3',
              color: '#e11d48',
              borderRadius: 999,
              fontWeight: 600,
              padding: '2px 10px',
            }}
            icon={<StopOutlined />}
          >
            Rechazada
          </Tag>
        );
      case 'TOMADA':
        return (
          <Tag
            style={{
              backgroundColor: '#eff6ff',
              borderColor: '#bfdbfe',
              color: '#2563eb',
              borderRadius: 999,
              fontWeight: 600,
              padding: '2px 10px',
            }}
          >
            Gozada / En curso
          </Tag>
        );
      default:
        return <Tag style={{ borderRadius: 999 }}>{estado}</Tag>;
    }
  };

  // Obtener colaboradores ausentes en una fecha dada
  const getAusenciasEnFecha = (fecha: Dayjs) => {
    return solicitudes.filter((s) => {
      if (s.estado !== 'APROBADA' && s.estado !== 'TOMADA') return false;
      return fecha.isBetween(dayjs(s.fecha_inicio), dayjs(s.fecha_fin), 'day', '[]');
    });
  };

  // Renderizador de celdas en el Calendario Mensual
  const dateCellRender = (current: Dayjs) => {
    const vacacionesDelDia = getAusenciasEnFecha(current);
    if (vacacionesDelDia.length === 0) return null;

    const maxItems = 2;
    const itemsToShow = vacacionesDelDia.slice(0, maxItems);
    const remaining = vacacionesDelDia.length - maxItems;

    return (
      <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {itemsToShow.map((v) => {
          const nombreColab = v.colaborador_nombre || 'Colaborador';
          const primerNombre = nombreColab.split(',')[0];

          return (
            <Tooltip
              key={v.id}
              title={
                <div style={{ fontSize: 12, padding: 2 }}>
                  <div style={{ fontWeight: 700, color: '#34d399' }}>{nombreColab}</div>
                  <div style={{ fontSize: 11, opacity: 0.9 }}>{v.colaborador_cargo || 'Sin cargo'}</div>
                  <div style={{ marginTop: 4, fontSize: 11 }}>
                    <strong>Periodo:</strong> {dayjs(v.fecha_inicio).format('DD/MM')} - {dayjs(v.fecha_fin).format('DD/MM/YYYY')}
                  </div>
                  <div style={{ fontSize: 11 }}>
                    <strong>Días:</strong> {v.dias_solicitados} días
                  </div>
                  {v.motivo && (
                    <div style={{ fontSize: 10.5, fontStyle: 'italic', marginTop: 2, color: '#cbd5e1' }}>
                      "{v.motivo}"
                    </div>
                  )}
                </div>
              }
            >
              <div
                style={{
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderLeft: '3px solid #10b981',
                  borderRadius: 6,
                  padding: '2px 6px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#15803d',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                }}
              >
                <UserOutlined style={{ fontSize: 10, color: '#10b981' }} />
                <span>{primerNombre}</span>
              </div>
            </Tooltip>
          );
        })}

        {remaining > 0 && (
          <div
            style={{
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: 6,
              padding: '1px 6px',
              fontSize: 10,
              fontWeight: 700,
              color: '#047857',
              textAlign: 'center',
            }}
          >
            +{remaining} más
          </div>
        )}
      </div>
    );
  };

  // Columnas Saldos Vacacionales
  const columnsSaldos: TableProps<SaldoVacacionalColaborador>['columns'] = [
    {
      title: 'Colaborador',
      key: 'colab',
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0f172a' }}>{r.colaborador_nombre}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{r.cargo} • {r.area}</div>
        </div>
      ),
    },
    {
      title: 'Ingreso & Antigüedad',
      key: 'ingreso',
      render: (_, r) => (
        <div style={{ fontSize: 12, color: '#334155' }}>
          <div>Ingreso: {r.fecha_ingreso !== '-' ? dayjs(r.fecha_ingreso).format('DD/MM/YYYY') : '-'}</div>
          <div style={{ color: '#64748b' }}>{r.anios_servicio} año(s) de servicio</div>
        </div>
      ),
    },
    {
      title: 'Días Generados',
      dataIndex: 'dias_generados',
      key: 'generados',
      align: 'center',
      render: (v) => (
        <span
          style={{
            backgroundColor: '#eff6ff',
            color: '#1d4ed8',
            border: '1px solid #bfdbfe',
            borderRadius: 999,
            padding: '2px 10px',
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {v} días
        </span>
      ),
    },
    {
      title: 'Días Gozados',
      dataIndex: 'dias_gozados',
      key: 'gozados',
      align: 'center',
      render: (v) => (
        <span
          style={{
            backgroundColor: '#f8fafc',
            color: '#64748b',
            border: '1px solid #e2e8f0',
            borderRadius: 999,
            padding: '2px 10px',
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          {v} días
        </span>
      ),
    },
    {
      title: 'Saldo Disponible',
      dataIndex: 'dias_pendientes',
      key: 'pendientes',
      align: 'center',
      render: (v) => (
        <span
          style={{
            backgroundColor: v > 15 ? '#fffbeb' : '#ecfdf5',
            color: v > 15 ? '#b45309' : '#047857',
            border: v > 15 ? '1px solid #fde68a' : '1px solid #a7f3d0',
            fontWeight: 700,
            fontSize: 12,
            padding: '3px 12px',
            borderRadius: 999,
            display: 'inline-block',
          }}
        >
          {v} días libres
        </span>
      ),
    },
    ...(canCreate
      ? [
          {
            title: 'Acción',
            key: 'accion',
            align: 'center' as const,
            width: 140,
            render: (_: any, r: SaldoVacacionalColaborador) => (
              <Button
                type="text"
                size="small"
                icon={<CalendarOutlined style={{ color: '#0d9488' }} />}
                onClick={() => handleOpenForColaborador(r)}
                style={{
                  backgroundColor: '#f0fdfa',
                  border: '1px solid #ccfbf1',
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 12,
                  color: '#0f766e',
                  padding: '0 12px',
                  height: 30,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                Programar
              </Button>
            ),
          },
        ]
      : []),
  ];

  // Columnas Solicitudes Vacacionales
  const columnsSolicitudes: TableProps<SolicitudVacacion>['columns'] = [
    {
      title: 'Colaborador',
      key: 'colaborador',
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0f172a' }}>{r.colaborador_nombre}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{r.colaborador_cargo}</div>
        </div>
      ),
    },
    {
      title: 'Periodo Vacacional',
      key: 'periodo',
      render: (_, r) => (
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
            {dayjs(r.fecha_inicio).format('DD/MM/YYYY')} al {dayjs(r.fecha_fin).format('DD/MM/YYYY')}
          </div>
          <div style={{ fontSize: 12, color: '#0d9488' }}>
            <strong>{r.dias_solicitados}</strong> días calendario
          </div>
        </div>
      ),
    },
    {
      title: 'Motivo / Detalle',
      dataIndex: 'motivo',
      key: 'motivo',
      render: (m) => <span style={{ color: '#475569', fontSize: 12 }}>{m || 'Vacaciones de ley'}</span>,
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      align: 'center',
      filters: [
        { text: 'Pendiente', value: 'PENDIENTE' },
        { text: 'Aprobada', value: 'APROBADA' },
        { text: 'Rechazada', value: 'RECHAZADA' },
        { text: 'Gozada / En curso', value: 'TOMADA' },
      ],
      filteredValue: estadoFilter !== 'TODAS' ? [estadoFilter] : null,
      filterMultiple: false,
      filterIcon: (filtered) => renderTableFilterIcon(filtered),
      render: (e) => getEstadoBadge(e),
    },
    {
      title: 'Resolución / Aprobador',
      key: 'aprobador',
      render: (_, r) =>
        r.aprobado_por_nombre ? (
          <div style={{ fontSize: 11.5, color: '#64748b' }}>
            <div>Por: {r.aprobado_por_nombre}</div>
            {r.fecha_aprobacion && <div>El: {dayjs(r.fecha_aprobacion).format('DD/MM/YYYY')}</div>}
            {r.observaciones_aprobador && (
              <div style={{ fontStyle: 'italic', color: '#475569', marginTop: 2 }}>
                "{r.observaciones_aprobador}"
              </div>
            )}
          </div>
        ) : (
          <span style={{ color: '#94a3b8', fontSize: 12 }}>Pendiente de evaluación</span>
        ),
    },
    ...(canApprove
      ? [
          {
            title: 'Acciones',
            key: 'acciones',
            align: 'center' as const,
            width: 110,
            render: (_: any, r: SolicitudVacacion) =>
              r.estado === 'PENDIENTE' ? (
                <Space size={8}>
                  <Tooltip title="Aprobar solicitud vacacional">
                    <Button
                      type="text"
                      size="small"
                      icon={<CheckOutlined style={{ color: '#059669', fontSize: 13 }} />}
                      style={{
                        backgroundColor: '#ecfdf5',
                        border: '1px solid #a7f3d0',
                        borderRadius: 8,
                        height: 32,
                        width: 32,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      onClick={() => handleAprobar(r)}
                    />
                  </Tooltip>
                  <Tooltip title="Rechazar solicitud">
                    <Button
                      type="text"
                      size="small"
                      icon={<CloseOutlined style={{ color: '#e11d48', fontSize: 13 }} />}
                      style={{
                        backgroundColor: '#fff1f2',
                        border: '1px solid #fecdd3',
                        borderRadius: 8,
                        height: 32,
                        width: 32,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      onClick={() => handleRechazar(r)}
                    />
                  </Tooltip>
                </Space>
              ) : (
                <span style={{ fontSize: 12, color: '#94a3b8' }}>Procesada</span>
              ),
          },
        ]
      : []),
  ];

  // Métricas del mes en el Calendario
  const statsMesCalendario = useMemo(() => {
    const mesActual = calendarValue.format('YYYY-MM');
    const ausenciasMes = solicitudes.filter((s) => {
      if (s.estado !== 'APROBADA' && s.estado !== 'TOMADA') return false;
      return (
        s.fecha_inicio.startsWith(mesActual) ||
        s.fecha_fin.startsWith(mesActual) ||
        dayjs(mesActual + '-01').isBetween(dayjs(s.fecha_inicio), dayjs(s.fecha_fin), 'day', '[]')
      );
    });

    const colaboradoresIds = new Set(ausenciasMes.map((a) => a.personal_id));
    const diasTotales = ausenciasMes.reduce((acc, curr) => acc + curr.dias_solicitados, 0);

    return {
      totalColaboradores: colaboradoresIds.size,
      diasTotales,
      periodosCount: ausenciasMes.length,
    };
  }, [calendarValue, solicitudes]);

  return (
    <ModulePageLayout
      title={
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          <span>Control & Programación de Vacaciones</span>
        </span>
      }
      subtitle={currentTabConfig.description}
      wrapInTableCard={false}
      actionButton={
        <Space size="middle" wrap>
          {tab !== 'calendario' && (
            <Input
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              placeholder={
                tab === 'saldos'
                  ? 'Buscar colaborador, cargo o área...'
                  : 'Buscar por colaborador o motivo...'
              }
              allowClear
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 280, ...brandSearchStyle }}
            />
          )}
          {canCreate && (
            <BrandCreateButton onClick={handleOpenGlobal}>
              Programar Vacaciones
            </BrandCreateButton>
          )}
        </Space>
      }
      extraHeader={
        <div style={{ backgroundColor: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '6px 16px 0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <Tabs
            activeKey={tab}
            onChange={(key) => {
              setTab(key as VacacionTab);
              setSearch('');
            }}
            items={TABS_CONFIG.map((t) => ({
              key: t.key,
              label: (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 6px' }}>
                  <span style={{ fontWeight: 600 }}>{t.label}</span>
                  {t.key === 'solicitudes' && (
                    <Badge
                      count={solicitudesPendientesCount > 0 ? solicitudesPendientesCount : solicitudes.length}
                      style={{
                        backgroundColor: solicitudesPendientesCount > 0 ? '#f59e0b' : '#94a3b8',
                        boxShadow: 'none',
                        fontSize: 11,
                        borderRadius: 999,
                      }}
                    />
                  )}
                </span>
              ),
            }))}
          />
          {tab === 'saldos' && (
            <Tag
              color={esMype ? 'purple' : 'blue'}
              style={{
                borderRadius: 6,
                fontWeight: 600,
                padding: '2px 10px',
                fontSize: 12,
                marginBottom: 10,
              }}
            >
              {esMype ? 'Régimen MYPE (15 días/año)' : 'Régimen General (30 días/año)'}
            </Tag>
          )}
        </div>
      }
    >
      {/* Contenido según pestaña */}
      {tab === 'saldos' && (
        <GlobalTable<SaldoVacacionalColaborador>
          resourceName="vacaciones-saldos"
          columns={columnsSaldos}
          dataSource={saldosFiltrados}
          rowKey="personal_id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            showTotal: (total) => `Total: ${total} colaboradores`,
          }}
          locale={{ emptyText: 'No hay colaboradores disponibles' }}
        />
      )}

      {tab === 'solicitudes' && (
        <GlobalTable<SolicitudVacacion>
          resourceName="vacaciones-solicitudes"
          columns={columnsSolicitudes}
          dataSource={solicitudesFiltradas}
          rowKey="id"
          loading={loadingSolicitudes}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            showTotal: (total) => `Total: ${total} solicitudes`,
          }}
          locale={{ emptyText: 'No hay solicitudes vacacionales registradas' }}
          onChange={(_pagination, tableFilters) => {
            const est = tableFilters.estado;
            setEstadoFilter(est && est.length > 0 ? (est[0] as string) : 'TODAS');
          }}
        />
      )}

      {/* Calendario con Diseño Premium */}
      {tab === 'calendario' && (
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 16,
            padding: 24,
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)',
          }}
        >
          {/* Header Superior del Calendario */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 16,
              paddingBottom: 20,
              marginBottom: 16,
              borderBottom: '1px solid #f1f5f9',
            }}
          >
            {/* Título del Mes y Navegación */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: 'rgba(13, 148, 136, 0.1)',
                  color: '#0d9488',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                }}
              >
                <CalendarOutlined />
              </div>
              <div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: '#0f172a',
                    textTransform: 'capitalize',
                    lineHeight: 1.2,
                  }}
                >
                  {calendarValue.format('MMMM YYYY')}
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  Programación y distribución de ausencias del laboratorio
                </div>
              </div>

              {/* Botones de Navegación de Mes */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 12 }}>
                <Button
                  type="text"
                  icon={<LeftOutlined style={{ fontSize: 12 }} />}
                  onClick={() => setCalendarValue(calendarValue.subtract(1, 'month'))}
                  style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                />
                <Button
                  type="text"
                  onClick={() => setCalendarValue(dayjs())}
                  style={{
                    backgroundColor: '#f0fdfa',
                    border: '1px solid #ccfbf1',
                    color: '#0f766e',
                    borderRadius: 8,
                    fontWeight: 600,
                    fontSize: 12,
                    height: 32,
                    padding: '0 12px',
                  }}
                >
                  Hoy
                </Button>
                <Button
                  type="text"
                  icon={<RightOutlined style={{ fontSize: 12 }} />}
                  onClick={() => setCalendarValue(calendarValue.add(1, 'month'))}
                  style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                />
              </div>
            </div>

            {/* Métricas y Leyenda */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              {/* Badges de Resumen del Mes */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  padding: '6px 14px',
                }}
              >
                <div style={{ fontSize: 12, color: '#475569' }}>
                  <strong style={{ color: '#0d9488', fontSize: 14 }}>
                    {statsMesCalendario.totalColaboradores}
                  </strong>{' '}
                  colaborador(es) en descanso
                </div>
                <div style={{ width: 1, height: 16, backgroundColor: '#cbd5e1' }} />
                <div style={{ fontSize: 12, color: '#475569' }}>
                  <strong style={{ color: '#0284c7', fontSize: 14 }}>
                    {statsMesCalendario.diasTotales}
                  </strong>{' '}
                  días programados
                </div>
              </div>

              {/* Leyenda Visual */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 11.5,
                    color: '#15803d',
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    padding: '3px 9px',
                    borderRadius: 999,
                    fontWeight: 600,
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      backgroundColor: '#10b981',
                    }}
                  />
                  Vacaciones Aprobadas
                </span>
              </div>
            </div>
          </div>

          {/* Componente Calendar estilizado */}
          <div className="vitelab-vacaciones-calendar">
            <Calendar
              value={calendarValue}
              onSelect={(date) => {
                setCalendarValue(date);
                const ausencias = getAusenciasEnFecha(date);
                if (ausencias.length > 0) {
                  setSelectedCalendarDate(date);
                  setDrawerAusenciasOpen(true);
                }
              }}
              cellRender={dateCellRender}
              headerRender={() => null} // Ocultar el header por defecto para usar nuestro header personalizado
            />
          </div>
        </div>
      )}

      {/* Drawer Informativo al hacer click en un día con ausencias */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CalendarOutlined style={{ color: '#0d9488', fontSize: 18 }} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                Ausencias del {selectedCalendarDate?.format('DD [de] MMMM, YYYY')}
              </div>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                Detalle de colaboradores con vacaciones programadas en esta fecha
              </div>
            </div>
          </div>
        }
        open={drawerAusenciasOpen}
        onClose={() => setDrawerAusenciasOpen(false)}
        width={420}
      >
        {selectedCalendarDate && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {getAusenciasEnFecha(selectedCalendarDate).map((v) => (
              <div
                key={v.id}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: 16,
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>
                      {v.colaborador_nombre || 'Colaborador'}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{v.colaborador_cargo || 'Sin cargo'}</div>
                  </div>
                  {getEstadoBadge(v.estado)}
                </div>

                <div
                  style={{
                    backgroundColor: '#f8fafc',
                    borderRadius: 8,
                    padding: '8px 12px',
                    fontSize: 12,
                    color: '#334155',
                    marginBottom: 8,
                  }}
                >
                  <div>
                    <strong>Periodo:</strong> {dayjs(v.fecha_inicio).format('DD/MM/YYYY')} al{' '}
                    {dayjs(v.fecha_fin).format('DD/MM/YYYY')}
                  </div>
                  <div style={{ color: '#0d9488', fontWeight: 600, marginTop: 2 }}>
                    {v.dias_solicitados} días de descanso
                  </div>
                </div>

                {v.motivo && (
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    <strong>Motivo:</strong> {v.motivo}
                  </div>
                )}
              </div>
            ))}

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setDrawerAusenciasOpen(false);
                handleOpenGlobal();
              }}
              style={{
                marginTop: 10,
                background: 'linear-gradient(135deg, #0d9488 0%, #059669 100%)',
                border: 'none',
                borderRadius: 10,
                fontWeight: 600,
                height: 40,
              }}
            >
              Programar otra vacación
            </Button>
          </div>
        )}
      </Drawer>

      {/* Modal Nueva Solicitud con calendario interactivo y detección de cruces */}
      <NuevaSolicitudModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setColaboradorParaVacacion(null);
        }}
        onSubmit={handleCrear}
        personalList={personalList}
        colaboradorFijo={colaboradorParaVacacion}
        saldoDisponibleFijo={saldoParaVacacion}
        saldosMap={saldosMap}
        solicitudesExistentes={solicitudes}
        loading={crearMutation.isPending}
      />
    </ModulePageLayout>
  );
}
