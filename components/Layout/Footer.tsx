"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MainLogo } from "@/components/UI/Logo";
import { CheckCircle2, MapPin, Phone, MessageCircle, ExternalLink, Sparkles } from "lucide-react";

export default function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith("/print-station")) return null;

  const currentYear = new Date().getFullYear();

  // Official store contact details & links
  const contactInfo = {
    storePhone: "01011348890",
    ownerPhone: "01023336371",
    whatsappUrl: "https://wa.me/201011348890",
    googleMapsUrl: "https://maps.app.goo.gl/BE6b7dTrhY3hH1BR8?g_st=ic",
    facebookUrl: "https://www.facebook.com/share/1CS2Nj9hVW/?mibextid=wwXIfr",
    instagramUrl: "https://www.instagram.com/printexpresseg.press?dlrf=MThqMGF5bnJkbmdobg%3D%3D&utm_source=qr",
    tiktokUrl: "https://www.tiktok.com/@print.express12?_r=1&_t=ZS-9B4Bt50ZxIu",
    youtubeUrl: "https://youtube.com/@printexpress1501?si=vr-hHeCnfPWhSCZn",
  };

  return (
    <footer className="bg-[#0d0d0d] border-t border-yellow-500/20 pt-16 pb-28 md:pb-10 px-6 md:px-12 mt-16 text-gray-300" dir="rtl">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-white/[0.08]">
        {/* Column 1: Brand & Bio */}
        <div className="flex flex-col items-start gap-4">
          <Link href="/" className="inline-block">
            <MainLogo size="sm" />
          </Link>
          <p className="text-sm leading-relaxed text-gray-400 font-medium">
            مطبعة برنت إكسبريس (Print Express) — وجهتك الأولى لحلول الطباعة الرقمية والإعلانية المتطورة بأعلى مقاييس الجودة والسرعة وأفضل الأسعار في مصر.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            فريق العمل متاح لاستقبال وتنفيذ طلباتكم
          </div>
        </div>

        {/* Column 2: Quick Links */}
        <div className="flex flex-col gap-3">
          <h4 className="text-white font-black text-base flex items-center gap-2 mb-2">
            <Sparkles size={16} className="text-yellow-400" />
            روابط سريعة
          </h4>
          <ul className="space-y-2 text-sm font-semibold text-gray-400">
            <li>
              <Link href="/" className="hover:text-yellow-400 transition-colors flex items-center gap-2">
                الرئيسية
              </Link>
            </li>
            <li>
              <Link href="/shop" className="hover:text-yellow-400 transition-colors flex items-center gap-2">
                متجر المنتجات والمطبوعات
              </Link>
            </li>
            <li>
              <Link href="/print-station" className="text-yellow-400 hover:text-yellow-300 transition-colors flex items-center gap-2 font-bold">
                محطة الطباعة المخصصة (Print Station)
              </Link>
            </li>
            <li>
              <Link href="/blog" className="hover:text-yellow-400 transition-colors flex items-center gap-2">
                المدونة وأفكار التصميم
              </Link>
            </li>
            <li>
              <Link href="/account" className="hover:text-yellow-400 transition-colors flex items-center gap-2">
                حسابي ومتابعة الطلبات
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 3: Direct Contact & Phones */}
        <div className="flex flex-col gap-3">
          <h4 className="text-white font-black text-base flex items-center gap-2 mb-2">
            <Phone size={16} className="text-yellow-400" />
            التواصل المباشر
          </h4>

          {/* WhatsApp Direct Action Button */}
          <a
            href={contactInfo.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 rounded-2xl transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm.029 18.88c-1.161 0-2.305-.292-3.318-.844l-3.677.964.984-3.595c-.607-1.052-.927-2.246-.926-3.468.001-3.825 3.113-6.937 6.937-6.937 3.825 0 6.938 3.112 6.938 6.937 0 3.824-3.113 6.938-6.938 6.938z" />
                </svg>
              </div>
              <div>
                <div className="text-xs font-bold text-gray-400">واتساب المطبعة المباشر</div>
                <div className="text-sm font-black text-emerald-400 font-mono" dir="ltr">
                  {contactInfo.storePhone}
                </div>
              </div>
            </div>
            <ExternalLink size={16} className="text-emerald-400 group-hover:translate-x-[-2px] transition-transform" />
          </a>

          {/* Store Phone */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
            <div>
              <div className="text-[11px] text-gray-500 font-semibold">رقم المطبعة (اتصال)</div>
              <a href={`tel:${contactInfo.storePhone}`} className="text-sm font-bold text-gray-200 hover:text-yellow-400 transition-colors font-mono" dir="ltr">
                {contactInfo.storePhone}
              </a>
            </div>
            <Phone size={16} className="text-gray-500" />
          </div>

          {/* Owner Phone */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
            <div>
              <div className="text-[11px] text-gray-500 font-semibold">رقم الإدارة</div>
              <a href={`tel:${contactInfo.ownerPhone}`} className="text-sm font-bold text-gray-200 hover:text-yellow-400 transition-colors font-mono" dir="ltr">
                {contactInfo.ownerPhone}
              </a>
            </div>
            <Phone size={16} className="text-yellow-500/70" />
          </div>
        </div>

        {/* Column 4: Location & Social Media */}
        <div className="flex flex-col gap-4">
          <h4 className="text-white font-black text-base flex items-center gap-2">
            <MapPin size={16} className="text-yellow-400" />
            موقع المطبعة
          </h4>

          {/* Google Maps Button */}
          <a
            href={contactInfo.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3.5 bg-yellow-400/10 border border-yellow-400/30 hover:bg-yellow-400/20 rounded-2xl transition-all group"
          >
            <div className="w-8 h-8 rounded-xl bg-yellow-400 text-slate-900 flex items-center justify-center shrink-0">
              <MapPin size={18} />
            </div>
            <div className="flex-1">
              <div className="text-xs font-bold text-yellow-400">موقعنا على الخريطة</div>
              <div className="text-[11px] text-gray-300 font-medium">انقر لفتح خرائط Google Maps</div>
            </div>
            <ExternalLink size={16} className="text-yellow-400 group-hover:translate-x-[-2px] transition-transform" />
          </a>

          {/* Social Media Channels */}
          <div>
            <div className="text-xs font-bold text-gray-400 mb-2.5">تابعونا على منصاتنا الرسمية:</div>
            <div className="flex items-center gap-2.5">
              {/* Facebook */}
              <a
                href={contactInfo.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="صفحة فيسبوك الرسمية"
                className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-gray-300 hover:text-white hover:bg-[#1877F2] hover:border-[#1877F2] transition-all"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>

              {/* Instagram */}
              <a
                href={contactInfo.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="حساب إنستجرام الرسمي"
                className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-gray-300 hover:text-white hover:bg-gradient-to-tr hover:from-amber-500 hover:via-pink-500 hover:to-purple-600 hover:border-transparent transition-all"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>

              {/* TikTok */}
              <a
                href={contactInfo.tiktokUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="حساب تيك توك الرسمي"
                className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-gray-300 hover:text-white hover:bg-black hover:border-white/30 transition-all"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.46 6.27 6.27 0 0 0 1.88-4.48V8.9a8.28 8.28 0 0 0 4.89 1.58V7.07a4.86 4.86 0 0 1-1-.38z"/>
                </svg>
              </a>

              {/* YouTube */}
              <a
                href={contactInfo.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="قناة يوتيوب الرسمية"
                className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-gray-300 hover:text-white hover:bg-[#FF0000] hover:border-[#FF0000] transition-all"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto pt-8 flex flex-col md:flex-row justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-widest gap-4 text-center md:text-left">
        <div dir="ltr">© {currentYear} PRINT EXPRESS | CAIRO, EGYPT. ALL RIGHTS RESERVED.</div>
        <div className="text-gray-400 font-black text-sm">
          ENGINEERED BY <a href="#" className="text-yellow-400 hover:text-yellow-500 transition-colors">APEX</a>
        </div>
        <div className="flex items-center justify-center gap-2 text-yellow-400">
          <CheckCircle2 size={14} /> SMART IP TRACKING ENABLED
        </div>
      </div>
    </footer>
  );
}
