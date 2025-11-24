import { useState } from 'react';
import {
  Form,
  Button,
  Card,
  Row,
  Col,
  Select,
  Input,
  Space,
  Typography,
  Divider,
  Steps,
  message,
} from 'antd';
import {
  SaveOutlined,
  ArrowLeftOutlined,
  UserOutlined,
  HomeOutlined,
  ExperimentOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { BuscarPaciente } from '../components/BuscarPaciente';
import { SeleccionAnalisis } from '../components/SeleccionAnalisis';
import {
  useCrearOrden,
  useSedesActivas,
  useTiposClienteActivos,
  useConveniosActivos,
} from '../hooks';
import type { CreateOrdenInput, PacienteFormInput } from '../types';

const { Title, Text } = Typography;
const { TextArea } = Input;

export const NuevaOrdenPage: React.FC = () => {
  const navigate = useNavigate();
  const [formPaciente] = Form.useForm();
  const [formOrden] = Form.useForm();

  const [currentStep, setCurrentStep] = useState(0);
  const [analisisSeleccionados, setAnalisisSeleccionados] = useState<number[]>([]);

  const crearOrdenMutation = useCrearOrden();
  const { data: sedes, isLoading: loadingSedes } = useSedesActivas();
  const { data: tiposCliente, isLoading: loadingTipos } = useTiposClienteActivos();
  const { data: convenios, isLoading: loadingConvenios } = useConveniosActivos();

  const steps = [
    {
      title: 'Paciente',
      icon: <UserOutlined />,
    },
    {
      title: 'Datos de Orden',
      icon: <HomeOutlined />,
    },
    {
      title: 'Análisis',
      icon: <ExperimentOutlined />,
    },
  ];

  const handleNextStep = async () => {
    try {
      if (currentStep === 0) {
        // Validar formulario de paciente
        await formPaciente.validateFields();
        setCurrentStep(1);
      } else if (currentStep === 1) {
        // Validar formulario de orden
        await formOrden.validateFields();
        setCurrentStep(2);
      }
    } catch (error) {
      message.error('Por favor complete todos los campos obligatorios');
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    try {
      // Validar que se hayan seleccionado análisis
      if (analisisSeleccionados.length === 0) {
        message.error('Debe seleccionar al menos un análisis');
        return;
      }

      // Obtener valores de ambos formularios
      const pacienteValues = await formPaciente.validateFields();
      const ordenValues = await formOrden.validateFields();

      // Preparar datos del paciente
      const pacienteData: PacienteFormInput = {
        dni: pacienteValues.dni,
        nombres: pacienteValues.nombres,
        apellidos: pacienteValues.apellidos,
        fecha_nacimiento: pacienteValues.fecha_nacimiento
          ? dayjs(pacienteValues.fecha_nacimiento).format('YYYY-MM-DD')
          : '',
        sexo: pacienteValues.sexo,
        telefono: pacienteValues.telefono || undefined,
        email: pacienteValues.email || undefined,
        direccion: pacienteValues.direccion || undefined,
      };

      // Preparar datos de la orden
      const ordenData: CreateOrdenInput = {
        paciente: pacienteData,
        sede_id: ordenValues.sede_id,
        tipo_cliente_id: ordenValues.tipo_cliente_id,
        convenio_id: ordenValues.convenio_id || undefined,
        analisis_ids: analisisSeleccionados,
        observaciones: ordenValues.observaciones || undefined,
      };

      // Crear orden
      const ordenCreada = await crearOrdenMutation.mutateAsync(ordenData);

      message.success(`Orden ${ordenCreada.numero_orden} creada exitosamente`);
      
      // Redirigir al detalle de la orden
      navigate(`/ordenes/${ordenCreada.id}`);
    } catch (error: any) {
      console.error('Error al crear orden:', error);
      message.error(error.response?.data?.message || 'Error al crear la orden');
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/ordenes')}
          style={{ marginBottom: 16 }}
        >
          Volver
        </Button>

        <Title level={2}>Nueva Orden de Atención</Title>
        <Text type="secondary">
          Complete los datos del paciente, seleccione los análisis y registre la orden
        </Text>
      </div>

      {/* Steps */}
      <Card style={{ marginBottom: 24 }}>
        <Steps current={currentStep} items={steps} />
      </Card>

      {/* Step 0: Datos del Paciente */}
      {currentStep === 0 && (
        <div>
          <BuscarPaciente />

          <div style={{ marginTop: 24, textAlign: 'right' }}>
            <Button type="primary" size="large" onClick={handleNextStep}>
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {/* Step 1: Datos de la Orden */}
      {currentStep === 1 && (
        <div>
          <Card title="Información de la Orden" bordered={false}>
            <Form form={formOrden} layout="vertical">
              <Row gutter={16}>
                <Col xs={24} md={8}>
                  <Form.Item
                    label="Sede"
                    name="sede_id"
                    rules={[{ required: true, message: 'La sede es obligatoria' }]}
                  >
                    <Select
                      placeholder="Seleccione sede"
                      loading={loadingSedes}
                      options={sedes?.map((sede) => ({
                        label: sede.nombre,
                        value: sede.id,
                      }))}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item
                    label="Tipo de Cliente"
                    name="tipo_cliente_id"
                    rules={[{ required: true, message: 'El tipo de cliente es obligatorio' }]}
                  >
                    <Select
                      placeholder="Seleccione tipo de cliente"
                      loading={loadingTipos}
                      options={tiposCliente?.map((tipo) => ({
                        label: tipo.nombre,
                        value: tipo.id,
                      }))}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item label="Convenio" name="convenio_id">
                    <Select
                      placeholder="Sin convenio"
                      loading={loadingConvenios}
                      allowClear
                      options={convenios?.map((convenio) => ({
                        label: convenio.nombre,
                        value: convenio.id,
                      }))}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row>
                <Col span={24}>
                  <Form.Item label="Observaciones" name="observaciones">
                    <TextArea
                      rows={3}
                      placeholder="Observaciones adicionales (opcional)"
                      maxLength={500}
                      showCount
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Card>

          <div style={{ marginTop: 24, textAlign: 'right' }}>
            <Space>
              <Button onClick={handlePrevStep}>Anterior</Button>
              <Button type="primary" size="large" onClick={handleNextStep}>
                Siguiente
              </Button>
            </Space>
          </div>
        </div>
      )}

      {/* Step 2: Selección de Análisis */}
      {currentStep === 2 && (
        <div>
          <SeleccionAnalisis
            analisisSeleccionados={analisisSeleccionados}
            onAnalisisChange={setAnalisisSeleccionados}
          />

          <Divider />

          <div style={{ textAlign: 'right' }}>
            <Space size="large">
              <Button size="large" onClick={handlePrevStep}>
                Anterior
              </Button>
              <Button
                type="primary"
                size="large"
                icon={<SaveOutlined />}
                loading={crearOrdenMutation.isPending}
                onClick={handleSubmit}
                disabled={analisisSeleccionados.length === 0}
              >
                Registrar Orden
              </Button>
            </Space>
          </div>
        </div>
      )}
    </div>
  );
};
