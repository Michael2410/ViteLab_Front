/**
 * Modal para enviar resultados por WhatsApp
 */

import React, { useEffect } from 'react';
import { Modal, Form, Input, Button, Typography, Space, Alert } from 'antd';
import { WhatsAppOutlined, SendOutlined } from '@ant-design/icons';
import { useSendWhatsAppResults, useWhatsAppStatus } from '../hooks';
import './WhatsAppSendModal.css';

const { Text } = Typography;

interface WhatsAppSendModalProps {
  open: boolean;
  onClose: () => void;
  ordenId: number;
  numeroAtencion: string;
  pacienteNombre: string;
  telefonoPaciente?: string;
}

export const WhatsAppSendModal: React.FC<WhatsAppSendModalProps> = ({
  open,
  onClose,
  ordenId,
  numeroAtencion,
  pacienteNombre,
  telefonoPaciente,
}) => {
  const [form] = Form.useForm();
  const sendMutation = useSendWhatsAppResults();
  const { data: status } = useWhatsAppStatus();

  // Pre-llenar el teléfono del paciente
  useEffect(() => {
    if (open && telefonoPaciente) {
      form.setFieldsValue({ phoneNumber: telefonoPaciente });
    }
  }, [open, telefonoPaciente, form]);

  const handleSubmit = async (values: { phoneNumber: string }) => {
    try {
      await sendMutation.mutateAsync({
        ordenId,
        phoneNumber: values.phoneNumber,
      });
      form.resetFields();
      onClose();
    } catch {
      // El error ya se maneja en el hook
    }
  };

  const isWhatsAppConnected = status?.isConnected;

  return (
    <Modal
      title={
        <Space>
          <WhatsAppOutlined style={{ color: '#25D366' }} />
          <span>Enviar Resultados por WhatsApp</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={450}
      centered
      destroyOnClose
    >
      {!isWhatsAppConnected ? (
        <Alert
          message="WhatsApp no está conectado"
          description="Para enviar resultados, primero debes vincular tu cuenta de WhatsApp desde el menú superior."
          type="warning"
          showIcon
          className="whatsapp-send-modal-info"
        />
      ) : (
        <>
          <div className="whatsapp-send-modal-info">
            <Text className="whatsapp-send-modal-label">Orden:</Text>
            <Text strong className="whatsapp-send-modal-value">{numeroAtencion}</Text>
          </div>
          <div className="whatsapp-send-modal-info">
            <Text className="whatsapp-send-modal-label">Paciente:</Text>
            <Text strong className="whatsapp-send-modal-value">{pacienteNombre}</Text>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{ phoneNumber: telefonoPaciente || '' }}
          >
            <Form.Item
              name="phoneNumber"
              label="Número de WhatsApp"
              rules={[
                { required: true, message: 'Ingresa el número de teléfono' },
                { 
                  pattern: /^\+?[0-9]{9,15}$/, 
                  message: 'Ingresa un número válido (ej: +51999888777)' 
                },
              ]}
              extra="Incluye el código de país (ej: +51 para Perú)"
            >
              <Input
                prefix={<WhatsAppOutlined className="whatsapp-icon" />}
                placeholder="+51999888777"
                size="large"
              />
            </Form.Item>

            <Form.Item className="whatsapp-send-modal-footer">
              <Space>
                <Button onClick={onClose}>
                  Cancelar
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SendOutlined />}
                  loading={sendMutation.isPending}
                  className="whatsapp-send-button"
                >
                  Enviar
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </>
      )}
    </Modal>
  );
};

export default WhatsAppSendModal;
