// API configuration and utilities
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://warungin-backend.onrender.com';

export interface User {
    id: string;
    tenant_id: string;
    email: string;
    name: string;
    role: 'owner' | 'manager' | 'cashier';
    is_active: boolean;
}

export interface Tenant {
    id: string;
    name: string;
    business_type: string;
    email: string;
}

export interface AuthTokens {
    access_token: string;
    refresh_token: string;
}

// Store tokens in localStorage
export const storeTokens = (tokens: AuthTokens) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', tokens.access_token);
        localStorage.setItem('refresh_token', tokens.refresh_token);
    }
};

export const getAccessToken = (): string | null => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('access_token');
    }
    return null;
};

export const getRefreshToken = (): string | null => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('refresh_token');
    }
    return null;
};

export const clearTokens = () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
    }
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
    return !!getAccessToken();
};

// Get Google OAuth URL
export const getGoogleAuthUrl = (): string => {
    return `${API_URL}/api/v1/auth/google`;
};

// API fetch with auth
export const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
    const token = getAccessToken();

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    // If 401, try to refresh token
    if (response.status === 401) {
        const refreshed = await refreshTokens();
        if (refreshed) {
            // Retry with new token
            (headers as Record<string, string>)['Authorization'] = `Bearer ${getAccessToken()}`;
            return fetch(`${API_URL}${endpoint}`, { ...options, headers });
        } else {
            // Redirect to login
            clearTokens();
            window.location.href = '/login';
        }
    }

    return response;
};

// Refresh tokens
export const refreshTokens = async (): Promise<boolean> => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    try {
        const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (response.ok) {
            const data = await response.json();
            storeTokens({
                access_token: data.access_token,
                refresh_token: data.refresh_token,
            });
            return true;
        }
    } catch (error) {
        console.error('Failed to refresh token:', error);
    }

    return false;
};

// Get current user
export const getCurrentUser = async (): Promise<{ user: User; tenant: Tenant } | null> => {
    try {
        const response = await fetchWithAuth('/api/v1/auth/me');
        if (response.ok) {
            return response.json();
        }
    } catch (error) {
        console.error('Failed to get user:', error);
    }
    return null;
};

