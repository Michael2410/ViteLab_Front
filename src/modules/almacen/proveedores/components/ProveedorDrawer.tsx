import { useEffect, useState } from 'react';
import {
  Drawer,
  Form,
  Input,
  Switch,
  Button,
  Row,
  Col,
  message,
} from 'antd';
import { TeamOutlined } from '@ant-design/icons';
import { proveedoresApi } from '../proveedores.api';
import type { Proveedor, ProveedorFormValues } from '../proveedores.types';

interface ProveedorDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  proveedor?: Proveedor | null;
}

export default function ProveedorDrawer({
  open,
  onClose,
  onSuccess,
  proveedor,
}: ProveedorDrawerProps) {
  const [form] = Form.useForm<ProveedorFormValues>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (proveedor) {
      form.setFieldsValue({
        ruc: proveedor.ruc || undefined,
        razon_social: proveedor.razon_social,
        nombre_comercial: proveedor.nombre_comercial || undefined,
        contacto: proveedor.contacto || undefined,
        telefono: proveedor.telefono || undefined,
        email: proveedor.email || undefined,
        direccion: proveedor.direccion || undefined,
        activo: proveedor.activo,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ activo: true });
    }
  }, [open, proveedor, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      if (proveedor) {
        await proveedoresApi.actualizar(proveedor.id, values);
        message.success('Proveedor actualizado exitosamente');
      } else {
        await proveedoresApi.crear(values);
        message.success('Proveedor registrado exitosamente');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al guardar el proveedor';
      message.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      placement="right"
      width={540}
      open={open}
      onClose={onClose}
      destroyOnClose
      styles={{
        header: {
          padding: '16px 24px',
          borderBottom: '1px solid #e2e8f0',
          background: '#ffffff',
        },
        body: {
          padding: '20px 24px',
          background: '#f8fafc',
          overflowY: 'auto',
        },
        footer: {
          padding: '12px 24px',
          background: '#ffffff',
          borderTop: '1px solid #e2e8f0',
        },
      }}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: 18,
              boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
            }}
          >
            <TeamOutlined />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
              {proveedor ? `Editar Proveedor: ${proveedor.razon_social}` : 'Nuevo Proveedor'}
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
              {proveedor ? `RUC: ${proveedor.ruc || 'Sin RUC'}` : 'Ficha de registro de proveedor'}
            </div>
          </div>
        </div>
      }
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Button onClick={onClose} style={{ borderRadius: 8 }}>
            Cancelar
          </Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={saving}
            style={{
              backgroundColor: '#d97706',
              borderColor: '#d97706',
              borderRadius: 8,
              fontWeight: 600,
              boxShadow: '0 2px 8px rgba(217, 119, 6, 0.25)',
              color: '#ffffff',
            }}
          >
            {proveedor ? 'Guardar Cambios' : 'Registrar Proveedor'}
          </Button>
        </div>
      }
    >
      <Form form={form} layout="vertical" requiredMark="optional">
        <Row gutter={16}>
          <Col span={10}>
            <Form.Item
              name="ruc"
              label="RUC"
              rules={[
                {
                  pattern: /^\d{11}$/,
                  message: 'El RUC debe tener 11 dígitos',
                },
              ]}
            >
              <Input placeholder="11 dígitos" maxLength={11} />
            </Form.Item>
          </Col>
          <Col span={14}>
            <Form.Item
              name="razon_social"
              label="Razón Social"
              rules={[{ required: true, message: 'Ingrese la razón social' }]}
            >
              <Input placeholder="Ej. Distribuidora Médica S.A.C." maxLength={200} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="nombre_comercial" label="Nombre Comercial">
          <Input placeholder="Ej. MediLab Perú" maxLength={200} />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="contacto" label="Persona de Contacto">
              <Input placeholder="Ej. Juan Pérez" maxLength={150} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="telefono" label="Teléfono / Celular">
              <Input placeholder="Ej. 987654321" maxLength={30} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="email"
          label="Correo Electrónico"
          rules={[{ type: 'email', message: 'Ingrese un email válido' }]}
        >
          <Input placeholder="contacto@empresa.com" maxLength={100} />
        </Form.Item>

        <Form.Item name="direccion" label="Dirección Fiscal">
          <Input.TextArea rows={2} placeholder="Av. Principal 123, Lima..." maxLength={500} />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
