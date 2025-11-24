import { Form, Input, Button, Row, Col, Card, DatePicker, Select, Spin } from 'antd';
import { SearchOutlined, UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useConsultarDni } from '../hooks';
import type { PacienteFormInput } from '../types';

interface BuscarPacienteProps {
  onPacienteEncontrado?: (paciente: PacienteFormInput) => void;
}

export const BuscarPaciente: React.FC<BuscarPacienteProps> = ({ onPacienteEncontrado }) => {
  const [form] = Form.useForm();
  const consultarDniMutation = useConsultarDni();

  const handleBuscarDni = async () => {
    const dniValue = form.getFieldValue('dni');
    
    if (!dniValue || dniValue.length !== 8) {
      form.setFields([
        {
          name: 'dni',
          errors: ['El DNI debe tener 8 dígitos'],
        },
      ]);
      return;
    }

    try {
      console.log('🔍 Buscando DNI:', dniValue);
      const resultado = await consultarDniMutation.mutateAsync(dniValue);
      
      console.log('✅ Resultado:', resultado);

      // Verificar si la búsqueda fue exitosa
      if (resultado.success && resultado.data) {
        const data = resultado.data;
        
        // Autocompletar formulario con datos de API
        const pacienteData: PacienteFormInput = {
          dni: data.dni,
          nombres: data.nombres,
          apellidos: `${data.apellidoPaterno} ${data.apellidoMaterno}`.trim(),
          fecha_nacimiento: data.fechaNacimiento || '',
          sexo: 'M', // Por defecto, el usuario puede cambiarlo
        };

        // Convertir fecha de DD/MM/YYYY a formato dayjs
        let fechaNacimiento = undefined;
        if (data.fechaNacimiento) {
          const [dia, mes, anio] = data.fechaNacimiento.split('/');
          if (dia && mes && anio) {
            fechaNacimiento = dayjs(`${anio}-${mes}-${dia}`);
          }
        }

        form.setFieldsValue({
          dni: pacienteData.dni,
          nombres: pacienteData.nombres,
          apellidos: pacienteData.apellidos,
          fecha_nacimiento: fechaNacimiento,
          sexo: pacienteData.sexo,
        });

        if (onPacienteEncontrado) {
          onPacienteEncontrado(pacienteData);
        }
      }
    } catch (error) {
      console.error('❌ Error al consultar DNI:', error);
    }
  };

  return (
    <Card
      title={
        <>
          <UserOutlined /> Datos del Paciente
        </>
      }
      bordered={false}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          sexo: 'M',
        }}
      >
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item
              label="DNI"
              name="dni"
              rules={[
                { required: true, message: 'El DNI es obligatorio' },
                { len: 8, message: 'El DNI debe tener 8 dígitos' },
                { pattern: /^\d+$/, message: 'El DNI debe contener solo números' },
              ]}
            >
              <Input
                placeholder="Ingrese DNI"
                maxLength={8}
                suffix={
                  <Button
                    type="link"
                    icon={<SearchOutlined />}
                    onClick={handleBuscarDni}
                    loading={consultarDniMutation.isPending}
                  >
                    Buscar
                  </Button>
                }
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              label="Nombres"
              name="nombres"
              rules={[{ required: true, message: 'Los nombres son obligatorios' }]}
            >
              <Input placeholder="Nombres del paciente" />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              label="Apellidos"
              name="apellidos"
              rules={[{ required: true, message: 'Los apellidos son obligatorios' }]}
            >
              <Input placeholder="Apellidos del paciente" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item
              label="Fecha de Nacimiento"
              name="fecha_nacimiento"
              rules={[{ required: true, message: 'La fecha de nacimiento es obligatoria' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                placeholder="Seleccione fecha"
                disabledDate={(current) => current && current > dayjs().endOf('day')}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              label="Sexo"
              name="sexo"
              rules={[{ required: true, message: 'El sexo es obligatorio' }]}
            >
              <Select placeholder="Seleccione sexo">
                <Select.Option value="M">Masculino</Select.Option>
                <Select.Option value="F">Femenino</Select.Option>
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item label="Teléfono" name="telefono">
              <Input placeholder="Número de teléfono" maxLength={15} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Email"
              name="email"
              rules={[{ type: 'email', message: 'Email inválido' }]}
            >
              <Input placeholder="correo@ejemplo.com" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="Dirección" name="direccion">
              <Input placeholder="Dirección completa" />
            </Form.Item>
          </Col>
        </Row>
      </Form>

      {consultarDniMutation.isPending && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin tip="Consultando DNI..." />
        </div>
      )}
    </Card>
  );
};
