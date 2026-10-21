"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Play,
  Star,
  ChevronRight,
  Zap,
  CheckCircle2,
  Heart,
  ShoppingCart,
  Printer,
  Package,
} from "lucide-react";
import { PageTransition, ScrollReveal } from "@/components/UI/Animations";
import { MainLogo, ShopLogo } from "@/components/UI/Logo";
import YouTubeEmbed from "@/components/UI/YouTubeEmbed";
import { useAppContext } from "@/context/AppContext";
import { getProductImageUrl } from "@/lib/utils";
// Mock Data
const HERO_SLIDES = [
  "/images/slide1.png",
  "/images/slide2.png",
  "/images/slide3.png",
  "/images/slide4.png",
  "/images/slide5.png",
  "/images/slide6.png",
  "/images/slide7.png",
  "/images/slide8.png",
  "/images/slide9.png",
  "/images/slide10.png",
];

const HERO_MODES = [
  {
    key: 'print',
    badge: 'خدمات الطباعة',
    BadgeIcon: Printer,
    word1: 'نطبع',
    word2: 'المستحيل',
    description: 'من الفكرة إلى المطبوعة الفاخرة — جودة استثنائية، دقة ألوان لا تُضاهى، ولمسات تشطيب تليق بعلامتك التجارية.',
    ctaText: 'ابدأ مشروعك الآن',
    ctaHref: '/print-station',
    gradient: 'linear-gradient(to left, #c084fc, #fb7185, #F7931E)',
    accentGradient: 'linear-gradient(90deg, #F7931E, #fb7185, #c084fc, #F7931E)',
    orbColor: 'rgba(249, 115, 22, 0.12)',
    features: [
      { Icon: Zap, text: 'تسليم سريع', color: 'text-yellow-400' },
      { Icon: CheckCircle2, text: 'جودة مضمونة ١٠٠٪', color: 'text-emerald-400' },
      { Icon: Star, text: 'أوفسيت • ديجيتال • UV', color: 'text-amber-400' },
    ],
  },
  {
    key: 'shop',
    badge: 'المتجر',
    BadgeIcon: Package,
    word1: 'تسوّق',
    word2: 'الأفضل',
    description: 'أدوات مكتبية، كتب تعليمية، هدايا مميزة — منتجات منتقاة بعناية مع خدمات إضافية حصرية تليق بذوقك.',
    ctaText: 'تصفح المتجر',
    ctaHref: '/shop',
    gradient: 'linear-gradient(to left, #60a5fa, #a78bfa, #f472b6)',
    accentGradient: 'linear-gradient(90deg, #60a5fa, #a78bfa, #f472b6, #60a5fa)',
    orbColor: 'rgba(139, 92, 246, 0.12)',
    features: [
      { Icon: Zap, text: 'شحن سريع', color: 'text-blue-400' },
      { Icon: CheckCircle2, text: 'منتجات أصلية ١٠٠٪', color: 'text-emerald-400' },
      { Icon: Star, text: 'كتب • أدوات • هدايا', color: 'text-purple-400' },
    ],
  },
];

// Framer Motion Variants for staggered mode transitions
const modeContainerVariants = {
  initial: { opacity: 0 },
  enter: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.03 },
  },
  exit: {
    opacity: 1,
    transition: { staggerChildren: 0.02, staggerDirection: -1 as const },
  },
};

const modeItemVariants = {
  initial: { opacity: 0, y: 20 },
  enter: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] as const },
  },
};

// OFFERS removed, now passed from Server Component

