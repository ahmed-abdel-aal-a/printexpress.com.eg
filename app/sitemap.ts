import { MetadataRoute } from 'next';
import { fetchProducts, fetchBlogPosts } from '@/lib/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://printexpress.com';

  try {
    const [products, blogResponse] = await Promise.all([
      fetchProducts(),
      fetchBlogPosts(1, 100),
    ]);

    // فلترة المنتجات القابلة للفهرسة فقط
    const productEntries = (products || [])
      .filter((p: any) => p.is_indexable !== false)
      .map((product: any) => ({
        url: product.canonical_url || `${baseUrl}/product/${product.slug || product.id}`,
        lastModified: new Date(product.updated_at || Date.now()),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));

    // تصفية وإدراج مقالات المدونة القابلة للفهرسة
    const blogEntries = (blogResponse?.data || [])
      .filter((post: any) => post.is_indexable !== false)
      .map((post: any) => ({
        url: post.canonical_url || `${baseUrl}/blog/${encodeURIComponent(post.slug || post.id)}`,
        lastModified: new Date(post.updated_at || post.created_at || Date.now()),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));

    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1.0,
      },
      {
        url: `${baseUrl}/blog`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.8,
      },
      ...productEntries,
      ...blogEntries,
    ];
  } catch (error) {
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1.0,
      },
      {
        url: `${baseUrl}/blog`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.8,
      },
    ];
  }
}
