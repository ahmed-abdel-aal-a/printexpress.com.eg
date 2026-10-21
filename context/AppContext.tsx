"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SelectedAddon } from "@/types/addons";
import { 
  fetchActiveCart, 
  migrateLegacyCart, 
  addCartItem, 
  updateCartItemQuantity, 
  removeCartItem,
  applyCartCoupon,
  removeCartCoupon
} from "@/lib/cartApi";
import { addPrintJobToCart } from "@/services/api/printingApi";

type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  youtubeLink?: string;
  slug?: string;
  variant_id?: string;
  variant_name?: string;
  variantName?: string;
};

export type CartItem = Product & { 
  cartItemId: string; 
  quantity: number;
  addons?: SelectedAddon[];
  isPrinting?: boolean;
  item_type?: string;
  printing_options?: any;
};

export type AppliedCoupon = {
  id: number;
  code: string;
  type: 'fixed' | 'percentage';
  value: number;
  min_order_amount?: number | null;
  max_discount_amount?: number | null;
  apply_to_sale_items?: boolean;
};

type AppContextType = {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, addons?: SelectedAddon[]) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  isCartSyncing: boolean;
  sessionId: string;
  refreshCart: () => Promise<void>;
  clearCart: () => void;

  appliedCoupon: AppliedCoupon | null;
  discountAmount: number;
  applyCouponCode: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCouponCode: () => Promise<void>;

  wishlist: Product[];
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;

  user: any;
  setUser: (user: any) => void;
  isChatOpen: boolean;
  setIsChatOpen: (isOpen: boolean) => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

