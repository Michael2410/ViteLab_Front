/**
 * Servicio global centralizado de Socket.io para tiempo real en ViteLab
 */

import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';

class AppSocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  /**
   * Conecta al servidor Socket.io
   */
  connect(): void {
    if (this.socket) {
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
      console.log('🔌 Socket.io global conectado');
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 Socket.io global desconectado');
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Error de conexión Socket.io global:', error);
    });

    // Despachar dinámicamente cualquier evento recibido a sus listeners registrados
    this.socket.onAny((event: string, ...args: any[]) => {
      const data = args[0];
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        callbacks.forEach((cb) => {
          try {
            cb(data);
          } catch (err) {
            console.error(`Error en listener de evento ${event}:`, err);
          }
        });
      }
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
   * Registra un listener para cualquier evento en tiempo real
   * Retorna una función de desuscripción limpia
   */
  on<T = any>(event: string, callback: (data: T) => void): () => void {
    if (!this.socket) {
      this.connect();
    }

    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  /**
   * Elimina un listener registrado
   */
  off(event: string, callback: (data: any) => void): void {
    this.listeners.get(event)?.delete(callback);
  }

  /**
   * Verifica el estado de la conexión
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const appSocket = new AppSocketService();
