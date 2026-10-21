import { DEFAULT_MIN_PRICE, DEFAULT_MAX_PRICE } from "./constants";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2080/api/v1';

export async function fetchCategories() {
    try {
        const res = await fetch(`${API_URL}/storefront/categories`, {
            next: { tags: ['categories'] }
        });
        if (!res.ok) throw new Error('Failed to fetch categories');
        const json = await res.json();
        return json.data;
    } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
}


export async function fetchProducts(page: number = 1, category: string = 'الكل', minPrice?: number, maxPrice?: number, searchQuery?: string) {
    try {
        const params = new URLSearchParams({
            page: page.toString(),
            ...(category !== 'الكل' && { category_id: category }),
            ...(minPrice !== undefined && { min_price: minPrice.toString() }),
            ...(maxPrice !== undefined && { max_price: maxPrice.toString() }),
            ...(searchQuery && { search: searchQuery })
        });
        
        const isDefaultMin = minPrice === undefined || minPrice === DEFAULT_MIN_PRICE;
        const isDefaultMax = maxPrice === undefined || maxPrice === DEFAULT_MAX_PRICE;
        const hasFilters = (category !== 'الكل') || !isDefaultMin || !isDefaultMax || !!searchQuery;
        
        const fetchOptions: RequestInit = { next: { revalidate: 60, tags: ['products'] } };

        const res = await fetch(`${API_URL}/storefront/products?${params.toString()}`, fetchOptions);
        if (!res.ok) throw new Error('Failed to fetch products');
        const data = await res.json();
        return data.data;
    } catch (error) {
        console.error('Error fetching products:', error);
        return null;
    }
}

export async function fetchShippingZones() {
    try {
        const res = await fetch(`${API_URL}/storefront/shipping-zones`);
        if (!res.ok) throw new Error('Failed to fetch shipping zones');
        return await res.json();
    } catch (error) {
        console.error('Error fetching shipping zones:', error);
        return [];
    }
}

export async function fetchCheckoutSettings() {
    try {
        const res = await fetch(`${API_URL}/storefront/checkout-settings`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch checkout settings');
        const json = await res.json();
        return json.data; // { cod_enabled, cod_fee, online_payment_enabled }
    } catch (error) {
        console.error('Error fetching checkout settings:', error);
        return { cod_enabled: true, cod_fee: 0, online_payment_enabled: false, standard_shipping_delivery_time: 'خلال 2 - 4 أيام عمل' }; // Safe fallback
    }
}

export async function processCheckout(payload: any, sessionId: string) {
    try {
        const res = await fetch(`${API_URL}/storefront/checkout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Session-ID': sessionId
            },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) {
            let errorMsg = data.message || data.error;
            if (data.errors && typeof data.errors === 'object') {
                const firstKey = Object.keys(data.errors)[0];
                if (firstKey && Array.isArray(data.errors[firstKey]) && data.errors[firstKey][0]) {
                    errorMsg = data.errors[firstKey][0];
                }
            }
            throw new Error(errorMsg || 'فشل إتمام الطلب');
        }
        return data;
    } catch (error: any) {
        throw error;
    }
}

export async function fetchOrderPaymentStatus(orderId: string | number) {
    try {
        const res = await fetch(`${API_URL}/storefront/orders/${orderId}/payment-status`, { cache: 'no-store' });
        if (!res.ok) throw new Error('فشل جلب حالة الدفع');
        return await res.json();
    } catch (error) {
        console.error('Error fetching order payment status:', error);
        return null;
    }
}

import { cache } from 'react';

export const fetchProductById = cache(async (id: string) => {
    try {
        const res = await fetch(`${API_URL}/storefront/products/${id}`, { next: { revalidate: 60, tags: ['products'] } });
        if (!res.ok) throw new Error('Failed to fetch product');
        const json = await res.json();
        return json.data;
    } catch (error) {
        console.error('Error fetching product:', error);
        return null;
    }
});

export async function login(payload: any, sessionId?: string) {
    const session = sessionId || (typeof window !== 'undefined' ? (localStorage.getItem("X-Session-ID") || localStorage.getItem("session_id")) : null);
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };
    if (session) {
        headers['X-Session-ID'] = session;
    }

    const res = await fetch(`${API_URL}/storefront/auth/login`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');
    return data;
}

export async function register(payload: any, sessionId?: string) {
    const session = sessionId || (typeof window !== 'undefined' ? (localStorage.getItem("X-Session-ID") || localStorage.getItem("session_id")) : null);
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };
    if (session) {
        headers['X-Session-ID'] = session;
    }

    const res = await fetch(`${API_URL}/storefront/auth/register`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registration failed');
    return data;
}

export async function logout(token: string) {
    try {
        await fetch(`${API_URL}/storefront/auth/logout`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
    } catch (e) {
        // ignore errors on logout
    }
}

export async function getUser(token: string) {
    try {
        const res = await fetch(`${API_URL}/storefront/auth/me`, {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.user || data.customer || data.data;
    } catch {
        return null;
    }
}

export async function fetchBlogPosts(page: number | string = 1, limit: number = 12) {
    try {
        const res = await fetch(`${API_URL}/storefront/blog-posts?page=${page}&limit=${limit}`, {
            next: { revalidate: 3600, tags: ['blog'] }
        });
        if (!res.ok) {
            return { data: [], current_page: 1, last_page: 1, total: 0 };
        }
        const data = await res.json();
        return data.data ? data : { data, current_page: 1, last_page: 1, total: Array.isArray(data) ? data.length : 0 };
    } catch (error) {
        console.error('Error fetching blog posts:', error);
        return { data: [], current_page: 1, last_page: 1, total: 0 };
    }
}

export const fetchBlogPostByIdOrSlug = cache(async (idOrSlug: string) => {
    try {
        const cleanParam = decodeURIComponent(idOrSlug).trim();
        const res = await fetch(`${API_URL}/storefront/blog-posts/${encodeURIComponent(cleanParam)}`, {
            next: { revalidate: 3600, tags: ['blog'] }
        });
        if (!res.ok) return null;
        return await res.json();
    } catch (error) {
        console.error('Error fetching blog post:', error);
        return null;
    }
});

export async function fetchOrderByPaymentToken(token: string) {
    const res = await fetch(`${API_URL}/storefront/orders/pay/${token}`, {
        cache: 'no-store'
    });
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.message || 'فشل جلب بيانات الطلب');
    }
    return data;
}

export async function initiateOrderTokenPayment(token: string, successUrl?: string, failureUrl?: string) {
    const res = await fetch(`${API_URL}/storefront/orders/pay/${token}/initiate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({
            success_url: successUrl,
            failure_url: failureUrl,
        }),
    });
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.message || 'فشل بدء جلسة الدفع الإلكتروني');
    }
    return data;
}

export async function requestOrderReprice(token: string) {
    const res = await fetch(`${API_URL}/storefront/orders/pay/${token}/request-reprice`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
    });
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.message || 'فشل إرسال طلب تجديد التسعيرة');
    }
    return data;
}

export async function fetchCustomerOrders(token: string) {
    try {
        const res = await fetch(`${API_URL}/storefront/auth/orders`, {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            cache: 'no-store'
        });
        if (!res.ok) return null;
        return await res.json();
    } catch (e) {
        console.error('Error fetching customer orders:', e);
        return null;
    }
}

