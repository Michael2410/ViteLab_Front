import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Typography, Space, Alert, message } from 'antd';
import {
  LockOutlined,
  CopyOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useRestablecerPassword } from '../hooks';
import type { Usuario } from '../types';

const { Text } = Typography;

interface ResetPasswordModalProps {
  open: boolean;
  usuario: Usuario | null;
  onCancel: () => void;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  open,
  usuario,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const [tempPassword, setTempPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const restablecerMutation = useRestablecerPassword();

  const generarPassword = () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const generated = `ViteLab${Math.floor(1000 + Math.random() * 9000)}!`;
    setTempPassword(generated);
    form.setFieldsValue({ newPassword: generated });
    setCopied(false);
  };

  useEffect(() => {
    if (open) {
      generarPassword();
    } else {
      form.resetFields();
      setTempPassword('');
      setCopied(false);
    }
  }, [open]);

  const handleCopy = () => {
    const pwd = form.getFieldValue('newPassword') || tempPassword;
    if (pwd) {
      navigator.clipboard.writeText(pwd);
      setCopied(true);
      message.success('Contraseña temporal copiada al portapapeles');
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleFinish = async (values: { newPassword: string }) => {
    if (!usuario?.id) return;
    try {
      const res = await restablecerMutation.mutateAsync({
        id: usuario.id,
        newPassword: values.newPassword,
      });

      // Copiar automáticamente al portapapeles para facilitar al administrador
      if (res?.temporaryPassword) {
        navigator.clipboard.writeText(res.temporaryPassword);
      }

      Modal.success({
        title: 'Contraseña Provisional Asignada',
        icon: <CheckCircleOutlined style={{ color: '#059669' }} />,
        content: (
          <div style={{ marginTop: 12 }}>
            <p style={{ color: '#334155', fontSize: 13, margin: '0 0 10px 0' }}>
              La contraseña provisional para <strong>{usuario.nombres} {usuario.apellidos}</strong> es:
            </p>
            <div
              style={{
                backgroundColor: '#f1f5f9',
                padding: '10px 14px',
                borderRadius: 8,
                fontFamily: 'monospace',
                fontSize: 16,
                fontWeight: 700,
                color: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                border: '1px solid #cbd5e1',
                marginBottom: 10,
              }}
            >
              <span>{res?.temporaryPassword || values.newPassword}</span>
              <Button
                size="small"
                type="text"
                icon={<CopyOutlined />}
                onClick={() => {
                  navigator.clipboard.writeText(res?.temporaryPassword || values.newPassword);
                  message.success('Copiada');
                }}
              >
                Copiar
              </Button>
            </div>
            <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>
              * Se ha copiado automáticamente. El usuario deberá cambiarla obligatoriamente en su próximo inicio de sesión.
            </p>
          </div>
        ),
      });

      onCancel();
    } catch {
      // El hook maneja el error visual
    }
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
          <SafetyCertificateOutlined style={{ color: '#0284c7', fontSize: 20 }} />
          <span>Restablecer Contraseña de Usuario</span>
        </div>
      }
      open={open}
      onCancel={onCancel}
      footer={null}
      destroyOnClose
      width={480}
    >
      <div style={{ marginTop: 16 }}>
        <Alert
          message="Cambio obligatorio al ingresar"
          description={
            <span>
              El usuario <strong>{usuario?.username}</strong> ({usuario?.email}) recibirá esta contraseña provisional. Al iniciar sesión, el sistema le exigirá definir una contraseña personal privada.
            </span>
          }
          type="info"
          showIcon
          style={{ marginBottom: 20, borderRadius: 8 }}
        />

        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: '#334155' }}>
              NUEVA CONTRASEÑA PROVISIONAL
            </label>
            <Button
              type="link"
              size="small"
              icon={<ReloadOutlined />}
              onClick={generarPassword}
              style={{ fontSize: 11.5, color: '#0284c7', padding: 0 }}
            >
              Generar otra clave
            </Button>
          </div>

          <Form.Item
            name="newPassword"
            rules={[
              { required: true, message: 'La contraseña es requerida' },
              { min: 6, message: 'Debe tener al menos 6 caracteres' },
            ]}
          >
            <Input.Password
              size="large"
              prefix={<LockOutlined style={{ color: '#0284c7', marginRight: 6 }} />}
              placeholder="Ej. ViteLab2026!"
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 10,
              paddingTop: 14,
              borderTop: '1px solid #f1f5f9',
            }}
          >
            <Button
              icon={copied ? <CheckCircleOutlined style={{ color: '#059669' }} /> : <CopyOutlined />}
              onClick={handleCopy}
              style={{ borderRadius: 6 }}
            >
              {copied ? 'Copiada' : 'Copiar clave'}
            </Button>

            <Space>
              <Button onClick={onCancel} style={{ borderRadius: 6 }}>
                Cancelar
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={restablecerMutation.isPending}
                style={{
                  borderRadius: 6,
                  backgroundColor: '#0284c7',
                  borderColor: '#0284c7',
                  fontWeight: 600,
                }}
              >
                Guardar y Restablecer
              </Button>
            </Space>
          </div>
        </Form>
      </div>
    </Modal>
  );
};
