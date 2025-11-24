import { useEffect } from 'react';
import { Modal, Form, Input, Switch, Select } from 'antd';
import { useTarifarios } from '../../tarifarios/hooks';
import type { Convenio, CreateConvenioInput, UpdateConvenioInput } from '../types';

interface ConvenioFormModalProps {
  open: boolean;
  convenio: Convenio | null;
  onCancel: () => void;
  onSubmit: (data: CreateConvenioInput | UpdateConvenioInput) => void;
  loading?: boolean;
}

export const ConvenioFormModal: React.FC<ConvenioFormModalProps> = ({
  open,
  convenio,
  onCancel,
  onSubmit,
  loading = false,
}) => {
  const [form] = Form.useForm();
  const { data: tarifarios, isLoading: loadingTarifarios } = useTarifarios({ activo: true });

  useEffect(() => {
    if (open && convenio) {
      form.setFieldsValue({
        nombre_empresa: convenio.nombre_empresa,
        ruc: convenio.ruc,
        direccion: convenio.direccion,
        telefono: convenio.telefono,
        email: convenio.email,
        tarifario_id: convenio.tarifario_id,
        activo: convenio.activo,
      });
    } else if (open) {
      form.resetFields();
    }
  }, [open, convenio, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      onSubmit(values);
    } catch (error) {
      console.error('Error de validación:', error);
    }
  };

  return (
    <Modal
      title={convenio ? 'Editar Convenio' : 'Nuevo Convenio'}
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={loading}
      width={700}
      okText={convenio ? 'Actualizar' : 'Crear'}
      cancelText="Cancelar"
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ activo: true }}
      >
        <Form.Item
          label="Nombre de la Empresa"
          name="nombre_empresa"
          rules={[
            { required: true, message: 'Por favor ingrese el nombre de la empresa' },
            { max: 200, message: 'El nombre no puede exceder 200 caracteres' },
          ]}
        >
          <Input placeholder="Nombre completo de la empresa" />
        </Form.Item>

        <Form.Item
          label="RUC"
          name="ruc"
          rules={[
            { required: true, message: 'Por favor ingrese el RUC' },
            { len: 11, message: 'El RUC debe tener exactamente 11 dígitos' },
            { pattern: /^\d+$/, message: 'El RUC solo puede contener números' },
          ]}
        >
          <Input placeholder="20123456789" maxLength={11} />
        </Form.Item>

        <Form.Item
          label="Dirección"
          name="direccion"
          rules={[
            { max: 500, message: 'La dirección no puede exceder 500 caracteres' },
          ]}
        >
          <Input.TextArea
            rows={2}
            placeholder="Dirección completa (opcional)"
          />
        </Form.Item>

        <Form.Item
          label="Teléfono"
          name="telefono"
          rules={[
            { max: 20, message: 'El teléfono no puede exceder 20 caracteres' },
            { 
              pattern: /^[0-9\s\-\+\(\)]*$/,
              message: 'El teléfono solo puede contener números, espacios y caracteres: - + ( )'
            },
          ]}
        >
          <Input placeholder="Ej: 01-234567, 987654321" />
        </Form.Item>

        <Form.Item
          label="Email"
          name="email"
          rules={[
            { type: 'email', message: 'Por favor ingrese un email válido' },
            { max: 100, message: 'El email no puede exceder 100 caracteres' },
          ]}
        >
          <Input placeholder="correo@empresa.com" />
        </Form.Item>

        <Form.Item
          label="Tarifario"
          name="tarifario_id"
          rules={[
            { required: true, message: 'Por favor seleccione un tarifario' },
          ]}
        >
          <Select
            placeholder="Seleccione un tarifario"
            loading={loadingTarifarios}
            options={tarifarios?.items?.map((t) => ({
              label: t.nombre,
              value: t.id,
            }))}
          />
        </Form.Item>

        {convenio && (
          <Form.Item
            label="Estado"
            name="activo"
            valuePropName="checked"
          >
            <Switch checkedChildren="Activo" unCheckedChildren="Inactivo" />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
};
