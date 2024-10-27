import { useCallback, useState, useEffect } from 'react';

interface Notification {
  id: string;
  message: string;
  expiresAt: number;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((message: string) => {
    const id = Date.now().toString();
    const expiresAt = Date.now() + 3000;
    setNotifications(prev => [...prev, { id, message, expiresAt }]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setNotifications(prev => 
        prev.filter(notification => {
          if (notification.expiresAt <= now) {
            setTimeout(() => removeNotification(notification.id), 300);
            return false;
          }
          return true;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [removeNotification]);

  return { notifications, addNotification, removeNotification };
};
