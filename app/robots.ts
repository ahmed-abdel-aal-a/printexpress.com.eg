import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://printexpress.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/private/', '/api/'],
      },
      // توجيهات صريحة لروبوتات الذكاء الاصطناعي (GEO)
      {
        userAgent: ['ChatGPT-User', 'OAI-SearchBot', 'PerplexityBot', 'Anthropic-ai', 'Claude-Web', 'Google-Extended'],
        allow: ['/product/', '/blog/', '/'], // السماح بالوصول للمنتجات والمحتوى
        disallow: ['/checkout/', '/cart/', '/api/'], // منع الوصول للصفحات الخاصة
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
