"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, ShoppingCart } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { getProductImageUrl, getTranslatedText } from "@/lib/utils";

export default function ProductCard({ product, categoryName }: { product: any; categoryName: string }) {
  const router = useRouter();
  const { addToCart, addToWishlist, isInWishlist, removeFromWishlist } = useAppContext();
  const inWishlist = isInWishlist(product.id);
  
  const productName = getTranslatedText(product.name);
  const formattedCategoryName = getTranslatedText(categoryName);

  const isConfigurable = 
    product.type === "variable" || 
    Boolean(product.has_variants) || 
    (Array.isArray(product.variants) && product.variants.length > 0) ||
    Boolean(product.addon_groups?.some((g: any) => g.is_required));

  const handleCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isConfigurable) {
      router.push(`/product/${product.slug || product.id}`);
    } else {
      addToCart({ ...product, name: productName });
    }
  };

  return (
    <div className="group bg-[#111111] rounded-3xl p-4 transition-all hover:shadow-xl hover:shadow-black/50 border border-yellow-500/10 hover:border-yellow-500/20">
      <div className="relative aspect-square bg-[#222222] rounded-2xl mb-4 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getProductImageUrl(product)}
          alt={productName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        <button
          onClick={(e) => {
            e.preventDefault();
            inWishlist ? removeFromWishlist(product.id) : addToWishlist(product);
          }}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md shadow-sm shadow-black/30 transition-colors ${
            inWishlist ? "bg-red-500/10 text-red-500" : "bg-white/10 text-gray-500 hover:text-red-500"
          }`}
        >
          <Heart size={18} fill={inWishlist ? "currentColor" : "none"} />
        </button>

        <div className="absolute inset-0 bg-white/5 group-hover:bg-transparent transition-colors pointer-events-none"></div>
      </div>

      <div className="text-right">
        <span className="text-[10px] font-bold text-gray-500 mb-1 block uppercase tracking-widest">
          {formattedCategoryName}
        </span>
        <Link href={`/product/${product.slug || product.id}`}>
          <h3 className="font-bold text-white mb-2 group-hover:text-yellow-400 transition-colors line-clamp-1">
            {productName}
          </h3>
        </Link>
        <div className="flex justify-between items-end mt-4">
          <div className="font-black text-xl text-white">
            {(product.discount_price ?? product.price)?.toFixed(2)} ج.م
          </div>
          <button
            onClick={handleCartClick}
            className="w-10 h-10 bg-yellow-400 text-gray-900 rounded-full flex items-center justify-center hover:bg-yellow-300 hover:text-gray-900 transition-colors shadow-sm shadow-black/30"
          >
            <ShoppingCart size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
