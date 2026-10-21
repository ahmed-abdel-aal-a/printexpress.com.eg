"use client";

import React, { useState, useEffect } from "react";
import { PageTransition } from "@/components/UI/Animations";
import { usePrintConfig } from "../../hooks/usePrintConfig";
import { 
  Printer, 
  CheckCircle, 
  ArrowLeft, 
  ArrowRight, 
  ChevronUp, 
  AlertCircle, 
  Loader2,
  XIcon,
  Briefcase,
  Megaphone,
  RectangleHorizontal,
  Tag,
  BookOpen,
  Shirt,
  Gift,
  PartyPopper,
  UtensilsCrossed,
  Image as ImageIcon,
  Paintbrush,
  Layers,
  FileText,
  Package,
  Box,
  Sparkles,
  Palette,
  Scissors,
  LucideIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DynamicOptions } from "./components/DynamicOptions";
import { FinishingOptions } from "./components/FinishingOptions";
import { CategorizedUploader } from "./components/CategorizedUploader";
import { useQuery } from "@tanstack/react-query";
import { checkFileStatus, getPrintingProductTypes, getPrintingTypeDetails, addPrintJobToCart } from "../../services/api/printingApi";
import { ConfirmModal } from "@/components/UI/ConfirmModal";
import Image from 'next/image';
import { useAppContext } from "@/context/AppContext";
import toast from 'react-hot-toast';

const STATIC_ICON_MAP: Record<string, LucideIcon> = {
  briefcase: Briefcase,
  megaphone: Megaphone,
  rectanglehorizontal: RectangleHorizontal,
  tag: Tag,
  bookopen: BookOpen,
  shirt: Shirt,
  gift: Gift,
  partypopper: PartyPopper,
  utensilscrossed: UtensilsCrossed,
  image: ImageIcon,
  paintbrush: Paintbrush,
  printer: Printer,
  layers: Layers,
  filetext: FileText,
  package: Package,
  box: Box,
  sparkles: Sparkles,
  palette: Palette,
  scissors: Scissors,
};

const getStaticIcon = (iconName: string | null) => {
  if (iconName) {
    const key = iconName.toLowerCase().replace(/[-_\s]/g, '');
    if (STATIC_ICON_MAP[key]) {
      return STATIC_ICON_MAP[key];
    }
  }
  return Printer;
};

