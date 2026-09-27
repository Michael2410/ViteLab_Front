import { useEffect } from 'react';
import { Modal, Form, Input, Switch, Row, Col } from 'antd';
import type { Area, CreateAreaInput, UpdateAreaInput } from '../types';

interface AreaFormModalProps {
  open: boolean;
  area?: Area | null;
  onCancel: () => void;
  onSubmit: (data: CreateAreaInput | UpdateAreaInput) => Promise<void>;
  loading?: boolean;
}

export const AreaFormModal: React.FC<AreaFormModalProps> = ({
  open,
  area,
  onCancel,
  onSubmit,
  loading = false,
}) => {
  const [form] = Form.useForm();
  const isEditing = !!area;

  useEffect(() => {
    if (open) {
      if (area) {
        form.setFieldsValue({
          codigo: area.codigo,
          nombre: area.nombre,
          descripcion: area.descripcion || '',
          activo: area.activo,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ activo: true });
      }
    }
  }, [open, area, form]);

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
      title={isEditing ? 'Editar Área' : 'Nueva Área'}
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      okText={isEditing ? 'Actualizar' : 'Crear'}
      cancelText="Cancelar"
      width={600}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
        <Row gutter={16}>

          <Col span={12}>
            <Form.Item
              label="Nombre"
              name="nombre"
              rules={[
                { required: true, message: 'El nombre es obligatorio' },
                { max: 100, message: 'El nombre no puede exceder 100 caracteres' },
              ]}
            >
              <Input placeholder="Ej: Hematología" maxLength={100} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Descripción" name="descripcion">
          <Input.TextArea
            rows={3}
            placeholder="Descripción del área (opcional)"
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
