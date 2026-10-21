"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Filter, ShoppingCart, Heart, Search, Loader2 } from "lucide-react";
import { PageTransition } from "@/components/UI/Animations";
import { useAppContext } from "@/context/AppContext";
import { fetchCategories, fetchProducts } from "@/lib/api";
import { getProductImageUrl } from "@/lib/utils";

export default function ShopClient({ initialProducts = [], initialCategories = [] }: { initialProducts: any[], initialCategories: any[] }) {
  const { addToCart, addToWishlist, isInWishlist, removeFromWishlist } =
    useAppContext();
  const [activeCategory, setActiveCategory] = useState("الكل");
  
  // Local state for fast typing, debounced state for API calls
  const [localPriceRange, setLocalPriceRange] = useState<{min: number, max?: number}>({ min: 0 });
  const [debouncedPriceRange, setDebouncedPriceRange] = useState<{min: number, max?: number}>({ min: 0 });
  
  const [localSearch, setLocalSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [categories, setCategories] = useState<{ id: number; name: string }[]>(initialCategories);
  const [products, setProducts] = useState<any[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialProducts.length >= 20);
  
  // Track if this is the initial render to prevent duplicate fetching
  const [isInitialRender, setIsInitialRender] = useState(true);

  // Debounce logic
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedPriceRange(localPriceRange);
      setDebouncedSearch(localSearch);
    }, 500);
    return () => clearTimeout(handler);
  }, [localPriceRange, localSearch]);

  useEffect(() => {
    async function loadFilteredData() {
      if (isInitialRender) {
        setIsInitialRender(false);
        return; // Skip fetching on first mount since we have initial SSR props
      }
      setLoading(true);
      try {
        const prods = await fetchProducts(1, activeCategory, debouncedPriceRange.min, debouncedPriceRange.max, debouncedSearch);
        setProducts(prods || []);
        setPage(1);
        if (prods && prods.length < 20) setHasMore(false);
        else setHasMore(true);
      } catch (error) {
        console.error("Failed to load filtered data", error);
      }
      setLoading(false);
    }
    loadFilteredData();
  }, [activeCategory, debouncedPriceRange, debouncedSearch]);

  const loadMore = async () => {
    const nextPage = page + 1;
    const moreProds = await fetchProducts(nextPage, activeCategory, debouncedPriceRange.min, debouncedPriceRange.max, debouncedSearch);
    if (moreProds && moreProds.length > 0) {
      setProducts(prev => [...prev, ...moreProds]);
      setPage(prev => prev + 1);
      if (moreProds.length < 20) setHasMore(false);
    } else {
      setHasMore(false);
    }
  };

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-28 md:pt-32 pb-8 md:pb-12 flex flex-col md:flex-row gap-8">
        {/* Mobile Filter Toggle */}
        <div className="md:hidden flex justify-between items-center bg-[#111111] p-4 rounded-2xl shadow-sm shadow-black/30 border border-yellow-500/20">
          <span className="font-bold">تصفية النتائج</span>
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="p-2 bg-yellow-400/10 text-yellow-400 rounded-xl"
          >
            <Filter size={20} />
          </button>
        </div>

        {/* Sidebar Filters */}
        <aside
          className={`md:w-64 shrink-0 ${isFilterOpen ? "block" : "hidden md:block"}`}
        >
          <div className="bg-[#111111] p-6 rounded-3xl shadow-sm shadow-black/30 border border-yellow-500/15 sticky top-24">
            <h3 className="font-black text-lg mb-6 flex items-center gap-2">
              <Filter size={20} className="text-yellow-400" />
              التصنيفات
            </h3>

            <div className="flex flex-col gap-2 mb-8">
              <button
                onClick={() => setActiveCategory("الكل")}
                className={`text-right px-4 py-2 rounded-xl font-bold transition-colors ${
                  activeCategory === "الكل"
                    ? "bg-yellow-400 text-gray-900"
                    : "text-gray-500 hover:bg-yellow-400/10"
                }`}
              >
                الكل
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id.toString())}
                  className={`text-right px-4 py-2 rounded-xl font-bold transition-colors ${
                    activeCategory === cat.id.toString()
                      ? "bg-yellow-400 text-gray-900"
                      : "text-gray-500 hover:bg-yellow-400/10"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <h3 className="font-black text-lg mb-6">نطاق السعر</h3>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={localPriceRange.min}
                  onChange={(e) =>
                    setLocalPriceRange({
                      ...localPriceRange,
                      min: Number(e.target.value),
                    })
                  }
                  className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-center focus:outline-none focus:border-yellow-400"
                  placeholder="من"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="number"
                  value={localPriceRange.max || ""}
                  onChange={(e) =>
                    setLocalPriceRange({
                      ...localPriceRange,
                      max: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-center focus:outline-none focus:border-yellow-400"
                  placeholder="إلى"
                />
              </div>
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-8 bg-[#111111] p-4 rounded-2xl shadow-sm shadow-black/30 border border-yellow-500/15">
            <p className="font-bold text-gray-500">
              عرض{" "}
              <span className="text-white">{products.length}</span>{" "}
              منتجات
            </p>

            <div className="relative w-64 hidden sm:block">
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="ابحث عن منتج..."
                className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-yellow-400"
              />
              <Search
                size={18}
                className="absolute left-3 top-2.5 text-gray-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {products.map((product: any, index: number) => {
              const inWishlist = isInWishlist(product.id);
              return (
                <div
                  key={product.id}
                  className="group bg-[#111111] rounded-3xl p-4 transition-all hover:shadow-xl hover:shadow-black/50 border border-yellow-500/10 hover:border-yellow-500/20"
                >
                  <div className="relative aspect-square bg-[#222222] rounded-2xl mb-4 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getProductImageUrl(product)}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        inWishlist
                          ? removeFromWishlist(product.id)
                          : addToWishlist(product);
                      }}
                      className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md shadow-sm shadow-black/30 transition-colors ${
                        inWishlist
                          ? "bg-red-500/10 text-red-500"
                          : "bg-white/10 text-gray-500 hover:text-red-500"
                      }`}
                    >
                      <Heart
                        size={18}
                        fill={inWishlist ? "currentColor" : "none"}
                      />
                    </button>

                    <div className="absolute inset-0 bg-white/5 group-hover:bg-transparent transition-colors pointer-events-none"></div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold text-gray-500 mb-1 block uppercase tracking-widest">
                      {categories.find(c => c.id === product.category_id)?.name || "بدون تصنيف"}
                    </span>
                    <Link href={`/product/${product.slug || product.id}`}>
                      <h3 className="font-bold text-white mb-2 group-hover:text-yellow-400 transition-colors line-clamp-1">
                        {product.name}
                      </h3>
                    </Link>
                    <div className="flex justify-between items-end mt-4">
                      <div className="font-black text-xl text-white">
                        {(product.discount_price ?? product.price)?.toFixed(2)} ج.م
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          addToCart(product);
                        }}
                        className="w-10 h-10 bg-yellow-400 text-gray-900 rounded-full flex items-center justify-center hover:bg-yellow-300 hover:text-gray-900 transition-colors shadow-sm shadow-black/30"
                      >
                        <ShoppingCart size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {loading && (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-yellow-400" size={32} />
            </div>
          )}

          {!loading && products.length === 0 && (
            <div className="bg-[#111111] p-12 rounded-3xl text-center border border-yellow-500/15 flex flex-col items-center justify-center">
              <Filter size={48} className="text-gray-500 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">
                لا توجد منتجات
              </h3>
              <p className="text-gray-500">
                حاول تغيير خيارات التصفية أو نطاق السعر للبحث عن المزيد.
              </p>
            </div>
          )}

          {!loading && hasMore && (
            <div className="flex justify-center mt-8">
               <button 
                  onClick={loadMore}
                  className="bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 px-6 py-2 rounded-full font-bold hover:bg-yellow-400 hover:text-black transition-colors"
               >
                 تحميل المزيد
               </button>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
