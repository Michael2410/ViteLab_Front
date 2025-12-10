import { useEffect } from 'react';
import { App } from 'antd';
import { setMessageApi } from '../utils/message';

/**
 * Componente que configura el message API global desde el contexto de AntApp
 * Debe estar dentro del <App> wrapper de Ant Design
 */
export const MessageConfig: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { message } = App.useApp();

  useEffect(() => {
    setMessageApi(message);
  }, [message]);

  return <>{children}</>;
};

export default MessageConfig;
