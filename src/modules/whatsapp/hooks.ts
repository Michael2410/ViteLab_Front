/**
 * Hooks para el módulo WhatsApp
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import * as whatsappApi from './api';
import { whatsappSocket } from './socket';
import type {
  QRCodeData,
  WhatsAppStatusEvent,
  ConnectionState,
  SendResultsPayload
} from './types';

/**
 * Hook para manejar el estado de conexión de WhatsApp
 */
export const useWhatsAppStatus = () => {
  return useQuery({
    queryKey: ['whatsapp', 'status'],
    queryFn: whatsappApi.getStatus,
    refetchInterval: 30000, // Refrescar cada 30 segundos
    staleTime: 10000,
  });
};

/**
 * Hook para manejar la sesión de WhatsApp con Socket.io
 */
export const useWhatsAppSession = () => {
  const queryClient = useQueryClient();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);

  // Conectar Socket.io al montar
  useEffect(() => {
    whatsappSocket.connect();

    // Listener para QR
    const unsubscribeQR = whatsappSocket.on<QRCodeData>('whatsapp:qr', (data) => {
      console.log('📱 QR recibido');
      setQrCode(data.qr);
      setConnectionState('qr');
    });

    // Listener para estado
    const unsubscribeStatus = whatsappSocket.on<WhatsAppStatusEvent>('whatsapp:status', (data) => {
      console.log('📱 Estado recibido:', data.state, data);
      setConnectionState(data.state);
      
      // Extraer QR si viene en el evento de status
      if (data.state === 'qr' && data.qr) {
        console.log('📱 QR extraído del estado');
        setQrCode(data.qr);
      } else if (data.state === 'connected') {
        setQrCode(null);
        setPhoneNumber(data.phoneNumber || null);
        message.success('WhatsApp conectado exitosamente');
        // Invalidar query de status
        queryClient.invalidateQueries({ queryKey: ['whatsapp', 'status'] });
      } else if (data.state === 'disconnected') {
        setQrCode(null);
        setPhoneNumber(null);
        if (data.reason === 'logged_out') {
          message.info('Sesión de WhatsApp cerrada');
        } else if (data.reason === 'auth_error') {
          message.warning(data.message || 'Error de autenticación. Intente vincular de nuevo.');
        }
        queryClient.invalidateQueries({ queryKey: ['whatsapp', 'status'] });
      }
    });

    return () => {
      unsubscribeQR();
      unsubscribeStatus();
    };
  }, [queryClient]);

  // Mutation para iniciar sesión
  const startSessionMutation = useMutation({
    mutationFn: whatsappApi.startSession,
    onSuccess: () => {
      setConnectionState('connecting');
    },
    onError: (error: Error) => {
      message.error(error.message || 'Error al iniciar sesión');
      setConnectionState('disconnected');
    },
  });

  // Mutation para desconectar
  const disconnectMutation = useMutation({
    mutationFn: whatsappApi.disconnect,
    onSuccess: () => {
      setQrCode(null);
      setPhoneNumber(null);
      setConnectionState('disconnected');
      message.success('Sesión de WhatsApp cerrada');
      queryClient.invalidateQueries({ queryKey: ['whatsapp', 'status'] });
    },
    onError: (error: Error) => {
      message.error(error.message || 'Error al cerrar sesión');
    },
  });

  // Función estable para iniciar sesión (evita llamadas duplicadas)
  const startSession = useCallback(() => {
    if (!startSessionMutation.isPending) {
      startSessionMutation.mutate();
    }
  }, [startSessionMutation.isPending]);

  const disconnect = useCallback(() => {
    disconnectMutation.mutate();
  }, [disconnectMutation]);

  return {
    qrCode,
    connectionState,
    phoneNumber,
    startSession,
    disconnect,
    isStarting: startSessionMutation.isPending,
    isDisconnecting: disconnectMutation.isPending,
  };
};

/**
 * Hook para enviar resultados por WhatsApp
 */
export const useSendWhatsAppResults = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SendResultsPayload) => whatsappApi.sendResults(payload),
    onSuccess: () => {
      message.success('Resultados enviados por WhatsApp');
      queryClient.invalidateQueries({ queryKey: ['whatsapp', 'messages'] });
    },
    onError: (error: Error) => {
      message.error(error.message || 'Error al enviar resultados');
    },
  });
};

/**
 * Hook para obtener historial de mensajes
 */
export const useWhatsAppMessages = (page: number = 1, limit: number = 20) => {
  return useQuery({
    queryKey: ['whatsapp', 'messages', page, limit],
    queryFn: () => whatsappApi.getMessagesHistory(page, limit),
  });
};
