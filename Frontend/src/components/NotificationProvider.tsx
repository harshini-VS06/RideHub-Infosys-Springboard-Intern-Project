import { createContext, useContext, useEffect, useState } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { toast } from 'sonner';
import { authService } from '../services/authService';

interface NotificationContextType {
  connected: boolean;
}

const NotificationContext = createContext<NotificationContextType>({ connected: false });

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [client, setClient] = useState<Client | null>(null);

  useEffect(() => {
    if (!authService.isAuthenticated()) return;

    const stompClient = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/api/ws'),
      debug: (str) => console.log(str),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      
      onConnect: () => {
        console.log('Connected to WebSocket');
        setConnected(true);
        
        // Subscribe to notifications
        stompClient.subscribe('/user/queue/notifications', (message) => {
          const notification = JSON.parse(message.body);
          
          // Show toast notification
          switch (notification.type) {
            case 'PAYMENT_SUCCESS':
              toast.success(notification.message, { duration: 5000 });
              break;
            case 'PAYMENT_RECEIVED':
              toast.info(notification.message, { duration: 5000 });
              break;
            case 'BOOKING_TENTATIVE':
              toast.info(notification.message, { duration: 5000 });
              break;
            case 'PAYMENT_REQUEST':
              toast.warning(notification.message, { duration: 10000 });
              break;
            case 'FUNDS_UNLOCKED':
              toast.success(notification.message, { duration: 5000 });
              break;
            default:
              toast.info(notification.message);
          }
        });
      },
      
      onDisconnect: () => {
        console.log('Disconnected from WebSocket');
        setConnected(false);
      },
      
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
      },
    });

    stompClient.activate();
    setClient(stompClient);

    return () => {
      if (stompClient) {
        stompClient.deactivate();
      }
    };
  }, []);

  return (
    <NotificationContext.Provider value={{ connected }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);