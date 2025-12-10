import { useState, useEffect, useMemo } from 'react';
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
  AutoComplete,
  theme,
  Tag,
  Result,
} from 'antd';
import {
  SaveOutlined,
  ArrowLeftOutlined,
  UserOutlined,
  SolutionOutlined,
  ExperimentOutlined,
  RightOutlined,
  LeftOutlined,
  ShopOutlined,
  TeamOutlined,
  MedicineBoxOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useAuthStore } from '../../auth/hooks';
import { BuscarPaciente } from '../components/BuscarPaciente';
import { SeleccionAnalisis } from '../components/SeleccionAnalisis';
import {
  useCrearOrden,
  useSedesActivas,
  useTiposClienteActivos,
  useConveniosActivos,
  useMedicos,
} from '../hooks';
import type { CreateOrdenInput, PacienteFormInput, AnalisisSeleccionado } from '../types';

const { Title, Text } = Typography;
const { TextArea } = Input;

export const NuevaOrdenPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const { hasPermission } = useAuthStore();
  
  // --- Estado y Formularios ---
  const [formPaciente] = Form.useForm();
  const [formOrden] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [analisisSeleccionados, setAnalisisSeleccionados] = useState<AnalisisSeleccionado[]>([]);
  const [tipoClienteSeleccionado, setTipoClienteSeleccionado] = useState<number | null>(null);

  // --- Queries y Mutaciones ---
  const crearOrdenMutation = useCrearOrden();
  const { data: sedes, isLoading: loadingSedes } = useSedesActivas();
  const { data: tiposCliente, isLoading: loadingTipos } = useTiposClienteActivos();
  const { data: convenios, isLoading: loadingConvenios } = useConveniosActivos();
  const { data: medicosExistentes } = useMedicos();

  // --- Lógica Auxiliar ---
  const medicoOptions = useMemo(() => {
    return medicosExistentes?.map((medico) => ({
      value: medico,
      label: (
        <Space>
           <UserOutlined style={{ color: token.colorTextSecondary }} /> 
           {medico}
        </Space>
      ),
    })) || [];
  }, [medicosExistentes, token]);

  const tipoClienteParticular = tiposCliente?.find(
    (t) => t.nombre.toLowerCase() === 'particular'
  );
  const esParticular = tipoClienteSeleccionado === tipoClienteParticular?.id;

  useEffect(() => {
    if (esParticular) {
      formOrden.setFieldValue('convenio_id', undefined);
    }
  }, [esParticular, formOrden]);

  const steps = [
    { title: 'Paciente', subTitle: 'Identificación', icon: <UserOutlined /> },
    { title: 'Detalles', subTitle: 'Sede y Convenio', icon: <SolutionOutlined /> },
    { title: 'Análisis', subTitle: 'Selección', icon: <ExperimentOutlined /> },
  ];

  // --- Handlers ---
  const handleNextStep = async () => {
    try {
      if (currentStep === 0) {
        await formPaciente.validateFields();
        setCurrentStep(1);
      } else if (currentStep === 1) {
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
    if (!hasPermission('orders.create')) {
      message.error('No tienes permisos para crear órdenes.');
      return;
    }
    try {
      if (analisisSeleccionados.length === 0) {
        message.error('Debe seleccionar al menos un análisis');
        return;
      }

      const pacienteValues = await formPaciente.validateFields();
      const ordenValues = await formOrden.validateFields();

      const pacienteData: PacienteFormInput = {
        dni: pacienteValues.dni,
        nombres: pacienteValues.nombres,
        apellido_paterno: pacienteValues.apellido_paterno,
        apellido_materno: pacienteValues.apellido_materno,
        fecha_nacimiento: pacienteValues.fecha_nacimiento
          ? dayjs(pacienteValues.fecha_nacimiento).format('YYYY-MM-DD')
          : '',
        genero: pacienteValues.genero,
        telefono: pacienteValues.telefono || undefined,
        email: pacienteValues.email || undefined,
        direccion: pacienteValues.direccion || undefined,
      };

      const ordenData: CreateOrdenInput = {
        paciente: pacienteData,
        sede_id: ordenValues.sede_id,
        tipo_cliente_id: ordenValues.tipo_cliente_id,
        convenio_id: esParticular ? undefined : ordenValues.convenio_id || undefined,
        analisis: analisisSeleccionados,
        nota: ordenValues.nota || undefined,
        medico: ordenValues.medico || undefined,
      };

      const ordenCreada = await crearOrdenMutation.mutateAsync(ordenData);
      message.success(`Orden ${ordenCreada.numero_atencion} creada exitosamente`);
      navigate(`/ordenes/${ordenCreada.id}`);
    } catch (error: any) {
      console.error(error);
      message.error(error.response?.data?.message || 'Error al crear la orden');
    }
  };

  if (!hasPermission('orders.create')) {
    return (
      <Result
        status="403"
        icon={<LockOutlined />}
        title="Acceso Denegado"
        subTitle="No tienes permisos para registrar nuevas órdenes."
        extra={
          <Button type="primary" onClick={() => navigate('/ordenes')} icon={<ArrowLeftOutlined />}>
            Volver al listado
          </Button>
        }
      />
    );
  }

  // --- RENDER ---
  return (
    // Changed maxWidth to '100%' and adjusted padding to stretch content
    <div style={{ width: '100%', paddingBottom: 15 , padding: 20}}> 
      {/* 1. Header Minimalista */}
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/ordenes')}
              style={{ paddingLeft: 0, color: token.colorTextSecondary }}
            >
            Volver al listado
            </Button>
            <Title level={2} style={{ margin: '4px 0 0 0' }}>Nueva Orden de Atención</Title>
        </div>
      </div>

      {/* 2. Tarjeta Wizard Compacta */}
      <Card
        bordered={false}
        className="wizard-card"
        style={{
            borderRadius: token.borderRadiusLG,
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            overflow: 'hidden',
            width: '100%' // Ensure card takes full width
        }}
        bodyStyle={{ padding: 0 }}
      >
        {/* Header de Pasos COMPACTO */}
        <div style={{ 
            backgroundColor: token.colorBgLayout, 
            padding: '12px 24px', 
            borderBottom: `1px solid ${token.colorBorderSecondary}`
        }}>
            <Steps 
                current={currentStep} 
                items={steps} 
                type="navigation"
                size="small" 
                className="site-navigation-steps"
                style={{ boxShadow: 'none', padding: 0 }}
            />
        </div>

        {/* Cuerpo del Contenido */}
        <div style={{ padding: '24px' }}> 
            
            {/* Step 0: Paciente */}
            <div style={{ display: currentStep === 0 ? 'block' : 'none' }}>
                {/* REMOVED maxWidth: 800 to allow stretching */}
                <div style={{ margin: '0 auto' }}>
                    <div style={{ marginBottom: 16, textAlign: 'center' }}> 
                        <Title level={4} style={{ margin: 0 }}>Identificación del Paciente</Title>
                        <Text type="secondary">Busque un paciente existente por DNI o registre uno nuevo.</Text>
                    </div>
                    <BuscarPaciente form={formPaciente} />
                </div>
            </div>

            {/* Step 1: Datos Administrativos */}
            <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
                {/* REMOVED maxWidth: 900 to allow stretching */}
                <div style={{ margin: '0 auto' }}> 
                    <div style={{ marginBottom: 16, textAlign: 'center' }}> 
                         <Title level={4} style={{ margin: 0 }}>Datos de la Orden</Title>
                         <Text type="secondary">Información de procedencia y facturación.</Text>
                    </div>

                    <Form form={formOrden} layout="vertical" size="large">
                        <Row gutter={24}>
                            <Col xs={24} md={12}>
                                <Card 
                                    type="inner" 
                                    title={<><ShopOutlined /> Procedencia</>} 
                                    bordered={false} 
                                    style={{ background: token.colorBgLayout, marginBottom: 24 }}
                                    headStyle={{ minHeight: 40, padding: '0 16px' }} 
                                    bodyStyle={{ padding: 16 }} 
                                >
                                    <Form.Item
                                        label="Sede de Atención"
                                        name="sede_id"
                                        rules={[{ required: true, message: 'Requerido' }]}
                                        style={{ marginBottom: 16 }}
                                    >
                                        <Select
                                            placeholder="Seleccione sede"
                                            loading={loadingSedes}
                                            options={sedes?.map((s) => ({ label: s.nombre, value: s.id }))}
                                        />
                                    </Form.Item>
                                    <Form.Item label="Médico Referente" name="medico" style={{ marginBottom: 0 }}>
                                        <AutoComplete
                                            placeholder="Buscar o escribir nombre..."
                                            options={medicoOptions}
                                            filterOption={(inputValue, option) =>
                                                String(option!.value).toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                                            }
                                        >
                                            <Input prefix={<MedicineBoxOutlined style={{ color: token.colorTextQuaternary }} />} />
                                        </AutoComplete>
                                    </Form.Item>
                                </Card>
                            </Col>

                            <Col xs={24} md={12}>
                                <Card 
                                    type="inner" 
                                    title={<><TeamOutlined /> Facturación</>} 
                                    bordered={false} 
                                    style={{ background: token.colorBgLayout, marginBottom: 24 }}
                                    headStyle={{ minHeight: 40, padding: '0 16px' }}
                                    bodyStyle={{ padding: 16 }}
                                >
                                    <Form.Item
                                        label="Tipo de Cliente"
                                        name="tipo_cliente_id"
                                        rules={[{ required: true, message: 'Requerido' }]}
                                        style={{ marginBottom: 16 }}
                                    >
                                        <Select
                                            placeholder="Seleccione tipo"
                                            loading={loadingTipos}
                                            onChange={(value) => setTipoClienteSeleccionado(value)}
                                            options={tiposCliente?.map((t) => ({ label: t.nombre, value: t.id }))}
                                        />
                                    </Form.Item>

                                    {!esParticular ? (
                                        <Form.Item 
                                            label="Convenio / Empresa" 
                                            name="convenio_id"
                                            rules={[{ required: true, message: 'Requerido' }]}
                                            style={{ marginBottom: 0 }}
                                        >
                                            <Select
                                                showSearch
                                                placeholder="Buscar convenio..."
                                                loading={loadingConvenios}
                                                optionFilterProp="children"
                                                options={convenios?.map((c) => ({ label: c.nombre_empresa, value: c.id }))}
                                            />
                                        </Form.Item>
                                    ) : (
                                        <Form.Item label="Tarifa Aplicada" style={{ marginBottom: 0 }}>
                                            <Tag color="blue" style={{ width: '100%', textAlign: 'center', padding: '6px 0' }}>
                                                TARIFA PARTICULAR
                                            </Tag>
                                        </Form.Item>
                                    )}
                                </Card>
                            </Col>
                        </Row>

                        <Form.Item label="Notas u Observaciones" name="nota" style={{ marginBottom: 0 }}>
                            <TextArea 
                                rows={2} 
                                placeholder="Indicaciones especiales..." 
                                showCount 
                                maxLength={500} 
                            />
                        </Form.Item>
                    </Form>
                </div>
            </div>

            {/* Step 2: Análisis */}
            <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <div>
                        <Title level={4} style={{ margin: 0 }}>Selección de Análisis</Title>
                        <Text type="secondary">
                            {esParticular ? 'Tarifario Particular' : 'Tarifario de Convenio'} aplicado
                        </Text>
                     </div>
                     <Tag color={analisisSeleccionados.length > 0 ? "success" : "warning"}>
                        {analisisSeleccionados.length} seleccionados
                     </Tag>
                </div>
                
                <div style={{ minHeight: 300 }}>
                    <SeleccionAnalisis
                        analisisSeleccionados={analisisSeleccionados}
                        onAnalisisChange={setAnalisisSeleccionados}
                        convenioId={esParticular ? undefined : formOrden.getFieldValue('convenio_id')}
                    />
                </div>
            </div>

        </div>

        <Divider style={{ margin: 0 }} />

        {/* Footer de Acciones COMPACTO */}
        <div style={{ 
            padding: '12px 24px', 
            backgroundColor: token.colorBgContainer,
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center'
        }}>
            {currentStep > 0 ? (
                <Button onClick={handlePrevStep} icon={<LeftOutlined />}>
                    Atrás
                </Button>
            ) : ( <div /> )}

            {currentStep < 2 ? (
                <Button type="primary" onClick={handleNextStep}>
                    Siguiente <RightOutlined />
                </Button>
            ) : (
                <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    loading={crearOrdenMutation.isPending}
                    onClick={handleSubmit}
                    disabled={analisisSeleccionados.length === 0}
                    style={{ 
                        boxShadow: `0 4px 14px ${token.colorPrimary}60`,
                        paddingLeft: 24, paddingRight: 24
                    }}
                >
                    Finalizar Orden
                </Button>
            )}
        </div>
      </Card>
    </div>
  );
};