"use client";

import React, { useState, useEffect, useRef } from "react";
import { PageTransition } from "@/components/UI/Animations";
import { useAppContext } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import { CheckCircle2, ArrowRight, Loader2, AlertCircle, Tag, X, Printer, ShoppingCart } from "lucide-react";
import { fetchShippingZones, processCheckout, fetchCheckoutSettings } from "@/lib/api";
import { getTranslatedText } from "@/lib/utils";

export default function CheckoutPage() {
  const { 
    cart, 
    user, 
    isCartSyncing, 
    sessionId, 
    clearCart,
    appliedCoupon,
    discountAmount,
    applyCouponCode,
    removeCouponCode
  } = useAppContext();
  const router = useRouter();
  
  const hasPrinting = cart.some(item => item.category === 'printing' || item.isPrinting || item.item_type === 'printing');
  
  const isOrderSubmitted = useRef(false);
  const [successOrderNumber, setSuccessOrderNumber] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("cod"); 
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  
  const [couponInput, setCouponInput] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponMessage, setCouponMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const [shippingZones, setShippingZones] = useState<any[]>([]);
  const [checkoutSettings, setCheckoutSettings] = useState<any>(null);
  const [shippingMethod, setShippingMethod] = useState<"standard" | "express">("standard");
  const [paymentOption, setPaymentOption] = useState<"deposit" | "full">("deposit");
  const isCodDisabled = hasPrinting && !checkoutSettings?.allow_full_cod_for_printing && Boolean(checkoutSettings?.online_payment_enabled);

  const [formData, setFormData] = useState({
    customer_name: user?.name || "",
    customer_phone: "",
    shipping_address: "",
    zone_id: ""
  });

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setIsApplyingCoupon(true);
    setCouponMessage(null);
    const res = await applyCouponCode(couponInput.trim());
    if (res.success) {
      setCouponMessage({ text: res.message, isError: false });
      setCouponInput("");
    } else {
      setCouponMessage({ text: res.message, isError: true });
    }
    setIsApplyingCoupon(false);
  };

  const handleRemoveCoupon = async () => {
    setIsApplyingCoupon(true);
    setCouponMessage(null);
    await removeCouponCode();
    setIsApplyingCoupon(false);
  };

  useEffect(() => {
    async function loadData() {
      const [zones, settings] = await Promise.all([
        fetchShippingZones(),
        fetchCheckoutSettings()
      ]);
      setShippingZones(zones);
      setCheckoutSettings(settings);

      // Default payment method logic based on fetched settings
      const codDisallowed = hasPrinting && !settings?.allow_full_cod_for_printing && Boolean(settings?.online_payment_enabled);
      if (codDisallowed) {
        setPaymentMethod("online");
      } else if (!settings?.cod_enabled && settings?.online_payment_enabled) {
        setPaymentMethod("online");
      } else if (settings?.cod_enabled) {
        setPaymentMethod("cod");
      }

      // Default payment option for printing
      if (hasPrinting) {
        const mode = settings?.printing_payment_mode || "customer_choice";
        if (mode === "deposit_only") {
          setPaymentOption("deposit");
        } else if (mode === "full_only") {
          setPaymentOption("full");
        } else {
          setPaymentOption(settings?.deposit_enabled ? "deposit" : "full");
        }
      }
    }
    loadData();
  }, [hasPrinting]);

  // Force online payment if there's a printing item and COD is strictly disallowed for printing
  useEffect(() => {
    if (hasPrinting && paymentMethod === "cod" && isCodDisabled) {
      setPaymentMethod("online");
    }
  }, [hasPrinting, paymentMethod, isCodDisabled]);

  const subtotal = cart.reduce((sum, item) => {
    let itemTotal = item.price * item.quantity;
    let addonsTotal = 0;
    if (item.addons) {
      item.addons.forEach(a => {
        if (a.price_multiplier_type === 'per_item') {
          addonsTotal += a.price * item.quantity;
        } else {
          addonsTotal += a.price;
        }
      });
    }
    return sum + itemTotal + addonsTotal;
  }, 0);
  
  const selectedZone = shippingZones.find(z => z.id.toString() === formData.zone_id);
  const baseShippingRate = selectedZone ? Number(selectedZone.cost ?? selectedZone.rate ?? 0) : 0;
  
  const finalDiscount = Math.min(discountAmount, subtotal);
  const netItemsTotal = Math.max(0, subtotal - finalDiscount);

  // Free shipping check
  const isBaseFree = Boolean(
    checkoutSettings?.free_shipping_enabled &&
    checkoutSettings?.free_shipping_threshold &&
    Number(checkoutSettings.free_shipping_threshold) > 0 &&
    netItemsTotal >= Number(checkoutSettings.free_shipping_threshold)
  );
  const appliedBaseShipping = isBaseFree ? 0 : baseShippingRate;

  // Express shipping surcharge
  const expressSurcharge = (shippingMethod === "express" && checkoutSettings?.express_shipping_enabled)
    ? Number(checkoutSettings.express_shipping_fee || 0)
    : 0;

  const totalShippingCost = appliedBaseShipping + expressSurcharge;

  // COD fee
  const appliedCodFee = (paymentMethod === "cod" && checkoutSettings?.cod_enabled)
    ? Number(checkoutSettings.cod_fee || 0)
    : 0;

  const total = netItemsTotal + totalShippingCost + appliedCodFee;

  // Custom Printing Subtotal and Deposit calculations
  const printingSubtotal = cart.reduce((sum, item) => {
    if (item.category === 'printing' || item.isPrinting || item.item_type === 'printing') {
      let itemTotal = item.price * item.quantity;
      let addonsTotal = 0;
      if (item.addons) {
        item.addons.forEach(a => {
          if (a.price_multiplier_type === 'per_item') {
            addonsTotal += a.price * item.quantity;
          } else {
            addonsTotal += a.price;
          }
        });
      }
      return sum + itemTotal + addonsTotal;
    }
    return sum;
  }, 0);

  const depositPercentage = Number(checkoutSettings?.deposit_percentage ?? 30);
  const minDepositAmount = Number(checkoutSettings?.min_deposit_amount ?? 50);
  const depositEnabled = Boolean(checkoutSettings?.deposit_enabled ?? true);
  const depositCalcBasis = checkoutSettings?.deposit_calculation_basis ?? 'printing_only';
  const printingPaymentMode = checkoutSettings?.printing_payment_mode ?? 'customer_choice';

  const depositBasis = (depositCalcBasis === 'all_items') ? netItemsTotal : printingSubtotal;
  const rawDeposit = Math.round((depositBasis * (depositPercentage / 100)) * 100) / 100;
  const depositCandidate = Math.max(rawDeposit, minDepositAmount);

  let depositAmount = 0;
  let remainingAmount = 0;

  if (!hasPrinting || !depositEnabled || total <= minDepositAmount || depositCandidate >= total) {
    depositAmount = total;
    remainingAmount = 0;
  } else {
    depositAmount = depositCandidate;
    remainingAmount = Math.round((total - depositAmount) * 100) / 100;
  }

  useEffect(() => {
    if (cart.length === 0 && !successOrderNumber && !isLoading && !isOrderSubmitted.current) {
      router.push("/shop");
    }
  }, [cart.length, successOrderNumber, isLoading, router]);

  if (cart.length === 0 && !successOrderNumber && !isOrderSubmitted.current) {
    return null;
  }

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    
    if (!formData.zone_id) {
        setErrorMessage("الرجاء اختيار المحافظة");
        return;
    }
    
    if (!sessionId) {
        setErrorMessage("خطأ في الجلسة، يرجى تحديث الصفحة");
        return;
    }

    setIsLoading(true);
    try {
      const payload = {
          customer_name: formData.customer_name,
          customer_phone: formData.customer_phone,
          shipping_address: formData.shipping_address,
          zone_id: formData.zone_id,
          shipping_method: shippingMethod, // ✅ إرسال طريقة الشحن (standard / express)
          coupon_code: appliedCoupon ? appliedCoupon.code : undefined,
          payment_method: paymentMethod, // cod, online
          payment_option: (hasPrinting && paymentMethod === 'online') ? paymentOption : 'full',
          success_url: window.location.origin + '/checkout/success',
          failure_url: window.location.origin + '/checkout/error',
      };

      const result = await processCheckout(payload, sessionId);
      
      if (result.requires_price_confirmation || result.status === 'pending_price_confirmation') {
          isOrderSubmitted.current = true;
          clearCart();
          router.push(`/checkout/success?order_id=${result.order_id}&order_number=${result.order_number}&status=pending_price_confirmation`);
          return;
      }

      if (paymentMethod === 'online' && result.payment_url) {
          isOrderSubmitted.current = true;
          window.location.href = result.payment_url;
      } else {
          isOrderSubmitted.current = true;
          clearCart(); // ONLY on COD success, online retains cart until payment is verified
          router.push(`/checkout/success?order_id=${result.order_id}&order_number=${result.order_number}&payment_method=${result.payment_method || paymentMethod}`);
      }
    } catch (error: any) {
      setErrorMessage(error.message || "حدث خطأ أثناء الدفع");
    } finally {
      setIsLoading(false);
    }
  };

  if (successOrderNumber) {
    return (
      <PageTransition>
        <div className="max-w-md mx-auto px-4 pt-32 pb-24 text-center">
          <div className="w-24 h-24 bg-green-500/15 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 size={48} />
          </div>
          <h1 className="text-4xl font-black mb-4">تم تأكيد طلبك!</h1>
          <p className="text-gray-500 mb-8 text-lg">
            شكراً لتسوقك معنا. رقم طلبك هو{" "}
            <span className="font-mono font-bold text-white">{successOrderNumber}</span>
            . سيتم التواصل معك قريباً.
          </p>
          <button
            onClick={() => router.push("/")}
            className="bg-yellow-400 text-black font-bold px-8 py-4 rounded-full hover:bg-yellow-300 transition-colors"
          >
            العودة للرئيسية
          </button>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto px-4 pt-28 md:pt-32 pb-8 md:pb-12">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-500 hover:text-white mb-8 font-bold transition-colors w-fit"
        >
          <ArrowRight size={20} /> العودة للسلة
        </button>

        <h1 className="text-3xl font-black mb-8">إتمام الطلب</h1>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            <form
              id="checkout-form"
              onSubmit={handleCheckout}
              className="space-y-8"
            >
              <div className="bg-[#111111] p-6 md:p-8 rounded-3xl shadow-sm shadow-black/30 border border-yellow-500/20">
                <h2 className="text-xl font-bold mb-6">بيانات الشحن</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-1">
                      الاسم
                    </label>
                    <input
                      required
                      value={formData.customer_name}
                      onChange={e => setFormData({...formData, customer_name: e.target.value})}
                      type="text"
                      className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-1">
                      رقم الهاتف
                    </label>
                    <input
                      required
                      type="tel"
                      value={formData.customer_phone}
                      onChange={e => setFormData({...formData, customer_phone: e.target.value})}
                      className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-400"
                      dir="ltr"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-300 mb-1">
                      العنوان بالتفصيل
                    </label>
                    <textarea
                      required
                      value={formData.shipping_address}
                      onChange={e => setFormData({...formData, shipping_address: e.target.value})}
                      className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-400 min-h-[100px]"
                    ></textarea>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-300 mb-1">
                      المحافظة
                    </label>
                    <select
                      required
                      value={formData.zone_id}
                      onChange={e => setFormData({...formData, zone_id: e.target.value})}
                      className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-400"
                    >
                        <option value="">اختر المحافظة...</option>
                        {shippingZones.map(zone => (
                            <option key={zone.id} value={zone.id}>{zone.name}</option>
                        ))}
                    </select>
                  </div>

                  {/* Shipping Speed Method Selection */}
                  {formData.zone_id && (
                    <div className="md:col-span-2 space-y-3 pt-2">
                      <label className="block text-sm font-bold text-gray-300">
                        سرعة التوصيل وطريقة الشحن
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Standard Shipping Card */}
                        <label
                          className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            shippingMethod === "standard"
                              ? "border-yellow-400 bg-yellow-400/10"
                              : "border-white/[0.06] hover:border-white/[0.12] bg-[#1a1a1a]"
                          }`}
                        >
                          <input
                            type="radio"
                            name="shipping_method"
                            value="standard"
                            checked={shippingMethod === "standard"}
                            onChange={() => setShippingMethod("standard")}
                            className="w-4 h-4 accent-yellow-400 mt-1 cursor-pointer"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-white text-sm">📦 شحن عادي</span>
                              <span className="font-black text-xs text-yellow-400">
                                {isBaseFree ? "مجاني" : `${baseShippingRate.toFixed(2)} ج.م`}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400">
                              مدة التوصيل: {checkoutSettings?.standard_shipping_delivery_time || "خلال 2 - 4 أيام عمل"}
                            </p>
                          </div>
                        </label>

                        {/* Express Shipping Card */}
                        {checkoutSettings?.express_shipping_enabled && (
                          <label
                            className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                              shippingMethod === "express"
                                ? "border-amber-400 bg-amber-400/10 shadow-sm shadow-amber-500/10"
                                : "border-white/[0.06] hover:border-white/[0.12] bg-[#1a1a1a]"
                            }`}
                          >
                            <input
                              type="radio"
                              name="shipping_method"
                              value="express"
                              checked={shippingMethod === "express"}
                              onChange={() => setShippingMethod("express")}
                              className="w-4 h-4 accent-amber-400 mt-1 cursor-pointer"
                            />
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-white text-sm flex items-center gap-1.5">
                                  <span>⚡ شحن سريع</span>
                                  <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-500/30">
                                    توصيل فوري
                                  </span>
                                </span>
                                <span className="font-black text-xs text-amber-400">
                                  {(appliedBaseShipping + Number(checkoutSettings.express_shipping_fee || 0)).toFixed(2)} ج.م
                                </span>
                              </div>
                              <p className="text-xs text-gray-300">
                                مدة التوصيل: {checkoutSettings.express_shipping_delivery_time || "خلال 24-48 ساعة"}
                              </p>
                              <p className="text-[11px] text-gray-500 mt-0.5">
                                (رسوم إضافية: +{Number(checkoutSettings.express_shipping_fee || 0).toFixed(2)} ج.م)
                              </p>
                              {hasPrinting && (
                                <p className="text-[11px] text-amber-400/90 font-medium mt-1.5 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 leading-relaxed">
                                  ⚠️ تنبيه: تبدأ مدة الشحن بعد اعتماد الملفات وانتهاء مرحلة الطباعة والتجهيز بالمطبعة.
                                </p>
                              )}
                            </div>
                          </label>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-[#111111] p-6 md:p-8 rounded-3xl shadow-sm shadow-black/30 border border-yellow-500/20">
                <h2 className="text-xl font-bold mb-6">طريقة الدفع</h2>
                <div className="space-y-4">
                  {/* Cash On Delivery Option */}
                  {checkoutSettings?.cod_enabled && (
                    <label
                      className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-colors ${
                        isCodDisabled 
                          ? "opacity-50 cursor-not-allowed border-white/[0.04]" 
                          : paymentMethod === "cod" 
                            ? "border-yellow-400 bg-yellow-400/10 cursor-pointer" 
                            : "border-white/[0.06] hover:border-white/[0.08] cursor-pointer"
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value="cod"
                        checked={paymentMethod === "cod"}
                        onChange={() => { if (!isCodDisabled) setPaymentMethod("cod"); }}
                        disabled={isCodDisabled}
                        className="w-5 h-5 accent-yellow-500 mt-1 cursor-pointer disabled:cursor-not-allowed"
                      />
                      <div>
                        <div className="font-bold text-white">
                          الدفع عند الاستلام
                        </div>
                        <div className="text-sm text-gray-500">
                          ادفع نقداً عند استلام طلبك {checkoutSettings.cod_fee > 0 && `(يضاف رسوم ${checkoutSettings.cod_fee} ج.م)`}
                        </div>
                        {isCodDisabled && (
                          <div className="flex items-center gap-1.5 text-xs text-yellow-500 font-bold mt-2 bg-yellow-500/10 w-fit px-2 py-1 rounded-md">
                            <AlertCircle size={14} />
                            غير متاح لوجود منتجات طباعة مخصصة تتطلب الدفع المسبق
                          </div>
                        )}
                        {!isCodDisabled && hasPrinting && (
                          <div className="flex items-center gap-1.5 text-xs text-amber-400 font-medium mt-2 bg-amber-400/10 w-fit px-2.5 py-1 rounded-md border border-amber-400/20">
                            <AlertCircle size={14} />
                            طلبات الطباعة عبر الدفع عند الاستلام تتطلب تأكيداً هاتفياً قبل بدء التشغيل
                          </div>
                        )}
                      </div>
                    </label>
                  )}

                  {/* Online Payment Option */}
                  {checkoutSettings?.online_payment_enabled && (
                    <label
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${paymentMethod === "online" ? "border-yellow-400 bg-yellow-400/10" : "border-white/[0.06] hover:border-white/[0.08]"}`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value="online"
                        checked={paymentMethod === "online"}
                        onChange={() => setPaymentMethod("online")}
                        className="w-5 h-5 accent-yellow-500"
                      />
                      <div>
                        <div className="font-bold text-white">
                          الدفع الإلكتروني الآمن (فيزا، ماستركارد، ميزة)
                        </div>
                        <div className="text-sm text-gray-500">
                          يدعم أيضاً فودافون كاش، إنستاباي، والمحافظ الإلكترونية
                        </div>
                      </div>
                    </label>
                  )}

                  {/* Deposit Payment Selector / Informer for Printing Orders */}
                  {paymentMethod === "online" && hasPrinting && depositEnabled && depositAmount < total && (
                    <div className="p-4 bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-transparent border border-yellow-500/30 rounded-2xl space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="p-1 bg-yellow-400 text-black rounded font-black text-xs">نظام العربون</span>
                        <h3 className="font-bold text-white text-sm">خيارات سداد منتجات الطباعة الرقمية</h3>
                      </div>

                      {printingPaymentMode === "customer_choice" && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <label
                            className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                              paymentOption === "deposit"
                                ? "border-yellow-400 bg-yellow-400/15"
                                : "border-white/[0.08] bg-[#1a1a1a] hover:border-white/[0.15]"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-sm text-white">💰 سداد العربون فقط</span>
                              <input
                                type="radio"
                                name="payment_option"
                                value="deposit"
                                checked={paymentOption === "deposit"}
                                onChange={() => setPaymentOption("deposit")}
                                className="w-4 h-4 accent-yellow-400"
                              />
                            </div>
                            <p className="text-xs text-gray-300 leading-relaxed mb-2">
                              ادفع <strong className="text-yellow-400 font-bold">{depositAmount.toFixed(2)} ج.م</strong> أونلاين الآن، وسدد المتبقي (<strong className="text-white">{remainingAmount.toFixed(2)} ج.م</strong>) عند الاستلام.
                            </p>
                            <span className="text-[10px] text-gray-400">مناسب لتقسيط تكلفة الطباعة</span>
                          </label>

                          <label
                            className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                              paymentOption === "full"
                                ? "border-yellow-400 bg-yellow-400/15"
                                : "border-white/[0.08] bg-[#1a1a1a] hover:border-white/[0.15]"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-sm text-white">💳 سداد كامل المبلغ (100%)</span>
                              <input
                                type="radio"
                                name="payment_option"
                                value="full"
                                checked={paymentOption === "full"}
                                onChange={() => setPaymentOption("full")}
                                className="w-4 h-4 accent-yellow-400"
                              />
                            </div>
                            <p className="text-xs text-gray-300 leading-relaxed mb-2">
                              ادفع كامل إجمالي الطلب (<strong className="text-yellow-400 font-bold">{total.toFixed(2)} ج.م</strong>) الآن لتجنب أي مبالغ نقدية عند الباب.
                            </p>
                            <span className="text-[10px] text-emerald-400">استلام فوري بدون دفع عند الاستلام</span>
                          </label>
                        </div>
                      )}

                      {printingPaymentMode === "deposit_only" && (
                        <div className="p-3 bg-yellow-400/10 border border-yellow-400/20 rounded-xl text-xs text-gray-200 leading-relaxed">
                          ⚡ <strong>نظام سداد العربون إلزامي للطباعة:</strong> ستدفع الآن أونلاين مبلغ <span className="text-yellow-400 font-bold">{depositAmount.toFixed(2)} ج.م</span> كدفعة مقدمة للبدء في الطباعة بالمطبعة، وسيقوم المندوب بتحصيل المتبقي (<span className="text-white font-bold">{remainingAmount.toFixed(2)} ج.م</span>) نقداً عند الاستلام.
                        </div>
                      )}

                      {printingPaymentMode === "full_only" && (
                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-200 leading-relaxed">
                          🛡️ <strong>السداد الكامل إلزامي:</strong> سيتم سداد إجمالي الطلب بالكامل (<span className="text-yellow-400 font-bold">{total.toFixed(2)} ج.م</span>) أونلاين لتأكيد الطباعة والتصنيع.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Fallback if no payment methods are available */}
                  {!checkoutSettings?.cod_enabled && !checkoutSettings?.online_payment_enabled && checkoutSettings !== null && (
                    <div className="p-4 rounded-xl border-2 border-red-500/20 bg-red-500/10 text-red-400 text-sm">
                      عذراً، لا توجد وسائل دفع متاحة حالياً. يرجى المحاولة لاحقاً أو التواصل مع الإدارة.
                    </div>
                  )}
                </div>
              </div>
            </form>
          </div>

          <div className="lg:w-96 shrink-0">
            <div className="bg-[#111111] p-6 rounded-3xl shadow-sm shadow-black/30 border border-yellow-500/20 sticky top-24">
              <h2 className="text-xl font-bold mb-6">ملخص الطلب</h2>

              <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2">
                {cart.map((item) => (
                  <div key={item.cartItemId} className="flex gap-4">
                    <div className="w-16 h-16 bg-[#222222] rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                      {item.image ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a]">
                          {item.isPrinting || item.item_type === 'printing' ? (
                            <Printer size={24} className="text-yellow-400/60" />
                          ) : (
                            <ShoppingCart size={24} className="text-yellow-400/60" />
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-sm text-white line-clamp-1">
                        {item.name}
                      </h4>
                      {item.variant_name && (
                        <div className="text-xs font-semibold text-yellow-400/90 mt-0.5">
                          {item.variant_name}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-0.5">
                        الكمية: {item.item_type === 'printing' && item.printing_options?.physical_quantity ? item.printing_options.physical_quantity : item.quantity}
                      </div>
                      <div className="font-bold text-yellow-400 mt-1">
                        {item.price.toFixed(2)} ج.م
                      </div>
                      {item.addons && item.addons.length > 0 && (
                        <div className="mt-1 space-y-0.5 border-t border-white/5 pt-1">
                          {item.addons.map((addon, aIdx) => (
                            <div key={aIdx} className="text-[11px] text-gray-400 flex items-center justify-between">
                              <span className="truncate max-w-[140px]">+ {getTranslatedText(addon.name)}</span>
                              <span className="text-yellow-500/80 shrink-0">+{addon.price.toFixed(2)} ج.م</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Promo Code Box */}
              <div className="border-t border-white/[0.06] pt-4 mb-4">
                <label className="block text-xs font-bold text-gray-400 mb-2 flex items-center gap-1.5">
                  <Tag size={14} className="text-yellow-400" />
                  <span>كود الخصم (Coupon)</span>
                </label>

                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-green-500/10 border border-green-500/30 px-3 py-2.5 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-green-400 tracking-wider">
                        {appliedCoupon.code}
                      </span>
                      <span className="text-xs text-green-300 font-semibold">
                        ({appliedCoupon.type === 'percentage' ? `${appliedCoupon.value}%` : `${appliedCoupon.value} ج.م`} خصم)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      disabled={isApplyingCoupon || isCartSyncing}
                      className="text-gray-400 hover:text-red-400 transition-colors p-1 disabled:opacity-50"
                      title="إزالة الكوبون"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        placeholder="أدخل كود الخصم"
                        disabled={isApplyingCoupon || isCartSyncing}
                        className="flex-1 bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400 uppercase tracking-wider font-mono disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={!couponInput.trim() || isApplyingCoupon || isCartSyncing}
                        className="bg-yellow-400 text-black font-bold px-4 py-2 rounded-xl text-sm hover:bg-yellow-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 shrink-0"
                      >
                        {isApplyingCoupon ? <Loader2 size={14} className="animate-spin" /> : "تطبيق"}
                      </button>
                    </div>
                    {couponMessage && (
                      <p className={`text-xs font-semibold ${couponMessage.isError ? "text-red-400" : "text-green-400"}`}>
                        {couponMessage.text}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t border-white/[0.06] pt-4 space-y-3 mb-6 text-sm font-bold">
                <div className="flex justify-between text-gray-400">
                  <span>المجموع الفرعي</span>
                  <span>{subtotal.toFixed(2)} ج.م</span>
                </div>
                {appliedCoupon && finalDiscount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span className="flex items-center gap-1.5">
                      <span>خصم الكوبون</span>
                      <span className="font-mono text-xs bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20">({appliedCoupon.code})</span>
                    </span>
                    <span>- {finalDiscount.toFixed(2)} ج.م</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-400">
                  <span>الشحن ({shippingMethod === 'express' ? 'سريع ⚡' : 'عادي 📦'})</span>
                  <span>
                    {selectedZone 
                      ? isBaseFree && shippingMethod === 'standard' 
                        ? 'مجاني' 
                        : `${totalShippingCost.toFixed(2)} ج.م` 
                      : 'سيتم تحديده'}
                  </span>
                </div>
                {shippingMethod === 'express' && expressSurcharge > 0 && (
                  <div className="flex justify-between text-xs text-amber-400/90 pr-2">
                    <span>رسوم الشحن السريع الإضافية</span>
                    <span>+{expressSurcharge.toFixed(2)} ج.م</span>
                  </div>
                )}
                {paymentMethod === 'cod' && appliedCodFee > 0 && (
                  <div className="flex justify-between text-gray-400">
                    <span>رسوم الدفع عند الاستلام (COD)</span>
                    <span>+{appliedCodFee.toFixed(2)} ج.م</span>
                  </div>
                )}
                <div className="flex justify-between text-lg text-white pt-3 border-t border-white/[0.06] font-black">
                  <span>إجمالي الطلب</span>
                  <span className="text-yellow-400">
                    {total.toFixed(2)} ج.م
                  </span>
                </div>

                {paymentMethod === "online" && hasPrinting && depositEnabled && paymentOption === "deposit" && depositAmount < total && (
                  <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-2xl p-4 space-y-2 mt-3">
                    <div className="flex justify-between items-center text-emerald-400 font-bold">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span>المطلوب سداده الآن (عربون أونلاين):</span>
                      </span>
                      <span className="text-base font-black">{depositAmount.toFixed(2)} ج.م</span>
                    </div>
                    <div className="flex justify-between items-center text-yellow-400/90 text-xs font-semibold pt-2 border-t border-emerald-500/20">
                      <span>المتبقي عند الاستلام كـ COD:</span>
                      <span className="font-bold">{remainingAmount.toFixed(2)} ج.م</span>
                    </div>
                  </div>
                )}
              </div>

              {errorMessage && (
                  <div className="mb-4 text-red-500 text-sm font-bold text-center">
                      {errorMessage}
                  </div>
              )}
              <button
                form="checkout-form"
                type="submit"
                disabled={isLoading || isCartSyncing}
                className="w-full bg-yellow-400 text-black font-bold py-4 rounded-full hover:bg-yellow-300 transition-colors shadow-lg shadow-black/40 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {isLoading || isCartSyncing ? <Loader2 className="animate-spin" size={20} /> : null}
                {isCartSyncing ? 'جاري مزامنة السلة...' : isLoading ? 'جاري التأكيد...' : 'تأكيد الطلب'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
