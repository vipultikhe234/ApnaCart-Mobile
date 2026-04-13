import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://foodhub-backend-2alg.onrender.com/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    timeout: 30000, // 30s timeout
});

// ── In-memory cache for GET requests ──────────────────────────────────────
const cache = new Map();         // url → { data, expiry }
const pending = new Map();         // url → Promise  (dedup inflight requests)
const CACHE_TTL = 60 * 1000;       // 1 minute default TTL

export function bustCache(pattern) {
    cache.forEach((_, key) => {
        if (key.includes(pattern)) cache.delete(key);
    });
}

// ── Request interceptor ────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// ── Response interceptor ───────────────────────────────────────────────────
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('user');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// ── Cached GET helper ──────────────────────────────────────────────────────
function cachedGet(url, ttl = CACHE_TTL) {
    const now = Date.now();

    // Return cached data if still fresh
    const hit = cache.get(url);
    if (hit && hit.expiry > now) {
        return Promise.resolve(hit.data);
    }

    // Dedup: if same URL is already in-flight, share the same promise
    if (pending.has(url)) return pending.get(url);

    const req = api.get(url).then((res) => {
        cache.set(url, { data: res, expiry: now + ttl });
        pending.delete(url);
        return res;
    }).catch((err) => {
        pending.delete(url);
        throw err;
    });

    pending.set(url, req);
    return req;
}

// ── Auth Service ───────────────────────────────────────────────────────────
export const authService = {
    register: (data) => api.post('/register', data),
    login: (data) => api.post('/login', data),
    getProfile: () => api.get('/profile'),
    updateProfile: (data) => api.put('/profile', data),
    logout: async () => {
        try {
            await api.post('/remove-fcm-token').catch(() => { }); // Try to remove token first
        } catch (e) {
            console.error('Logout: Failed to remove FCM token', e);
        }
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        bustCache('/profile');
        return api.post('/logout');
    },
};

// ── Product Service ────────────────────────────────────────────────────────
export const productService = {
    // Use cached GET — products list rarely changes
    getAll: (params = {}) => {
        const cleanParams = Object.fromEntries(Object.entries(params).filter(([_, v]) => v != null));
        const query = Object.keys(cleanParams).length > 0 ? '?' + new URLSearchParams(cleanParams).toString() : '';
        return cachedGet(`/products${query}`, 30 * 1000);
    },
    getCurated: (params = {}) => {
        const cleanParams = Object.fromEntries(Object.entries(params).filter(([_, v]) => v != null));
        const query = Object.keys(cleanParams).length > 0 ? '?' + new URLSearchParams(cleanParams).toString() : '';
        return cachedGet(`/products/curated${query}`, 30 * 1000); 
    },
    getCategories: (params = {}) => {
        const query = Object.keys(params).length > 0 ? '?' + new URLSearchParams(params).toString() : '';
        return cachedGet(`/categories${query}`, 60 * 1000);
    },
    getById: (id) => cachedGet(`/products/${id}`, 5 * 60 * 1000),
    addReview: (id, data) => {
        bustCache(`/products/${id}`);
        bustCache('/products');
        return api.post(`/products/${id}/reviews`, data);
    },
    getByMerchant: (MerchantId) => cachedGet(`/Merchants/${MerchantId}/products`, 2 * 60 * 1000),
};

// ── Merchant Service ──────────────────────────────────────────────────────
export const MerchantService = {
    getAll: (params = {}) => {
        // Remove undefined/null params
        const cleanParams = Object.fromEntries(Object.entries(params).filter(([_, v]) => v != null));
        const query = Object.keys(cleanParams).length > 0 ? '?' + new URLSearchParams(cleanParams).toString() : '';
        return cachedGet(`/merchants${query}`, 5 * 60 * 1000); // 5 min cache
    },
    getById: (id) => cachedGet(`/merchants/${id}`, 5 * 60 * 1000),
    getMerchantCategories: () => cachedGet('/merchant-categories', 10 * 60 * 1000),
    getReviews: (id) => cachedGet(`/merchants/${id}/reviews`, 2 * 60 * 1000),
    addReview: (id, data) => {
        bustCache(`/merchants/${id}/reviews`);
        return api.post(`/merchants/${id}/reviews`, data);
    },
};

// ── Order Service ──────────────────────────────────────────────────────────
export const orderService = {
    placeOrder: (data) => {
        bustCache('/orders');
        return api.post('/orders', data);
    },
    getUserOrders: () => cachedGet('/orders', 30 * 1000),
    getOrder: (id) => cachedGet(`/orders/${id}`, 15 * 1000),
    createIntent: (amount) => api.post('/payments/create-intent', { amount }),
};

// ── Coupon Service ─────────────────────────────────────────────────────────
export const couponService = {
    getAll: (MerchantId = null) =>
        api.get('/coupons', { params: { merchant_id: MerchantId } }),
    validate: (code, amount, MerchantId = null) =>
        api.post('/coupons/validate', { code, order_amount: amount, merchant_id: MerchantId }),
};

// ── Address Service ────────────────────────────────────────────────────────
export const addressService = {
    getAddresses: () => api.get('/addresses'),
    addAddress: (data) => api.post('/addresses', data),
};

// ── FCM Service ────────────────────────────────────────────────────────────
export const fcmService = {
    saveToken: (token) => api.post('/save-fcm-token', { fcm_token: token }),
    removeToken: () => api.post('/remove-fcm-token'),
    getStatus: () => api.get('/fcm-status'),
    sendManualNotification: (data) => api.post('/send-notification', data),
};

// ── Location Service ───────────────────────────────────────────────────────
export const locationService = {
    getCountries: () => cachedGet('/locations/countries', 5 * 60 * 1000), // 5 min
    getStates: (countryId) => cachedGet(`/locations/states?country_id=${countryId}`, 5 * 60 * 1000),
    getCities: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return cachedGet(`/locations/cities?${query}`, 5 * 60 * 1000); // 5 min
    },
};

// ── Rider Service ──────────────────────────────────────────────────────────
export const riderService = {
    getAvailableOrders: () => api.get('/rider/orders/available'),
    acceptOrder: (id) => api.post(`/rider/orders/${id}/accept`),
    updateLocation: (lat, lng) => api.post('/rider/location', { lat, lng }),
    completeOrder: (id) => api.post(`/rider/orders/${id}/complete`),
};

// ── Landing Service ────────────────────────────────────────────────────────
export const landingService = {
    getOffers: (params = {}) => api.get('/landing-offers', { params }),
};

export default api;

