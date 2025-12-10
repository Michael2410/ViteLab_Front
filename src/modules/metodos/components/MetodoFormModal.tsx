import { useEffect } from 'react';
import { Modal, Form, Input, Switch, Row, Col } from 'antd';
import type { Metodo, CreateMetodoInput, UpdateMetodoInput } from '../types';

interface MetodoFormModalProps {
  open: boolean;
  metodo: Metodo | null;
  onCancel: () => void;
  onSubmit: (data: CreateMetodoInput | UpdateMetodoInput) => void;
  loading?: boolean;
}

export const MetodoFormModal: React.FC<MetodoFormModalProps> = ({
  open,
  metodo,
  onCancel,
  onSubmit,
  loading = false,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open && metodo) {
      form.setFieldsValue({
        codigo: metodo.codigo,
        nombre: metodo.nombre,
        descripcion: metodo.descripcion,
        activo: metodo.activo,
      });
    } else if (open) {
      form.resetFields();
    }
  }, [open, metodo, form]);

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
      title={metodo ? 'Editar Método' : 'Nuevo Método'}
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={loading}
      width={600}
      okText={metodo ? 'Actualizar' : 'Crear'}
      cancelText="Cancelar"
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ activo: true }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Nombre"
              name="nombre"
              rules={[
                { required: true, message: 'Por favor ingrese el nombre' },
                { max: 100, message: 'El nombre no puede exceder 100 caracteres' },
              ]}
            >
              <Input placeholder="Nombre del método" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="Descripción"
          name="descripcion"
          rules={[
            { max: 500, message: 'La descripción no puede exceder 500 caracteres' },
          ]}
        >
          <Input.TextArea
            rows={3}
            placeholder="Descripción del método (opcional)"
          />
        </Form.Item>

        {metodo && (
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
