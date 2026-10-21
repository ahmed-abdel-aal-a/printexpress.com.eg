"use client";
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { createEchoInstance } from '@/lib/echo';

export default function CustomerNotificationsManager({ customerId, token }: { customerId: string, token: string }) {
  useEffect(() => {
    if (!customerId || !token) return;

    const echo = createEchoInstance(token);
    const channel = echo.private(`App.Models.Customer.${customerId}`);
    
    channel.notification((notification: any) => {
      toast(notification.message, {
        icon: '🔔',
        duration: 5000,
        position: 'bottom-right',
        style: {
          background: '#333',
          color: '#fff',
          borderRadius: '10px',
        },
      });
    });

    return () => {
      channel.stopListening('.Illuminate\\Notifications\\Events\\BroadcastNotificationCreated');
      echo.leaveChannel(`App.Models.Customer.${customerId}`);
      echo.disconnect();
    };
  }, [customerId, token]);

  return null;
}
