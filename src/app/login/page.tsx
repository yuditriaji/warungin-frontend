'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getGoogleAuthUrl, isAuthenticated } from '@/lib/api';

export default function LoginPage() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // If already authenticated, redirect to dashboard
        if (isAuthenticated()) {
            router.push('/dashboard');
        }
    }, [router]);

    const handleGoogleLogin = () => {
        window.location.href = getGoogleAuthUrl();
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600">
            <div className="w-full max-w-md p-8 mx-4">
                {/* Logo & Title */}
                <div className="text-center mb-8">
                    <img
                        src="/Horizontal_Logo-nobg.png"
                        alt="Warungin"
                        className="h-16 mx-auto mb-4"
                    />
                    <p className="text-purple-200">Aplikasi Kasir untuk UMKM</p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    <h2 className="text-2xl font-semibold text-gray-800 text-center mb-6">
                        Masuk ke Akun Anda
                    </h2>

                    {/* Google Login Button */}
                    <button
                        onClick={handleGoogleLogin}
                        className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 rounded-xl py-4 px-6 text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                        <svg className="w-6 h-6" viewBox="0 0 24 24">
                            <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        Masuk dengan Google
                    </button>

                    {/* Divider */}
                    <div className="flex items-center my-6">
                        <div className="flex-1 border-t border-gray-200"></div>
                        <span className="px-4 text-sm text-gray-500">atau</span>
                        <div className="flex-1 border-t border-gray-200"></div>
                    </div>

                    {/* Email Login (disabled for now) */}
                    <div className="space-y-4 opacity-50">
                        <input
                            type="email"
                            placeholder="Email"
                            disabled
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            disabled
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        <button
                            disabled
                            className="w-full bg-purple-600 text-white py-3 rounded-xl font-medium cursor-not-allowed"
                        >
                            Masuk
                        </button>
                    </div>

                    <p className="text-center text-sm text-gray-500 mt-4">
                        Gunakan Google untuk login yang lebih mudah
                    </p>
                </div>

                {/* Footer */}
                <p className="text-center text-purple-200 text-sm mt-6">
                    Belum punya akun?{' '}
                    <span className="text-white font-medium cursor-pointer hover:underline">
                        Daftar dengan Google
                    </span>
                </p>
            </div>
        </div>
    );
}
