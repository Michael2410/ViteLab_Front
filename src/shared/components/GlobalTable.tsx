import { Table } from 'antd';
import type { TableProps } from 'antd';
import type { AnyObject } from 'antd/es/_util/type';

export interface GlobalTableProps<RecordType extends AnyObject = AnyObject>
  extends TableProps<RecordType> {
  /** Nombre del recurso en plural para el contador de paginación (ej. 'tarifarios', 'órdenes') */
  resourceName?: string;
}

/**
 * GlobalTable - Componente de tabla con configuración global predeterminada de ViteLab.
 * Centraliza paginación, scroll responsive y atributos base.
 * Todas las props pueden ser sobrescritas individualmente si es necesario.
 */
export function GlobalTable<RecordType extends AnyObject = AnyObject>({
  resourceName,
  rowKey = 'id',
  bordered = false,
  size = 'middle',
  scroll,
  pagination,
  ...restProps
}: GlobalTableProps<RecordType>) {
  const defaultShowTotal = resourceName
    ? (total: number) => `Total ${total} ${resourceName}`
    : (total: number, range: [number, number]) =>
        `${range[0]}-${range[1]} de ${total} registros`;

  const defaultPagination = {
    showSizeChanger: true,
    showTotal: defaultShowTotal,
    pageSizeOptions: ['10', '20', '50', '100'],
    defaultPageSize: 10,
  };

  const mergedPagination =
    pagination === false
      ? false
      : {
          ...defaultPagination,
          ...(typeof pagination === 'object' ? pagination : {}),
        };

  const defaultScroll = {
    x: 'max-content',
    ...(pagination === false ? {} : { y: 620 }),
  };

  const mergedScroll = {
    ...defaultScroll,
    ...(scroll || {}),
  };


  return (
    <Table<RecordType>
      rowKey={rowKey}
      bordered={bordered}
      size={size}
      scroll={mergedScroll}
      pagination={mergedPagination}
      {...restProps}
    />
  );
}

export default GlobalTable;