export default function PrintStation() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [fileStatus, setFileStatus] = useState<string | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const { setIsCartOpen, refreshCart, sessionId } = useAppContext();
  
  const { 
    config, 
    updateMainCategory, 
    updatePrintingType,
    updateConfig, 
    updateOption,
    removeOption,
    updateDimensions,
    updateQuantity,
    currentStep,
    setCurrentStep,
    nextStep,
    prevStep,
    isCalculating,
    pricingDetails,
    resetConfig,
  } = usePrintConfig();

  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    if (currentStep < 2) {
      setIsDrawerOpen(false);
    }
  }, [currentStep]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        setIsDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen]);

  useEffect(() => {
    const handleFocusIn = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        const type = (target as HTMLInputElement).type;
        if (type !== 'radio' && type !== 'checkbox' && type !== 'file') {
          setIsKeyboardOpen(true);
        }
      }
    };
    const handleFocusOut = () => {
      setIsKeyboardOpen(false);
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  const shouldShowBottomBox = currentStep >= 2 && !isKeyboardOpen;

  const isStepValid = () => {
    return true;
  };

  // Sync state for navigation interception
  useEffect(() => {
    const hasUnsaved = currentStep > 1;
    (window as any).__hasUnsavedPrintConfig = hasUnsaved;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if ((window as any).__hasUnsavedPrintConfig) {
        e.preventDefault();
        e.returnValue = "لديك طلب لم يكتمل. ستفقد اختياراتك. هل أنت متأكد من المغادرة؟";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [currentStep]);

  const handleChangeCategory = () => {
    if (currentStep > 1) {
      setIsConfirmModalOpen(true);
    } else {
      resetConfig();
    }
  };

  // 1. Fetch Product Types (Main Categories)
  const { data: productTypes, isLoading: loadingProductTypes, error } = useQuery({
    queryKey: ['printingProductTypes'],
    queryFn: getPrintingProductTypes,
  });

  // 2. Fetch Selected Printing Type Details (Attributes, Rules, etc.)
  const { data: activePrintingType, isLoading: loadingPrintingType } = useQuery({
    queryKey: ['printingType', config.printingTypeId],
    queryFn: () => getPrintingTypeDetails(config.printingTypeId!),
    enabled: !!config.printingTypeId,
  });

  const handleCategorySelect = (productType: any) => {
    updateMainCategory(productType.id);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const preparePayload = () => {
    const formattedOptions = Object.values(config.selectedOptions).map(opt => ({
      value_id: opt.value_id,
      multiplier_value: opt.multiplier_value
    }));

    const tempFileIds = Object.values(config.uploadedFiles)
      .filter((file: any) => file && file.file_id)
      .map((file: any) => file.file_id);

    return {
      printing_type_id: config.printingTypeId!,
      quantity: config.quantity,
      selected_options: formattedOptions,
      width_mm: config.width_mm,
      length_mm: config.length_mm,
      image_count: config.image_count,
      notes: config.notes,
      temp_file_ids: tempFileIds,
      session_id: sessionId,
    };
  };

  const handleAddToCart = async () => {
    if (!isStepValid() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const payload = preparePayload();
      const res = await addPrintJobToCart(payload);
      // Success
      await refreshCart();
      toast.success('تم إضافة الطلب إلى السلة بنجاح! 🎉');
      resetConfig();
      setIsCartOpen(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'حدث خطأ أثناء إضافة الطلب.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckout = async () => {
    if (!isStepValid() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const payload = preparePayload();
      const res = await addPrintJobToCart(payload);
      toast.success('جاري توجيهك لصفحة الدفع... 🚀');
      window.location.href = '/checkout';
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'حدث خطأ أثناء إتمام الطلب.');
      setIsSubmitting(false);
    }
  };

  const canProceedToPayment = fileStatus !== 'processing' && !isSubmitting;

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#0a0a0a] pt-6 md:pt-28 pb-[200px] md:pb-12 text-white flex flex-col md:flex-row relative">
        
        {/* Main Content Area (Form / Steps) */}
        <div className="flex-1 px-4 md:px-8 lg:px-12 w-full max-w-5xl mx-auto flex flex-col relative">
          
          <div className="mb-8 md:mb-12 flex flex-col items-center justify-center text-center relative w-full mt-2 md:mt-0">
            <div className="inline-block bg-yellow-400 text-black px-6 py-2 md:px-8 md:py-3 rounded-2xl shadow-[0_0_40px_rgba(250,204,21,0.25)] mb-3 transform -rotate-1 hover:rotate-0 transition-transform cursor-default">
              <h1 className="text-3xl md:text-5xl font-black tracking-tight flex items-center gap-2 md:gap-3">
                <Printer className="w-8 h-8 md:w-10 md:h-10 opacity-80" />
                Print Station
              </h1>
            </div>
            <p className="text-gray-400 font-bold text-sm md:text-base max-w-md mx-auto hidden md:block">
              المنصة الذكية لتفصيل وطباعة طلباتك بأعلى جودة وأفضل سعر
            </p>
            
            {currentStep > 0 && (
              <button 
                onClick={handleChangeCategory}
                className="mt-4 hidden md:flex items-center gap-2 px-5 py-2.5 bg-[#1a1a1a] text-white rounded-xl border border-white/10 hover:border-yellow-400 hover:text-yellow-400 transition-colors text-sm font-bold shadow-lg"
              >
                تغيير القسم
              </button>
            )}
          </div>

          {/* STEP 0: Category Selection */}
          <AnimatePresence mode="wait">
            {currentStep === 0 && (
              <motion.div 
                key="step-0"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                className="mb-12"
              >
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-yellow-400 text-black flex items-center justify-center font-black">1</span>
                  اختر القسم الرئيسي
                </h2>
                
                {loadingProductTypes ? (
                  <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-yellow-400" /></div>
                ) : error ? (
                  <div className="text-red-500 text-2xl font-bold p-4">ERROR: {error.message}</div>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                    {(Array.isArray(productTypes) ? productTypes : (productTypes?.data || []))?.map((cat: any) => {
                      const Icon = getStaticIcon(cat.icon);
                      const isSelected = config.mainCategoryId === cat.id;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => handleCategorySelect(cat)}
                          className={`p-4 md:p-6 rounded-3xl border-2 text-right transition-all flex flex-col gap-3 md:gap-4 relative overflow-hidden group ${
                            isSelected 
                              ? "border-yellow-400 bg-yellow-400/5 shadow-[0_0_20px_rgba(250,204,21,0.1)]" 
                              : "border-white/5 bg-[#111111] hover:border-white/20"
                          }`}
                        >
                          <div className={`p-3 rounded-2xl w-fit ${isSelected ? "bg-yellow-400 text-black" : "bg-[#222222] text-gray-400"}`}>
                            <Icon size={24} />
                          </div>
                          <div>
                            <h3 className={`font-bold text-lg mb-1 ${isSelected ? "text-yellow-400" : "text-white"}`}>
                              {cat.name}
                            </h3>
                            <p className="text-sm text-gray-500 font-medium">{cat.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 1: Printing Type Selection */}
            {currentStep === 1 && config.mainCategoryId && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="flex-1"
              >
                <div className="flex md:hidden items-center justify-between mb-6">
                  <span className="text-yellow-400 font-bold">
                    {(Array.isArray(productTypes) ? productTypes : (productTypes?.data || [])).find((c: any) => c.id === config.mainCategoryId)?.name}
                  </span>
                  <button onClick={handleChangeCategory} className="text-sm text-gray-400 underline">تغيير القسم</button>
                </div>

                <div className="flex flex-col gap-6">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-yellow-400 text-black flex items-center justify-center font-black">2</span>
                    اختر نوع المطبوعات
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {(Array.isArray(productTypes) ? productTypes : (productTypes?.data || []))?.find((c: any) => c.id === config.mainCategoryId)?.printing_types?.map((type: any) => (
                      <button
                        key={type.id}
                        onClick={() => updatePrintingType(type.id, type.min_quantity || 1)}
                        className={`p-4 md:p-6 rounded-3xl border-2 text-right transition-all flex flex-col gap-2 relative overflow-hidden group ${
                          config.printingTypeId === type.id
                            ? "border-yellow-400 bg-yellow-400/5 shadow-[0_0_20px_rgba(250,204,21,0.1)]"
                            : "border-white/5 bg-[#111111] hover:border-white/20"
                        }`}
                      >
                        {type.image && (
                          <div className="w-12 h-12 rounded-full overflow-hidden mb-2 bg-[#222]">
                            <Image src={type.image} alt={type.name} width={48} height={48} className="object-cover w-full h-full" />
                          </div>
                        )}
                        <h3 className={`font-bold text-lg ${config.printingTypeId === type.id ? "text-yellow-400" : "text-white"}`}>
                          {type.name}
                        </h3>
                        {type.description && <p className="text-sm text-gray-500 font-medium">{type.description}</p>}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* DYNAMIC STEPS (2 to 4) */}
            {currentStep > 1 && activePrintingType && (
              <motion.div
                key={`step-${currentStep}`}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="flex-1"
              >
                {currentStep === 2 && (
                   <div className="flex md:hidden items-center justify-between mb-6">
                      <span className="text-yellow-400 font-bold">{((activePrintingType?.data || activePrintingType) || activePrintingType)?.name}</span>
                      <button onClick={() => setCurrentStep(1)} className="text-sm text-gray-400 underline">تغيير النوع</button>
                   </div>
                )}
                
                {currentStep === 2 && (
                  <div className="flex flex-col gap-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-yellow-400 text-black flex items-center justify-center font-black">3</span>
                      مواصفات الطباعة
                    </h2>
                    <div className="p-6 rounded-3xl border border-white/10 bg-[#111111]">
                      <label className="block text-sm font-bold text-gray-400 mb-2">الكمية المطلوبة</label>
                      <input 
                        type="number" 
                        min={((activePrintingType?.data || activePrintingType) || activePrintingType)?.min_quantity || 1}
                        step={((activePrintingType?.data || activePrintingType) || activePrintingType)?.quantity_step || 1}
                        value={config.quantity}
                        onChange={(e) => {
                          const minQty = ((activePrintingType?.data || activePrintingType) || activePrintingType)?.min_quantity || 1;
                          const val = parseInt(e.target.value) || minQty;
                          updateQuantity(val, minQty);
                        }}
                        className="w-full bg-[#1a1a1a] text-white p-4 rounded-xl border border-white/10 outline-none focus:border-yellow-400 font-bold text-xl"
                      />
                    </div>
                    <DynamicOptions 
                      attributes={((activePrintingType?.data || activePrintingType) || activePrintingType)?.attributes || []}
                      config={config} 
                      updateOption={updateOption} 
                      removeOption={removeOption}
                      updateDimensions={updateDimensions}
                    />
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="flex flex-col gap-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-yellow-400 text-black flex items-center justify-center font-black">4</span>
                      خيارات ما بعد الطباعة (التشطيب)
                    </h2>
                    <FinishingOptions 
                      attributes={((activePrintingType?.data || activePrintingType) || activePrintingType)?.attributes || []}
                      config={config} 
                      updateOption={updateOption}
                      removeOption={removeOption}
                    />
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="flex flex-col gap-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-yellow-400 text-black flex items-center justify-center font-black">5</span>
                      رفع الملفات والملاحظات
                    </h2>
                    <CategorizedUploader 
                      printingType={((activePrintingType?.data || activePrintingType) || activePrintingType)!}
                      config={config}
                      updateConfig={updateConfig}
                      sessionId={sessionId}
                    />
                    <div>
                      <label className="block text-sm font-bold text-gray-400 mb-2">ملاحظات إضافية (اختياري)</label>
                      <textarea 
                        rows={4}
                        value={config.notes}
                        onChange={(e) => updateConfig({ notes: e.target.value })}
                        placeholder="أي تفاصيل إضافية تريد إخبارنا بها..."
                        className="w-full bg-[#1a1a1a] text-white p-4 rounded-xl border border-white/10 outline-none focus:border-yellow-400"
                      />
                    </div>
                  </div>
                )}
                
              </motion.div>
            )}
          </AnimatePresence>

          {/* WIZARD NAVIGATION CONTROLS */}
          {currentStep > 1 && activePrintingType && (
             <div className="mt-auto pt-8 flex items-center justify-between pb-8">
                <button 
                  onClick={prevStep}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 bg-[#111111] text-white hover:bg-white/5 transition-colors font-bold"
                >
                  <ArrowRight size={18} /> السابق
                </button>
                
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((_, i) => (
                    <div key={i} className={`h-2 rounded-full transition-all ${i + 1 === currentStep ? "w-8 bg-yellow-400" : "w-2 bg-white/20"}`} />
                  ))}
                </div>

                {currentStep < 4 ? (
                  <button 
                    onClick={nextStep}
                    disabled={!isStepValid()}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black hover:bg-gray-200 transition-colors font-bold disabled:opacity-20 disabled:cursor-not-allowed"
                  >
                    التالي <ArrowLeft size={18} />
                  </button>
                ) : (
                  <button 
                    onClick={handleCheckout}
                    disabled={!canProceedToPayment}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-yellow-400 text-black font-black hover:bg-yellow-300 transition-colors shadow-lg shadow-yellow-400/20 disabled:opacity-50"
                  >
                    إتمام الطلب <CheckCircle size={18} />
                  </button>
                )}
             </div>
          )}

        </div>

        {/* Order Summary Pane */}
        {/* Spacer for desktop to prevent overlap */}
        <div className="hidden md:block md:w-[374px] lg:w-[432px] flex-shrink-0" />
        
        {/* Fixed pane for desktop, bottom-fixed for mobile */}
        <div className="fixed bottom-[80px] left-4 right-4 md:bottom-auto md:left-6 lg:left-8 md:right-auto md:w-[350px] lg:w-[400px] z-40 md:top-24 md:h-[calc(100vh-6rem)]">
          
          {isDrawerOpen && shouldShowBottomBox && (
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden pointer-events-auto"
              onClick={() => setIsDrawerOpen(false)}
            />
          )}

          <motion.div 
            aria-hidden={!shouldShowBottomBox}
            className={`relative absolute md:static bottom-0 left-0 right-0 bg-[#111111] md:bg-gradient-to-b md:from-[#161616] md:to-[#0d0d0d] border border-white/10 md:p-6 md:h-full flex flex-col shadow-[20px_0_60px_rgba(0,0,0,0.8)] rounded-3xl z-50 transition-all duration-300 md:opacity-100 md:translate-y-0 md:pointer-events-auto overflow-hidden ${
              shouldShowBottomBox ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-[120%] pointer-events-none"
            } ${
              isDrawerOpen ? "h-[75vh] p-4" : "p-3"
            }`}
          >
            {/* Premium Decorative Elements (Desktop Only) */}
            <div className="hidden md:block absolute -right-32 top-1/3 w-64 h-64 bg-yellow-400/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="hidden md:block absolute right-0 top-0 w-[1px] h-full bg-gradient-to-b from-transparent via-yellow-400/30 to-transparent pointer-events-none" />
            <div className="hidden md:block absolute right-0 top-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />

            <div className="relative z-10 flex flex-col h-full">
              <h2 className="text-xl font-black mb-6 hidden md:block text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">الفاتورة التفصيلية</h2>

            {isDrawerOpen && (
               <div className="flex md:hidden items-center justify-between mb-4 border-b border-white/10 pb-3 px-1">
                 <h2 className="text-xl font-black text-white">الفاتورة التفصيلية</h2>
                 <button 
                   onClick={() => setIsDrawerOpen(false)}
                   className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
                   aria-label="إغلاق الفاتورة"
                 >
                   <XIcon size={18} />
                 </button>
               </div>
            )}
            
            {!isDrawerOpen && (
              <div 
                role="button"
                tabIndex={0}
                className="md:hidden flex items-center justify-between w-full outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 rounded-xl select-none"
                onClick={() => setIsDrawerOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setIsDrawerOpen(true);
                  }
                }}
              >
                <span className="text-white font-black text-lg">
                  {isCalculating ? <Loader2 className="w-5 h-5 animate-spin text-yellow-400 inline" /> : `${pricingDetails?.final_price_egp > 0 ? pricingDetails.final_price_egp : "---"} ج.م`}
                </span>
                <span className="text-yellow-400 text-xs font-bold flex items-center gap-1 animate-pulse">
                  الفاتورة التفصيلية <ChevronUp size={14} />
                </span>
              </div>
            )}
            
            <div className={`flex-1 overflow-y-auto mb-4 md:mb-6 custom-scrollbar ${!isDrawerOpen ? "hidden md:block" : "block"}`}>
              {config.printingTypeId ? (
                <div className="space-y-4 pr-2">
                  <div className="p-4 bg-[#222222] rounded-2xl border border-white/5 flex justify-between items-center">
                    <span className="text-xs text-gray-500">القسم</span>
                    <span className="font-bold text-yellow-400">{(activePrintingType?.data || activePrintingType)?.name}</span>
                  </div>

                  {/* Selected Options Section */}
                  <div className="space-y-2">
                    {Object.entries(config.selectedOptions).map(([attrIdStr, opt]) => {
                      const attrId = parseInt(attrIdStr);
                      const attr = (activePrintingType?.data || activePrintingType)?.attributes?.find((a: any) => a.id === attrId);
                      if (!attr) return null;
                      const val = attr.values?.find((v: any) => v.id === opt.value_id);
                      if (!val) return null;
                      return (
                        <div key={attr.id} className="p-3 bg-[#1a1a1a] rounded-xl border border-white/5 flex flex-col gap-1">
                          <span className="text-xs text-gray-500">{attr.label}</span>
                          <span className="font-bold text-white text-sm">{val.label}</span>
                        </div>
                      );
                    })}
                  </div>
                  
                  {isCalculating && (
                    <div className="p-4 flex justify-center text-yellow-400">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  )}

                  {!isCalculating && pricingDetails && (
                    <div className="p-4 bg-[#222222] rounded-2xl border border-white/5 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">الكمية المطلوبة</span>
                        <span className="font-bold text-white text-lg">x{config.quantity}</span>
                      </div>
                      
                      {pricingDetails.subtotal > 0 && (
                        <div className="flex justify-between items-center text-sm border-t border-white/5 pt-3">
                          <span className="text-gray-400">الإجمالي قبل الخصم</span>
                          <span className="font-bold text-white">{(pricingDetails.subtotal / 100).toFixed(2)} ج.م</span>
                        </div>
                      )}

                      {pricingDetails.tax_amount > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400">الضريبة المضافة</span>
                          <span className="font-bold text-white">{(pricingDetails.tax_amount / 100).toFixed(2)} ج.م</span>
                        </div>
                      )}
                    </div>
                  )}

                  {pricingDetails?.discount_amount > 0 && (
                    <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-2xl flex flex-col gap-1">
                       <span className="text-green-400 font-bold text-sm">🎉 مبروك! حصلت على خصم الجملة</span>
                       <div className="flex justify-between text-sm">
                         <span className="text-green-500/70">قيمة الخصم</span>
                         <span className="text-green-400 font-bold">-{(pricingDetails.discount_amount / 100).toFixed(2)} ج.م</span>
                       </div>
                    </div>
                  )}
                  
                  {/* EDD Section (Estimated Delivery Date) */}
                  {pricingDetails?.production_days && (
                    <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-2xl flex flex-col gap-1">
                       <span className="text-blue-400 font-bold text-sm">تاريخ التسليم المتوقع (EDD)</span>
                       <span className="text-blue-100 text-xs">يحتاج هذا الطلب إلى {pricingDetails.production_days} أيام عمل من تاريخ اعتماد التصميم والدفع.</span>
                    </div>
                  )}

                  {/* File Status Alert if rejected */}
                  {fileStatus === 'rejected' && (
                     <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-2">
                        <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
                        <div>
                          <span className="text-red-400 font-bold text-sm block">تم رفض الملف</span>
                          <span className="text-red-100 text-xs">رجاءً راجع أبعاد الملف ودقته وأعد الرفع.</span>
                        </div>
                     </div>
                  )}

                </div>
              ) : (
                <div className="text-center text-gray-500 h-full flex flex-col items-center justify-center opacity-50">
                  <Printer size={48} className="mb-4" />
                  <p>ابدأ باختيار القسم</p>
                </div>
              )}
            </div>

            {/* Action Buttons Render (DRY Pattern) */}
            {(() => {
              const CartActions = ({ className = "" }: { className?: string }) => (
                <div className={`w-full flex gap-2 ${className}`}>
                  <button 
                    onClick={handleAddToCart}
                    disabled={!config.mainCategoryId || !isStepValid() || fileStatus === 'processing' || isSubmitting}
                    className="flex-1 bg-[#1a1a1a] text-white px-3 py-3 md:py-4 rounded-xl md:rounded-full font-bold disabled:opacity-20 disabled:cursor-not-allowed hover:bg-white/10 transition-colors border border-white/10 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>إضافة للسلة</span>}
                  </button>

                  <button 
                    onClick={handleCheckout}
                    disabled={!config.mainCategoryId || !isStepValid() || fileStatus === 'processing' || isSubmitting}
                    className="flex-1 bg-yellow-400 text-black px-3 py-3 md:py-4 rounded-xl md:rounded-full font-black disabled:opacity-20 disabled:cursor-not-allowed hover:bg-yellow-300 transition-colors shadow-lg shadow-yellow-400/20 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin text-black" /> : <span>إتمام الطلب</span>}
                  </button>
                </div>
              );

              return (
                <div className={`mt-auto pt-2 bg-[#111111] md:bg-transparent ${!isDrawerOpen ? "hidden md:flex flex-col" : "flex flex-col"}`}>
                  <div className="text-center mb-4 hidden md:flex flex-col">
                    <span className="text-sm text-gray-400 block mb-1">الإجمالي (شامل الضريبة)</span>
                    <span className="text-2xl md:text-4xl font-black text-white">
                      {isCalculating ? (
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-yellow-400" />
                      ) : (
                        <>{pricingDetails?.final_price_egp > 0 ? pricingDetails.final_price_egp : "---"} <span className="text-sm text-yellow-400">ج.م</span></>
                      )}
                    </span>
                  </div>
                  
                  {/* Desktop always visible buttons */}
                  <CartActions className="hidden md:flex" />
                  
                  {/* Mobile drawer buttons */}
                  {isDrawerOpen && <CartActions className="flex md:hidden mt-2" />}
                </div>
              );
            })()}
            </div>
          </motion.div>
        </div>

      </div>
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        message="ستفقد جميع اختياراتك الحالية لأنك لم تكمل الطلب. هل أنت متأكد من رغبتك في تغيير القسم؟"
        onConfirm={() => {
          resetConfig();
          setIsConfirmModalOpen(false);
        }}
        onCancel={() => setIsConfirmModalOpen(false)}
      />
    </PageTransition>
  );
}
