"use client";

import React, { useState, useEffect, useMemo } from "react";
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
import { SmartQuantityCounter } from "./components/SmartQuantityCounter";
import { PrintingAttribute } from "../../types/print-station";
import { useQuery } from "@tanstack/react-query";
import { checkFileStatus, getPrintingProductTypes, getPrintingTypeDetails, addPrintJobToCart } from "../../services/api/printingApi";
import { ConfirmModal } from "@/components/UI/ConfirmModal";
import Image from 'next/image';
import { useRouter } from 'next/navigation';
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

const checkConditionalRules = (
  attr: PrintingAttribute,
  selectedOptions: Record<number, any>,
  allAttributes: PrintingAttribute[]
): boolean => {
  if (!attr.conditional_rules) return true;
  try {
    const rules = typeof attr.conditional_rules === 'string' 
      ? JSON.parse(attr.conditional_rules) 
      : attr.conditional_rules;
    if (rules.show_if) {
      for (const [key, expectedValue] of Object.entries(rules.show_if)) {
        const parentAttr = allAttributes.find((a) => a.name === key);
        if (parentAttr) {
          const selection = selectedOptions[parentAttr.id];
          if (!selection) return false;
          const selectedVal = parentAttr.values?.find((v) => v.id === selection.value_id);
          if (selectedVal?.value !== expectedValue) return false;
        }
      }
    }
    return true;
  } catch {
    return true;
  }
};

interface OptionCostResult {
  totalEgp: number;
  hasPrice: boolean;
  isFree: boolean;
}

const calculateOptionCost = (
  attr: any,
  val: any,
  opt: any,
  quantity: number,
  imageCount: number = 1,
  pricingByImageCount: boolean = false
): OptionCostResult => {
  const fixed = Number(val?.fixed_price || 0);
  const unit = Number(val?.unit_price || 0);
  const multiplierPrice = Number(val?.multiplier_price || 0);
  const multiplierVal = Math.max(1, Number(opt?.multiplier_value || 1));

  // Determine dynamically if this attribute scales with page/image count
  // Avoids hardcoding IDs or Arabic names: checks backend group, target, applies_to_pages, or multiplier_number type
  const isPageSpecific = Boolean(
    attr?.group === 'pages' ||
    attr?.target === 'interior' ||
    attr?.applies_to_pages === true ||
    (typeof attr?.name === 'string' && (attr.name.toLowerCase().includes('page') || attr.name.toLowerCase().includes('sheet'))) ||
    attr?.type === 'multiplier_number'
  );

  const effectivePages = (pricingByImageCount && isPageSpecific) ? Math.max(1, imageCount) : 1;
  const effectiveQty = quantity * effectivePages;

  const totalCents = fixed + (unit * effectiveQty) + (multiplierPrice * multiplierVal * effectiveQty);
  const totalEgp = totalCents / 100;

  return {
    totalEgp,
    hasPrice: totalCents > 0,
    isFree: totalCents === 0,
  };
};

