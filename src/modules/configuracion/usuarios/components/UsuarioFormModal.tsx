import { useEffect } from 'react';
import { Modal, Form, Input, Switch, Select } from 'antd';
import { useRoles } from '../hooks';
import { useSedesActivas } from '../../sedes/hooks';
import { usePersonalList } from '../../../personal/hooks';
import type { Usuario, CreateUsuarioInput, UpdateUsuarioInput } from '../types';

interface UsuarioFormModalProps {
  open: boolean;
  usuario: Usuario | null;
  onCancel: () => void;
  onSubmit: (data: CreateUsuarioInput | UpdateUsuarioInput) => void;
  loading?: boolean;
}

export const UsuarioFormModal: React.FC<UsuarioFormModalProps> = ({
  open,
  usuario,
  onCancel,
  onSubmit,
  loading = false,
}) => {
  const [form] = Form.useForm();
  const { data: roles, isLoading: loadingRoles } = useRoles();
  const { data: sedes, isLoading: loadingSedes } = useSedesActivas();
  const { data: personalList = [], isLoading: loadingPersonal } = usePersonalList({ activo: true });

  const isEdit = Boolean(usuario && usuario.id && usuario.id > 0);

  // Helper para sugerir username a partir del email o nombres
  const sugerirUsername = (nombres?: string, apellidos?: string, email?: string) => {
    if (email && email.includes('@')) {
      const parte = email.split('@')[0].toLowerCase().trim().replace(/[^a-z0-9._-]/g, '');
      if (parte.length >= 3) return parte;
    }
    if (nombres && apellidos) {
      const primerNombre = nombres.trim().split(' ')[0].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '');
      const primerApellido = apellidos.trim().split(' ')[0].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '');
      return `${primerNombre}.${primerApellido}`;
    }
    return '';
  };

  useEffect(() => {
    if (open) {
      if (isEdit && usuario) {
        form.setFieldsValue({
          username: usuario.username,
          email: usuario.email,
          nombres: usuario.nombres,
          apellidos: usuario.apellidos,
          rol_id: usuario.rol_id,
          personal_id: usuario.personal_id || undefined,
          sede_ids: usuario.sedes?.map(s => s.id) || [],
          activo: usuario.activo,
        });
      } else if (usuario && !isEdit) {
        // Modo creación con colaborador precargado
        const usernameSugerido = usuario.username || sugerirUsername(usuario.nombres, usuario.apellidos, usuario.email);
        form.setFieldsValue({
          personal_id: usuario.personal_id || undefined,
          nombres: usuario.nombres || '',
          apellidos: usuario.apellidos || '',
          email: usuario.email || '',
          username: usernameSugerido,
          activo: true,
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, usuario, isEdit, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      // Solo incluir password si se está creando un usuario o si se modificó
      const data: any = { ...values };
      if (isEdit && !values.password) {
        delete data.password;
      }
      onSubmit(data);
    } catch (error) {
      console.error('Error de validación:', error);
    }
  };

  const modalTitle = isEdit
    ? 'Editar Usuario'
    : usuario?.personal_id
      ? `Crear Cuenta para ${usuario.nombres} ${usuario.apellidos || ''}`
      : 'Nuevo Usuario de Sistema';

  return (
    <Modal
      title={modalTitle}
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={loading}
      width={600}
      okText={isEdit ? 'Guardar Cambios' : 'Crear Usuario'}
      cancelText="Cancelar"
    >
      {!isEdit && usuario?.personal_id && (
        <div
          style={{
            marginBottom: 16,
            padding: '10px 14px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: 8,
            fontSize: 12.5,
            color: '#15803d',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span>👤</span>
          <span>
            Vinculando automáticamente a la ficha de <strong>{usuario.nombres} {usuario.apellidos}</strong> en RRHH.
          </span>
        </div>
      )}

      <Form
        form={form}
        layout="vertical"
        initialValues={{ activo: true }}
      >
        <Form.Item
          label="Colaborador de Personal / RRHH"
          name="personal_id"
          tooltip="Vincule esta cuenta a la ficha del colaborador en RRHH para unificar cargo y expediente."
        >
          <Select
            placeholder="Seleccione un colaborador (opcional)"
            allowClear
            showSearch
            loading={loadingPersonal}
            optionFilterProp="label"
            options={personalList.map((p) => ({
              value: p.id,
              label: `${p.nombres} ${p.apellidos} (${p.numero_documento || 'Sin doc'}) — ${p.cargo || 'Sin cargo'}`,
              colaborador: p,
            }))}
            onChange={(_, option: any) => {
              if (option?.colaborador && !isEdit) {
                const p = option.colaborador;
                const sug = sugerirUsername(p.nombres, p.apellidos, p.email);
                form.setFieldsValue({
                  nombres: p.nombres,
                  apellidos: p.apellidos,
                  email: p.email || form.getFieldValue('email'),
                  username: form.getFieldValue('username') || sug,
                });
              }
            }}
          />
        </Form.Item>

        <Form.Item
          label="Usuario"
          name="username"
          rules={[
            { required: !isEdit, message: 'Por favor ingrese el nombre de usuario' },
            { min: 3, message: 'El usuario debe tener al menos 3 caracteres' },
            { max: 50, message: 'El usuario no puede exceder 50 caracteres' },
          ]}
        >
          <Input placeholder="Nombre de usuario" disabled={isEdit} />
        </Form.Item>

        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: 'Por favor ingrese el email' },
            { type: 'email', message: 'Por favor ingrese un email válido' },
          ]}
        >
          <Input placeholder="correo@ejemplo.com" />
        </Form.Item>

        <Form.Item
          label={isEdit ? 'Nueva Contraseña (dejar vacío para mantener actual)' : 'Contraseña de Acceso'}
          name="password"
          rules={[
            { required: !isEdit, message: 'Por favor ingrese una contraseña para la cuenta' },
            { min: 6, message: 'La contraseña debe tener al menos 6 caracteres' },
          ]}
        >
          <Input.Password placeholder="Contraseña de acceso" />
        </Form.Item>

        <Form.Item
          label="Nombres"
          name="nombres"
          rules={[
            { required: true, message: 'Por favor ingrese los nombres' },
            { max: 100, message: 'Los nombres no pueden exceder 100 caracteres' },
          ]}
        >
          <Input placeholder="Nombres" />
        </Form.Item>

        <Form.Item
          label="Apellidos"
          name="apellidos"
          rules={[
            { required: true, message: 'Por favor ingrese los apellidos' },
            { max: 100, message: 'Los apellidos no pueden exceder 100 caracteres' },
          ]}
        >
          <Input placeholder="Apellidos" />
        </Form.Item>

        <Form.Item
          label="Rol"
          name="rol_id"
          rules={[
            { required: true, message: 'Por favor seleccione un rol' },
          ]}
        >
          <Select
            placeholder="Seleccione un rol"
            loading={loadingRoles}
            options={roles?.map((r) => ({
              label: r.nombre,
              value: r.id,
            }))}
          />
        </Form.Item>

        <Form.Item
          label="Sedes Asignadas"
          name="sede_ids"
          tooltip="Seleccione las sedes a las que el usuario tendrá acceso. Si no selecciona ninguna, verá todas las sedes."
        >
          <Select
            mode="multiple"
            placeholder="Seleccione las sedes (vacío = todas)"
            loading={loadingSedes}
            allowClear
            options={sedes?.map((s) => ({
              label: s.nombre,
              value: s.id,
            }))}
          />
        </Form.Item>

        {isEdit && (
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
