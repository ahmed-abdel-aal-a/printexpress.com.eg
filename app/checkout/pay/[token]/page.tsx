"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  fetchOrderByPaymentToken, 
  initiateOrderTokenPayment, 
  requestOrderReprice 
} from "@/lib/api";
import { PageTransition } from "@/components/UI/Animations";
import { 
  CreditCard, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Copy, 
  Check, 
  ExternalLink, 
  RefreshCw, 
  Printer, 
  Truck, 
  ShieldCheck, 
  Info,
  ChevronRight,
  PhoneCall,
  Lock
} from "lucide-react";
import Link from "next/link";

interface OrderItem {
  id: number;
  name: string;
  custom_product_name?: string;
  item_type: string;
  quantity: number;
  price_at_purchase: number;
  total: number;
  original_line_total: number;
  confirmed_line_total: number;
  line_difference: number;
  price_confirmation_status: string;
  admin_notes?: string;
  printing_options?: any;
  addons?: any[];
}

interface OrderData {
  id: number;
  order_number: string;
  status: string;
  payment_status: string;
  payment_method?: string;
  customer_name: string;
  customer_phone: string;
  shipping_address: string;
  subtotal: number;
  shipping_cost: number;
  shipping_method?: string;
  discount_amount: number;
  total: number;
  admin_price_notes?: string;
  price_confirmed_at?: string;
  price_expires_at?: string;
  is_expired: boolean;
  can_request_reprice: boolean;
  items: OrderItem[];
}

interface DirectPaymentInfo {
  instapay_address: string;
  vodafone_cash_number: string;
  whatsapp_support: string;
}

