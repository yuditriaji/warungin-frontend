'use client';

import React, { Suspense, useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { storeTokens } from '@/lib/api';

function AuthCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Memproses login...');
    const processedRef = useRef(false);

    useEffect(() => {
        // Prevent double processing (React StrictMode or re-renders after URL clear)
        if (processedRef.current) return;

        // Get tokens from URL query parameters (passed by backend OAuth callback)
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');
        const isNewUser = searchParams.get('is_new_user') === 'true';

        // Also check localStorage in case URL was already cleared but tokens were stored
        const storedToken = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

        if (accessToken && refreshToken) {
            processedRef.current = true;

            // Store tokens in localStorage for API calls
            storeTokens({
                access_token: accessToken,
                refresh_token: refreshToken,
            });

            // Clear tokens from URL to prevent leakage in browser history
            window.history.replaceState({}, document.title, '/auth/callback');

            setStatus('success');

            if (isNewUser) {
                setMessage('Akun berhasil dibuat! Mengalihkan ke profil bisnis...');
                setTimeout(() => {
                    router.push('/onboarding');
                }, 1500);
            } else {
                setMessage('Login berhasil! Mengalihkan ke dashboard...');
                setTimeout(() => {
                    router.push('/dashboard');
                }, 1000);
            }
        } else if (storedToken) {
            // Tokens already in localStorage (URL was cleared), redirect to dashboard
            processedRef.current = true;
            setStatus('success');
            setMessage('Login berhasil! Mengalihkan ke dashboard...');
            setTimeout(() => {
                router.push('/dashboard');
            }, 500);
        } else {
            // No tokens found anywhere
            processedRef.current = true;
            setStatus('error');
            setMessage('Login gagal. Silakan coba lagi.');
            setTimeout(() => {
                router.push('/login');
            }, 2000);
        }
    }, [searchParams, router]);

    return (
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
            {status === 'loading' && (
                <>
                    <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">{message}</p>
                </>
            )}

            {status === 'success' && (
                <>
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <p className="text-gray-800 font-medium">{message}</p>
                </>
            )}

            {status === 'error' && (
                <>
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <p className="text-gray-800 font-medium">{message}</p>
                </>
            )}
        </div>
    );
}

function LoadingFallback() {
    return (
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
            <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Memproses login...</p>
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600">
            <Suspense fallback={<LoadingFallback />}>
                <AuthCallbackContent />
            </Suspense>
        </div>
    );
}
