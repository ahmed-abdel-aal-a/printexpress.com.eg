import React from 'react';
import Link from 'next/link';
import { Home, ShoppingBag, Printer, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-4 py-20 relative overflow-hidden" dir="rtl">
      {/* Background Glow Effects */}
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-xl w-full text-center relative z-10">
        {/* Badge & Code */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-xs font-bold tracking-wider mb-6">
          <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
          <span>خطأ 404 - الصفحة غير موجودة</span>
        </div>

        <h1 className="text-8xl sm:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-neutral-200 to-neutral-700 tracking-tight mb-4 select-none">
          404
        </h1>

        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
          عفواً، لم نتمكن من العثور على هذه الصفحة!
        </h2>

        <p className="text-gray-400 text-sm sm:text-base leading-relaxed mb-8 max-w-md mx-auto">
          يبدو أن الرابط الذي اتبعته غير صحيح أو تم نقل الصفحة أو حذفها. يمكنك العودة للتسوق أو تصفح خدمات الطباعة.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/shop"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-sm transition-all shadow-lg shadow-yellow-400/20 active:scale-[0.98]"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>تصفح المتجر</span>
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <Link
            href="/print-station"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-800 font-bold text-sm transition-all active:scale-[0.98]"
          >
            <Printer className="w-4 h-4 text-yellow-400" />
            <span>محطة الطباعة</span>
          </Link>

          <Link
            href="/"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-transparent hover:bg-neutral-900/60 text-gray-400 hover:text-white border border-transparent hover:border-neutral-800 font-bold text-sm transition-all active:scale-[0.98]"
          >
            <Home className="w-4 h-4" />
            <span>الرئيسية</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
