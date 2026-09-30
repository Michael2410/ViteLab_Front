import { useState, useEffect } from 'react';
import {
  Button,
  Space,
  Typography,
  Tag,
  Input,
  DatePicker,
  Tooltip,
  App,
} from 'antd';
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  WhatsAppOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';

import { useOrdenes, useEliminarOrden, useSedesActivas, useRecepcionarMuestra } from '../hooks';
import { useAuthStore } from '../../../auth/hooks';
import {
  EstadoOrden,
  ESTADO_ORDEN_COLORS,
  ESTADO_ORDEN_LABELS,
  type Orden,
  type OrdenFilters,
} from '../types';
import ModulePageLayout, { BrandCreateButton, brandSearchStyle, brandControlStyle, renderTableFilterIcon } from '../../../../shared/components/ModulePageLayout';
import { GlobalTable } from '../../../../shared/components/GlobalTable';
import { WhatsAppSendModal, useWhatsAppStatus } from '../../whatsapp';
import { CondicionesPreanaliticasModal } from '../components/CondicionesPreanaliticasModal';
import { NuevaOrdenDrawer } from '../components/NuevaOrdenDrawer';
import { EditarOrdenDrawer } from '../components/EditarOrdenDrawer';
import { OrdenDetalleDrawer } from '../components/OrdenDetalleDrawer';

const { Text } = Typography;
const { RangePicker } = DatePicker;

