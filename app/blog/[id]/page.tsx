import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Calendar, Tag, User, Share2 } from "lucide-react";
import YouTubeEmbed from "@/components/UI/YouTubeEmbed";
import Image from "next/image";
import DOMPurify from "isomorphic-dompurify";
import { Metadata } from "next";
import { fetchBlogPostByIdOrSlug, fetchBlogPosts } from "@/lib/api";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://printexpress.com";

interface BlogPostPageProps {
  params: Promise<{ id: string }> | { id: string };
}

export const dynamicParams = true;
export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const res = await fetchBlogPosts(1, 100);
    const posts = res?.data || [];
    if (posts.length === 0) {
      return [{ id: "1" }];
    }
    const paramsList: { id: string }[] = [];
    posts.forEach((post: any) => {
      if (post.slug) paramsList.push({ id: encodeURIComponent(post.slug) });
      if (post.id) paramsList.push({ id: String(post.id) });
    });
    return paramsList.length > 0 ? paramsList : [{ id: "1" }];
  } catch {
    return [{ id: "1" }];
  }
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  const rawId = resolvedParams.id;
  const post = await fetchBlogPostByIdOrSlug(rawId);

  if (!post) {
    return {
      title: "المقال غير موجود | Print Express",
      description: "المقال المطلوب غير متوفر أو تم نقله.",
      robots: { index: false, follow: false },
    };
  }

  const title = `${post.meta_title || post.title} | Print Express`;
  const description = post.meta_description || post.title;
  const postUrl = `${siteUrl}/blog/${encodeURIComponent(post.slug || post.id)}`;
  const ogImage = post.og_image || post.featured_image;

  return {
    title,
    description,
    keywords: post.meta_keywords ? post.meta_keywords.split(",").map((k: string) => k.trim()) : undefined,
    alternates: {
      canonical: post.canonical_url || postUrl,
    },
    robots: post.is_indexable === false ? {
      index: false,
      follow: false,
    } : {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      title,
      description,
      url: postUrl,
      siteName: "Print Express - برنت إكسبريس",
      locale: "ar_EG",
      type: "article",
      publishedTime: post.created_at,
      modifiedTime: post.updated_at || post.created_at,
      section: post.category || "عام",
      authors: ["Print Express"],
      images: ogImage
        ? [
            {
              url: ogImage,
              width: 1200,
              height: 630,
              alt: post.title,
            },
          ]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage ? [ogImage] : [],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const resolvedParams = await Promise.resolve(params);
  const rawId = resolvedParams.id;
  const post = await fetchBlogPostByIdOrSlug(rawId);

  if (!post) {
    notFound();
  }

  const postUrl = `${siteUrl}/blog/${encodeURIComponent(post.slug || post.id)}`;

  // Google JSON-LD Schema (BlogPosting / Article)
  const defaultSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": postUrl,
    },
    headline: post.title,
    description: post.meta_description || post.title,
    image: post.featured_image ? [post.featured_image] : undefined,
    datePublished: post.created_at,
    dateModified: post.updated_at || post.created_at,
    author: {
      "@type": "Organization",
      name: "Print Express",
      url: siteUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "Print Express",
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/logo.png`,
      },
    },
    articleSection: post.category || "عام",
  };

  const schemaToRender = post.schema_markup && typeof post.schema_markup === "object"
    ? { ...defaultSchema, ...post.schema_markup }
    : defaultSchema;

  // Sanitize the HTML content from the editor to prevent XSS while allowing YouTube iframes
  const cleanHTML = DOMPurify.sanitize(post.content || "", {
    ADD_TAGS: ["iframe"],
    ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "scrolling", "target", "rel"],
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-28 md:pt-36 pb-20 px-4 md:px-8">
      {/* Schema Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaToRender) }}
      />

      <div className="max-w-4xl mx-auto">
        {/* Navigation Breadcrumb */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-yellow-400 font-bold mb-8 transition-colors text-sm"
        >
          <ArrowRight size={18} /> العودة للمدونة
        </Link>

        {/* Article Container */}
        <article className="bg-[#111111] rounded-3xl p-6 md:p-12 shadow-xl shadow-black/50 border border-yellow-500/20">
          {/* Category & Date Header */}
          <div className="flex flex-wrap items-center gap-4 text-xs mb-6">
            <span className="font-bold text-yellow-400 uppercase tracking-widest bg-yellow-400/10 px-3 py-1 rounded-full border border-yellow-400/25">
              {post.category || "عام"}
            </span>

            {post.created_at && (
              <span className="text-gray-400 flex items-center gap-1.5 font-medium">
                <Calendar size={14} className="text-yellow-400/70" />
                {new Date(post.created_at).toLocaleDateString("ar-EG", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            )}

            <span className="text-gray-400 flex items-center gap-1.5 font-medium">
              <User size={14} className="text-yellow-400/70" />
              فريق تحرير برنت إكسبريس
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-5xl font-black text-white mb-8 leading-[1.25] tracking-tight">
            {post.title}
          </h1>

          {/* Featured Media (Video or Image) */}
          {post.video ? (
            <div className="mb-10">
              <YouTubeEmbed
                src={post.video}
                className="relative aspect-video bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-white/10"
              />
            </div>
          ) : post.featured_image ? (
            <div className="relative aspect-video bg-gray-900 rounded-2xl mb-10 shadow-2xl overflow-hidden border border-white/10">
              <Image
                src={post.featured_image}
                alt={post.title}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 850px"
              />
            </div>
          ) : null}

          {/* Article Rich Text Body */}
          <div
            className="prose prose-lg md:prose-xl prose-invert prose-yellow max-w-none text-gray-300 leading-relaxed font-normal prose-img:rounded-2xl prose-img:mx-auto prose-video:w-full prose-video:rounded-2xl prose-a:text-yellow-400 hover:prose-a:text-yellow-300 prose-headings:text-white prose-headings:font-bold prose-p:my-5"
            dangerouslySetInnerHTML={{ __html: cleanHTML }}
          />

          {/* Article Footer & Return Action */}
          <div className="mt-14 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-[#1a1a1a] border border-yellow-500/20 text-white hover:bg-yellow-400 hover:text-black transition-all text-sm"
            >
              <ArrowRight size={16} /> تصفح مقالات أخرى
            </Link>

            <Link
              href="/print-station"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-yellow-400 text-black hover:bg-yellow-300 transition-all text-sm shadow-lg shadow-yellow-500/20"
            >
              ابدأ طلب الطباعة الآن
            </Link>
          </div>
        </article>
      </div>
    </div>
  );
}