export default function PrintStation() {
  const router = useRouter();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [fileStatus, setFileStatus] = useState<string | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [activeStepId, setActiveStepId] = useState<'specs' | 'finishing' | 'upload'>('specs');
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
    cancelPendingPricing,
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

  const printingTypeObj = activePrintingType ? (activePrintingType.data || activePrintingType) : null;
  const allAttributes: PrintingAttribute[] = useMemo(() => {
    return printingTypeObj?.attributes || [];
  }, [printingTypeObj]);

  // Dynamic Finishing Attributes filtered by current selected options
  const visibleFinishingAttributes = useMemo(() => {
    if (!printingTypeObj || allAttributes.length === 0) return [];
    const finishingAttributes = allAttributes.filter((attr) => attr.step === "finishing");
    return finishingAttributes.filter((attr) => 
      checkConditionalRules(attr, config.selectedOptions, allAttributes)
    );
  }, [
    printingTypeObj, 
    allAttributes, 
    config.selectedOptions, 
    config.quantity, 
    config.width_mm, 
    config.length_mm
  ]);

  const hasFinishingStep = visibleFinishingAttributes.length > 0;

  // Active Wizard Steps for Selected Product (Dynamic Flow)
  const productWizardSteps = useMemo(() => {
    if (!printingTypeObj) return [];
    const steps: { id: 'specs' | 'finishing' | 'upload'; label: string }[] = [
      { id: 'specs', label: 'مواصفات الطباعة' },
    ];

    if (hasFinishingStep) {
      steps.push({ id: 'finishing', label: 'خيارات ما بعد الطباعة (التشطيب)' });
    }

    steps.push({ id: 'upload', label: 'رفع الملفات والملاحظات' });

    return steps;
  }, [printingTypeObj, hasFinishingStep]);

  // Step Desynchronization Guard: If current step vanished from active steps, reset to 'specs' immediately!
  useEffect(() => {
    if (productWizardSteps.length > 0) {
      const stepExists = productWizardSteps.some((s) => s.id === activeStepId);
      if (!stepExists) {
        setActiveStepId('specs');
      }
    }
  }, [productWizardSteps, activeStepId]);

  // ⚡ Cascading Auto-Pruning: Delete stale options whose conditions are no longer met (handles A -> B -> C cascade)
  useEffect(() => {
    if (!printingTypeObj || allAttributes.length === 0) return;

    let hasPruned = false;
    let currentOptions: Record<number, any> = { ...config.selectedOptions };

    let passPruned = true;
    let iterations = 0;
    const maxIterations = allAttributes.length; // Guard against circular dependencies

    while (passPruned && iterations < maxIterations) {
      passPruned = false;
      iterations++;

      for (const attr of allAttributes) {
        if (currentOptions[attr.id]) {
          const isValid = checkConditionalRules(attr, currentOptions, allAttributes);
          if (!isValid) {
            // Shallow clone without this attribute to avoid mutating references
            const nextOptions = { ...currentOptions };
            delete nextOptions[attr.id];
            currentOptions = nextOptions;
            passPruned = true;
            hasPruned = true;
          }
        }
      }
    }

    if (hasPruned) {
      updateConfig({ selectedOptions: currentOptions });
    }
  }, [config.selectedOptions, config.quantity, config.width_mm, config.length_mm, printingTypeObj, allAttributes, updateConfig]);

  const currentWizardStep = productWizardSteps.find((s) => s.id === activeStepId) || productWizardSteps[0];
  const currentWizardStepId = currentWizardStep?.id || 'specs';
  const currentWizardStepIndex = Math.max(0, productWizardSteps.findIndex((s) => s.id === currentWizardStepId));

  // Flush and Clamp Quantity to ensure validity when advancing or submitting
  const ensureValidQuantity = () => {
    const minQty = Math.max(1, printingTypeObj?.min_quantity || 1);
    const maxQty = (printingTypeObj?.max_quantity && Number(printingTypeObj.max_quantity) > 0) 
      ? Number(printingTypeObj.max_quantity) 
      : Infinity;
    const stepQty = Math.max(1, printingTypeObj?.quantity_step || 1);
    const currentVal = config.quantity;

    if (isNaN(currentVal) || currentVal < minQty) {
      updateQuantity(minQty, minQty);
      return minQty;
    }

    if (currentVal > maxQty) {
      const offset = maxQty - minQty;
      const remainder = offset % stepQty;
      const validMax = maxQty - remainder;
      updateQuantity(validMax, minQty);
      return validMax;
    }

    const offset = currentVal - minQty;
    const remainder = offset % stepQty;
    if (remainder !== 0) {
      let rounded = minQty + (Math.round(offset / stepQty) * stepQty);
      if (rounded > maxQty) {
        rounded = minQty + (Math.floor(offset / stepQty) * stepQty);
      }
      updateQuantity(rounded, minQty);
      return rounded;
    }

    return currentVal;
  };

  const handlePrevWizardStep = () => {
    const currentIdx = productWizardSteps.findIndex((s) => s.id === currentWizardStepId);
    if (currentIdx > 0) {
      setActiveStepId(productWizardSteps[currentIdx - 1].id);
    } else {
      setCurrentStep(1);
      setActiveStepId('specs');
    }
  };

  const handleNextWizardStep = () => {
    if (currentWizardStepId === 'specs') {
      ensureValidQuantity();
    }
    const currentIdx = productWizardSteps.findIndex((s) => s.id === currentWizardStepId);
    if (currentIdx >= 0 && currentIdx < productWizardSteps.length - 1) {
      setActiveStepId(productWizardSteps[currentIdx + 1].id);
    } else {
      handleCheckout();
    }
  };

  const isStepValid = () => {
    if (currentStep < 2) return true;
    if (currentWizardStepId === 'specs') {
      const minQty = Math.max(1, printingTypeObj?.min_quantity || 1);
      const maxQty = (printingTypeObj?.max_quantity && Number(printingTypeObj.max_quantity) > 0) 
        ? Number(printingTypeObj.max_quantity) 
        : Infinity;
      if (!config.quantity || config.quantity < minQty || config.quantity > maxQty) return false;
    }
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
      setActiveStepId('specs');
      resetConfig();
    }
  };

  const handleCategorySelect = (productType: any) => {
    setActiveStepId('specs');
    updateMainCategory(productType.id);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const preparePayload = () => {
    const validQty = ensureValidQuantity();

    const formattedOptions = Object.values(config.selectedOptions).map(opt => ({
      value_id: opt.value_id,
      multiplier_value: opt.multiplier_value
    }));

    const tempFileIds = Object.values(config.uploadedFiles)
      .filter((file: any) => file && file.file_id)
      .map((file: any) => file.file_id);

    return {
      printing_type_id: config.printingTypeId!,
      quantity: validQty,
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
    if (!isStepValid() || isSubmitting || isCalculating) return;
    cancelPendingPricing();
    setIsSubmitting(true);
    try {
      const payload = preparePayload();
      const res = await addPrintJobToCart(payload);
      // Success
      await refreshCart();
      toast.success('تم إضافة الطلب إلى السلة بنجاح! 🎉');
      setActiveStepId('specs');
      resetConfig();
      setIsCartOpen(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'حدث خطأ أثناء إضافة الطلب.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckout = async () => {
    if (!isStepValid() || isSubmitting || isCalculating) return;
    cancelPendingPricing();
    setIsSubmitting(true);
    try {
      const payload = preparePayload();
      await addPrintJobToCart(payload);
      await refreshCart();

      // Disarm beforeunload guard before routing
      (window as any).__hasUnsavedPrintConfig = false;
      toast.success('جاري توجيهك لصفحة الدفع... 🚀');

      // Fast SPA client navigation (without router.refresh to prevent lagging /print-station)
      router.push('/checkout');

      // Fallback after 2500ms if client router is delayed on mobile networks
      setTimeout(() => {
        if (typeof window !== 'undefined' && window.location.pathname !== '/checkout') {
          window.location.assign('/checkout');
        }
      }, 2500);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'حدث خطأ أثناء إتمام الطلب.');
      setIsSubmitting(false); // Exclusively in catch to prevent duplicate submissions on slow networks
    }
  };

  const canProceedToPayment = fileStatus !== 'processing' && !isSubmitting && !isCalculating;

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
                        onClick={() => {
                          setActiveStepId('specs');
                          updatePrintingType(type.id, type.min_quantity || 1);
                        }}
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

            {/* DYNAMIC PRODUCT WIZARD */}
            {currentStep > 1 && printingTypeObj && (
              <motion.div
                key={`wizard-step-${currentWizardStepId}`}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="flex-1"
              >
                {currentWizardStepId === 'specs' && (
                   <div className="flex md:hidden items-center justify-between mb-6">
                      <span className="text-yellow-400 font-bold">{printingTypeObj?.name}</span>
                      <button onClick={() => { setCurrentStep(1); setActiveStepId('specs'); }} className="text-sm text-gray-400 underline">
                        تغيير النوع
                      </button>
                   </div>
                )}
                
                {currentWizardStepId === 'specs' && (
                  <div className="flex flex-col gap-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-yellow-400 text-black flex items-center justify-center font-black">3</span>
                      مواصفات الطباعة
                    </h2>
                    
                    {/* Smart Quantity Counter Component */}
                    <SmartQuantityCounter 
                      quantity={config.quantity}
                      minQuantity={printingTypeObj?.min_quantity || 1}
                      maxQuantity={printingTypeObj?.max_quantity}
                      quantityStep={printingTypeObj?.quantity_step || 1}
                      onChange={(newQty) => updateQuantity(newQty, printingTypeObj?.min_quantity || 1)}
                    />

                    <DynamicOptions 
                      attributes={allAttributes}
                      config={config} 
                      updateOption={updateOption} 
                      removeOption={removeOption}
                      updateDimensions={updateDimensions}
                    />
                  </div>
                )}

                {currentWizardStepId === 'finishing' && (
                  <div className="flex flex-col gap-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-yellow-400 text-black flex items-center justify-center font-black">4</span>
                      خيارات ما بعد الطباعة (التشطيب)
                    </h2>
                    <FinishingOptions 
                      attributes={allAttributes}
                      config={config} 
                      updateOption={updateOption}
                      removeOption={removeOption}
                    />
                  </div>
                )}

                {currentWizardStepId === 'upload' && (
                  <div className="flex flex-col gap-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-yellow-400 text-black flex items-center justify-center font-black">
                        {hasFinishingStep ? 5 : 4}
                      </span>
                      رفع الملفات والملاحظات
                    </h2>
                    <CategorizedUploader 
                      printingType={printingTypeObj!}
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
          {currentStep > 1 && printingTypeObj && (
             <div className="mt-auto pt-8 flex items-center justify-between pb-8">
                <button 
                  onClick={handlePrevWizardStep}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 bg-[#111111] text-white hover:bg-white/5 transition-colors font-bold"
                >
                  <ArrowRight size={18} /> السابق
                </button>
                
                {/* Dynamic Stepper Dots */}
                <div className="flex gap-2 items-center">
                  {productWizardSteps.map((step) => {
                    const isActive = step.id === currentWizardStepId;
                    return (
                      <div 
                        key={step.id} 
                        title={step.label}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          isActive ? "w-8 bg-yellow-400" : "w-2 bg-white/20"
                        }`} 
                      />
                    );
                  })}
                </div>

                {currentWizardStepIndex < productWizardSteps.length - 1 ? (
                  <button 
                    onClick={handleNextWizardStep}
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
                    {isSubmitting || isCalculating ? (
                      <Loader2 className="w-5 h-5 animate-spin text-black" />
                    ) : (
                      <>
                        <span>إتمام الطلب</span> <CheckCircle size={18} />
                      </>
                    )}
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

                      const pricingByImageCount = Boolean(printingTypeObj?.upload_rules?.pricing_by_image_count);
                      const cost = calculateOptionCost(
                        attr,
                        val,
                        opt,
                        config.quantity,
                        config.image_count || 1,
                        pricingByImageCount
                      );

                      return (
                        <div key={attr.id} className="p-3 bg-[#1a1a1a] rounded-xl border border-white/5 flex items-center justify-between gap-2">
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="text-xs text-gray-500">{attr.label}</span>
                            <span className="font-bold text-white text-sm truncate">{val.label}</span>
                          </div>
                          <div className="shrink-0 text-left">
                            {cost.hasPrice ? (
                              <span className="text-xs font-bold text-yellow-400 bg-yellow-400/10 px-2.5 py-1 rounded-lg border border-yellow-400/20">
                                +{cost.totalEgp.toFixed(2)} ج.م
                              </span>
                            ) : (
                              <span className="text-[11px] font-semibold text-gray-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                                مشمول
                              </span>
                            )}
                          </div>
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
                  {pricingDetails?.production_days > 0 && (
                    <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-2xl flex flex-col gap-1.5 shadow-sm">
                       <div className="flex items-center justify-between">
                         <span className="text-blue-400 font-bold text-sm">تاريخ التسليم المتوقع (EDD)</span>
                         <span className="text-blue-300 font-bold text-xs bg-blue-500/20 px-2.5 py-0.5 rounded-full border border-blue-400/20">
                           {pricingDetails.production_days === 1
                             ? 'يوم عمل واحد'
                             : pricingDetails.production_days === 2
                               ? 'يومان عمل'
                               : pricingDetails.production_days <= 10
                                 ? `${pricingDetails.production_days} أيام عمل`
                                 : `${pricingDetails.production_days} يوماً عمل`}
                         </span>
                       </div>
                       <span className="text-blue-100/70 text-xs leading-relaxed">
                         يحتاج هذا الطلب إلى {
                           pricingDetails.production_days === 1
                             ? 'يوم عمل واحد'
                             : pricingDetails.production_days === 2
                               ? 'يومي عمل'
                               : pricingDetails.production_days <= 10
                                 ? `${pricingDetails.production_days} أيام عمل`
                                 : `${pricingDetails.production_days} يوماً عمل`
                         } للتجهيز والتنفيذ من تاريخ اعتماد التصميم والدفع.
                       </span>
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
                    disabled={!config.mainCategoryId || !isStepValid() || fileStatus === 'processing' || isSubmitting || isCalculating}
                    className="flex-1 bg-[#1a1a1a] text-white px-3 py-3 md:py-4 rounded-xl md:rounded-full font-bold disabled:opacity-20 disabled:cursor-not-allowed hover:bg-white/10 transition-colors border border-white/10 flex items-center justify-center gap-2"
                  >
                    {isSubmitting || isCalculating ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>إضافة للسلة</span>}
                  </button>

                  <button 
                    onClick={handleCheckout}
                    disabled={!config.mainCategoryId || !isStepValid() || fileStatus === 'processing' || isSubmitting || isCalculating}
                    className="flex-1 bg-yellow-400 text-black px-3 py-3 md:py-4 rounded-xl md:rounded-full font-black disabled:opacity-20 disabled:cursor-not-allowed hover:bg-yellow-300 transition-colors shadow-lg shadow-yellow-400/20 flex items-center justify-center gap-2"
                  >
                    {isSubmitting || isCalculating ? <Loader2 className="w-5 h-5 animate-spin text-black" /> : <span>إتمام الطلب</span>}
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
          setActiveStepId('specs');
          resetConfig();
          setIsConfirmModalOpen(false);
        }}
        onCancel={() => setIsConfirmModalOpen(false)}
      />
    </PageTransition>
  );
}
