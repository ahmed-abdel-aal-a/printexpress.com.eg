"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// دالة لإنشاء UUID متوافقة في حالة عدم توفر crypto
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export default function CustomerTrackingProvider() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasEntered = useRef(false); // Flag prevents repeating "enter" events
  const lastTrackedPath = useRef(""); // لمنع تكرار الطلبات ونشوء view وهمي في Strict Mode

  useEffect(() => {
    // 1. استخراج أو إنشاء X-Session-ID
    let sessionId = localStorage.getItem("X-Session-ID");
    if (!sessionId) {
      sessionId = generateUUID();
      localStorage.setItem("X-Session-ID", sessionId);
    }
    
    const trackEvent = async (type: string, path: string, title: string) => {
      try {
        const currentToken = localStorage.getItem("customer_token") || localStorage.getItem("token");
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2080/api/v1';
        
        const headers: HeadersInit = {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-Session-ID": sessionId as string,
          "X-Store-ID": process.env.NEXT_PUBLIC_STORE_ID || "1",
        };

        // إرسال التوكن للباك إند للتحقق عبر auth('sanctum')->user()
        if (currentToken) {
          headers["Authorization"] = `Bearer ${currentToken}`;
        }

        const utmSource = searchParams?.get("utm_source");
        const refParam = searchParams?.get("ref");
        const payload: Record<string, any> = { type, path, title };
        if (utmSource) payload.utm_source = utmSource;
        if (refParam) payload.ref = refParam;

        await fetch(`${API_URL}/storefront/track`, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });
      } catch (e) {
        // تجاهل الخطأ بصمت
      }
    };

    const fullPath = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    const title = document.title || "تصفح المتجر";

    // منع التكرار لنفس المسار (يحمي من Strict Mode Fake Views)
    if (lastTrackedPath.current === fullPath) return;

    // تتبع حركة الدخول لأول مرة في الجلسة
    if (!hasEntered.current) {
      trackEvent("enter", fullPath, title);
      hasEntered.current = true;
    } else {
      // تتبع حركات التصفح لباقي الصفحات
      trackEvent("view", fullPath, title);
    }

    lastTrackedPath.current = fullPath;

  }, [pathname, searchParams]);

  return null;
}
