import React, { useState, useEffect } from "react";
import { usePrintConfig } from "../../../hooks/usePrintConfig";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PrintingAttribute, PrintingAttributeValue } from "../../../types/print-station";
import { deleteUnlinkedFile } from "../../../services/api/printingApi";

interface DynamicOptionsProps {
  attributes: PrintingAttribute[];
  config: ReturnType<typeof usePrintConfig>["config"];
  updateOption: ReturnType<typeof usePrintConfig>["updateOption"];
  removeOption: ReturnType<typeof usePrintConfig>["removeOption"];
  updateDimensions: ReturnType<typeof usePrintConfig>["updateDimensions"];
  cartItemId?: number; // Optional, to delete unlinked files for existing cart items
}

const formatPriceInfo = (val: PrintingAttributeValue) => {
  if (val.fixed_price > 0 && val.unit_price > 0) return `+${val.fixed_price / 100} ثابت | +${val.unit_price / 100} للنسخة`;
  if (val.fixed_price > 0) return `+${val.fixed_price / 100} ج ثابت`;
  if (val.unit_price > 0) return `+${val.unit_price / 100} ج/نسخة`;
  if (val.unit_price < 0) return `${val.unit_price / 100} ج/نسخة`;
  return null;
};

const SelectionGrid = ({
  attribute,
  selectedValueId,
  onChange,
}: {
  attribute: PrintingAttribute;
  selectedValueId?: number;
  onChange: (value: PrintingAttributeValue) => void;
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-4 bg-[#1a1a1a] rounded-b-2xl border-t-0 border border-white/5">
      {attribute.values?.map((val) => {
        const isSelected = selectedValueId === val.id;
        const priceTag = formatPriceInfo(val);

        return (
          <button
            key={val.id}
            onClick={() => onChange(val)}
            className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
              isSelected
                ? "bg-yellow-400 text-black border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.2)]"
                : "bg-[#222222] text-gray-400 border-white/5 hover:border-white/20 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-sm md:text-base">
              {isSelected && <Check size={16} className="text-black shrink-0" />}
              {val.label}
            </div>
            {priceTag && (
              <span className={`text-[10px] md:text-xs font-medium ${isSelected ? "text-black/70" : "text-gray-500"}`}>
                {priceTag}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

const Accordion = ({
  title,
  isOpen,
  onToggle,
  selectedValueText,
  children,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  selectedValueText?: string;
  children: React.ReactNode;
}) => {
  return (
    <div className="mb-4">
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between p-4 rounded-t-2xl transition-colors border ${
          isOpen ? "bg-[#222222] border-white/10" : "bg-[#111111] border-white/5 hover:bg-[#1a1a1a] rounded-b-2xl"
        }`}
      >
        <div className="flex items-center gap-3">
          <span
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              selectedValueText ? "bg-green-500/20 text-green-400" : "bg-white/10 text-gray-400"
            }`}
          >
            {selectedValueText ? <Check size={16} /> : "!"}
          </span>
          <span className="font-bold text-white">{title}</span>
        </div>

        <div className="flex items-center gap-4">
          {selectedValueText && !isOpen && (
            <span className="text-sm font-bold text-yellow-400">{selectedValueText}</span>
          )}
          {isOpen ? <ChevronUp className="text-gray-400" /> : <ChevronDown className="text-gray-400" />}
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const DynamicOptions = ({
  attributes,
  config,
  updateOption,
  removeOption,
  updateDimensions,
  cartItemId,
}: DynamicOptionsProps) => {
  // Only process step: specifications
  const specAttributes = attributes.filter((attr) => attr.step === "specifications");

  const [openSection, setOpenSection] = useState<number | null>(specAttributes.length > 0 ? specAttributes[0].id : null);

  const handleSelect = async (attr: PrintingAttribute, val: PrintingAttributeValue) => {
    // Unlinked files check:
    const oldSelection = config.selectedOptions[attr.id];
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

    // Auto advance to next section
    const currentIndex = specAttributes.findIndex((a) => a.id === attr.id);
    if (currentIndex >= 0 && currentIndex < specAttributes.length - 1) {
      setTimeout(() => {
        setOpenSection(specAttributes[currentIndex + 1].id);
      }, 300);
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

  const widthAttr = specAttributes.find((a) => a.is_dimension_width);
  const lengthAttr = specAttributes.find((a) => a.is_dimension_length);

  return (
    <div className="w-full bg-transparent">
      {specAttributes.map((attr) => {
        if (!checkConditionalRules(attr)) {
           return null;
        }

        if (attr.is_dimension_width || attr.is_dimension_length) {
          return null; 
        }

        const selectedOption = config.selectedOptions[attr.id];
        let selectedLabel = "";
        
        if (selectedOption) {
          const valObj = attr.values?.find((v) => v.id === selectedOption.value_id);
          if (valObj) selectedLabel = valObj.label;
          
          if (attr.type === "multiplier_number" && selectedOption.multiplier_value) {
            selectedLabel += ` (${selectedOption.multiplier_value})`;
          }
        }

        return (
          <Accordion
            key={attr.id}
            title={attr.label}
            isOpen={openSection === attr.id}
            onToggle={() => setOpenSection(openSection === attr.id ? null : attr.id)}
            selectedValueText={selectedLabel}
          >
            {attr.type === "multiplier_number" ? (
              <div className="p-4 bg-[#1a1a1a] rounded-b-2xl border-t-0 border border-white/5">
                <label className="text-sm text-gray-400 font-bold mb-2 block">أدخل القيمة (مثال: عدد الصفحات)</label>
                <input
                  type="number"
                  min={attr.min_value || 1}
                  max={attr.max_value || 9999}
                  className="w-full bg-[#111] text-white p-3 rounded-xl border border-white/10 outline-none focus:border-yellow-400"
                  placeholder="0"
                  value={selectedOption?.multiplier_value || ""}
                  onChange={(e) => {
                    const baseValueId = attr.values?.[0]?.id;
                    if (baseValueId) {
                       updateOption(attr.id, baseValueId, parseInt(e.target.value) || 0);
                    }
                  }}
                />
              </div>
            ) : (
              <SelectionGrid
                attribute={attr}
                selectedValueId={selectedOption?.value_id}
                onChange={(val) => handleSelect(attr, val)}
              />
            )}
          </Accordion>
        );
      })}

      {(widthAttr || lengthAttr) && (
        <div className="p-4 bg-[#111111] rounded-2xl border border-white/5 flex gap-4 mt-4">
          {lengthAttr && (
            <div className="flex-1">
              <label className="text-sm text-gray-400 font-bold mb-2 block">{lengthAttr.label} (سم)</label>
              <input
                type="number"
                value={config.length_mm ? config.length_mm / 10 : ""}
                onChange={(e) => updateDimensions(config.width_mm, (parseFloat(e.target.value) || 0) * 10)}
                className="w-full bg-[#1a1a1a] text-white p-3 rounded-xl border border-white/10 outline-none focus:border-yellow-400"
                placeholder="مثال: 200"
              />
            </div>
          )}
          {widthAttr && (
            <div className="flex-1">
              <label className="text-sm text-gray-400 font-bold mb-2 block">{widthAttr.label} (سم)</label>
              <input
                type="number"
                value={config.width_mm ? config.width_mm / 10 : ""}
                onChange={(e) => updateDimensions((parseFloat(e.target.value) || 0) * 10, config.length_mm)}
                className="w-full bg-[#1a1a1a] text-white p-3 rounded-xl border border-white/10 outline-none focus:border-yellow-400"
                placeholder="مثال: 100"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
