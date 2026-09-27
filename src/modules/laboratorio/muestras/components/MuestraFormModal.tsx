import { useEffect } from 'react';
import { Modal, Form, Input, Switch } from 'antd';
import type { Muestra, CreateMuestraInput, UpdateMuestraInput } from '../types';

interface MuestraFormModalProps {
  open: boolean;
  muestra?: Muestra | null;
  onCancel: () => void;
  onSubmit: (data: CreateMuestraInput | UpdateMuestraInput) => Promise<void>;
  loading?: boolean;
}

export const MuestraFormModal: React.FC<MuestraFormModalProps> = ({
  open,
  muestra,
  onCancel,
  onSubmit,
  loading = false,
}) => {
  const [form] = Form.useForm();
  const isEditing = !!muestra;

  useEffect(() => {
    if (open) {
      if (muestra) {
        form.setFieldsValue({
          nombre: muestra.nombre,
          descripcion: muestra.descripcion || '',
          activo: muestra.activo,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ activo: true });
      }
    }
  }, [open, muestra, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await onSubmit(values);
      form.resetFields();
    } catch (error) {
      console.error('Error de validación:', error);
    }
  };

  return (
    <Modal
      title={isEditing ? 'Editar Muestra' : 'Nueva Muestra'}
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      okText={isEditing ? 'Actualizar' : 'Crear'}
      cancelText="Cancelar"
      width={500}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
        <Form.Item
          label="Nombre"
          name="nombre"
          rules={[
            { required: true, message: 'El nombre es obligatorio' },
            { max: 100, message: 'El nombre no puede exceder 100 caracteres' },
          ]}
        >
          <Input placeholder="Ej: Sangre Total" maxLength={100} />
        </Form.Item>

        <Form.Item label="Descripción" name="descripcion">
          <Input.TextArea
            rows={3}
            placeholder="Descripción de la muestra (opcional)"
            maxLength={500}
            showCount
          />
        </Form.Item>

        {isEditing && (
          <Form.Item label="Estado" name="activo" valuePropName="checked">
            <Switch checkedChildren="Activo" unCheckedChildren="Inactivo" />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
};
