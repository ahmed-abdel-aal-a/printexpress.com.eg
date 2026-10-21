"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service if needed
    console.error("Next.js Runtime Error Captured:", error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-[#0a0a0a] px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-[#111] border border-red-500/20 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center"
      >
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="text-red-500 w-10 h-10" />
        </div>
        
        <h2 className="text-2xl font-black text-white mb-3">عذراً، حدث خطأ غير متوقع</h2>
        <p className="text-gray-400 mb-8 text-sm leading-relaxed">
          يبدو أن هناك مشكلة في الاتصال بالخادم أو في جلب البيانات المطلوبة لهذه الصفحة. 
          لقد التقطنا الخطأ لمنع تجمّد الواجهة.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            onClick={() => reset()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-bold rounded-xl transition-colors"
          >
            <RefreshCcw size={18} />
            حاول مجدداً
          </button>
          
          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#222] hover:bg-[#333] text-white border border-white/10 font-bold rounded-xl transition-colors"
          >
            <Home size={18} />
            الرئيسية
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
