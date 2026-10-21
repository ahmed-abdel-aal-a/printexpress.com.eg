"use client";

import React, { useState, useEffect, useRef } from "react";
import { Filter, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { DEFAULT_MIN_PRICE, DEFAULT_MAX_PRICE } from "@/lib/constants";
import { getTranslatedText } from "@/lib/utils";

export default function ShopFilters({ categories }: { categories: any[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize from URL
  const [activeCategory, setActiveCategory] = useState(searchParams.get("category") || "الكل");
  const [localPriceRange, setLocalPriceRange] = useState<{ min: number; max?: number }>({
    min: searchParams.has("minPrice") ? Number(searchParams.get("minPrice")) : DEFAULT_MIN_PRICE,
    max: searchParams.has("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
  });
  const [localSearch, setLocalSearch] = useState(searchParams.get("search") || "");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Sync state when URL changes externally (e.g., Back button)
  const isUpdatingUrl = useRef(false);
  
  useEffect(() => {
    if (isUpdatingUrl.current) {
      isUpdatingUrl.current = false;
      return;
    }
    // External change! Sync local state
    setActiveCategory(searchParams.get("category") || "الكل");
    setLocalSearch(searchParams.get("search") || "");
    setLocalPriceRange({
      min: searchParams.has("minPrice") ? Number(searchParams.get("minPrice")) : DEFAULT_MIN_PRICE,
      max: searchParams.has("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
    });
  }, [searchParams]);

  // Debounced push to URL
  const initialMount = useRef(true);
  
  useEffect(() => {
    if (initialMount.current) {
      initialMount.current = false;
      return;
    }

    const handler = setTimeout(() => {
      const newParams = new URLSearchParams();
      if (activeCategory !== "الكل") newParams.set("category", activeCategory);
      if (localPriceRange.min > 0) newParams.set("minPrice", localPriceRange.min.toString());
      if (localPriceRange.max && localPriceRange.max !== DEFAULT_MAX_PRICE) newParams.set("maxPrice", localPriceRange.max.toString());
      if (localSearch) newParams.set("search", localSearch);

      if (newParams.toString() !== searchParams.toString()) {
        isUpdatingUrl.current = true; // flag to ignore the next searchParams change
        router.push(`?${newParams.toString()}`, { scroll: false });
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [activeCategory, localPriceRange, localSearch, router, searchParams]);

  return (
    <aside className={`md:w-64 shrink-0 ${isFilterOpen ? "block" : "hidden md:block"}`}>
      <div className="md:hidden flex justify-between items-center bg-[#111111] p-4 rounded-2xl shadow-sm shadow-black/30 border border-yellow-500/20 mb-4">
        <span className="font-bold">تصفية النتائج</span>
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="p-2 bg-yellow-400/10 text-yellow-400 rounded-xl"
        >
          <Filter size={20} />
        </button>
      </div>

      <div className="bg-[#111111] p-6 rounded-3xl shadow-sm shadow-black/30 border border-yellow-500/15 sticky top-24">
        {/* Search */}
        <div className="relative w-full mb-8">
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="ابحث عن منتج..."
            className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-yellow-400"
          />
          <Search size={18} className="absolute left-3 top-2.5 text-gray-500" />
        </div>

        <h3 className="font-black text-lg mb-6 flex items-center gap-2">
          <Filter size={20} className="text-yellow-400" />
          التصنيفات
        </h3>

        <div className="flex flex-col gap-2 mb-8">
          <button
            onClick={() => setActiveCategory("الكل")}
            className={`text-right px-4 py-2 rounded-xl font-bold transition-colors ${
              activeCategory === "الكل" ? "bg-yellow-400 text-gray-900" : "text-gray-500 hover:bg-yellow-400/10"
            }`}
          >
            الكل
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id.toString())}
              className={`text-right px-4 py-2 rounded-xl font-bold transition-colors ${
                activeCategory === cat.id.toString() ? "bg-yellow-400 text-gray-900" : "text-gray-500 hover:bg-yellow-400/10"
              }`}
            >
              {getTranslatedText(cat.name)}
            </button>
          ))}
        </div>

        <h3 className="font-black text-lg mb-6">نطاق السعر</h3>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={localPriceRange.min}
              onChange={(e) => setLocalPriceRange({ ...localPriceRange, min: Number(e.target.value) })}
              className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-center focus:outline-none focus:border-yellow-400"
              placeholder="من"
            />
            <span className="text-gray-500">-</span>
            <input
              type="number"
              value={localPriceRange.max || ""}
              onChange={(e) =>
                setLocalPriceRange({ ...localPriceRange, max: e.target.value ? Number(e.target.value) : undefined })
              }
              className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-center focus:outline-none focus:border-yellow-400"
              placeholder="إلى"
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
