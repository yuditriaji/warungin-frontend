'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getGoogleAuthUrl, isAuthenticated, loginWithEmail } from '@/lib/api';

export default function LoginPage() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    // Email login form state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // PWA Install Prompt state
    const [installPrompt, setInstallPrompt] = useState<any>(null);

    useEffect(() => {
        setMounted(true);

        // Helper to set cookie (30 days, shared across subdomains)
        const setCookie = (name: string, value: string) => {
            const expires = new Date();
            expires.setTime(expires.getTime() + (30 * 24 * 60 * 60 * 1000));
            document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; domain=.warungin.com; SameSite=Lax`;
        };

        // Capture referral code from URL and save to cookie
        const urlParams = new URLSearchParams(window.location.search);
        const refCode = urlParams.get('ref');
        if (refCode) {
            setCookie('referral_code', refCode);
        }

        // If already authenticated, redirect to dashboard
        if (isAuthenticated()) {
            router.push('/dashboard');
        }

        // Listen for beforeinstallprompt event
        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setInstallPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, [router]);

    const handleGoogleLogin = () => {
        window.location.href = getGoogleAuthUrl();
    };

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await loginWithEmail(email, password);
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Login gagal. Periksa email dan password Anda.');
        } finally {
            setLoading(false);
        }
    };

    const handleInstallPwa = async () => {
        if (!installPrompt) return;
        installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        if (outcome === 'accepted') {
            setInstallPrompt(null);
        }
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-white">
            {/* Left Side - Hero/Marketing (Hidden on Mobile, Visible on Desktop) */}
            <div className="hidden lg:flex lg:w-1/2 bg-purple-600 relative overflow-hidden items-center justify-center p-12">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]"></div>

                {/* Decorative Circles */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-purple-500 opacity-30 mix-blend-multiply blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-indigo-600 opacity-30 mix-blend-multiply blur-3xl"></div>

                <div className="relative z-10 text-center text-white max-w-lg">
                    <div className="mb-8 flex justify-center">
                        <div className="w-24 h-24 bg-white/10 backdrop-blur-lg rounded-2xl flex items-center justify-center shadow-inner border border-white/20">
                            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                        </div>
                    </div>
                    <h2 className="text-4xl font-bold mb-6">Kelola Bisnis Jadi Lebih Mudah</h2>
                    <p className="text-lg text-purple-100 leading-relaxed">
                        Satu dashboard untuk semua kebutuhan usaha Anda. Pantau penjualan, stok, dan laporan keuangan secara real-time.
                    </p>
                    {/* Carousel Dots Placeholder */}
                    <div className="flex gap-2 justify-center mt-8">
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                        <div className="w-2 h-2 rounded-full bg-white/40"></div>
                        <div className="w-2 h-2 rounded-full bg-white/40"></div>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="lg:w-1/2 w-full flex items-center justify-center p-6 sm:p-12 relative">
                <div className="w-full max-w-md space-y-8">

                    {/* Header with PWA Button for Mobile */}
                    <div className="text-center">
                        {/* Mobile PWA Install Button */}
                        {installPrompt && (
                            <div className="lg:hidden mb-8">
                                <button
                                    onClick={handleInstallPwa}
                                    className="w-full flex items-center justify-center gap-2 bg-purple-50 text-purple-700 px-4 py-3 rounded-xl border border-purple-100 shadow-sm hover:bg-purple-100 transition-all"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    <span className="font-semibold text-sm">Install Aplikasi Warungin</span>
                                </button>
                            </div>
                        )}

                        <h1 className="text-3xl font-bold text-purple-600 mb-2">Warungin</h1>
                        <h2 className="text-2xl font-bold text-gray-900">Masuk ke Dashboard</h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Selamat datang kembali! Silakan masuk ke akun Anda.
                        </p>
                    </div>

                    <div className="space-y-6">
                        {/* Google Auth Button */}
                        <button
                            onClick={handleGoogleLogin}
                            className="w-full flex items-center justify-center gap-3 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 font-medium py-3 px-4 rounded-xl transition-all shadow-sm group"
                        >
                            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Masuk dengan Google (Owner)
                        </button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">atau login staff</span>
                            </div>
                        </div>

                        {/* Email Login Form */}
                        <form onSubmit={handleEmailLogin} className="space-y-5">
                            {error && (
                                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 flex items-start gap-2">
                                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>{error}</span>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Staff</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors outline-none"
                                    placeholder="nama@warungin.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors outline-none"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div className="flex justify-end mt-2">
                                    <button type="button" className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                                        Lupa Password?
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-purple-600 text-white font-bold py-3.5 px-4 rounded-xl hover:bg-purple-700 focus:ring-4 focus:ring-purple-200 transition-all shadow-lg shadow-purple-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Sedang Memproses...' : 'Masuk sekarang'}
                            </button>
                        </form>
                    </div>

                    <p className="text-center text-sm text-gray-500">
                        Belum punya akun?{' '}
                        <button onClick={handleGoogleLogin} className="text-purple-600 font-semibold hover:text-purple-700 hover:underline">
                            Daftar Gratis
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}

