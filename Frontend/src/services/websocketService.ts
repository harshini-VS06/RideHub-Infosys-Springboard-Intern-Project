import { Client, Message, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export interface NotificationMessage {
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  timestamp: string;
}

type NotificationCallback = (notification: NotificationMessage) => void;

class WebSocketService {
  private client: Client | null = null;
  private subscriptions: Map<string, StompSubscription> = new Map();
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 3000;
  private token: string | null = null;
  private email: string | null = null;

  connect(token: string, email: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnected) {
        resolve();
        return;
      }

      this.token = token;
      this.email = email;

      // Create SockJS instance
      const socket = new SockJS('http://localhost:8080/ws', null, {
        transports: ['websocket', 'xhr-streaming', 'xhr-polling']
      });

      this.client = new Client({
        webSocketFactory: () => socket as any,
        connectHeaders: {
          Authorization: `Bearer ${token}`,
        },
        debug: (str) => {
          console.log('[WebSocket Debug]', str);
        },
        reconnectDelay: this.reconnectDelay,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: () => {
          console.log('✅ WebSocket Connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve();
        },
        onStompError: (frame) => {
          console.error('❌ STOMP Error:', frame);
          this.isConnected = false;
          reject(new Error(frame.headers['message'] || 'WebSocket connection error'));
        },
        onWebSocketError: (event) => {
          console.error('❌ WebSocket Error:', event);
          this.isConnected = false;
        },
        onDisconnect: () => {
          console.log('🔌 WebSocket Disconnected');
          this.isConnected = false;
          this.handleReconnect();
        }
      });

      this.client.activate();
    });
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts && this.token && this.email) {
      this.reconnectAttempts++;
      console.log(`🔄 Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect(this.token!, this.email!)
          .catch(error => console.error('Reconnection failed:', error));
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('❌ Max reconnection attempts reached or missing credentials');
    }
  }

  subscribeToNotifications(callback: NotificationCallback): () => void {
    if (!this.client || !this.isConnected || !this.email) {
      console.error('Cannot subscribe: WebSocket not connected or email missing');
      return () => {};
    }

    const destination = `/user/${this.email}/queue/notifications`;
    
    const subscription = this.client.subscribe(destination, (message: Message) => {
      try {
        const notification: NotificationMessage = JSON.parse(message.body);
        console.log('📬 Notification received:', notification);
        callback(notification);
      } catch (error) {
        console.error('Error parsing notification:', error);
      }
    });

    const subscriptionId = `notifications-${Date.now()}`;
    this.subscriptions.set(subscriptionId, subscription);

    // Return unsubscribe function
    return () => {
      const sub = this.subscriptions.get(subscriptionId);
      if (sub) {
        sub.unsubscribe();
        this.subscriptions.delete(subscriptionId);
        console.log('🔕 Unsubscribed from notifications');
      }
    };
  }

  disconnect(): void {
    if (this.client) {
      // Unsubscribe from all subscriptions
      this.subscriptions.forEach(subscription => subscription.unsubscribe());
      this.subscriptions.clear();

      // Deactivate client
      this.client.deactivate();
      this.isConnected = false;
      this.token = null;
      this.email = null;
      console.log('👋 WebSocket disconnected');
    }
  }

  isConnectionActive(): boolean {
    return this.isConnected;
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
