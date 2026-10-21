"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, Package, FolderOpen, ArrowLeft, Printer, X } from "lucide-react";
import { getProductImageUrl, getTranslatedText } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function SearchOverlay({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [printingTypes, setPrintingTypes] = useState<any[]>([]);
  const [productSuggestions, setProductSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Focus input when opened
      setTimeout(() => inputRef.current?.focus(), 100);
      
      // Fetch store categories if not fetched
      if (categories.length === 0) {
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2080/api/v1'}/storefront/categories`)
          .then(res => res.json())
          .then(json => setCategories(json.data || []))
          .catch(console.error);
      }

      // Fetch printing categories and subcategories if not fetched
      if (printingTypes.length === 0) {
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2080/api/v1'}/storefront/printing-product-types`)
          .then(res => res.json())
          .then(json => {
            const data = Array.isArray(json) ? json : (json.data || []);
            setPrintingTypes(data);
          })
          .catch(console.error);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      const clearTimer = setTimeout(() => {
        setProductSuggestions([]);
        setIsSearching(false);
      }, 0);
      return () => clearTimeout(clearTimer);
    }

    const timer = setTimeout(() => {
      setIsSearching(true);
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2080/api/v1'}/storefront/products?search=${encodeURIComponent(trimmed)}`)
        .then(res => res.json())
        .then(data => {
          setProductSuggestions(data.data?.slice(0, 5) || []);
          setIsSearching(false);
        })
        .catch(() => setIsSearching(false));
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (query.trim()) {
      router.push(`/shop?search=${encodeURIComponent(query)}`);
      onClose();
    } else {
      router.push("/shop");
      onClose();
    }
  };

  const lowerQuery = query.trim().toLowerCase();

  // Matched Store Categories
  const matchedCategories = lowerQuery 
    ? categories.filter(c => c.name.toLowerCase().includes(lowerQuery)).slice(0, 3) 
    : [];

  // Matched Printing Categories (Main & Sub)
  let matchedPrintingItems: any[] = [];
  if (lowerQuery) {
    printingTypes.forEach(mainCat => {
      if (mainCat.name.toLowerCase().includes(lowerQuery)) {
        matchedPrintingItems.push({ type: 'main', item: mainCat });
      }
      if (mainCat.printing_types) {
        mainCat.printing_types.forEach((subType: any) => {
          if (subType.name.toLowerCase().includes(lowerQuery)) {
            matchedPrintingItems.push({ type: 'sub', item: subType, parent: mainCat.name });
          }
        });
      }
    });
    matchedPrintingItems = matchedPrintingItems.slice(0, 4); // Limit to 4 results
  }

  const hasNoResults = query.trim() !== "" && matchedCategories.length === 0 && matchedPrintingItems.length === 0 && productSuggestions.length === 0 && !isSearching;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex flex-col pt-16 md:pt-24 px-4"
        >
          <div className="absolute top-6 right-6 z-50">
            <button 
              onClick={onClose}
              className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="w-full max-w-3xl mx-auto flex flex-col flex-1">
            <form onSubmit={handleSearch} className="relative w-full mb-6">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث عن منتج، نوع طباعة..."
                className="w-full bg-[#111111] border-2 border-yellow-400/50 rounded-2xl pl-16 pr-6 py-5 md:py-6 text-xl md:text-2xl font-bold text-white focus:outline-none focus:border-yellow-400 transition-colors shadow-[0_0_30px_rgba(250,204,21,0.15)]"
                autoFocus
              />
              <button type="submit" className="absolute left-6 top-1/2 -translate-y-1/2 text-yellow-400 hover:scale-110 transition-transform">
                {isSearching ? (
                  <Loader2 size={32} className="animate-spin" />
                ) : (
                  <Search size={32} />
                )}
              </button>
            </form>

            {/* Results Container */}
            {query.trim().length > 0 && (
              <div className="bg-[#111111] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex-1 max-h-[60vh] overflow-y-auto custom-scrollbar">
                
                {hasNoResults && (
                  <div className="p-8 text-center flex flex-col items-center justify-center h-full">
                    <Search size={48} className="text-gray-600 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">لا توجد نتائج مطابقة</h3>
                    <p className="text-gray-400">حاول استخدام كلمات بحث مختلفة</p>
                  </div>
                )}

                {/* Printing Station Results */}
                {matchedPrintingItems.length > 0 && (
                  <div className="border-b border-white/[0.04]">
                    <div className="px-6 py-3 text-sm font-black text-gray-500 bg-black/40">منصة الطباعة</div>
                    {matchedPrintingItems.map((match, idx) => (
                      <button
                        key={`print-${idx}`}
                        type="button"
                        onClick={() => {
                          router.push(`/print-station`);
                          onClose();
                        }}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors text-right group border-b border-white/[0.02] last:border-0"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                            <Printer size={20} className="text-blue-400" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-lg text-gray-200 group-hover:text-blue-400 transition-colors">{getTranslatedText(match.item.name)}</span>
                            {match.type === 'sub' && <span className="text-sm text-gray-500">في قسم: {getTranslatedText(match.parent)}</span>}
                          </div>
                        </div>
                        <ArrowLeft size={20} className="text-gray-600 group-hover:text-blue-400 transition-colors" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Store Categories Results */}
                {matchedCategories.length > 0 && (
                  <div className="border-b border-white/[0.04]">
                    <div className="px-6 py-3 text-sm font-black text-gray-500 bg-black/40">أقسام المتجر الجاهزة</div>
                    {matchedCategories.map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          router.push(`/shop?category=${cat.id}`);
                          onClose();
                        }}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors text-right group border-b border-white/[0.02] last:border-0"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-yellow-400/10 flex items-center justify-center">
                            <FolderOpen size={20} className="text-yellow-400" />
                          </div>
                          <span className="font-bold text-lg text-gray-200 group-hover:text-yellow-400 transition-colors">{getTranslatedText(cat.name)}</span>
                        </div>
                        <ArrowLeft size={20} className="text-gray-600 group-hover:text-yellow-400 transition-colors" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Store Products Results */}
                {productSuggestions.length > 0 && (
                  <div>
                    <div className="px-6 py-3 text-sm font-black text-gray-500 bg-black/40">المنتجات الجاهزة</div>
                    {productSuggestions.map(prod => (
                      <button
                        key={prod.id}
                        type="button"
                        onClick={() => {
                          router.push(`/product/${prod.slug || prod.id}`);
                          onClose();
                        }}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors text-right group border-b border-white/[0.02] last:border-0"
                      >
                        <div className="flex items-center gap-4">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={getProductImageUrl(prod)} 
                            alt={getTranslatedText(prod.name)} 
                            className="w-12 h-12 rounded-xl object-cover border border-white/10" 
                          />
                          <div className="flex flex-col">
                            <span className="font-bold text-lg text-gray-200 group-hover:text-yellow-400 transition-colors truncate max-w-[250px] md:max-w-[400px]">{getTranslatedText(prod.name)}</span>
                            <span className="text-sm font-bold text-gray-500">{(prod.discount_price ?? prod.price)?.toFixed(2)} ج.م</span>
                          </div>
                        </div>
                        <ArrowLeft size={20} className="text-gray-600 group-hover:text-yellow-400 transition-colors" />
                      </button>
                    ))}
                  </div>
                )}
                
                {(matchedCategories.length > 0 || matchedPrintingItems.length > 0 || productSuggestions.length > 0) && (
                  <button
                    type="submit"
                    onClick={handleSearch}
                    className="w-full p-5 bg-yellow-400/10 text-yellow-400 font-bold text-lg hover:bg-yellow-400 hover:text-black transition-colors"
                  >
                    عرض جميع نتائج المتجر لـ &quot;{query}&quot;
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
