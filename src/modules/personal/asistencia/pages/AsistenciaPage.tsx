import { useState, useMemo } from 'react';
import {
  Button,
  Tag,
  Space,
  Input,
  DatePicker,
  Tooltip,
  Popconfirm,
  type TableProps,
} from 'antd';
import {
  ClockCircleOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  MedicineBoxOutlined,
  TeamOutlined,
  CalendarOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { ModulePageLayout, BrandCreateButton, brandSearchStyle, brandControlStyle, renderTableFilterIcon } from '../../../../shared/components/ModulePageLayout';
import GlobalTable from '../../../../shared/components/GlobalTable';
import { usePermissions } from '../../../../shared/components/PermissionGuard';
import {
  useAsistenciaList,
  useRegistrarAsistencia,
  useActualizarAsistencia,
  useEliminarAsistencia,
  usePersonalList,
} from '../../hooks';
import type { RegistroAsistencia, EstadoAsistencia } from '../../types';
import { RegistrarAsistenciaModal } from '../components/RegistrarAsistenciaModal';

export default function AsistenciaPage() {
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission('personal.asistencia.create');
  const canUpdate = hasPermission('personal.asistencia.update');
  const canDelete = hasPermission('personal.asistencia.delete');

  const [filterEstado, setFilterEstado] = useState<string>('TODOS');
  const [fechaFiltro, setFechaFiltro] = useState<string | undefined>(dayjs().format('YYYY-MM-DD'));
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [registroAEditar, setRegistroAEditar] = useState<RegistroAsistencia | null>(null);

  const filtros = useMemo(() => {
    return {
      fecha: fechaFiltro,
      estado: filterEstado === 'TODOS' ? undefined : (filterEstado as EstadoAsistencia),
      search: search || undefined,
    };
  }, [fechaFiltro, filterEstado, search]);

  const { data: asistencias = [], isLoading } = useAsistenciaList(filtros);
  const { data: personalList = [] } = usePersonalList({ activo: true });
  const registrarMutation = useRegistrarAsistencia();
  const actualizarMutation = useActualizarAsistencia();
  const eliminarMutation = useEliminarAsistencia();

  // Métricas calculadas para la fecha seleccionada
  const stats = useMemo(() => {
    const total = asistencias.length;
    const presentes = asistencias.filter((a) => a.estado === 'PRESENTE').length;
    const tardanzas = asistencias.filter((a) => a.estado === 'TARDANZA').length;
    const faltas = asistencias.filter((a) => a.estado.includes('FALTA')).length;
    const puntualidad = total > 0 ? Math.round((presentes / total) * 100) : 100;
    return { total, presentes, tardanzas, faltas, puntualidad };
  }, [asistencias]);

  const handleNuevo = () => {
    setRegistroAEditar(null);
    setModalOpen(true);
  };

  const handleEditar = (record: RegistroAsistencia) => {
    setRegistroAEditar(record);
    setModalOpen(true);
  };

  const handleSubmitModal = async (data: any, colabInfo: any) => {
    if (registroAEditar) {
      await actualizarMutation.mutateAsync({ id: registroAEditar.id, data });
    } else {
      await registrarMutation.mutateAsync({ data, colabInfo });
    }
    setModalOpen(false);
    setRegistroAEditar(null);
  };

  const getEstadoBadge = (estado: EstadoAsistencia, minutos: number) => {
    switch (estado) {
      case 'PRESENTE':
        return (
          <Tag
            style={{
              backgroundColor: '#ecfdf5',
              borderColor: '#a7f3d0',
              color: '#059669',
              borderRadius: 999,
              fontWeight: 600,
              padding: '2px 12px',
              fontSize: 12,
            }}
            icon={<CheckCircleOutlined />}
          >
            Presente (Puntual)
          </Tag>
        );
      case 'TARDANZA':
        return (
          <Tag
            style={{
              backgroundColor: '#fffbeb',
              borderColor: '#fde68a',
              color: '#d97706',
              borderRadius: 999,
              fontWeight: 600,
              padding: '2px 12px',
              fontSize: 12,
            }}
            icon={<ClockCircleOutlined />}
          >
            Tardanza (+{minutos} min)
          </Tag>
        );
      case 'FALTA_JUSTIFICADA':
        return (
          <Tag
            style={{
              backgroundColor: '#f0fdfa',
              borderColor: '#99f6e4',
              color: '#0d9488',
              borderRadius: 999,
              fontWeight: 600,
              padding: '2px 12px',
              fontSize: 12,
            }}
            icon={<MedicineBoxOutlined />}
          >
            Falta Justificada
          </Tag>
        );
      case 'FALTA_INJUSTIFICADA':
        return (
          <Tag
            style={{
              backgroundColor: '#fff1f2',
              borderColor: '#fecdd3',
              color: '#e11d48',
              borderRadius: 999,
              fontWeight: 600,
              padding: '2px 12px',
              fontSize: 12,
            }}
            icon={<CloseCircleOutlined />}
          >
            Falta Injustificada
          </Tag>
        );
      case 'PERMISO_MEDICO':
        return (
          <Tag
            style={{
              backgroundColor: '#faf5ff',
              borderColor: '#e9d5ff',
              color: '#7c3aed',
              borderRadius: 999,
              fontWeight: 600,
              padding: '2px 12px',
              fontSize: 12,
            }}
          >
            Permiso
          </Tag>
        );
      case 'VACACIONES':
        return (
          <Tag
            style={{
              backgroundColor: '#eff6ff',
              borderColor: '#bfdbfe',
              color: '#2563eb',
              borderRadius: 999,
              fontWeight: 600,
              padding: '2px 12px',
              fontSize: 12,
            }}
          >
            En Vacaciones
          </Tag>
        );
      default:
        return <Tag style={{ borderRadius: 999 }}>{estado}</Tag>;
    }
  };

  const columns: TableProps<RegistroAsistencia>['columns'] = [
    {
      title: 'Colaborador',
      key: 'colab',
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0f172a' }}>{r.colaborador_nombre}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            {r.cargo} • Doc: {r.colaborador_documento || 'S/N'}
          </div>
        </div>
      ),
    },
    {
      title: 'Fecha & Sede',
      key: 'fecha_sede',
      render: (_, r) => (
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
            {dayjs(r.fecha).format('DD/MM/YYYY')}
          </div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{r.sede_nombre || 'Sede Principal'}</div>
        </div>
      ),
    },
    {
      title: 'Horario Registrado',
      key: 'horario',
      render: (_, r) => (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              padding: '3px 8px',
              fontSize: 12,
              color: '#334155',
            }}
          >
            <span style={{ color: '#64748b', marginRight: 4 }}>Ent:</span>
            <strong>{r.hora_entrada || '--:--'}</strong>
          </div>
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              padding: '3px 8px',
              fontSize: 12,
              color: '#334155',
            }}
          >
            <span style={{ color: '#64748b', marginRight: 4 }}>Sal:</span>
            <strong>{r.hora_salida || '--:--'}</strong>
          </div>
        </div>
      ),
    },
    {
      title: 'Condición / Estado',
      key: 'estado',
      align: 'center',
      filters: [
        { text: 'Presente', value: 'PRESENTE' },
        { text: 'Tardanza', value: 'TARDANZA' },
        { text: 'Falta Justificada / Licencia', value: 'FALTA_JUSTIFICADA' },
        { text: 'Falta Injustificada', value: 'FALTA_INJUSTIFICADA' },
      ],
      filteredValue: filterEstado !== 'TODOS' ? [filterEstado] : null,
      filterMultiple: false,
      filterIcon: (filtered) => renderTableFilterIcon(filtered),
      render: (_, r) => getEstadoBadge(r.estado, r.minutos_tardanza),
    },
    {
      title: 'Observación / Justificación',
      dataIndex: 'justificacion',
      key: 'justificacion',
      render: (j) =>
        j ? (
          <span style={{ fontSize: 12, color: '#475569', fontStyle: 'italic' }}>{j}</span>
        ) : (
          <span style={{ color: '#94a3b8' }}>-</span>
        ),
    },
    ...(canUpdate || canDelete
      ? [
          {
            title: 'Acciones',
            key: 'acciones',
            align: 'center' as const,
            width: 110,
            render: (_: any, r: RegistroAsistencia) => (
              <Space size="small">
                {canUpdate && (
                  <Tooltip title="Editar / Rectificar asistencia">
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined style={{ color: '#0284c7' }} />}
                      onClick={() => handleEditar(r)}
                      style={{ borderRadius: 6 }}
                    />
                  </Tooltip>
                )}
                {canDelete && (
                  <Popconfirm
                    title="¿Eliminar registro de asistencia?"
                    description="Esta acción eliminará el registro de marca seleccionado."
                    onConfirm={() => eliminarMutation.mutate(r.id)}
                    okText="Eliminar"
                    cancelText="Cancelar"
                    okButtonProps={{ danger: true }}
                  >
                    <Tooltip title="Eliminar registro">
                      <Button
                        type="text"
                        size="small"
                        icon={<DeleteOutlined style={{ color: '#ef4444' }} />}
                        style={{ borderRadius: 6 }}
                      />
                    </Tooltip>
                  </Popconfirm>
                )}
              </Space>
            ),
          },
        ]
      : []),
  ];

  return (
    <ModulePageLayout
      title={
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          <span>Control de Asistencia & Faltas</span>
        </span>
      }
      subtitle="Monitoreo de puntualidad, control horario de entradas y salidas, justificación de inasistencias y permisos"
      wrapInTableCard={false}
      actionButton={
        <Space size="middle" wrap>
          <Input
            placeholder="Buscar por colaborador o documento..."
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            style={{ width: 280, ...brandSearchStyle }}
          />
          {canCreate && (
            <BrandCreateButton onClick={handleNuevo}>
              Registrar Asistencia
            </BrandCreateButton>
          )}
        </Space>
      }
    >
      {/* Tarjetas interactivas de estadísticas y filtros de asistencia */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: 16,
          marginBottom: 20,
        }}
      >
        {/* Card Total */}
        <div
          onClick={() => setFilterEstado('TODOS')}
          style={{
            backgroundColor: '#ffffff',
            border: filterEstado === 'TODOS' ? '2px solid #0d9488' : '1px solid #e2e8f0',
            borderRadius: 14,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow:
              filterEstado === 'TODOS'
                ? '0 6px 18px rgba(13, 148, 136, 0.15)'
                : '0 2px 10px rgba(15, 23, 42, 0.03)',
            transform: filterEstado === 'TODOS' ? 'translateY(-2px)' : 'none',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: 'rgba(2, 132, 199, 0.1)',
              color: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
            }}
          >
            <TeamOutlined />
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
              {stats.total}
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, fontWeight: 500 }}>
              Total Asistencias
            </div>
          </div>
        </div>

        {/* Card Presentes */}
        <div
          onClick={() => setFilterEstado('PRESENTE')}
          style={{
            backgroundColor: '#ffffff',
            border: filterEstado === 'PRESENTE' ? '2px solid #059669' : '1px solid #e2e8f0',
            borderRadius: 14,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow:
              filterEstado === 'PRESENTE'
                ? '0 6px 18px rgba(5, 150, 105, 0.15)'
                : '0 2px 10px rgba(15, 23, 42, 0.03)',
            transform: filterEstado === 'PRESENTE' ? 'translateY(-2px)' : 'none',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: 'rgba(5, 150, 105, 0.1)',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
            }}
          >
            <CheckCircleOutlined />
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#059669', lineHeight: 1 }}>
              {stats.presentes}
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, fontWeight: 500 }}>
              Puntuales ({stats.puntualidad}%)
            </div>
          </div>
        </div>

        {/* Card Tardanzas */}
        <div
          onClick={() => setFilterEstado('TARDANZA')}
          style={{
            backgroundColor: '#ffffff',
            border: filterEstado === 'TARDANZA' ? '2px solid #d97706' : '1px solid #e2e8f0',
            borderRadius: 14,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow:
              filterEstado === 'TARDANZA'
                ? '0 6px 18px rgba(217, 119, 6, 0.15)'
                : '0 2px 10px rgba(15, 23, 42, 0.03)',
            transform: filterEstado === 'TARDANZA' ? 'translateY(-2px)' : 'none',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: 'rgba(217, 119, 6, 0.1)',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
            }}
          >
            <ClockCircleOutlined />
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#d97706', lineHeight: 1 }}>
              {stats.tardanzas}
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, fontWeight: 500 }}>
              Tardanzas
            </div>
          </div>
        </div>

        {/* Card Faltas */}
        <div
          onClick={() => setFilterEstado('FALTA_JUSTIFICADA')}
          style={{
            backgroundColor: '#ffffff',
            border: filterEstado === 'FALTA_JUSTIFICADA' ? '2px solid #e11d48' : '1px solid #e2e8f0',
            borderRadius: 14,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow:
              filterEstado === 'FALTA_JUSTIFICADA'
                ? '0 6px 18px rgba(225, 29, 72, 0.15)'
                : '0 2px 10px rgba(15, 23, 42, 0.03)',
            transform: filterEstado === 'FALTA_JUSTIFICADA' ? 'translateY(-2px)' : 'none',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: 'rgba(225, 29, 72, 0.1)',
              color: '#e11d48',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
            }}
          >
            <MedicineBoxOutlined />
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#e11d48', lineHeight: 1 }}>
              {stats.faltas}
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, fontWeight: 500 }}>
              Faltas / Licencias
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Fecha */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
          marginBottom: 16,
          backgroundColor: '#ffffff',
          padding: '12px 16px',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
        }}
      >
        <Space size={12} wrap>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <CalendarOutlined style={{ color: '#0d9488', fontSize: 16 }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>Fecha:</span>
          </div>

          <DatePicker
            value={fechaFiltro ? dayjs(fechaFiltro) : undefined}
            onChange={(d) => setFechaFiltro(d ? d.format('YYYY-MM-DD') : undefined)}
            format="DD/MM/YYYY"
            placeholder="Seleccionar fecha..."
            style={{ width: 150, ...brandControlStyle }}
          />

          <Button
            type="text"
            size="small"
            onClick={() => setFechaFiltro(dayjs().format('YYYY-MM-DD'))}
            style={{
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 12,
              color: '#0d9488',
              backgroundColor: '#f0fdfa',
              border: '1px solid #ccfbf1',
            }}
          >
            Hoy
          </Button>

          {fechaFiltro && (
            <Button
              type="text"
              size="small"
              onClick={() => setFechaFiltro(undefined)}
              style={{ borderRadius: 8, fontSize: 12, color: '#64748b' }}
            >
              Ver todo el historial
            </Button>
          )}
        </Space>
      </div>

      {/* Tabla Libre */}
      <GlobalTable<RegistroAsistencia>
        resourceName="personal-asistencia"
        columns={columns}
        dataSource={asistencias}
        rowKey="id"
        loading={isLoading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
          showTotal: (total) => `Total: ${total} registros`,
        }}
        locale={{ emptyText: 'No hay registros de asistencia para los filtros seleccionados' }}
        onChange={(_pagination, tableFilters) => {
          const est = tableFilters.estado;
          setFilterEstado(est && est.length > 0 ? (est[0] as string) : 'TODOS');
        }}
      />

      {/* Modal Registro / Edición */}
      <RegistrarAsistenciaModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setRegistroAEditar(null);
        }}
        onSubmit={handleSubmitModal}
        loading={registrarMutation.isPending || actualizarMutation.isPending}
        personalList={personalList}
        registro={registroAEditar}
      />
    </ModulePageLayout>
  );
}
