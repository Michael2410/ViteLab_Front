import { message as antMessage } from 'antd';
import type { MessageInstance } from 'antd/es/message/interface';

// Holder para message instance del contexto App
let messageApi: MessageInstance | typeof antMessage = antMessage;

// Setter para configurar la instancia desde el componente App
export const setMessageApi = (api: MessageInstance) => {
  console.log('🔧 setMessageApi called with:', api);
  messageApi = api;
};

// Exportar funciones de message que usan la instancia correcta
export const showMessage = {
  success: (content: string, duration?: number) => {
    console.log('💬 showMessage.success:', content);
    return messageApi.success(content, duration);
  },
  error: (content: string, duration?: number) => {
    console.log('💬 showMessage.error:', content);
    return messageApi.error(content, duration);
  },
  info: (content: string, duration?: number) => {
    console.log('💬 showMessage.info:', content);
    return messageApi.info(content, duration);
  },
  warning: (content: string, duration?: number) => {
    console.log('💬 showMessage.warning:', content);
    return messageApi.warning(content, duration);
  },
  loading: (content: string, duration?: number) => {
    console.log('💬 showMessage.loading:', content);
    return messageApi.loading(content, duration);
  },
};

// También exportar como message para compatibilidad
export const message = showMessage;

export default showMessage;
