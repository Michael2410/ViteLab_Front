import { useState } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Table,
  Typography,
  Space,
  Tag,
  Alert,
  Descriptions,
  Progress,
  Divider,
  message as antMessage,
} from 'antd';
import {
  SearchOutlined,
  SaveOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import { useOrdenConResultados, useCrearResultadosBulk } from '../hooks';
import type {
  ComponenteConResultado,
  AnalisisConComponentes,
  ResultadoFormValues,
  BulkResultadosInput,
} from '../types';
import { getComponenteKey, calcularProgreso } from '../types';

const { Title, Text } = Typography;

export const ResultadosPage: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm<ResultadoFormValues>();
  const [numeroOrden, setNumeroOrden] = useState('');
  const [ordenId, setOrdenId] = useState<number | null>(null);

  const { data: ordenData, isLoading, error } = useOrdenConResultados(ordenId || 0, !!ordenId);
  const crearResultadosMutation = useCrearResultadosBulk();

  const handleBuscarOrden = () => {
    if (!numeroOrden || numeroOrden.trim() === '') {
      antMessage.error('Ingrese un número de orden');
      return;
    }

    // En producción, deberías hacer una búsqueda por número de orden
    // Por ahora, asumimos que el usuario ingresa el ID directamente
    const id = parseInt(numeroOrden, 10);
    if (isNaN(id)) {
      antMessage.error('Número de orden inválido');
      return;
    }

    setOrdenId(id);
  };

  const handleSubmit = async (values: ResultadoFormValues) => {
    if (!ordenData) return;

    // Preparar resultados para envío
    const resultados: BulkResultadosInput['resultados'] = [];

    Object.keys(values).forEach((key) => {
      const [ordenAnalisisIdStr, componenteIdStr] = key.split('_');
      const ordenAnalisisId = parseInt(ordenAnalisisIdStr, 10);
      const componenteId = parseInt(componenteIdStr, 10);

      const campo = values[key];
      if (campo && campo.valor && campo.valor.trim() !== '') {
        // Buscar el componente para obtener su unidad de medida
        let unidadMedida: string | undefined;
        for (const analisis of ordenData.analisis) {
          const componente = analisis.componentes.find((c) => c.componente_id === componenteId);
          if (componente) {
            unidadMedida = componente.unidad_medida || undefined;
            break;
          }
        }

        resultados.push({
          orden_analisis_id: ordenAnalisisId,
          componente_id: componenteId,
          valor: campo.valor,
          unidad_medida: unidadMedida,
          observaciones: campo.observaciones || undefined,
        });
      }
    });

    if (resultados.length === 0) {
      antMessage.warning('Debe ingresar al menos un resultado');
      return;
    }

    try {
      await crearResultadosMutation.mutateAsync({
        orden_id: ordenData.id,
        resultados,
      });

      // Limpiar formulario y volver a cargar
      form.resetFields();
      setOrdenId(null);
      setNumeroOrden('');
    } catch (error) {
      console.error('Error al guardar resultados:', error);
    }
  };

  const columns: ColumnsType<ComponenteConResultado> = [
    {
      title: 'Código',
      dataIndex: 'componente_codigo',
      key: 'codigo',
      width: 100,
    },
    {
      title: 'Componente',
      dataIndex: 'componente_nombre',
      key: 'nombre',
      width: 250,
    },
    {
      title: 'Valor',
      key: 'valor',
      width: 200,
      render: (_, record) => {
        const key = getComponenteKey(
          ordenData?.analisis.find((a) =>
            a.componentes.some((c) => c.componente_id === record.componente_id)
          )?.orden_analisis_id || 0,
          record.componente_id
        );

        return record.tiene_resultado ? (
          <Space>
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
            <Text>{record.resultado_valor}</Text>
          </Space>
        ) : (
          <Form.Item
            name={[key, 'valor']}
            style={{ marginBottom: 0 }}
            rules={[{ required: false }]}
          >
            <Input placeholder="Ingrese valor" />
          </Form.Item>
        );
      },
    },
    {
      title: 'Unidad',
      dataIndex: 'unidad_medida',
      key: 'unidad',
      width: 100,
      render: (unidad: string) => unidad || '-',
    },
    {
      title: 'Valores de Referencia',
      key: 'referencia',
      width: 200,
      render: (_, record) => {
        if (record.valor_referencia_texto) {
          return <Text type="secondary">{record.valor_referencia_texto}</Text>;
        }

        if (record.valor_referencia_min !== null || record.valor_referencia_max !== null) {
          const min = record.valor_referencia_min !== null ? record.valor_referencia_min : '...';
          const max = record.valor_referencia_max !== null ? record.valor_referencia_max : '...';
          return <Text type="secondary">{`${min} - ${max}`}</Text>;
        }

        return <Text type="secondary">-</Text>;
      },
    },
    {
      title: 'Observaciones',
      key: 'observaciones',
      width: 250,
      render: (_, record) => {
        const key = getComponenteKey(
          ordenData?.analisis.find((a) =>
            a.componentes.some((c) => c.componente_id === record.componente_id)
          )?.orden_analisis_id || 0,
          record.componente_id
        );

        return record.tiene_resultado ? (
          <Text type="secondary">{record.resultado_observaciones || '-'}</Text>
        ) : (
          <Form.Item name={[key, 'observaciones']} style={{ marginBottom: 0 }}>
            <Input.TextArea placeholder="Opcional" rows={1} />
          </Form.Item>
        );
      },
    },
  ];

  const progreso = ordenData ? calcularProgreso(ordenData.analisis) : null;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>Ingreso de Resultados</Title>
        <Text type="secondary">Registre los resultados de los análisis solicitados</Text>
      </div>

      {/* Búsqueda de Orden */}
      <Card style={{ marginBottom: 16 }}>
        <Space size="large" style={{ width: '100%' }}>
          <Input
            placeholder="Ingrese ID de la orden (ej: 1, 2, 3...)"
            value={numeroOrden}
            onChange={(e) => setNumeroOrden(e.target.value)}
            onPressEnter={handleBuscarOrden}
            style={{ width: 300 }}
            prefix={<SearchOutlined />}
          />
          <Button type="primary" onClick={handleBuscarOrden} loading={isLoading}>
            Buscar Orden
          </Button>
        </Space>
      </Card>

      {/* Error */}
      {error && (
        <Alert
          message="Error"
          description="No se pudo cargar la orden. Verifique el número e intente nuevamente."
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Datos de la Orden */}
      {ordenData && (
        <>
          <Card title="Información de la Orden" style={{ marginBottom: 16 }}>
            <Descriptions column={{ xs: 1, sm: 2, md: 3 }}>
              <Descriptions.Item label="N° Orden">{ordenData.numero_orden}</Descriptions.Item>
              <Descriptions.Item label="Paciente">
                {ordenData.paciente_nombres} {ordenData.paciente_apellidos}
              </Descriptions.Item>
              <Descriptions.Item label="DNI">{ordenData.paciente_dni}</Descriptions.Item>
              <Descriptions.Item label="Fecha Registro">
                {dayjs(ordenData.fecha_registro).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
            </Descriptions>

            {progreso && (
              <div style={{ marginTop: 16 }}>
                <Text strong>Progreso de Resultados:</Text>
                <Progress
                  percent={progreso.porcentaje}
                  status={progreso.porcentaje === 100 ? 'success' : 'active'}
                  format={() => `${progreso.completados}/${progreso.total}`}
                  style={{ marginTop: 8 }}
                />
              </div>
            )}
          </Card>

          {/* Formulario de Resultados */}
          <Form form={form} onFinish={handleSubmit} layout="vertical">
            {ordenData.analisis.map((analisis: AnalisisConComponentes) => (
              <Card
                key={analisis.analisis_id}
                title={
                  <Space>
                    <Text strong>{analisis.analisis_nombre}</Text>
                    <Tag color="blue">{analisis.analisis_codigo}</Tag>
                  </Space>
                }
                style={{ marginBottom: 16 }}
              >
                <Table
                  columns={columns}
                  dataSource={analisis.componentes}
                  rowKey="componente_id"
                  pagination={false}
                  size="small"
                />
              </Card>
            ))}

            <Divider />

            <Space size="large">
              <Button size="large" onClick={() => navigate('/ordenes')}>
                Cancelar
              </Button>
              <Button
                type="primary"
                size="large"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={crearResultadosMutation.isPending}
              >
                Guardar Resultados
              </Button>
            </Space>
          </Form>
        </>
      )}
    </div>
  );
};
