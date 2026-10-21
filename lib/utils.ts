import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getTranslatedText(field: any, locale: 'ar' | 'en' = 'ar'): string {
  if (!field) return '';
  if (typeof field === 'string') return field;
  if (typeof field === 'object') {
    return field[locale] || field.en || field.ar || Object.values(field)[0] || '';
  }
  return String(field);
}

export function getProductImageUrl(product: any): string {
  if (!product) {
    return "/images/fallback.webp";
  }

  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    const firstImage = product.images[0];
    
    if (typeof firstImage === 'string' && firstImage.trim() !== '') {
      return firstImage;
    }
    
    if (typeof firstImage === 'object' && firstImage !== null && typeof firstImage.url === 'string' && firstImage.url.trim() !== '') {
      return firstImage.url;
    }
  }

  if (product.image_url && typeof product.image_url === 'string' && product.image_url.trim() !== '') {
    return product.image_url;
  }

  return "/images/fallback.webp";
}
