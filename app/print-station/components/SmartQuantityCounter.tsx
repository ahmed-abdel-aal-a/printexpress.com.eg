"use client";

import React, { useState, useEffect } from "react";
import { Plus, Minus } from "lucide-react";

interface SmartQuantityCounterProps {
  quantity: number;
  minQuantity?: number;
  maxQuantity?: number | null;
  quantityStep?: number;
  onChange: (qty: number) => void;
}

export const SmartQuantityCounter: React.FC<SmartQuantityCounterProps> = ({
  quantity,
  minQuantity = 1,
  maxQuantity,
  quantityStep = 1,
  onChange,
}) => {
  const minQty = Math.max(1, minQuantity);
  const stepQty = Math.max(1, quantityStep);
  const maxQty = (maxQuantity && Number(maxQuantity) > 0) ? Number(maxQuantity) : Infinity;

  const [inputValue, setInputValue] = useState<string>(String(quantity));

  // Sync internal state when external quantity changes
  useEffect(() => {
    setInputValue(String(quantity));
  }, [quantity]);

  const clampAndAlign = (val: number): number => {
    if (isNaN(val) || val < minQty) {
      return minQty;
    }
    if (val > maxQty) {
      return maxQty;
    }
    // Align to step multiple if needed
    const offset = val - minQty;
    const remainder = offset % stepQty;
    if (remainder !== 0) {
      // Round to nearest multiple
      const roundedOffset = Math.round(offset / stepQty) * stepQty;
      return minQty + roundedOffset;
    }
    return val;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Allow empty string or digits only for smooth typing
    if (raw === "" || /^[0-9]+$/.test(raw)) {
      setInputValue(raw);
      if (raw !== "") {
        const parsed = parseInt(raw, 10);
        if (!isNaN(parsed) && parsed > 0) {
          onChange(parsed);
        }
      }
    }
  };

  const handleBlur = () => {
    const parsed = parseInt(inputValue, 10);
    const clamped = clampAndAlign(parsed);
    setInputValue(String(clamped));
    onChange(clamped);
  };

  const handleIncrement = () => {
    const next = clampAndAlign(quantity + stepQty);
    setInputValue(String(next));
    onChange(next);
  };

  const handleDecrement = () => {
    const prev = clampAndAlign(Math.max(minQty, quantity - stepQty));
    setInputValue(String(prev));
    onChange(prev);
  };

  const handlePresetSelect = (preset: number) => {
    const clamped = clampAndAlign(preset);
    setInputValue(String(clamped));
    onChange(clamped);
  };

  // Strictly generate presets using: Preset = min_quantity + (multiplier * quantity_step)
  const generatePresets = (): number[] => {
    const presets = new Set<number>();
    // Multiplier 0: The exact minimum quantity
    presets.add(minQty);

    // Multipliers tailored to create convenient intervals based on scale
    const baseScale = Math.max(1, Math.floor(minQty / stepQty));
    const dynamicMultipliers = [
      Math.max(1, Math.round(baseScale * 0.5)),
      Math.max(2, baseScale),
      Math.max(4, baseScale * 2),
      Math.max(8, baseScale * 4),
      Math.max(16, baseScale * 9),
      Math.max(20, baseScale * 19),
    ];

    for (const m of dynamicMultipliers) {
      const candidate = minQty + (m * stepQty);
      if (candidate <= maxQty && candidate > minQty) {
        presets.add(candidate);
      }
    }

    // Additional standard step multiples if set is small
    const stepMultipliers = [1, 2, 5, 10, 20, 50, 100];
    for (const sm of stepMultipliers) {
      if (presets.size >= 5) break;
      const candidate = minQty + (sm * stepQty);
      if (candidate <= maxQty && candidate > minQty) {
        presets.add(candidate);
      }
    }

    return Array.from(presets).sort((a, b) => a - b).slice(0, 5);
  };

  const presets = generatePresets();

  return (
    <div className="p-6 rounded-3xl border border-white/10 bg-[#111111] flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div>
          <label className="block text-sm font-bold text-gray-300">الكمية المطلوبة</label>
          <span className="text-xs text-gray-500 font-medium">
            الحد الأدنى: {minQty.toLocaleString()} {stepQty > 1 && `(الزيادة بمضاعفات ${stepQty})`}
          </span>
        </div>
        <div className="px-3 py-1 bg-yellow-400/10 border border-yellow-400/20 rounded-full text-xs font-bold text-yellow-400">
          x{quantity.toLocaleString()} قطعة
        </div>
      </div>

      {/* Main Counter Controller */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={quantity <= minQty}
          className="w-14 h-14 rounded-2xl bg-[#1a1a1a] hover:bg-[#252525] active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 flex items-center justify-center text-white transition-all shadow-md group"
          aria-label="تقليل الكمية"
        >
          <Minus size={22} className="group-hover:scale-110 transition-transform" />
        </button>

        <div className="flex-1 relative">
          <input
            type="text"
            inputMode="numeric"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleBlur();
              }
            }}
            placeholder={String(minQty)}
            className="w-full h-14 bg-[#1a1a1a] text-white text-center rounded-2xl border-2 border-white/10 outline-none focus:border-yellow-400 font-black text-2xl tracking-wider transition-all"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500 pointer-events-none">
            قطعة
          </span>
        </div>

        <button
          type="button"
          onClick={handleIncrement}
          disabled={quantity >= maxQty}
          className="w-14 h-14 rounded-2xl bg-yellow-400 hover:bg-yellow-300 active:scale-95 text-black disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all shadow-lg shadow-yellow-400/10 group"
          aria-label="زيادة الكمية"
        >
          <Plus size={22} className="font-bold group-hover:scale-110 transition-transform" />
        </button>
      </div>

      {/* Quick Preset Buttons */}
      {presets.length > 1 && (
        <div className="pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-500 font-semibold ml-1">كميات شائعة:</span>
            {presets.map((p) => {
              const isSelected = quantity === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => handlePresetSelect(p)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    isSelected
                      ? "bg-yellow-400 text-black border-yellow-400 shadow-md shadow-yellow-400/20"
                      : "bg-[#1a1a1a] text-gray-400 border-white/5 hover:border-white/20 hover:text-white"
                  }`}
                >
                  {p.toLocaleString()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
