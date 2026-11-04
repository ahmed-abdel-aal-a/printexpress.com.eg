import { useState, useCallback, useEffect, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { PrintOrderState, OrderPayload, SelectedOption } from "../types/print-station";
import { calculateLivePrice, getPrintingProductTypes, getPrintingTypeDetails } from "../services/api/printingApi";

const initialState: PrintOrderState = {
  mainCategoryId: null,
  printingTypeId: null,
  selectedOptions: {},
  quantity: 1,
  notes: "",
  uploadedFiles: {},
};

export const usePrintConfig = () => {
  const [config, setConfig] = useState<PrintOrderState>(initialState);
  const [currentStep, setCurrentStep] = useState<number>(0);
  
  // Abort controller and request tracking for live pricing
  const abortControllerRef = useRef<AbortController | null>(null);
  const activeRequestIdRef = useRef<number>(0);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [pricingData, setPricingData] = useState<any>(null);

  // Debounced API call for live pricing with AbortController Spinner Trap protection
  useEffect(() => {
    if (!config.printingTypeId) {
      setIsCalculating(false);
      return;
    }

    // Immediately flag calculation as pending when inputs change (locks UI during debounce)
    setIsCalculating(true);

    const timer = setTimeout(async () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort(); // Cancel previous request
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const currentReqId = ++activeRequestIdRef.current;

      try {
        const formattedOptions = Object.values(config.selectedOptions).map(opt => ({
          value_id: opt.value_id,
          multiplier_value: opt.multiplier_value
        }));

        const data = await calculateLivePrice({
          printing_type_id: config.printingTypeId!,
          quantity: config.quantity,
          selected_options: formattedOptions,
          width_mm: config.width_mm,
          length_mm: config.length_mm,
          image_count: config.image_count,
        }, controller.signal);

        // Only update state if this is still the active, non-canceled request
        if (currentReqId === activeRequestIdRef.current) {
          setPricingData(data);
          setIsCalculating(false);
        }
      } catch (err: any) {
        // [Architectural Fix: The AbortController Spinner Trap]
        // Do NOT set isCalculating(false) if the error is due to abort/cancellation,
        // because a newer request is already in-flight or debouncing!
        if (
          err?.name === 'CanceledError' || 
          err?.code === 'ERR_CANCELED' || 
          err?.name === 'AbortError' ||
          currentReqId !== activeRequestIdRef.current
        ) {
          return;
        }

        // Only reset spinner on genuine network/server errors for the active request
        if (currentReqId === activeRequestIdRef.current) {
          setIsCalculating(false);
        }
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [config.printingTypeId, config.quantity, config.selectedOptions, config.width_mm, config.length_mm, config.image_count]);

  const cancelPendingPricing = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // Expose Pricing Details explicitly
  const pricingDetails = pricingData || {
    subtotal: 0,
    discount_amount: 0,
    tax_amount: 0,
    final_total: 0,
    final_price_egp: 0,
    production_days: 0,
    physical_weight_kg: 0,
    volumetric_weight_kg: 0,
    billable_weight_kg: 0,
  };

  const updateMainCategory = useCallback((categoryId: number) => {
    setConfig((prev) => ({
      ...initialState,
      mainCategoryId: categoryId,
      printingTypeId: null,
      notes: prev.notes,
      uploadedFiles: prev.uploadedFiles,
    }));
    setCurrentStep(1);
  }, []);

  const updateConfig = useCallback((updates: Partial<PrintOrderState>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  const updatePrintingType = useCallback((typeId: number, minQuantity: number = 1, defaultOptions: Record<number, SelectedOption> = {}) => {
    setConfig((prev) => ({
      ...prev,
      printingTypeId: typeId,
      selectedOptions: defaultOptions,
      uploadedFiles: {}, // Reset on type change
      notes: "",
      width_mm: undefined,
      length_mm: undefined,
      quantity: minQuantity,
    }));
    setCurrentStep(2);
  }, []);

  const updateOption = useCallback((attributeId: number, valueId: number, multiplierValue?: number) => {
    setConfig((prev) => {
      const newOptions = { ...prev.selectedOptions };
      newOptions[attributeId] = { value_id: valueId, multiplier_value: multiplierValue };
      return { ...prev, selectedOptions: newOptions };
    });
  }, []);

  const removeOption = useCallback((attributeId: number) => {
    setConfig((prev) => {
      const newOptions = { ...prev.selectedOptions };
      delete newOptions[attributeId];
      return { ...prev, selectedOptions: newOptions };
    });
  }, []);

  const updateQuantity = useCallback((qty: number, minQty: number = 1) => {
    setConfig((prev) => ({ ...prev, quantity: Math.max(minQty, qty) }));
  }, []);

  const updateDimensions = useCallback((width_mm?: number, length_mm?: number) => {
    setConfig((prev) => ({ ...prev, width_mm, length_mm }));
  }, []);

  const nextStep = useCallback(() => setCurrentStep((prev) => prev + 1), []);
  const prevStep = useCallback(() => setCurrentStep((prev) => Math.max(0, prev - 1)), []);
  const resetConfig = useCallback(() => {
    setConfig(initialState);
    setCurrentStep(0);
  }, []);

  const prepareOrderPayload = (): OrderPayload => {
    const formattedOptions = Object.values(config.selectedOptions).map(opt => ({
      value_id: opt.value_id,
      multiplier_value: opt.multiplier_value
    }));
    
    return {
      printing_type_id: config.printingTypeId || 0,
      quantity: config.quantity,
      selected_options: formattedOptions,
      width_mm: config.width_mm,
      length_mm: config.length_mm,
      image_count: config.image_count,
      notes: config.notes,
    };
  };

  const submitPrintOrder = async () => {
    const payload = prepareOrderPayload();
    console.log("Submitting Print Order Payload:", payload);
    // Add real submit logic later
    return new Promise((resolve) => setTimeout(() => resolve({ success: true }), 1000));
  };

  return {
    config,
    currentStep,
    setCurrentStep,
    nextStep,
    prevStep,
    pricingDetails,
    isCalculating,
    updateMainCategory,
    updatePrintingType,
    updateConfig,
    updateOption,
    removeOption,
    updateQuantity,
    updateDimensions,
    resetConfig,
    cancelPendingPricing,
    submitPrintOrder,
    prepareOrderPayload,
  };
};
