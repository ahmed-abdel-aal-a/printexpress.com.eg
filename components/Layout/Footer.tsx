"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MainLogo } from "@/components/UI/Logo";
import { CheckCircle2 } from "lucide-react";

export default function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith("/print-station")) return null;

  return (
    <footer className="bg-[#111111] border-t border-yellow-500/20 pt-16 pb-24 px-6 md:px-12 mt-12 md:pb-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 mb-8">
        <div className="flex flex-col items-center md:items-start">
          <MainLogo size="sm" />
        </div>

        <div className="flex gap-6 font-bold text-gray-500" dir="ltr">
          <Link href="#" className="hover:text-yellow-400">
            FACEBOOK
          </Link>
          <Link href="#" className="hover:text-yellow-400">
            INSTAGRAM
          </Link>
          <Link href="#" className="hover:text-yellow-400">
            YOUTUBE
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-white/[0.06] pt-8 flex flex-col md:flex-row justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-widest gap-4 text-center md:text-left">
        <div dir="ltr">© 2024 PRINT EXPRESS | CAIRO, EGYPT</div>
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
