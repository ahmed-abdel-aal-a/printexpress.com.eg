"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingCart, Heart, Search, User, Menu, X } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { usePathname, useRouter } from "next/navigation";
import { MainLogo } from "../UI/Logo";
import { ConfirmModal } from "../UI/ConfirmModal";
import { motion, AnimatePresence } from "framer-motion";
import SearchOverlay from "./SearchOverlay";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { cart, setIsCartOpen } = useAppContext();

  const isPrintStation = pathname?.startsWith("/print-station");
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<{ path: string, onNavigate?: () => void } | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, path: string, onNavigate?: () => void) => {
    if (typeof window !== 'undefined' && (window as any).__hasUnsavedPrintConfig) {
      e.preventDefault();
      setPendingNavigation({ path, onNavigate });
      setIsConfirmModalOpen(true);
    } else {
      if (onNavigate) onNavigate();
    }
  };

  return (
    <>
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-4 md:px-8 items-center justify-between ${
          isScrolled
            ? "h-16 bg-[#0a0a0a]/95 backdrop-blur-md shadow-lg border-b border-white/[0.06]"
            : "h-20 bg-transparent border-b border-transparent"
        } ${isPrintStation ? "hidden md:flex" : "flex"}`}
      >
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center" onClick={(e) => handleNavigation(e, "/")}>
            <MainLogo size="sm" />
          </Link>
        </div>

        {/* Desktop Nav */}
        <nav className={`hidden md:flex gap-8 font-bold text-sm uppercase tracking-widest transition-colors duration-500 ${isScrolled ? "text-gray-300" : "text-white/90"}`}>
          <Link href="/" className="hover:text-yellow-400 transition-colors" onClick={(e) => handleNavigation(e, "/")}>
            الرئيسية
          </Link>
          <Link
            href="/shop"
            className="hover:text-yellow-400 transition-colors"
            onClick={(e) => handleNavigation(e, "/shop")}
          >
            المتجر
          </Link>
          <Link
            href="/print-station"
            className="text-yellow-400 hover:text-yellow-300 transition-colors flex items-center gap-2"
            onClick={(e) => handleNavigation(e, "/print-station")}
          >
            الطباعة
          </Link>
          <Link href="/blog" className="hover:text-yellow-400 transition-colors" onClick={(e) => handleNavigation(e, "/blog")}>
            المدونة
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <div className={`hidden md:flex gap-4 transition-colors duration-500 ${isScrolled ? "text-gray-300" : "text-white/90"}`}>
            <button 
              onClick={() => setIsSearchOpen(true)} 
              className="hover:text-yellow-400 transition-colors"
            >
              <Search size={20} />
            </button>
            <Link
              href="/account"
              className="hover:text-yellow-400 transition-colors"
              onClick={(e) => handleNavigation(e, "/account")}
            >
              <User size={20} />
            </Link>
            <Link
              href="/account?tab=wishlist"
              className="hover:text-yellow-400 transition-colors"
            >
              <Heart size={20} />
            </Link>
          </div>

          <button
            onClick={() => setIsSearchOpen(true)}
            className={`md:hidden flex items-center justify-center transition-colors duration-500 hover:text-yellow-400 ${isScrolled ? "text-white" : "text-white"}`}
          >
            <Search size={22} />
          </button>

          <button
            onClick={() => setIsCartOpen(true)}
            className={`flex items-center gap-2 px-4 py-2 font-bold rounded-full text-sm transition-all duration-500 ${isScrolled ? "bg-yellow-400 shadow-md border-b-2 border-yellow-600 hover:bg-yellow-300 text-black" : "bg-white/15 backdrop-blur-md border border-white/20 text-white hover:bg-white/25"}`}
          >
            <span dir="ltr">({totalItems})</span>
            <ShoppingCart size={18} />
          </button>

          <button
            className={`md:hidden relative w-6 h-6 flex items-center justify-center z-[70] transition-colors duration-500 ${isScrolled ? "text-white" : "text-white"}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <motion.div
              animate={mobileMenuOpen ? "open" : "closed"}
              className="w-full h-full flex flex-col justify-between py-1"
            >
              <motion.span
                variants={{
                  closed: { rotate: 0, y: 0 },
                  open: { rotate: 45, y: 6 },
                }}
                className="w-full h-0.5 bg-current transform origin-center transition-all"
              ></motion.span>
              <motion.span
                variants={{
                  closed: { opacity: 1 },
                  open: { opacity: 0 },
                }}
                className="w-full h-0.5 bg-current transition-all"
              ></motion.span>
              <motion.span
                variants={{
                  closed: { rotate: 0, y: 0 },
                  open: { rotate: -45, y: -6 },
                }}
                className="w-full h-0.5 bg-current transform origin-center transition-all"
              ></motion.span>
            </motion.div>
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-[60] md:hidden"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-3/4 max-w-sm bg-[#111111] p-6 pt-24 shadow-2xl flex flex-col z-[65] md:hidden"
            >
              <nav className="flex flex-col gap-6 font-bold text-lg text-gray-300">
                {[
                  { name: "الرئيسية", path: "/" },
                  { name: "المتجر", path: "/shop" },
                  { name: "الطباعة", path: "/print-station" },
                  { name: "المدونة", path: "/blog" },
                ].map((item, i) => (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.1 }}
                  >
                    <Link
                      href={item.path}
                      onClick={(e) => handleNavigation(e, item.path, () => setMobileMenuOpen(false))}
                      className="block hover:text-yellow-400 transition-colors"
                    >
                      {item.name}
                    </Link>
                  </motion.div>
                ))}
                <hr className="border-yellow-500/20 my-2" />
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Link
                    href="/account"
                    onClick={(e) => handleNavigation(e, "/account", () => setMobileMenuOpen(false))}
                    className="flex items-center gap-2 hover:text-yellow-400 transition-colors"
                  >
                    <User size={20} /> حسابي
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <Link
                    href="/account?tab=wishlist"
                    onClick={(e) => handleNavigation(e, "/account?tab=wishlist", () => setMobileMenuOpen(false))}
                    className="flex items-center gap-2 hover:text-yellow-400 transition-colors"
                  >
                    <Heart size={20} /> المفضلة
                  </Link>
                </motion.div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        message="لديك طلب لم يكتمل. ستفقد اختياراتك. هل أنت متأكد من المغادرة؟"
        onConfirm={() => {
          (window as any).__hasUnsavedPrintConfig = false;
          setIsConfirmModalOpen(false);
          if (pendingNavigation?.onNavigate) pendingNavigation.onNavigate();
          if (pendingNavigation?.path) router.push(pendingNavigation.path);
          setPendingNavigation(null);
        }}
        onCancel={() => {
          setIsConfirmModalOpen(false);
          setPendingNavigation(null);
        }}
      />
    </>
  );
}
