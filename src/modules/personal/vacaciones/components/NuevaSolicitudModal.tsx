import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Form,
  Select,
  DatePicker,
  Input,
  Card,
  Tag,
  Avatar,
  message,
} from 'antd';
import {
  CalendarOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  UserOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Personal, SolicitudVacacion } from '../../types';

export interface ConflictoVacacion {
  solicitudId: number;
  personalId: number;
  colaboradorNombre: string;
  colaboradorCargo: string;
  colaboradorArea?: string;
  esMismaArea: boolean;
  esMismoCargo: boolean;
  estado: string;
  fechaInicioSolapamiento: string;
  fechaFinSolapamiento: string;
  diasSolapamiento: number;
}

interface NuevaSolicitudModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any, colabNombre: string, colabCargo: string) => Promise<void>;
  loading: boolean;
  personalList: Personal[];
  colaboradorFijo?: Personal | null;
  saldoDisponibleFijo?: number;
  saldosMap?: Record<number, number>; // personal_id -> saldoDisponible
  solicitudesExistentes?: SolicitudVacacion[];
}

export const NuevaSolicitudModal: React.FC<NuevaSolicitudModalProps> = ({
  open,
  onClose,
  onSubmit,
  loading,
  personalList,
  colaboradorFijo,
  saldoDisponibleFijo,
  saldosMap = {},
  solicitudesExistentes = [],
}) => {
  const [form] = Form.useForm();
  const [diasCalculados, setDiasCalculados] = useState<number>(0);
  const rango = Form.useWatch('rango_fechas', form);
  const personalId = Form.useWatch('personal_id', form);

  // Obtener colaborador seleccionado y su saldo
  const colaboradorActual = colaboradorFijo || personalList.find((p) => p.id === personalId);
  const saldoActual = colaboradorFijo
    ? saldoDisponibleFijo ?? 30
    : personalId
    ? saldosMap[personalId] ?? 30
    : 30;

  useEffect(() => {
    if (rango && rango[0] && rango[1]) {
      const diff = rango[1].diff(rango[0], 'day') + 1;
      setDiasCalculados(diff > 0 ? diff : 0);
    } else {
      setDiasCalculados(0);
    }
  }, [rango]);

  // Detección informativa de coincidencias / cruces de vacaciones con otros colaboradores
  const conflictos = useMemo<ConflictoVacacion[]>(() => {
    if (!rango || !rango[0] || !rango[1] || !solicitudesExistentes || solicitudesExistentes.length === 0) {
      return [];
    }

    const miPersonalId = colaboradorActual?.id || personalId;
    const inicioSeleccionado = dayjs(rango[0]);
    const finSeleccionado = dayjs(rango[1]);

    const res: ConflictoVacacion[] = [];

    for (const sol of solicitudesExistentes) {
      // Ignorar al mismo colaborador
      if (miPersonalId && sol.personal_id === miPersonalId) continue;

      // Solo considerar estados activos
      if (sol.estado === 'RECHAZADA' || sol.estado === 'CANCELADA') continue;

      const solInicio = dayjs(sol.fecha_inicio);
      const solFin = dayjs(sol.fecha_fin);

      // Verificación de solapamiento de periodos
      const seSolapa = !inicioSeleccionado.isAfter(solFin, 'day') && !finSeleccionado.isBefore(solInicio, 'day');

      if (seSolapa) {
        const cruceInicio = inicioSeleccionado.isAfter(solInicio, 'day') ? inicioSeleccionado : solInicio;
        const cruceFin = finSeleccionado.isBefore(solFin, 'day') ? finSeleccionado : solFin;
        const diasCruce = cruceFin.diff(cruceInicio, 'day') + 1;

        if (diasCruce > 0) {
          const colabEnConflicto = personalList.find((p) => p.id === sol.personal_id);
          const colabNombre = sol.colaborador_nombre || (colabEnConflicto ? `${colabEnConflicto.apellidos}, ${colabEnConflicto.nombres}` : 'Colaborador');
          const colabCargo = sol.colaborador_cargo || colabEnConflicto?.cargo || 'Sin cargo';
          const colabArea = colabEnConflicto?.area || '';

          const esMismaArea = Boolean(
            colaboradorActual?.area &&
            colabArea &&
            colaboradorActual.area.trim().toLowerCase() === colabArea.trim().toLowerCase()
          );

          const esMismoCargo = Boolean(
            colaboradorActual?.cargo &&
            colabCargo &&
            colaboradorActual.cargo.trim().toLowerCase() === colabCargo.trim().toLowerCase()
          );

          res.push({
            solicitudId: sol.id,
            personalId: sol.personal_id,
            colaboradorNombre: colabNombre,
            colaboradorCargo: colabCargo,
            colaboradorArea: colabArea,
            esMismaArea,
            esMismoCargo,
            estado: sol.estado,
            fechaInicioSolapamiento: cruceInicio.format('DD/MM/YYYY'),
            fechaFinSolapamiento: cruceFin.format('DD/MM/YYYY'),
            diasSolapamiento: diasCruce,
          });
        }
      }
    }

    return res;
  }, [rango, solicitudesExistentes, colaboradorActual, personalId, personalList]);

  useEffect(() => {
    if (open) {
      form.resetFields();
      setDiasCalculados(0);
      if (colaboradorFijo) {
        form.setFieldsValue({
          personal_id: colaboradorFijo.id,
        });
      }
    }
  }, [open, colaboradorFijo, form]);

  const excedeSaldo = diasCalculados > saldoActual;
  const saldoRestante = Math.max(0, saldoActual - diasCalculados);

  const handleFinish = async (values: any) => {
    if (!values.rango_fechas || !values.rango_fechas[0] || !values.rango_fechas[1]) {
      message.warning('Por favor seleccione las fechas de inicio y retorno en el calendario');
      return;
    }

    const selected = colaboradorActual || personalList.find((p) => p.id === values.personal_id);
    const colabNombre = selected ? `${selected.apellidos}, ${selected.nombres}` : 'Colaborador';
    const colabCargo = selected?.cargo || 'Colaborador';

    const payload = {
      personal_id: values.personal_id || colaboradorFijo?.id,
      fecha_inicio: values.rango_fechas[0].format('YYYY-MM-DD'),
      fecha_fin: values.rango_fechas[1].format('YYYY-MM-DD'),
      dias_solicitados: diasCalculados,
      motivo: values.motivo || null,
    };

    await onSubmit(payload, colabNombre, colabCargo);
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <CalendarOutlined style={{ color: '#0d9488', fontSize: 18 }} />
          <span>Programar Periodo Vacacional</span>
        </div>
      }
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={loading}
      okText="Confirmar y Registrar"
      cancelText="Cancelar"
      width={580}
      destroyOnHidden
    >
      {/* Tarjeta de Saldo del Colaborador */}
      {colaboradorActual && (
        <Card
          size="small"
          style={{
            marginTop: 12,
            marginBottom: 16,
            backgroundColor: '#f8fafc',
            borderColor: '#e2e8f0',
            borderRadius: 10,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar
                size={40}
                style={{ backgroundColor: '#0d9488', fontWeight: 600 }}
                icon={<UserOutlined />}
              >
                {colaboradorActual.nombres?.[0]}
              </Avatar>
              <div>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>
                  {colaboradorActual.apellidos}, {colaboradorActual.nombres}
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  {colaboradorActual.cargo || 'Sin cargo'} • {colaboradorActual.area || 'General'}
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#64748b' }}>Saldo Vacacional</div>
              <Tag
                color={saldoActual > 15 ? 'warning' : 'success'}
                style={{ fontSize: 13, fontWeight: 700, margin: 0, padding: '2px 8px' }}
              >
                {saldoActual} días disponibles
              </Tag>
            </div>
          </div>
        </Card>
      )}

      <Form form={form} layout="vertical" onFinish={handleFinish}>
        {!colaboradorFijo && (
          <Form.Item
            name="personal_id"
            label="Colaborador Solicitante"
            rules={[{ required: true, message: 'Seleccione al colaborador' }]}
          >
            <Select
              showSearch
              placeholder="Buscar colaborador por nombre o cargo..."
              optionFilterProp="label"
              options={personalList.map((p) => ({
                label: `${p.apellidos}, ${p.nombres} (${p.cargo || 'Sin cargo'})`,
                value: p.id,
              }))}
            />
          </Form.Item>
        )}

        <Form.Item
          name="rango_fechas"
          label="Selecciona el Rango en el Calendario"
          rules={[{ required: false, message: 'Seleccione las fechas de inicio y fin en el calendario' }]}
          extra="Haz clic en la fecha de inicio y luego en la fecha de retorno para marcar el periodo."
        >
          <DatePicker.RangePicker
            style={{ width: '100%', height: 42, borderRadius: 8 }}
            format="DD/MM/YYYY"
            placeholder={['Fecha de inicio', 'Fecha de retorno']}
          />
        </Form.Item>

        {/* Panel de Conteo en Vivo y Verificación de Saldo */}
        {diasCalculados > 0 && (
          <div
            style={{
              padding: 14,
              borderRadius: 8,
              border: excedeSaldo ? '1px solid #fecdd3' : '1px solid #bbf7d0',
              backgroundColor: excedeSaldo ? '#fff1f2' : '#f0fdf4',
              marginBottom: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {excedeSaldo ? (
                <ExclamationCircleOutlined style={{ color: '#e11d48', fontSize: 18 }} />
              ) : (
                <CheckCircleOutlined style={{ color: '#16a34a', fontSize: 18 }} />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: excedeSaldo ? '#9f1239' : '#166534' }}>
                  Has marcado {diasCalculados} día(s) calendario
                </div>
                <div style={{ fontSize: 12, color: excedeSaldo ? '#be123c' : '#15803d', marginTop: 2 }}>
                  {excedeSaldo
                    ? `¡Atención! Este periodo excede el saldo disponible del colaborador por ${diasCalculados - saldoActual} día(s).`
                    : `Periodo válido. Saldo que le quedará tras este descanso: ${saldoRestante} día(s).`}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Panel Informativo de Cruces / Cobertura de Vacaciones */}
        {diasCalculados > 0 && conflictos.length > 0 && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 10,
              backgroundColor: '#fffbeb',
              border: '1.5px solid #fde68a',
              marginBottom: 16,
              boxShadow: '0 2px 8px rgba(217, 119, 6, 0.05)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <WarningOutlined style={{ color: '#d97706', fontSize: 16 }} />
                <span style={{ fontWeight: 700, color: '#92400e', fontSize: 13 }}>
                  Cruce de fechas con otros colaboradores ({conflictos.length})
                </span>
              </div>
              <Tag
                color="warning"
                style={{
                  margin: 0,
                  fontSize: 10.5,
                  fontWeight: 600,
                  borderRadius: 6,
                  padding: '1px 6px',
                }}
              >
                Informativo • Verifique cobertura
              </Tag>
            </div>

            <p style={{ margin: '0 0 10px 0', fontSize: 11.5, color: '#b45309' }}>
              Los siguientes colaboradores tienen vacaciones programadas o en curso que coinciden con este rango:
            </p>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                maxHeight: 160,
                overflowY: 'auto',
                paddingRight: 2,
              }}
            >
              {conflictos.map((c) => (
                <div
                  key={c.solicitudId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '7px 10px',
                    backgroundColor: '#ffffff',
                    borderRadius: 8,
                    border: '1px solid #fef3c7',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar
                      size={26}
                      style={{
                        backgroundColor: '#f59e0b',
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#ffffff',
                      }}
                    >
                      {c.colaboradorNombre.charAt(0)}
                    </Avatar>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
                        {c.colaboradorNombre}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: '#64748b',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          flexWrap: 'wrap',
                        }}
                      >
                        <span>{c.colaboradorCargo}{c.colaboradorArea ? ` • ${c.colaboradorArea}` : ''}</span>
                        {(c.esMismaArea || c.esMismoCargo) && (
                          <Tag
                            color="volcano"
                            style={{
                              fontSize: 9.5,
                              lineHeight: '13px',
                              padding: '0 4px',
                              margin: 0,
                              borderRadius: 4,
                            }}
                          >
                            {c.esMismaArea && c.esMismoCargo
                              ? 'Mismo cargo y área'
                              : c.esMismaArea
                              ? 'Misma área'
                              : 'Mismo cargo'}
                          </Tag>
                        )}
                        <Tag
                          style={{
                            fontSize: 9.5,
                            lineHeight: '13px',
                            padding: '0 4px',
                            margin: 0,
                            borderRadius: 4,
                            backgroundColor:
                              c.estado === 'APROBADA' || c.estado === 'TOMADA' ? '#ecfdf5' : '#fffbeb',
                            color:
                              c.estado === 'APROBADA' || c.estado === 'TOMADA' ? '#059669' : '#d97706',
                            borderColor:
                              c.estado === 'APROBADA' || c.estado === 'TOMADA' ? '#a7f3d0' : '#fde68a',
                          }}
                        >
                          {c.estado}
                        </Tag>
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 10 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: '#b45309' }}>
                      {c.fechaInicioSolapamiento === c.fechaFinSolapamiento
                        ? `El ${c.fechaInicioSolapamiento}`
                        : `${c.fechaInicioSolapamiento} al ${c.fechaFinSolapamiento}`}
                    </div>
                    <div style={{ fontSize: 11, color: '#d97706', fontWeight: 600 }}>
                      {c.diasSolapamiento} día(s) coincidente(s)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mensaje de Sin Cruces */}
        {diasCalculados > 0 && conflictos.length === 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: 8,
              marginBottom: 16,
              fontSize: 12,
              color: '#15803d',
              fontWeight: 500,
            }}
          >
            <CheckCircleOutlined style={{ color: '#16a34a' }} />
            <span>Sin cruces de vacaciones con otros colaboradores en este periodo.</span>
          </div>
        )}

        <Form.Item name="motivo" label="Motivo o Detalle de la Solicitud">
          <Input.TextArea
            rows={2}
            placeholder="Ej: Periodo vacacional legal periodo 2025-2026, descanso coordinado..."
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};
