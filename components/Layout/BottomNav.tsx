"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Home, Store, Search, Heart, User, MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { motion, AnimatePresence } from "framer-motion";

import { fetchChatSettings, formatWhatsAppUrl } from "@/services/chatService";

export default function BottomNav() {
  const pathname = usePathname();
  const { setIsChatOpen } = useAppContext();
  const [showContactMenu, setShowContactMenu] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("01000000000");
  const [whatsappMsg, setWhatsappMsg] = useState("");

  useEffect(() => {
    fetchChatSettings().then((s) => {
      if (s?.whatsappNumber) setWhatsappNumber(s.whatsappNumber);
      if (s?.whatsappDefaultMessage) setWhatsappMsg(s.whatsappDefaultMessage);
    });
  }, []);

  const navItems = [
    { icon: Store, label: "المتجر", href: "/shop" },
    { icon: Home, label: "الرئيسية", href: "/" },
    { icon: Heart, label: "المفضلة", href: "/account?tab=wishlist" },
    { icon: User, label: "حسابي", href: "/account" },
    { icon: MessageCircle, label: "تواصل معنا", href: "#contact" },
  ];

  const WhatsAppIcon = () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm.029 18.88c-1.161 0-2.305-.292-3.318-.844l-3.677.964.984-3.595c-.607-1.052-.927-2.246-.926-3.468.001-3.825 3.113-6.937 6.937-6.937 3.825 0 6.938 3.112 6.938 6.937 0 3.824-3.113 6.938-6.938 6.938z" />
    </svg>
  );

  const dynamicWhatsAppLink = formatWhatsAppUrl(whatsappNumber, whatsappMsg);

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#111111] border-t border-yellow-500/20 z-[60] pb-safe">
      <div className="flex justify-around items-center h-16 relative">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          if (item.href === "#contact") {
            return (
              <div key={item.href} className="flex flex-col items-center justify-center w-full h-full space-y-1 relative">
                <button
                  onClick={() => setShowContactMenu(!showContactMenu)}
                  className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                    showContactMenu ? "text-yellow-400" : "text-gray-500 hover:text-white"
                  }`}
                >
                  <div className="relative">
                    <Icon size={20} className={showContactMenu ? "text-yellow-400" : ""} />
                  </div>
                  <span className="text-[10px] font-bold">{item.label}</span>
                </button>

                <AnimatePresence>
                  {showContactMenu && (
                    <>
                      <div 
                        className="fixed inset-0 z-[-1]" 
                        onClick={() => setShowContactMenu(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute bottom-[110%] left-1/2 -translate-x-1/2 bg-[#1a1a1a] border border-white/10 rounded-2xl p-2 flex flex-col gap-2 min-w-[140px] shadow-2xl shadow-black"
                      >
                        <a
                          href={dynamicWhatsAppLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setShowContactMenu(false)}
                          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors"
                        >
                          <WhatsAppIcon />
                          <span className="text-sm font-bold">واتساب</span>
                        </a>
                        <button
                          onClick={() => {
                            setShowContactMenu(false);
                            setIsChatOpen(true);
                          }}
                          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl bg-yellow-400/10 text-yellow-400 hover:bg-yellow-400/20 transition-colors"
                        >
                          <MessageCircle size={20} />
                          <span className="text-sm font-bold">المحادثة</span>
                        </button>
                        
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#1a1a1a] border-b border-r border-white/10 rotate-45" />
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                isActive
                  ? "text-yellow-400"
                  : "text-gray-500 hover:text-white"
              }`}
            >
              <div
                className={`relative ${isActive && item.href === "/" ? "-top-5 bg-yellow-400 p-3 rounded-full shadow-lg border-2 border-yellow-400/30" : ""}`}
              >
                <Icon
                  size={isActive && item.href === "/" ? 24 : 20}
                  className={
                    isActive && item.href === "/" ? "text-white" : ""
                  }
                />
              </div>
              <span
                className={`text-[10px] font-bold ${isActive && item.href === "/" ? "hidden" : ""}`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
