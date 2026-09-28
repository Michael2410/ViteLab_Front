import React, { useEffect } from 'react';
import { 
  Modal, Form, Input, Switch, Select, Row, Col, 
  Button, InputNumber, Typography, Tooltip 
} from 'antd';
import { 
  PlusOutlined, 
  MinusCircleOutlined, 
  AlertOutlined, 
  AppstoreOutlined, 
  CheckOutlined 
} from '@ant-design/icons';
import { useAreasActivas } from '../../areas/hooks';
import { useMetodosActivos } from '../../metodos/hooks';
import { useMuestrasActivas } from '../../muestras/hooks';
import type { Componente, CreateComponenteInput, UpdateComponenteInput } from '../types';
import { brandButtonStyle } from '../../../../shared/components/ModulePageLayout';

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
        valores_referenciales: 
          componente.valores_referenciales && componente.valores_referenciales.length > 0 
            ? componente.valores_referenciales 
            : [''],
        unidad_medida: componente.unidad_medida || undefined,
        area_id: componente.area_id || undefined,
        metodo_id: componente.metodo_id || undefined,
        muestras_ids: componente.muestras_ids || [],
        valor_alerta_min: componente.valor_alerta_min,
        valor_alerta_max: componente.valor_alerta_max,
        activo: componente.activo ?? true,
      });
    } else if (open) {
      form.resetFields();
      form.setFieldsValue({
        activo: true,
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
        (v: string) => v && typeof v === 'string' && v.trim() !== ''
      );
      
      // Asegurar que los valores de alerta sean números o null
      const valor_alerta_min = 
        values.valor_alerta_min !== null && values.valor_alerta_min !== undefined && values.valor_alerta_min !== ''
          ? Number(values.valor_alerta_min) 
          : null;
      const valor_alerta_max = 
        values.valor_alerta_max !== null && values.valor_alerta_max !== undefined && values.valor_alerta_max !== ''
          ? Number(values.valor_alerta_max) 
          : null;
      
      onSubmit({
        ...values,
        valores_referenciales: valoresReferenciales,
        valor_alerta_min,
        valor_alerta_max,
        activo: values.activo !== undefined ? values.activo : true,
      });
    } catch (error) {
      console.error('Error de validación:', error);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      centered
      width={740}
      destroyOnClose
      styles={{
        header: {
          padding: '18px 24px 14px 24px',
          borderBottom: '1px solid #f1f5f9',
          marginBottom: 0,
        },
        body: {
          padding: '20px 24px',
          maxHeight: 'calc(85vh - 120px)',
          overflowY: 'auto',
        },
        footer: {
          padding: '14px 24px',
          borderTop: '1px solid #f1f5f9',
          marginTop: 0,
        },
      }}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0284c7',
              fontSize: 20,
              flexShrink: 0,
            }}
          >
            <AppstoreOutlined />
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>
              {componente ? 'Editar Componente / Analito' : 'Nuevo Componente / Analito'}
            </div>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 400, marginTop: 2 }}>
              {componente 
                ? 'Actualice las especificaciones técnicas, rangos referenciales y alertas críticas' 
                : 'Defina las propiedades analíticas, valores de referencia y métodos de procesamiento'}
            </div>
          </div>
        </div>
      }
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Button onClick={onCancel} style={{ borderRadius: 8, height: 38, padding: '0 18px' }}>
            Cancelar
          </Button>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            loading={loading}
            onClick={handleOk}
            style={brandButtonStyle}
          >
            {componente ? 'Actualizar Componente' : 'Crear Componente'}
          </Button>
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ activo: true, valores_referenciales: [''], muestras_ids: [] }}
        requiredMark="optional"
      >
        {/* SECCIÓN 1: IDENTIFICACIÓN DEL COMPONENTE */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#0284c7',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                backgroundColor: '#0284c7',
                display: 'inline-block',
              }}
            />
            Datos Generales
          </div>

          <Row gutter={16}>
            <Col span={componente ? 11 : 16}>
              <Form.Item
                label={<span style={{ fontWeight: 600, fontSize: 13, color: '#334155' }}>Nombre del Componente</span>}
                name="nombre"
                rules={[
                  { required: true, message: 'Por favor ingrese el nombre del componente' },
                  { max: 200, message: 'El nombre no puede exceder 200 caracteres' },
                ]}
                style={{ marginBottom: 14 }}
              >
                <Input 
                  placeholder="Ej: Hemoglobina, Glucosa, Leucocitos" 
                  style={{ borderRadius: 8, height: 38 }}
                />
              </Form.Item>
            </Col>

            <Col span={componente ? 6 : 8}>
              <Form.Item
                label={<span style={{ fontWeight: 600, fontSize: 13, color: '#334155' }}>Unidad de Medida</span>}
                name="unidad_medida"
                rules={[{ max: 50, message: 'Máximo 50 caracteres' }]}
                style={{ marginBottom: 14 }}
              >
                <Input 
                  placeholder="Ej: mg/dL, g/dL, %" 
                  style={{ borderRadius: 8, height: 38 }}
                />
              </Form.Item>
            </Col>

            {componente && (
              <Col span={7}>
                <Form.Item
                  label={<span style={{ fontWeight: 600, fontSize: 13, color: '#334155' }}>Estado en Catálogo</span>}
                  style={{ marginBottom: 14 }}
                >
                  <div
                    style={{
                      height: 38,
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: '#f8fafc',
                      padding: '0 12px',
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span style={{ fontSize: 12, color: '#64748b' }}>Habilitado</span>
                    <Form.Item name="activo" valuePropName="checked" noStyle>
                      <Switch checkedChildren="Activo" unCheckedChildren="Inactivo" />
                    </Form.Item>
                  </div>
                </Form.Item>
              </Col>
            )}
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={<span style={{ fontWeight: 600, fontSize: 13, color: '#334155' }}>Área Técnica</span>}
                name="area_id"
                style={{ marginBottom: 14 }}
              >
                <Select
                  placeholder="Seleccione el área técnica"
                  loading={loadingAreas}
                  allowClear
                  showSearch
                  style={{ width: '100%' }}
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
                label={<span style={{ fontWeight: 600, fontSize: 13, color: '#334155' }}>Método / Técnica Analítica</span>}
                name="metodo_id"
                style={{ marginBottom: 14 }}
              >
                <Select
                  placeholder="Seleccione el método analítico"
                  loading={loadingMetodos}
                  allowClear
                  showSearch
                  style={{ width: '100%' }}
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

            <Col span={24}>
              <Form.Item
                label={<span style={{ fontWeight: 600, fontSize: 13, color: '#334155' }}>Muestras Biológicas Compatibles</span>}
                name="muestras_ids"
                tooltip="Muestras biológicas que pueden emplearse para el procesamiento de este analito"
                style={{ marginBottom: 0 }}
              >
                <Select
                  mode="multiple"
                  placeholder="Seleccione una o varias muestras permitidas..."
                  loading={loadingMuestras}
                  allowClear
                  showSearch
                  style={{ width: '100%' }}
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={muestrasList?.map((m) => ({
                    label: m.nombre,
                    value: m.id,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>
        </div>

        <div style={{ height: 1, backgroundColor: '#f1f5f9', margin: '18px 0' }} />

        {/* SECCIÓN 2: VALORES REFERENCIALES */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#059669',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                backgroundColor: '#059669',
                display: 'inline-block',
              }}
            />
            Valores de Referencia Biológica
          </div>

          <Form.Item
            tooltip="Rangos normales esperados. Puede agregar varios rangos por edad/sexo (ej: 70 - 100, < 200, Negativo)"
            style={{ marginBottom: 0 }}
          >
            <Form.List name="valores_referenciales">
              {(fields, { add, remove }) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {fields.map(({ key, name, ...restField }, idx) => (
                    <div
                      key={key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        backgroundColor: '#f8fafc',
                        padding: '6px 10px',
                        borderRadius: 8,
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#64748b',
                          backgroundColor: '#ffffff',
                          border: '1px solid #cbd5e1',
                          borderRadius: 4,
                          padding: '2px 6px',
                          flexShrink: 0,
                        }}
                      >
                        Rango {idx + 1}
                      </span>
                      <Form.Item
                        {...restField}
                        name={name}
                        style={{ marginBottom: 0, flex: 1 }}
                      >
                        <Input 
                          placeholder="Ej: 70 - 100, 12.0 - 16.0, < 150, Negativo" 
                          style={{ borderRadius: 6, border: '1px solid #cbd5e1' }}
                        />
                      </Form.Item>
                      {fields.length > 1 && (
                        <Tooltip title="Quitar rango">
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<MinusCircleOutlined />}
                            onClick={() => remove(name)}
                            style={{ borderRadius: 6 }}
                          />
                        </Tooltip>
                      )}
                    </div>
                  ))}

                  <Button
                    type="dashed"
                    onClick={() => add('')}
                    icon={<PlusOutlined />}
                    style={{
                      borderRadius: 8,
                      height: 36,
                      color: '#0284c7',
                      borderColor: '#93c5fd',
                      marginTop: 4,
                    }}
                  >
                    Agregar otro rango de referencia
                  </Button>
                </div>
              )}
            </Form.List>
          </Form.Item>
        </div>

        <div style={{ height: 1, backgroundColor: '#f1f5f9', margin: '18px 0' }} />

        {/* SECCIÓN 3: ALERTAS DE VALORES CRÍTICOS */}
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#d97706',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <AlertOutlined style={{ fontSize: 13, color: '#f59e0b' }} />
            Límites Críticos de Alerta (Valores de Pánico)
            <Text type="secondary" style={{ fontSize: 11, fontWeight: 400, textTransform: 'none', marginLeft: 4 }}>
              (Opcional)
            </Text>
          </div>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={<span style={{ fontWeight: 600, fontSize: 13, color: '#334155' }}>Límite Mínimo Crítico</span>}
                name="valor_alerta_min"
                tooltip="Resultados inferiores a este valor marcarán una alerta roja de pánico en la orden"
                style={{ marginBottom: 0 }}
              >
                <InputNumber
                  placeholder="Ej: 50"
                  style={{ width: '100%', borderRadius: 8, height: 38 }}
                  precision={4}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label={<span style={{ fontWeight: 600, fontSize: 13, color: '#334155' }}>Límite Máximo Crítico</span>}
                name="valor_alerta_max"
                tooltip="Resultados superiores a este valor marcarán una alerta roja de pánico en la orden"
                style={{ marginBottom: 0 }}
              >
                <InputNumber
                  placeholder="Ej: 400"
                  style={{ width: '100%', borderRadius: 8, height: 38 }}
                  precision={4}
                />
              </Form.Item>
            </Col>
          </Row>
        </div>
      </Form>
    </Modal>
  );
};
