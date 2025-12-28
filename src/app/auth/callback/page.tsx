'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { storeTokens } from '@/lib/api';

export default function AuthCallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Memproses login...');

    useEffect(() => {
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');
        const isNewUser = searchParams.get('is_new_user') === 'true';

        if (accessToken && refreshToken) {
            // Store tokens
            storeTokens({
                access_token: accessToken,
                refresh_token: refreshToken,
            });

            setStatus('success');

            if (isNewUser) {
                setMessage('Akun berhasil dibuat! Mengalihkan ke pengaturan...');
                setTimeout(() => {
                    router.push('/settings/business');
                }, 1500);
            } else {
                setMessage('Login berhasil! Mengalihkan ke dashboard...');
                setTimeout(() => {
                    router.push('/dashboard');
                }, 1000);
            }
        } else {
            setStatus('error');
            setMessage('Login gagal. Silakan coba lagi.');
            setTimeout(() => {
                router.push('/login');
            }, 2000);
        }
    }, [searchParams, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600">
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
        </div>
    );
}
