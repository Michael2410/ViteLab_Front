import React, { useEffect, useState } from 'react';
import {
  Drawer,
  Tabs,
  Tag,
  Avatar,
  Card,
  Descriptions,
  Button,
  Timeline,
  Space,
  Empty,
  Spin,
  Alert,
  message,
} from 'antd';
import {
  UserOutlined,
  AuditOutlined,
  FileProtectOutlined,
  CalendarOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  ReloadOutlined,
  PrinterOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Personal, HistorialLaboralItem, ContratoItem, SolicitudVacacion } from '../../types';
import { personalHistorialApi, personalContratosApi, personalVacacionesApi, personalDocumentosApi } from '../../api';
import { VistaPreviaDocumentoModal } from '../../documentos/components/VistaPreviaDocumentoModal';
import { RenovarContratoModal } from '../../contratos/components/RenovarContratoModal';
import { ContratoModal } from '../../contratos/components/ContratoModal';
import { NuevaSolicitudModal } from '../../vacaciones/components/NuevaSolicitudModal';
import { useConfiguracion } from '../../../configuracion/sistema/hooks';

interface ExpedienteColaboradorDrawerProps {
  open: boolean;
  onClose: () => void;
  colaborador: Personal | null;
  onRefreshColaborador?: () => void;
}

