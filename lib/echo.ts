import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Extend the Window interface to include Pusher
declare global {
    interface Window {
        Pusher: any;
    }
}

export const createEchoInstance = (token: string) => {
  window.Pusher = Pusher;

  return new Echo({
    broadcaster: 'reverb',
    key: process.env.NEXT_PUBLIC_REVERB_APP_KEY,
    wsHost: process.env.NEXT_PUBLIC_REVERB_HOST,
    wsPort: process.env.NEXT_PUBLIC_REVERB_PORT ? Number(process.env.NEXT_PUBLIC_REVERB_PORT) : 80,
    wssPort: process.env.NEXT_PUBLIC_REVERB_PORT ? Number(process.env.NEXT_PUBLIC_REVERB_PORT) : 443,
    forceTLS: (process.env.NEXT_PUBLIC_REVERB_SCHEME ?? 'https') === 'https',
    enabledTransports: ['ws', 'wss'],
    // استخدام المسار الصحيح تماماً مع الـ prefix 'api'
    authEndpoint: process.env.NEXT_PUBLIC_API_URL + '/api/broadcasting/auth',
    auth: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });
};
