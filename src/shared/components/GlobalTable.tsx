import { Table } from 'antd';
import type { TableProps } from 'antd';
import type { AnyObject } from 'antd/es/_util/type';

/**
 * GlobalTable - Componente de tabla con configuración global predeterminada
 * Todas las props pueden ser sobrescritas individualmente si es necesario
 */
function GlobalTable<RecordType extends AnyObject = AnyObject>(
  props: TableProps<RecordType>
) {
  const defaultPagination = {
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total: number, range: [number, number]) => 
      `${range[0]}-${range[1]} de ${total} registros`,
    pageSizeOptions: ['10', '20', '50', '100'],
    defaultPageSize: 10,
  };

  // Merge pagination: si es false, respetamos false; si es objeto, hacemos merge
  const pagination = props.pagination === false 
    ? false 
    : { ...defaultPagination, ...(typeof props.pagination === 'object' ? props.pagination : {}) };

  return (
    <Table<RecordType>
      bordered
      size="middle"
      scroll={{ x: 'max-content' }}
      {...props}
      pagination={pagination}
    />
  );
}

export default GlobalTable;