export const ExpedienteColaboradorDrawer: React.FC<ExpedienteColaboradorDrawerProps> = ({
  open,
  onClose,
  colaborador,
  onRefreshColaborador,
}) => {
  const [activeTab, setActiveTab] = useState('info');
  const [loading, setLoading] = useState(false);

  // Datos específicos del colaborador
  const [historial, setHistorial] = useState<HistorialLaboralItem[]>([]);
  const [contratos, setContratos] = useState<ContratoItem[]>([]);
  const [solicitudesVacaciones, setSolicitudesVacaciones] = useState<SolicitudVacacion[]>([]);

  // Sub-modales
  const [docVistaOpen, setDocVistaOpen] = useState(false);
  const [docGenerado, setDocGenerado] = useState<any>(null);

  const [renovarModalOpen, setRenovarModalOpen] = useState(false);
  const [contratoParaRenovar, setContratoParaRenovar] = useState<ContratoItem | null>(null);

  const [vacacionModalOpen, setVacacionModalOpen] = useState(false);
  const [crearContratoModalOpen, setCrearContratoModalOpen] = useState(false);
  const [creandoContrato, setCreandoContrato] = useState(false);

  useEffect(() => {
    if (open && colaborador?.id) {
      cargarDatosExpediente(colaborador.id);
    }
  }, [open, colaborador?.id]);

  const cargarDatosExpediente = async (id: number) => {
    setLoading(true);
    try {
      const [histData, contData, vacData] = await Promise.all([
        personalHistorialApi.getByPersonalId(id).catch(() => []),
        personalContratosApi.getByPersonalId(id).catch(() => []),
        personalVacacionesApi.getSolicitudes().catch(() => []),
      ]);
      setHistorial(histData || []);
      setContratos(contData || []);
      setSolicitudesVacaciones(vacData.filter((v: any) => v.personal_id === id) || []);
    } catch (err) {
      console.error('Error al cargar expediente:', err);
    } finally {
      setLoading(false);
    }
  };

  // Configuración del sistema (Régimen Laboral MYPE vs GENERAL)
  const { data: configuracion } = useConfiguracion();
  const esMype = configuracion?.regimen_laboral === 'MYPE';
  const factorMensual = esMype ? 1.25 : 2.5;
  const maxCap = esMype ? 45 : 90;

  // Cálculo de vacaciones para este colaborador (Opción A: proporcional real por mes trabajado)
  const saldoVacacional = React.useMemo(() => {
    if (!colaborador || !colaborador.fecha_ingreso) {
      return { generados: 0, gozados: 0, disponibles: 0 };
    }
    const fechaIngreso = dayjs(colaborador.fecha_ingreso);
    const meses = Math.max(0, dayjs().diff(fechaIngreso, 'month'));
    const generados = Math.min(maxCap, Math.floor(meses * factorMensual));
    const gozados = solicitudesVacaciones
      .filter((s) => s.estado === 'APROBADA' || s.estado === 'TOMADA')
      .reduce((acc, curr) => acc + curr.dias_solicitados, 0);
    const disponibles = Math.max(0, generados - gozados);
    return { generados, gozados, disponibles };
  }, [colaborador, solicitudesVacaciones, factorMensual, maxCap]);

  // Contrato vigente
  const contratoVigente = contratos.find((c) => c.estado === 'VIGENTE' || c.estado === 'POR_VENCER');

  const handleEmitirConstanciaRapida = async () => {
    if (!colaborador) return;
    try {
      const nuevoDoc = await personalDocumentosApi.generar(
        {
          personal_id: colaborador.id,
          tipo_documento: 'CONSTANCIA_TRABAJO',
          destinatario: 'A quien corresponda',
          incluir_remuneracion: true,
        },
        {
          nombre: `${colaborador.nombres} ${colaborador.apellidos}`,
          documento: `${colaborador.tipo_documento} Nº ${colaborador.numero_documento || 'S/N'}`,
          cargo: colaborador.cargo || 'Colaborador',
          sueldo: colaborador.sueldo_base,
        }
      );
      setDocGenerado(nuevoDoc);
      setDocVistaOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmRenovar = async (contratoAnteriorId: number, data: any) => {
    await personalContratosApi.renovar(contratoAnteriorId, data);
    setRenovarModalOpen(false);
    if (colaborador?.id) cargarDatosExpediente(colaborador.id);
    onRefreshColaborador?.();
  };

  const handleCrearPrimerContrato = async (data: any) => {
    if (!colaborador) return;
    setCreandoContrato(true);
    try {
      await personalContratosApi.create(colaborador.id, data);
      message.success('Primer contrato laboral registrado con éxito');
      setCrearContratoModalOpen(false);
      cargarDatosExpediente(colaborador.id);
      onRefreshColaborador?.();
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Error al registrar el contrato');
    } finally {
      setCreandoContrato(false);
    }
  };

  const handleConfirmVacaciones = async (data: any, colabNombre: string, colabCargo: string) => {
    await personalVacacionesApi.crearSolicitud(data, colabNombre, colabCargo);
    setVacacionModalOpen(false);
    if (colaborador?.id) cargarDatosExpediente(colaborador.id);
  };

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <UserOutlined style={{ fontSize: 20, color: '#0d9488' }} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
              Expediente Digital del Colaborador
            </div>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 400 }}>
              Ficha 360º: Datos, Historial, Contrato, Vacaciones y Documentación
            </div>
          </div>
        </div>
      }
      placement="right"
      width={680}
      open={open}
      onClose={onClose}
      styles={{
        body: { padding: '16px 24px', backgroundColor: '#f8fafc' },
      }}
    >
      {colaborador && (
        <Card
          size="small"
          style={{
            marginBottom: 16,
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Avatar
              size={56}
              style={{
                backgroundColor: colaborador.activo ? '#0d9488' : '#64748b',
                fontWeight: 700,
                fontSize: 20,
              }}
            >
              {colaborador.nombres?.[0]}
              {colaborador.apellidos?.[0]}
            </Avatar>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>
                  {colaborador.apellidos}, {colaborador.nombres}
                </span>
                <Tag color={colaborador.activo ? 'green' : 'red'}>
                  {colaborador.activo ? 'Activo' : 'Cesado'}
                </Tag>
                {colaborador.usuario ? (
                  <Tag color="cyan">Usuario: {colaborador.usuario.username}</Tag>
                ) : (
                  <Tag color="default">Sin acceso al sistema</Tag>
                )}
              </div>
              <div style={{ fontSize: 13, color: '#475569', marginTop: 2 }}>
                {colaborador.cargo || 'Sin cargo'} • {colaborador.area || 'General'}
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                Doc: {colaborador.tipo_documento} {colaborador.numero_documento || 'S/N'} • Tel: {colaborador.telefono || '-'}
              </div>
            </div>
          </div>
        </Card>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 12, color: '#64748b' }}>Cargando expediente...</div>
        </div>
      ) : (
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'info',
              label: (
                <span>
                  <UserOutlined /> Ficha Laboral
                </span>
              ),
              children: colaborador && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <Card size="small" title="Información Contractual & Puesto" style={{ borderRadius: 8 }}>
                    <Descriptions column={2} size="small" bordered>
                      <Descriptions.Item label="Cargo">{colaborador.cargo || '-'}</Descriptions.Item>
                      <Descriptions.Item label="Área">{colaborador.area || '-'}</Descriptions.Item>
                      <Descriptions.Item label="Modalidad">{colaborador.tipo_contrato || 'General'}</Descriptions.Item>
                      <Descriptions.Item label="Sueldo Base">
                        {colaborador.sueldo_base ? `S/ ${Number(colaborador.sueldo_base).toFixed(2)}` : '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Fecha Ingreso">
                        {colaborador.fecha_ingreso ? dayjs(colaborador.fecha_ingreso).format('DD/MM/YYYY') : '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Colegiatura">{colaborador.colegiatura || 'N/A'}</Descriptions.Item>
                    </Descriptions>
                  </Card>

                  <Card size="small" title="Contacto & Sedes Asignadas" style={{ borderRadius: 8 }}>
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="Email">{colaborador.email || '-'}</Descriptions.Item>
                      <Descriptions.Item label="Teléfono">{colaborador.telefono || '-'}</Descriptions.Item>
                      <Descriptions.Item label="Dirección">{colaborador.direccion || '-'}</Descriptions.Item>
                      <Descriptions.Item label="Sedes">
                        <Space size={4} wrap>
                          {colaborador.sedes && colaborador.sedes.length > 0 ? (
                            colaborador.sedes.map((s) => <Tag key={s.id} color="blue">{s.nombre}</Tag>)
                          ) : (
                            <span style={{ color: '#94a3b8' }}>Sin sedes asignadas</span>
                          )}
                        </Space>
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                </div>
              ),
            },
            {
              key: 'historial',
              label: (
                <span>
                  <AuditOutlined /> Historial & Altas/Ceses ({historial.length})
                </span>
              ),
              children: (
                <div>
                  <Alert
                    type="info"
                    showIcon
                    message="Auditoría Laboral Permanente en Base de Datos"
                    description="Registro inmutable de los hitos laborales del colaborador (ingreso inicial, motivos de cese y reincorporaciones)."
                    style={{ marginBottom: 16 }}
                  />
                  {historial.length === 0 ? (
                    <Empty description="No hay eventos registrados" />
                  ) : (
                    <Timeline
                      items={historial.map((item) => ({
                        dot:
                          item.tipo_evento === 'ALTA_INICIAL' ? (
                            <CheckCircleOutlined style={{ color: '#10b981', fontSize: 16 }} />
                          ) : item.tipo_evento === 'CESE' ? (
                            <CloseCircleOutlined style={{ color: '#ef4444', fontSize: 16 }} />
                          ) : (
                            <SyncOutlined style={{ color: '#3b82f6', fontSize: 16 }} />
                          ),
                        children: (
                          <div
                            style={{
                              backgroundColor: '#ffffff',
                              padding: 12,
                              borderRadius: 8,
                              border: '1px solid #e2e8f0',
                              marginBottom: 10,
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Tag color={item.tipo_evento === 'ALTA_INICIAL' ? 'green' : item.tipo_evento === 'CESE' ? 'red' : 'blue'}>
                                {item.tipo_evento}
                              </Tag>
                              <span style={{ fontSize: 12, color: '#64748b' }}>{item.fecha_evento}</span>
                            </div>
                            {item.tipo_evento === 'CESE' ? (
                              <div style={{ marginTop: 6, color: '#b91c1c', fontSize: 12 }}>
                                <strong>Motivo:</strong> {item.motivo_cese_texto || 'Cese'}
                                {item.observaciones && <div>Detalle: {item.observaciones}</div>}
                              </div>
                            ) : (
                              <div style={{ marginTop: 6, fontSize: 12, color: '#334155' }}>
                                {item.cargo} {item.area && `(${item.area})`}
                                {item.sueldo_base && <div>Sueldo: S/ {Number(item.sueldo_base).toFixed(2)}</div>}
                              </div>
                            )}
                          </div>
                        ),
                      }))}
                    />
                  )}
                </div>
              ),
            },
            {
              key: 'contratos',
              label: (
                <span>
                  <FileProtectOutlined /> Contratos ({contratos.length})
                </span>
              ),
              children: (
                <div>
                  {contratoVigente ? (
                    <Card
                      size="small"
                      title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>Contrato Vigente Actual</span>
                          <Tag color={contratoVigente.estado === 'POR_VENCER' ? 'warning' : 'success'}>
                            {contratoVigente.estado}
                          </Tag>
                        </div>
                      }
                      style={{ marginBottom: 16, borderColor: '#0d9488' }}
                      extra={
                        <Button
                          size="small"
                          type="primary"
                          icon={<ReloadOutlined />}
                          onClick={() => {
                            setContratoParaRenovar(contratoVigente);
                            setRenovarModalOpen(true);
                          }}
                          style={{ backgroundColor: '#0d9488', borderColor: '#0d9488' }}
                        >
                          Renovar Contrato
                        </Button>
                      }
                    >
                      <Descriptions column={2} size="small">
                        <Descriptions.Item label="Nº">{contratoVigente.numero_contrato || 'S/N'}</Descriptions.Item>
                        <Descriptions.Item label="Tipo">{contratoVigente.tipo_contrato_nombre || 'General'}</Descriptions.Item>
                        <Descriptions.Item label="Inicio">{dayjs(contratoVigente.fecha_inicio).format('DD/MM/YYYY')}</Descriptions.Item>
                        <Descriptions.Item label="Vence">
                          {contratoVigente.es_indefinido ? 'Plazo Indeterminado' : contratoVigente.fecha_fin ? dayjs(contratoVigente.fecha_fin).format('DD/MM/YYYY') : '-'}
                        </Descriptions.Item>
                        {contratoVigente.dias_restantes !== null && contratoVigente.dias_restantes !== undefined && (
                          <Descriptions.Item label="Días Restantes">
                            <Tag color={contratoVigente.dias_restantes <= 30 ? 'orange' : 'green'} style={{ fontWeight: 600 }}>
                              {contratoVigente.dias_restantes} días
                            </Tag>
                          </Descriptions.Item>
                        )}
                        <Descriptions.Item label="Remuneración">
                          {contratoVigente.sueldo_pactado ? `S/ ${Number(contratoVigente.sueldo_pactado).toFixed(2)}` : '-'}
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>
                  ) : (
                    <Alert
                      type="warning"
                      showIcon
                      message="No cuenta con un contrato vigente registrado"
                      description="Al registrar un nuevo colaborador, puede emitir aquí su primer contrato laboral."
                      action={
                        <Button
                          size="small"
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={() => setCrearContratoModalOpen(true)}
                          style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}
                        >
                          Crear Contrato
                        </Button>
                      }
                      style={{ marginBottom: 16 }}
                    />
                  )}

                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#0f172a' }}>
                    Historial de Contratos Previos
                  </div>
                  {contratos.length === 0 ? (
                    <Empty description="No hay contratos registrados" />
                  ) : (
                    contratos.map((c) => (
                      <Card key={c.id} size="small" style={{ marginBottom: 8, borderRadius: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <strong>{c.numero_contrato || 'Sin código'}</strong> ({c.tipo_contrato_nombre || 'Contrato'})
                            <div style={{ fontSize: 12, color: '#64748b' }}>
                              Del {dayjs(c.fecha_inicio).format('DD/MM/YYYY')} al {c.es_indefinido ? 'Indefinido' : c.fecha_fin ? dayjs(c.fecha_fin).format('DD/MM/YYYY') : '-'}
                            </div>
                          </div>
                          <Tag>{c.estado}</Tag>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              ),
            },
            {
              key: 'vacaciones',
              label: (
                <span>
                  <CalendarOutlined /> Vacaciones
                </span>
              ),
              children: (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      padding: 14,
                      borderRadius: 10,
                      marginBottom: 16,
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <span style={{ fontSize: 13, color: '#166534', fontWeight: 600 }}>Saldo Vacacional Disponible</span>
                        <Tag color={esMype ? 'purple' : 'blue'} style={{ fontSize: 10, borderRadius: 4, margin: 0 }}>
                          {esMype ? 'MYPE (1.25 d/mes)' : 'Régimen General (2.5 d/mes)'}
                        </Tag>
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: '#15803d' }}>
                        {saldoVacacional.disponibles} días disponibles
                      </div>
                      <div style={{ fontSize: 11, color: '#16a34a' }}>
                        Generados: {saldoVacacional.generados} días • Gozados: {saldoVacacional.gozados} días
                      </div>
                    </div>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => setVacacionModalOpen(true)}
                      style={{ backgroundColor: '#0d9488', borderColor: '#0d9488', borderRadius: 8 }}
                    >
                      Programar Vacaciones
                    </Button>
                  </div>

                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#0f172a' }}>
                    Solicitudes y Periodos del Colaborador
                  </div>
                  {solicitudesVacaciones.length === 0 ? (
                    <Empty description="No registra solicitudes de vacaciones" />
                  ) : (
                    solicitudesVacaciones.map((v) => (
                      <Card key={v.id} size="small" style={{ marginBottom: 8, borderRadius: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <span style={{ fontWeight: 600 }}>
                              {dayjs(v.fecha_inicio).format('DD/MM/YYYY')} al {dayjs(v.fecha_fin).format('DD/MM/YYYY')}
                            </span>
                            <div style={{ fontSize: 12, color: '#0d9488' }}>{v.dias_solicitados} días calendario</div>
                            {v.motivo && <div style={{ fontSize: 11, color: '#64748b' }}>{v.motivo}</div>}
                          </div>
                          <Tag color={v.estado === 'APROBADA' ? 'green' : v.estado === 'PENDIENTE' ? 'orange' : 'red'}>
                            {v.estado}
                          </Tag>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              ),
            },
            {
              key: 'documentos',
              label: (
                <span>
                  <FileTextOutlined /> Constancias
                </span>
              ),
              children: (
                <div>
                  <Alert
                    type="info"
                    showIcon
                    message="Emisión Instantánea de Constancias Membretadas"
                    description="Genera la constancia de trabajo oficial del colaborador lista para imprimir o guardar en PDF con 1 clic."
                    style={{ marginBottom: 16 }}
                  />

                  <Button
                    type="primary"
                    icon={<PrinterOutlined />}
                    onClick={handleEmitirConstanciaRapida}
                    style={{
                      width: '100%',
                      height: 44,
                      backgroundColor: '#0d9488',
                      borderColor: '#0d9488',
                      borderRadius: 8,
                      fontWeight: 600,
                      fontSize: 14,
                    }}
                  >
                    Generar & Imprimir Constancia de Trabajo Oficial
                  </Button>
                </div>
              ),
            },
          ]}
        />
      )}

      {/* Sub-modales integrados en el expediente */}
      <VistaPreviaDocumentoModal
        open={docVistaOpen}
        onClose={() => setDocVistaOpen(false)}
        documento={docGenerado}
      />

      <RenovarContratoModal
        open={renovarModalOpen}
        onClose={() => setRenovarModalOpen(false)}
        onSubmit={handleConfirmRenovar}
        loading={false}
        contratoAnterior={contratoParaRenovar}
      />

      <NuevaSolicitudModal
        open={vacacionModalOpen}
        onClose={() => setVacacionModalOpen(false)}
        onSubmit={handleConfirmVacaciones}
        loading={false}
        personalList={colaborador ? [colaborador] : []}
        colaboradorFijo={colaborador}
        saldoDisponibleFijo={saldoVacacional.disponibles}
      />

      <ContratoModal
        open={crearContratoModalOpen}
        onClose={() => setCrearContratoModalOpen(false)}
        onSubmit={handleCrearPrimerContrato}
        loading={creandoContrato}
        contrato={null}
        fixedPersonalId={colaborador?.id}
        personalList={colaborador ? [colaborador] : []}
      />
    </Drawer>
  );
};
