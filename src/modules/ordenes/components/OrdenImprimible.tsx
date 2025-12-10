import React from 'react';
import dayjs from 'dayjs';
import { Typography, Table, Row, Col, Divider } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { OrdenDetalle } from '../types';
import type { ConfiguracionSistema as Configuracion } from '../../sistema/types';
import './OrdenImprimible.css';

const { Title, Text } = Typography;

export interface OrdenImprimibleProps {
  orden: OrdenDetalle;
  configuracion: Configuracion | null;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const getImageUrl = (path: string | null | undefined) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_URL.replace('/api', '')}${path}`;
};

const calcularEdad = (fechaNacimiento: string | null | undefined): string => {
  if (!fechaNacimiento) return '-';
  const hoy = dayjs();
  const nacimiento = dayjs(fechaNacimiento);
  const años = hoy.diff(nacimiento, 'year');
  return `${años} años`;
};

export const OrdenImprimible = React.forwardRef<HTMLDivElement, OrdenImprimibleProps>(
  ({ orden, configuracion }, ref) => {

    const logoUrl = getImageUrl(configuracion?.logo_principal);
    const totalOrden = orden.analisis.reduce(
      (sum, item) => sum + (Number(item.precio) || 0),
      0
    );

    const analisisColumns: ColumnsType<(typeof orden.analisis)[0]> = [
      {
        title: 'Análisis',
        dataIndex: 'nombre',
        key: 'nombre',
      },
      {
        title: 'Precio',
        dataIndex: 'precio',
        key: 'precio',
        align: 'right',
        render: (precio: number) => `S/ ${(Number(precio) || 0).toFixed(2)}`,
      },
    ];

    return (
      <div ref={ref} className="print-container-orden">

        {/* 1. Encabezado */}
        <header className="print-header">
          <Row align="middle" justify="space-between">
            <Col span={12}>
              {logoUrl && <img src={logoUrl} alt="Logo" className="print-logo" />}
              <Title level={4} style={{ margin: 0 }}>
                {configuracion?.empresa_nombre || 'Laboratorio Clínico'}
              </Title>
              {configuracion?.empresa_ruc && (
                <Text>RUC: {configuracion.empresa_ruc}</Text>
              )}
            </Col>

            <Col span={12} style={{ textAlign: 'right' }}>
              <Title level={3} style={{ margin: 0 }}>Orden de Atención</Title>
              <Text strong style={{ fontSize: '1.2em' }}>
                N°: {String(orden.numero_atencion).padStart(6, '0')}
              </Text>
              <br />
              <Text type="secondary">
                Fecha: {dayjs(orden.fecha_registro).format('DD/MM/YYYY HH:mm A')}
              </Text>
            </Col>
          </Row>
        </header>

        <Divider />

        {/* 2. Datos del Paciente */}
        <section className="print-section">
          <Title level={5}>Datos del Paciente</Title>

          <Row>
            <Col span={12}>
              <Text strong>Paciente: </Text>
              <Text>{orden.paciente.nombres} {orden.paciente.apellido_paterno}</Text>
            </Col>

            <Col span={12}>
              <Text strong>DNI: </Text>
              <Text>{orden.paciente.dni}</Text>
            </Col>

            <Col span={12}>
              <Text strong>Edad: </Text>
              <Text>{calcularEdad(orden.paciente.fecha_nacimiento)}</Text>
            </Col>

            <Col span={12}>
              <Text strong>Sexo: </Text>
              <Text>{orden.paciente.genero === 'M' ? 'MASCULINO' : 'FEMENINO'}</Text>
            </Col>

            {orden.paciente.telefono && (
              <Col span={12}>
                <Text strong>Teléfono: </Text>
                <Text>{orden.paciente.telefono}</Text>
              </Col>
            )}

            {orden.paciente.email && (
              <Col span={12}>
                <Text strong>Email: </Text>
                <Text>{orden.paciente.email}</Text>
              </Col>
            )}
          </Row>
        </section>

        <Divider />

        {/* 4. Análisis Solicitados */}
        <section className="print-section">
          <Title level={5}>Análisis Solicitados</Title>
          <Table
            columns={analisisColumns}
            dataSource={orden.analisis}
            rowKey="id"
            pagination={false}
            size="small"
          />
        </section>

        {/* 5. Resumen */}
        <section className="print-section print-summary">
          <Row justify="end">
            <Col>
              <Text strong style={{ fontSize: '1.2em', marginRight: '20px' }}>
                Monto Total:
              </Text>
              <Text strong style={{ fontSize: '1.2em' }}>
                S/ {totalOrden.toFixed(2)}
              </Text>
            </Col>
          </Row>
        </section>

        <footer className="print-footer">
          <Text type="secondary">Gracias por su preferencia.</Text>
        </footer>
      </div>
    );
  }
);
