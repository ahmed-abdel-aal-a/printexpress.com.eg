"use client";

import React, { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight, RefreshCw, ShoppingCart, MessageCircle } from "lucide-react";
import Link from "next/link";
import { PageTransition } from "@/components/UI/Animations";

function ErrorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const errorMessage = searchParams.get("message") || searchParams.get("error") || "تعذر إتمام عملية الدفع الإلكتروني بنجاح.";
  const orderId = searchParams.get("order_id") || searchParams.get("merchantOrderId");

  return (
    <PageTransition>
      <div className="max-w-xl mx-auto px-4 pt-32 pb-24 text-center">
        <div className="bg-[#111111] p-8 md:p-10 rounded-3xl border border-rose-500/20 shadow-2xl space-y-6">
          {/* Header Icon */}
          <div className="w-24 h-24 bg-rose-500/15 text-rose-400 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-rose-500/10">
            <AlertTriangle size={52} />
          </div>

          <div>
            <span className="bg-rose-500/20 text-rose-400 text-xs font-bold px-3 py-1 rounded-full border border-rose-500/30">
              فشل في عملية الدفع
            </span>
            <h1 className="text-3xl font-black text-white mt-4 mb-2">
              لم تكتمل عملية الدفع
            </h1>
            <p className="text-gray-400 text-sm max-w-md mx-auto leading-relaxed">
              {errorMessage}
            </p>
            {orderId && (
              <p className="text-xs text-gray-500 font-mono mt-2">
                رقم المعاملة: #{orderId}
              </p>
            )}
          </div>

          {/* Cart Safety Notice */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4 text-right space-y-1">
            <div className="flex items-center gap-2 text-yellow-400 font-bold text-xs">
              <ShoppingCart size={16} />
              <span>محتويات سلتك وتصميماتك محفوظة بالكامل:</span>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              لم يتم خصم أي مبالغ من حسابك، وملفات وتصميمات الطباعة التي قمت برفعها لا تزال محفوظة بأمان داخل سلتك لتتمكن من إعادة المحاولة بسهولة.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => router.push("/checkout")}
              className="flex-1 bg-yellow-400 text-black font-bold py-3.5 px-6 rounded-xl hover:bg-yellow-300 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw size={18} />
              <span>إعادة محاولة الدفع</span>
            </button>
            <Link
              href="/shop"
              className="flex-1 bg-white/[0.06] hover:bg-white/[0.1] text-white font-bold py-3.5 px-6 rounded-xl transition-colors border border-white/[0.08] flex items-center justify-center gap-2"
            >
              <span>العودة للمتجر</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

export default function CheckoutErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto px-4 pt-32 pb-24 text-center">
          <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      }
    >
      <ErrorContent />
    </Suspense>
  );
}
