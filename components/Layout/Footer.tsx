"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MainLogo } from "@/components/UI/Logo";
import { CheckCircle2, Phone, MapPin } from "lucide-react";

export default function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith("/print-station")) return null;

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#111111] border-t border-yellow-500/20 pt-12 pb-24 px-6 md:px-12 mt-12 md:pb-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
        {/* Logo & Direct Contact numbers in clean minimalist typography */}
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <MainLogo size="sm" />
          <div className="flex items-center gap-4 text-xs font-bold text-gray-400" dir="ltr">
            <a
              href="tel:01011348890"
              className="flex items-center gap-1.5 hover:text-yellow-400 transition-colors"
              title="رقم المطبعة"
            >
              <Phone size={14} className="text-yellow-400" />
              <span>01011348890</span>
            </a>
            <span className="text-gray-700">|</span>
            <a
              href="tel:01023336371"
              className="flex items-center gap-1.5 hover:text-yellow-400 transition-colors"
              title="رقم الإدارة"
            >
              <Phone size={14} className="text-yellow-400" />
              <span>01023336371</span>
            </a>
          </div>
        </div>

        {/* Clean Sleek Icons Only - No boxes, No cards */}
        <div className="flex items-center gap-2" dir="ltr">
          {/* WhatsApp */}
          <a
            href="https://wa.me/201011348890"
            target="_blank"
            rel="noopener noreferrer"
            title="WhatsApp: 01011348890"
            className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm.029 18.88c-1.161 0-2.305-.292-3.318-.844l-3.677.964.984-3.595c-.607-1.052-.927-2.246-.926-3.468.001-3.825 3.113-6.937 6.937-6.937 3.825 0 6.938 3.112 6.938 6.937 0 3.824-3.113 6.938-6.938 6.938z" />
            </svg>
          </a>

          {/* Google Maps */}
          <a
            href="https://maps.app.goo.gl/BE6b7dTrhY3hH1BR8?g_st=ic"
            target="_blank"
            rel="noopener noreferrer"
            title="موقع المطبعة على Google Maps"
            className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10 transition-all"
          >
            <MapPin size={20} />
          </a>

          {/* Facebook */}
          <a
            href="https://www.facebook.com/share/1CS2Nj9hVW/?mibextid=wwXIfr"
            target="_blank"
            rel="noopener noreferrer"
            title="Facebook"
            className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-[#1877F2] hover:bg-[#1877F2]/10 transition-all"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </a>

          {/* Instagram */}
          <a
            href="https://www.instagram.com/printexpresseg.press?dlrf=MThqMGF5bnJkbmdobg%3D%3D&utm_source=qr"
            target="_blank"
            rel="noopener noreferrer"
            title="Instagram"
            className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-[#E4405F] hover:bg-[#E4405F]/10 transition-all"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
          </a>

          {/* TikTok */}
          <a
            href="https://www.tiktok.com/@print.express12?_r=1&_t=ZS-9B4Bt50ZxIu"
            target="_blank"
            rel="noopener noreferrer"
            title="TikTok"
            className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.46 6.27 6.27 0 0 0 1.88-4.48V8.9a8.28 8.28 0 0 0 4.89 1.58V7.07a4.86 4.86 0 0 1-1-.38z" />
            </svg>
          </a>

          {/* YouTube */}
          <a
            href="https://youtube.com/@printexpress1501?si=vr-hHeCnfPWhSCZn"
            target="_blank"
            rel="noopener noreferrer"
            title="YouTube"
            className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-[#FF0000] hover:bg-[#FF0000]/10 transition-all"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-white/[0.06] pt-8 flex flex-col md:flex-row justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-widest gap-4 text-center md:text-left">
        <div dir="ltr">© {currentYear} PRINT EXPRESS | CAIRO, EGYPT</div>
        <div className="text-gray-400 font-black text-sm">
          Designed by <a href="#" className="text-yellow-400 hover:text-yellow-500 transition-colors">APEX</a>
        </div>
        <div className="flex items-center justify-center gap-2 text-yellow-400">
          <CheckCircle2 size={14} /> SMART IP TRACKING ENABLED
        </div>
      </div>
    </footer>
  );
}
