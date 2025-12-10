import { useEffect } from 'react';
import { Modal, Form, Input, Switch, Select, Row, Col, Button, Space, InputNumber, Divider, Typography } from 'antd';
import { PlusOutlined, MinusCircleOutlined, AlertOutlined } from '@ant-design/icons';
import { useAreasActivas } from '../../areas/hooks';
import { useMetodosActivos } from '../../metodos/hooks';
import { useMuestrasActivas } from '../../muestras/hooks';
import type { Componente, CreateComponenteInput, UpdateComponenteInput } from '../types';

const { Text } = Typography;

interface ComponenteFormModalProps {
  open: boolean;
  componente: Componente | null;
  onCancel: () => void;
  onSubmit: (data: CreateComponenteInput | UpdateComponenteInput) => void;
  loading?: boolean;
}

export const ComponenteFormModal: React.FC<ComponenteFormModalProps> = ({
  open,
  componente,
  onCancel,
  onSubmit,
  loading = false,
}) => {
  const [form] = Form.useForm();
  const { data: areasList, isLoading: loadingAreas } = useAreasActivas();
  const { data: metodosList, isLoading: loadingMetodos } = useMetodosActivos();
  const { data: muestrasList, isLoading: loadingMuestras } = useMuestrasActivas();

  useEffect(() => {
    if (open && componente) {
      form.setFieldsValue({
        nombre: componente.nombre,
        valores_referenciales: componente.valores_referenciales || [],
        unidad_medida: componente.unidad_medida,
        area_id: componente.area_id,
        metodo_id: componente.metodo_id,
        muestras_ids: componente.muestras_ids || [],
        valor_alerta_min: componente.valor_alerta_min,
        valor_alerta_max: componente.valor_alerta_max,
        activo: componente.activo,
      });
    } else if (open) {
      form.resetFields();
      form.setFieldsValue({
        valores_referenciales: [''],
        muestras_ids: [],
      });
    }
  }, [open, componente, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      // Filtrar valores vacíos
      const valoresReferenciales = (values.valores_referenciales || []).filter(
        (v: string) => v && v.trim() !== ''
      );
      
      // Asegurar que los valores de alerta sean números o null
      const valor_alerta_min = values.valor_alerta_min !== null && values.valor_alerta_min !== undefined && values.valor_alerta_min !== ''
        ? Number(values.valor_alerta_min) 
        : null;
      const valor_alerta_max = values.valor_alerta_max !== null && values.valor_alerta_max !== undefined && values.valor_alerta_max !== ''
        ? Number(values.valor_alerta_max) 
        : null;
      
      onSubmit({
        ...values,
        valores_referenciales: valoresReferenciales,
        valor_alerta_min,
        valor_alerta_max,
      });
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
        initialValues={{ activo: true, valores_referenciales: [''], muestras_ids: [] }}
      >
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

        <Form.Item label="Valores Referenciales" tooltip="Ingrese uno o más rangos de valores">
          <Form.List name="valores_referenciales">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item
                      {...restField}
                      name={name}
                      style={{ marginBottom: 0, width: 300 }}
                    >
                      <Input placeholder="Ej: 10-20, 21-40, < 100, Negativo" />
                    </Form.Item>
                    {fields.length > 1 && (
                      <MinusCircleOutlined onClick={() => remove(name)} style={{ color: '#ff4d4f' }} />
                    )}
                  </Space>
                ))}
                <Button type="dashed" onClick={() => add('')} block icon={<PlusOutlined />}>
                  Agregar valor referencial
                </Button>
              </>
            )}
          </Form.List>
        </Form.Item>

        <Form.Item
          label="Unidad de Medida"
          name="unidad_medida"
        >
          <Input placeholder="Ej: mg/dL, g/dL, %" style={{ width: 200 }} />
        </Form.Item>

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

        <Form.Item
          label="Muestras"
          name="muestras_ids"
          tooltip="Tipos de muestra que pueden usarse para este componente"
        >
          <Select
            mode="multiple"
            placeholder="Seleccione las muestras"
            loading={loadingMuestras}
            allowClear
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={muestrasList?.map((m) => ({
              label: m.nombre,
              value: m.id,
            }))}
          />
        </Form.Item>

        <Divider orientation="left">
          <Space>
            <AlertOutlined style={{ color: '#faad14' }} />
            <Text type="secondary">Alertas de Valores Críticos</Text>
          </Space>
        </Divider>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Valor Mínimo de Alerta"
              name="valor_alerta_min"
              tooltip="Si el resultado es menor a este valor, se mostrará una alerta"
            >
              <InputNumber
                placeholder="Ej: 70"
                style={{ width: '100%' }}
                precision={4}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Valor Máximo de Alerta"
              name="valor_alerta_max"
              tooltip="Si el resultado es mayor a este valor, se mostrará una alerta"
            >
              <InputNumber
                placeholder="Ej: 110"
                style={{ width: '100%' }}
                precision={4}
              />
            </Form.Item>
          </Col>
        </Row>

        {componente && (
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
