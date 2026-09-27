import React, { useEffect, useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Checkbox,
  Row,
  Col,
  Alert,
} from 'antd';
import dayjs from 'dayjs';
import type { ContratoItem, CreateContratoInput, UpdateContratoInput, Personal } from '../../types';
import { useTiposContrato } from '../../hooks';

interface ContratoModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  loading: boolean;
  contrato?: ContratoItem | null;
  personalList?: Personal[];
  fixedPersonalId?: number;
}

export const ContratoModal: React.FC<ContratoModalProps> = ({
  open,
  onClose,
  onSubmit,
  loading,
  contrato,
  personalList = [],
  fixedPersonalId,
}) => {
  const [form] = Form.useForm();
  const esIndefinido = Form.useWatch('es_indefinido', form);
  const { data: tiposContrato = [] } = useTiposContrato();
  const [selectedColab, setSelectedColab] = useState<Personal | null>(null);

  useEffect(() => {
    if (open) {
      if (contrato) {
        setSelectedColab(null);
        const fIni = contrato.fecha_inicio ? dayjs(contrato.fecha_inicio) : null;
        const fFin = contrato.fecha_fin ? dayjs(contrato.fecha_fin) : null;
        let duracionMeses: number | undefined = undefined;

        if (!contrato.es_indefinido && fIni && fFin && (fFin.isAfter(fIni) || fFin.isSame(fIni))) {
          duracionMeses = Math.max(1, Math.round(fFin.add(1, 'day').diff(fIni, 'month', true)));
        }

        form.setFieldsValue({
          personal_id: contrato.personal_id,
          tipo_contrato_id: contrato.tipo_contrato_id,
          numero_contrato: contrato.numero_contrato,
          fecha_inicio: fIni,
          duracion_meses: duracionMeses,
          fecha_fin: fFin,
          es_indefinido: contrato.es_indefinido,
          cargo: contrato.cargo,
          sueldo_pactado: contrato.sueldo_pactado,
          estado: contrato.estado,
          observaciones: contrato.observaciones,
        });
      } else {
        form.resetFields();
        const targetId = fixedPersonalId || form.getFieldValue('personal_id');
        const found = targetId ? personalList.find((p) => p.id === targetId) : null;
        setSelectedColab(found || null);

        const fechaIngresoSugerida = found?.fecha_ingreso ? dayjs(found.fecha_ingreso) : dayjs();

        form.setFieldsValue({
          personal_id: fixedPersonalId,
          fecha_inicio: fechaIngresoSugerida,
          duracion_meses: undefined,
          fecha_fin: undefined,
          es_indefinido: false,
          cargo: found?.cargo || undefined,
          sueldo_pactado: found?.sueldo_base || undefined,
          tipo_contrato_id: found?.tipo_contrato_id || undefined,
          estado: 'VIGENTE',
        });
      }
    }
  }, [open, contrato, fixedPersonalId, personalList, form]);

  const handleSelectColaborador = (personalId: number) => {
    const colab = personalList.find((p) => p.id === personalId);
    setSelectedColab(colab || null);

    if (colab && !contrato) {
      const fechaInicio = colab.fecha_ingreso ? dayjs(colab.fecha_ingreso) : dayjs();
      const duracion = form.getFieldValue('duracion_meses');
      let fechaFin = undefined;
      if (duracion && duracion > 0 && !form.getFieldValue('es_indefinido')) {
        fechaFin = fechaInicio.add(duracion, 'month').subtract(1, 'day');
      }

      form.setFieldsValue({
        cargo: colab.cargo || undefined,
        sueldo_pactado: colab.sueldo_base || undefined,
        fecha_inicio: fechaInicio,
        tipo_contrato_id: colab.tipo_contrato_id || undefined,
        fecha_fin: fechaFin,
      });
    }
  };

  const handleDuracionChange = (meses: number | null) => {
    const fInicio = form.getFieldValue('fecha_inicio');
    if (meses && meses > 0 && fInicio && !esIndefinido) {
      const calculatedFin = dayjs(fInicio).add(meses, 'month').subtract(1, 'day');
      form.setFieldValue('fecha_fin', calculatedFin);
    } else if (!meses && !esIndefinido) {
      form.setFieldValue('fecha_fin', null);
    }
  };

  const handleFechaInicioChange = (fInicio: any) => {
    const meses = form.getFieldValue('duracion_meses');
    if (fInicio && meses && meses > 0 && !esIndefinido) {
      const calculatedFin = dayjs(fInicio).add(meses, 'month').subtract(1, 'day');
      form.setFieldValue('fecha_fin', calculatedFin);
    }
  };

  const handleFechaFinChange = (fFin: any) => {
    const fInicio = form.getFieldValue('fecha_inicio');
    if (fInicio && fFin && fFin.isAfter(fInicio) && !esIndefinido) {
      const calculatedMeses = Math.max(1, Math.round(fFin.add(1, 'day').diff(fInicio, 'month', true)));
      form.setFieldValue('duracion_meses', calculatedMeses);
    }
  };

  const handleEsIndefinidoChange = (e: any) => {
    if (e.target.checked) {
      form.setFieldsValue({
        duracion_meses: null,
        fecha_fin: null,
      });
    }
  };

  const handleFinish = async (values: any) => {
    const payload: CreateContratoInput | UpdateContratoInput = {
      personal_id: values.personal_id || fixedPersonalId,
      tipo_contrato_id: values.tipo_contrato_id || null,
      numero_contrato: values.numero_contrato || null,
      fecha_inicio: values.fecha_inicio ? values.fecha_inicio.format('YYYY-MM-DD') : '',
      fecha_fin: values.es_indefinido || !values.fecha_fin ? null : values.fecha_fin.format('YYYY-MM-DD'),
      es_indefinido: Boolean(values.es_indefinido),
      cargo: values.cargo || null,
      sueldo_pactado: values.sueldo_pactado || null,
      estado: values.estado || 'VIGENTE',
      observaciones: values.observaciones || null,
    };
    await onSubmit(payload);
  };

  return (
    <Modal
      title={contrato ? 'Editar Contrato Laboral' : 'Nuevo Contrato Laboral'}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={loading}
      okText={contrato ? 'Guardar Cambios' : 'Registrar Contrato'}
      cancelText="Cancelar"
      width={680}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        style={{ marginTop: 16 }}
      >
        {!fixedPersonalId && !contrato && (
          <Form.Item
            name="personal_id"
            label="Colaborador"
            rules={[{ required: true, message: 'Seleccione el colaborador' }]}
          >
            <Select
              showSearch
              placeholder="Buscar colaborador por nombre o documento..."
              optionFilterProp="label"
              onChange={handleSelectColaborador}
              options={personalList.map((p) => ({
                label: `${p.apellidos}, ${p.nombres} (${p.numero_documento || 'S/N'}) - ${p.cargo || 'Sin cargo'}`,
                value: p.id,
              }))}
            />
          </Form.Item>
        )}

        {selectedColab && !contrato && (
          <Alert
            type="info"
            showIcon
            style={{
              marginBottom: 16,
              borderRadius: 8,
              border: '1px solid #bae6fd',
              backgroundColor: '#f0f9ff',
            }}
            message={
              <span style={{ fontWeight: 600, color: '#0369a1' }}>
                Datos precargados del registro de {selectedColab.nombres} {selectedColab.apellidos}
              </span>
            }
            description={
              <div style={{ fontSize: 12, color: '#0c4a6e', marginTop: 4 }}>
                Se autocompletaron los campos iniciales de la ficha: 
                <strong> Cargo:</strong> {selectedColab.cargo || 'No registrado'} • 
                <strong> Sueldo Base:</strong> {selectedColab.sueldo_base ? `S/ ${Number(selectedColab.sueldo_base).toFixed(2)}` : 'No registrado'} • 
                <strong> Fecha de Ingreso:</strong> {selectedColab.fecha_ingreso ? dayjs(selectedColab.fecha_ingreso).format('DD/MM/YYYY') : 'Hoy'}.
                <div style={{ fontSize: 11, color: '#0284c7', marginTop: 2 }}>
                  * Puede modificarlos libremente si este contrato contempla condiciones salariales o temporales específicas.
                </div>
              </div>
            }
          />
        )}

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="tipo_contrato_id"
              label="Tipo de Contrato"
              rules={[{ required: true, message: 'Seleccione el tipo de contrato' }]}
            >
              <Select
                placeholder="Seleccione modalidad..."
                options={tiposContrato.map((tc) => ({
                  label: tc.nombre,
                  value: tc.id,
                }))}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="numero_contrato" label="Nº de Contrato / Código">
              <Input placeholder="Ej: CONT-2026-042" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="fecha_inicio"
              label="Fecha de Inicio"
              rules={[{ required: true, message: 'Ingrese fecha de inicio' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                placeholder="Inicio de labores"
                onChange={handleFechaInicioChange}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="duracion_meses"
              label="Duración (meses)"
              tooltip="Ingrese la cantidad de meses libre. El sistema calculará la fecha de vencimiento automáticamente."
            >
              <InputNumber
                style={{ width: '100%' }}
                min={1}
                max={120}
                precision={0}
                placeholder="Ej. 1, 3, 6, 12..."
                disabled={esIndefinido}
                onChange={handleDuracionChange}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="fecha_fin"
              label="Fecha de Vencimiento"
              rules={[{ required: !esIndefinido, message: 'Ingrese fecha de fin o marque Indefinido' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                disabled={esIndefinido}
                placeholder={esIndefinido ? 'Plazo Indefinido' : 'Fin de contrato'}
                onChange={handleFechaFinChange}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="es_indefinido" valuePropName="checked">
          <Checkbox onChange={handleEsIndefinidoChange}>
            Contrato a Plazo Indeterminado / Fijo (sin fecha de vencimiento)
          </Checkbox>
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="cargo" label="Cargo Estipulado">
              <Input placeholder="Ej: Tecnólogo Médico" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="sueldo_pactado" label="Remuneración Pactada (S/)">
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                step={50}
                precision={2}
                placeholder="0.00"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="estado" label="Estado del Contrato">
              <Select
                options={[
                  { label: 'Vigente', value: 'VIGENTE' },
                  { label: 'Renovado', value: 'RENOVADO' },
                  { label: 'Vencido / Concluido', value: 'VENCIDO' },
                  { label: 'Cancelado / Rescindido', value: 'CANCELADO' },
                ]}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="observaciones" label="Observaciones">
              <Input placeholder="Condiciones especiales, cláusulas, etc." />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};
