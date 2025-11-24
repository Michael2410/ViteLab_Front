import { useEffect, useState } from 'react';
import { 
  Modal, Form, Input, Switch, Select, Tag, Button, 
  Table, Space, Divider, Card, Row, Col, message 
} from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { Analisis, CreateAnalisisInput, UpdateAnalisisInput } from '../types';
import { useComponentes } from '../../componentes/hooks';

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
        activo: analisis.activo,
      });
      
      // Cargar componentes existentes del análisis
      if (analisis.componentes && analisis.componentes.length > 0) {
        const componentesExistentes = analisis.componentes.map((comp) => ({
          key: `existing_${comp.id}`,
          id: comp.id,
          nombre: comp.nombre,
          valor_referencial: comp.valor_referencial || undefined,
          unidad_medida: comp.unidad_medida || undefined,
          area_id: comp.area_id || undefined,
          metodo_id: comp.metodo_id || undefined,
          area: comp.area,
          metodo: comp.metodo,
          orden: comp.orden,
        }));
        setComponentes(componentesExistentes);
      } else {
        setComponentes([]);
      }
    } else if (open) {
      form.resetFields();
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
      valor_referencial: componente.valor_referencial || undefined,
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
    setComponentes(componentes.filter(c => c.key !== key));
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
      title: 'Orden',
      dataIndex: 'orden',
      key: 'orden',
      width: 80,
      align: 'center',
    },
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
      width: 200,
    },
    {
      title: 'Valor Referencial',
      dataIndex: 'valor_referencial',
      key: 'valor_referencial',
      width: 150,
      render: (val) => val || '-',
    },
    {
      title: 'Unidad',
      dataIndex: 'unidad_medida',
      key: 'unidad_medida',
      width: 100,
      render: (val) => val || '-',
    },
    {
      title: 'Área',
      dataIndex: 'area',
      key: 'area',
      width: 120,
      render: (area) => {
        return area ? <Tag color="blue">{area.nombre}</Tag> : '-';
      },
    },
    {
      title: 'Método',
      dataIndex: 'metodo',
      key: 'metodo',
      width: 120,
      render: (metodo) => {
        return metodo ? <Tag color="green">{metodo.nombre}</Tag> : '-';
      },
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 80,
      align: 'center',
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleEliminarComponente(record.key)}
        />
      ),
    },
  ];

  return (
    <Modal
      title={analisis ? 'Editar Análisis' : 'Nuevo Análisis'}
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={loading}
      width={1200}
      okText={analisis ? 'Actualizar' : 'Crear'}
      cancelText="Cancelar"
      style={{ top: 20 }}
    >
      <Row gutter={16}>
        <Col span={24}>
          <Form
            form={form}
            layout="vertical"
            initialValues={{ activo: true, sinonimia: [] }}
          >
            <Form.Item
              label="Nombre del Análisis"
              name="nombre"
              rules={[
                { required: true, message: 'Por favor ingrese el nombre' },
                { max: 200, message: 'El nombre no puede exceder 200 caracteres' },
              ]}
            >
              <Input placeholder="Ej: Hemograma Completo, Glucosa en Sangre" />
            </Form.Item>

            <Form.Item
              label="Descripción"
              name="descripcion"
              rules={[
                { max: 500, message: 'La descripción no puede exceder 500 caracteres' },
              ]}
            >
              <Input.TextArea
                rows={2}
                placeholder="Descripción del análisis (opcional)"
              />
            </Form.Item>

            <Row gutter={16}>
              <Col span={16}>
                <Form.Item
                  label="Sinonimia / Palabras Clave"
                  name="sinonimia"
                  tooltip="Ingrese palabras clave o sinónimos para facilitar la búsqueda"
                >
                  <Select
                    mode="tags"
                    placeholder="Ingrese sinónimos y presione Enter"
                    tokenSeparators={[',']}
                    style={{ width: '100%' }}
                    tagRender={(props) => (
                      <Tag
                        color="blue"
                        closable={props.closable}
                        onClose={props.onClose}
                        style={{ marginRight: 3 }}
                      >
                        {props.label}
                      </Tag>
                    )}
                  />
                </Form.Item>
              </Col>
              {analisis && (
                <Col span={8}>
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

          <Divider orientation="left">Componentes del Análisis (Opcional)</Divider>

          <Card size="small" style={{ marginBottom: 16 }}>
            <Space.Compact style={{ width: '100%' }}>
              <Select
                placeholder="Selecciona un componente para agregar"
                showSearch
                style={{ width: '100%' }}
                value={componenteSeleccionado}
                onChange={setComponenteSeleccionado}
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={componentesDisponibles
                  ?.filter(c => !componentes.find(comp => comp.id === c.id))
                  ?.map(c => ({
                    label: c.nombre,
                    value: c.id,
                  }))}
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAgregarComponente}
              >
                Agregar
              </Button>
            </Space.Compact>
          </Card>

          {componentes.length > 0 && (
            <Table
              columns={columnasComponentes}
              dataSource={componentes}
              pagination={false}
              size="small"
              bordered
              scroll={{ x: 800 }}
            />
          )}


        </Col>
      </Row>
    </Modal>
  );
};
