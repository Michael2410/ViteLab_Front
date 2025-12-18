/**
 * Tipos para el módulo WhatsApp - Frontend
 */

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'qr';

export interface WhatsAppStatus {
  isConnected: boolean;
  phoneNumber: string | null;
  lastConnectedAt: string | null;
  state: ConnectionState;
}

export interface QRCodeData {
  qr: string;
  timestamp: number;
}

export interface WhatsAppStatusEvent {
  state: ConnectionState;
  phoneNumber?: string;
  reason?: string;
  error?: string;
  message?: string;
  qr?: string; // QR code string cuando state === 'qr'
}

export interface SendResultsPayload {
  ordenId: number;
  phoneNumber: string;
}

export interface SendResultsResponse {
  success: boolean;
  message: string;
  messageId?: string;
}

export interface WhatsAppMessage {
  id: number;
  orden_id: number | null;
  phone_number: string;
  message_type: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  error_message: string | null;
  created_at: string;
  numero_atencion: string | null;
  paciente_nombre: string | null;
  enviado_por: string | null;
}

export interface MessagesHistoryResponse {
  messages: WhatsAppMessage[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
