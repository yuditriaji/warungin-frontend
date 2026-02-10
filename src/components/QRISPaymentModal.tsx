'use client';

import { useEffect, useState, useRef } from 'react';
import { QRISSubscriptionResponse, checkQRISPaymentStatus } from '@/lib/api';

interface QRISPaymentModalProps {
    qrisData: QRISSubscriptionResponse;
    onSuccess: () => void;
    onClose: () => void;
}

export default function QRISPaymentModal({ qrisData, onSuccess, onClose }: QRISPaymentModalProps) {
    const [status, setStatus] = useState<'pending' | 'paid' | 'expired'>('pending');
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const pollingRef = useRef<NodeJS.Timeout | null>(null);
    const countdownRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Calculate time left
        const expiresAt = new Date(qrisData.expires_at).getTime();
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

        // Start polling for payment status
        pollingRef.current = setInterval(async () => {
            const result = await checkQRISPaymentStatus(qrisData.reference_no);
            if (result?.status === 'paid') {
                setStatus('paid');
                stopPolling();
                setTimeout(() => onSuccess(), 1500);
            } else if (result?.status === 'expired') {
                setStatus('expired');
                stopPolling();
            }
        }, 5000);

        return () => stopPolling();
    }, [qrisData, onSuccess]);

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
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
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

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 text-white">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold">Pembayaran QRIS</h3>
                        {status === 'pending' && (
                            <button onClick={onClose} className="text-white/70 hover:text-white text-xl">
                                ✕
                            </button>
                        )}
                    </div>
                    <p className="text-purple-200 text-sm mt-1">
                        Warungin {getPlanLabel(qrisData.plan)} — {getPeriodLabel(qrisData.billing_period)}
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
                            <h4 className="text-xl font-bold text-gray-900 mb-2">QRIS Kedaluwarsa</h4>
                            <p className="text-gray-600 mb-4">Silakan buat pembayaran baru.</p>
                            <button
                                onClick={onClose}
                                className="px-6 py-2 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700"
                            >
                                Coba Lagi
                            </button>
                        </div>
                    ) : (
                        /* Pending State — Show QR */
                        <>
                            {/* QR Code */}
                            <div className="text-center mb-4">
                                <div className="inline-block bg-white border-2 border-gray-100 rounded-xl p-4 shadow-sm">
                                    {qrisData.qr_image_url ? (
                                        <img
                                            src={qrisData.qr_image_url}
                                            alt="QRIS Code"
                                            className="w-56 h-56 object-contain"
                                        />
                                    ) : qrisData.qr_content ? (
                                        <div className="w-56 h-56 flex items-center justify-center bg-gray-50 rounded-lg">
                                            <p className="text-xs text-gray-400 text-center px-4 break-all">
                                                {qrisData.qr_content}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="w-56 h-56 flex items-center justify-center">
                                            <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Timer */}
                            <div className="text-center mb-4">
                                <span className={`text-sm font-medium ${timeLeft < 120 ? 'text-red-600' : 'text-gray-500'}`}>
                                    Berlaku {formatTime(timeLeft)}
                                </span>
                            </div>

                            {/* Price Breakdown */}
                            <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-1.5">
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Harga Paket</span>
                                    <span>{formatCurrency(qrisData.base_amount)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>PPN 11%</span>
                                    <span>{formatCurrency(qrisData.ppn_amount)}</span>
                                </div>
                                <div className="border-t border-gray-200 pt-1.5">
                                    <div className="flex justify-between font-bold text-gray-900">
                                        <span>Total</span>
                                        <span className="text-purple-600">{formatCurrency(qrisData.amount)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Instructions */}
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4">
                                <p className="text-sm text-blue-800 font-medium mb-1">Cara Bayar:</p>
                                <ol className="text-sm text-blue-700 space-y-0.5 list-decimal pl-4">
                                    <li>Buka aplikasi e-wallet / mobile banking</li>
                                    <li>Pilih menu &quot;Scan QR&quot; atau &quot;QRIS&quot;</li>
                                    <li>Scan kode QR di atas</li>
                                    <li>Konfirmasi pembayaran</li>
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
