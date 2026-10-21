import { fetchProductById } from "@/lib/api";
import { Metadata } from "next";
import { ProductClient } from "./_components/ProductClient";
import { getTranslatedText } from "@/lib/utils";
import { cache } from "react";
import Script from "next/script";

// استخدام React cache لمنع تكرار طلب الـ API بين generateMetadata و ProductPage
const getCachedProduct = cache(async (id: string) => {
  try {
    return await fetchProductById(id);
  } catch (error) {
    return null;
  }
});

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const product = await getCachedProduct(params.id);
  if (!product) {
    return {
      title: "المنتج غير متوفر - Print Express",
    };
  }
  
  const name = getTranslatedText(product.name);
  const description = getTranslatedText(product.description) || "اكتشف منتجات الطباعة المميزة لدينا";
  const seoTitle = getTranslatedText(product.seo_title) || `${name} - Print Express`;
  const seoDescription = getTranslatedText(product.seo_description) || description;
  const canonicalUrl = product.canonical_url || `https://printexpress.com/product/${product.slug || product.id}`;
  const ogImage = product.og_image || product.image_url;

  return {
    title: seoTitle,
    description: seoDescription,
    keywords: product.meta_keywords || "طباعة, دروع, طباعة ديجيتال, Print Express",
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'ar': canonicalUrl,
      }
    },
    robots: {
      index: product.is_indexable !== false,
      follow: product.is_indexable !== false,
    },
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      url: canonicalUrl,
      images: ogImage ? [ogImage] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: seoTitle,
      description: seoDescription,
      images: ogImage ? [ogImage] : [],
    }
  };
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await getCachedProduct(params.id);

  if (!product) {
    return <div className="min-h-screen flex items-center justify-center pt-32 text-red-500">المنتج غير موجود</div>;
  }

  // Format the product to exactly match the initial structure ProductClient expects
  const formattedProduct = {
    ...product,
    id: product.id,
    name: getTranslatedText(product.name),
    price: product.price,
    discount_price: product.discount_price,
    category: product.category ? { ...product.category, name: getTranslatedText(product.category.name) } : { name: "عام" },
    image_url: product.image_url,
    images: product.images || [],
    description: getTranslatedText(product.description) || "لا يوجد وصف",
    features: product.features ? (Array.isArray(product.features) ? product.features.map(getTranslatedText) : product.features) : [], 
    youtubeLink: product.youtubeLink || null, 
    available_addon_groups: product.available_addon_groups || [],
    addon_groups: product.available_addon_groups || [],
    variants: product.variants || [],
    track_inventory: product.track_inventory,
    quantity: product.quantity,
    continue_selling_when_out_of_stock: product.continue_selling_when_out_of_stock,
    type: product.type || 'simple',
    seo_title: getTranslatedText(product.seo_title),
    seo_description: getTranslatedText(product.seo_description)
  };

  // 1. توليد أو استخدام الـ Schema الموجودة مع الحماية من Double Encoding
  let parsedSchema = product.schema_markup;
  if (typeof parsedSchema === "string") {
    try {
      parsedSchema = JSON.parse(parsedSchema);
    } catch {
      parsedSchema = null;
    }
  }

  const finalSchema = (parsedSchema && typeof parsedSchema === "object") ? parsedSchema : {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": getTranslatedText(product.name),
    "description": getTranslatedText(product.seo_description) || getTranslatedText(product.description),
    "image": product.og_image || product.image_url || "",
    "sku": product.sku || product.id?.toString(),
    "offers": {
      "@type": "Offer",
      "url": product.canonical_url || `https://printexpress.com/product/${product.slug || product.id}`,
      "priceCurrency": "EGP",
      "price": product.discount_price || product.price,
      "itemCondition": "https://schema.org/NewCondition",
      "availability": (!product.track_inventory || (product.quantity && product.quantity > 0)) 
        ? "https://schema.org/InStock" 
        : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "Print Express"
      }
    }
  };

  // 2. تعقيم البيانات (XSS Sanitization) لحماية المستخدمين
  const safeJsonLd = JSON.stringify(finalSchema).replace(/</g, '\\u003c');

  return (
    <>
      <Script
        id="product-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd }}
      />
      <ProductClient initialProduct={formattedProduct} />
    </>
  );
}
