import React, { useEffect, useState } from 'react';
import { Bell, X, CheckCircle, AlertCircle, DollarSign, Info } from 'lucide-react';
import { websocketService, NotificationMessage } from '../services/websocketService';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';

interface NotificationCenterProps {
  token: string;
  email: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ token, email }) => {
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Connect to WebSocket
    websocketService.connect(token, email)
      .then(() => {
        setIsConnected(true);
        console.log('✅ WebSocket connected in NotificationCenter');
        
        // Subscribe to notifications
        const unsubscribe = websocketService.subscribeToNotifications((notification) => {
          setNotifications(prev => [notification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Show browser notification if permission granted
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(notification.title, {
              body: notification.message,
              icon: '/logo.png',
            });
          }
        });

        return () => {
          unsubscribe();
          websocketService.disconnect();
        };
      })
      .catch(error => {
        console.error('❌ Failed to connect WebSocket:', error);
        setIsConnected(false);
      });

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [token, email]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'PAYMENT_SUCCESS':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'PAYMENT_RECEIVED':
        return <DollarSign className="h-5 w-5 text-green-500" />;
      case 'PAYMENT_REQUEST':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case 'BOOKING_TENTATIVE':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'FUNDS_UNLOCKED':
        return <CheckCircle className="h-5 w-5 text-purple-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'PAYMENT_SUCCESS':
      case 'PAYMENT_RECEIVED':
        return 'border-l-green-500';
      case 'PAYMENT_REQUEST':
        return 'border-l-orange-500';
      case 'BOOKING_TENTATIVE':
        return 'border-l-blue-500';
      case 'FUNDS_UNLOCKED':
        return 'border-l-purple-500';
      default:
        return 'border-l-gray-500';
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const markAsRead = () => {
    setUnreadCount(0);
  };

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) markAsRead();
        }}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            variant="destructive"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Panel */}
      {isOpen && (
        <Card className="absolute right-0 top-12 w-96 shadow-xl z-50 max-h-[600px] overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Notifications</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                  {isConnected ? 'Connected' : 'Disconnected'}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {notifications.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearNotifications}>
                    Clear All
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <ScrollArea className="h-[500px]">
            <CardContent className="pt-0 space-y-2">
              {notifications.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No notifications yet</p>
                  <p className="text-sm mt-1">You'll be notified about payments and bookings here</p>
                </div>
              ) : (
                notifications.map((notification, index) => (
                  <div
                    key={index}
                    className={`p-3 bg-card border-l-4 ${getNotificationColor(notification.type)} rounded-r hover:bg-accent/50 transition-colors`}
                  >
                    <div className="flex items-start gap-3">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">{notification.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(notification.timestamp).toLocaleString()}
                        </p>
                        {notification.data && (
                          <div className="mt-2 space-y-1">
                            {notification.data.bookingId && (
                              <Badge variant="outline" className="text-xs">
                                Booking #{notification.data.bookingId}
                              </Badge>
                            )}
                            {notification.data.amount && (
                              <Badge variant="outline" className="text-xs ml-2">
                                ₹{notification.data.amount.toFixed(2)}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </ScrollArea>
        </Card>
      )}
    </div>
  );
};

export default NotificationCenter;
