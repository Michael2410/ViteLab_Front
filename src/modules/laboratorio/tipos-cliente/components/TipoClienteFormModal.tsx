import { useEffect } from 'react';
import { Modal, Form, Input, Switch } from 'antd';
import type { TipoCliente, CreateTipoClienteInput, UpdateTipoClienteInput } from '../types';

interface TipoClienteFormModalProps {
  open: boolean;
  tipoCliente: TipoCliente | null;
  onCancel: () => void;
  onSubmit: (data: CreateTipoClienteInput | UpdateTipoClienteInput) => void;
  loading?: boolean;
}

export const TipoClienteFormModal: React.FC<TipoClienteFormModalProps> = ({
  open,
  tipoCliente,
  onCancel,
  onSubmit,
  loading = false,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open && tipoCliente) {
      form.setFieldsValue({
        nombre: tipoCliente.nombre,
        activo: tipoCliente.activo,
      });
    } else if (open) {
      form.resetFields();
    }
  }, [open, tipoCliente, form]);

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
      title={tipoCliente ? 'Editar Tipo de Cliente' : 'Nuevo Tipo de Cliente'}
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={loading}
      width={500}
      okText={tipoCliente ? 'Actualizar' : 'Crear'}
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
            { max: 50, message: 'El nombre no puede exceder 50 caracteres' },
          ]}
        >
          <Input placeholder="Ej: Particular, Convenio, Corporativo" />
        </Form.Item>

        {tipoCliente && (
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
