import React, { useEffect } from 'react';
import {
  Modal,
  Form,
  Select,
  DatePicker,
  TimePicker,
  InputNumber,
  Input,
  Row,
  Col,
} from 'antd';
import dayjs from 'dayjs';
import type { Personal, RegistroAsistencia } from '../../types';

interface RegistrarAsistenciaModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any, colabInfo: any) => Promise<void>;
  loading: boolean;
  personalList: Personal[];
  registro?: RegistroAsistencia | null;
}

export const RegistrarAsistenciaModal: React.FC<RegistrarAsistenciaModalProps> = ({
  open,
  onClose,
  onSubmit,
  loading,
  personalList,
  registro,
}) => {
  const [form] = Form.useForm();
  const estado = Form.useWatch('estado', form);

  useEffect(() => {
    if (open) {
      if (registro) {
        form.setFieldsValue({
          personal_id: registro.personal_id,
          fecha: registro.fecha ? dayjs(registro.fecha) : dayjs(),
          estado: registro.estado,
          hora_entrada: registro.hora_entrada ? dayjs(registro.hora_entrada, 'HH:mm') : null,
          hora_salida: registro.hora_salida ? dayjs(registro.hora_salida, 'HH:mm') : null,
          minutos_tardanza: registro.minutos_tardanza || 0,
          justificacion: registro.justificacion || '',
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          fecha: dayjs(),
          estado: 'PRESENTE',
          hora_entrada: dayjs('08:00', 'HH:mm'),
          hora_salida: dayjs('17:00', 'HH:mm'),
          minutos_tardanza: 0,
        });
      }
    }
  }, [open, registro, form]);

  const handleFinish = async (values: any) => {
    const targetPersonalId = values.personal_id || registro?.personal_id;
    const colab = personalList.find((p) => p.id === targetPersonalId);
    const colabInfo = {
      nombre: colab ? `${colab.apellidos}, ${colab.nombres}` : (registro?.colaborador_nombre || 'Colaborador'),
      documento: colab?.numero_documento || (registro?.colaborador_documento || 'S/N'),
      cargo: colab?.cargo || (registro?.cargo || 'General'),
      area: colab?.area || (registro?.area || 'General'),
      sede: colab?.sedes?.[0]?.nombre || (registro?.sede_nombre || 'Sede Principal'),
    };

    const payload = {
      personal_id: targetPersonalId,
      fecha: values.fecha.format('YYYY-MM-DD'),
      hora_entrada: values.hora_entrada ? values.hora_entrada.format('HH:mm') : null,
      hora_salida: values.hora_salida ? values.hora_salida.format('HH:mm') : null,
      minutos_tardanza: values.minutos_tardanza || 0,
      estado: values.estado,
      justificacion: values.justificacion || null,
    };

    await onSubmit(payload, colabInfo);
  };

  return (
    <Modal
      title={registro ? 'Editar Marca de Asistencia' : 'Registrar Asistencia / Justificación'}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={loading}
      okText={registro ? 'Guardar Cambios' : 'Guardar Registro'}
      cancelText="Cancelar"
      width={560}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} style={{ marginTop: 16 }}>
        <Form.Item
          name="personal_id"
          label="Colaborador"
          rules={[{ required: true, message: 'Seleccione colaborador' }]}
        >
          <Select
            showSearch
            placeholder="Buscar por colaborador..."
            optionFilterProp="label"
            disabled={Boolean(registro)}
            options={personalList.map((p) => ({
              label: `${p.apellidos}, ${p.nombres} (${p.cargo || 'Sin cargo'})`,
              value: p.id,
            }))}
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="fecha"
              label="Fecha"
              rules={[{ required: true, message: 'Seleccione fecha' }]}
            >
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="estado"
              label="Estado de Asistencia"
              rules={[{ required: true, message: 'Seleccione estado' }]}
            >
              <Select
                options={[
                  { label: 'Presente (Puntual)', value: 'PRESENTE' },
                  { label: 'Tardanza', value: 'TARDANZA' },
                  { label: 'Falta Justificada (Salud/Permiso)', value: 'FALTA_JUSTIFICADA' },
                  { label: 'Falta Injustificada', value: 'FALTA_INJUSTIFICADA' },
                  { label: 'Permiso / Comisión', value: 'PERMISO_MEDICO' },
                  { label: 'Licencia por Maternidad / Paternidad', value: 'LICENCIA' },
                ]}
              />
            </Form.Item>
          </Col>
        </Row>

        {(estado === 'PRESENTE' || estado === 'TARDANZA') && (
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="hora_entrada" label="Hora Entrada">
                <TimePicker format="HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="hora_salida" label="Hora Salida">
                <TimePicker format="HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="minutos_tardanza" label="Tardanza (Min)">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        )}

        {(estado?.includes('FALTA') || estado?.includes('PERMISO') || estado === 'TARDANZA') && (
          <Form.Item name="justificacion" label="Motivo / Justificación / Documento Sustentatorio">
            <Input.TextArea rows={2} placeholder="Detalle de justificación médica, documento, etc." />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
};
