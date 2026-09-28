import React, { useEffect, useState } from 'react';
import { 
  Modal, Form, Input, Switch, Select, Tag, Button, 
  Table, Row, Col, message, Typography, Tooltip 
} from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  ExperimentOutlined, 
  AppstoreOutlined, 
  CheckOutlined 
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { Analisis, CreateAnalisisInput, UpdateAnalisisInput } from '../types';
import { useComponentes } from '../../componentes/hooks';
import { brandButtonStyle } from '../../../../shared/components/ModulePageLayout';

const { Text } = Typography;

const parseValorReferencial = (c: any): string | undefined => {
  if (!c) return undefined;
  if (Array.isArray(c.valores_referenciales) && c.valores_referenciales.length > 0) {
    return c.valores_referenciales.filter(Boolean).join(', ') || undefined;
  }
  if (typeof c.valores_referenciales === 'string' && c.valores_referenciales.trim()) {
    return c.valores_referenciales.trim();
  }
  if (Array.isArray(c.valor_referencial) && c.valor_referencial.length > 0) {
    return c.valor_referencial.filter(Boolean).join(', ') || undefined;
  }
  if (typeof c.valor_referencial === 'string' && c.valor_referencial.trim()) {
    return c.valor_referencial.trim();
  }
  return undefined;
};

interface ComponenteTemp {
  key: string;
  id?: number; // ID del componente si ya existe en la BD
  nombre: string;
  valor_referencial?: string;
  unidad_medida?: string;
  area_id?: number;
  metodo_id?: number;
  area?: { id: number; nombre: string };
  metodo?: { id: number; nombre: string };
  orden: number;
}

interface AnalisisFormModalProps {
  open: boolean;
  analisis: Analisis | null;
  onCancel: () => void;
  onSubmit: (data: CreateAnalisisInput | UpdateAnalisisInput) => void;
  loading?: boolean;
}

