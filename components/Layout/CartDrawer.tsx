"use client";
import React, { useState } from "react";
import { X, Trash2, Plus, Minus, ShoppingCart, Printer, Tag, Loader2 } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { getTranslatedText } from "@/lib/utils";

export default function CartDrawer() {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    user,
    appliedCoupon,
    discountAmount,
    applyCouponCode,
    removeCouponCode,
    isCartSyncing,
  } = useAppContext();

  const [couponCode, setCouponCode] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [couponMsg, setCouponMsg] = useState<{ text: string; isError: boolean } | null>(null);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || isApplying || isCartSyncing) return;
    setIsApplying(true);
    setCouponMsg(null);
    const res = await applyCouponCode(couponCode.trim());
    setIsApplying(false);
    if (res.success) {
      setCouponCode("");
      setCouponMsg({ text: res.message, isError: false });
    } else {
      setCouponMsg({ text: res.message, isError: true });
    }
  };

  const handleRemoveCoupon = async () => {
    if (isApplying || isCartSyncing) return;
    setIsApplying(true);
    await removeCouponCode();
    setIsApplying(false);
    setCouponMsg(null);
  };

  const total = cart.reduce((sum, item) => {
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

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[100]"
            onClick={() => setIsCartOpen(false)}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full sm:w-[400px] bg-[#0a0a0a] z-[101] shadow-2xl shadow-black/60 flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-yellow-500/20 flex justify-between items-center bg-[#111111]">
              <div className="flex items-center gap-2">
                <ShoppingCart className="text-yellow-400" />
                <h2 className="font-bold text-lg text-white">
                  سلة المشتريات
                </h2>
                <span className="bg-yellow-400 text-xs font-bold px-2 py-0.5 rounded-full">
                  {cart.length}
                </span>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="text-gray-500 hover:text-white transition-transform hover:scale-110 active:scale-95"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {!user && cart.length > 0 && (
                <div className="bg-yellow-400/15 border border-yellow-500/30 rounded-xl p-3 mb-4 text-sm text-yellow-500 text-center">
                  قم بتسجيل الدخول لتجربة شراء أسرع وحفظ منتجاتك!
                  <Link
                    href="/auth"
                    onClick={() => setIsCartOpen(false)}
                    className="block mt-2 font-bold underline"
                  >
                    تسجيل الدخول / إنشاء حساب
                  </Link>
                </div>
              )}

              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
                  <ShoppingCart size={64} className="opacity-20" />
                  <p className="font-bold text-lg">السلة فارغة</p>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="px-6 py-2 bg-yellow-400 text-white font-bold rounded-full hover:bg-yellow-300 transition-colors"
                  >
                    ابدأ التسوق
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence>
                    {cart.map((item) => {
                      let maxCap = Infinity;
                      item.addons?.forEach(a => {
                        if (a.price_multiplier_type === 'per_item' && typeof a.max_quantity === 'number') {
                          maxCap = Math.min(maxCap, a.max_quantity);
                        }
                      });
                      const isAtMaxCap = item.quantity >= maxCap;

                      const itemSubtotal = (item.price * item.quantity) + (item.addons?.reduce((sum, a) => sum + (a.price_multiplier_type === 'per_item' ? a.price * item.quantity : a.price), 0) || 0);

                      return (
                        <motion.div
                          key={item.cartItemId}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="flex flex-col gap-3 bg-[#111111] p-3 rounded-2xl shadow-sm shadow-black/30 border border-yellow-500/15"
                        >
                          <div className="flex gap-4">
                            <div className="w-20 h-20 bg-[#222222] rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a]">
                                  {item.isPrinting ? (
                                    <Printer size={28} className="text-yellow-400/60" />
                                  ) : (
                                    <ShoppingCart size={28} className="text-yellow-400/60" />
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 flex flex-col justify-between">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-bold text-white text-sm line-clamp-2">
                                    {getTranslatedText(item.name)}
                                  </h3>
                                  {item.variant_name && (
                                    <span className="inline-block text-xs font-semibold text-yellow-400/90 mt-1 bg-yellow-400/10 px-2 py-0.5 rounded-md">
                                      {item.variant_name}
                                    </span>
                                  )}
                                </div>
                                <button
                                  onClick={() => removeFromCart(item.cartItemId)}
                                  className="text-gray-500 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>

                              <div className="flex justify-between items-end mt-2">
                                <span className="font-bold text-yellow-400">
                                  {itemSubtotal.toFixed(2)} ج.م
                                </span>
                                {item.item_type === 'printing' ? (
                                  <div className="flex items-center gap-3 bg-[#1a1a1a] rounded-full px-4 py-1 border border-white/[0.08]">
                                    <span className="font-bold text-sm text-center">
                                      الكمية: {item.printing_options?.physical_quantity || item.quantity}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-3 bg-[#1a1a1a] rounded-full px-2 border border-white/[0.08]">
                                    <button
                                      onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                                      className="p-1 hover:text-yellow-400 transition-colors"
                                    >
                                      <Minus size={14} />
                                    </button>
                                    <span className="font-bold text-sm w-4 text-center">
                                      {item.quantity}
                                    </span>
                                    <button
                                      onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                                      disabled={isAtMaxCap}
                                      className={`p-1 transition-colors ${isAtMaxCap ? 'text-gray-600 cursor-not-allowed opacity-50' : 'hover:text-yellow-400'}`}
                                    >
                                      <Plus size={14} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Addons List */}
                          {item.addons && item.addons.length > 0 && (
                            <div className="mt-2 bg-[#1a1a1a] rounded-xl p-3 border border-white/5 space-y-2">
                              {item.addons.map((addon, idx) => (
                                <div key={idx} className="flex justify-between items-center text-xs text-gray-400">
                                  <div className="flex flex-col gap-1">
                                    <span className="text-gray-300 font-bold">{getTranslatedText(addon.name)} <span className="text-gray-500 font-normal">({getTranslatedText(addon.groupName)})</span></span>
                                    {(addon.temp_file_ids && addon.temp_file_ids.length > 0) ? (
                                      <span className="text-green-500 font-medium">تم رفع {addon.temp_file_ids.length > 1 ? `${addon.temp_file_ids.length} ملفات` : 'الملف'} ✓</span>
                                    ) : addon.temp_file_id ? (
                                      <span className="text-green-500 font-medium">تم رفع الملف ✓</span>
                                    ) : null}
                                  </div>
                                  <span className="text-yellow-500 font-bold">
                                    +{addon.price.toFixed(2)} ج.م {addon.price_multiplier_type === 'per_order_line' ? '(للطلب)' : ''}
                                  </span>
                                </div>
                              ))}
                              {isAtMaxCap && (
                                <div className="text-xs text-red-400 mt-2 font-bold bg-red-400/10 p-2 rounded-lg text-center">
                                  تم الوصول للحد الأقصى لبعض الخدمات المختارة
                                </div>
                              )}
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="bg-[#111111] p-4 border-t border-yellow-500/20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                {/* Coupon Input / Badge in Drawer */}
                <div className="mb-3 pb-3 border-b border-white/[0.06]">
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-green-500/10 border border-green-500/30 px-3 py-2 rounded-xl text-xs">
                      <div className="flex items-center gap-1.5">
                        <Tag size={13} className="text-green-400" />
                        <span className="font-mono font-bold text-green-400 tracking-wider">
                          {appliedCoupon.code}
                        </span>
                        <span className="text-green-300 font-semibold">
                          ({appliedCoupon.type === 'percentage' ? `${appliedCoupon.value}%` : `${appliedCoupon.value} ج.م`} خصم)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        disabled={isApplying || isCartSyncing}
                        className="text-gray-400 hover:text-red-400 transition-colors p-1 disabled:opacity-50"
                        title="إزالة الكوبون"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          placeholder="هل لديك كود خصم؟"
                          disabled={isApplying || isCartSyncing}
                          className="flex-1 bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400 uppercase tracking-wider font-mono disabled:opacity-50"
                        />
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          disabled={!couponCode.trim() || isApplying || isCartSyncing}
                          className="bg-yellow-400 text-black font-bold px-3 py-2 rounded-xl text-xs hover:bg-yellow-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 shrink-0"
                        >
                          {isApplying ? <Loader2 size={12} className="animate-spin" /> : "تطبيق"}
                        </button>
                      </div>
                      {couponMsg && (
                        <p className={`text-[11px] font-semibold mt-1.5 ${couponMsg.isError ? "text-red-400" : "text-green-400"}`}>
                          {couponMsg.text}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {appliedCoupon && discountAmount > 0 && (
                  <div className="flex justify-between items-center mb-2 text-sm font-bold text-green-400">
                    <span>خصم الكوبون ({appliedCoupon.code}):</span>
                    <span>- {Math.min(discountAmount, total).toFixed(2)} ج.م</span>
                  </div>
                )}
                <div className="flex justify-between items-center mb-4 text-lg font-black">
                  <span>الإجمالي:</span>
                  <span className="text-yellow-400">
                    {Math.max(0, total - (appliedCoupon ? Math.min(discountAmount, total) : 0)).toFixed(2)} ج.م
                  </span>
                </div>
                <Link
                  href="/checkout"
                  onClick={() => setIsCartOpen(false)}
                  className="w-full py-4 bg-yellow-400 text-black font-bold rounded-2xl hover:bg-yellow-300 transition-colors flex justify-center"
                >
                  إتمام الطلب
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
