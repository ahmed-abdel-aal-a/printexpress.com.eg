import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    let secret = request.nextUrl.searchParams.get('secret');
    let body: any = {};
    
    if (!secret) {
        try {
            body = await request.json();
            secret = body.secret;
        } catch (e) {
            // ignore
        }
    }
    
    // Validate secret token to ensure only our Laravel backend can trigger this
    // Fallback to "my-super-secret-token" for the blog webhook since it was configured in Laravel
    if (secret !== process.env.REVALIDATION_TOKEN && secret !== "my-super-secret-token") {
        return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
    
    // Invalidate the 'products' cache tag so the next request fetches fresh data
    revalidateTag('products');
    revalidateTag('categories');
    revalidateTag('blog');
    revalidateTag('offers');
    
    // If a specific tag was sent in the body, invalidate it directly
    if (body.tag) {
        revalidateTag(body.tag);
    }
    
    return NextResponse.json({ revalidated: true, now: Date.now() });
}
