import { useParams, useNavigate } from "react-router-dom";
import { useOrdenDetalle } from "../hooks";
import { useConfiguracion } from "../../sistema/hooks";
import { OrdenImprimible } from "../components/OrdenImprimible";
import { Button, Space } from "antd";
import { ArrowLeftOutlined, PrinterOutlined } from "@ant-design/icons";

export const OrdenImprimiblePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const ordenId = Number(id);
  const navigate = useNavigate();

  const { data: orden, isLoading } = useOrdenDetalle(ordenId);
  const { data: configuracion } = useConfiguracion();

  if (isLoading || !orden) {
    return <div>Cargando...</div>;
  }

  return (
    <div style={{ background: "#fff", padding: 24, minHeight: "100vh" }}>

      {/* 🔥 Barra superior como en ResultadosVistaPrevia */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate(-1)}
        >
          Volver
        </Button>

        <Space>
          <Button 
            type="primary"
            icon={<PrinterOutlined />}
            onClick={() => window.print()}
            style={{ fontWeight: 600 }}
          >
            Imprimir
          </Button>
        </Space>
      </div>

      {/* 🔥 Componente imprimible */}
      <OrdenImprimible 
        orden={orden} 
        configuracion={configuracion || null}
      />

    </div>
  );
};
