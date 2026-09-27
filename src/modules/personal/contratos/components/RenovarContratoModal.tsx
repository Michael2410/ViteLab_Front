import React, { useEffect } from 'react';
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
import type { ContratoItem, CreateContratoInput } from '../../types';
import { useTiposContrato } from '../../hooks';

interface RenovarContratoModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (contratoAnteriorId: number, data: CreateContratoInput) => Promise<void>;
  loading: boolean;
  contratoAnterior: ContratoItem | null;
}

export const RenovarContratoModal: React.FC<RenovarContratoModalProps> = ({
  open,
  onClose,
  onSubmit,
  loading,
  contratoAnterior,
}) => {
  const [form] = Form.useForm();
  const esIndefinido = Form.useWatch('es_indefinido', form);
  const { data: tiposContrato = [] } = useTiposContrato();

  useEffect(() => {
    if (open && contratoAnterior) {
      // Fecha inicio sugerida: día siguiente al vencimiento del anterior o hoy
      const inicioSugerido = contratoAnterior.fecha_fin
        ? dayjs(contratoAnterior.fecha_fin).add(1, 'day')
        : dayjs();

      form.setFieldsValue({
        tipo_contrato_id: contratoAnterior.tipo_contrato_id,
        numero_contrato: '',
        fecha_inicio: inicioSugerido,
        duracion_meses: undefined,
        fecha_fin: null,
        es_indefinido: false,
        cargo: contratoAnterior.cargo,
        sueldo_pactado: contratoAnterior.sueldo_pactado,
        observaciones: `Renovación de contrato previo (${contratoAnterior.numero_contrato || 'S/N'})`,
      });
    }
  }, [open, contratoAnterior, form]);

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
    if (!contratoAnterior) return;

    const payload: CreateContratoInput = {
      personal_id: contratoAnterior.personal_id,
      tipo_contrato_id: values.tipo_contrato_id || null,
      numero_contrato: values.numero_contrato || null,
      fecha_inicio: values.fecha_inicio.format('YYYY-MM-DD'),
      fecha_fin: values.es_indefinido || !values.fecha_fin ? null : values.fecha_fin.format('YYYY-MM-DD'),
      es_indefinido: Boolean(values.es_indefinido),
      cargo: values.cargo || null,
      sueldo_pactado: values.sueldo_pactado || null,
      estado: 'VIGENTE',
      observaciones: values.observaciones || null,
    };

    await onSubmit(contratoAnterior.id, payload);
  };

  return (
    <Modal
      title="Renovar Contrato Laboral"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={loading}
      okText="Confirmar Renovación"
      cancelText="Cancelar"
      width={680}
      destroyOnHidden
    >
      {contratoAnterior && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message={`Renovando contrato de: ${contratoAnterior.colaborador_nombre}`}
          description={`El contrato actual finalizará y pasará a estado "RENOVADO" automáticamente. Se creará un nuevo periodo contractual vigente manteniendo los datos acordados.`}
        />
      )}

      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="tipo_contrato_id"
              label="Modalidad / Tipo de Contrato"
              rules={[{ required: true, message: 'Seleccione el tipo de contrato' }]}
            >
              <Select
                options={tiposContrato.map((tc) => ({
                  label: tc.nombre,
                  value: tc.id,
                }))}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="numero_contrato" label="Nuevo Nº de Contrato">
              <Input placeholder="Ej: RENOV-2026-001" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="fecha_inicio"
              label="Nueva Fecha de Inicio"
              rules={[{ required: true, message: 'Fecha de inicio obligatoria' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                onChange={handleFechaInicioChange}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="duracion_meses"
              label="Duración (meses)"
              tooltip="Ingrese la cantidad de meses libre. El sistema calculará automáticamente la fecha de vencimiento."
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
              label="Nueva Fecha de Fin"
              rules={[{ required: !esIndefinido, message: 'Fecha de fin requerida' }]}
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
            Pasa a Contrato Indeterminado / Fijo
          </Checkbox>
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="cargo" label="Cargo">
              <Input placeholder="Cargo laboral" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="sueldo_pactado" label="Nueva Remuneración (S/)">
              <InputNumber style={{ width: '100%' }} min={0} step={50} precision={2} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="observaciones" label="Observaciones de la renovación">
          <Input.TextArea rows={2} placeholder="Cláusulas modificadas, incremento salarial, etc." />
        </Form.Item>
      </Form>
    </Modal>
  );
};
