"use client";

import React, { useState } from "react";
import { PageTransition } from "@/components/UI/Animations";
import { useAppContext } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import { Copy, CheckCircle2, AlertCircle } from "lucide-react";

import { login, register } from "@/lib/api";

export default function AuthPage() {
  const { setUser, refreshCart } = useAppContext();
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: "",
    governorate: "",
    mobile: "",
    whatsapp: "",
    sameAsMobile: false,
    email: "",
    password: "",
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        password_confirmation: formData.password, // For simplicity
      });

      if (response.token) {
        localStorage.setItem("customer_token", response.token);
      }
      setUser(response.customer || null);
      await refreshCart();
      router.push("/account");
    } catch (err: any) {
      setError(err.message || 'فشل إنشاء الحساب');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/storefront/auth/social/${provider}/redirect`);
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Social login error', err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await login({
        email: formData.email,
        password: formData.password,
      });

      if (response.token) {
        localStorage.setItem("customer_token", response.token);
      }
      setUser(response.customer);
      await refreshCart();
      router.push("/account");
    } catch (err: any) {
      setError(err.message || 'بيانات الدخول غير صحيحة');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <div className="max-w-md mx-auto px-4 pt-32 md:pt-40 pb-12">
        <div className="bg-[#111111] rounded-[2rem] p-6 md:p-8 shadow-xl shadow-black/50 border border-yellow-500/20">
          <div className="flex gap-4 mb-8">
            <button
              className={`flex-1 pb-2 text-center font-bold text-lg border-b-2 transition-colors ${!isLogin ? "border-yellow-500 text-white" : "border-transparent text-gray-500 hover:text-gray-200"}`}
              onClick={() => { setIsLogin(false); setError(''); }}
            >
              إنشاء حساب
            </button>
            <button
              className={`flex-1 pb-2 text-center font-bold text-lg border-b-2 transition-colors ${isLogin ? "border-yellow-500 text-white" : "border-transparent text-gray-500 hover:text-gray-200"}`}
              onClick={() => { setIsLogin(true); setError(''); }}
            >
              تسجيل الدخول
            </button>
          </div>

          {!isLogin ? (
            <form onSubmit={handleRegister} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-xl text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-1">
                  الاسم الكامل
                </label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-300 mb-1">
                  المحافظة
                </label>
                <select
                  required
                  value={formData.governorate}
                  onChange={(e) =>
                    setFormData({ ...formData, governorate: e.target.value })
                  }
                  className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                >
                  <option value="">اختر المحافظة...</option>
                  <option value="cairo">القاهرة</option>
                  <option value="giza">الجيزة</option>
                  <option value="alex">الإسكندرية</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-300 mb-1">
                  رقم الموبايل
                </label>
                <input
                  required
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      mobile: val,
                      whatsapp: prev.sameAsMobile ? val : prev.whatsapp,
                    }));
                  }}
                  className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-400 text-left"
                  dir="ltr"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="sameAsMobile"
                  checked={formData.sameAsMobile}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setFormData((prev) => ({
                      ...prev,
                      sameAsMobile: checked,
                      whatsapp: checked ? prev.mobile : prev.whatsapp,
                    }));
                  }}
                  className="w-4 h-4 accent-yellow-500"
                />
                <label
                  htmlFor="sameAsMobile"
                  className="text-sm font-bold text-gray-400 select-none cursor-pointer"
                >
                  رقم الواتساب هو نفس رقم الموبايل
                </label>
              </div>

              {!formData.sameAsMobile && (
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-1">
                    رقم الواتساب
                  </label>
                  <input
                    required
                    type="tel"
                    value={formData.whatsapp}
                    onChange={(e) =>
                      setFormData({ ...formData, whatsapp: e.target.value })
                    }
                    className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-400 text-left"
                    dir="ltr"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-300 mb-1">
                  البريد الإلكتروني
                </label>
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-400 text-left"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-300 mb-1">
                  كلمة المرور
                </label>
                <input
                  required
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-400 text-left"
                  dir="ltr"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-yellow-400 text-black font-bold py-4 rounded-xl hover:bg-yellow-300 transition-colors mt-6 shadow-lg shadow-black/40"
              >
                إنشاء الحساب
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-xl text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-1">
                  البريد الإلكتروني
                </label>
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-400 text-left"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-1">
                  كلمة المرور
                </label>
                <input
                  required
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-400 text-left"
                  dir="ltr"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-yellow-400 text-black font-bold py-4 rounded-xl hover:bg-yellow-300 transition-colors mt-6 shadow-lg shadow-black/40 disabled:opacity-50"
              >
                {isSubmitting ? "جاري الدخول..." : "تسجيل الدخول"}
              </button>
            </form>
          )}

          <div className="mt-6 flex items-center justify-between">
            <span className="w-1/5 border-b border-gray-600 lg:w-1/4"></span>
            <span className="text-xs text-center text-gray-500 uppercase">أو سجل باستخدام</span>
            <span className="w-1/5 border-b border-gray-600 lg:w-1/4"></span>
          </div>
          <div className="flex gap-4 mt-4">
            <button onClick={() => handleSocialLogin('google')} type="button" className="flex items-center justify-center w-full p-3 border border-white/[0.08] rounded-xl hover:bg-white/5 transition">
              <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/></svg>
              Google
            </button>
            <button onClick={() => handleSocialLogin('facebook')} type="button" className="flex items-center justify-center w-full p-3 border border-white/[0.08] rounded-xl hover:bg-white/5 transition">
              <svg className="w-5 h-5 mr-2" viewBox="0 0 512 512"><path fill="#1877F2" d="M512,257.555c0,-141.385 -114.615,-256 -256,-256c-141.385,0 -256,114.615 -256,256c0,127.777 93.616,233.685 216,252.89l0,-178.89l-65,0l0,-74l65,0l0,-56.4c0,-64.16 38.219,-99.6 96.695,-99.6c28.009,0 57.305,5 57.305,5l0,63l-32.281,0c-31.801,0 -41.719,19.733 -41.719,39.976l0,48.024l71,0l-11.35,74l-59.65,0l0,178.89c122.385,-19.205 216,-125.113 216,-252.89Z"/><path fill="#ffffff" d="M355.65,331.555l11.35,-74l-71,0l0,-48.024c0,-20.243 9.918,-39.976 41.719,-39.976l32.281,0l0,-63c0,0 -29.297,-5 -57.305,-5c-58.476,0 -96.695,35.44 -96.695,99.6l0,56.4l-65,0l0,74l65,0l0,178.89c13.033,2.045 26.392,3.106 40,3.106c13.608,0 26.966,-1.061 40,-3.106l0,-178.89l59.65,0Z"/></svg>
              Facebook
            </button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
