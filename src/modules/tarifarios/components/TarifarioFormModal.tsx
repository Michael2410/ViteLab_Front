import { useEffect } from 'react';
import { Modal, Form, Input, Switch } from 'antd';
import type { Tarifario, CreateTarifarioInput, UpdateTarifarioInput } from '../types';

interface TarifarioFormModalProps {
  open: boolean;
  tarifario?: Tarifario | null;
  onCancel: () => void;
  onSubmit: (data: CreateTarifarioInput | UpdateTarifarioInput) => Promise<void>;
  loading?: boolean;
}

export const TarifarioFormModal: React.FC<TarifarioFormModalProps> = ({
  open,
  tarifario,
  onCancel,
  onSubmit,
  loading = false,
}) => {
  const [form] = Form.useForm();
  const isEditing = !!tarifario;

  useEffect(() => {
    if (open) {
      if (tarifario) {
        form.setFieldsValue({
          nombre: tarifario.nombre,
          descripcion: tarifario.descripcion || '',
          activo: tarifario.activo,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ activo: true });
      }
    }
  }, [open, tarifario, form]);

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
      title={isEditing ? 'Editar Tarifario' : 'Nuevo Tarifario'}
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      okText={isEditing ? 'Actualizar' : 'Crear'}
      cancelText="Cancelar"
      width={600}
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
          <Input placeholder="Ej: Tarifario General" maxLength={100} />
        </Form.Item>

        <Form.Item label="Descripción" name="descripcion">
          <Input.TextArea
            rows={4}
            placeholder="Descripción del tarifario (opcional)"
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
