/**
 * Socket.io service para WhatsApp
 */

import { io, Socket } from 'socket.io-client';
import type { QRCodeData, WhatsAppStatusEvent } from './types';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';

class WhatsAppSocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();

  /**
   * Conecta al servidor Socket.io
   */
  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('🔌 Socket.io conectado');
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 Socket.io desconectado');
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Error de conexión Socket.io:', error);
    });

    // Reenviar eventos de WhatsApp a los listeners registrados
    this.socket.on('whatsapp:qr', (data: QRCodeData) => {
      this.emit('whatsapp:qr', data);
    });

    this.socket.on('whatsapp:status', (data: WhatsAppStatusEvent) => {
      this.emit('whatsapp:status', data);
    });
  }

  /**
   * Desconecta del servidor Socket.io
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Registra un listener para un evento
   */
  on<T>(event: string, callback: (data: T) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    this.listeners.get(event)!.add(callback as (data: unknown) => void);

    // Retorna función para eliminar el listener
    return () => {
      this.listeners.get(event)?.delete(callback as (data: unknown) => void);
    };
  }

  /**
   * Elimina un listener
   */
  off(event: string, callback: (data: unknown) => void): void {
    this.listeners.get(event)?.delete(callback);
  }

  /**
   * Emite un evento a los listeners registrados
   */
  private emit(event: string, data: unknown): void {
    this.listeners.get(event)?.forEach((callback) => {
      callback(data);
    });
  }

  /**
   * Verifica si está conectado
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Exportar instancia singleton
export const whatsappSocket = new WhatsAppSocketService();