// Product types
export interface Product {
    id: string;
    tenant_id: string;
    category_id?: string;
    name: string;
    sku: string;
    price: number;
    cost: number;
    stock_qty: number;
    image_url: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateProductInput {
    name: string;
    sku?: string;
    price: number;
    cost?: number;
    stock_qty?: number;
    category_id?: string;
    image_url?: string;
}

// Product API functions
export const getProducts = async (): Promise<Product[]> => {
    try {
        const response = await fetchWithAuth('/api/v1/products');
        if (response.ok) {
            const data = await response.json();
            return data.data || [];
        }
    } catch (error) {
        console.error('Failed to fetch products:', error);
    }
    return [];
};

export const createProduct = async (product: CreateProductInput): Promise<Product | null> => {
    try {
        const response = await fetchWithAuth('/api/v1/products', {
            method: 'POST',
            body: JSON.stringify(product),
        });
        if (response.ok) {
            const data = await response.json();
            return data.data;
        }
    } catch (error) {
        console.error('Failed to create product:', error);
    }
    return null;
};

export const updateProduct = async (id: string, product: CreateProductInput): Promise<Product | null> => {
    try {
        const response = await fetchWithAuth(`/api/v1/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(product),
        });
        if (response.ok) {
            const data = await response.json();
            return data.data;
        }
    } catch (error) {
        console.error('Failed to update product:', error);
    }
    return null;
};

export const deleteProduct = async (id: string): Promise<boolean> => {
    try {
        const response = await fetchWithAuth(`/api/v1/products/${id}`, {
            method: 'DELETE',
        });
        return response.ok;
    } catch (error) {
        console.error('Failed to delete product:', error);
    }
    return false;
};

// Transaction types
export interface TransactionItem {
    id: string;
    product_id: string;
    product?: Product;
    quantity: number;
    unit_price: number;
    subtotal: number;
}

export interface Transaction {
    id: string;
    tenant_id: string;
    invoice_number: string;
    user_id: string;
    customer_id?: string;
    items: TransactionItem[];
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    status: 'completed' | 'voided' | 'pending';
    payment_method: string;
    payment_ref?: string;
    created_at: string;
}

export interface CreateTransactionInput {
    items: { product_id: string; quantity: number }[];
    customer_id?: string;
    discount?: number;
    tax?: number;
    payment_method: string;
}

// Transaction API functions
export const getTransactions = async (): Promise<Transaction[]> => {
    try {
        const response = await fetchWithAuth('/api/v1/transactions');
        if (response.ok) {
            const data = await response.json();
            return data.data || [];
        }
    } catch (error) {
        console.error('Failed to fetch transactions:', error);
    }
    return [];
};

export const createTransaction = async (input: CreateTransactionInput): Promise<Transaction | null> => {
    try {
        const response = await fetchWithAuth('/api/v1/transactions', {
            method: 'POST',
            body: JSON.stringify(input),
        });
        if (response.ok) {
            const data = await response.json();
            return data.data;
        }
    } catch (error) {
        console.error('Failed to create transaction:', error);
    }
    return null;
};

export const getTransaction = async (id: string): Promise<Transaction | null> => {
    try {
        const response = await fetchWithAuth(`/api/v1/transactions/${id}`);
        if (response.ok) {
            const data = await response.json();
            return data.data;
        }
    } catch (error) {
        console.error('Failed to fetch transaction:', error);
    }
    return null;
};

// Dashboard types
export interface DashboardStats {
    today_sales: number;
    today_transactions: number;
    today_items_sold: number;
    week_sales: number;
    week_transactions: number;
    month_sales: number;
    month_transactions: number;
    total_products: number;
    low_stock_products: number;
}

export interface TopProduct {
    product_id: string;
    product_name: string;
    total_qty: number;
    total_sales: number;
}

// Dashboard API functions
export const getDashboardStats = async (): Promise<DashboardStats | null> => {
    try {
        const response = await fetchWithAuth('/api/v1/dashboard/stats');
        if (response.ok) {
            const data = await response.json();
            return data.data;
        }
    } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
    }
    return null;
};

export const getTopProducts = async (): Promise<TopProduct[]> => {
    try {
        const response = await fetchWithAuth('/api/v1/dashboard/top-products');
        if (response.ok) {
            const data = await response.json();
            return data.data || [];
        }
    } catch (error) {
        console.error('Failed to fetch top products:', error);
    }
    return [];
};

export const getRecentTransactions = async (): Promise<Transaction[]> => {
    try {
        const response = await fetchWithAuth('/api/v1/dashboard/recent-transactions');
        if (response.ok) {
            const data = await response.json();
            return data.data || [];
        }
    } catch (error) {
        console.error('Failed to fetch recent transactions:', error);
    }
    return [];
};

// Reports types
export interface SalesReport {
    start_date: string;
    end_date: string;
    total_sales: number;
    total_cost: number;
    gross_profit: number;
    total_transactions: number;
    total_items_sold: number;
    average_per_tx: number;
    daily_sales: { date: string; sales: number; transactions: number }[];
}

export interface ProductSalesReport {
    product_id: string;
    product_name: string;
    total_qty: number;
    total_sales: number;
    total_cost: number;
    profit: number;
}

// Reports API
export const getSalesReport = async (startDate?: string, endDate?: string): Promise<SalesReport | null> => {
    try {
        let url = '/api/v1/reports/sales';
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        if (params.toString()) url += '?' + params.toString();

        const response = await fetchWithAuth(url);
        if (response.ok) {
            const data = await response.json();
            return data.data;
        }
    } catch (error) {
        console.error('Failed to fetch sales report:', error);
    }
    return null;
};

export const getProductSalesReport = async (startDate?: string, endDate?: string): Promise<ProductSalesReport[]> => {
    try {
        let url = '/api/v1/reports/products';
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        if (params.toString()) url += '?' + params.toString();

        const response = await fetchWithAuth(url);
        if (response.ok) {
            const data = await response.json();
            return data.data || [];
        }
    } catch (error) {
        console.error('Failed to fetch product sales report:', error);
    }
    return [];
};

// Customer types
export interface Customer {
    id: string;
    tenant_id: string;
    name: string;
    phone: string;
    email: string;
    address: string;
    created_at: string;
}

export interface CreateCustomerInput {
    name: string;
    phone?: string;
    email?: string;
    address?: string;
}

// Customer API
export const getCustomers = async (search?: string): Promise<Customer[]> => {
    try {
        let url = '/api/v1/customers';
        if (search) url += '?search=' + encodeURIComponent(search);

        const response = await fetchWithAuth(url);
        if (response.ok) {
            const data = await response.json();
            return data.data || [];
        }
    } catch (error) {
        console.error('Failed to fetch customers:', error);
    }
    return [];
};

export const createCustomer = async (customer: CreateCustomerInput): Promise<Customer | null> => {
    try {
        const response = await fetchWithAuth('/api/v1/customers', {
            method: 'POST',
            body: JSON.stringify(customer),
        });
        if (response.ok) {
            const data = await response.json();
            return data.data;
        }
    } catch (error) {
        console.error('Failed to create customer:', error);
    }
    return null;
};

export const updateCustomer = async (id: string, customer: CreateCustomerInput): Promise<Customer | null> => {
    try {
        const response = await fetchWithAuth(`/api/v1/customers/${id}`, {
            method: 'PUT',
            body: JSON.stringify(customer),
        });
        if (response.ok) {
            const data = await response.json();
            return data.data;
        }
    } catch (error) {
        console.error('Failed to update customer:', error);
    }
    return null;
};

export const deleteCustomer = async (id: string): Promise<boolean> => {
    try {
        const response = await fetchWithAuth(`/api/v1/customers/${id}`, {
            method: 'DELETE',
        });
        return response.ok;
    } catch (error) {
        console.error('Failed to delete customer:', error);
    }
    return false;
};

// Inventory types
export interface InventoryItem {
    product_id: string;
    product_name: string;
    sku: string;
    stock_qty: number;
    price: number;
    cost: number;
    stock_value: number;
    status: 'ok' | 'low' | 'out';
}

export interface InventorySummary {
    total_products: number;
    total_stock_value: number;
    low_stock_count: number;
    out_of_stock_count: number;
}

// Inventory API
export const getInventory = async (filter?: 'all' | 'low' | 'out'): Promise<InventoryItem[]> => {
    try {
        let url = '/api/v1/inventory';
        if (filter && filter !== 'all') url += '?filter=' + filter;

        const response = await fetchWithAuth(url);
        if (response.ok) {
            const data = await response.json();
            return data.data || [];
        }
    } catch (error) {
        console.error('Failed to fetch inventory:', error);
    }
    return [];
};

export const getInventorySummary = async (): Promise<InventorySummary | null> => {
    try {
        const response = await fetchWithAuth('/api/v1/inventory/summary');
        if (response.ok) {
            const data = await response.json();
            return data.data;
        }
    } catch (error) {
        console.error('Failed to fetch inventory summary:', error);
    }
    return null;
};

export const updateStock = async (productId: string, quantity: number): Promise<boolean> => {
    try {
        const response = await fetchWithAuth(`/api/v1/inventory/${productId}/stock`, {
            method: 'PUT',
            body: JSON.stringify({ quantity }),
        });
        return response.ok;
    } catch (error) {
        console.error('Failed to update stock:', error);
    }
    return false;
};

// Payment types
export interface QRISResponse {
    qr_string: string;
    qr_image_url: string;
    expires_at: string;
    order_id: string;
    gross_amount: number;
}

export interface PaymentStatus {
    order_id: string;
    transaction_status: string;
    payment_type: string;
}

// Payment API
export const createQRIS = async (transactionId: string): Promise<QRISResponse | null> => {
    try {
        const response = await fetchWithAuth('/api/v1/payment/qris', {
            method: 'POST',
            body: JSON.stringify({ transaction_id: transactionId }),
        });
        if (response.ok) {
            const data = await response.json();
            return data.data;
        }
    } catch (error) {
        console.error('Failed to create QRIS:', error);
    }
    return null;
};

export const checkPaymentStatus = async (orderId: string): Promise<PaymentStatus | null> => {
    try {
        const response = await fetchWithAuth(`/api/v1/payment/status/${orderId}`);
        if (response.ok) {
            const data = await response.json();
            return data.data;
        }
    } catch (error) {
        console.error('Failed to check payment status:', error);
    }
    return null;
};

// Subscription types
export interface PlanInfo {
    id: string;
    name: string;
    price: number;
    max_users: number;
    max_products: number;
    max_transactions_daily: number;
    max_transactions_monthly: number;
    max_outlets: number;
    data_retention_days: number;
    features: string[];
}

export interface SubscriptionUsage {
    users: number;
    max_users: number;
    products: number;
    max_products: number;
    transactions_today: number;
    max_transactions_daily: number;
    transactions_month: number;
    max_transactions_monthly: number;
    outlets: number;
    max_outlets: number;
}

// Subscription API
export const getPlans = async (): Promise<PlanInfo[]> => {
    try {
        const response = await fetchWithAuth('/api/v1/subscription/plans');
        if (response.ok) {
            const data = await response.json();
            return data.data || [];
        }
    } catch (error) {
        console.error('Failed to fetch plans:', error);
    }
    return [];
};

export const getSubscription = async (): Promise<{ subscription: any; plan: PlanInfo } | null> => {
    try {
        const response = await fetchWithAuth('/api/v1/subscription');
        if (response.ok) {
            const data = await response.json();
            return data.data;
        }
    } catch (error) {
        console.error('Failed to fetch subscription:', error);
    }
    return null;
};

export const getUsage = async (): Promise<SubscriptionUsage | null> => {
    try {
        const response = await fetchWithAuth('/api/v1/subscription/usage');
        if (response.ok) {
            const data = await response.json();
            return data.data;
        }
    } catch (error) {
        console.error('Failed to fetch usage:', error);
    }
    return null;
};

export const upgradePlan = async (plan: string): Promise<boolean> => {
    try {
        const response = await fetchWithAuth('/api/v1/subscription/upgrade', {
            method: 'POST',
            body: JSON.stringify({ plan }),
        });
        return response.ok;
    } catch (error) {
        console.error('Failed to upgrade plan:', error);
    }
    return false;
};

// Material types
export interface RawMaterial {
    id: string;
    name: string;
    unit: string;
    unit_price: number;
    stock_qty: number;
    supplier: string;
    created_at: string;
}

export interface ProductMaterial {
    id: string;
    product_id: string;
    material_id: string;
    quantity_used: number;
    material: RawMaterial;
}

export interface CreateMaterialInput {
    name: string;
    unit: string;
    unit_price: number;
    stock_qty: number;
    supplier: string;
}

// Material API
export const getMaterials = async (): Promise<RawMaterial[]> => {
    try {
        const response = await fetchWithAuth('/api/v1/materials');
        if (response.ok) {
            const data = await response.json();
            return data.data || [];
        }
    } catch (error) {
        console.error('Failed to fetch materials:', error);
    }
    return [];
};

export const createMaterial = async (input: CreateMaterialInput): Promise<RawMaterial | null> => {
    try {
        const response = await fetchWithAuth('/api/v1/materials', {
            method: 'POST',
            body: JSON.stringify(input),
        });
        if (response.ok) {
            const data = await response.json();
            return data.data;
        }
    } catch (error) {
        console.error('Failed to create material:', error);
    }
    return null;
};

export const updateMaterial = async (id: string, input: CreateMaterialInput): Promise<RawMaterial | null> => {
    try {
        const response = await fetchWithAuth(`/api/v1/materials/${id}`, {
            method: 'PUT',
            body: JSON.stringify(input),
        });
        if (response.ok) {
            const data = await response.json();
            return data.data;
        }
    } catch (error) {
        console.error('Failed to update material:', error);
    }
    return null;
};

export const deleteMaterial = async (id: string): Promise<boolean> => {
    try {
        const response = await fetchWithAuth(`/api/v1/materials/${id}`, {
            method: 'DELETE',
        });
        return response.ok;
    } catch (error) {
        console.error('Failed to delete material:', error);
    }
    return false;
};

export const updateMaterialStock = async (id: string, adjustment: number, reason?: string): Promise<RawMaterial | null> => {
    try {
        const response = await fetchWithAuth(`/api/v1/materials/${id}/stock`, {
            method: 'PUT',
            body: JSON.stringify({ adjustment, reason }),
        });
        if (response.ok) {
            const data = await response.json();
            return data.data;
        }
    } catch (error) {
        console.error('Failed to update stock:', error);
    }
    return null;
};

export const getMaterialAlerts = async (): Promise<{ low_stock: RawMaterial[]; out_of_stock: RawMaterial[] }> => {
    try {
        const response = await fetchWithAuth('/api/v1/materials/alerts');
        if (response.ok) {
            const data = await response.json();
            return data.data;
        }
    } catch (error) {
        console.error('Failed to fetch alerts:', error);
    }
    return { low_stock: [], out_of_stock: [] };
};

// Product-Material linking
export const getProductMaterials = async (productId: string): Promise<{ materials: ProductMaterial[]; material_cost: number }> => {
    try {
        const response = await fetchWithAuth(`/api/v1/product-materials/${productId}`);
        if (response.ok) {
            const data = await response.json();
            return { materials: data.data || [], material_cost: data.material_cost || 0 };
        }
    } catch (error) {
        console.error('Failed to fetch product materials:', error);
    }
    return { materials: [], material_cost: 0 };
};

export const linkMaterial = async (productId: string, materialId: string, quantityUsed: number): Promise<boolean> => {
    try {
        const response = await fetchWithAuth(`/api/v1/product-materials`, {
            method: 'POST',
            body: JSON.stringify({ product_id: productId, material_id: materialId, quantity_used: quantityUsed }),
        });
        return response.ok;
    } catch (error) {
        console.error('Failed to link material:', error);
    }
    return false;
};

export const unlinkMaterial = async (productId: string, materialId: string): Promise<boolean> => {
    try {
        const response = await fetchWithAuth(`/api/v1/product-materials/${productId}/${materialId}`, {
            method: 'DELETE',
        });
        return response.ok;
    } catch (error) {
        console.error('Failed to unlink material:', error);
    }
    return false;
};

export const calculateProductCost = async (productId: string): Promise<{ total_cost: number; breakdown: any[] }> => {
    try {
        const response = await fetchWithAuth(`/api/v1/product-materials/${productId}/cost`);
        if (response.ok) {
            const data = await response.json();
            return { total_cost: data.total_cost || 0, breakdown: data.breakdown || [] };
        }
    } catch (error) {
        console.error('Failed to calculate cost:', error);
    }
    return { total_cost: 0, breakdown: [] };
};

