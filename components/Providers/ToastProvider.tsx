"use client";

import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";

export default function ToastProvider() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <Toaster 
      position="top-center" 
      containerStyle={{ zIndex: 99999 }} 
      toastOptions={{
        className: 'font-cairo font-bold',
        style: {
          background: '#1a1a1a',
          color: '#fff',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
        success: {
          iconTheme: {
            primary: '#facc15',
            secondary: '#1a1a1a',
          },
        },
      }}
    />
  );
}
