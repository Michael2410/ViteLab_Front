import { Button, Dropdown, type MenuProps } from 'antd';
import { FileExcelOutlined, FilePdfOutlined, DownloadOutlined } from '@ant-design/icons';

interface Props {
  onExportExcel: () => void;
  onExportPDF: () => void;
  disabled?: boolean;
}

export default function ExportButtons({ onExportExcel, onExportPDF, disabled = false }: Props) {
  const items: MenuProps['items'] = [
    {
      key: 'excel',
      label: 'Exportar a Excel',
      icon: <FileExcelOutlined style={{ color: '#217346' }} />,
      onClick: onExportExcel,
    },
    {
      key: 'pdf',
      label: 'Exportar a PDF',
      icon: <FilePdfOutlined style={{ color: '#ff4d4f' }} />,
      onClick: onExportPDF,
    },
  ];

  return (
    <Dropdown menu={{ items }} placement="bottomRight" disabled={disabled}>
      <Button icon={<DownloadOutlined />} disabled={disabled}>
        Exportar
      </Button>
    </Dropdown>
  );
}
