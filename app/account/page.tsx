"use client";

import React, { useEffect, useState, Suspense } from "react";
import { PageTransition } from "@/components/UI/Animations";
import { useAppContext } from "@/context/AppContext";
import { useRouter, useSearchParams } from "next/navigation";
import {
  User,
  Heart,
  Package,
  MapPin,
  LogOut,
  ShoppingCart,
  Trash2,
  Clock,
  CheckCircle2,
  CreditCard,
  AlertCircle,
  ExternalLink,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";
import { fetchCustomerOrders } from "@/lib/api";

function AccountContent() {
  const { user, setUser, wishlist, removeFromWishlist, addToCart } =
    useAppContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams?.get("tab") || "dashboard";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push("/auth");
    }
  }, [user, router]);

  useEffect(() => {
    const token = localStorage.getItem("customer_token");
    if (token && user) {
      setLoadingOrders(true);
      fetchCustomerOrders(token)
        .then((res) => {
          if (res) {
            const list = Array.isArray(res.data)
              ? res.data
              : Array.isArray(res)
              ? res
              : res.data?.data || [];
            setOrders(list);
          }
        })
        .catch((err) => console.error("Error loading orders:", err))
        .finally(() => setLoadingOrders(false));
    }
  }, [user]);

  useEffect(() => {
    const tab = searchParams?.get("tab");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  if (!user) return null;

  const handleLogout = async () => {
    const token = localStorage.getItem("customer_token");
    if (token) {
      import('@/lib/api').then(({ logout }) => logout(token));
      localStorage.removeItem("customer_token");
    }
    setUser(null);
    router.push("/");
  };

  const tabs = [
    { id: "dashboard", label: "لوحة التحكم", icon: User },
    { id: "orders", label: "طلباتي", icon: Package },
    { id: "wishlist", label: "المفضلة", icon: Heart },
    { id: "addresses", label: "عناويني", icon: MapPin },
  ];

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-28 md:pt-32 pb-8 md:pb-12 flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="md:w-72 shrink-0">
          <div className="bg-[#111111] rounded-3xl p-6 shadow-sm shadow-black/30 border border-yellow-500/20">
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/[0.06]">
              <div className="w-16 h-16 bg-yellow-400/15 rounded-full flex items-center justify-center text-yellow-400 font-bold text-2xl">
                {user.name?.charAt(0) || "U"}
              </div>
              <div>
                <h2 className="font-bold text-lg text-white">{user.name}</h2>
                <p className="text-sm text-gray-500 font-mono" dir="ltr">
                  {user.email}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors text-right ${
                    activeTab === tab.id
                      ? "bg-yellow-400 text-gray-900"
                      : "text-gray-500 hover:bg-yellow-400/10 hover:text-white"
                  }`}
                >
                  <tab.icon size={20} /> {tab.label}
                </button>
              ))}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors text-right text-red-500 hover:bg-red-500/10 mt-4 border-t border-white/[0.06] pt-6"
              >
                <LogOut size={20} /> تسجيل الخروج
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="bg-[#111111] rounded-3xl p-6 md:p-10 shadow-sm shadow-black/30 border border-yellow-500/20 min-h-[500px]">
            {activeTab === "dashboard" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-black mb-6">
                  مرحباً بعودتك، {user.name}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-yellow-400/10 p-6 rounded-2xl border border-yellow-500/15 flex flex-col items-center justify-center text-center">
                    <Package size={32} className="text-yellow-400 mb-2" />
                    <span className="font-bold text-2xl text-white">
                      {orders.filter((o: any) => !['delivered', 'cancelled', 'expired'].includes(o.status)).length}
                    </span>
                    <span className="text-gray-500 text-sm font-bold">
                      الطلبات النشطة
                    </span>
                  </div>
                  <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-white/[0.06] flex flex-col items-center justify-center text-center">
                    <Heart size={32} className="text-gray-500 mb-2" />
                    <span className="font-bold text-2xl text-white">
                      {wishlist.length}
                    </span>
                    <span className="text-gray-500 text-sm font-bold">
                      عنصر في المفضلة
                    </span>
                  </div>
                  <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-white/[0.06] flex flex-col items-center justify-center text-center">
                    <MapPin size={32} className="text-gray-400 mb-2" />
                    <span className="font-bold text-2xl text-white">1</span>
                    <span className="text-gray-500 text-sm font-bold">
                      العناوين المحفوظة
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "orders" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
                  <Package className="text-yellow-400" /> طلباتي ({orders.length})
                </h2>

                {loadingOrders ? (
                  <div className="flex flex-col items-center justify-center h-[300px]">
                    <div className="w-10 h-10 border-4 border-yellow-400/20 border-t-yellow-400 rounded-full animate-spin mb-3" />
                    <span className="text-gray-400 text-sm">جاري تحميل سجل الطلبات...</span>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[400px] text-gray-500">
                    <Package size={64} className="mb-4 opacity-20" />
                    <p className="font-bold text-xl text-white mb-2">
                      لا توجد طلبات سابقة
                    </p>
                    <p className="text-gray-500 mb-6">
                      لم تقم بإجراء أي طلبات حتى الآن.
                    </p>
                    <Link
                      href="/shop"
                      className="px-6 py-3 bg-yellow-400 text-black font-bold rounded-full hover:bg-yellow-300"
                    >
                      تصفح المتجر
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order: any) => {
                      const isPendingPrice = order.status === "pending_price_confirmation";
                      const isExpired = order.status === "expired";
                      const canPay = order.payment_token && (
                        (isPendingPrice && order.price_confirmed_at) ||
                        (order.payment_status === "unpaid" && !isExpired && order.status !== "cancelled")
                      );

                      const getStatusBadge = (status: string) => {
                        switch (status) {
                          case "pending_price_confirmation":
                            return { label: "بانتظار تسعيرة اليوم", bg: "bg-amber-500/15 text-amber-400 border-amber-500/30" };
                          case "pending":
                            return { label: "قيد الانتظار", bg: "bg-blue-500/15 text-blue-400 border-blue-500/30" };
                          case "processing":
                            return { label: "قيد التجهيز والطباعة", bg: "bg-purple-500/15 text-purple-400 border-purple-500/30" };
                          case "shipped":
                            return { label: "تم الشحن", bg: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30" };
                          case "delivered":
                            return { label: "تم التوصيل", bg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" };
                          case "cancelled":
                            return { label: "ملغي", bg: "bg-red-500/15 text-red-400 border-red-500/30" };
                          case "expired":
                            return { label: "منتهي الصلاحية", bg: "bg-gray-500/15 text-gray-400 border-gray-500/30" };
                          default:
                            return { label: status, bg: "bg-gray-500/15 text-gray-300 border-gray-500/30" };
                        }
                      };

                      const statusBadge = getStatusBadge(order.status);

                      return (
                        <div
                          key={order.id}
                          className="bg-[#181818] rounded-2xl p-5 border border-white/[0.06] hover:border-white/[0.12] transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                        >
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-3">
                              <span className="font-mono font-bold text-white text-base">
                                #{order.order_number || order.id}
                              </span>
                              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusBadge.bg}`}>
                                {statusBadge.label}
                              </span>
                              {order.payment_status === "paid" && (
                                <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                                  مدفوع ✓
                                </span>
                              )}
                            </div>

                            <div className="text-xs text-gray-400 flex flex-wrap items-center gap-x-4 gap-y-1">
                              <span>التاريخ: {new Date(order.created_at).toLocaleDateString('ar-EG')}</span>
                              <span>عدد العناصر: {order.items?.length || 1}</span>
                              <span>
                                الإجمالي: <strong className="text-white">{Number(order.total).toFixed(2)} ج.م</strong>
                              </span>
                            </div>

                            {isPendingPrice && !order.price_confirmed_at && (
                              <div className="text-xs text-amber-400/90 flex items-center gap-1.5 pt-1">
                                <Clock size={13} className="text-amber-400" />
                                <span>جاري مراجعة مواصفات الطباعة وحساب تسعيرة خامات اليوم...</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-end">
                            {canPay && (
                              <Link
                                href={`/checkout/pay/${order.payment_token}`}
                                className="w-full md:w-auto px-4 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-transform active:scale-95 shadow-md shadow-yellow-400/20"
                              >
                                <CreditCard size={14} />
                                <span>عرض السعر المعتمد والدفع 💳</span>
                              </Link>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === "wishlist" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
                  <Heart className="text-yellow-400" /> قائمة المفضلة
                </h2>

                {wishlist.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
                    <Heart size={64} className="mb-4 opacity-20" />
                    <p className="font-bold text-xl text-white mb-2">
                      القائمة فارغة
                    </p>
                    <p className="text-gray-500 mb-6">
                      لم تقم بإضافة أي منتجات للمفضلة.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {wishlist.map((product) => (
                      <div
                        key={product.id}
                        className="bg-[#1a1a1a] rounded-2xl p-4 border border-white/[0.06] flex flex-col"
                      >
                        <div className="relative aspect-square rounded-xl bg-[#111111] mb-4 overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <Link
                          href={`/product/${product.slug || product.id}`}
                          className="font-bold text-white mb-1 hover:text-yellow-400 line-clamp-1"
                        >
                          {product.name}
                        </Link>
                        <div className="font-black text-lg mb-4">
                          {product.price.toFixed(2)} ج.م
                        </div>
                        <div className="mt-auto flex gap-2">
                          <button
                            onClick={() => addToCart(product)}
                            className="flex-1 bg-yellow-400 text-black py-2 rounded-xl text-sm font-bold hover:bg-yellow-300 flex justify-center items-center gap-2"
                          >
                            <ShoppingCart size={16} /> أضف للسلة
                          </button>
                          <button
                            onClick={() => removeFromWishlist(product.id)}
                            className="w-10 h-10 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-500/15 shrink-0"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "addresses" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
                  <MapPin className="text-yellow-400" /> عناويني
                </h2>

                <div className="bg-yellow-400/10 border border-yellow-500/20 rounded-2xl p-6 relative">
                  <div className="absolute top-6 left-6 flex gap-2">
                    <button className="text-sm font-bold text-yellow-400 hover:underline">
                      تعديل
                    </button>
                  </div>
                  <div className="flex items-start gap-4">
                    <MapPin className="text-yellow-400 mt-1" />
                    <div>
                      <h3 className="font-bold text-white text-lg mb-1">
                        المنزل (الافتراضي)
                      </h3>
                      <p className="text-gray-400 leading-relaxed max-w-md">
                        {user.name}
                        <br />
                        القاهرة، مصر
                        <br />
                        يرجى إضافة تفاصيل العنوان كاملاً
                      </p>
                    </div>
                  </div>
                </div>

                <button className="mt-6 w-full md:w-auto px-6 py-3 border-2 border-white/[0.08] text-gray-400 font-bold rounded-xl hover:bg-white/5 flex items-center justify-center gap-2">
                  <MapPin size={18} /> إضافة عنوان جديد
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          جاري التحميل...
        </div>
      }
    >
      <AccountContent />
    </Suspense>
  );
}