export const OrdenesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { modal } = App.useApp();
  const { hasPermission } = useAuthStore();
  const [filtros, setFiltros] = useState<OrdenFilters>({
    page: 1,
    limit: 10,
  });
  
  // Estado para Nueva Orden Drawer
  const [nuevaOrdenOpen, setNuevaOrdenOpen] = useState(false);

  // Estado para Detalle y Edición en Drawers laterales
  const [ordenDetalleId, setOrdenDetalleId] = useState<number | null>(null);
  const [ordenDetalleOpen, setOrdenDetalleOpen] = useState(false);
  const [ordenEditarId, setOrdenEditarId] = useState<number | null>(null);
  const [ordenEditarOpen, setOrdenEditarOpen] = useState(false);

  // Apertura automática si viene de /ordenes?nuevo=true o /ordenes?editar=:id
  useEffect(() => {
    const actionParam = searchParams.get('action');
    const nuevoParam = searchParams.get('nuevo');
    const editarParam = searchParams.get('editar');

    if (nuevoParam === 'true' || actionParam === 'nueva') {
      if (hasPermission('orders.create')) {
        setNuevaOrdenOpen(true);
      }
      searchParams.delete('nuevo');
      searchParams.delete('action');
      setSearchParams(searchParams, { replace: true });
    } else if (editarParam) {
      const idNum = Number(editarParam);
      if (!isNaN(idNum) && idNum > 0 && hasPermission('orders.update')) {
        setOrdenEditarId(idNum);
        setOrdenEditarOpen(true);
      }
      searchParams.delete('editar');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, hasPermission, setSearchParams]);

  // Estado para modal de WhatsApp
  const [whatsappModal, setWhatsappModal] = useState<{ open: boolean; orden: Orden | null }>({
    open: false,
    orden: null,
  });
  const [preanaliticaModal, setPreanaliticaModal] = useState<{ open: boolean; orden: Orden | null }>({
    open: false,
    orden: null,
  });
  const { data: whatsappStatus } = useWhatsAppStatus();

  const { data: ordenes, isLoading } = useOrdenes(filtros);
  const { data: sedes } = useSedesActivas();
  const eliminarOrdenMutation = useEliminarOrden();
  const recepcionarMuestraMutation = useRecepcionarMuestra();

  const handleNuevaOrdenSuccess = (nuevaOrden: Orden) => {
    queryClient.invalidateQueries({ queryKey: ['ordenes'] });
    modal.confirm({
      title: '¡Orden Creada Exitosamente!',
      icon: <CheckCircleOutlined style={{ color: '#10b981', fontSize: 22 }} />,
      content: (
        <div>
          <p style={{ fontSize: 14 }}>
            La orden <strong>#{nuevaOrden.numero_atencion}</strong> ha sido registrada con éxito en el sistema.
          </p>
          <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>
            ¿Desea ver el detalle de la orden o permanecer en el listado para continuar?
          </p>
        </div>
      ),
      okText: 'Ver Detalle de Orden',
      cancelText: 'Permanecer en Listado',
      okButtonProps: {
        style: {
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
          borderColor: '#0284c7',
        },
      },
      onOk: () => {
        navigate(`/ordenes/${nuevaOrden.id}`);
      },
    });
  };

  const handleFiltroChange = (key: keyof OrdenFilters, value: any) => {
    setFiltros((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset page cuando cambian filtros
    }));
  };

  const handleLimpiarFiltros = () => {
    setFiltros({
      page: 1,
      limit: 10,
    });
  };

  const handleEliminar = (record: Orden) => {
    modal.confirm({
      title: '¿Está seguro de eliminar esta orden?',
      content: `Se eliminará la orden ${record.numero_atencion}. Esta acción no se puede deshacer.`,
      okText: 'Eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      icon: <ExclamationCircleOutlined />,
      onOk: async () => {
        await eliminarOrdenMutation.mutateAsync(record.id);
      },
    });
  };

  const handleRecepcionarMuestra = (record: Orden) => {
    console.log('[RECEPCIONAR] Botón clickeado para orden:', record.id, record.numero_atencion);
    console.log('[RECEPCIONAR] Record completo:', record);
    
    modal.confirm({
      title: '¿Confirmar recepción de muestra?',
      content: `Se marcará la muestra de la orden ${record.numero_atencion} como recepcionada.`,
      okText: 'Confirmar',
      cancelText: 'Cancelar',
      icon: <ExclamationCircleOutlined style={{ color: '#1890ff' }} />,
      onOk: async () => {
        console.log('[RECEPCIONAR] Modal confirmado, llamando a mutateAsync...');
        try {
          const resultado = await recepcionarMuestraMutation.mutateAsync(record.id);
          console.log('[RECEPCIONAR] Mutación exitosa:', resultado);
        } catch (error) {
          console.error('[RECEPCIONAR] Error en mutación:', error);
        }
      },
    });
  };

  const handleTableChange = (pagination: any, tableFilters: any) => {
    setFiltros((prev) => ({
      ...prev,
      page: pagination.current || 1,
      limit: pagination.pageSize || prev.limit,
      estado: (tableFilters.estado?.[0] as EstadoOrden) || undefined,
      sede_id: tableFilters.sede?.[0] ? Number(tableFilters.sede[0]) : undefined,
    }));
  };

  const columns: ColumnsType<Orden> = [
    {
      title: 'N° Orden',
      dataIndex: 'numero_atencion',
      key: 'numero_atencion',
      width: 100,
      render: (numero: number) => <Text strong>{numero}</Text>,
    },
    {
      title: 'Fecha Registro',
      dataIndex: 'fecha_registro',
      key: 'fecha_registro',
      width: 140,
      filterDropdown: ({ confirm, clearFilters }) => (
        <div style={{ padding: 12, width: 290, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <RangePicker
            style={{ width: '100%', ...brandControlStyle }}
            format="DD/MM/YYYY"
            placeholder={['Desde', 'Hasta']}
            value={
              filtros.fecha_desde && filtros.fecha_hasta
                ? [dayjs(filtros.fecha_desde), dayjs(filtros.fecha_hasta)]
                : null
            }
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                handleFiltroChange('fecha_desde', dates[0].format('YYYY-MM-DD'));
                handleFiltroChange('fecha_hasta', dates[1].format('YYYY-MM-DD'));
              } else {
                handleFiltroChange('fecha_desde', undefined);
                handleFiltroChange('fecha_hasta', undefined);
              }
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            {(filtros.fecha_desde || filtros.fecha_hasta) && (
              <Button
                size="small"
                onClick={() => {
                  handleFiltroChange('fecha_desde', undefined);
                  handleFiltroChange('fecha_hasta', undefined);
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
              style={{ backgroundColor: '#0284c7' }}
            >
              Aplicar
            </Button>
          </div>
        </div>
      ),
      filterIcon: () => renderTableFilterIcon(Boolean(filtros.fecha_desde || filtros.fecha_hasta)),
      render: (fecha: string) => dayjs(fecha).format('DD/MM/YYYY'),
    },
    {
      title: 'Paciente',
      key: 'paciente',
      width: 280,
      render: (_, record: any) => (
        <div>
          <div>
            <Text strong>{record.paciente_nombres} {record.paciente_apellidos}</Text>
          </div>
          <Text type="secondary">DNI: {record.paciente_dni}</Text>
        </div>
      ),
    },
    {
      title: 'Tipo',
      dataIndex: 'tipo_paciente',
      key: 'tipo_paciente',
      width: 120,
      filters: [
        { text: 'Particular', value: 'PARTICULAR' },
        { text: 'Convenio', value: 'CONVENIO' },
      ],
      filterIcon: renderTableFilterIcon,
      onFilter: (value, record: Orden) => record.tipo_paciente === value,
      render: (tipo: string) => (
        <Tag color={tipo === 'CONVENIO' ? 'blue' : 'green'}>
          {tipo === 'CONVENIO' ? 'Convenio' : 'Particular'}
        </Tag>
      ),
    },
    {
      title: 'Convenio',
      dataIndex: 'convenio_nombre',
      key: 'convenio_nombre',
      width: 150,
      render: (nombre: string | null) => nombre || <Text type="secondary">-</Text>,
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      width: 140,
      filters: Object.values(EstadoOrden).map((estado) => ({
        text: ESTADO_ORDEN_LABELS[estado],
        value: estado,
      })),
      filterMultiple: false,
      filteredValue: filtros.estado ? [filtros.estado] : null,
      filterIcon: renderTableFilterIcon,
      render: (estado: EstadoOrden) => (
        <Tag color={ESTADO_ORDEN_COLORS[estado]}>{ESTADO_ORDEN_LABELS[estado]}</Tag>
      ),
    },
    {
      title: 'Sede',
      dataIndex: 'sede_id',
      key: 'sede',
      width: 150,
      filters: sedes?.map((s) => ({ text: s.nombre, value: s.id })),
      filterMultiple: false,
      filteredValue: filtros.sede_id ? [filtros.sede_id] : null,
      filterIcon: renderTableFilterIcon,
      render: (_, record: Orden) => record.sede_nombre || '-',
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      width: 100,
      align: 'right',
      render: (total: number) => <Text strong>S/ {total.toFixed(2)}</Text>,
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 140,
      render: (_, record) => (
        <Space size="small">
          {hasPermission('orders.read') && (
            <>
              <Tooltip title="Ver detalle">
                <Button
                  type="text"
                  size="small"
                  icon={<EyeOutlined style={{ color: '#0284c7' }} />}
                  onClick={() => {
                    setOrdenDetalleId(record.id);
                    setOrdenDetalleOpen(true);
                  }}
                  style={{ borderRadius: 6 }}
                />
              </Tooltip>
              <Tooltip title="Condiciones Pre-Analíticas (IA)">
                <Button
                  type="text"
                  size="small"
                  icon={<RobotOutlined style={{ color: '#7c3aed' }} />}
                  onClick={() => setPreanaliticaModal({ open: true, orden: record })}
                  style={{ borderRadius: 6 }}
                />
              </Tooltip>
            </>
          )}
          {hasPermission('orders.update') && (
            <Tooltip title="Editar orden">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined style={{ color: '#0284c7' }} />}
                onClick={() => {
                  setOrdenEditarId(record.id);
                  setOrdenEditarOpen(true);
                }}
                style={{ borderRadius: 6 }}
              />
            </Tooltip>
          )}
          {hasPermission('orders.read') && record.estado === EstadoOrden.REGISTRADA && (
            <Tooltip title="Recepcionar Muestra">
              <Button
                type="primary"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => handleRecepcionarMuestra(record)}
                style={{ height: 28, borderRadius: 6, fontSize: 12, padding: '0 10px' }}
              >
                Recepcionar
              </Button>
            </Tooltip>
          )}
          {/* Botón WhatsApp - solo si está aprobada o impreso */}
          {(record.estado === EstadoOrden.APROBADA || record.estado === EstadoOrden.IMPRESO) && (
            <Tooltip title={whatsappStatus?.isConnected ? 'Enviar por WhatsApp' : 'WhatsApp no conectado'}>
              <Button
                type="text"
                size="small"
                icon={<WhatsAppOutlined />}
                onClick={() => setWhatsappModal({ open: true, orden: record })}
                disabled={!whatsappStatus?.isConnected}
                style={{ color: whatsappStatus?.isConnected ? '#25D366' : undefined, borderRadius: 6 }}
              />
            </Tooltip>
          )}
          {hasPermission('orders.delete') && (
            <Tooltip title="Eliminar">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleEliminar(record)}
                disabled={record.estado !== EstadoOrden.REGISTRADA}
                style={{ borderRadius: 6 }}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  const filtrosActivos = Object.keys(filtros).filter(
    (key) =>
      key !== 'page' &&
      key !== 'limit' &&
      filtros[key as keyof OrdenFilters] !== undefined &&
      filtros[key as keyof OrdenFilters] !== ''
  ).length;

  return (
    <ModulePageLayout
      title="Órdenes de Atención"
      subtitle="Recepción, trazabilidad preanalítica y gestión integral de órdenes de laboratorio"
      actionButton={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Buscar por nombre */}
          <Input
            placeholder="Buscar por paciente..."
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            allowClear
            value={filtros.paciente_nombre}
            onChange={(e) => handleFiltroChange('paciente_nombre', e.target.value)}
            style={{ width: 230, ...brandSearchStyle }}
          />

          {/* Buscar por DNI */}
          <Input
            placeholder="DNI..."
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            allowClear
            maxLength={8}
            value={filtros.paciente_dni}
            onChange={(e) => handleFiltroChange('paciente_dni', e.target.value)}
            style={{ width: 130, ...brandSearchStyle }}
          />
          {hasPermission('orders.create') && (
            <BrandCreateButton onClick={() => setNuevaOrdenOpen(true)}>
              Nueva Orden
            </BrandCreateButton>
          )}
        </div>
      }
    >
      <GlobalTable<Orden>
        columns={columns}
        dataSource={ordenes?.items || []}
        loading={isLoading}
        resourceName="órdenes"
        onChange={handleTableChange}
        pagination={{
          current: filtros.page,
          pageSize: filtros.limit,
          total: ordenes?.total || 0,
        }}
      />

      {/* Modal para enviar resultados por WhatsApp */}
      {whatsappModal.orden && (
        <WhatsAppSendModal
          open={whatsappModal.open}
          onClose={() => setWhatsappModal({ open: false, orden: null })}
          ordenId={whatsappModal.orden.id}
          numeroAtencion={whatsappModal.orden.numero_atencion?.toString() || ''}
          pacienteNombre={`${whatsappModal.orden.paciente_nombres || ''} ${whatsappModal.orden.paciente_apellidos || ''}`}
          telefonoPaciente={whatsappModal.orden.paciente_telefono || undefined}
        />
      )}

      {/* Modal de Condiciones Pre-Analíticas IA */}
      <CondicionesPreanaliticasModal
        open={preanaliticaModal.open}
        onClose={() => setPreanaliticaModal({ open: false, orden: null })}
        orden={preanaliticaModal.orden}
      />

      {/* Ventana Lateral Emergente: Nueva Orden */}
      <NuevaOrdenDrawer
        open={nuevaOrdenOpen}
        onClose={() => setNuevaOrdenOpen(false)}
        onSuccess={handleNuevaOrdenSuccess}
      />

      {/* Ventana Lateral Emergente: Detalle de Orden */}
      <OrdenDetalleDrawer
        open={ordenDetalleOpen}
        ordenId={ordenDetalleId}
        onClose={() => {
          setOrdenDetalleOpen(false);
          setOrdenDetalleId(null);
        }}
        onEditar={(id) => {
          setOrdenEditarId(id);
          setOrdenEditarOpen(true);
        }}
        onRecepcionar={(orden) => handleRecepcionarMuestra(orden)}
        onWhatsApp={(orden) => setWhatsappModal({ open: true, orden })}
      />

      {/* Ventana Lateral Emergente: Edición de Orden */}
      <EditarOrdenDrawer
        open={ordenEditarOpen}
        ordenId={ordenEditarId}
        onClose={() => {
          setOrdenEditarOpen(false);
          setOrdenEditarId(null);
        }}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['ordenes'] });
        }}
      />
    </ModulePageLayout>
  );

};
