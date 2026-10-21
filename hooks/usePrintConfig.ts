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
  
  // Abort controller for live pricing
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch product types and details is usually done at the page level, 
  // but if needed we expose it here or let components handle it.
  
  // Pricing Mutation
  const pricingMutation = useMutation({
    mutationFn: async (payload: { printing_type_id: number, quantity: number, selectedOptions: Record<number, SelectedOption>, width_mm?: number, length_mm?: number, image_count?: number, signal?: AbortSignal }) => {
      const formattedOptions = Object.values(payload.selectedOptions).map(opt => ({
        value_id: opt.value_id,
        multiplier_value: opt.multiplier_value
      }));
      return calculateLivePrice({
        printing_type_id: payload.printing_type_id,
        quantity: payload.quantity,
        selected_options: formattedOptions,
        width_mm: payload.width_mm,
        length_mm: payload.length_mm,
        image_count: payload.image_count,
      }, payload.signal);
    }
  });

  // Debounced API call for live pricing
  useEffect(() => {
    if (!config.printingTypeId) return;

    const timer = setTimeout(() => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort(); // Cancel previous request
      }
      abortControllerRef.current = new AbortController();

      pricingMutation.mutate({
        printing_type_id: config.printingTypeId!,
        quantity: config.quantity,
        selectedOptions: config.selectedOptions,
        width_mm: config.width_mm,
        length_mm: config.length_mm,
        image_count: config.image_count,
        signal: abortControllerRef.current.signal,
      });
    }, 500); // 500ms debounce as requested

    return () => clearTimeout(timer);
  }, [config.printingTypeId, config.quantity, config.selectedOptions, config.width_mm, config.length_mm, config.image_count]);

  // Expose Pricing Details explicitly
  const pricingDetails = pricingMutation.data || {
    subtotal: 0,
    discount_amount: 0,
    tax_amount: 0,
    final_total: 0,
    final_price_egp: 0,
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
    isCalculating: pricingMutation.isPending,
    updateMainCategory,
    updatePrintingType,
    updateConfig,
    updateOption,
    removeOption,
    updateQuantity,
    updateDimensions,
    resetConfig,
    submitPrintOrder,
    prepareOrderPayload,
  };
};
