'use client';

import { useEffect, useState, useRef } from 'react';
import { VASubscriptionResponse, checkVAPaymentStatus } from '@/lib/api';

interface VAPaymentModalProps {
    vaData: VASubscriptionResponse;
    onSuccess: () => void;
    onClose: () => void;
}

export default function VAPaymentModal({ vaData, onSuccess, onClose }: VAPaymentModalProps) {
    const [status, setStatus] = useState<'pending' | 'paid' | 'expired'>('pending');
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [copied, setCopied] = useState(false);
    const pollingRef = useRef<NodeJS.Timeout | null>(null);
    const countdownRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Calculate time left
        const expiresAt = new Date(vaData.expires_at).getTime();
        const updateCountdown = () => {
            const now = Date.now();
            const diff = Math.max(0, Math.floor((expiresAt - now) / 1000));
            setTimeLeft(diff);
            if (diff <= 0) {
                setStatus('expired');
                stopPolling();
            }
        };
        updateCountdown();
        countdownRef.current = setInterval(updateCountdown, 1000);

        // Start polling for payment status (every 10 seconds for VA)
        pollingRef.current = setInterval(async () => {
            const result = await checkVAPaymentStatus(vaData.reference_no);
            if (result?.status === 'paid') {
                setStatus('paid');
                stopPolling();
                setTimeout(() => onSuccess(), 1500);
            } else if (result?.status === 'expired') {
                setStatus('expired');
                stopPolling();
            }
        }, 10000);

        return () => stopPolling();
    }, [vaData, onSuccess]);

    const stopPolling = () => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
        if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
        }
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) {
            return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const getPeriodLabel = (period: string) => {
        const labels: Record<string, string> = {
            monthly: 'Bulanan',
            quarterly: '3 Bulan',
            yearly: 'Tahunan',
        };
        return labels[period] || period;
    };

    const getPlanLabel = (plan: string) => {
        const labels: Record<string, string> = {
            pemula: 'Pemula',
            bisnis: 'Bisnis',
            enterprise: 'Enterprise',
        };
        return labels[plan] || plan;
    };

    const copyToClipboard = (text: string) => {
        // Remove leading/trailing spaces from VA number for clipboard
        const cleanText = text.trim();
        navigator.clipboard.writeText(cleanText).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const getBankColor = () => {
        const colors: Record<string, string> = {
            mandiri: 'from-blue-800 to-blue-900',
            bni: 'from-orange-500 to-orange-600',
            bri: 'from-blue-600 to-blue-700',
        };
        return colors[vaData.bank_code] || 'from-purple-600 to-purple-700';
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
                {/* Header */}
                <div className={`bg-gradient-to-r ${getBankColor()} px-6 py-4 text-white`}>
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold">Transfer {vaData.bank_name}</h3>
                        {status === 'pending' && (
                            <button onClick={onClose} className="text-white/70 hover:text-white text-xl">
                                ✕
                            </button>
                        )}
                    </div>
                    <p className="text-white/70 text-sm mt-1">
                        Warungin {getPlanLabel(vaData.plan)} — {getPeriodLabel(vaData.billing_period)}
                    </p>
                </div>

                <div className="p-6">
                    {status === 'paid' ? (
                        /* Success State */
                        <div className="text-center py-8">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h4 className="text-xl font-bold text-gray-900 mb-2">Pembayaran Berhasil! 🎉</h4>
                            <p className="text-gray-600">Paket Anda telah diaktifkan.</p>
                        </div>
                    ) : status === 'expired' ? (
                        /* Expired State */
                        <div className="text-center py-8">
                            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h4 className="text-xl font-bold text-gray-900 mb-2">Virtual Account Kedaluwarsa</h4>
                            <p className="text-gray-600 mb-4">Silakan buat pembayaran baru.</p>
                            <button
                                onClick={onClose}
                                className="px-6 py-2 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700"
                            >
                                Coba Lagi
                            </button>
                        </div>
                    ) : (
                        /* Pending State — Show VA Details */
                        <>
                            {/* VA Number */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-500 mb-2">
                                    Nomor Virtual Account
                                </label>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-gray-50 border-2 border-gray-200 rounded-xl p-3">
                                        <p className="text-xl font-mono font-bold text-center tracking-wider text-gray-900">
                                            {vaData.va_number.trim()}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard(vaData.va_number)}
                                        className={`px-4 py-3 rounded-xl font-medium text-sm flex items-center gap-1.5 transition-colors ${copied
                                            ? 'bg-green-100 text-green-700 border-2 border-green-200'
                                            : 'bg-purple-600 text-white hover:bg-purple-700 border-2 border-purple-600'
                                            }`}
                                    >
                                        {copied ? (
                                            <>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                Tersalin
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                                Salin
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Timer */}
                            <div className="text-center mb-4">
                                <span className={`text-sm font-medium ${timeLeft < 3600 ? 'text-red-600' : 'text-gray-500'}`}>
                                    Berlaku {formatTime(timeLeft)}
                                </span>
                            </div>

                            {/* Price Breakdown */}
                            <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-1.5">
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Harga Paket</span>
                                    <span>{formatCurrency(vaData.base_amount)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Biaya Admin</span>
                                    <span>{formatCurrency(vaData.admin_fee)}</span>
                                </div>
                                <div className="border-t border-gray-200 pt-1.5">
                                    <div className="flex justify-between font-bold text-gray-900">
                                        <span>Total</span>
                                        <span className="text-purple-600">{formatCurrency(vaData.amount)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Instructions */}
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4">
                                <p className="text-sm text-blue-800 font-medium mb-1">Cara Bayar:</p>
                                <ol className="text-sm text-blue-700 space-y-0.5 list-decimal pl-4">
                                    {vaData.instructions.map((instruction, index) => (
                                        <li key={index}>{instruction}</li>
                                    ))}
                                </ol>
                            </div>

                            {/* Polling indicator */}
                            <div className="flex items-center justify-center gap-2 text-gray-400 text-xs">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                Menunggu pembayaran...
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