function formatWhatsAppLink(phone: string, text: string) {
  let cleaned = phone.replace(/[^0-9]/g, "");
  if (cleaned.startsWith("0020")) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith("0")) {
    cleaned = "2" + cleaned;
  } else if (!cleaned.startsWith("20")) {
    cleaned = "20" + cleaned;
  }
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(text)}`;
}

function PayTokenContent() {
  const params = useParams();
  const token = params?.token as string;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [directInfo, setDirectInfo] = useState<DirectPaymentInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [selectedMethod, setSelectedMethod] = useState<"online" | "transfer">("online");
  const [isInitiating, setIsInitiating] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  const [isRepricing, setIsRepricing] = useState(false);
  const [repriceSuccess, setRepriceSuccess] = useState<string | null>(null);
  const [repriceError, setRepriceError] = useState<string | null>(null);

  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Time left state
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number; isZero: boolean }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    isZero: false,
  });

  const loadOrder = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetchOrderByPaymentToken(token);
      setOrder(res.order);
      setDirectInfo(res.direct_payment_info);
    } catch (err: any) {
      setError(err.message || "عذراً، تعذر العثور على بيانات الطلب أو انتهت صلاحية الرابط.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [token]);

  // Countdown timer logic
  useEffect(() => {
    if (!order?.price_expires_at) return;

    const expiryTime = new Date(order.price_expires_at).getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = expiryTime - now;

      if (difference <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isZero: true });
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds, isZero: false });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [order?.price_expires_at]);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => {
      setCopiedField(null);
    }, 2500);
  };

  const handleOnlinePayment = async () => {
    if (!token) return;
    try {
      setIsInitiating(true);
      setInitError(null);
      const successUrl = `${window.location.origin}/checkout/success?order_id=${order?.id}&order_number=${order?.order_number}`;
      const failureUrl = `${window.location.origin}/checkout/error?order_id=${order?.id}&order_number=${order?.order_number}`;
      
      const res = await initiateOrderTokenPayment(token, successUrl, failureUrl);
      if (res.payment_url) {
        window.location.href = res.payment_url;
      } else {
        throw new Error("لم يتم استلام رابط الدفع من بوابة السداد");
      }
    } catch (err: any) {
      setInitError(err.message || "فشل بدء جلسة الدفع الإلكتروني");
      setIsInitiating(false);
    }
  };

  const handleRequestReprice = async () => {
    if (!token) return;
    try {
      setIsRepricing(true);
      setRepriceError(null);
      setRepriceSuccess(null);
      const res = await requestOrderReprice(token);
      setRepriceSuccess(res.message || "تم إرسال طلب تجديد السعر بنجاح.");
      // Reload order after 2 seconds
      setTimeout(() => {
        loadOrder();
      }, 2000);
    } catch (err: any) {
      setRepriceError(err.message || "فشل إرسال طلب تجديد التسعيرة.");
    } finally {
      setIsRepricing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 pt-28">
        <div className="w-16 h-16 border-4 border-yellow-400/20 border-t-yellow-400 rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-bold text-white">جاري تحميل عرض السعر المعتمد...</h2>
        <p className="text-sm text-gray-500 mt-2">يرجى الانتظار لحظات</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto px-4 pt-36 pb-24 text-center">
        <div className="w-20 h-20 bg-red-500/15 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle size={44} />
        </div>
        <h1 className="text-2xl font-black text-white mb-3">رابط الطلب غير متوفر</h1>
        <p className="text-gray-400 mb-8 text-sm leading-relaxed">
          {error || "عذراً، هذا الرابط غير صحيح أو قد تم إلغاء الطلب."}
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-yellow-400 text-black font-bold rounded-xl hover:bg-yellow-300 transition-colors"
        >
          <span>تصفح المتجر</span>
          <ChevronRight size={18} />
        </Link>
      </div>
    );
  }

  const isExpired = order.is_expired || timeLeft.isZero;
  const isPaid = order.payment_status === "paid";
  const hasPriceDifference = order.items.some(
    (item) => item.original_line_total && item.confirmed_line_total && item.original_line_total !== item.confirmed_line_total
  );

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-28 md:pt-32 pb-24">
        {/* Header Breadcrumb */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/[0.08]">
          <div>
            <div className="flex items-center gap-2 text-xs text-yellow-400 font-bold mb-1">
              <Printer size={15} />
              <span>تسعيرة خامات اليوم المعتمدة</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              طلب رقم <span className="font-mono text-yellow-400" dir="ltr">#{order.order_number}</span>
            </h1>
          </div>
          <div className="text-left">
            <span className={`inline-block px-3.5 py-1.5 rounded-full text-xs font-bold border ${
              isPaid
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                : isExpired
                ? "bg-red-500/15 text-red-400 border-red-500/30"
                : "bg-amber-500/15 text-amber-400 border-amber-500/30"
            }`}>
              {isPaid
                ? "تم السداد بنجاح ✓"
                : isExpired
                ? "منتهي الصلاحية"
                : "بانتظار السداد وتأكيد الحجز"}
            </span>
          </div>
        </div>

        {/* Status Banners */}
        {isPaid ? (
          <div className="mb-8 p-6 bg-emerald-500/10 border border-emerald-500/25 rounded-3xl flex items-start gap-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-bold text-emerald-400 mb-1">تم سداد هذا الطلب بنجاح!</h2>
              <p className="text-sm text-gray-300 leading-relaxed">
                شكراً لك، تم استلام المبلغ بنجاح والطلب قيد التجهيز والطباعة الرقمية الآن. سيتم إشعارك فور اكتمال الطباعة وتسليم الشحنة لشركة الشحن.
              </p>
            </div>
          </div>
        ) : isExpired ? (
          <div className="mb-8 p-6 bg-red-500/10 border border-red-500/25 rounded-3xl space-y-4">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-8 h-8 text-red-400 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-lg font-bold text-red-400 mb-1">انتهت مهلة عرض السعر المعتمد (24 ساعة)</h2>
                <p className="text-sm text-gray-300 leading-relaxed">
                  نظراً لتغير أسعار الخامات والتوريدات بشكل يومي، انتهت فترة حجز هذا السعر.
                  {order.can_request_reprice
                    ? " يمكنك طلب تجديد التسعيرة بالأسعار المحدثة الآن بنقرة واحدة قبل حذف ملفات التصميم."
                    : " لقد انقضت المهلة النهائية وتم تفريغ ملفات الطباعة المؤقتة. يرجى تقديم طلب جديد."}
                </p>
              </div>
            </div>

            {order.can_request_reprice && (
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={handleRequestReprice}
                  disabled={isRepricing}
                  className="w-full sm:w-auto px-6 py-3 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-yellow-400/20"
                >
                  <RefreshCw size={18} className={isRepricing ? "animate-spin" : ""} />
                  <span>{isRepricing ? "جاري إرسال الطلب..." : "طلب تجديد تسعيرة اليوم 🔄"}</span>
                </button>
                {repriceSuccess && (
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-lg border border-emerald-500/20">
                    {repriceSuccess}
                  </span>
                )}
                {repriceError && (
                  <span className="text-xs font-bold text-red-400 bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20">
                    {repriceError}
                  </span>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Live Countdown Banner */
          <div className="mb-8 p-6 bg-gradient-to-r from-amber-500/15 via-[#181818] to-[#111111] border border-amber-500/30 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Clock className="w-7 h-7 animate-pulse" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white mb-1">
                  تم اعتماد تسعيرة اليوم وخامات الطباعة
                </h2>
                <p className="text-xs text-gray-400 leading-relaxed max-w-md">
                  المخزون والأسعار محجوزة لك خصيصاً. يرجى إتمام السداد قبل انتهاء العداد لتجنب إلغاء الحجز.
                </p>
              </div>
            </div>

            {/* Timer Digits */}
            <div className="flex items-center gap-2 font-mono text-center">
              <div className="bg-[#111111] border border-amber-500/30 px-3.5 py-2 rounded-xl">
                <span className="block text-xl font-black text-amber-400">
                  {String(timeLeft.hours).padStart(2, "0")}
                </span>
                <span className="text-[10px] text-gray-500 font-sans">ساعة</span>
              </div>
              <span className="text-amber-400 font-bold text-xl">:</span>
              <div className="bg-[#111111] border border-amber-500/30 px-3.5 py-2 rounded-xl">
                <span className="block text-xl font-black text-amber-400">
                  {String(timeLeft.minutes).padStart(2, "0")}
                </span>
                <span className="text-[10px] text-gray-500 font-sans">دقيقة</span>
              </div>
              <span className="text-amber-400 font-bold text-xl">:</span>
              <div className="bg-[#111111] border border-amber-500/30 px-3.5 py-2 rounded-xl">
                <span className="block text-xl font-black text-amber-400">
                  {String(timeLeft.seconds).padStart(2, "0")}
                </span>
                <span className="text-[10px] text-gray-500 font-sans">ثانية</span>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column: Items Breakdown */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#111111] rounded-3xl p-6 border border-white/[0.06] shadow-sm">
              <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                <span>بنود ومواصفات الطلب</span>
                <span className="text-xs font-normal text-gray-500">({order.items.length} عنصر)</span>
              </h2>

              <div className="space-y-4">
                {order.items.map((item) => {
                  const hasItemDiff = item.original_line_total && item.confirmed_line_total && item.original_line_total !== item.confirmed_line_total;
                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl bg-[#161616] border border-white/[0.06] flex flex-col gap-3"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-bold text-white text-base">
                            {item.custom_product_name || item.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                            <span>الكمية: <strong className="text-white">{item.quantity}</strong></span>
                            {item.item_type === "printing" && (
                              <span className="bg-yellow-400/10 text-yellow-400 px-2 py-0.5 rounded-full border border-yellow-500/20">
                                طباعة مخصصة
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Price Column */}
                        <div className="text-left shrink-0">
                          {hasItemDiff ? (
                            <div className="flex flex-col items-end">
                              <span className="text-xs text-gray-500 line-through">
                                {Number(item.original_line_total).toFixed(2)} ج.م
                              </span>
                              <span className="text-base font-black text-yellow-400">
                                {Number(item.confirmed_line_total).toFixed(2)} ج.م
                              </span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5 ${
                                item.line_difference > 0
                                  ? "bg-amber-500/15 text-amber-400"
                                  : "bg-emerald-500/15 text-emerald-400"
                              }`}>
                                {item.line_difference > 0 ? `+${item.line_difference.toFixed(2)}` : item.line_difference.toFixed(2)} ج.م
                              </span>
                            </div>
                          ) : (
                            <span className="text-base font-black text-white">
                              {Number(item.confirmed_line_total || item.total).toFixed(2)} ج.م
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Printing specs if present */}
                      {item.printing_options && (
                        <div className="bg-[#1c1c1c] p-3 rounded-xl border border-white/[0.04] text-xs text-gray-400 space-y-1">
                          <div className="font-bold text-gray-300 mb-1">المواصفات الفنية:</div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                            {item.printing_options.dimensions && (
                              <div>المقاس: <span className="text-white">{item.printing_options.dimensions}</span></div>
                            )}
                            {item.printing_options.paper_type && (
                              <div>الخامة: <span className="text-white">{item.printing_options.paper_type}</span></div>
                            )}
                            {item.printing_options.print_sides && (
                              <div>الأوجه: <span className="text-white">{item.printing_options.print_sides}</span></div>
                            )}
                            {item.printing_options.finishing && (
                              <div>التشطيب: <span className="text-white">{item.printing_options.finishing}</span></div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Admin Notes on Item */}
                      {item.admin_notes && (
                        <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-start gap-2">
                          <Info size={14} className="shrink-0 mt-0.5 text-amber-400" />
                          <span><strong>ملاحظة تسعير الخامة:</strong> {item.admin_notes}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Order Level Admin Price Notes */}
              {order.admin_price_notes && (
                <div className="mt-4 p-4 bg-yellow-400/5 border border-yellow-500/20 rounded-2xl text-xs text-yellow-200/90 flex items-start gap-2.5">
                  <Info size={16} className="text-yellow-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-yellow-400 font-bold mb-0.5">ملاحظات فريق المطبعة:</strong>
                    <span>{order.admin_price_notes}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Shipping & Delivery Info */}
            <div className="bg-[#111111] rounded-3xl p-6 border border-white/[0.06]">
              <h2 className="text-base font-black text-white mb-3 flex items-center gap-2">
                <Truck className="text-yellow-400 w-5 h-5" />
                <span>بيانات الشحن والتسليم</span>
              </h2>
              <div className="text-xs text-gray-400 space-y-2">
                <div className="flex justify-between">
                  <span>اسم المستلم:</span>
                  <span className="text-white font-bold">{order.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span>رقم الهاتف:</span>
                  <span className="text-white font-mono" dir="ltr">{order.customer_phone}</span>
                </div>
                <div className="flex justify-between">
                  <span>عنوان التوصيل:</span>
                  <span className="text-white font-bold">{order.shipping_address}</span>
                </div>
                <div className="flex justify-between">
                  <span>نوع الشحن المختار:</span>
                  <span className="text-yellow-400 font-bold">
                    {order.shipping_method === "express" ? "شحن سريع (Express)" : "شحن قياسي (Standard)"}
                  </span>
                </div>
                {order.shipping_method === "express" && (
                  <div className="mt-2 p-2 bg-yellow-400/10 border border-yellow-500/20 rounded-xl text-yellow-300 text-[11px] leading-relaxed">
                    💡 <strong>تنويه الشحن السريع:</strong> مدة الشحن السريع (24-48 ساعة) تبدأ فور اعتماد السداد واكتمال مرحلة الطباعة في معملنا.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Column: Financial Summary & Payment Action */}
          <div className="space-y-6">
            <div className="bg-[#111111] rounded-3xl p-6 border border-yellow-500/20 shadow-xl space-y-4">
              <h2 className="text-lg font-black text-white pb-3 border-b border-white/[0.08]">
                الملخص المالي النهائي
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center text-gray-400">
                  <span>المجموع الفرعي:</span>
                  <span className="font-bold text-white">{order.subtotal.toFixed(2)} ج.م</span>
                </div>

                <div className="flex justify-between items-center text-gray-400">
                  <span>تكلفة الشحن:</span>
                  <span className="font-bold text-white">
                    {order.shipping_cost === 0 ? (
                      <span className="text-emerald-400 font-bold">شحن مجاني ✓</span>
                    ) : (
                      `${order.shipping_cost.toFixed(2)} ج.م`
                    )}
                  </span>
                </div>

                {order.discount_amount > 0 && (
                  <div className="flex justify-between items-center text-emerald-400">
                    <span>خصم الكوبون:</span>
                    <span className="font-bold">-{order.discount_amount.toFixed(2)} ج.م</span>
                  </div>
                )}

                <div className="pt-3 border-t border-white/[0.08] flex justify-between items-center">
                  <span className="font-bold text-white text-base">الإجمالي المطلوب:</span>
                  <span className="text-2xl font-black text-yellow-400">
                    {order.total.toFixed(2)} ج.م
                  </span>
                </div>
              </div>

              {/* Payment Methods Selection (When Unpaid & Active) */}
              {!isPaid && !isExpired && (
                <div className="pt-4 border-t border-white/[0.08] space-y-4">
                  <div className="text-xs font-bold text-gray-300 mb-2">اختر طريقة السداد:</div>

                  {/* Payment Tabs */}
                  <div className="grid grid-cols-2 gap-2 p-1 bg-[#1a1a1a] rounded-2xl border border-white/[0.06]">
                    <button
                      type="button"
                      onClick={() => setSelectedMethod("online")}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        selectedMethod === "online"
                          ? "bg-yellow-400 text-black shadow-md"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      <CreditCard size={15} />
                      <span>دفع أونلاين</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedMethod("transfer")}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        selectedMethod === "transfer"
                          ? "bg-yellow-400 text-black shadow-md"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      <PhoneCall size={15} />
                      <span>تحويل كاش</span>
                    </button>
                  </div>

                  {/* Option 1: Online Payment */}
                  {selectedMethod === "online" && (
                    <div className="space-y-3">
                      <button
                        onClick={handleOnlinePayment}
                        disabled={isInitiating}
                        className="w-full py-4 px-6 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black font-black rounded-2xl flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-xl shadow-yellow-400/20 text-base"
                      >
                        {isInitiating ? (
                          <>
                            <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                            <span>جاري فتح بوابة الدفع...</span>
                          </>
                        ) : (
                          <>
                            <Lock size={18} />
                            <span>سداد الآن أونلاين ({order.total.toFixed(2)} ج.م)</span>
                          </>
                        )}
                      </button>
                      <p className="text-[11px] text-gray-500 text-center flex items-center justify-center gap-1">
                        <ShieldCheck size={13} className="text-emerald-400" />
                        <span>دفع مشفر وآمن عبر البطاقات والمحافظ الإلكترونية</span>
                      </p>
                      {initError && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
                          {initError}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Option 2: Direct Transfer (InstaPay / Vodafone Cash) */}
                  {selectedMethod === "transfer" && directInfo && (
                    <div className="space-y-3 animate-in fade-in duration-300">
                      <div className="p-3 bg-[#181818] rounded-2xl border border-white/[0.08] space-y-2">
                        {/* InstaPay */}
                        <div>
                          <div className="text-[11px] text-gray-400 mb-1">عنوان إنستاباي (InstaPay):</div>
                          <div className="flex items-center justify-between bg-[#111] px-3 py-2 rounded-xl border border-white/[0.06]">
                            <span className="font-mono text-xs font-bold text-white" dir="ltr">
                              {directInfo.instapay_address}
                            </span>
                            <button
                              onClick={() => copyToClipboard(directInfo.instapay_address, "instapay")}
                              className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1 font-bold"
                            >
                              {copiedField === "instapay" ? (
                                <>
                                  <Check size={14} className="text-emerald-400" />
                                  <span className="text-emerald-400">تم النسخ</span>
                                </>
                              ) : (
                                <>
                                  <Copy size={14} />
                                  <span>نسخ</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Vodafone Cash */}
                        <div>
                          <div className="text-[11px] text-gray-400 mb-1">محفظة فودافون كاش:</div>
                          <div className="flex items-center justify-between bg-[#111] px-3 py-2 rounded-xl border border-white/[0.06]">
                            <span className="font-mono text-xs font-bold text-white" dir="ltr">
                              {directInfo.vodafone_cash_number}
                            </span>
                            <button
                              onClick={() => copyToClipboard(directInfo.vodafone_cash_number, "vodafone")}
                              className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1 font-bold"
                            >
                              {copiedField === "vodafone" ? (
                                <>
                                  <Check size={14} className="text-emerald-400" />
                                  <span className="text-emerald-400">تم النسخ</span>
                                </>
                              ) : (
                                <>
                                  <Copy size={14} />
                                  <span>نسخ</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* WhatsApp Confirmation Button */}
                      <a
                        href={formatWhatsAppLink(
                          directInfo.whatsapp_support,
                          `مرحباً، تم تحويل مبلغ ${order.total.toFixed(2)} ج.م للطلب رقم #${order.order_number} عبر (إنستاباي / كاش)، مرفق صورة الإيصال لتأكيد الطلب.`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors text-sm shadow-lg shadow-emerald-500/20"
                      >
                        <ExternalLink size={16} />
                        <span>إرسال إيصال التحويل عبر واتساب 💬</span>
                      </a>
                      <p className="text-[10px] text-gray-400 leading-relaxed text-center">
                        بعد إتمام التحويل، يرجى إرسال لقطة الشاشة عبر واتساب ليقوم التاجر بتأكيد استلام الدفعة في السيستم فوراً.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

export default function OrderPayTokenPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-yellow-400/20 border-t-yellow-400 rounded-full animate-spin" />
        </div>
      }
    >
      <PayTokenContent />
    </Suspense>
  );
}