export const AnalisisFormModal: React.FC<AnalisisFormModalProps> = ({
  open,
  analisis,
  onCancel,
  onSubmit,
  loading = false,
}) => {
  const [form] = Form.useForm();
  const [componentes, setComponentes] = useState<ComponenteTemp[]>([]);
  const [componenteSeleccionado, setComponenteSeleccionado] = useState<number | undefined>();
  
  const { data: componentesDisponibles } = useComponentes({ activo: true });

  useEffect(() => {
    if (open && analisis) {
      form.setFieldsValue({
        nombre: analisis.nombre,
        descripcion: analisis.descripcion,
        sinonimia: analisis.sinonimia || [],
        activo: analisis.activo ?? true,
      });
      
      // Cargar componentes existentes del análisis
      if (analisis.componentes && analisis.componentes.length > 0) {
        const componentesExistentes = analisis.componentes.map((comp: any, idx: number) => ({
          key: `existing_${comp.id || idx}`,
          id: comp.id,
          nombre: comp.nombre,
          valor_referencial: parseValorReferencial(comp),
          unidad_medida: comp.unidad_medida || undefined,
          area_id: comp.area_id || undefined,
          metodo_id: comp.metodo_id || undefined,
          area: comp.area,
          metodo: comp.metodo,
          orden: comp.orden || idx + 1,
        }));
        setComponentes(componentesExistentes);
      } else {
        setComponentes([]);
      }
    } else if (open) {
      form.resetFields();
      form.setFieldsValue({ activo: true, sinonimia: [] });
      setComponentes([]);
    }
  }, [open, analisis, form]);

  const handleAgregarComponente = () => {
    if (!componenteSeleccionado) {
      message.warning('Por favor selecciona un componente');
      return;
    }

    const componente = componentesDisponibles?.find(c => c.id === componenteSeleccionado);
    if (!componente) return;

    // Verificar si ya está agregado
    if (componentes.find(c => c.id === componente.id)) {
      message.warning('Este componente ya está agregado');
      return;
    }

    const nuevoComponente: ComponenteTemp = {
      key: `comp_${componente.id}`,
      id: componente.id,
      nombre: componente.nombre,
      valor_referencial: parseValorReferencial(componente),
      unidad_medida: componente.unidad_medida || undefined,
      area_id: componente.area_id || undefined,
      metodo_id: componente.metodo_id || undefined,
      area: componente.area,
      metodo: componente.metodo,
      orden: componentes.length + 1,
    };

    setComponentes([...componentes, nuevoComponente]);
    setComponenteSeleccionado(undefined);
    message.success('Componente agregado');
  };

  const handleEliminarComponente = (key: string) => {
    const filtrados = componentes.filter(c => c.key !== key);
    // Reasignar orden secuencial
    const reordenados = filtrados.map((item, index) => ({
      ...item,
      orden: index + 1,
    }));
    setComponentes(reordenados);
    message.success('Componente eliminado');
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      
      // Incluir los IDs de componentes seleccionados
      const dataToSubmit = {
        ...values,
        componentes_ids: componentes.map(comp => comp.id).filter((id): id is number => id !== undefined),
      };
      
      onSubmit(dataToSubmit);
    } catch (error) {
      console.error('Error de validación:', error);
    }
  };

  const columnasComponentes: ColumnsType<ComponenteTemp> = [
    {
      title: '#',
      dataIndex: 'orden',
      key: 'orden',
      width: 50,
      align: 'center',
      render: (orden) => (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 24,
            height: 24,
            borderRadius: '50%',
            backgroundColor: '#f1f5f9',
            color: '#475569',
            fontWeight: 700,
            fontSize: 12,
          }}
        >
          {orden}
        </span>
      ),
    },
    {
      title: 'Componente / Analito',
      dataIndex: 'nombre',
      key: 'nombre',
      render: (nombre) => <Text strong style={{ color: '#0f172a' }}>{nombre}</Text>,
    },
    {
      title: 'Valor Referencial',
      dataIndex: 'valor_referencial',
      key: 'valor_referencial',
      width: 170,
      render: (val) => val ? (
        <span style={{ fontSize: 13, color: '#334155' }}>{val}</span>
      ) : (
        <Text type="secondary">-</Text>
      ),
    },
    {
      title: 'Unidad',
      dataIndex: 'unidad_medida',
      key: 'unidad_medida',
      width: 100,
      render: (val) => val ? (
        <Tag color="default" style={{ borderRadius: 4, fontWeight: 600 }}>{val}</Tag>
      ) : (
        <Text type="secondary">-</Text>
      ),
    },
    {
      title: 'Área Técnica',
      dataIndex: 'area',
      key: 'area',
      width: 140,
      render: (area) => area ? (
        <Tag color="blue" style={{ borderRadius: 4 }}>{area.nombre}</Tag>
      ) : (
        <Text type="secondary">-</Text>
      ),
    },
    {
      title: 'Método',
      dataIndex: 'metodo',
      key: 'metodo',
      width: 140,
      render: (metodo) => metodo ? (
        <Tag color="cyan" style={{ borderRadius: 4 }}>{metodo.nombre}</Tag>
      ) : (
        <Text type="secondary">-</Text>
      ),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 70,
      align: 'center',
      render: (_, record) => (
        <Tooltip title="Eliminar componente">
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleEliminarComponente(record.key)}
            style={{ borderRadius: 6 }}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      centered
      width={800}
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
            <ExperimentOutlined />
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>
              {analisis ? 'Editar Análisis Clínico' : 'Nuevo Análisis Clínico'}
            </div>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 400, marginTop: 2 }}>
              {analisis 
                ? 'Modifique los parámetros generales y componentes vinculados al examen' 
                : 'Defina los datos generales y analitos que componen esta prueba clínica'}
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
            {analisis ? 'Actualizar Análisis' : 'Crear Análisis'}
          </Button>
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ activo: true, sinonimia: [] }}
        requiredMark="optional"
      >
        {/* SECCIÓN 1: DATOS GENERALES */}
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
            Información del Análisis
          </div>

          <Row gutter={16}>
            <Col span={analisis ? 17 : 24}>
              <Form.Item
                label={<span style={{ fontWeight: 600, fontSize: 13, color: '#334155' }}>Nombre del Análisis</span>}
                name="nombre"
                rules={[
                  { required: true, message: 'Por favor ingrese el nombre del análisis' },
                  { max: 200, message: 'El nombre no puede exceder 200 caracteres' },
                ]}
                style={{ marginBottom: 14 }}
              >
                <Input 
                  placeholder="Ej: Hemograma Completo, Glucosa en Sangre, Perfil Lipídico" 
                  style={{ borderRadius: 8, height: 38 }}
                />
              </Form.Item>
            </Col>

            {analisis && (
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

            <Col span={24}>
              <Form.Item
                label={<span style={{ fontWeight: 600, fontSize: 13, color: '#334155' }}>Descripción o Notas del Examen</span>}
                name="descripcion"
                rules={[
                  { max: 500, message: 'La descripción no puede exceder 500 caracteres' },
                ]}
                style={{ marginBottom: 14 }}
              >
                <Input.TextArea
                  rows={2}
                  placeholder="Instrucciones clínicas, metodología básica o notas generales (opcional)"
                  style={{ borderRadius: 8 }}
                  maxLength={500}
                  showCount
                />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                label={<span style={{ fontWeight: 600, fontSize: 13, color: '#334155' }}>Sinonimia / Palabras Clave de Búsqueda</span>}
                name="sinonimia"
                tooltip="Escriba un alias o término equivalente y presione Enter para agregarlo"
                style={{ marginBottom: 0 }}
              >
                <Select
                  mode="tags"
                  placeholder="Ej: HGB, Glicemia, Azúcar en sangre (presione Enter)"
                  tokenSeparators={[',']}
                  style={{ width: '100%' }}
                  tagRender={(props) => (
                    <Tag
                      color="blue"
                      closable={props.closable}
                      onClose={props.onClose}
                      style={{ marginRight: 4, borderRadius: 4, fontWeight: 500 }}
                    >
                      {props.label}
                    </Tag>
                  )}
                />
              </Form.Item>
            </Col>
          </Row>
        </div>

        <div style={{ height: 1, backgroundColor: '#f1f5f9', margin: '18px 0' }} />

        {/* SECCIÓN 2: COMPONENTES / ANALITOS ASOCIADOS */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#059669',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
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
              Componentes del Análisis (Analitos)
            </div>
            <Tag color="cyan" style={{ borderRadius: 6, fontWeight: 700, fontSize: 11 }}>
              {componentes.length} {componentes.length === 1 ? 'componente' : 'componentes'}
            </Tag>
          </div>

          {/* Selector para agregar nuevo componente */}
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              padding: '8px 10px',
              marginBottom: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <Select
              placeholder="Buscar y seleccionar un componente para vincular a este análisis..."
              showSearch
              style={{ flex: 1 }}
              value={componenteSeleccionado}
              onChange={setComponenteSeleccionado}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={componentesDisponibles
                ?.filter(c => !componentes.find(comp => comp.id === c.id))
                ?.map(c => ({
                  label: `${c.nombre} ${c.unidad_medida ? `(${c.unidad_medida})` : ''}`,
                  value: c.id,
                }))}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAgregarComponente}
              style={{
                borderRadius: 8,
                backgroundColor: '#0284c7',
                fontWeight: 600,
                height: 34,
              }}
            >
              Agregar
            </Button>
          </div>

          {/* Tabla o estado vacío */}
          {componentes.length > 0 ? (
            <div
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                overflow: 'hidden',
              }}
            >
              <Table
                columns={columnasComponentes}
                dataSource={componentes}
                pagination={false}
                size="small"
                scroll={{ x: 750 }}
              />
            </div>
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '24px 16px',
                background: '#f8fafc',
                borderRadius: 8,
                border: '1px dashed #cbd5e1',
              }}
            >
              <AppstoreOutlined style={{ fontSize: 26, color: '#94a3b8', marginBottom: 6, display: 'inline-block' }} />
              <div style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>
                Sin componentes vinculados
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                Utilice el selector superior para asociar los analitos que integran este examen.
              </div>
            </div>
          )}
        </div>
      </Form>
    </Modal>
  );
};