export default function HomeClient({ 
  initialProducts = [], 
  initialCategories = [], 
  initialBlogPosts = [],
  offersSection 
}: { 
  initialProducts: any[], 
  initialCategories: any[], 
  initialBlogPosts?: any[],
  offersSection?: React.ReactNode 
}) {
  const prefersReducedMotion = useReducedMotion();
  const { addToCart, addToWishlist, isInWishlist, removeFromWishlist } =
    useAppContext();
    
  // Cinematic Slider State
  const [currentSlide, setCurrentSlide] = useState(0);
  const [preloadIndex, setPreloadIndex] = useState(1);

  // Hero Dual-Mode State (Print ↔ Shop)
  const [heroMode, setHeroMode] = useState(0);
  const mode = HERO_MODES[heroMode];

  // Animation Mutex — prevents GPU contention at LCM(5,12)=60s collision points
  const isAnimatingRef = useRef(false);
  
  // Timer Refs for precise control
  const modeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const slideTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Mode Timer (12s) ───
  const startModeTimer = useCallback(() => {
    // Guard check: Always clear before creating a new one
    if (modeTimerRef.current) clearInterval(modeTimerRef.current);
    modeTimerRef.current = setInterval(() => {
      if (isAnimatingRef.current) return; // document.hidden check removed, handled by visibilitychange
      isAnimatingRef.current = true;
      setHeroMode((prev) => (prev + 1) % HERO_MODES.length);
      setTimeout(() => { isAnimatingRef.current = false; }, 900);
    }, 12000);
  }, []);

  // ─── Slide Timer (5s) ───
  const startSlideTimer = useCallback(() => {
    // Guard check: Always clear before creating a new one
    if (slideTimerRef.current) clearInterval(slideTimerRef.current);
    slideTimerRef.current = setInterval(() => {
      if (isAnimatingRef.current) return; // document.hidden check removed
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
  }, []);

  // ─── Mount Timers & Visibility API ───
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Destroy timers completely to prevent DOM Pile-up and save CPU
        if (modeTimerRef.current) clearInterval(modeTimerRef.current);
        if (slideTimerRef.current) clearInterval(slideTimerRef.current);
        modeTimerRef.current = null;
        slideTimerRef.current = null;
      } else {
        // Re-initialize timers with guard checks inside the start functions
        startModeTimer();
        startSlideTimer();
      }
    };

    // Register event listener
    window.addEventListener("visibilitychange", handleVisibilityChange);

    // Initial start if page is visible
    if (!document.hidden) {
      startModeTimer();
      startSlideTimer();
    }

    return () => {
      // Memory Leak Cleanup
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      if (modeTimerRef.current) clearInterval(modeTimerRef.current);
      if (slideTimerRef.current) clearInterval(slideTimerRef.current);
    };
  }, [startModeTimer, startSlideTimer]);

  // ─── Manual Mode Switch Handler ───
  const switchMode = (index: number) => {
    if (isAnimatingRef.current || index === heroMode) return;
    isAnimatingRef.current = true;
    setHeroMode(index);
    setTimeout(() => { isAnimatingRef.current = false; }, 900);
    
    // Reset timer immediately on manual switch so it doesn't hang!
    startModeTimer();
  };

  // Smart Network Timing (Preload AFTER animation)
  useEffect(() => {
    const preloadTimer = setTimeout(() => {
      setPreloadIndex((currentSlide + 1) % HERO_SLIDES.length);
    }, 2000); // Wait 2s for GPU animation to settle
    return () => clearTimeout(preloadTimer);
  }, [currentSlide]);

  const recommendedProducts = initialProducts.slice(0, 4);
  const categories = initialCategories;

  return (
    <PageTransition>
      {/* ═══════════════════════════════════════════════════════════════
           FULL-SCREEN CINEMATIC HERO — Nike / Apple Style
           ═══════════════════════════════════════════════════════════════ */}
      {/* ═══════════════════════════════════════════════════════════════
           FULL-SCREEN CINEMATIC HERO — Nike / Apple Style
           ═══════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[100dvh] w-full overflow-hidden bg-[#0a0a0a] flex flex-col md:flex-row">
        
        {/* Cinematic Multi-Image Slider (Top on Mobile, Left on Desktop in RTL) */}
        {/* Using flex-1 instead of explicit percentages prevents any 1px gaps without needing borders */}
        <div className="w-full h-[55vh] md:h-[100dvh] flex-1 relative order-1 md:order-2 overflow-hidden">
          <AnimatePresence initial={false}>
            <motion.div
              key={currentSlide}
              className="absolute inset-0 w-full h-full"
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 1.05 }}
              animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0 }}
              transition={{
                duration: 1.2,
                ease: [0.25, 1, 0.5, 1], // Smoother cinematic crossfade instead of aggressive whip-pan
              }}
            >
              <motion.div
                className="w-full h-full relative"
                animate={prefersReducedMotion ? {} : {
                  scale: [1.0, 1.05], // Cinematic drift
                }}
                transition={{
                  duration: 6,
                  ease: [0.25, 1, 0.5, 1],
                }}
                style={{
                  willChange: "transform",
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                }}
              >
                <Image
                  src={HERO_SLIDES[currentSlide]}
                  alt="Print Express - مطبوعات فاخرة"
                  fill
                  priority={currentSlide === 0}
                  loading={currentSlide === 0 ? "eager" : "lazy"}
                  sizes="(max-width: 768px) 100vw, 55vw"
                  className="object-cover object-center"
                />
              </motion.div>
            </motion.div>
          </AnimatePresence>

          {/* 2. The Smart Preloader */}
          <div className="absolute inset-0 opacity-0 pointer-events-none z-[-1]" aria-hidden="true">
            <Image 
              src={HERO_SLIDES[preloadIndex]} 
              alt="" 
              fill 
              sizes="(max-width: 768px) 100vw, 55vw"
              className="object-cover object-center" 
            />
          </div>

          {/* Fade Gradients to blend image into the solid background */}
          {/* Mobile: Fades the bottom edge */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent md:hidden" />
          {/* Desktop: Fades the right edge (in RTL, the image is on the left, so its right edge touches the text) */}
          <div className="hidden md:block absolute inset-0 bg-gradient-to-l from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent w-[30%] right-0" />
        </div>

        {/* Content — Bottom on Mobile, Right on Desktop in RTL */}
        <div className="w-full md:w-[45%] flex flex-col items-center justify-end md:justify-center px-6 md:px-12 lg:px-20 relative z-10 order-2 md:order-1 mt-[-10vh] pb-12 md:mt-0 md:pb-0 h-[45vh] md:h-[100dvh]">

          {/* ── Continuous Animation: Background Gradient Orb ── */}
          <motion.div
            className="absolute w-[300px] h-[300px] md:w-[400px] md:h-[400px] rounded-full pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${mode.orbColor} 0%, transparent 70%)`,
              willChange: "transform",
            }}
            animate={{
              x: heroMode === 0 ? -60 : 60,
              y: heroMode === 0 ? 40 : -40,
              scale: [1, 1.15, 1],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              x: { duration: 1.5, ease: [0.25, 1, 0.5, 1] },
              y: { duration: 1.5, ease: [0.25, 1, 0.5, 1] },
              scale: { duration: 4, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' },
              opacity: { duration: 4, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' },
            }}
          />

          {/* ── Continuous Animation: Floating Particles ── */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
            {[
              { size: 6, top: '15%', left: '8%', dur: '14s', delay: '0s' },
              { size: 4, top: '75%', left: '85%', dur: '18s', delay: '-4s' },
              { size: 8, top: '35%', left: '70%', dur: '16s', delay: '-8s' },
              { size: 5, top: '88%', left: '20%', dur: '20s', delay: '-2s' },
              { size: 7, top: '45%', left: '92%', dur: '15s', delay: '-6s' },
              { size: 4, top: '10%', left: '50%', dur: '17s', delay: '-10s' },
              { size: 6, top: '65%', left: '35%', dur: '19s', delay: '-3s' },
              { size: 5, top: '25%', left: '25%', dur: '15s', delay: '-7s' },
              { size: 7, top: '80%', left: '60%', dur: '21s', delay: '-1s' },
              { size: 4, top: '55%', left: '15%', dur: '18s', delay: '-9s' },
              { size: 9, top: '20%', left: '85%', dur: '16s', delay: '-12s' },
              { size: 5, top: '92%', left: '45%', dur: '14s', delay: '-5s' },
              { size: 6, top: '40%', left: '5%', dur: '20s', delay: '-11s' },
              { size: 4, top: '5%', left: '75%', dur: '17s', delay: '-14s' },
              { size: 8, top: '68%', left: '10%', dur: '19s', delay: '-15s' },
            ].map((p, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full transition-colors duration-1000"
                style={{
                  width: p.size,
                  height: p.size,
                  top: p.top,
                  left: p.left,
                  animation: `heroFloat${i % 3} ${p.dur} ease-in-out ${p.delay} infinite`,
                  backgroundColor: heroMode === 0 ? '#F7931E' : '#60a5fa',
                  boxShadow: heroMode === 0 ? `0 0 ${p.size * 2}px rgba(247, 147, 30, 0.4)` : `0 0 ${p.size * 2}px rgba(96, 165, 250, 0.4)`,
                  willChange: "transform, opacity",
                }}
                animate={{
                  opacity: [0.4, 0.9, 0.4],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  opacity: { duration: 3, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' },
                  scale: { duration: 4, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' },
                }}
              />
            ))}
          </div>
          {/* ── Initial Page-Load Wrapper (runs once) ── */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="text-center md:text-start max-w-2xl relative w-full"
          >

            {/* ── Manual Mode Tabs ── */}
            <div className="flex justify-center md:justify-start gap-2 mb-5 md:mb-6">
              {HERO_MODES.map((m, i) => (
                <button
                  key={m.key}
                  onClick={() => switchMode(i)}
                  className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest transition-all duration-300 border ${
                    heroMode === i
                      ? 'bg-white/10 backdrop-blur-sm border-white/20 text-white shadow-lg'
                      : 'bg-transparent border-white/5 text-gray-500 hover:text-gray-300 hover:border-white/10'
                  }`}
                >
                  {heroMode === i && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
                    </span>
                  )}
                  <m.BadgeIcon size={13} />
                  {m.badge}
                </button>
              ))}
            </div>

            {/* ── Mode Switch: AnimatePresence ── */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={mode.key}
                variants={modeContainerVariants}
                initial="initial"
                animate="enter"
                exit="exit"
                aria-live="polite"
              >


                {/* 2. H1 Headline */}
                <motion.h1 variants={modeItemVariants} className="text-[3rem] sm:text-[3.5rem] md:text-[4.5rem] lg:text-[6rem] leading-[1.1] tracking-tight mb-4 flex flex-col sm:flex-row sm:flex-wrap items-center md:items-start justify-center md:justify-start gap-2 sm:gap-4 md:gap-x-6">
                  <span className="text-white drop-shadow-lg" style={{ fontFamily: '"Marhey", sans-serif' }}>
                    {mode.word1}
                  </span>
                  <span
                    className="italic drop-shadow-xl py-2 bg-clip-text"
                    style={{
                      fontFamily: '"Lalezar", sans-serif',
                      backgroundImage: mode.gradient,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {mode.word2}
                  </span>
                </motion.h1>

                {/* 3. Animated Accent Line (Continuous Shimmer) */}
                <motion.div variants={modeItemVariants} className="flex justify-center md:justify-start mb-6 md:mb-8">
                  <div className="h-[3px] w-20 md:w-28 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full w-[200%]"
                      animate={{ x: ['0%', '-50%'] }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        repeatType: 'loop',
                        ease: 'linear',
                      }}
                      style={{
                        background: mode.accentGradient,
                        transition: 'background 1s ease',
                      }}
                    />
                  </div>
                </motion.div>

                {/* 4. Description */}
                <motion.p variants={modeItemVariants} className="text-base md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed font-medium mb-10 md:mb-12">
                  {mode.description}
                </motion.p>

                {/* 5. CTA Button */}
                <motion.div variants={modeItemVariants} className="flex justify-center mb-12 md:mb-14">
                  <Link
                    href={mode.ctaHref}
                    className="group relative inline-flex items-center gap-3 px-10 py-4 bg-yellow-400 text-black font-black text-lg rounded-full overflow-hidden transition-all duration-300 hover:bg-yellow-300 hover:shadow-[0_0_60px_rgba(250,204,21,0.4)] hover:scale-[1.04] active:scale-[0.97]"
                  >
                    <span className="flex items-center gap-2">
                      {mode.ctaText}
                      <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform duration-300" />
                    </span>
                  </Link>
                </motion.div>

                {/* 6. Features Line */}
                <motion.div variants={modeItemVariants} className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] md:text-sm text-gray-400 font-medium">
                  {mode.features.map((feature, i) => (
                    <React.Fragment key={feature.text}>
                      <span className="flex items-center gap-1.5">
                        <feature.Icon size={14} className={feature.color} />
                        {feature.text}
                      </span>
                      {i < mode.features.length - 1 && (
                        <span className="w-1 h-1 rounded-full bg-gray-600 hidden md:block" />
                      )}
                    </React.Fragment>
                  ))}
                </motion.div>

              </motion.div>
            </AnimatePresence>

          </motion.div>

        </div>

        {/* Seamless edge to next section — no white border */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-[#0a0a0a] z-20 pointer-events-none" />
      </section>

      {/* OFFERS SECTION - Rendered from Server */}
      {offersSection}

      {/* SERVICES SPLIT */}
      <section className="py-12 px-6 md:px-12 w-full max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Shop Express */}
          <ScrollReveal direction="right" className="w-full h-full">
            <Link
              href="/shop"
              className="bg-yellow-400 w-full rounded-[2.5rem] p-10 md:p-14 shadow-lg flex flex-col justify-between relative overflow-hidden group min-h-[400px]"
            >
              <div className="absolute -right-12 -bottom-12 w-64 h-64 border-[16px] border-white/20 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
              <div className="z-10 relative">
                <span className="inline-block px-4 py-1.5 bg-white text-yellow-900 text-xs font-bold rounded-full uppercase tracking-widest mb-6 border border-yellow-200">
                  تسوق الآن
                </span>
                <div className="mb-4">
                  <ShopLogo size="md" />
                </div>
                <p className="text-lg font-medium text-yellow-900 max-w-sm">
                  تصفح مجموعتنا الواسعة من المنتجات الجاهزة والمميزة. كل ما
                  تحتاجه في مكان واحد.
                </p>
              </div>
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-inner group-hover:rotate-12 transition-transform self-end z-10 relative mt-8">
                <ArrowLeft className="w-8 h-8 text-gray-900" />
              </div>
            </Link>
          </ScrollReveal>

          {/* Print Station */}
          <ScrollReveal direction="left" delay={0.2} className="w-full h-full">
            <Link href="/print-station" className="bg-[#111111] w-full rounded-[2.5rem] p-10 md:p-14 shadow-lg shadow-black/40 flex flex-col justify-between relative border border-white/[0.08] hover:border-yellow-500/30 group min-h-[400px] overflow-hidden block">
              <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-yellow-400/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <div className="z-10 relative">
                <span className="inline-block px-4 py-1.5 bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 text-xs font-bold rounded-full uppercase tracking-widest mb-6">
                  جديد
                </span>
                <h3
                  className="text-5xl font-serif font-black italic text-white mb-4"
                  dir="ltr"
                >
                  Print Station
                </h3>
                <p className="text-lg text-gray-400 max-w-sm font-medium">
                  منصة الطباعة المخصصة. اختر مواصفاتك بدقة وأرسل طلبك للتنفيذ بأعلى جودة.
                </p>
              </div>
              <div className="w-16 h-16 bg-[#222222] group-hover:bg-yellow-400 rounded-full flex items-center justify-center self-end z-10 relative mt-8 transition-colors">
                <ArrowLeft className="w-8 h-8 text-white group-hover:text-black" />
              </div>
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* RECOMMENDED PRODUCTS */}
      <section className="py-16 px-6 md:px-12 w-full bg-[#0a0a0a]">
        <div className="max-w-7xl w-full mx-auto">
          <ScrollReveal>
            <div className="flex justify-between items-end mb-10">
              <div>
                <h2 className="text-3xl font-black text-white">
                  موصى به لك
                </h2>
                <div className="w-16 h-1 bg-yellow-400 rounded-full mt-3" />
                <p className="text-gray-500 mt-2 font-medium">
                  بناءً على تصفحك الأخير (Smart IP System)
                </p>
              </div>
              <Link
                href="/shop"
                className="hidden md:flex items-center gap-2 font-bold text-yellow-400 hover:text-yellow-500"
              >
                عرض الكل <ArrowLeft size={20} />
              </Link>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {recommendedProducts.map((product, index) => (
              <ScrollReveal
                key={product.id}
                delay={index * 0.1}
                className="w-full h-full"
              >
                <div className="group relative w-full h-full bg-[#111111] rounded-3xl p-4 transition-all hover:shadow-xl hover:shadow-black/50 border border-transparent hover:border-yellow-500/20 flex flex-col justify-between">
                  <div className="relative aspect-square w-full bg-[#1a1a1a] rounded-2xl mb-4 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getProductImageUrl(product)}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        isInWishlist(product.id)
                          ? removeFromWishlist(product.id)
                          : addToWishlist(product);
                      }}
                      className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md shadow-sm shadow-black/30 transition-colors ${
                        isInWishlist(product.id)
                          ? "bg-red-500/10 text-red-500"
                          : "bg-white/10 text-gray-500 hover:text-red-500"
                      }`}
                    >
                      <Heart
                        size={18}
                        fill={
                          isInWishlist(product.id) ? "currentColor" : "none"
                        }
                      />
                    </button>

                    <div className="absolute inset-0 bg-white/5 group-hover:bg-transparent transition-colors pointer-events-none"></div>
                  </div>

                  <div className="text-right flex flex-col flex-grow">
                    <span className="text-xs font-bold text-gray-500 mb-1 block uppercase tracking-widest">
                      التصنيف: {categories.find(c => c.id === product.category_id)?.name || product.category_id}
                    </span>
                    <Link href={`/product/${product.slug || product.id}`} className="flex-grow">
                      <h3 className="font-bold text-white mb-2 group-hover:text-yellow-400 transition-colors line-clamp-1">
                        {product.name}
                      </h3>
                    </Link>
                    <div className="flex justify-between items-end mt-2">
                      <div className="font-black text-lg text-white">
                        {(product.discount_price ?? product.price)?.toFixed(2)} ج.م
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          addToCart(product);
                        }}
                        className="w-10 h-10 bg-yellow-400 text-gray-900 rounded-full flex items-center justify-center hover:bg-yellow-500 hover:text-black transition-colors shadow-sm shadow-black/30"
                      >
                        <ShoppingCart size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT US (Creative Animation) */}
      <section className="py-24 px-6 md:px-12 bg-gray-900 text-white relative overflow-hidden">
        {/* Animated Background Elements */}
        <div
          className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none text-[15rem] leading-none font-black tracking-tighter"
          dir="ltr"
        >
          ABOUT
        </div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[100%] bg-yellow-400 rounded-full blur-[120px] opacity-20 animate-pulse"></div>

        <div className="max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row items-center gap-16">
          <ScrollReveal direction="right" className="flex-none relative group">
            <div className="flex-none relative group">
              <div className="w-48 h-48 md:w-64 md:h-64 border-2 border-dashed border-yellow-400 rounded-full flex items-center justify-center text-4xl md:text-5xl font-serif italic text-yellow-400 animate-[spin_15s_linear_infinite] group-hover:border-solid transition-all"></div>
              <div className="absolute inset-0 flex items-center justify-center text-center">
                <div>
                  <div
                    className="text-sm tracking-widest text-gray-400 uppercase font-bold"
                    dir="ltr"
                  >
                    Since
                  </div>
                  <div className="text-5xl font-black" dir="ltr">
                    2010
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal
            direction="left"
            className="flex-1 text-center md:text-right"
          >
            <div className="flex-1 text-center md:text-right">
              <span className="inline-block px-3 py-1 bg-white/10 text-yellow-400 text-xs font-bold rounded-full uppercase tracking-widest mb-6 border border-yellow-400/30">
                من نحن
              </span>
              <h2 className="text-4xl md:text-6xl font-black mb-6">
                تأسسنا لنبدع.
              </h2>
              <p className="text-xl text-gray-400 leading-relaxed max-w-2xl font-medium">
                أكثر من ١٠ سنوات من الخبرة في تقديم المحتوى الثقافي وخدمات
                الطباعة المتميزة. نحن لسنا مجرد مكتبة، نحن شركاء نجاحكم في كل
                صفحة تقرأونها وكل تصميم تطبعونه.
                <span className="text-yellow-400">
                  {" "}
                  نظامنا الذكي يقترح لك الأنسب بناءً على اهتماماتك.
                </span>
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* BLOG / ARTICLES SECTION */}
      <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-black text-white">
                المدونة والمقالات
              </h2>
              <div className="w-16 h-1 bg-yellow-400 rounded-full mt-3" />
              <p className="text-gray-400 mt-2 font-medium">
                أحدث المقالات، أسرار الطباعة الرقمية، وإرشادات التصميم الاحترافي
              </p>
            </div>
            <Link
              href="/blog"
              className="hidden md:flex items-center gap-2 font-bold text-yellow-400 hover:text-yellow-500 transition-colors"
            >
              تصفح كل المقالات <ArrowLeft size={20} />
            </Link>
          </div>
        </ScrollReveal>

        {initialBlogPosts && initialBlogPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {initialBlogPosts.slice(0, 3).map((post: any) => (
              <div
                key={post.id}
                className="w-full h-full flex flex-col bg-[#111111]/80 rounded-3xl p-5 border border-yellow-500/10 hover:border-yellow-500/30 transition-all hover:-translate-y-1"
              >
                {post.video ? (
                  <YouTubeEmbed
                    src={post.video}
                    className="relative w-full aspect-video bg-gray-900 rounded-2xl mb-5 shadow-lg shadow-black/40 border border-yellow-500/15 overflow-hidden"
                  />
                ) : post.featured_image ? (
                  <div className="relative w-full aspect-video bg-gray-900 rounded-2xl mb-5 shadow-lg shadow-black/40 border border-yellow-500/15 overflow-hidden">
                    <Image
                      src={post.featured_image}
                      alt={post.title}
                      fill
                      className="object-cover transition-transform duration-500 hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                ) : (
                  <div className="relative w-full aspect-video bg-gradient-to-br from-yellow-500/15 via-[#181818] to-[#0e0e0e] rounded-2xl mb-5 shadow-lg shadow-black/40 border border-yellow-500/15 flex flex-col items-center justify-center p-6 text-center">
                    <Printer className="text-yellow-400/60 w-10 h-10 mb-2" />
                    <span className="text-xs font-bold text-gray-400 tracking-wider">برنت إكسبريس</span>
                  </div>
                )}

                <div className="flex flex-col flex-grow">
                  <span className="text-xs font-bold text-yellow-400 mb-2 block uppercase tracking-widest">
                    {post.category || "مقالات عامة"}
                  </span>
                  <Link href={`/blog/${post.slug || post.id}`}>
                    <h3 className="text-xl font-bold text-white mb-2 hover:text-yellow-400 transition-colors line-clamp-2 leading-snug">
                      {post.title}
                    </h3>
                  </Link>
                  <p className="text-gray-400 text-sm line-clamp-2 leading-relaxed mb-6 font-normal">
                    {post.meta_description || "اقرأ المزيد عن هذا المقال وتعرف على تفاصيله ونقاطه الرئيسية."}
                  </p>
                  <Link
                    href={`/blog/${post.slug || post.id}`}
                    className="mt-auto flex items-center gap-2 font-bold text-yellow-400 hover:text-yellow-300 transition-colors text-sm"
                  >
                    اقرأ المقال بالكامل <ArrowLeft size={16} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#111111]/60 border border-yellow-500/10 rounded-3xl p-10 text-center">
            <Printer className="w-12 h-12 text-yellow-400/40 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-white mb-2">مقالات جديدة ومميزة قيد الإعداد</h3>
            <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
              تابعنا باستمرار للاطلاع على أفضل نصائح الطباعة الرقمية وتجهيز الملفات والتصميم.
            </p>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold bg-yellow-400 text-black hover:bg-yellow-300 transition-colors text-sm"
            >
              زيارة قسم المدونة <ArrowLeft size={16} />
            </Link>
          </div>
        )}
      </section>

    </PageTransition>
  );
}
