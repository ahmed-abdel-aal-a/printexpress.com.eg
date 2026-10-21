import React, { Suspense } from "react";
import { fetchCategories } from "@/lib/api";
import { PageTransition } from "@/components/UI/Animations";
import ShopFilters from "@/components/ShopFilters";
import ProductGrid from "@/components/ProductGrid";
import ProductGridSkeleton from "@/components/ProductGridSkeleton";

export const metadata = {
  title: "المتجر | Print Express",
  description: "تصفح جميع منتجاتنا واطلبها بسهولة",
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }> | { [key: string]: string | string[] | undefined };
}) {
  const resolvedSearchParams = searchParams instanceof Promise ? await searchParams : (searchParams || {});
  const categories = await fetchCategories();
  const queryKey = JSON.stringify(resolvedSearchParams);

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-28 md:pt-32 pb-8 md:pb-12 flex flex-col md:flex-row gap-8">
        <Suspense fallback={<div className="md:w-64 shrink-0 bg-[#111111] p-6 rounded-3xl animate-pulse h-96"></div>}>
          <ShopFilters categories={categories || []} />
        </Suspense>
        
        <Suspense key={queryKey} fallback={<ProductGridSkeleton />}>
          <ProductGrid searchParams={resolvedSearchParams} categories={categories || []} />
        </Suspense>
      </div>
    </PageTransition>
  );
}
