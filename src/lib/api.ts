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
