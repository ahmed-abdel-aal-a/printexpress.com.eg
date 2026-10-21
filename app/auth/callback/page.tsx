"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { useAppContext } from "@/context/AppContext";
import { getUser } from "@/lib/api";
import { Suspense } from "react";

function AuthCallbackLogic() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser, refreshCart } = useAppContext();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    
    const token = searchParams.get("token");
    const error = searchParams.get("error");

    if (error) {
      toast.error("فشل تسجيل الدخول"); 
      router.push("/auth");
      return;
    }

    if (token) {
      processed.current = true;
      
      // مسح التوكن من الرابط فوراً لتجنب تسريبه
      window.history.replaceState({}, document.title, window.location.pathname);
      
      localStorage.setItem("customer_token", token);
      
      // Fetch user profile and set it
      getUser(token).then(async (userData) => {
        if (userData) {
          setUser(userData);
          await refreshCart();
        }
        toast.success("تم تسجيل الدخول بنجاح"); 
        router.push("/");
      }).catch((err) => {
        console.error("Error fetching user", err);
        router.push("/");
      });
      
    } else {
      router.push("/auth");
    }
  }, [router, searchParams, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white">
      {/* إضافة حماية الـ Referrer لمنع تسريب التوكن */}
      <meta name="referrer" content="no-referrer" />
      
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-xl font-bold">جاري تسجيل الدخول...</h2>
      </div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-bold">جاري تسجيل الدخول...</h2>
        </div>
      </div>
    }>
      <AuthCallbackLogic />
    </Suspense>
  );
}
