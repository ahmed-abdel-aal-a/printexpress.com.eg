import React from "react";
import { fetchProducts } from "@/lib/api";
import { Filter } from "lucide-react";
import ProductCard from "./ProductCard";

export default async function ProductGrid({ searchParams = {}, categories }: { searchParams?: any, categories: any[] }) {
  const category = searchParams?.category || "الكل";
  const minPrice = searchParams?.minPrice ? Number(searchParams.minPrice) : undefined;
  const maxPrice = searchParams?.maxPrice ? Number(searchParams.maxPrice) : undefined;
  const search = searchParams?.search || "";
  const page = 1; // Assuming infinite scroll is handled client-side or we use standard pagination

  const products = await fetchProducts(page, category, minPrice, maxPrice, search);

  const productsList = products || [];

  return (
    <div className="flex-1">
      <div className="flex justify-between items-center mb-8 bg-[#111111] p-4 rounded-2xl shadow-sm shadow-black/30 border border-yellow-500/15">
        <p className="font-bold text-gray-500">
          عرض <span className="text-white">{productsList.length}</span> منتجات
        </p>
      </div>

      {productsList.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {productsList.map((product: any) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              categoryName={categories?.find((c: any) => c.id === product.category_id)?.name || "بدون تصنيف"} 
            />
          ))}
        </div>
      ) : (
        <div className="bg-[#111111] p-12 rounded-3xl text-center border border-yellow-500/15 flex flex-col items-center justify-center">
          <Filter size={48} className="text-gray-500 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">لا توجد منتجات</h3>
          <p className="text-gray-500">حاول تغيير خيارات التصفية أو نطاق السعر للبحث عن المزيد.</p>
        </div>
      )}
    </div>
  );
}
