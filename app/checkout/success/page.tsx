"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, Loader2, AlertCircle, Printer, Package, ArrowRight, ShieldCheck, ShoppingBag, Clock } from "lucide-react";
import Link from "next/link";
import { useAppContext } from "@/context/AppContext";
import { fetchOrderPaymentStatus } from "@/lib/api";
import { PageTransition } from "@/components/UI/Animations";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { clearCart } = useAppContext();

  // Kashier redirects with merchantOrderId or orderId; our app also sends order_id or order_number
  const orderId = searchParams.get("order_id") || searchParams.get("merchantOrderId") || searchParams.get("orderId");
  const orderNumber = searchParams.get("order_number");
  const initialMethod = searchParams.get("payment_method");
  const kashierStatus = searchParams.get("paymentStatus");

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [pollCount, setPollCount] = useState(0);
  const [isConfirmed, setIsConfirmed] = useState(false);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    let timer: NodeJS.Timeout;

    async function pollPaymentStatus() {
      if (!isMounted) return;

      const orderData = await fetchOrderPaymentStatus(orderId!);
      if (!isMounted) return;

      if (orderData) {
        setOrder(orderData);

        const isPendingPrice = orderData.status === "pending_price_confirmation" || searchParams.get("status") === "pending_price_confirmation";
        const isPaid = orderData.payment_status === "paid" || orderData.payment_status === "partially_paid";
        const isCod = orderData.payment_method === "cod" || initialMethod === "cod";

        if (isPendingPrice || isPaid || isCod) {
          // Empty cart ONLY when payment or price confirmation or COD is verified
          clearCart();
          setIsConfirmed(true);
          setLoading(false);
          return;
        }
      }

      // If not yet confirmed and within polling window (max 6 polls = ~12s)
      setPollCount((prev) => {
        if (prev >= 6) {
          setLoading(false);
          return prev;
        }
        timer = setTimeout(pollPaymentStatus, 2000);
        return prev + 1;
      });
    }

    pollPaymentStatus();

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
    };
  }, [orderId, clearCart, initialMethod]);

  if (!orderId) {
    return (
      <div className="max-w-md mx-auto px-4 pt-32 pb-24 text-center">
        <div className="w-20 h-20 bg-amber-500/15 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle size={40} />
        </div>
        <h1 className="text-2xl font-black text-white mb-3">لم يتم العثور على بيانات الطلب</h1>
        <p className="text-gray-400 mb-8 text-sm leading-relaxed">
          يرجى التحقق من رابط الدفع أو مراجعة سلة المشتريات الخاصة بك.
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-yellow-400 text-black font-bold rounded-xl hover:bg-yellow-300 transition-colors"
        >
          <span>تصفح المنتجات</span>
          <ArrowRight size={18} />
        </Link>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="max-w-xl mx-auto px-4 pt-32 pb-24 text-center">
        {loading ? (
          <div className="bg-[#111111] p-8 md:p-10 rounded-3xl border border-white/[0.08] shadow-2xl space-y-6">
            <div className="w-20 h-20 bg-yellow-400/10 text-yellow-400 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <Loader2 size={40} className="animate-spin text-yellow-400" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white mb-2">جاري تأكيد عملية الدفع...</h2>
              <p className="text-gray-400 text-sm leading-relaxed max-w-md mx-auto">
                يرجى الانتظار بضع ثوانٍ بينما نتحقق من تأكيد المعاملة من البوابة البنكية ونقوم بحجز طلبك.
              </p>
            </div>
            <div className="text-xs text-gray-500 font-mono">
              محاولة التحقق {pollCount + 1} من 7
            </div>
          </div>
        ) : (
          <div className="bg-[#111111] p-8 md:p-10 rounded-3xl border border-yellow-500/20 shadow-2xl space-y-6">
            {/* Header Icon */}
            {order?.status === "pending_price_confirmation" ? (
              <div className="w-24 h-24 bg-amber-500/15 text-amber-400 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
                <Clock size={52} />
              </div>
            ) : (
              <div className="w-24 h-24 bg-emerald-500/15 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                <CheckCircle2 size={52} />
              </div>
            )}

            <div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                order?.status === "pending_price_confirmation"
                  ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                  : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
              }`}>
                {order?.status === "pending_price_confirmation"
                  ? "طلبك قيد مراجعة وتأكيد السعر"
                  : order?.payment_status === "partially_paid"
                  ? "تم سداد العربون بنجاح"
                  : "تم تأكيد طلبك بنجاح"}
              </span>
              <h1 className="text-3xl font-black text-white mt-4 mb-2">
                {order?.status === "pending_price_confirmation"
                  ? "تم استلام طلبك ومواصفات الطباعة! ⏱️"
                  : order?.payment_status === "partially_paid"
                  ? "شكراً لك! تم اعتماد العربون"
                  : "تهانينا! تم تأكيد طلبك"}
              </h1>
              <p className="text-gray-400 text-sm">
                رقم الطلب الخاص بك:{" "}
                <span className="font-mono font-bold text-yellow-400 text-base">
                  {order?.order_number || orderNumber || `#${orderId}`}
                </span>
              </p>
            </div>

            {/* Financial Details Card */}
            <div className="bg-[#181818] rounded-2xl p-5 border border-white/[0.06] text-right space-y-3">
              <div className="flex justify-between items-center text-sm border-b border-white/[0.06] pb-3">
                <span className="text-gray-400">إجمالي الطلب:</span>
                <span className="font-bold text-white text-base">
                  {order?.total ? Number(order.total).toFixed(2) : "--"} ج.م
                </span>
              </div>

              {order?.payment_type === "deposit" || order?.payment_status === "partially_paid" ? (
                <>
                  <div className="flex justify-between items-center text-sm text-emerald-400">
                    <span className="font-bold flex items-center gap-1.5">
                      <ShieldCheck size={16} />
                      <span>العربون المسدد أونلاين:</span>
                    </span>
                    <span className="font-black text-base">
                      {order?.deposit_amount ? Number(order.deposit_amount).toFixed(2) : "--"} ج.م
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-sm text-yellow-400/90 pt-2 border-t border-white/[0.06]">
                    <span className="font-bold">المتبقي للتحصيل عند الاستلام كـ COD:</span>
                    <span className="font-black text-base text-yellow-400">
                      {order?.remaining_amount ? Number(order.remaining_amount).toFixed(2) : "--"} ج.م
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">حالة الدفع:</span>
                  <span className="font-bold text-emerald-400">
                    {order?.payment_status === "paid" ? "مدفوع بالكامل أونلاين" : "الدفع نقداً عند الاستلام"}
                  </span>
                </div>
              )}
            </div>

            {/* Next Steps Card */}
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 text-right flex items-start gap-3">
              <Printer className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
              <div className="text-xs text-gray-200 leading-relaxed">
                <strong className="text-yellow-400 font-bold block mb-1">الخطوات التالية:</strong>
                {order?.status === "pending_price_confirmation" ? (
                  <span>
                    يحتوي طلبك على مواصفات أو خامات خاضعة لتسعيرة اليوم المتغيرة. يقوم فريق المطبعة بمراجعة المقاسات والتصميمات بدقة الآن، وسيتم إرسال رابط الدفع المعتمد إليك عبر رسالة واتساب ومتاحاً أيضاً في حسابك فور اعتماده.
                  </span>
                ) : order?.payment_status === "partially_paid" ? (
                  <span>
                    تم نقل ملفات التصميم الخاصة بك إلى معمل الطباعة الرقمية للبدء في التجهيز. سيتواصل معك فريقنا في حال وجود أي ملاحظة على جودة الملفات، وسيتم تسليم الطلب عبر شركة الشحن مع تحصيل المبلغ المتبقي عند الباب.
                  </span>
                ) : (
                  <span>
                    طلبك قيد المراجعة والتجهيز حالياً. ستصلك رسالة تحديث برقم التتبع بمجرد تجهيز وتسليم شحنتك لمندوب التوصيل.
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <Link
                href="/shop"
                className="flex-1 bg-yellow-400 text-black font-bold py-3.5 px-6 rounded-xl hover:bg-yellow-300 transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingBag size={18} />
                <span>متابعة التسوق</span>
              </Link>
              <Link
                href="/"
                className="flex-1 bg-white/[0.06] hover:bg-white/[0.1] text-white font-bold py-3.5 px-6 rounded-xl transition-colors border border-white/[0.08] flex items-center justify-center"
              >
                <span>الصفحة الرئيسية</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto px-4 pt-32 pb-24 text-center">
          <Loader2 size={40} className="animate-spin text-yellow-400 mx-auto" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
