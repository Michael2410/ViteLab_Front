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
  App,
  Alert,
  Table,
  Row,
  Col,
  Result,
} from 'antd';
import {
  CheckCircleOutlined,
  UserOutlined,
  ExperimentOutlined,
  EyeOutlined,
  EditOutlined,
  FileTextOutlined,
  WarningOutlined,
  SaveOutlined,
  LockOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import {
  useOrdenesPendientesAprobacion,
  useOrdenConResultados,
  useGuardarResultados,
  useAprobarOrden,
} from '../hooks';
import { useAuthStore } from '../../auth/hooks';
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

export const AprobacionesPage: React.FC = () => {
  const navigate = useNavigate();
  const { modal } = App.useApp();
  const { hasPermission } = useAuthStore();
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<number | null>(null);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [form] = Form.useForm();

  const { data: ordenesPendientes, isLoading: loadingOrdenes } = useOrdenesPendientesAprobacion({
    enabled: hasPermission('results.read'),
  });
  const { data: ordenDetalle, isLoading: loadingDetalle } = useOrdenConResultados(
    ordenSeleccionada || 0,
    !!ordenSeleccionada && hasPermission('results.read')
  );
  const guardarMutation = useGuardarResultados();
  const aprobarMutation = useAprobarOrden();

  // Columnas para la tabla de órdenes pendientes de aprobación
  const columnasOrdenes: ColumnsType<OrdenParaResultados> = [
    {
      title: 'N° Atención',
      dataIndex: 'numero_atencion',
      key: 'numero_atencion',
      width: 100,
      render: (num: number) => <Tag color="orange">{num}</Tag>,
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
      title: 'Acciones',
      key: 'acciones',
      width: 200,
      render: (_, record) => (
        <Space>
          {hasPermission('results.read') && (
            <Button
              type="primary"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                setOrdenSeleccionada(record.id);
                setModoEdicion(false);
                form.resetFields();
              }}
            >
              Revisar
            </Button>
          )}
          {hasPermission('results.read') && (
            <Button
              size="small"
              icon={<FileTextOutlined />}
              onClick={() => navigate(`/resultados/orden/${record.id}`)}
            >
              Vista Previa
            </Button>
          )}
        </Space>
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
    const alertas: AlertaValorCritico[] = [];

    if (!ordenDetalle) return alertas;

    for (const analisis of ordenDetalle.analisis) {
      for (const componente of analisis.componentes) {
        const valor = componente.resultado_valor;

        if (valor && valor.trim() !== '') {
          const valorNumerico = parseFloat(valor);
          
          // Solo verificar si el valor es numérico
          if (!isNaN(valorNumerico)) {
            // Verificar límite mínimo
            if (componente.valor_alerta_min !== null && componente.valor_alerta_min !== undefined) {
              if (valorNumerico < componente.valor_alerta_min) {
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

    return alertas;
  };

  // Guardar cambios en modo edición
  const handleGuardarCambios = async () => {
    if (!ordenSeleccionada) return;

    const resultados = prepararResultados();
    if (resultados.length === 0) {
      antMessage.warning('No hay resultados para guardar');
      return;
    }

    await guardarMutation.mutateAsync({
      ordenId: ordenSeleccionada,
      resultados,
    });

    setModoEdicion(false);
  };

  // Aprobar orden
  const handleAprobar = async () => {
    if (!ordenSeleccionada || !ordenDetalle) return;

    // Verificar que tenga al menos un resultado
    const tieneResultados = ordenDetalle.analisis.some(a =>
      a.componentes.some(c => c.tiene_resultado)
    );

    if (!tieneResultados) {
      antMessage.warning('La orden no tiene resultados ingresados');
      return;
    }

    // Verificar alertas de valores críticos
    const alertas = verificarAlertasValores();
    
    const realizarAprobacion = async () => {
      // Preparar resultados actuales
      const resultados: BulkResultadosInput['resultados'] = [];
      for (const analisis of ordenDetalle.analisis) {
        for (const componente of analisis.componentes) {
          if (componente.tiene_resultado && componente.resultado_valor) {
            resultados.push({
              orden_analisis_id: analisis.orden_analisis_id,
              componente_id: componente.componente_id,
              valor: componente.resultado_valor,
            });
          }
        }
      }

      await aprobarMutation.mutateAsync({
        ordenId: ordenSeleccionada,
        resultados,
      });

      // Limpiar selección después de aprobar
      setOrdenSeleccionada(null);
      setModoEdicion(false);
      form.resetFields();
    };

    if (alertas.length > 0) {
      // Mostrar modal con alertas
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
              <Text>¿Está seguro de que desea aprobar esta orden?</Text>
            </div>
          </div>
        ),
        okText: 'Sí, Aprobar',
        okType: 'danger',
        cancelText: 'Cancelar',
        onOk: realizarAprobacion,
      });
    } else {
      // Sin alertas, mostrar confirmación normal
      modal.confirm({
        title: '¿Confirmar aprobación?',
        content: `Se aprobará la orden ${ordenDetalle.numero_atencion}. Esta acción cambiará el estado a APROBADA.`,
        okText: 'Aprobar',
        cancelText: 'Cancelar',
        okButtonProps: { style: { backgroundColor: '#52c41a', borderColor: '#52c41a' } },
        onOk: realizarAprobacion,
      });
    }
  };

  // Renderizar componentes en modo visualización o edición
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
          if (modoEdicion) {
            const fieldName = `resultado_${analisis.orden_analisis_id}_${record.componente_id}`;
            return (
              <Form.Item
                name={fieldName}
                initialValue={record.resultado_valor || ''}
                style={{ marginBottom: 0 }}
              >
                <Input placeholder="Ingrese resultado" style={{ width: '100%' }} readOnly={!hasPermission('results.update')} />
              </Form.Item>
            );
          }
          return record.resultado_valor ? (
            <Text strong>{record.resultado_valor}</Text>
          ) : (
            <Text type="secondary">-</Text>
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

  if (!hasPermission('results.read')) {
    return (
      <Result
        status="403"
        icon={<LockOutlined />}
        title="Acceso Denegado"
        subTitle="No tienes permisos para acceder a esta sección."
        extra={
          <Button type="primary" onClick={() => navigate('/')} icon={<ArrowLeftOutlined />}>
            Volver al inicio
          </Button>
        }
      />
    );
  }

  return (
    <PageContainer>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ marginBottom: 8 }}>Aprobaciones Pendientes</Title>
        </Col>
      </Row>

      {/* Tabla de órdenes pendientes de aprobación */}
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
                  description="No hay órdenes pendientes de aprobación"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ),
            }}
          />
      )}

      {/* Detalle de la orden con resultados */}
      {ordenSeleccionada && (
        <Spin spinning={loadingDetalle}>
          {ordenDetalle && (
            <Form form={form} layout="vertical">
              {/* Header con datos del paciente */}
              <Card style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <Space>
                      <Tag color="orange" style={{ fontSize: '16px', padding: '4px 12px' }}>
                        N° {ordenDetalle.numero_atencion}
                      </Tag>
                      <Tag color="processing">{ordenDetalle.estado}</Tag>
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
                      {ordenDetalle.sede_nombre && (
                        <Descriptions.Item label="Sede">
                          {ordenDetalle.sede_nombre}
                        </Descriptions.Item>
                      )}
                      {ordenDetalle.medico && (
                        <Descriptions.Item label="Médico">
                          {ordenDetalle.medico}
                        </Descriptions.Item>
                      )}
                    </Descriptions>
                  </div>
                  <Space>
                    {hasPermission('results.read') && (
                      <Button
                        icon={<FileTextOutlined />}
                        onClick={() => navigate(`/resultados/orden/${ordenSeleccionada}`)}
                      >
                        Vista Previa
                      </Button>
                    )}
                    <Button onClick={() => {
                      setOrdenSeleccionada(null);
                      setModoEdicion(false);
                    }}>
                      Volver a lista
                    </Button>
                  </Space>
                </div>
              </Card>

              {/* Análisis con sus componentes y resultados */}
              <Card
                title={`Resultados (${ordenDetalle.analisis.length} análisis)`}
                style={{ marginBottom: 16 }}
                extra={
                  !modoEdicion ? (
                    hasPermission('results.update') && (
                      <Button
                        icon={<EditOutlined />}
                        onClick={() => setModoEdicion(true)}
                      >
                        Editar Resultados
                      </Button>
                    )
                  ) : (
                    <Space>
                      <Button onClick={() => setModoEdicion(false)}>
                        Cancelar
                      </Button>
                      {hasPermission('results.update') && (
                        <Button
                          type="primary"
                          icon={<SaveOutlined />}
                          loading={guardarMutation.isPending}
                          onClick={handleGuardarCambios}
                        >
                          Guardar Cambios
                        </Button>
                      )}
                    </Space>
                  )
                }
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
                        <Tag color={analisis.componentes.some(c => c.tiene_resultado) ? 'success' : 'default'}>
                          {analisis.componentes.filter(c => c.tiene_resultado).length} resultados
                        </Tag>
                      </Space>
                    ),
                    children: renderComponentes(analisis),
                  }))}
                />
              </Card>

              {/* Botón de aprobación */}
              {!modoEdicion && hasPermission('results.approve') && (
                <Card>
                  <Space size="large">
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
                    * Al aprobar, el estado de la orden cambiará a APROBADA y se podrá generar el informe final
                  </Text>
                </Card>
              )}
            </Form>
          )}
        </Spin>
      )}
    </PageContainer>
  );
};
