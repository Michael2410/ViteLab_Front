import { useEffect } from 'react';
import { Modal, Form, Input, Switch, Select, InputNumber, Row, Col } from 'antd';
import { useAnalisisActivos } from '../../analisis/hooks';
import { useAreasActivas } from '../../areas/hooks';
import { useMetodosActivos } from '../../metodos/hooks';
import type { Componente, CreateComponenteInput, UpdateComponenteInput } from '../types';

interface ComponenteFormModalProps {
  open: boolean;
  componente: Componente | null;
  onCancel: () => void;
  onSubmit: (data: CreateComponenteInput | UpdateComponenteInput) => void;
  loading?: boolean;
  analisisId?: number; // Para preseleccionar el análisis si viene desde la página de análisis
}

export const ComponenteFormModal: React.FC<ComponenteFormModalProps> = ({
  open,
  componente,
  onCancel,
  onSubmit,
  loading = false,
  analisisId,
}) => {
  const [form] = Form.useForm();
  const { data: analisisList, isLoading: loadingAnalisis } = useAnalisisActivos();
  const { data: areasList, isLoading: loadingAreas } = useAreasActivas();
  const { data: metodosList, isLoading: loadingMetodos } = useMetodosActivos();

  useEffect(() => {
    if (open && componente) {
      form.setFieldsValue({
        analisis_id: componente.analisis_id,
        nombre: componente.nombre,
        valor_referencial: componente.valor_referencial,
        unidad_medida: componente.unidad_medida,
        area_id: componente.area_id,
        metodo_id: componente.metodo_id,
        orden: componente.orden,
        activo: componente.activo,
      });
    } else if (open) {
      form.resetFields();
      if (analisisId) {
        form.setFieldValue('analisis_id', analisisId);
      }
    }
  }, [open, componente, form, analisisId]);

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
      title={componente ? 'Editar Componente' : 'Nuevo Componente'}
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={loading}
      width={700}
      okText={componente ? 'Actualizar' : 'Crear'}
      cancelText="Cancelar"
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ activo: true, orden: 0 }}
      >
        <Form.Item
          label="Análisis"
          name="analisis_id"
          rules={[
            { required: true, message: 'Por favor seleccione un análisis' },
          ]}
        >
          <Select
            placeholder="Seleccione un análisis"
            loading={loadingAnalisis}
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={analisisList?.map((a) => ({
              label: a.nombre,
              value: a.id,
            }))}
          />
        </Form.Item>

        <Form.Item
          label="Nombre del Componente"
          name="nombre"
          rules={[
            { required: true, message: 'Por favor ingrese el nombre' },
            { max: 200, message: 'El nombre no puede exceder 200 caracteres' },
          ]}
        >
          <Input placeholder="Ej: Hemoglobina, Glucosa, Colesterol Total" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Valor Referencial"
              name="valor_referencial"
              tooltip="Ej: 70-100, < 200, > 40"
              rules={[
                { max: 200, message: 'El valor no puede exceder 200 caracteres' },
              ]}
            >
              <Input placeholder="Ej: 12.0 - 16.0, < 200" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Unidad de Medida"
              name="unidad_medida"
              rules={[
                { max: 50, message: 'La unidad no puede exceder 50 caracteres' },
              ]}
            >
              <Input placeholder="Ej: mg/dL, g/dL, %" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Área"
              name="area_id"
            >
              <Select
                placeholder="Seleccione un área"
                loading={loadingAreas}
                allowClear
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={areasList?.map((a) => ({
                  label: a.nombre,
                  value: a.id,
                }))}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Método"
              name="metodo_id"
            >
              <Select
                placeholder="Seleccione un método"
                loading={loadingMetodos}
                allowClear
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={metodosList?.map((m) => ({
                  label: m.nombre,
                  value: m.id,
                }))}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Orden"
              name="orden"
              tooltip="Orden de visualización dentro del análisis"
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          {componente && (
            <Col span={12}>
              <Form.Item
                label="Estado"
                name="activo"
                valuePropName="checked"
              >
                <Switch checkedChildren="Activo" unCheckedChildren="Inactivo" />
              </Form.Item>
            </Col>
          )}
        </Row>
      </Form>
    </Modal>
  );
};
