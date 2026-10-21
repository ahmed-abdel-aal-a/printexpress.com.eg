import React from "react";
import { ArrowRight, Printer, Calendar, Tag, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import YouTubeEmbed from "@/components/UI/YouTubeEmbed";
import Image from "next/image";
import { Metadata } from "next";
import { fetchBlogPosts } from "@/lib/api";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://printexpress.com";

export const metadata: Metadata = {
  title: "المدونة والمقالات | Print Express - برنت إكسبريس",
  description: "اكتشف أحدث المقالات والنصائح المتخصصة في عالم الطباعة الرقمية وتجهيز ملفات التصميم واختيار أفضل خامات الورق والتشطيب.",
  alternates: {
    canonical: `${siteUrl}/blog`,
  },
  openGraph: {
    title: "المدونة والمقالات | Print Express",
    description: "نصائح وإرشادات احترافية في عالم الطباعة الرقمية وتجهيز التصاميم لرواد الأعمال والمصممين.",
    url: `${siteUrl}/blog`,
    siteName: "Print Express - برنت إكسبريس",
    locale: "ar_EG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "المدونة والمقالات | Print Express",
    description: "نصائح وإرشادات احترافية في عالم الطباعة الرقمية وتجهيز التصاميم لرواد الأعمال والمصممين.",
  },
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function BlogPage() {
  const { data: posts, current_page, last_page, total } = await fetchBlogPosts(1, 24);

  // Structured Data Schema for Blog (CollectionPage)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "مدونة ومقالات برنت إكسبريس",
    description: "مقالات وإرشادات متخصصة في خدمات الطباعة الرقمية والتصميم.",
    url: `${siteUrl}/blog`,
    publisher: {
      "@type": "Organization",
      name: "Print Express",
      url: siteUrl,
    },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: (posts || []).map((post: any, index: number) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${siteUrl}/blog/${encodeURIComponent(post.slug || post.id)}`,
        name: post.title,
      })),
    },
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-28 md:pt-36 pb-16 px-4 md:px-8">
      {/* Schema Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-xs font-bold uppercase tracking-wider mb-4">
            <Tag size={13} /> مدونة برنت إكسبريس
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight leading-tight">
            المدونة والمقالات المتخصصة
          </h1>
          <p className="text-gray-400 font-medium text-base md:text-lg leading-relaxed">
            دليلك الشامل لأحدث أسرار الطباعة الرقمية، خامات الورق، تجهيز ملفات التصميم باحترافية، وأحدث اتجاهات الهوية البصرية.
          </p>
        </div>

        {/* Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {!posts || posts.length === 0 ? (
            <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-20 bg-[#111111]/80 rounded-3xl border border-yellow-500/10 p-8">
              <Printer className="w-16 h-16 text-yellow-400/40 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">لا توجد مقالات منشورة حالياً</h2>
              <p className="text-gray-400 max-w-md mx-auto text-sm">
                نعمل حالياً على إعداد مقالات ودلائل إرشادية قيّمة تثري معرفتك في الطباعة والتصميم. تفقدنا قريباً!
              </p>
            </div>
          ) : (
            posts.map((post: any) => (
              <article
                key={post.id}
                className="bg-[#111111] rounded-3xl p-6 shadow-md shadow-black/40 border border-yellow-500/10 hover:border-yellow-500/30 flex flex-col transition-all duration-300 hover:-translate-y-1.5 group"
              >
                {/* Media Container: Video, Image, or Branded Placeholder */}
                {post.video ? (
                  <YouTubeEmbed
                    src={post.video}
                    className="relative aspect-video bg-gray-900 rounded-2xl mb-6 shadow-inner overflow-hidden border border-white/5"
                  />
                ) : post.featured_image ? (
                  <div className="relative aspect-video bg-gray-900 rounded-2xl mb-6 shadow-inner overflow-hidden border border-white/5">
                    <Image
                      src={post.featured_image}
                      alt={post.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                ) : (
                  <div className="relative aspect-video bg-gradient-to-br from-yellow-500/15 via-[#181818] to-[#0e0e0e] rounded-2xl mb-6 shadow-inner border border-yellow-500/15 flex flex-col items-center justify-center p-6 text-center">
                    <Printer className="text-yellow-400/60 w-12 h-12 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-gray-400 tracking-wider">برنت إكسبريس</span>
                  </div>
                )}

                {/* Category & Meta */}
                <div className="flex items-center justify-between mb-3 text-xs">
                  <span className="font-bold text-yellow-400 uppercase tracking-widest bg-yellow-400/10 px-2.5 py-1 rounded-md border border-yellow-400/20">
                    {post.category || "عام"}
                  </span>
                  {post.created_at && (
                    <span className="text-gray-500 flex items-center gap-1 font-medium">
                      <Calendar size={13} />
                      {new Date(post.created_at).toLocaleDateString("ar-EG", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  )}
                </div>

                {/* Title */}
                <Link href={`/blog/${post.slug || post.id}`}>
                  <h2 className="text-xl font-bold text-white mb-3 hover:text-yellow-400 transition-colors line-clamp-2 leading-snug">
                    {post.title}
                  </h2>
                </Link>

                {/* Description */}
                <p className="text-gray-400 text-sm leading-relaxed mb-6 line-clamp-3 font-normal">
                  {post.meta_description || "اقرأ المزيد عن هذا المقال وتعرف على أهم النصائح والتفاصيل المتخصصة."}
                </p>

                {/* Read Action */}
                <Link
                  href={`/blog/${post.slug || post.id}`}
                  className="mt-auto self-start flex items-center gap-2 font-bold text-yellow-400 hover:text-yellow-300 transition-colors text-sm group-hover:translate-x-[-4px]"
                >
                  اقرأ التفاصيل بالكامل <ArrowRight size={16} />
                </Link>
              </article>
            ))
          )}
        </div>

        {/* Pagination Controls */}
        {last_page > 1 && (
          <div className="flex items-center justify-center gap-3 pt-4 border-t border-white/5">
            {current_page > 1 ? (
              <Link
                href={`/blog?page=${current_page - 1}`}
                className="px-5 py-2.5 rounded-xl font-bold bg-[#1a1a1a] border border-yellow-500/20 text-white hover:bg-yellow-400 hover:text-black transition-all flex items-center gap-1 text-sm shadow-sm"
              >
                <ChevronRight size={16} /> السابق
              </Link>
            ) : (
              <span className="px-5 py-2.5 rounded-xl font-bold bg-[#111] border border-gray-800 text-gray-600 cursor-not-allowed flex items-center gap-1 text-sm">
                <ChevronRight size={16} /> السابق
              </span>
            )}

            <span className="text-gray-400 font-medium px-4 text-sm">
              صفحة <strong className="text-yellow-400 font-bold">{current_page}</strong> من{" "}
              <strong className="text-white font-bold">{last_page}</strong>
            </span>

            {current_page < last_page ? (
              <Link
                href={`/blog?page=${current_page + 1}`}
                className="px-5 py-2.5 rounded-xl font-bold bg-[#1a1a1a] border border-yellow-500/20 text-white hover:bg-yellow-400 hover:text-black transition-all flex items-center gap-1 text-sm shadow-sm"
              >
                التالي <ChevronLeft size={16} />
              </Link>
            ) : (
              <span className="px-5 py-2.5 rounded-xl font-bold bg-[#111] border border-gray-800 text-gray-600 cursor-not-allowed flex items-center gap-1 text-sm">
                التالي <ChevronLeft size={16} />
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
