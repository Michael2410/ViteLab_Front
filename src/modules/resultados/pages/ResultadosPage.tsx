import { useState } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Space,
  Tag,
  Descriptions,
  Collapse,
  Spin,
  Empty,
  message as antMessage,
  Modal,
  Alert,
  Table,
  Row,
  Col,
} from 'antd';
import {
  SaveOutlined,
  CheckCircleOutlined,
  UserOutlined,
  ExperimentOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import {
  useOrdenesParaResultados,
  useOrdenConResultados,
  useGuardarResultados,
  useAprobarOrden,
} from '../hooks';
import type {
  OrdenParaResultados,
  ComponenteConResultado,
  AnalisisConComponentes,
  BulkResultadosInput,
} from '../types';
import PageContainer from '../../../shared/components/PageContainer';

const { Title, Text } = Typography;

// Interfaz para alertas de valores críticos
interface AlertaValorCritico {
  componenteNombre: string;
  valor: string;
  tipo: 'min' | 'max';
  limite: number;
}

export const ResultadosPage: React.FC = () => {
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<number | null>(null);
  const [form] = Form.useForm();
  const [modal, contextHolder] = Modal.useModal();

  const { data: ordenesPendientes, isLoading: loadingOrdenes } = useOrdenesParaResultados();
  const { data: ordenDetalle, isLoading: loadingDetalle } = useOrdenConResultados(
    ordenSeleccionada || 0,
    !!ordenSeleccionada
  );
  const guardarMutation = useGuardarResultados();
  const aprobarMutation = useAprobarOrden();

  // Columnas para la tabla de órdenes pendientes
  const columnasOrdenes: ColumnsType<OrdenParaResultados> = [
    {
      title: 'N° Atención',
      dataIndex: 'numero_atencion',
      key: 'numero_atencion',
      width: 100,
      render: (num: number) => <Tag color="blue">{num}</Tag>,
    },
    {
      title: 'Paciente',
      key: 'paciente',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.paciente_nombres} {record.paciente_apellidos}</Text>
          <Text type="secondary">DNI: {record.paciente_dni}</Text>
        </Space>
      ),
    },
    {
      title: 'Sede',
      dataIndex: 'sede_nombre',
      key: 'sede',
      width: 150,
    },
    {
      title: 'Análisis',
      dataIndex: 'total_analisis',
      key: 'analisis',
      width: 80,
      align: 'center',
    },
    {
      title: 'Fecha',
      dataIndex: 'fecha_registro',
      key: 'fecha',
      width: 140,
      render: (fecha: string) => dayjs(fecha).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Acción',
      key: 'accion',
      width: 120,
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<ExperimentOutlined />}
          onClick={() => {
            setOrdenSeleccionada(record.id);
            // Se resetea el form después de que se monte
            setTimeout(() => form.resetFields(), 0);
          }}
        >
          Ingresar
        </Button>
      ),
    },
  ];

  // Preparar resultados para envío
  const prepararResultados = (): BulkResultadosInput['resultados'] => {
    const values = form.getFieldsValue();
    const resultados: BulkResultadosInput['resultados'] = [];

    if (!ordenDetalle) return resultados;

    for (const analisis of ordenDetalle.analisis) {
      for (const componente of analisis.componentes) {
        const fieldName = `resultado_${analisis.orden_analisis_id}_${componente.componente_id}`;
        const valor = values[fieldName];

        if (valor && valor.trim() !== '') {
          resultados.push({
            orden_analisis_id: analisis.orden_analisis_id,
            componente_id: componente.componente_id,
            valor: valor.trim(),
          });
        }
      }
    }

    return resultados;
  };

  // Función para verificar alertas de valores críticos
  const verificarAlertasValores = (): AlertaValorCritico[] => {
    const values = form.getFieldsValue();
    const alertas: AlertaValorCritico[] = [];

    if (!ordenDetalle) return alertas;

    console.log('=== VERIFICANDO ALERTAS ===');
    console.log('Valores del formulario:', values);

    for (const analisis of ordenDetalle.analisis) {
      for (const componente of analisis.componentes) {
        const fieldName = `resultado_${analisis.orden_analisis_id}_${componente.componente_id}`;
        const valor = values[fieldName];

        console.log(`Componente: ${componente.componente_nombre}`);
        console.log(`  - valor_alerta_min: ${componente.valor_alerta_min}`);
        console.log(`  - valor_alerta_max: ${componente.valor_alerta_max}`);
        console.log(`  - Valor ingresado: ${valor}`);

        if (valor && valor.trim() !== '') {
          const valorNumerico = parseFloat(valor);
          
          // Solo verificar si el valor es numérico
          if (!isNaN(valorNumerico)) {
            // Verificar límite mínimo
            if (componente.valor_alerta_min !== null && componente.valor_alerta_min !== undefined) {
              if (valorNumerico < componente.valor_alerta_min) {
                console.log(`  -> ALERTA MIN: ${valorNumerico} < ${componente.valor_alerta_min}`);
                alertas.push({
                  componenteNombre: componente.componente_nombre,
                  valor: valor,
                  tipo: 'min',
                  limite: componente.valor_alerta_min,
                });
              }
            }
            // Verificar límite máximo
            if (componente.valor_alerta_max !== null && componente.valor_alerta_max !== undefined) {
              if (valorNumerico > componente.valor_alerta_max) {
                console.log(`  -> ALERTA MAX: ${valorNumerico} > ${componente.valor_alerta_max}`);
                alertas.push({
                  componenteNombre: componente.componente_nombre,
                  valor: valor,
                  tipo: 'max',
                  limite: componente.valor_alerta_max,
                });
              }
            }
          }
        }
      }
    }

    console.log('Total alertas encontradas:', alertas.length);
    return alertas;
  };

  // Mostrar modal de confirmación con alertas
  const mostrarConfirmacionAlertas = (
    alertas: AlertaValorCritico[],
    onConfirm: () => void,
    titulo: string
  ) => {
    console.log('=== MOSTRANDO MODAL DE ALERTAS ===');
    console.log('Alertas a mostrar:', alertas);
    
    modal.confirm({
      title: (
        <Space>
          <WarningOutlined style={{ color: '#faad14', fontSize: 20 }} />
          <span>Valores fuera de rango detectados</span>
        </Space>
      ),
      width: 500,
      content: (
        <div style={{ marginTop: 16 }}>
          <Alert
            type="warning"
            message="Los siguientes valores están fuera del rango de alerta configurado:"
            style={{ marginBottom: 16 }}
          />
          <div style={{ maxHeight: 200, overflow: 'auto' }}>
            {alertas.map((alerta, index) => (
              <div key={index} style={{ marginBottom: 8, padding: '8px 12px', background: '#fff7e6', borderRadius: 4 }}>
                <Text strong>{alerta.componenteNombre}</Text>
                <br />
                <Text type="secondary">
                  Valor: <Text type="danger" strong>{alerta.valor}</Text>
                  {alerta.tipo === 'min' 
                    ? ` (Muy bajo, límite mínimo: ${alerta.limite})`
                    : ` (Muy alto, límite máximo: ${alerta.limite})`
                  }
                </Text>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16 }}>
            <Text>¿Está seguro de que desea {titulo.toLowerCase()}?</Text>
          </div>
        </div>
      ),
      okText: `Sí, ${titulo}`,
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: onConfirm,
    });
  };

  // Guardar sin aprobar
  const handleGuardar = async () => {
    if (!ordenSeleccionada) return;

    const resultados = prepararResultados();
    if (resultados.length === 0) {
      antMessage.warning('No hay resultados para guardar');
      return;
    }

    // Verificar alertas
    const alertas = verificarAlertasValores();
    
    if (alertas.length > 0) {
      mostrarConfirmacionAlertas(alertas, async () => {
        await guardarMutation.mutateAsync({
          ordenId: ordenSeleccionada,
          resultados,
        });
        // Volver a la lista después de guardar
        setOrdenSeleccionada(null);
        form.resetFields();
      }, 'Guardar resultados');
    } else {
      await guardarMutation.mutateAsync({
        ordenId: ordenSeleccionada,
        resultados,
      });
      // Volver a la lista después de guardar
      setOrdenSeleccionada(null);
      form.resetFields();
    }
  };

  // Aprobar orden
  const handleAprobar = async () => {
    if (!ordenSeleccionada) return;

    const resultados = prepararResultados();
    if (resultados.length === 0) {
      antMessage.warning('Debe ingresar al menos un resultado para aprobar');
      return;
    }

    // Verificar alertas
    const alertas = verificarAlertasValores();
    
    if (alertas.length > 0) {
      mostrarConfirmacionAlertas(alertas, async () => {
        await aprobarMutation.mutateAsync({
          ordenId: ordenSeleccionada,
          resultados,
        });
        // Limpiar selección después de aprobar
        setOrdenSeleccionada(null);
        form.resetFields();
      }, 'Aprobar orden');
    } else {
      await aprobarMutation.mutateAsync({
        ordenId: ordenSeleccionada,
        resultados,
      });
      // Limpiar selección después de aprobar
      setOrdenSeleccionada(null);
      form.resetFields();
    }
  };

  // Renderizar formulario de componentes para un análisis
  const renderComponentes = (analisis: AnalisisConComponentes) => {
    const columns: ColumnsType<ComponenteConResultado> = [
      {
        title: 'Componente',
        dataIndex: 'componente_nombre',
        key: 'nombre',
        width: '25%',
      },
      {
        title: 'Resultado',
        key: 'resultado',
        width: '25%',
        render: (_, record) => {
          const fieldName = `resultado_${analisis.orden_analisis_id}_${record.componente_id}`;
          return (
            <Form.Item
              name={fieldName}
              initialValue={record.resultado_valor || ''}
              style={{ marginBottom: 0 }}
            >
              <Input
                placeholder="Ingrese resultado"
                style={{ width: '100%' }}
              />
            </Form.Item>
          );
        },
      },
      {
        title: 'Unidad',
        dataIndex: 'unidad_medida',
        key: 'unidad',
        width: '15%',
        render: (unidad: string | null) => unidad || '-',
      },
      {
        title: 'Rango Referencial',
        key: 'rango',
        width: '20%',
        render: (_, record) => {
          if (!record.valores_referenciales || record.valores_referenciales.length === 0) {
            return '-';
          }
          return (
            <Space direction="vertical" size={0}>
              {record.valores_referenciales.map((val, idx) => (
                <Text key={idx} type="secondary" style={{ fontSize: '12px' }}>
                  {val}
                </Text>
              ))}
            </Space>
          );
        },
      },
      {
        title: 'Método',
        dataIndex: 'metodo_nombre',
        key: 'metodo',
        width: '15%',
        render: (metodo: string | null) => metodo || '-',
      },
    ];

    return (
      <Table
        columns={columns}
        dataSource={analisis.componentes}
        rowKey="componente_id"
        pagination={false}
        size="small"
      />
    );
  };

  return (
    <PageContainer>
      {contextHolder}
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ marginBottom: 8 }}>Ingreso de Resultados</Title>
        </Col>
      </Row>

      {/* Tabla de órdenes pendientes */}
      {!ordenSeleccionada && (
          <Table
            columns={columnasOrdenes}
            dataSource={ordenesPendientes || []}
            rowKey="id"
            loading={loadingOrdenes}
            pagination={{ pageSize: 10 }}
            locale={{
              emptyText: (
                <Empty
                  description="No hay órdenes pendientes de resultados"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ),
            }}
          />
      )}

      {/* Formulario de ingreso de resultados */}
      {ordenSeleccionada && (
        <Spin spinning={loadingDetalle}>
          {ordenDetalle && (
            <Form form={form} layout="vertical">
              {/* Header con datos del paciente */}
              <Card style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <Space>
                      <Tag color="blue" style={{ fontSize: '16px', padding: '4px 12px' }}>
                        N° {ordenDetalle.numero_atencion}
                      </Tag>
                      <Tag color="orange">{ordenDetalle.estado}</Tag>
                    </Space>
                    <Descriptions column={3} style={{ marginTop: 16 }} size="small">
                      <Descriptions.Item label={<><UserOutlined /> Paciente</>}>
                        <Text strong>
                          {ordenDetalle.paciente_nombres} {ordenDetalle.paciente_apellidos}
                        </Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="DNI">
                        {ordenDetalle.paciente_dni}
                      </Descriptions.Item>
                      <Descriptions.Item label="Fecha Registro">
                        {dayjs(ordenDetalle.fecha_registro).format('DD/MM/YYYY HH:mm')}
                      </Descriptions.Item>
                    </Descriptions>
                  </div>
                  <Button onClick={() => setOrdenSeleccionada(null)}>
                    Volver a lista
                  </Button>
                </div>
              </Card>

              {/* Análisis con sus componentes */}
              <Card
                title={`Análisis Solicitados (${ordenDetalle.analisis.length})`}
                style={{ marginBottom: 16 }}
              >
                <Collapse
                  defaultActiveKey={ordenDetalle.analisis.map(a => a.orden_analisis_id.toString())}
                  items={ordenDetalle.analisis.map((analisis) => ({
                    key: analisis.orden_analisis_id.toString(),
                    label: (
                      <Space>
                        <ExperimentOutlined />
                        <Text strong>{analisis.analisis_nombre}</Text>
                        <Tag>{analisis.componentes.length} componentes</Tag>
                      </Space>
                    ),
                    children: renderComponentes(analisis),
                  }))}
                />
              </Card>

              {/* Botones de acción */}
              <Card>
                <Space size="large">
                  <Button
                    type="default"
                    size="large"
                    icon={<SaveOutlined />}
                    loading={guardarMutation.isPending}
                    onClick={handleGuardar}
                  >
                    Guardar Resultados
                  </Button>
                  <Button
                    type="primary"
                    size="large"
                    icon={<CheckCircleOutlined />}
                    loading={aprobarMutation.isPending}
                    onClick={handleAprobar}
                    style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                  >
                    Aprobar Orden
                  </Button>
                </Space>
                <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                  * Aprobar guardará los resultados y cambiará el estado de la orden a APROBADA
                </Text>
              </Card>
            </Form>
          )}
        </Spin>
      )}
    </PageContainer>
  );
};
