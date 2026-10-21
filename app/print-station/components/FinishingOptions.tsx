import React, { useState } from "react";
import { usePrintConfig } from "../../../hooks/usePrintConfig";
import { Check, Plus, Minus, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PrintingAttribute, PrintingAttributeValue } from "../../../types/print-station";
import { deleteUnlinkedFile } from "../../../services/api/printingApi";

interface FinishingOptionsProps {
  attributes: PrintingAttribute[];
  config: ReturnType<typeof usePrintConfig>["config"];
  updateOption: ReturnType<typeof usePrintConfig>["updateOption"];
  removeOption: ReturnType<typeof usePrintConfig>["removeOption"];
  cartItemId?: number;
}

const formatPriceInfo = (val: PrintingAttributeValue) => {
  if (val.fixed_price > 0 && val.unit_price > 0) return `+${val.fixed_price / 100} ثابت | +${val.unit_price / 100} للنسخة`;
  if (val.fixed_price > 0) return `+${val.fixed_price / 100} ج ثابت`;
  if (val.unit_price > 0) return `+${val.unit_price / 100} ج/نسخة`;
  if (val.unit_price < 0) return `${val.unit_price / 100} ج/نسخة`;
  return null;
};

const GridButton = ({
  val,
  isSelected,
  onClick,
}: {
  val: PrintingAttributeValue;
  isSelected: boolean;
  onClick: () => void;
}) => {
  const priceTag = formatPriceInfo(val);
  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
        isSelected
          ? "bg-yellow-400 text-black border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.2)]"
          : "bg-[#222222] text-gray-400 border-white/5 hover:border-white/20 hover:text-white"
      }`}
    >
      <div className="flex items-center gap-2 font-bold text-sm md:text-base">
        {isSelected && <Check size={14} className="text-black shrink-0" />}
        {val.label}
      </div>
      {priceTag && (
        <span className={`text-[10px] md:text-xs font-medium ${isSelected ? "text-black/70" : "text-gray-500"}`}>
          {priceTag}
        </span>
      )}
    </button>
  );
};

const CounterOption = ({
  label,
  count,
  onChange,
}: {
  label: string;
  count: number;
  onChange: (val: number) => void;
}) => {
  return (
    <div className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
      count > 0 ? "bg-yellow-400/5 border-yellow-400/30" : "bg-[#111111] border-white/5"
    }`}>
      <div className="flex flex-col">
        <span className={`font-bold ${count > 0 ? "text-yellow-400" : "text-white"}`}>{label}</span>
      </div>
      <div className="flex items-center gap-4 bg-[#0a0a0a] rounded-xl border border-white/10 p-1">
        <button
          onClick={() => onChange(Math.max(0, count - 1))}
          className="w-8 h-8 rounded-lg bg-[#222222] hover:bg-[#333333] flex items-center justify-center text-white transition-colors"
        >
          <Minus size={16} />
        </button>
        <span className="w-6 text-center font-bold text-white">{count}</span>
        <button
          onClick={() => onChange(count + 1)}
          className="w-8 h-8 rounded-lg bg-[#222222] hover:bg-[#333333] flex items-center justify-center text-white transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
};

export const FinishingOptions = ({
  attributes,
  config,
  updateOption,
  removeOption,
  cartItemId,
}: FinishingOptionsProps) => {
  const finishAttributes = attributes.filter((attr) => attr.step === "finishing").sort((a, b) => a.sort_order - b.sort_order);

  const [openSection, setOpenSection] = useState<number | null>(null);

  const handleSelect = async (attr: PrintingAttribute, val: PrintingAttributeValue) => {
    const oldSelection = config.selectedOptions[attr.id];
    
    // Toggle off if clicking the same value (for finishings, they might be optional)
    if (oldSelection && oldSelection.value_id === val.id) {
        removeOption(attr.id);
        if (val.required_upload_category && cartItemId) {
            try {
                await deleteUnlinkedFile(cartItemId, val.required_upload_category);
            } catch (e) {
                console.error(e);
            }
        }
        return;
    }

    if (oldSelection && oldSelection.value_id !== val.id) {
      const oldValue = attr.values?.find((v) => v.id === oldSelection.value_id);
      if (oldValue?.required_upload_category && oldValue.required_upload_category !== val.required_upload_category) {
        if (cartItemId) {
          try {
            await deleteUnlinkedFile(cartItemId, oldValue.required_upload_category);
          } catch (error) {
            console.error("Failed to delete unlinked file", error);
          }
        }
      }
    }

    updateOption(attr.id, val.id);
  };

  const handleCounterChange = (attr: PrintingAttribute, newCount: number) => {
      if (newCount === 0) {
          removeOption(attr.id);
          return;
      }
      
      const baseValueId = attr.values?.[0]?.id;
      if (baseValueId) {
          updateOption(attr.id, baseValueId, newCount);
      }
  };

  const checkConditionalRules = (attr: PrintingAttribute) => {
    if (!attr.conditional_rules) return true;
    try {
      const rules = typeof attr.conditional_rules === 'string' ? JSON.parse(attr.conditional_rules) : attr.conditional_rules;
      if (rules.show_if) {
        for (const [key, expectedValue] of Object.entries(rules.show_if)) {
          const parentAttr = attributes.find((a) => a.name === key);
          if (parentAttr) {
            const selection = config.selectedOptions[parentAttr.id];
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

  if (finishAttributes.length === 0) {
      return null;
  }

  return (
    <div className="w-full space-y-4">
      {finishAttributes.map((attr) => {
        if (!checkConditionalRules(attr)) return null;

        const selectedOption = config.selectedOptions[attr.id];
        const isActive = !!selectedOption;
        const selectedValue = isActive ? attr.values?.find(v => v.id === selectedOption.value_id) : null;

        if (attr.type === "number") {
          return (
            <CounterOption
              key={attr.id}
              label={attr.label}
              count={selectedOption?.multiplier_value || 0}
              onChange={(val) => handleCounterChange(attr, val)}
            />
          );
        }

        return (
          <div key={attr.id} className="mb-4">
            <button
              onClick={() => setOpenSection(openSection === attr.id ? null : attr.id)}
              className={`w-full flex items-center justify-between p-4 transition-colors border ${
                openSection === attr.id ? "bg-[#222222] border-white/10 rounded-t-2xl" : "bg-[#111111] border-white/5 hover:bg-[#1a1a1a] rounded-2xl"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border ${isActive ? "border-yellow-400 bg-yellow-400/20" : "border-gray-500"}`}>
                  {isActive && <Check size={14} className="text-yellow-400" />}
                </div>
                <div className="flex flex-col items-start gap-1">
                  <span className="font-bold text-white">{attr.label}</span>
                  {isActive && selectedValue && (
                     <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full">{selectedValue.label}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                {openSection === attr.id ? <ChevronUp className="text-gray-400" /> : <ChevronDown className="text-gray-400" />}
              </div>
            </button>
            <AnimatePresence>
              {openSection === attr.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 p-4 bg-[#1a1a1a] rounded-b-2xl border-t-0 border border-white/5">
                    {attr.values?.map((val) => (
                      <GridButton
                        key={val.id}
                        val={val}
                        isSelected={selectedOption?.value_id === val.id}
                        onClick={() => handleSelect(attr, val)}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};
