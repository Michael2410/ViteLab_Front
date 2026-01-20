import { useEffect } from 'react';
import { Modal, Form, Input, Switch } from 'antd';
import type { Sede, CreateSedeInput, UpdateSedeInput } from '../types';

interface SedeFormModalProps {
  open: boolean;
  sede: Sede | null;
  onCancel: () => void;
  onSubmit: (data: CreateSedeInput | UpdateSedeInput) => void;
  loading?: boolean;
}

export const SedeFormModal: React.FC<SedeFormModalProps> = ({
  open,
  sede,
  onCancel,
  onSubmit,
  loading = false,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open && sede) {
      form.setFieldsValue({
        nombre: sede.nombre,
        direccion: sede.direccion,
        telefono: sede.telefono,
        activo: sede.activo,
      });
    } else if (open) {
      form.resetFields();
    }
  }, [open, sede, form]);

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
      title={sede ? 'Editar Sede' : 'Nueva Sede'}
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={loading}
      width={600}
      okText={sede ? 'Actualizar' : 'Crear'}
      cancelText="Cancelar"
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ activo: true }}
      >
        <Form.Item
          label="Nombre"
          name="nombre"
          rules={[
            { required: true, message: 'Por favor ingrese el nombre' },
            { max: 100, message: 'El nombre no puede exceder 100 caracteres' },
          ]}
        >
          <Input placeholder="Nombre de la sede" />
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

        {sede && (
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
