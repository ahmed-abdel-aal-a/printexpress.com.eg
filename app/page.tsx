import React from "react";
import HomeClient from "@/components/HomeClient";
import OffersSection from "@/components/UI/OffersSection";
import { fetchProducts, fetchCategories, fetchBlogPosts } from "@/lib/api";

export const metadata = {
  title: "Print Express - مطبوعات فاخرة",
  description: "اطلب مطبوعاتك بأفضل جودة وأسرع وقت",
};

export default async function HomePage() {
  // SSR Fetching
  const [initialProducts, initialCategories, initialBlogData] = await Promise.all([
    fetchProducts(1),
    fetchCategories(),
    fetchBlogPosts(1, 3),
  ]);

  return (
    <HomeClient 
      initialProducts={initialProducts || []} 
      initialCategories={initialCategories || []} 
      initialBlogPosts={initialBlogData?.data || []}
      offersSection={<OffersSection />}
    />
  );
}
