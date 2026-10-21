import React from "react";
import { Loader2 } from "lucide-react";

export default function ProductGridSkeleton() {
  return (
    <div className="flex-1">
      <div className="flex justify-between items-center mb-8 bg-[#111111] p-4 rounded-2xl shadow-sm shadow-black/30 border border-yellow-500/15">
        <div className="h-6 bg-gray-800 rounded w-32 animate-pulse"></div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-[#111111] rounded-3xl p-4 border border-white/5">
            <div className="relative aspect-square bg-gray-900 rounded-2xl mb-4 animate-pulse flex items-center justify-center">
              <Loader2 className="animate-spin text-gray-700" size={32} />
            </div>
            <div className="text-right">
              <div className="h-3 bg-gray-800 rounded w-16 mb-2 ml-auto animate-pulse"></div>
              <div className="h-4 bg-gray-800 rounded w-3/4 mb-4 ml-auto animate-pulse"></div>
              <div className="flex justify-between items-end mt-4">
                <div className="h-6 bg-gray-800 rounded w-20 animate-pulse"></div>
                <div className="w-10 h-10 bg-gray-800 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
