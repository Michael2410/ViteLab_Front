import { useEffect, useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Switch,
  Collapse,
  Checkbox,
  Space,
  Typography,
  Spin,
  App,
  Divider,
  Tag,
  Row,
  Col,
} from 'antd';
import {
  SafetyCertificateOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { useCrearRol, useActualizarRol, usePermisosAgrupados, usePermisosRol, usePermisos } from '../hooks';
import type { Rol, CreateRolInput, UpdateRolInput, Permiso } from '../types';
import { MODULO_NOMBRES, SUBMODULO_NOMBRES, ACCION_NOMBRES } from '../types';

const { TextArea } = Input;
const { Text, Title } = Typography;
const { Panel } = Collapse;

interface RolFormModalProps {
  visible: boolean;
  rol: Rol | null;
  onCancel: () => void;
  onSuccess: () => void;
}

export function RolFormModal({ visible, rol, onCancel, onSuccess }: RolFormModalProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [selectedPermisos, setSelectedPermisos] = useState<number[]>([]);

  const { data: permisosAgrupados, isLoading: loadingAgrupados } = usePermisosAgrupados();
  const { isLoading: loadingPermisos } = usePermisos();
  const { data: permisosRol, isLoading: loadingPermisosRol } = usePermisosRol(rol?.id || 0);

  const crearMutation = useCrearRol();
  const actualizarMutation = useActualizarRol();

  const esEdicion = !!rol;
  const loading = crearMutation.isPending || actualizarMutation.isPending;

  // Cargar permisos del rol cuando está editando
  useEffect(() => {
    if (esEdicion && permisosRol) {
      setSelectedPermisos(permisosRol);
    } else if (!esEdicion) {
      setSelectedPermisos([]);
    }
  }, [esEdicion, permisosRol]);

  // Reset form cuando cambia el modal
  useEffect(() => {
    if (visible) {
      if (rol) {
        form.setFieldsValue({
          nombre: rol.nombre,
          descripcion: rol.descripcion,
          activo: rol.activo,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ activo: true });
        setSelectedPermisos([]);
      }
    }
  }, [visible, rol, form]);

  // Obtener nombre amigable del módulo
  const getNombreModulo = (modulo: string) => MODULO_NOMBRES[modulo] || modulo;
  
  // Obtener nombre amigable del submódulo
  const getNombreSubmodulo = (submodulo: string | null) => {
    if (!submodulo) return 'General';
    return SUBMODULO_NOMBRES[submodulo] || submodulo;
  };

  // Obtener nombre amigable de la acción
  const getNombreAccion = (accion: string) => ACCION_NOMBRES[accion] || accion;

  // Manejar selección de permisos
  const handlePermisoChange = (permisoId: number, checked: boolean) => {
    if (checked) {
      setSelectedPermisos([...selectedPermisos, permisoId]);
    } else {
      setSelectedPermisos(selectedPermisos.filter(id => id !== permisoId));
    }
  };

  // Seleccionar/deseleccionar todos los permisos de un módulo
  const handleModuloChange = (permisos: Permiso[], checked: boolean) => {
    const permisoIds = permisos.map(p => p.id);
    if (checked) {
      setSelectedPermisos([...new Set([...selectedPermisos, ...permisoIds])]);
    } else {
      setSelectedPermisos(selectedPermisos.filter(id => !permisoIds.includes(id)));
    }
  };

  // Verificar si todos los permisos de un módulo están seleccionados
  const isModuloChecked = (permisos: Permiso[]) => {
    return permisos.every(p => selectedPermisos.includes(p.id));
  };

  // Verificar si algunos permisos de un módulo están seleccionados
  const isModuloIndeterminate = (permisos: Permiso[]) => {
    const selected = permisos.filter(p => selectedPermisos.includes(p.id));
    return selected.length > 0 && selected.length < permisos.length;
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (selectedPermisos.length === 0) {
        message.error('Debe seleccionar al menos un permiso');
        return;
      }

      if (esEdicion && rol) {
        const updateData: UpdateRolInput = {
          nombre: values.nombre,
          descripcion: values.descripcion || null,
          activo: values.activo,
          permisos: selectedPermisos,
        };

        await actualizarMutation.mutateAsync({ id: rol.id, data: updateData });
        message.success('Rol actualizado exitosamente');
      } else {
        const createData: CreateRolInput = {
          nombre: values.nombre,
          descripcion: values.descripcion,
          permisos: selectedPermisos,
        };

        await crearMutation.mutateAsync(createData);
        message.success('Rol creado exitosamente');
      }

      onSuccess();
    } catch (error: any) {
      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      }
    }
  };

  // Obtener todos los permisos de un módulo (incluyendo submódulos)
  const getPermisosModulo = (modulo: { submodulos: { permisos: Permiso[] }[] }) => {
    return modulo.submodulos.flatMap(s => s.permisos);
  };

  return (
    <Modal
      title={
        <Space>
          <SafetyCertificateOutlined />
          {esEdicion ? 'Editar Rol' : 'Nuevo Rol'}
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      okText={esEdicion ? 'Actualizar' : 'Crear'}
      cancelText="Cancelar"
      confirmLoading={loading}
      width={800}
      styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
    >
      <Spin spinning={loadingAgrupados || loadingPermisos || loadingPermisosRol}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{ activo: true }}
        >
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                name="nombre"
                label="Nombre del Rol"
                rules={[
                  { required: true, message: 'Ingrese el nombre del rol' },
                  { min: 2, message: 'Mínimo 2 caracteres' },
                  { max: 50, message: 'Máximo 50 caracteres' },
                ]}
              >
                <Input
                  placeholder="Ej: RECEPCIONISTA"
                  style={{ textTransform: 'uppercase' }}
                  disabled={rol?.nombre === 'SUPER_ADMIN'}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="activo"
                label="Estado"
                valuePropName="checked"
              >
                <Switch
                  checkedChildren="Activo"
                  unCheckedChildren="Inactivo"
                  disabled={rol?.nombre === 'SUPER_ADMIN'}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="descripcion"
            label="Descripción"
          >
            <TextArea
              rows={2}
              placeholder="Descripción del rol y sus responsabilidades"
              maxLength={255}
              showCount
            />
          </Form.Item>

          <Divider>
            <Space>
              <AppstoreOutlined />
              <Text strong>Permisos</Text>
              <Tag color="blue">{selectedPermisos.length} seleccionados</Tag>
            </Space>
          </Divider>

          {permisosAgrupados && (
            <Collapse defaultActiveKey={permisosAgrupados.map(m => m.modulo)}>
              {permisosAgrupados.map((modulo) => {
                const permisosModulo = getPermisosModulo(modulo);
                return (
                  <Panel
                    key={modulo.modulo}
                    header={
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <Space>
                          <Checkbox
                            checked={isModuloChecked(permisosModulo)}
                            indeterminate={isModuloIndeterminate(permisosModulo)}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleModuloChange(permisosModulo, e.target.checked);
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <Title level={5} style={{ margin: 0 }}>
                            {getNombreModulo(modulo.modulo)}
                          </Title>
                        </Space>
                        <Tag>
                          {permisosModulo.filter(p => selectedPermisos.includes(p.id)).length} / {permisosModulo.length}
                        </Tag>
                      </div>
                    }
                  >
                    {modulo.submodulos.map((submodulo, idx) => (
                      <div key={idx} style={{ marginBottom: 16 }}>
                        {submodulo.nombre && (
                          <Text type="secondary" style={{ marginBottom: 8, display: 'block' }}>
                            {getNombreSubmodulo(submodulo.nombre)}
                          </Text>
                        )}
                        <Space wrap>
                          {submodulo.permisos.map((permiso) => (
                            <Checkbox
                              key={permiso.id}
                              checked={selectedPermisos.includes(permiso.id)}
                              onChange={(e) => handlePermisoChange(permiso.id, e.target.checked)}
                            >
                              {getNombreAccion(permiso.accion)}
                            </Checkbox>
                          ))}
                        </Space>
                      </div>
                    ))}
                  </Panel>
                );
              })}
            </Collapse>
          )}
        </Form>
      </Spin>
    </Modal>
  );
}
