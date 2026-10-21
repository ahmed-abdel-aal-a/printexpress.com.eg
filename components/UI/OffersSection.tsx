import React from "react";
import Link from "next/link";
import { ScrollReveal } from "@/components/UI/Animations";
import Image from "next/image";

interface Offer {
  id: number;
  title: { ar: string; en: string };
  description: { ar: string; en: string } | null;
  image_path: { desktop: string; tablet: string; mobile: string } | string;
  linkable_type: string | null;
  linkable_id: number | null;
  custom_url: string | null;
}

import { API_URL } from "@/lib/api";

async function fetchOffers(): Promise<Offer[]> {
  try {
    const res = await fetch(`${API_URL}/storefront/offers`, {
      next: { tags: ['offers'] },
    });
    
    if (!res.ok) {
      return [];
    }
    
    return res.json();
  } catch (error) {
    console.error("Error fetching offers:", error);
    return [];
  }
}

export default async function OffersSection() {
  const offers = await fetchOffers();

  if (!offers || offers.length === 0) {
    return null; // Return nothing if there are no offers
  }

  // Dynamic CSS Grid class based on number of offers (max 2)
  const gridClass = offers.length === 1 
    ? "grid-cols-1 max-w-4xl mx-auto" 
    : "grid-cols-1 md:grid-cols-2";

  return (
    <section className="py-16 px-6 md:px-12 w-full max-w-7xl mx-auto">
      <ScrollReveal>
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-black text-white">
              أقوى العروض <span className="text-yellow-400">🔥</span>
            </h2>
            <div className="w-16 h-1 bg-yellow-400 rounded-full mt-3" />
            <p className="text-gray-500 mt-2 font-medium">
              اغتنم الفرصة وتسوق بأفضل الأسعار
            </p>
          </div>
        </div>
      </ScrollReveal>
      
      <div className={`grid gap-6 ${gridClass}`}>
        {offers.map((offer, index) => {
          // Determine the target URL
          let targetUrl = "";
          if (offer.custom_url) {
            targetUrl = offer.custom_url;
          } else if (offer.linkable_type === "product" || offer.linkable_type === "App\\Models\\Product") {
            targetUrl = `/product/${offer.linkable_id}`;
          } else if (offer.linkable_type === "category" || offer.linkable_type === "App\\Models\\Category") {
            targetUrl = `/shop?category=${offer.linkable_id}`;
          } else if (offer.linkable_type === "printing_type" || offer.linkable_type === "App\\Models\\PrintingType") {
            targetUrl = `/print-station`;
          }

          // Image handling (WebP URL)
          const rawApi = API_URL;
          const backendBase = rawApi.replace(/\/api(\/.*)?$/, '');
          const rawImagePath = typeof offer.image_path === 'string' ? offer.image_path : (offer.image_path?.desktop || '');
          const imageUrl = rawImagePath.startsWith('http') 
            ? rawImagePath 
            : `${backendBase}${rawImagePath.startsWith('/') ? '' : '/'}${rawImagePath}`;

          const CardContent = (
            <div className="relative h-64 md:h-80 w-full rounded-[2rem] overflow-hidden group shadow-lg shadow-black/40">
              {/* Note: In production we should use next/image, but standard img allows any external URL easily without config updates if Next config limits it. We use unoptimized Next Image here. */}
              <Image
                src={imageUrl}
                alt={offer.title.ar}
                fill
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
              <div className="absolute inset-0 p-8 flex flex-col justify-end text-white">
                <h3 className="text-2xl font-bold mb-2">{offer.title.ar}</h3>
                {offer.description?.ar && (
                  <p className="text-gray-200 mb-6 max-w-sm">{offer.description.ar}</p>
                )}
                
                {targetUrl && (
                  <span className="bg-white text-gray-900 px-6 py-3 rounded-full font-bold w-fit group-hover:bg-yellow-400 transition-colors inline-block mt-auto">
                    تصفح العرض
                  </span>
                )}
              </div>
            </div>
          );

          return (
            <ScrollReveal
              key={offer.id}
              delay={index * 0.1}
              className="w-full h-full"
            >
              {targetUrl ? (
                <Link href={targetUrl} className="block w-full h-full focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded-[2rem]">
                  {CardContent}
                </Link>
              ) : (
                <div className="block w-full h-full">
                  {CardContent}
                </div>
              )}
            </ScrollReveal>
          );
        })}
      </div>
    </section>
  );
}
