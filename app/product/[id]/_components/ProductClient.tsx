"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { PageTransition } from "@/components/UI/Animations";
import { useAppContext } from "@/context/AppContext";
import {
  Heart,
  ShoppingCart,
  ArrowRight,
  Play,
  Info,
  CheckCircle2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ProductAddonsSelector } from "@/components/ProductAddonsSelector";
import { getTranslatedText } from "@/lib/utils";
import { SelectedAddon } from "@/types/addons";
import { fetchChatSettings, formatWhatsAppUrl } from "@/services/chatService";

export function ProductClient({ initialProduct }: { initialProduct: any }) {
  const router = useRouter();
  const { addToCart, addToWishlist, isInWishlist, removeFromWishlist } =
    useAppContext();
  
  const [product, setProduct] = useState<any>(initialProduct);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"details" | "video">("details");
  const [storeWhatsApp, setStoreWhatsApp] = useState("01000000000");

  useEffect(() => {
    fetchChatSettings().then((s) => {
      if (s?.whatsappNumber) setStoreWhatsApp(s.whatsappNumber);
    });
  }, []);

  // Helper to normalize variant attributes to a clean key-value map
  const normalizeVariantAttributes = (attrs: any): Record<string, string> => {
    if (!attrs) return {};
    let parsed = attrs;
    if (typeof parsed === 'string') {
      try {
        parsed = JSON.parse(parsed);
      } catch {
        return {};
      }
    }
    if (Array.isArray(parsed)) {
      const map: Record<string, string> = {};
      parsed.forEach((item: any) => {
        if (item && typeof item === 'object' && item.name) {
          map[item.name] = String(item.value ?? '');
        }
      });
      return map;
    }
    if (typeof parsed === 'object') {
      const map: Record<string, string> = {};
      Object.entries(parsed).forEach(([k, v]) => {
        map[k] = String(v ?? '');
      });
      return map;
    }
    return {};
  };

  // Variant States
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>(() => {
    if (initialProduct?.variants && initialProduct.variants.length > 0) {
      // Find first variant that is available if possible, or just the first one
      const defaultVariant = initialProduct.variants.find((v: any) => !v.track_inventory || v.quantity > 0 || initialProduct.continue_selling_when_out_of_stock) || initialProduct.variants[0];
      return normalizeVariantAttributes(defaultVariant.attributes);
    }
    return {};
  });

  const activeVariant = useMemo(() => {
    if (!product?.variants || Object.keys(selectedAttributes).length === 0) return null;
    
    return product.variants.find((v: any) => {
      const vAttrs = normalizeVariantAttributes(v.attributes);
      return Object.entries(selectedAttributes).every(([key, val]) => vAttrs[key] === val);
    }) || null;
  }, [product?.variants, selectedAttributes]);
  // Image Gallery
  // Merge main image + images array + variants images if any (variants may not have images currently, but we can support product.images)
  const allImages = useMemo(() => {
    if (!product) return [];
    const imgs: string[] = [];
    if (product.image_url && typeof product.image_url === 'string' && product.image_url.trim() !== '') {
      imgs.push(product.image_url);
    }
    if (product.images && Array.isArray(product.images)) {
      const validUrls = product.images
        .map((img: any) => (typeof img === 'object' && img !== null ? img.url : img))
        .filter((url: any) => typeof url === 'string' && url.trim() !== '');
      imgs.push(...validUrls);
    }
    
    if (imgs.length === 0) imgs.push("/images/fallback.webp");
    return [...new Set(imgs)];
  }, [product]);

  const [activeImage, setActiveImage] = useState(allImages[0]);

  // Addons State
  const [selectedAddons, setSelectedAddons] = useState<SelectedAddon[]>([]);
  const [isAddonsValid, setIsAddonsValid] = useState(true);

  const handleAddonsChange = useCallback((addons: SelectedAddon[], isValid: boolean) => {
    setSelectedAddons(addons);
    setIsAddonsValid(isValid);
  }, []);

  const inWishlist = product ? isInWishlist(product.id) : false;

  // Extract unique attributes from variants
  const availableAttributes = useMemo(() => {
    if (!product?.variants || product.variants.length === 0) return null;
    
    const attrs: Record<string, Set<string>> = {};
    product.variants.forEach((v: any) => {
      const vAttrs = normalizeVariantAttributes(v.attributes);
      Object.entries(vAttrs).forEach(([key, val]) => {
        if (!attrs[key]) attrs[key] = new Set();
        attrs[key].add(val);
      });
    });
    
    const result: Record<string, string[]> = {};
    Object.keys(attrs).forEach(k => {
      result[k] = Array.from(attrs[k]);
    });
    return result;
  }, [product]);

  // Reset quantity if it exceeds new variant's max
  useEffect(() => {
    if (activeVariant) {
      if (product?.continue_selling_when_out_of_stock) return;
      const vQty = activeVariant.track_inventory ? activeVariant.quantity : Infinity;
      if (quantity > vQty) setQuantity(Math.max(1, vQty));
    }
  }, [activeVariant, product]);

  // Current Price & Stock (Dynamic)
  const currentPrice = activeVariant ? (activeVariant.discount_price || activeVariant.price) : (product?.discount_price || product?.price || 0);
  const oldPrice = activeVariant ? (activeVariant.discount_price ? activeVariant.price : null) : (product?.discount_price ? product?.price : null);
  
  // Calculate max cap based on active variant AND addons
  const maxCap = useMemo(() => {
    let cap = Infinity;
    
    // 1. Variant limit
    if (activeVariant && activeVariant.track_inventory) {
      cap = activeVariant.quantity || 0;
    } else if (product && product.track_inventory && product.type !== 'variable') {
      cap = product.quantity || 0;
    }

    // 2. Addons limit
    selectedAddons.forEach(a => {
      if (a.price_multiplier_type === 'per_item' && typeof a.max_quantity === 'number') {
        cap = Math.min(cap, a.max_quantity);
      }
    });

    if (product?.continue_selling_when_out_of_stock) {
      return Infinity;
    }

    return Math.max(0, cap);
  }, [selectedAddons, activeVariant, product]);

  const handleIncreaseQuantity = () => {
    if (quantity < maxCap) {
      setQuantity(q => q + 1);
    }
  };

  useEffect(() => {
    if (quantity > maxCap) {
      setQuantity(Math.max(1, maxCap));
    }
  }, [maxCap, quantity]);

  const handleWhatsAppOrder = () => {
    if (!product) return;
    let variantInfo = "";
    if (activeVariant) {
      variantInfo = " (" + Object.entries(selectedAttributes).map(([k, v]) => {
        const cleanVal = v.includes('|') ? v.split('|')[0] : v;
        return `${k}: ${cleanVal}`;
      }).join(", ") + ")";
    }
    const message = `مرحباً، أود طلب المنتج التالي:\n\nالاسم: ${product.name}${variantInfo}\nالسعر: ${currentPrice} ج.م\nالكمية: ${quantity}\n\nشكراً لك.`;
    const waUrl = formatWhatsAppUrl(storeWhatsApp, message);
    window.open(waUrl, "_blank");
  };

  const handleAddToCart = () => {
    if (product?.type === 'variable' && !activeVariant) {
      toast.error("الرجاء اختيار خصائص المنتج (المقاس، اللون...) قبل الإضافة للسلة");
      return;
    }
    if (maxCap === 0) {
      toast.error("عذراً، المنتج أو المتغير المحدد نفذت كميته");
      return;
    }
    if (!isAddonsValid) {
      toast.error("الرجاء استكمال جميع الخدمات الإضافية الإجبارية ورفع الملفات المطلوبة");
      return;
    }

    // Build a readable variantName (e.g., "M - رمادي" or attributes text)
    const cleanAttrValues = Object.values(selectedAttributes).map(v => v.includes('|') ? v.split('|')[0] : v);
    const variantName = activeVariant?.name
      ? (activeVariant.name.includes('|') ? activeVariant.name.split('-').map((p: string) => p.includes('|') ? p.split('|')[0].trim() : p.trim()).join(' - ') : activeVariant.name)
      : cleanAttrValues.join(' - ');

    // Pass variant info if applicable
    const cartProduct = {
      ...product,
      price: currentPrice,
      variant_id: activeVariant?.id,
      variant_name: variantName,
      variantName: variantName,
      selectedVariant: activeVariant ? { ...activeVariant, attributes: selectedAttributes } : null
    };

    addToCart(cartProduct, quantity, selectedAddons);
  };

  if (!product) {
    return <div className="min-h-screen flex items-center justify-center pt-32 text-red-500">المنتج غير موجود</div>;
  }

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-28 md:pt-32 pb-8 md:pb-12">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-500 hover:text-white mb-8 font-bold transition-colors w-fit"
        >
          <ArrowRight size={20} /> العودة
        </button>

        <div className="bg-[#111111] rounded-[3rem] p-6 md:p-10 shadow-lg shadow-black/40 border border-yellow-500/15 flex flex-col lg:flex-row gap-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-yellow-400/5 to-transparent pointer-events-none"></div>

          {/* Product Image / Video */}
          <div className="lg:w-1/2 flex flex-col gap-4 z-10">
            <div className="relative aspect-square rounded-[2rem] overflow-hidden shadow-md shadow-black/30 bg-[#222222]">
              {activeTab === "video" && product.youtubeLink ? (
                <iframe
                  src={product.youtubeLink}
                  className="w-full h-full"
                  allowFullScreen
                ></iframe>
              ) : (
                <img
                  src={activeImage}
                  alt={product.name}
                  className="w-full h-full object-cover transition-opacity duration-300"
                />
              )}
            </div>

            {/* Image Gallery Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setActiveImage(img);
                      setActiveTab("details");
                    }}
                    className={`w-20 h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-colors ${activeImage === img ? 'border-yellow-400' : 'border-transparent hover:border-gray-600'}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {product.youtubeLink && (
              <div className="flex gap-4 justify-center mt-2">
                <button
                  onClick={() => setActiveTab("details")}
                  className={`px-6 py-2 rounded-full font-bold text-sm transition-colors ${activeTab === "details" ? "bg-gray-900 text-white" : "bg-[#222222] text-gray-400 hover:bg-white/10"}`}
                >
                  صور المنتج
                </button>
                <button
                  onClick={() => setActiveTab("video")}
                  className={`px-6 py-2 rounded-full font-bold text-sm flex items-center gap-2 transition-colors ${activeTab === "video" ? "bg-red-600 text-white" : "bg-[#222222] text-gray-400 hover:bg-white/10"}`}
                >
                  <Play size={16} /> فيديو المنتج
                </button>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="lg:w-1/2 flex flex-col justify-center z-10">
            <div className="mb-2 flex items-center justify-between">
              <span className="inline-block px-3 py-1 bg-yellow-400/15 text-yellow-500 text-xs font-black rounded-full uppercase tracking-widest">
                {getTranslatedText(product.category?.name || "عام")}
              </span>
              
              {/* Stock Status */}
              {(activeVariant?.track_inventory || (product.track_inventory && product.type !== 'variable')) && !product.continue_selling_when_out_of_stock && (
                 <span className={`text-sm font-bold px-3 py-1 rounded-full ${maxCap > 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    {maxCap > 0 && maxCap !== Infinity ? `متوفر (${maxCap})` : maxCap > 0 ? 'متوفر' : 'نفذت الكمية'}
                 </span>
              )}
            </div>

            <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
              {getTranslatedText(product.name)}
            </h1>

            <div className="flex items-center gap-4 mb-8">
               <div className="text-3xl font-black text-yellow-400">
                {currentPrice} <span className="text-lg">ج.م</span>
              </div>
              {oldPrice && (
                 <div className="text-xl font-bold text-gray-500 line-through">
                    {oldPrice} ج.م
                 </div>
              )}
            </div>

            {/* Variants Selection */}
            {product.type === 'variable' && Object.keys(availableAttributes || {}).length > 0 && (
              <div className="mb-8 space-y-4">
                {Object.entries(availableAttributes!).map(([attrName, values]) => (
                  <div key={attrName}>
                    <h4 className="text-white font-bold mb-2">{getTranslatedText(attrName)}</h4>
                    <div className="flex flex-wrap gap-2">
                      {values.map(val => {
                        const isSelected = selectedAttributes[attrName] === val;
                        const hasPipe = val.includes('|');
                        const [displayLabel, hexColor] = hasPipe ? val.split('|') : [val, null];

                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setSelectedAttributes(prev => ({ ...prev, [attrName]: val }))}
                            className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all flex items-center gap-2 ${
                              isSelected 
                                ? 'bg-yellow-400 text-gray-900 border-yellow-400 shadow-md scale-[1.02]' 
                                : 'bg-[#222222] text-gray-300 border-white/10 hover:border-yellow-400/50 hover:text-yellow-400'
                            }`}
                          >
                            {hexColor && (
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0 inline-block shadow-inner"
                                style={{ backgroundColor: hexColor }}
                              />
                            )}
                            <span>{getTranslatedText(displayLabel)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="text-gray-400 font-medium leading-relaxed mb-8 text-lg">
              {getTranslatedText(product.description) || "لا يوجد وصف"}
            </p>

            {product.features && product.features.length > 0 && (
              <div className="bg-[#1a1a1a] rounded-2xl p-6 mb-8 border border-white/[0.06]">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  <Info size={18} className="text-yellow-400" /> مميزات المنتج
                </h3>
                <ul className="grid grid-cols-2 gap-3">
                  {product.features.map((feature: any, idx: number) => (
                    <li
                      key={idx}
                      className="flex items-center gap-2 text-sm text-gray-300 font-medium"
                    >
                      <CheckCircle2 size={16} className="text-green-500" />{" "}
                      {getTranslatedText(feature)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Addons Selector */}
            {product.addon_groups && product.addon_groups.length > 0 && (
              <ProductAddonsSelector
                groups={product.addon_groups}
                currentPrice={currentPrice}
                onSelectionChange={handleAddonsChange}
              />
            )}

            <div className="flex flex-col sm:flex-row gap-4 my-8">
              <div className="flex items-center bg-[#222222] rounded-full p-1 border border-white/[0.08] w-fit">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 shadow-sm shadow-black/30 transition-colors text-gray-400 font-bold"
                >
                  -
                </button>
                <span className="w-12 text-center font-bold text-lg text-white">
                  {quantity}
                </span>
                <button
                  onClick={handleIncreaseQuantity}
                  disabled={quantity >= maxCap}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors font-bold ${quantity >= maxCap ? 'opacity-30 cursor-not-allowed text-gray-500' : 'hover:bg-white/10 shadow-sm shadow-black/30 text-gray-400'}`}
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={maxCap === 0}
                className={`flex-1 px-8 py-4 rounded-full font-bold text-lg transition-transform flex items-center justify-center gap-2 ${maxCap > 0 ? 'bg-yellow-400 text-black hover:bg-yellow-300 hover:scale-[1.02] shadow-xl shadow-black/50' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
              >
                <ShoppingCart size={20} /> {maxCap > 0 ? 'إضافة للسلة' : 'نفذت الكمية'}
              </button>

              <button
                onClick={() =>
                  inWishlist
                    ? removeFromWishlist(product.id)
                    : addToWishlist(product)
                }
                className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors ${
                  inWishlist
                    ? "bg-red-500/10 border-red-500/20 text-red-500"
                    : "bg-[#111111] border-white/[0.08] text-gray-500 hover:border-red-500/20 hover:text-red-500"
                }`}
              >
                <Heart size={24} fill={inWishlist ? "currentColor" : "none"} />
              </button>
            </div>

            <button
              onClick={handleWhatsAppOrder}
              disabled={maxCap === 0}
              className={`w-full px-8 py-4 rounded-full font-bold text-lg flex items-center justify-center gap-2 transition-transform ${maxCap > 0 ? 'bg-[#25D366] text-white hover:bg-[#1ebd5a] hover:scale-[1.02] shadow-xl shadow-black/50' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm.029 18.88c-1.161 0-2.305-.292-3.318-.844l-3.677.964.984-3.595c-.607-1.052-.927-2.246-.926-3.468.001-3.825 3.113-6.937 6.937-6.937 3.825 0 6.938 3.112 6.938 6.937 0 3.824-3.113 6.938-6.938 6.938z" />
              </svg>
              اطلب عبر واتساب
            </button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
