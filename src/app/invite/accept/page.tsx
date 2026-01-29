'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { validateInvite, acceptInvite, InviteValidation } from '@/lib/api';

function AcceptInviteContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [loading, setLoading] = useState(true);
    const [validating, setValidating] = useState(false);
    const [invite, setInvite] = useState<InviteValidation | null>(null);
    const [error, setError] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (token) {
            validateToken();
        } else {
            setError('Token undangan tidak ditemukan');
            setLoading(false);
        }
    }, [token]);

    const validateToken = async () => {
        setValidating(true);
        const data = await validateInvite(token!);
        if (data) {
            setInvite(data);
        } else {
            setError('Undangan tidak valid atau sudah kadaluarsa');
        }
        setLoading(false);
        setValidating(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('Password minimal 6 karakter');
            return;
        }

        if (password !== confirmPassword) {
            setError('Password tidak sama');
            return;
        }

        setSubmitting(true);
        const success = await acceptInvite(token!, password);
        if (success) {
            setSuccess(true);
            // Redirect to login after 3 seconds
            setTimeout(() => {
                router.push('/login');
            }, 3000);
        } else {
            setError('Gagal mengaktifkan akun. Silakan coba lagi.');
        }
        setSubmitting(false);
    };

    const getRoleName = (role: string) => {
        switch (role) {
            case 'manager':
                return 'Manager';
            case 'cashier':
                return 'Kasir';
            default:
                return role;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Memvalidasi undangan...</p>
                </div>
            </div>
        );
    }

    if (error && !invite) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Undangan Tidak Valid</h1>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <a
                        href="/login"
                        className="inline-block px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700"
                    >
                        Ke Halaman Login
                    </a>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Akun Berhasil Dibuat!</h1>
                    <p className="text-gray-600 mb-6">
                        Selamat datang di {invite?.tenant_name}! Anda akan dialihkan ke halaman login...
                    </p>
                    <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Selamat Datang!</h1>
                    <p className="text-gray-600">Anda diundang untuk bergabung</p>
                </div>

                <div className="bg-purple-50 rounded-xl p-4 mb-6">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-gray-500">Nama:</span>
                        <span className="font-medium text-gray-900">{invite?.name}</span>
                        <span className="text-gray-500">Email:</span>
                        <span className="font-medium text-gray-900">{invite?.email}</span>
                        <span className="text-gray-500">Peran:</span>
                        <span className="font-medium text-gray-900">{getRoleName(invite?.role || '')}</span>
                        <span className="text-gray-500">Bisnis:</span>
                        <span className="font-medium text-gray-900">{invite?.tenant_name}</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <p className="text-sm text-gray-600 mb-4">
                        Buat password untuk mengaktifkan akun Anda:
                    </p>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Minimal 6 karakter"
                            required
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Konfirmasi Password
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Ulangi password"
                            required
                        />
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 rounded-xl text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3 bg-purple-600 text-white rounded-xl font-semibold disabled:opacity-50 hover:bg-purple-700 transition-colors"
                    >
                        {submitting ? 'Mengaktifkan...' : 'Aktifkan Akun'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default function AcceptInvitePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Memuat...</p>
                </div>
            </div>
        }>
            <AcceptInviteContent />
        </Suspense>
    );
}
