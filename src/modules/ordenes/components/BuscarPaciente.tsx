import { useState, useEffect } from 'react';
import { Form, Input, Button, Row, Col, Card, DatePicker, Select, Spin, message } from 'antd';
import type { FormInstance } from 'antd';
import { SearchOutlined, UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useConsultarDni, useBuscarPacientePorDni } from '../hooks';

interface BuscarPacienteProps {
  form: FormInstance;
}

export const BuscarPaciente: React.FC<BuscarPacienteProps> = ({ form }) => {
  const [edad, setEdad] = useState<number | null>(null);
  
  const consultarDniMutation = useConsultarDni();
  const buscarPacienteMutation = useBuscarPacientePorDni();

  // Calcular edad cuando cambie la fecha de nacimiento
  const fechaNacimiento = Form.useWatch('fecha_nacimiento', form);
  
  useEffect(() => {
    if (fechaNacimiento) {
      const fechaNac = dayjs(fechaNacimiento);
      const hoy = dayjs();
      const edadCalculada = hoy.diff(fechaNac, 'year');
      setEdad(edadCalculada >= 0 ? edadCalculada : null);
    } else {
      setEdad(null);
    }
  }, [fechaNacimiento]);

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
      // 1. PRIMERO: Buscar en la base de datos local
      console.log('🔍 Buscando paciente en BD local:', dniValue);
      const pacienteBD = await buscarPacienteMutation.mutateAsync(dniValue);
      
      if (pacienteBD) {
        console.log('✅ Paciente encontrado en BD:', pacienteBD);
        message.success('Paciente encontrado en el sistema');
        
        // Convertir fecha a dayjs
        let fechaNac = undefined;
        if (pacienteBD.fecha_nacimiento) {
          fechaNac = dayjs(pacienteBD.fecha_nacimiento);
        }

        form.setFieldsValue({
          dni: pacienteBD.dni,
          nombres: pacienteBD.nombres,
          apellido_paterno: pacienteBD.apellido_paterno,
          apellido_materno: pacienteBD.apellido_materno,
          fecha_nacimiento: fechaNac,
          genero: pacienteBD.genero,
          telefono: pacienteBD.telefono || undefined,
          email: pacienteBD.email || undefined,
          direccion: pacienteBD.direccion || undefined,
        });
        return;
      }

      // 2. SEGUNDO: Si no está en BD, consultar API externa
      console.log('🔍 Paciente no encontrado en BD, consultando API externa...');
      const resultado = await consultarDniMutation.mutateAsync(dniValue);
      
      console.log('✅ Resultado API:', resultado);

      if (resultado.success && resultado.data) {
        const data = resultado.data;
        message.info('Paciente nuevo - datos obtenidos de RENIEC');
        
        // Convertir fecha de DD/MM/YYYY a formato dayjs
        let fechaNac = undefined;
        if (data.fechaNacimiento) {
          const [dia, mes, anio] = data.fechaNacimiento.split('/');
          if (dia && mes && anio) {
            fechaNac = dayjs(`${anio}-${mes}-${dia}`);
          }
        }

        form.setFieldsValue({
          dni: data.dni,
          nombres: data.nombres,
          apellido_paterno: data.apellidoPaterno,
          apellido_materno: data.apellidoMaterno,
          fecha_nacimiento: fechaNac,
          genero: 'M', // Por defecto, el usuario puede cambiarlo
        });
      } else {
        message.warning('No se encontraron datos. Complete manualmente.');
      }
    } catch (error) {
      console.error('❌ Error al buscar:', error);
      message.error('Error al buscar paciente');
    }
  };

  const isLoading = consultarDniMutation.isPending || buscarPacienteMutation.isPending;

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
          genero: 'M',
        }}
      >
        <Row gutter={16}>
          <Col xs={24} md={6}>
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
                    loading={isLoading}
                  >
                    Buscar
                  </Button>
                }
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={6}>
            <Form.Item
              label="Nombres"
              name="nombres"
              rules={[{ required: true, message: 'Los nombres son obligatorios' }]}
            >
              <Input placeholder="Nombres del paciente" />
            </Form.Item>
          </Col>

          <Col xs={24} md={6}>
            <Form.Item
              label="Apellido Paterno"
              name="apellido_paterno"
              rules={[{ required: true, message: 'El apellido paterno es obligatorio' }]}
            >
              <Input placeholder="Apellido paterno" />
            </Form.Item>
          </Col>

          <Col xs={24} md={6}>
            <Form.Item
              label="Apellido Materno"
              name="apellido_materno"
              rules={[{ required: true, message: 'El apellido materno es obligatorio' }]}
            >
              <Input placeholder="Apellido materno" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} md={6}>
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

          <Col xs={24} md={6}>
            <Form.Item label="Edad">
              <Input 
                value={edad !== null ? `${edad} años` : ''} 
                disabled 
                placeholder="Se calcula automáticamente"
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={6}>
            <Form.Item
              label="Género"
              name="genero"
              rules={[{ required: true, message: 'El género es obligatorio' }]}
            >
              <Select placeholder="Seleccione género">
                <Select.Option value="M">Masculino</Select.Option>
                <Select.Option value="F">Femenino</Select.Option>
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} md={6}>
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

      {isLoading && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin tip="Buscando paciente..." />
        </div>
      )}
    </Card>
  );
};
