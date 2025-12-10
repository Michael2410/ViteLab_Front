import { useEffect, useState } from 'react';
import { Modal, Form, Input, Switch, Select, Upload, message, Image } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useRoles } from '../hooks';
import { useSedesActivas } from '../../sedes/hooks';
import { uploadFile } from '../../../shared/utils/apiClient';
import type { Usuario, CreateUsuarioInput, UpdateUsuarioInput } from '../types';
import type { UploadFile } from 'antd/es/upload/interface';

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
  const [firmaUrl, setFirmaUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  useEffect(() => {
    if (open && usuario) {
      form.setFieldsValue({
        username: usuario.username,
        email: usuario.email,
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        rol_id: usuario.rol_id,
        sede_ids: usuario.sedes?.map(s => s.id) || [],
        activo: usuario.activo,
      });
      setFirmaUrl(usuario.firma_url);
      if (usuario.firma_url) {
        setFileList([{
          uid: '-1',
          name: 'firma',
          status: 'done',
          url: usuario.firma_url,
        }]);
      } else {
        setFileList([]);
      }
    } else if (open) {
      form.resetFields();
      setFirmaUrl(null);
      setFileList([]);
    }
  }, [open, usuario, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      // Solo incluir password si se está creando un usuario o si se modificó
      const data: any = { ...values, firma_url: firmaUrl };
      if (usuario && !values.password) {
        delete data.password;
      }
      onSubmit(data);
    } catch (error) {
      console.error('Error de validación:', error);
    }
  };

  const handleUpload = async (file: File) => {
    try {
      setUploading(true);
      const result = await uploadFile(file, 'firmas');
      setFirmaUrl(result.url);
      setFileList([{
        uid: '-1',
        name: file.name,
        status: 'done',
        url: result.url,
      }]);
      message.success('Firma subida correctamente');
    } catch (error) {
      message.error('Error al subir la firma');
      console.error(error);
    } finally {
      setUploading(false);
    }
    return false;
  };

  const handleRemoveFirma = () => {
    setFirmaUrl(null);
    setFileList([]);
  };

  return (
    <Modal
      title={usuario ? 'Editar Usuario' : 'Nuevo Usuario'}
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={loading || uploading}
      width={600}
      okText={usuario ? 'Actualizar' : 'Crear'}
      cancelText="Cancelar"
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ activo: true }}
      >
        <Form.Item
          label="Usuario"
          name="username"
          rules={[
            { required: !usuario, message: 'Por favor ingrese el nombre de usuario' },
            { min: 3, message: 'El usuario debe tener al menos 3 caracteres' },
            { max: 50, message: 'El usuario no puede exceder 50 caracteres' },
          ]}
        >
          <Input placeholder="Nombre de usuario" disabled={!!usuario} />
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
          label={usuario ? 'Nueva Contraseña (dejar vacío para mantener)' : 'Contraseña'}
          name="password"
          rules={[
            { required: !usuario, message: 'Por favor ingrese la contraseña' },
            { min: 6, message: 'La contraseña debe tener al menos 6 caracteres' },
          ]}
        >
          <Input.Password placeholder="Contraseña" />
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

        <Form.Item
          label="Firma Digital"
        >
          {firmaUrl ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Image
                src={firmaUrl}
                alt="Firma"
                width={150}
                height={80}
                style={{ objectFit: 'contain', border: '1px solid #d9d9d9', borderRadius: 4 }}
              />
              <button
                type="button"
                onClick={handleRemoveFirma}
                style={{ 
                  background: 'none', 
                  border: '1px solid #ff4d4f', 
                  color: '#ff4d4f',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <DeleteOutlined /> Eliminar
              </button>
            </div>
          ) : (
            <Upload
              listType="picture-card"
              fileList={fileList}
              beforeUpload={handleUpload}
              maxCount={1}
              accept="image/*"
              showUploadList={false}
            >
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>Subir Firma</div>
              </div>
            </Upload>
          )}
        </Form.Item>

        {usuario && (
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
