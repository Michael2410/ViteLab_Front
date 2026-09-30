import React, { useEffect, useState } from 'react';
import {
  Modal,
  Descriptions,
  Tag,
  Typography,
  Button,
  Space,
  Select,
  InputNumber,
  Input,
  Alert,
  Spin,
  message,
} from 'antd';
import {
  SendOutlined,
  CheckCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { GlobalTable } from '../../../../shared/components/GlobalTable';
import type { Pedido } from '../pedidos.types';
import { pedidosApi } from '../pedidos.api';
import { despachosApi } from '../../despachos/despachos.api';
import { stockApi } from '../../stock/stock.api';
import type { StockItem } from '../../stock/stock.types';

const { Text } = Typography;

interface DespachoItemRow {
  key: string;
  detalle_id: number;
  producto_id: number;
  producto_codigo: string;
  producto_nombre: string;
  unidad_medida: string;
  cantidad_solicitada: number;
  cantidad_aprobada: number;
  cantidad_atendida: number;
  pendiente: number;
  lote_id: number | null;
  cantidad_a_despachar: number;
  stock_disponible_lote: number;
  lotesDisponibles: StockItem[];
  sinStock: boolean;
}

interface DespacharPedidoModalProps {
  open: boolean;
  pedido: Pedido | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const DespacharPedidoModal: React.FC<DespacharPedidoModalProps> = ({
  open,
  pedido,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [despachando, setDespachando] = useState(false);
  const [pedidoCompleto, setPedidoCompleto] = useState<Pedido | null>(null);
  const [filas, setFilas] = useState<DespachoItemRow[]>([]);
  const [observacionesDespacho, setObservacionesDespacho] = useState('');

  useEffect(() => {
    if (!open || !pedido) {
      setFilas([]);
      setPedidoCompleto(null);
      setObservacionesDespacho('');
      return;
    }

    const cargarDatos = async () => {
      setLoading(true);
      try {
        // 1. Obtener pedido completo con ítems actualizados
        const ped = await pedidosApi.obtener(pedido.id);
        setPedidoCompleto(ped);

        // 2. Obtener stock detallado por lotes para el almacén del pedido
        const stockRes = await stockApi.listarStock({
          almacen_id: ped.almacen_id,
          desglosar_lote: true,
          con_saldo: true,
          limit: 500,
        });
        const lotes = stockRes.items || [];

        // 3. Mapear cada ítem del pedido con sus lotes disponibles
        const nuevasFilas: DespachoItemRow[] = (ped.items || []).map((item) => {
          const aprob = item.cantidad_aprobada !== null ? Number(item.cantidad_aprobada) : Number(item.cantidad_solicitada);
          const atend = Number(item.cantidad_atendida || 0);
          const pend = Math.max(0, aprob - atend);

          // Filtrar lotes de este producto con saldo > 0 en este almacén
          const lotesDelProd = lotes
            .filter((s) => s.producto_id === item.producto_id && Number(s.cantidad) > 0)
            .sort((a, b) => {
              // FEFO: Vencimiento más cercano primero
              if (!a.fecha_vencimiento) return 1;
              if (!b.fecha_vencimiento) return -1;
              return dayjs(a.fecha_vencimiento).diff(dayjs(b.fecha_vencimiento));
            });

          const loteSugerido = lotesDelProd.length > 0 ? lotesDelProd[0] : null;
          const stockLote = loteSugerido ? Number(loteSugerido.cantidad) : 0;
          const cantidadSugerida = loteSugerido && pend > 0 ? Math.min(pend, stockLote) : 0;

          return {
            key: `detalle_${item.id}`,
            detalle_id: item.id,
            producto_id: item.producto_id,
            producto_codigo: item.producto_codigo || '',
            producto_nombre: item.producto_nombre,
            unidad_medida: item.unidad_medida_codigo || '',
            cantidad_solicitada: Number(item.cantidad_solicitada),
            cantidad_aprobada: aprob,
            cantidad_atendida: atend,
            pendiente: pend,
            lote_id: loteSugerido?.lote_id ?? null,
            cantidad_a_despachar: cantidadSugerida,
            stock_disponible_lote: stockLote,
            lotesDisponibles: lotesDelProd,
            sinStock: lotesDelProd.length === 0,
          };
        });

        setFilas(nuevasFilas);
        setObservacionesDespacho(`Atención de Pedido ${ped.numero}`);
      } catch (err: any) {
        console.error(err);
        message.error(err.response?.data?.message || 'Error cargando datos para despacho');
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [open, pedido]);

  const handleLoteChange = (key: string, loteId: number) => {
    setFilas((prev) =>
      prev.map((f) => {
        if (f.key !== key) return f;
        const loteEncontrado = f.lotesDisponibles.find((l) => l.lote_id === loteId);
        const stockLote = loteEncontrado ? Number(loteEncontrado.cantidad) : 0;
        return {
          ...f,
          lote_id: loteId,
          stock_disponible_lote: stockLote,
          cantidad_a_despachar: Math.min(f.pendiente, stockLote),
        };
      })
    );
  };

  const handleCantidadChange = (key: string, valor: number | null) => {
    const v = valor || 0;
    setFilas((prev) =>
      prev.map((f) => (f.key === key ? { ...f, cantidad_a_despachar: v } : f))
    );
  };

  const handleConfirmarDespacho = async () => {
    if (!pedidoCompleto) return;

    // Filtrar ítems que se van a despachar
    const itemsADespachar = filas.filter((f) => f.cantidad_a_despachar > 0);

    if (itemsADespachar.length === 0) {
      message.warning('Debe ingresar una cantidad a despachar mayor a 0 en al menos un producto');
      return;
    }

    // Validaciones
    for (const item of itemsADespachar) {
      if (!item.lote_id) {
        message.error(`Debe seleccionar un lote para ${item.producto_nombre}`);
        return;
      }
      if (item.cantidad_a_despachar > item.stock_disponible_lote) {
        message.error(
          `La cantidad a despachar de ${item.producto_nombre} (${item.cantidad_a_despachar}) supera el stock del lote (${item.stock_disponible_lote})`
        );
        return;
      }
      if (item.cantidad_a_despachar > item.pendiente) {
        message.error(
          `La cantidad de ${item.producto_nombre} (${item.cantidad_a_despachar}) no puede exceder el saldo pendiente (${item.pendiente})`
        );
        return;
      }
    }

    try {
      setDespachando(true);
      await despachosApi.crear({
        almacen_id: pedidoCompleto.almacen_id,
        receptor_personal_id: pedidoCompleto.solicitante_personal_id,
        area_id: pedidoCompleto.area_id || undefined,
        pedido_id: pedidoCompleto.id,
        fecha: dayjs().format('YYYY-MM-DD'),
        observaciones: observacionesDespacho.trim() || `Despacho de Pedido ${pedidoCompleto.numero}`,
        items: itemsADespachar.map((i) => ({
          producto_id: i.producto_id,
          lote_id: i.lote_id!,
          cantidad: i.cantidad_a_despachar,
          pedido_detalle_id: i.detalle_id,
        })),
      });

      message.success('Pedido despachado exitosamente y asignado en custodia al solicitante');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      message.error(err.response?.data?.message || 'Error registrando el despacho del pedido');
    } finally {
      setDespachando(false);
    }
  };

  const columns: ColumnsType<DespachoItemRow> = [
    {
      title: 'Producto / Reactivo',
      key: 'producto',
      render: (_, r) => (
        <div>
          <Text strong>{r.producto_nombre}</Text>
          {r.producto_codigo && (
            <Text type="secondary" style={{ display: 'block', fontSize: 11 }}>
              Código: {r.producto_codigo}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: 'Solicitado / Aprobado',
      key: 'solicitado',
      width: 140,
      align: 'right',
      render: (_, r) => (
        <div>
          <Text>{r.cantidad_solicitada} {r.unidad_medida}</Text>
          {r.cantidad_aprobada !== r.cantidad_solicitada && (
            <Text type="secondary" style={{ display: 'block', fontSize: 11 }}>
              Aprobado: {r.cantidad_aprobada}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: 'Pendiente',
      dataIndex: 'pendiente',
      key: 'pendiente',
      width: 110,
      align: 'right',
      render: (v, r) => (
        <Text strong style={{ color: v > 0 ? '#d97706' : '#10b981' }}>
          {v} {r.unidad_medida}
        </Text>
      ),
    },
    {
      title: 'Lote a Despachar (FEFO)',
      key: 'lote',
      width: 260,
      render: (_, r) => {
        if (r.sinStock) {
          return (
            <Tag color="error" icon={<WarningOutlined />}>
              Sin stock en almacén
            </Tag>
          );
        }

        return (
          <Select
            style={{ width: '100%' }}
            value={r.lote_id}
            placeholder="Seleccione lote..."
            onChange={(val) => handleLoteChange(r.key, val)}
            options={r.lotesDisponibles.map((l) => ({
              value: l.lote_id,
              label: `${l.numero_lote || 'Sin lote'} (Stock: ${l.cantidad} | Vence: ${
                l.fecha_vencimiento ? dayjs(l.fecha_vencimiento).format('DD/MM/YYYY') : 'S/F'
              })`,
            }))}
          />
        );
      },
    },
    {
      title: 'Cant. a Despachar',
      key: 'cantidad',
      width: 140,
      align: 'right',
      render: (_, r) => (
        <InputNumber
          min={0}
          max={Math.min(r.pendiente, r.stock_disponible_lote)}
          step={1}
          value={r.cantidad_a_despachar}
          disabled={r.sinStock || r.pendiente === 0}
          onChange={(val) => handleCantidadChange(r.key, val)}
          style={{ width: '100%' }}
        />
      ),
    },
  ];

  const totalPendiente = filas.reduce((acc, f) => acc + f.pendiente, 0);
  const totalDespachar = filas.reduce((acc, f) => acc + f.cantidad_a_despachar, 0);
  const haySinStock = filas.some((f) => f.sinStock && f.pendiente > 0);

  return (
    <Modal
      title={
        <Space align="center">
          <SendOutlined style={{ color: '#0284c7' }} />
          <span>Despachar y Asignar Pedido {pedidoCompleto?.numero || pedido?.numero}</span>
          <Tag color="cyan">Despacho Inmediato</Tag>
        </Space>
      }
      open={open}
      onCancel={onClose}
      width={940}
      destroyOnClose
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Text type="secondary">
              Total a despachar:{' '}
              <Text strong style={{ color: '#0284c7', fontSize: 15 }}>
                {totalDespachar}
              </Text>{' '}
              unidades de {totalPendiente} pendientes
            </Text>
          </div>
          <Space>
            <Button onClick={onClose}>Cancelar</Button>
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={handleConfirmarDespacho}
              loading={despachando}
              disabled={loading || totalDespachar === 0}
              style={{
                background: 'linear-gradient(135deg, #0284c7 0%, #059669 100%)',
                borderColor: '#0284c7',
                fontWeight: 600,
              }}
            >
              Confirmar Despacho y Entrega
            </Button>
          </Space>
        </div>
      }
    >
      {loading ? (
        <div style={{ padding: '40px 0', textAlign: 'center' }}>
          <Spin size="large" tip="Cargando stock y lotes disponibles del pedido..." />
        </div>
      ) : (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {haySinStock && (
            <Alert
              type="warning"
              showIcon
              message="Atención con el Stock"
              description="Algunos productos solicitados no cuentan con stock disponible en este almacén. Solo se registrará la salida de los ítems con stock confirmado."
            />
          )}

          <Descriptions bordered size="small" column={{ xs: 1, sm: 3 }}>
            <Descriptions.Item label="Almacén de Salida">
              <Tag color="blue">{pedidoCompleto?.almacen_nombre || '-'}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Colaborador Solicitante">
              <Text strong>
                {pedidoCompleto?.solicitante_nombres} {pedidoCompleto?.solicitante_apellidos}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Estado Actual">
              <Tag color={pedidoCompleto?.estado === 'PENDIENTE' ? 'gold' : 'blue'}>
                {pedidoCompleto?.estado}
              </Tag>
            </Descriptions.Item>
            {pedidoCompleto?.observaciones && (
              <Descriptions.Item label="Observaciones Pedido" span={3}>
                {pedidoCompleto.observaciones}
              </Descriptions.Item>
            )}
          </Descriptions>

          <div>
            <div
              style={{
                marginBottom: 8,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text strong style={{ fontSize: 13 }}>
                Productos a entregar (Selección de Lote y Saldo):
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                * El sistema prioriza automáticamente los lotes más próximos a vencer (FEFO)
              </Text>
            </div>
            <GlobalTable<DespachoItemRow>
              dataSource={filas}
              columns={columns}
              pagination={false}
              size="small"
              bordered
              locale={{
                emptyText: 'No hay ítems para despachar en este pedido.',
              }}
            />
          </div>

          <div>
            <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
              Nota / Observación del Despacho:
            </Text>
            <Input
              value={observacionesDespacho}
              onChange={(e) => setObservacionesDespacho(e.target.value)}
              placeholder="Ej: Entregado conforme en el turno mañana..."
            />
          </div>
        </Space>
      )}
    </Modal>
  );
};
