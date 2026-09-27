import React, { useEffect } from 'react';
import {
  Modal,
  Form,
  Select,
  Input,
  Checkbox,
} from 'antd';
import type { Personal } from '../../types';

interface GenerarDocumentoModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any, colabInfo: any) => Promise<void>;
  loading: boolean;
  personalList: Personal[];
}

export const GenerarDocumentoModal: React.FC<GenerarDocumentoModalProps> = ({
  open,
  onClose,
  onSubmit,
  loading,
  personalList,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldsValue({
        tipo_documento: 'CONSTANCIA_TRABAJO',
        destinatario: 'A quien corresponda',
        incluir_remuneracion: true,
      });
    }
  }, [open, form]);

  const handleFinish = async (values: any) => {
    const colab = personalList.find((p) => p.id === values.personal_id);
    const colabInfo = {
      nombre: colab ? `${colab.nombres} ${colab.apellidos}` : 'Colaborador',
      documento: `${colab?.tipo_documento || 'DNI'} Nº ${colab?.numero_documento || 'S/N'}`,
      cargo: colab?.cargo || 'Colaborador',
      sueldo: colab?.sueldo_base || null,
      fecha_ingreso: colab?.fecha_ingreso || null,
    };

    const payload = {
      personal_id: values.personal_id,
      tipo_documento: values.tipo_documento,
      destinatario: values.destinatario || 'A quien corresponda',
      incluir_remuneracion: values.incluir_remuneracion,
      observaciones: values.observaciones || null,
    };

    await onSubmit(payload, colabInfo);
  };

  return (
    <Modal
      title="Generar Documento / Constancia Laboral"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={loading}
      okText="Emitir Documento"
      cancelText="Cancelar"
      width={540}
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
            options={personalList.map((p) => ({
              label: `${p.apellidos}, ${p.nombres} (${p.cargo || 'Sin cargo'})`,
              value: p.id,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="tipo_documento"
          label="Tipo de Documento a Emitir"
          rules={[{ required: true, message: 'Seleccione tipo de documento' }]}
        >
          <Select
            options={[
              { label: 'Constancia de Trabajo (Laborando actualmente)', value: 'CONSTANCIA_TRABAJO' },
              { label: 'Certificado Laboral (Acreditación de funciones)', value: 'CERTIFICADO_LABORAL' },
              { label: 'Carta de Presentación Institucional', value: 'CARTA_PRESENTACION' },
            ]}
          />
        </Form.Item>

        <Form.Item name="destinatario" label="Dirigido a / Destinatario">
          <Input placeholder="Ej: A quien corresponda / Entidad Financiera / Universidad..." />
        </Form.Item>

        <Form.Item name="incluir_remuneracion" valuePropName="checked">
          <Checkbox>Consignar remuneración mensual pactada en el documento</Checkbox>
        </Form.Item>

        <Form.Item name="observaciones" label="Observaciones o Cláusula adicional">
          <Input.TextArea rows={2} placeholder="Detalles particulares a incluir..." />
        </Form.Item>
      </Form>
    </Modal>
  );
};
