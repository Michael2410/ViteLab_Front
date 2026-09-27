import React, { useEffect } from 'react';
import {
  Modal,
  Form,
  DatePicker,
  Select,
  Input,
  Alert,
  Typography,
  Space,
  Tag,
} from 'antd';
import {
  UserDeleteOutlined,
  CalendarOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Personal, DarDeBajaPersonalInput } from '../../types';
import { useMotivosCese } from '../../hooks';

const { Text } = Typography;

interface DarDeBajaModalProps {
  open: boolean;
  personal: Personal | null;
  onClose: () => void;
  onConfirm: (data: DarDeBajaPersonalInput) => Promise<void>;
  loading?: boolean;
}

export const DarDeBajaModal: React.FC<DarDeBajaModalProps> = ({
  open,
  personal,
  onClose,
  onConfirm,
  loading = false,
}) => {
  const [form] = Form.useForm();
  const { data: catalogoMotivos = [], isLoading: loadingMotivos } = useMotivosCese(true);

  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldsValue({
        fecha_cese: dayjs(),
        motivo_cese_id: catalogoMotivos.length > 0 ? catalogoMotivos[0].id : undefined,
        observaciones_cese: '',
      });
    }
  }, [open, form, catalogoMotivos]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const selectedMotivo = catalogoMotivos.find((m) => m.id === values.motivo_cese_id);
      await onConfirm({
        fecha_cese: values.fecha_cese.format('YYYY-MM-DD'),
        motivo_cese_id: values.motivo_cese_id,
        motivo_cese: selectedMotivo?.nombre || '',
        observaciones_cese: values.observaciones_cese?.trim() || null,
      });
    } catch {
      // validation error
    }
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
            }}
          >
            <UserDeleteOutlined />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
              Dar de Baja a Colaborador
            </div>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 400 }}>
              Registro de cese laboral y revocación de accesos
            </div>
          </div>
        </div>
      }
      open={open && !!personal}
      onCancel={onClose}
      afterClose={() => form.resetFields()}
      onOk={handleSubmit}
      okText="Confirmar Baja Laboral"
      okButtonProps={{ danger: true, loading, style: { borderRadius: 8, fontWeight: 600 } }}
      cancelButtonProps={{ style: { borderRadius: 8 } }}
      width={520}
      destroyOnHidden
    >
      <div style={{ marginTop: 14 }}>
        {/* Ficha resumida del colaborador */}
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
            {personal?.nombres} {personal?.apellidos}
          </div>
          <Space size={6} style={{ marginTop: 4 }}>
            <Tag color="blue" style={{ borderRadius: 6, fontSize: 11 }}>
              {personal?.cargo || 'Sin cargo'}
            </Tag>
            <Tag color="cyan" style={{ borderRadius: 6, fontSize: 11 }}>
              {personal?.area || 'Laboratorio'}
            </Tag>
            {personal?.usuario && (
              <Tag color="orange" style={{ borderRadius: 6, fontSize: 11 }}>
                Cuenta: {personal?.usuario.username}
              </Tag>
            )}
          </Space>
        </div>

        {/* Advertencia de impacto */}
        <Alert
          type="warning"
          showIcon
          icon={<ExclamationCircleOutlined style={{ color: '#d97706' }} />}
          message="Impacto del Cese Laboral"
          description={
            <div style={{ fontSize: 12.5, color: '#4b5563', lineHeight: 1.45 }}>
              Al confirmar la baja, el colaborador pasará al estado <strong>Cesado / De Baja</strong>.
              {personal?.usuario && (
                <span> Su cuenta de sistema será <strong>inactivada de forma inmediata</strong> para impedir nuevos inicios de sesión.</span>
              )}
            </div>
          }
          style={{
            marginBottom: 16,
            borderRadius: 10,
            backgroundColor: '#fffbeb',
            border: '1px solid #fde68a',
          }}
        />

        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item
            name="fecha_cese"
            label={<Text strong style={{ fontSize: 12, color: '#334155' }}>Fecha de Cese / Último Día Laboral *</Text>}
            rules={[{ required: true, message: 'Seleccione la fecha de cese' }]}
          >
            <DatePicker
              format="DD/MM/YYYY"
              placeholder="Seleccionar fecha"
              style={{ width: '100%', borderRadius: 8 }}
              prefix={<CalendarOutlined style={{ color: '#94a3b8' }} />}
            />
          </Form.Item>

          <Form.Item
            name="motivo_cese_id"
            label={<Text strong style={{ fontSize: 12, color: '#334155' }}>Motivo de la Baja *</Text>}
            rules={[{ required: true, message: 'Seleccione el motivo de cese' }]}
          >
            <Select
              placeholder="Seleccionar motivo"
              loading={loadingMotivos}
              options={catalogoMotivos.map((m) => ({ label: m.nombre, value: m.id }))}
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item
            name="observaciones_cese"
            label={<Text strong style={{ fontSize: 12, color: '#334155' }}>Observaciones / Sustento (Opcional)</Text>}
          >
            <Input.TextArea
              rows={3}
              placeholder="Ej. Presentó carta de renuncia el día 20/09, constancia de entrega de cargo y uniforme conforme..."
              maxLength={300}
              showCount
              style={{ borderRadius: 8 }}
            />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
};