// Fallback UUID generator if crypto.randomUUID is not available
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [cart, setCart] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [syncCount, setSyncCount] = useState(0); // [Fix 1] Counter instead of boolean
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  const [sessionId, setSessionId] = useState<string>('');
  const debounceTimers = useRef<{ [key: string]: NodeJS.Timeout }>({});

  const isCartSyncing = syncCount > 0; // [Fix 1]

  const syncCartStateFromResponse = (cartData: any) => {
    setCart(cartData?.items?.map(mapBackendCartItemToFrontend) || []);
    if (cartData?.coupon) {
      setAppliedCoupon(cartData.coupon);
      setDiscountAmount(Number(cartData.discount_amount || 0));
    } else {
      setAppliedCoupon(null);
      setDiscountAmount(0);
    }
  };

  const mapBackendCartItemToFrontend = (item: any): CartItem => {
    if (item.item_type === 'printing') {
      return {
        cartItemId: String(item.id),
        id: String(item.printing_type_id),
        name: item.custom_product_name || item.printingType?.name || 'منتج طباعة',
        price: Number(item.price || 0),
        image: item.printingType?.image || '',
        category: 'printing',
        quantity: item.quantity,
        item_type: 'printing',
        printing_options: item.printing_options,
        addons: [], 
        isPrinting: true,
      };
    } else {
      const product = item.product || {};
      const variant = item.productVariant || null;
      const price = variant ? (variant.discount_price || variant.price) : (product.discount_price || product.price);
      
      // Extract clean variantName without color hex code
      let variantName = '';
      if (variant) {
        if (variant.name && typeof variant.name === 'string') {
          variantName = variant.name
            .split('-')
            .map((part: string) => part.includes('|') ? part.split('|')[0].trim() : part.trim())
            .join(' - ');
        } else if (variant.attributes) {
          let attrs = variant.attributes;
          if (typeof attrs === 'string') {
            try { attrs = JSON.parse(attrs); } catch { attrs = []; }
          }
          if (Array.isArray(attrs)) {
            variantName = attrs.map((a: any) => {
              const val = String(a.value ?? '');
              return val.includes('|') ? val.split('|')[0] : val;
            }).join(' - ');
          } else if (typeof attrs === 'object') {
            variantName = Object.values(attrs).map((v: any) => {
              const val = String(v ?? '');
              return val.includes('|') ? val.split('|')[0] : val;
            }).join(' - ');
          }
        }
      }

      // Extract image from images array (matching getProductImageUrl logic)
      let productImage = '';
      if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        const firstImage = product.images[0];
        if (typeof firstImage === 'string' && firstImage.trim() !== '') {
          productImage = firstImage;
        } else if (typeof firstImage === 'object' && firstImage !== null && typeof firstImage.url === 'string') {
          productImage = firstImage.url;
        }
      }

      return {
        cartItemId: String(item.id),
        id: String(item.product_id),
        variant_id: variant ? String(variant.id) : undefined,
        variant_name: variantName || item.variant_name || item.variantName || undefined,
        variantName: variantName || item.variant_name || item.variantName || undefined,
        name: product.name || 'منتج غير معروف',
        price: Number(price || 0),
        image: productImage,
        category: product.category?.name || 'غير مصنف',
        quantity: item.quantity,
        item_type: item.item_type,
        addons: item.addons?.map((a: any) => {
          const fileIds = Array.isArray(a.temp_file_ids) ? a.temp_file_ids : (a.temp_file_id ? [a.temp_file_id] : []);
          return {
            addonId: String(a.product_addon_id),
            groupId: a.productAddon?.group_id || 0,
            name: a.productAddon?.name || a.name || a.name_snapshot,
            groupName: a.productAddon?.group?.name || '',
            price: Number(a.price_at_purchase || a.price || a.price_snapshot || 0),
            price_multiplier_type: a.productAddon?.price_multiplier_type || 'per_item',
            requires_upload: a.productAddon?.requires_upload || false,
            temp_file_ids: fileIds,
            temp_file_id: fileIds[0] || undefined,
            preview_urls: a.preview_urls || [],
            max_quantity: a.productAddon?.max_quantity || Infinity
          };
        }) || []
      };
    }
  };

  // 1. Session & Cart Initialization
  useEffect(() => {
    let currentSessionId = localStorage.getItem("X-Session-ID");
    if (!currentSessionId) {
      currentSessionId = generateUUID();
      localStorage.setItem("X-Session-ID", currentSessionId);
    }

    const savedWishlist = localStorage.getItem("wishlist");
    const savedUser = localStorage.getItem("user");

    // Handle Legacy Cart Migration or Fetch Backend Cart
    const initCart = async () => {
      setSessionId(currentSessionId);
      if (savedWishlist) {
        try { setWishlist(JSON.parse(savedWishlist)); } catch (e) {}
      }
      if (savedUser) {
        try { setUser(JSON.parse(savedUser)); } catch (e) {}
      }
      try {
        setSyncCount(prev => prev + 1);
        const legacyCartStr = localStorage.getItem("cart");
        if (legacyCartStr) {
          const legacyItems = JSON.parse(legacyCartStr);
          
          const validLegacyStandardItems = Array.isArray(legacyItems) ? legacyItems.filter((item: any) => 
            item.category !== 'printing' && !item.isPrinting
          ) : [];

          const legacyPrintingItems = Array.isArray(legacyItems) ? legacyItems.filter((item: any) => 
            item.category === 'printing' || item.isPrinting
          ) : [];

          if (validLegacyStandardItems && validLegacyStandardItems.length > 0) {
            // Migrate Standard Items
            const payload = validLegacyStandardItems.map((item: any) => {
              return {
                product_id: item.id,
                variant_id: item.variant_id,
                quantity: item.quantity,
                addons: item.addons?.map((a: any) => {
                  const fileIds = a.temp_file_ids?.length ? a.temp_file_ids : (a.temp_file_id ? [a.temp_file_id] : []);
                  return {
                    product_addon_id: a.addonId,
                    temp_file_ids: fileIds,
                    temp_file_id: fileIds[0] || null
                  };
                })
              };
            });
            await migrateLegacyCart(currentSessionId as string, payload);
          }

          // Migrate Printing Items so they are preserved in server cart
          if (legacyPrintingItems && legacyPrintingItems.length > 0) {
            for (const pItem of legacyPrintingItems) {
              try {
                const printingTypeId = Number(pItem.printing_type_id || pItem.id);
                if (printingTypeId && !isNaN(printingTypeId)) {
                  await addPrintJobToCart({
                    printing_type_id: printingTypeId,
                    quantity: pItem.quantity || 1,
                    selected_options: pItem.printing_options?.selected_options || [],
                    width_mm: pItem.printing_options?.width_mm,
                    length_mm: pItem.printing_options?.length_mm,
                    image_count: pItem.printing_options?.image_count,
                    notes: pItem.printing_options?.notes || pItem.notes,
                    temp_file_ids: pItem.printing_options?.temp_file_ids || [],
                    session_id: currentSessionId as string,
                  });
                }
              } catch (pErr) {
                console.error("Failed to migrate legacy printing item:", pErr);
              }
            }
          }

          // Fetch unified server cart containing both standard and printing items
          const res = await fetchActiveCart(currentSessionId as string);
          syncCartStateFromResponse(res.cart);
          localStorage.removeItem("cart"); // Safely clear legacy after full migration
        } else {
          // Fetch existing server cart
          const res = await fetchActiveCart(currentSessionId as string);
          syncCartStateFromResponse(res.cart);
        }
      } catch (error) {
        console.error("Failed to sync cart on load:", error);
      } finally {
        setSyncCount(prev => prev - 1);
      }
    };

    initCart();
  }, []);

  // Sync wishlist & user to localStorage
  useEffect(() => {
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  // Actions
  const addToCart = async (product: Product, quantity = 1, addons: SelectedAddon[] = []) => {
    if (!sessionId) return;
    
    const buildAddonsHash = (itemAddons: SelectedAddon[] = []) => {
      return itemAddons.map(a => {
        const fileIds = a.temp_file_ids?.length ? a.temp_file_ids : (a.temp_file_id ? [a.temp_file_id] : []);
        const sortedFiles = [...fileIds].sort().join(',');
        return `${a.addonId}:${sortedFiles || 'none'}`;
      }).sort().join('|');
    };

    const addonsHashString = buildAddonsHash(addons);
    const tempCartItemId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const maxCap = addons.reduce((cap, a) => {
      if (a.price_multiplier_type === 'per_item' && typeof a.max_quantity === 'number') {
        return Math.min(cap, a.max_quantity);
      }
      return cap;
    }, Infinity);

    // [Fix 3] Capture previous state for strict optimistic rollback
    const previousCart = [...cart];

    // Optimistic Update
    setCart((prev) => {
      const existingIdx = prev.findIndex(item => 
        item.id === product.id && 
        item.variant_id === product.variant_id &&
        buildAddonsHash(item.addons) === addonsHashString
      );

      if (existingIdx >= 0) {
        const newCart = [...prev];
        const newQuantity = Math.min(newCart[existingIdx].quantity + quantity, maxCap);
        newCart[existingIdx] = { ...newCart[existingIdx], quantity: newQuantity };
        return newCart;
      }
      return [...prev, { ...product, quantity, cartItemId: tempCartItemId, addons }];
    });
    
    setIsCartOpen(true);
    setSyncCount(prev => prev + 1);

    try {
      // Background Server Call
      await addCartItem(sessionId, {
        product_id: product.id,
        variant_id: product.variant_id,
        quantity,
        addons: addons.map(a => {
          const fileIds = a.temp_file_ids?.length ? a.temp_file_ids : (a.temp_file_id ? [a.temp_file_id] : []);
          return {
            product_addon_id: a.addonId,
            temp_file_ids: fileIds,
            temp_file_id: fileIds[0] || null
          };
        })
      });
      
      // Refresh to get real IDs and exact DB state
      const res = await fetchActiveCart(sessionId);
      syncCartStateFromResponse(res.cart);
    } catch (error) {
      console.error("Failed to add to cart on server:", error);
      // [Fix 3] Strict Optimistic Rollback
      setCart(previousCart);
    } finally {
      setSyncCount(prev => Math.max(0, prev - 1));
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    if (!sessionId) return;

    // [Fix 3] Capture previous state for strict optimistic rollback
    const previousCart = [...cart];

    // Optimistic Update
    setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
    
    // Ignore temporary items that haven't synced
    if (!cartItemId.startsWith('temp-')) {
      setSyncCount(prev => prev + 1);
      try {
        await removeCartItem(sessionId, cartItemId);
        // Refresh silently
        const res = await fetchActiveCart(sessionId);
        syncCartStateFromResponse(res.cart);
      } catch (error) {
        console.error("Failed to remove item on server:", error);
        // [Fix 3] Strict Optimistic Rollback
        setCart(previousCart);
      } finally {
        setSyncCount(prev => Math.max(0, prev - 1));
      }
    }
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }

    // [Fix 3] Capture previous state for strict optimistic rollback
    const previousCart = [...cart];

    // Optimistic Update
    setCart((prev) =>
      prev.map((item) => {
        if (item.cartItemId === cartItemId) {
          let maxCap = Infinity;
          item.addons?.forEach(a => {
            if (a.price_multiplier_type === 'per_item' && typeof a.max_quantity === 'number') {
              maxCap = Math.min(maxCap, a.max_quantity);
            }
          });
          return { ...item, quantity: Math.min(quantity, maxCap) };
        }
        return item;
      })
    );

    if (cartItemId.startsWith('temp-')) return; 

    // Debounce Server Call
    if (debounceTimers.current[cartItemId]) {
      clearTimeout(debounceTimers.current[cartItemId]);
    } else {
      // نرفع العداد مرة واحدة فقط في بداية الـ Debounce
      setSyncCount(prev => prev + 1); 
    }

    debounceTimers.current[cartItemId] = setTimeout(async () => {
      try {
        await updateCartItemQuantity(sessionId, cartItemId, quantity);
        // Silently refresh to ensure data consistency
        const res = await fetchActiveCart(sessionId);
        syncCartStateFromResponse(res.cart);
      } catch (error) {
        console.error("Failed to update quantity on server:", error);
        // [Fix 3] Strict Optimistic Rollback
        setCart(previousCart);
      } finally {
        setSyncCount(prev => Math.max(0, prev - 1));
        delete debounceTimers.current[cartItemId];
      }
    }, 500);
  };

  const addToWishlist = (product: Product) => {
    setWishlist((prev) => {
      if (prev.find((item) => item.id === product.id)) return prev;
      return [...prev, product];
    });
  };

  const removeFromWishlist = (productId: string) => {
    setWishlist((prev) => prev.filter((item) => item.id !== productId));
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some((item) => item.id === productId);
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
    setDiscountAmount(0);
  };

  const refreshCart = async () => {
    if (!sessionId) return;
    setSyncCount(prev => prev + 1);
    try {
      const res = await fetchActiveCart(sessionId);
      syncCartStateFromResponse(res.cart);
    } catch (error) {
      console.error("Failed to refresh cart:", error);
    } finally {
      setSyncCount(prev => Math.max(0, prev - 1));
    }
  };

  const applyCouponCode = async (code: string): Promise<{ success: boolean; message: string }> => {
    if (!sessionId) return { success: false, message: 'الجلسة غير صالحة، يرجى تحديث الصفحة' };
    setSyncCount(prev => prev + 1);
    try {
      const res = await applyCartCoupon(sessionId, code);
      syncCartStateFromResponse(res.cart);
      return { success: true, message: res.message || 'تم تطبيق كود الخصم بنجاح' };
    } catch (err: any) {
      let msg = err.response?.data?.message || err.response?.data?.error;
      if (err.response?.data?.errors?.coupon?.[0]) {
        msg = err.response.data.errors.coupon[0];
      }
      return { success: false, message: msg || 'فشل تطبيق كود الخصم' };
    } finally {
      setSyncCount(prev => Math.max(0, prev - 1));
    }
  };

  const removeCouponCode = async (): Promise<void> => {
    if (!sessionId) return;
    setSyncCount(prev => prev + 1);
    try {
      const res = await removeCartCoupon(sessionId);
      syncCartStateFromResponse(res.cart);
    } catch (err) {
      console.error('Failed to remove coupon:', err);
    } finally {
      setSyncCount(prev => Math.max(0, prev - 1));
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AppContext.Provider
        value={{
          cart,
          addToCart,
          removeFromCart,
          updateQuantity,
          isCartOpen,
          setIsCartOpen,
          isCartSyncing,
          sessionId,
          refreshCart,
          clearCart,
          appliedCoupon,
          discountAmount,
          applyCouponCode,
          removeCouponCode,
          wishlist,
          addToWishlist,
          removeFromWishlist,
          isInWishlist,
          user,
          setUser,
          isChatOpen,
          setIsChatOpen,
        }}
      >
        {children}
      </AppContext.Provider>
    </QueryClientProvider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}
