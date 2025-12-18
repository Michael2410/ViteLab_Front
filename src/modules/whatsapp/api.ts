/**
 * API calls para el módulo WhatsApp
 */

import apiClient from '../../shared/utils/apiClient';
import type { ApiResponse } from '../../shared/types/api.types';
import type {
  WhatsAppStatus,
  SendResultsPayload,
  SendResultsResponse,
  MessagesHistoryResponse
} from './types';

/**
 * Inicia una nueva sesión de WhatsApp
 * El QR se emite via Socket.io
 */
export const startSession = async (): Promise<{ message: string; state: string }> => {
  const response = await apiClient.post<ApiResponse<{ message: string; state: string }>>(
    '/whatsapp/start-session'
  );
  return response.data.data!;
};

/**
 * Obtiene el estado actual de la conexión de WhatsApp
 */
export const getStatus = async (): Promise<WhatsAppStatus> => {
  const response = await apiClient.get<ApiResponse<WhatsAppStatus>>(
    '/whatsapp/status'
  );
  return response.data.data!;
};

/**
 * Desconecta la sesión de WhatsApp
 */
export const disconnect = async (): Promise<{ message: string }> => {
  const response = await apiClient.post<ApiResponse<{ message: string }>>(
    '/whatsapp/disconnect'
  );
  return response.data.data!;
};

/**
 * Envía los resultados de una orden por WhatsApp
 */
export const sendResults = async (
  payload: SendResultsPayload
): Promise<SendResultsResponse> => {
  const response = await apiClient.post<ApiResponse<SendResultsResponse>>(
    '/whatsapp/send-results',
    payload
  );
  return response.data.data!;
};

/**
 * Obtiene el historial de mensajes enviados
 */
export const getMessagesHistory = async (
  page: number = 1,
  limit: number = 20
): Promise<MessagesHistoryResponse> => {
  const response = await apiClient.get<ApiResponse<MessagesHistoryResponse>>(
    '/whatsapp/messages',
    { params: { page, limit } }
  );
  return response.data.data!;
};
